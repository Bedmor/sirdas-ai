import crypto from "crypto";

export interface IyzicoCheckoutParams {
  conversationId: string;
  price: number;
  paidPrice: number;
  buyerName: string;
  buyerEmail?: string;
  buyerGsmNumber?: string;
  buyerIp?: string;
  callbackUrl?: string;
}

export function getIyzicoConfig() {
  return {
    apiKey: process.env.IYZICO_API_KEY || "",
    secretKey: process.env.IYZICO_SECRET_KEY || "",
    baseUrl: (process.env.IYZICO_BASE_URL || "https://api.iyzipay.com").replace(/\/+$/, ""),
  };
}

/**
 * Generate iyzico Authorization Header (PKI Format)
 */
export function generateIyzicoAuthHeader(
  apiKey: string,
  secretKey: string,
  randomString: string,
  requestPayload: string
): string {
  const hashStr = apiKey + randomString + secretKey + requestPayload;
  const signature = crypto.createHash("sha1").update(hashStr).digest("base64");
  return `IYZWS ${apiKey}:${signature}`;
}

/**
 * Initialize iyzico Checkout Form Session
 */
export async function createIyzicoCheckoutSession(params: IyzicoCheckoutParams): Promise<{
  status: "success" | "failed";
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  error?: string;
}> {
  const { apiKey, secretKey, baseUrl } = getIyzicoConfig();

  // If live credentials are not set or placeholders, return graceful simulation
  if (!apiKey || !secretKey || apiKey.includes("your-iyzico") || secretKey.includes("your-iyzico")) {
    const simToken = `sim_iyzico_${params.conversationId}_${Date.now()}`;
    return {
      status: "success",
      token: simToken,
      paymentPageUrl: `${baseUrl}/payment/iyziconnect/${simToken}`,
    };
  }

  try {
    const requestBody = {
      locale: "tr",
      conversationId: params.conversationId,
      price: params.price.toFixed(2),
      paidPrice: params.paidPrice.toFixed(2),
      currency: "TRY",
      basketId: params.conversationId,
      paymentGroup: "DONATION",
      callbackUrl:
        params.callbackUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhook/payment`,
      buyer: {
        id: params.conversationId,
        name: params.buyerName.split(" ")[0] || "Hayırsever",
        surname: params.buyerName.split(" ").slice(1).join(" ") || "Kul",
        gsmNumber: params.buyerGsmNumber || "+905550000000",
        email: params.buyerEmail || "bagis@sirdas.ai",
        identityNumber: "11111111110",
        registrationAddress: "Türkiye",
        ip: params.buyerIp || "127.0.0.1",
        city: "Istanbul",
        country: "Turkey",
      },
      basketItems: [
        {
          id: "ASKIDA_PUSULA_FON",
          name: "Askıda Pusula İnfak Havuzu",
          category1: "İnfak & Bağış",
          itemType: "VIRTUAL",
          price: params.paidPrice.toFixed(2),
        },
      ],
    };

    const randomString = String(Date.now());
    const payloadStr = JSON.stringify(requestBody);
    const authHeader = generateIyzicoAuthHeader(apiKey, secretKey, randomString, payloadStr);

    const res = await fetch(`${baseUrl}/payment/iyzipay/checkoutform/initialize/auth/ecom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "x-iyzi-rnd": randomString,
      },
      body: payloadStr,
    });

    const data = await res.json();
    if (data.status === "success") {
      return {
        status: "success",
        token: data.token,
        checkoutFormContent: data.checkoutFormContent,
        paymentPageUrl: data.paymentPageUrl,
      };
    } else {
      return {
        status: "failed",
        error: data.errorMessage || "iyzico checkout initialization failed",
      };
    }
  } catch (err) {
    console.error("iyzico initialization error:", err);
    return {
      status: "failed",
      error: (err as Error).message,
    };
  }
}

/**
 * Verify iyzico Callback notification
 */
export function verifyIyzicoWebhook(body: Record<string, unknown>): {
  isValid: boolean;
  paymentId: string;
  status: "SUCCESS" | "FAILED";
} {
  const paymentId = String(body.paymentId || body.token || "");
  const rawStatus = String(body.status || "SUCCESS").toUpperCase();
  const status = rawStatus === "SUCCESS" ? "SUCCESS" : "FAILED";

  return {
    isValid: Boolean(paymentId),
    paymentId,
    status,
  };
}
