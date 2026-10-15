import fs from "fs";
import path from "path";
import crypto from "crypto";
import { describe, it, expect } from "../harness";
import { createMockRequest } from "../harness/utils";
import { POST as checkoutHandler } from "@/app/api/donation/checkout/route";
import { POST as webhookHandler } from "@/app/api/webhook/payment/route";
import { GET as statsHandler } from "@/app/api/admin/stats/route";

describe("Tier 4: Real-World Scenario — End-to-End Donor Infak Journey", { tier: 4, feature: "User Infak Journey" }, () => {
  const rootDir = process.cwd();

  it("T4-SCN.1: Complete user infak journey: Selection -> Checkout -> IPN -> Pool Update", async () => {
    // Step 1: User visits Askıda Sırdaş landing and selects 250 TL package
    const donationBoxPath = path.join(rootDir, "src/components/donation/donation-box.tsx");
    expect(fs.existsSync(donationBoxPath)).toBe(true);

    const donationAmount = 250;
    const donorName = "Hayırsever Kardeş";

    // Step 2: User initiates checkout via /api/donation/checkout
    const checkoutReq = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: donationAmount,
        donorName,
        paymentProvider: "PAYTR",
        isAnonymous: false,
      },
    });

    const checkoutRes = await checkoutHandler(checkoutReq);
    expect(checkoutRes.status).toBe(200);

    const checkoutBody = await checkoutRes.json();
    expect(checkoutBody.success).toBe(true);
    expect(checkoutBody.amount).toBe(250);
    expect(checkoutBody.redirectUrl).toContain("/askida-sirdas/basarili");

    const transactionId = checkoutBody.transactionId;
    expect(transactionId).toBeDefined();

    // Step 3: Payment gateway verifies and sends IPN callback
    const totalAmountKurus = String(donationAmount * 100);
    const { getPayTrConfig } = await import("@/lib/payment/paytr");
    const { merchantKey, merchantSalt } = getPayTrConfig();
    let hash: string | undefined = undefined;
    if (merchantKey && merchantSalt) {
      hash = crypto
        .createHmac("sha256", merchantKey)
        .update(`${transactionId}${merchantSalt}success${totalAmountKurus}`)
        .digest("base64");
    }

    const ipnReq = createMockRequest("http://localhost:3000/api/webhook/payment", {
      method: "POST",
      isFormData: true,
      body: {
        merchant_oid: transactionId,
        status: "success",
        total_amount: totalAmountKurus,
        ...(hash ? { hash } : {}),
      },
    });

    const ipnRes = await webhookHandler(ipnReq);
    expect(ipnRes.status).toBe(200);
    const ipnText = await ipnRes.text();
    expect(ipnText).toBe("OK");

    // Step 4: Admin and Public pool indicators reflect successful infak balance
    const statsRes = await statsHandler();
    expect(statsRes.status).toBe(200);
    const statsJson = await statsRes.json();

    expect(statsJson.success).toBe(true);
    expect(statsJson.data.donations.poolBalance).toBeGreaterThan(0);
    expect(statsJson.data.donations.sponsoredMessagesCount).toBeGreaterThan(0);
  });

  it("T4-SCN.2: Success and error redirect pages exist and handle return parameters", () => {
    const successPage = path.join(rootDir, "src/app/askida-sirdas/basarili/page.tsx");
    const errorPage = path.join(rootDir, "src/app/askida-sirdas/hata/page.tsx");

    expect(fs.existsSync(successPage)).toBe(true);
    expect(fs.existsSync(errorPage)).toBe(true);

    const successContent = fs.readFileSync(successPage, "utf-8");
    expect(successContent).toContain("Allah Kabul Eylesin");
    expect(successContent).toContain("İnfakınız");

    const errorContent = fs.readFileSync(errorPage, "utf-8");
    expect(errorContent).toContain("Ödeme Tamamlanamadı");
  });
});
