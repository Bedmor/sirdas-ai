import { describe, it, expect } from "../harness";
import { createMockRequest } from "../harness/utils";
import { POST as checkoutHandler } from "@/app/api/donation/checkout/route";
import { verifyPayTrHash } from "@/lib/payment/paytr";

describe("Tier 2: Boundary & Corner Cases — Donation Validation", { tier: 2, feature: "Donation Boundaries" }, () => {
  it("T2-DON.1: Rejects zero amount (0.00 TL) with HTTP 400 Bad Request", async () => {
    const req = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: 0,
        donorName: "Test",
        paymentProvider: "PAYTR",
      },
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Geçerli bir bağış tutarı");
  });

  it("T2-DON.2: Rejects negative amount (-50.00 TL) with HTTP 400 Bad Request", async () => {
    const req = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: -50,
        donorName: "Test",
        paymentProvider: "PAYTR",
      },
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("T2-DON.3: Rejects non-numeric string amount ('abc', '100TL') with HTTP 400", async () => {
    const req = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: "invalid_amount",
        donorName: "Test",
      },
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("T2-DON.4: Accepts minimum legal currency fraction (0.01 TL) without rounding errors", async () => {
    const req = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: 0.01,
        donorName: "Kuruş Bağışçısı",
        paymentProvider: "PAYTR",
      },
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.amount).toBe(0.01);
  });

  it("T2-DON.5: Handles large donation amounts (100,000.00 TL) without numeric overflow", async () => {
    const req = createMockRequest("http://localhost:3000/api/donation/checkout", {
      method: "POST",
      body: {
        amount: 100000.0,
        donorName: "Cömert Vakıf",
        paymentProvider: "PAYTR",
      },
    });

    const res = await checkoutHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.amount).toBe(100000.0);
  });

  it("T2-DON.6: PayTR hash verification strictly detects tampering of total_amount by 1 kuruş", () => {
    const origKey = process.env.PAYTR_MERCHANT_KEY;
    const origSalt = process.env.PAYTR_MERCHANT_SALT;

    try {
      process.env.PAYTR_MERCHANT_KEY = "secret_key_123";
      process.env.PAYTR_MERCHANT_SALT = "salt_456";

      // Legitimate hash generated for 100 TL (10000 kurus)
      const merchantOid = "tx_tamper_test";
      const status = "success";
      const legitAmount = "10000";

      // Attacker tampers amount to 9999 kurus
      const tamperedAmount = "9999";

      // Signature calculated on legit amount
      const crypto = require("crypto");
      const legitHash = crypto
        .createHmac("sha256", "secret_key_123")
        .update(`${merchantOid}salt_456${status}${legitAmount}`)
        .digest("base64");

      const result = verifyPayTrHash({
        merchant_oid: merchantOid,
        status,
        total_amount: tamperedAmount, // Tampered!
        hash: legitHash,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("mismatch");
    } finally {
      process.env.PAYTR_MERCHANT_KEY = origKey;
      process.env.PAYTR_MERCHANT_SALT = origSalt;
    }
  });
});
