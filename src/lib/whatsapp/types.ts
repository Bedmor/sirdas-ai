export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "audio" | "image" | "interactive" | "unknown";
  text?: {
    body: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
}

export interface WhatsAppWebhookContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppWebhookChangeValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppWebhookContact[];
  messages?: WhatsAppWebhookMessage[];
  statuses?: Array<{
    id: string;
    status: "sent" | "delivered" | "read" | "failed";
    timestamp: string;
    recipient_id: string;
  }>;
}

export interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: WhatsAppWebhookChangeValue;
      field: "messages";
    }>;
  }>;
}

export interface WhatsAppTextMessageRequest {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: {
    preview_url: boolean;
    body: string;
  };
}

export interface WhatsAppAudioMessageRequest {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "audio";
  audio: {
    link: string;
  };
}
