import { z } from "zod";

export const EditorAuditSchema = z.object({
  murakabe_applied: z.boolean().describe("Murakabe şuuru işletildi mi?"),
  ilahi_riza_checked: z.boolean().describe("Kazan-kazan değil, İlahi rıza kriteri konuldu mu?"),
  tevekkul_and_talak_hope_included: z.boolean().describe("Talak 2-3 ümit ve çıkış yolu vurgulandı mı?"),
  nafs_and_vesvese_addressed: z.string().describe("Hangi nefis tuzağı veya vesvese deşifre edildi?"),
  siyer_example_used: z.string().describe("Peygamberimiz veya sahabeden hangi ibret örneği verildi?"),
  riba_warning_included: z.boolean().describe("Eğer RIBA_SHIELD_ACTIVE ise true olmak zorundadır")
});

export type EditorAudit = z.infer<typeof EditorAuditSchema>;

export const ProfileUpdatesSchema = z.object({
  new_roles: z.array(z.string()).optional(),
  new_weaknesses: z.array(z.string()).optional()
});

export type ProfileUpdates = z.infer<typeof ProfileUpdatesSchema>;

export const SirdasOutputSchema = z.object({
  // 1. İçsel Editör Denetimi (Model cevabı yazmadan önce bu denetimi doldurmak zorundadır)
  editor_audit: EditorAuditSchema,
  // 2. Kullanıcıya Gidecek Nihai WhatsApp Mesajı
  whatsapp_reply: z
    .string()
    .describe("WhatsApp formatında (*kalın*, satır boşluklu), samimi, vakur, edebi dille yazılmış nihai yanıt"),
  // 3. Sohbet Sırasında Öğrenilen Yeni Profil Bilgileri (Varsa)
  profile_updates: ProfileUpdatesSchema.optional(),
  // 4. Seçilen Halis Hoca Ses Kesiti ID'si (Varsa)
  selected_audio_chunk_id: z
    .string()
    .nullable()
    .describe("Kullanıcıya gönderilecek Halis Aydemir ses kesiti ID'si (RAG listesinden)")
});

export type SirdasOutput = z.infer<typeof SirdasOutputSchema>;

export const SIRDAS_OUTPUT_JSON_SCHEMA = {
  type: "object",
  properties: {
    editor_audit: {
      type: "object",
      properties: {
        murakabe_applied: { type: "boolean", description: "Murakabe şuuru işletildi mi?" },
        ilahi_riza_checked: { type: "boolean", description: "Kazan-kazan değil, İlahi rıza kriteri konuldu mu?" },
        tevekkul_and_talak_hope_included: { type: "boolean", description: "Talak 2-3 ümit ve çıkış yolu vurgulandı mı?" },
        nafs_and_vesvese_addressed: { type: "string", description: "Hangi nefis tuzağı veya vesvese deşifre edildi?" },
        siyer_example_used: { type: "string", description: "Peygamberimiz veya sahabeden hangi ibret örneği verildi?" },
        riba_warning_included: { type: "boolean", description: "Eğer RIBA_SHIELD_ACTIVE ise true olmak zorundadır" }
      },
      required: [
        "murakabe_applied",
        "ilahi_riza_checked",
        "tevekkul_and_talak_hope_included",
        "nafs_and_vesvese_addressed",
        "siyer_example_used",
        "riba_warning_included"
      ]
    },
    whatsapp_reply: {
      type: "string",
      description: "WhatsApp formatında (*kalın*, satır boşluklu), samimi, vakur, edebi dille yazılmış nihai yanıt"
    },
    profile_updates: {
      type: "object",
      properties: {
        new_roles: { type: "array", items: { type: "string" } },
        new_weaknesses: { type: "array", items: { type: "string" } }
      }
    },
    selected_audio_chunk_id: {
      type: "string",
      nullable: true,
      description: "Kullanıcıya gönderilecek Halis Aydemir ses kesiti ID'si (RAG listesinden)"
    }
  },
  required: ["editor_audit", "whatsapp_reply"]
};

