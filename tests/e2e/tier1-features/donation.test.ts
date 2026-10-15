import fs from "fs";
import path from "path";
import crypto from "crypto";
import { describe, it, expect } from "../harness";
import { createMockRequest } from "../harness/utils";
import { POST as checkoutHandler } from "@/app/api/donation/checkout/route";
import { POST as webhookHandler } from "@/app/api/webhook/payment/route";
import { verifyPayTrHash, getPayTrConfig } from "@/lib/payment/paytr";

describe("Tier 1: Feature Coverage — Askıda Sırdaş Donation Platform", { tier: 1, feature: "Donation" }, () => {
  const rootDir = process.cwd();

  it("T1-DON.1: Pool Counter renders transparent metrics for sponsored messages, balance, and donors", () => {
    const counterPath = path.join(rootDir, "src/components/donation/pool-counter.tsx");
    expect(fs.existsSync(counterPath)).toBe(true);

    const counterContent = fs.readFileSync(counterPath, "utf-8");
    expect(counterContent.includes("Havuz Bakiyesi") || counterContent.includes("Askıdaki Güncel Bakiye")).toBe(true);
    expect(counterContent).toContain("Karşılanan");
    expect(counterContent).toContain("Gönüllü");
  });

  it("T1-DON.2: Donation box provides 4 preset tiers (50, 100, 250, 500 TL) and custom input calculation", () => {
    const boxPath = path.join(rootDir, "src/components/donation/donation-box.tsx");
    expect(fs.existsSync(boxPath)).toBe(true);

    const boxContent = fs.readFileSync(boxPath, "utf-8");
    expect(boxContent).toContain("50");
    expect(boxContent).toContain("100");
    expect(boxContent).toContain("250");
    expect(boxContent).toContain("500");
    expect(boxContent).toContain("customAmount");
    expect(boxContent).toContain("Anonim İnfak Sahibi");
  });

  it("T1-DON.3: Checkout API creates transaction, sets pending status, and returns redirect and token", async () => {
    const req = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: 250,
        donorName: "Test Hayırsever",
        donorPhone: "05551234567",
        paymentProvider: "PAYTR",
        isAnonymous: false,
      },
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.amount).toBe(250);
    expect(json.currency).toBe("TRY");
    expect(json.provider).toBe("PAYTR");
    expect(json.transactionId).toBeDefined();
    expect(json.checkoutToken).toBeDefined();
    expect(json.redirectUrl).toContain("/askida-sirdas/basarili");
  });

  it("T1-DON.4: Checkout API enforces 'Anonim İnfak Sahibi' when isAnonymous flag is true", async () => {
    const req = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: 100,
        donorName: "Gizli Kalmak İsteyen Kişi",
        paymentProvider: "PAYTR",
        isAnonymous: true,
      },
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.redirectUrl).toContain(encodeURIComponent("Anonim İnfak Sahibi"));
  });

  it("T1-DON.5: PayTR HMAC-SHA256 signature verification accepts authentic callbacks", () => {
    const origKey = process.env.PAYTR_MERCHANT_KEY;
    const origSalt = process.env.PAYTR_MERCHANT_SALT;

    try {
      process.env.PAYTR_MERCHANT_KEY = "test_key_abc";
      process.env.PAYTR_MERCHANT_SALT = "test_salt_xyz";

      const merchantOid = "tx_12345";
      const status = "success";
      const totalAmount = "25000"; // 250 TL in kurus
      const expectedToken = `${merchantOid}test_salt_xyz${status}${totalAmount}`;
      const hash = crypto.createHmac("sha256", "test_key_abc").update(expectedToken).digest("base64");

      const result = verifyPayTrHash({
        merchant_oid: merchantOid,
        status,
        total_amount: totalAmount,
        hash,
      });

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("SUCCESS");
    } finally {
      process.env.PAYTR_MERCHANT_KEY = origKey;
      process.env.PAYTR_MERCHANT_SALT = origSalt;
    }
  });

  it("T1-DON.6: Payment webhook route returns HTTP 200 'OK' for validated PayTR notifications", async () => {
    const { merchantKey, merchantSalt } = getPayTrConfig();
    const merchantOid = "tx_mock_999";
    const status = "success";
    const totalAmount = "10000";
    let hash: string | undefined = undefined;
    if (merchantKey && merchantSalt) {
      hash = crypto
        .createHmac("sha256", merchantKey)
        .update(`${merchantOid}${merchantSalt}${status}${totalAmount}`)
        .digest("base64");
    }

    const req = createMockRequest("http://localhost:3000/api/webhook/payment", {
      method: "POST",
      isFormData: true,
      body: {
        merchant_oid: merchantOid,
        status,
        total_amount: totalAmount,
        ...(hash ? { hash } : {}),
      },
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("OK");
  });
});
