export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || "mock_phone_number_id";
    this.accessToken = process.env.META_ACCESS_TOKEN || "mock_meta_access_token";
    this.baseUrl = process.env.META_GRAPH_API_URL || "https://graph.facebook.com/v21.0";
  }

  private isMockMode(): boolean {
    return (
      !this.accessToken ||
      this.accessToken === "mock_meta_access_token" ||
      this.accessToken === "EAA..." ||
      this.accessToken.includes("...") ||
      this.accessToken.startsWith("your-") ||
      !this.phoneNumberId ||
      this.phoneNumberId === "mock_phone_number_id" ||
      this.phoneNumberId === "100012345678901" ||
      this.phoneNumberId.startsWith("your-")
    );
  }

  async markAsRead(messageId: string): Promise<void> {
    if (this.isMockMode()) {
      return;
    }

    try {
      await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId
        })
      });
    } catch (err) {
      console.warn("[WhatsApp markAsRead Warning]", err);
    }
  }

  async sendTypingIndicator(to: string, messageId?: string): Promise<boolean> {
    if (this.isMockMode()) {
      return true;
    }

    try {
      const effectiveMessageId = messageId || (to.startsWith("wamid.") ? to : undefined);

      let payload: Record<string, unknown>;
      if (effectiveMessageId) {
        payload = {
          messaging_product: "whatsapp",
          status: "read",
          message_id: effectiveMessageId,
          typing_indicator: {
            type: "text"
          }
        };
      } else {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          status: "processing",
          sender_action: "typing"
        };
      }

      const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn(`[WhatsApp sendTypingIndicator Error HTTP ${res.status}]`, errorData);
        return false;
      }

      return true;
    } catch (err) {
      console.warn("[WhatsApp sendTypingIndicator Warning]", err);
      return false;
    }
  }

  async sendTextMessage(to: string, text: string): Promise<string> {
    if (this.isMockMode()) {
      return `wamid.mock_text_${Date.now()}`;
    }

    const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: text }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[WhatsApp sendTextMessage Error HTTP ${res.status}]`, data);
    }
    return data.messages?.[0]?.id || `wamid.sent_${Date.now()}`;
  }

  async sendAudioMessage(to: string, audioUrl: string): Promise<string> {
    if (this.isMockMode()) {
      return `wamid.mock_audio_${Date.now()}`;
    }

    const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "audio",
        audio: { link: audioUrl }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[WhatsApp sendAudioMessage Error HTTP ${res.status}]`, data);
    }
    return data.messages?.[0]?.id || `wamid.sent_audio_${Date.now()}`;
  }
}
