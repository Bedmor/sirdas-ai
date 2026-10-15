import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPayTrHash } from "@/lib/payment/paytr";
import { verifyIyzicoWebhook } from "@/lib/payment/iyzico";

export const dynamic = "force-dynamic";

/**
 * PayTR & iyzico IPN Payment Callback Webhook
 * Handles asynchronous payment confirmation notifications
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      body = await request.json().catch(() => ({}));
    }

    // Identify provider
    const isPayTR = "merchant_oid" in body && "status" in body;
    const isIyzico = "paymentId" in body || "token" in body;

    if (isPayTR) {
      const verification = verifyPayTrHash({
        merchant_oid: String(body.merchant_oid || ""),
        status: String(body.status || ""),
        total_amount: String(body.total_amount || ""),
        hash: body.hash ? String(body.hash) : undefined,
      });

      if (!verification.isValid) {
        console.warn("PayTR verification failed:", verification.reason);
        return new NextResponse(`PAYTR notification failed: ${verification.reason}`, {
          status: 400,
        });
      }

      const merchantOid = String(body.merchant_oid || "");
      const donationStatus = verification.status;

      try {
        await prisma.donation.updateMany({
          where: {
            OR: [
              { id: merchantOid },
              { providerTransactionId: merchantOid },
            ],
          },
          data: {
            status: donationStatus,
            providerTransactionId: merchantOid,
          },
        });
      } catch (dbError) {
        console.warn("DB update failed for donation, continuing callback:", dbError);
      }

      // PayTR protocol expects "OK" string response
      return new NextResponse("OK", { status: 200 });
    }

    if (isIyzico) {
      const verification = verifyIyzicoWebhook(body);
      if (!verification.isValid) {
        return new NextResponse("iyzico notification failed: missing identifier", {
          status: 400,
        });
      }

      const paymentId = verification.paymentId;
      const donationStatus = verification.status;

      try {
        await prisma.donation.updateMany({
          where: {
            OR: [
              { providerTransactionId: paymentId },
              { id: String(body.basketId || "") },
            ],
          },
          data: {
            status: donationStatus,
            providerTransactionId: paymentId,
          },
        });
      } catch (dbError) {
        console.warn("DB update failed for iyzico donation:", dbError);
      }

      return NextResponse.json({ status: "success", paymentId });
    }

    // Generic webhook test or manual IPN
    const { donationId, status, transactionId } = body;
    if (donationId && status) {
      const updatedStatus = String(status).toUpperCase() === "SUCCESS" ? "SUCCESS" : "FAILED";
      try {
        await prisma.donation.update({
          where: { id: String(donationId) },
          data: {
            status: updatedStatus,
            providerTransactionId: String(transactionId || `tx_${Date.now()}`),
          },
        });
      } catch (e) {
        console.warn("Generic IPN update notice:", e);
      }
      return NextResponse.json({ success: true, status: updatedStatus });
    }

    return NextResponse.json({ success: true, message: "Webhook acknowledged" });
  } catch (error) {
    console.error("Payment webhook handler error:", error);
    return NextResponse.json(
      { success: false, error: "Internal webhook error" },
      { status: 500 }
    );
  }
}
