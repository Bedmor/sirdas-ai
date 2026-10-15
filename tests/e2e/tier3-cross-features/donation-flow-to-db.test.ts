import crypto from "crypto";
import { describe, it, expect } from "../harness";
import { createMockRequest } from "../harness/utils";
import { POST as checkoutHandler } from "@/app/api/donation/checkout/route";
import { POST as webhookHandler } from "@/app/api/webhook/payment/route";
import { GET as statsHandler } from "@/app/api/admin/stats/route";

describe("Tier 3: Cross-Feature Integration — Donation Flow to DB & Live Stats", { tier: 3, feature: "Donation Flow -> DB" }, () => {
  it("T3-XDON.1: Pairwise flow from checkout initiation to IPN webhook success confirmation", async () => {
    // 1. User submits donation of 250 TL
    const checkoutReq = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: 250,
        donorName: "Vakıf Gönüllüsü",
        donorPhone: "05559876543",
        paymentProvider: "PAYTR",
        isAnonymous: false,
      },
    });

    const checkoutRes = await checkoutHandler(checkoutReq);
    expect(checkoutRes.status).toBe(200);

    const checkoutData = await checkoutRes.json();
    expect(checkoutData.success).toBe(true);
    expect(checkoutData.amount).toBe(250);
    const txId = checkoutData.transactionId;
    expect(txId).toBeDefined();

    // 2. PayTR sends IPN callback notification for the created transaction
    const { getPayTrConfig } = await import("@/lib/payment/paytr");
    const { merchantKey, merchantSalt } = getPayTrConfig();
    const totalAmountKurus = "25000";
    let hash: string | undefined = undefined;
    if (merchantKey && merchantSalt) {
      hash = crypto
        .createHmac("sha256", merchantKey)
        .update(`${txId}${merchantSalt}success${totalAmountKurus}`)
        .digest("base64");
    }

    const webhookReq = createMockRequest("http://localhost:3000/api/webhook/payment", {
      method: "POST",
      isFormData: true,
      body: {
        merchant_oid: txId,
        status: "success",
        total_amount: totalAmountKurus,
        ...(hash ? { hash } : {}),
      },
    });

    const webhookRes = await webhookHandler(webhookReq);
    expect(webhookRes.status).toBe(200);
    const webhookText = await webhookRes.text();
    expect(webhookText).toBe("OK");
  });

  it("T3-XDON.2: Pairwise integration between successful donation and Admin Pool KPIs", async () => {
    // Admin stats endpoint reflects pool balance and sponsored messages calculations
    const statsRes = await statsHandler();
    expect(statsRes.status).toBe(200);

    const statsData = await statsRes.json();
    expect(statsData.success).toBe(true);
    const poolBalance = statsData.data.donations.poolBalance;
    const sponsoredCount = statsData.data.donations.sponsoredMessagesCount;

    expect(poolBalance).toBeGreaterThan(0);
    expect(sponsoredCount).toBeGreaterThan(0);
    // Verified ratio: each TL infak sponsors multiple messages
    expect(sponsoredCount).toBeGreaterThan(poolBalance);
  });
});
