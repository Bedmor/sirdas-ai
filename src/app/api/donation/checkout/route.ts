import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { createPayTrToken } from "@/lib/payment/paytr";
import { createIyzicoCheckoutSession } from "@/lib/payment/iyzico";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, donorName, donorPhone, paymentProvider = "PAYTR", isAnonymous } = body;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir bağış tutarı giriniz." },
        { status: 400 }
      );
    }

    const effectiveName = isAnonymous ? "Anonim İnfak Sahibi" : donorName || "Gönüllü İnfak Sahibi";
    const transactionId = `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    let donationId: string = crypto.randomUUID();

    try {
      const created = await prisma.donation.create({
        data: {
          id: donationId,
          amount: numericAmount,
          currency: "TRY",
          donorName: effectiveName,
          donorPhone: donorPhone || null,
          paymentProvider: paymentProvider.toUpperCase(),
          providerTransactionId: transactionId,
          status: "PENDING",
        },
      });
      donationId = created.id;
    } catch (dbErr) {
      console.warn("DB donation creation fallback (offline DB):", dbErr);
    }

    const returnUrl = `/askida-sirdas/basarili?tx=${transactionId}&amount=${numericAmount}&name=${encodeURIComponent(
      effectiveName
    )}`;
    const failureUrl = `/askida-sirdas/hata?tx=${transactionId}&amount=${numericAmount}`;

    let checkoutToken = `sim_token_${transactionId}`;
    let paymentUrl: string | undefined = undefined;

    if (paymentProvider.toUpperCase() === "PAYTR") {
      const payTrResult = await createPayTrToken({
        merchantOid: transactionId,
        email: "infak@sirdas.ai",
        paymentAmount: numericAmount,
        userName: effectiveName,
        userPhone: donorPhone || "05550000000",
        merchantOkUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}${returnUrl}`,
        merchantFailUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}${failureUrl}`,
      });
      if (payTrResult.token) {
        checkoutToken = payTrResult.token;
        paymentUrl = payTrResult.iframeUrl;
      }
    } else if (paymentProvider.toUpperCase() === "IYZICO") {
      const iyzicoResult = await createIyzicoCheckoutSession({
        conversationId: transactionId,
        price: numericAmount,
        paidPrice: numericAmount,
        buyerName: effectiveName,
        buyerGsmNumber: donorPhone,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhook/payment`,
      });
      if (iyzicoResult.token) {
        checkoutToken = iyzicoResult.token;
        paymentUrl = iyzicoResult.paymentPageUrl;
      }
    }

    return NextResponse.json({
      success: true,
      donationId,
      transactionId,
      amount: numericAmount,
      currency: "TRY",
      provider: paymentProvider.toUpperCase(),
      checkoutToken,
      paymentUrl,
      redirectUrl: returnUrl,
      failureUrl: failureUrl,
    });
  } catch (error) {
    console.error("Donation checkout init error:", error);
    return NextResponse.json(
      { success: false, error: "Ödeme başlatılamadı." },
      { status: 500 }
    );
  }
}
