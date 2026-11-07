import { z } from "zod";

export const NafsTrapEnum = z.enum([
  // Temel Tuzaklar
  "FAKIRLIK_KORKUSU_VESVESESI",
  "FAIRLIK_KORKUSU_VESVESESI",
  "GIZLI_KIBIR_HAKLILIK",
  "UMITSIZLIK_KARAMSARLIK",
  "INTIKAM_VE_HASET",
  "ELALEM_NE_DER_RIYA",
  "REHAVET_TEMBELLIK",
  // A. İlahi Adalet & Kader Çatışmaları
  "KADERE_ITIRAZ_VE_ISYAN",
  "ACELECI_TALEPLER_VE_ISTIACAL",
  "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK",
  // B. Nefsin Gizli Putları & Benlik İllüzyonları
  "UCUB_VE_AMELINE_GUVENME",
  "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK",
  "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR",
  // C. İkili İlişkiler & Sosyal Nefis
  "SUI_ZAN_VE_TECESSUS",
  "MINNET_VE_BASA_KAKMA",
  "KAYITSIZLIK_VE_MERHAMETSIZLIK",
  // D. İmtihan Karşısındaki Ruh Halleri
  "GECMISIN_PISMANLIK_GIRDABI",
  "TUL_I_EMEL_VE_GAYETSIZLIK",
  "VESVESE_VE_GUSUL_ABDEST_EVHAMI",
  // Ek Manevi Zafiyetler
  "KOLAY_KAZANC_HIRSI",
  "CIMRILIK_VE_MAL_HIRSI",
  "HAYIR_DIYEMEME_ZAAFI",
  "DUNYALIK_KAYGI",
]);

export const RagCategoryEnum = z.enum([
  // Mevcut 7 Genel Alan
  "RIZIK_VE_TICARET",
  "SABIR_VE_MUSIBET",
  "OFKE_VE_AHLAK",
  "AILE_VE_SILA_I_RAHIM",
  "KUL_HAKKI_VE_ADALET",
  "TEVEKKUL_VE_MURAKABE",
  "SIYER_ORNEKLERI",
  // Yeni Odak Alanları
  "KADER_VE_KAZA_HIKMETI",
  "DUA_VE_ILCA_USULU",
  "TEVBE_VE_INABE",
  "KALP_AMELLELI_VE_IHLAS",
  "KALP_AMELLERI_VE_IHLAS",
  "FANILIK_VE_TAZIYE",
  "FITNE_VE_AHIR_ZAMAN_AHLAKI",
  "ISRAF_VE_IKTISAT_FIKHI",
  "SIYERDE_DARLIK_DONEMLERI",
  "TESKIN_VE_TESELLI",
]);

export const TonePreferenceEnum = z.enum([
  "SEFKATLI_TESKIN",
  "SAKINLESTIRICI_VE_VAKUR",
  "DIRILIS_VE_GAYRET",
  "NET_VE_MUALLIM",
  "HIKMETLI_SUKUT",
  "TAVIZSIZ_MUALLIM",
]);

export const SpiritualStageEnum = z.enum([
  "ARAYIS_VE_BASLANGIC",
  "DARLIK_VE_BUNALIM",
  "DERINLESMIS_SALIK",
  "ISTIKAMET_VE_INSA",
  "MUHASEBE_VE_TEVBE",
]);

export const IntentModeEnum = z.enum(["MANEVI_AYNA", "ILIM_VE_SIYER"]);

export const SessionMoodEnum = z.enum([
  "HUZUNLU_VE_KIRGIN",
  "OFKELI_VE_GERGIN",
  "KAYGILI_VE_DARALMIS",
  "YORGUN_VE_TUKENMIS",
  "PISMAN_VE_MAHCUP",
  "KARARLI_VE_GAYRETLI",
  "SAKIN_VE_DENGELI",
]);

export const EditorAuditSchema = z.object({
  murakabe_applied: z.boolean().describe("Murakabe şuuru işletildi mi?"),
  ilahi_riza_checked: z.boolean().describe("Kazan-kazan değil, İlahi rıza kriteri konuldu mu?"),
  tevekkul_and_talak_hope_included: z.boolean().describe("Talak 2-3 ümit ve çıkış yolu vurgulandı mı?"),
  nafs_and_vesvese_addressed: z.string().describe("Hangi nefis tuzağı veya vesvese deşifre edildi?"),
  siyer_example_used: z.string().describe("Peygamberimiz veya sahabeden hangi ibret örneği verildi?"),
  riba_warning_included: z.boolean().describe("Eğer RIBA_SHIELD_ACTIVE ise true olmak zorundadır"),
  nafs_trap: z.string().optional().describe("Teşhis edilen 22+ nefis tuzağından biri"),
  rag_category: z.string().optional().describe("İlgili 16+ RAG kategorisinden biri"),
  distress_level: z.number().min(0).max(10).optional().describe("0-10 arası kriz/hüzün seviyesi"),
  tone: TonePreferenceEnum.optional().describe("Uygulanan hitabet tavrı"),
  session_mood: SessionMoodEnum.optional().describe("Oturum içi tespit edilen anlık ruh hali"),
  spiritual_stage: SpiritualStageEnum.optional().describe("Kullanıcının manevi aşaması"),
  intent_mode: IntentModeEnum.optional().describe("Akıllı niyet yönlendirmesi modu (MANEVI_AYNA | ILIM_VE_SIYER)")
});

export type EditorAudit = z.infer<typeof EditorAuditSchema>;

export const ProfileUpdatesSchema = z.object({
  new_roles: z.array(z.string()).optional(),
  new_weaknesses: z.array(z.string()).optional(),
  spiritual_stage: SpiritualStageEnum.optional(),
  tone_preference: TonePreferenceEnum.optional(),
});

export type ProfileUpdates = z.infer<typeof ProfileUpdatesSchema>;

export const SirdasOutputSchema = z.object({
  // 1. İçsel Editör Denetimi (Model cevabı yazmadan önce bu denetimi doldurmak zorundadır)
  editor_audit: EditorAuditSchema,
  // 2. Kullanıcıya Gidecek Nihai Yanıt Metni
  reply_text: z
    .string()
    .optional()
    .describe("Samimi, vakur, edebi dille yazılmış nihai yanıt (*kalın*, satır boşluklu)"),
  whatsapp_reply: z
    .string()
    .describe("Geriye dönük uyumluluk yanıt alanı"),
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
        riba_warning_included: { type: "boolean", description: "Eğer RIBA_SHIELD_ACTIVE ise true olmak zorundadır" },
        nafs_trap: { type: "string", description: "Teşhis edilen 22+ nefis tuzağından biri" },
        rag_category: { type: "string", description: "İlgili 16+ RAG kategorisinden biri" },
        distress_level: { type: "integer", description: "0-10 arası kriz/hüzün seviyesi" },
        tone: {
          type: "string",
          enum: [
            "SEFKATLI_TESKIN",
            "SAKINLESTIRICI_VE_VAKUR",
            "DIRILIS_VE_GAYRET",
            "NET_VE_MUALLIM",
            "HIKMETLI_SUKUT",
            "TAVIZSIZ_MUALLIM"
          ]
        },
        spiritual_stage: {
          type: "string",
          enum: [
            "ARAYIS_VE_BASLANGIC",
            "DARLIK_VE_BUNALIM",
            "DERINLESMIS_SALIK",
            "ISTIKAMET_VE_INSA",
            "MUHASEBE_VE_TEVBE"
          ]
        }
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
      description: "Samimi, vakur, edebi dille yazılmış nihai yanıt (*kalın*, satır boşluklu)"
    },
    profile_updates: {
      type: "object",
      properties: {
        new_roles: { type: "array", items: { type: "string" } },
        new_weaknesses: { type: "array", items: { type: "string" } },
        spiritual_stage: {
          type: "string",
          enum: [
            "ARAYIS_VE_BASLANGIC",
            "DARLIK_VE_BUNALIM",
            "DERINLESMIS_SALIK",
            "ISTIKAMET_VE_INSA",
            "MUHASEBE_VE_TEVBE"
          ]
        },
        tone_preference: {
          type: "string",
          enum: [
            "SEFKATLI_TESKIN",
            "SAKINLESTIRICI_VE_VAKUR",
            "DIRILIS_VE_GAYRET",
            "NET_VE_MUALLIM",
            "HIKMETLI_SUKUT",
            "TAVIZSIZ_MUALLIM"
          ]
        }
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

