import crypto from "crypto";

export interface PayTrCheckoutParams {
  merchantOid: string;
  email: string;
  paymentAmount: number; // in Turkish Liras (will be multiplied by 100 for kurus)
  userName: string;
  userAddress?: string;
  userPhone?: string;
  userIp?: string;
  userBasket?: Array<[string, string, number]>;
  merchantOkUrl?: string;
  merchantFailUrl?: string;
}

export interface PayTrNotificationPayload {
  merchant_oid: string;
  status: "success" | "failed" | string;
  total_amount: string;
  hash?: string;
  failed_reason_code?: string;
  failed_reason_msg?: string;
  payment_amount?: string;
  currency?: string;
}

/**
 * PayTR Config Helper
 */
export function getPayTrConfig() {
  return {
    merchantId: process.env.PAYTR_MERCHANT_ID || "",
    merchantKey: process.env.PAYTR_MERCHANT_KEY || "",
    merchantSalt: process.env.PAYTR_MERCHANT_SALT || "",
  };
}

/**
 * Create PayTR iFrame Token
 * Standard PayTR hash: HMAC SHA-256 with merchant_key
 */
export async function createPayTrToken(params: PayTrCheckoutParams): Promise<{
  token: string;
  status: "success" | "failed";
  iframeUrl?: string;
  error?: string;
}> {
  const { merchantId, merchantKey, merchantSalt } = getPayTrConfig();

  // If live credentials are not set, return simulated secure token
  if (!merchantId || !merchantKey || !merchantSalt) {
    const simToken = `sim_paytr_${params.merchantOid}_${Date.now()}`;
    return {
      status: "success",
      token: simToken,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${simToken}`,
    };
  }

  try {
    const paymentAmountKurus = Math.round(params.paymentAmount * 100);
    const userBasketStr = JSON.stringify(
      params.userBasket || [["Askıda Sırdaş İnfak Havuzu", String(params.paymentAmount), 1]]
    );
    const userBasketBase64 = Buffer.from(userBasketStr).toString("base64");
    const userIp = params.userIp || "127.0.0.1";
    const noInstallment = "1";
    const maxInstallment = "0";
    const currency = "TL";
    const testMode = process.env.NODE_ENV !== "production" ? "1" : "0";

    const hashStr = `${merchantId}${userIp}${params.merchantOid}${params.email}${paymentAmountKurus}${userBasketBase64}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = crypto
      .createHmac("sha256", merchantKey)
      .update(hashStr + merchantSalt)
      .digest("base64");

    const formData = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid: params.merchantOid,
      email: params.email,
      payment_amount: String(paymentAmountKurus),
      paytr_token: paytrToken,
      user_basket: userBasketBase64,
      debug_on: testMode,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: params.userName,
      user_address: params.userAddress || "Türkiye",
      user_phone: params.userPhone || "05550000000",
      merchant_ok_url: params.merchantOkUrl || `${process.env.NEXT_PUBLIC_APP_URL || ""}/askida-sirdas/basarili`,
      merchant_fail_url: params.merchantFailUrl || `${process.env.NEXT_PUBLIC_APP_URL || ""}/askida-sirdas/hata`,
      timeout_limit: "30",
      currency,
      test_mode: testMode,
    });

    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const result = await response.json();
    if (result.status === "success") {
      return {
        status: "success",
        token: result.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
      };
    } else {
      return {
        status: "failed",
        token: "",
        error: result.reason || "PayTR token generation failed",
      };
    }
  } catch (err) {
    console.error("PayTR API call exception:", err);
    return {
      status: "failed",
      token: "",
      error: (err as Error).message,
    };
  }
}

/**
 * Verify PayTR IPN Callback HMAC Hash
 * Strictly checks signature if merchantKey and merchantSalt are configured.
 */
export function verifyPayTrHash(payload: PayTrNotificationPayload): {
  isValid: boolean;
  status: "SUCCESS" | "FAILED";
  reason?: string;
} {
  const { merchantKey, merchantSalt } = getPayTrConfig();
  const { merchant_oid, status, total_amount, hash } = payload;

  const normalizedStatus = status === "success" ? "SUCCESS" : "FAILED";

  // If credentials are fully configured, require hash and verify signature
  if (merchantKey && merchantSalt) {
    if (!hash) {
      return {
        isValid: false,
        status: normalizedStatus,
        reason: "Missing PayTR hash in webhook payload",
      };
    }

    const expectedToken = `${merchant_oid}${merchantSalt}${status}${total_amount}`;
    const calculatedHash = crypto
      .createHmac("sha256", merchantKey)
      .update(expectedToken)
      .digest("base64");

    if (calculatedHash !== hash) {
      return {
        isValid: false,
        status: normalizedStatus,
        reason: "Hash signature mismatch",
      };
    }
  }

  return {
    isValid: true,
    status: normalizedStatus,
  };
}
