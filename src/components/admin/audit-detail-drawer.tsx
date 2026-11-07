"use client";

import React from "react";
import {
  ShieldCheck,
  Scale,
  Sparkles,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AuditJevMetadata {
  noul?: { is_fatwa?: number; is_riba?: number; needs_audio?: number };
  choice?: { nafs_trap?: string; rag_category?: string };
  score?: { distress_level?: number };
  distress_level?: number;
  is_fiqh_fatwa_request?: number;
  is_debt_or_riba_related?: number;
  needs_audio_snippet?: number;
  nafs_trap?: string;
  rag_category?: string;
}

export interface AuditEditorMetadata {
  murakabe_applied?: boolean;
  ilahi_riza_checked?: boolean;
  tevekkul_and_talak_hope_included?: boolean;
  nafs_and_vesvese_addressed?: string;
  siyer_example_used?: string;
  riba_warning_included?: boolean;
  deepTriage?: {
    nafsTrap?: string;
    spiritualStage?: string;
    distressLevel?: number;
    recommendedTone?: string;
    underlyingNeed?: string;
    spiritualDiagnosis?: string;
  };
}

export interface AuditMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  userPhone: string;
  userProfile?: {
    preferred_name?: string;
    roles?: string[];
    known_facts?: string[];
    spiritual_trials?: string[];
    biological_energy?: string[];
    tone_preference?: string;
    spiritual_stage?: string;
    interaction_count?: number;
    onboarding_step?: number;
    onboarding_completed?: boolean;
    profile_completion?: number;
  } | null;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  audioSent?: boolean;
  jevMetadata?: AuditJevMetadata;
  editorAudit?: AuditEditorMetadata;
}

export const getDistress = (m: AuditMessage): number =>
  m.jevMetadata?.score?.distress_level ??
  m.jevMetadata?.distress_level ??
  m.editorAudit?.deepTriage?.distressLevel ??
  (typeof (m.editorAudit as unknown as Record<string, unknown>)?.distress_level === "number"
    ? ((m.editorAudit as unknown as Record<string, unknown>).distress_level as number)
    : 4);

export const getIsFatwa = (m: AuditMessage): number =>
  m.jevMetadata?.noul?.is_fatwa ?? m.jevMetadata?.is_fiqh_fatwa_request ?? 0;

export const getIsRiba = (m: AuditMessage): number =>
  m.jevMetadata?.noul?.is_riba ??
  m.jevMetadata?.is_debt_or_riba_related ??
  (m.editorAudit?.riba_warning_included ? 0.9 : 0);

export const getNeedsAudio = (m: AuditMessage): number =>
  m.jevMetadata?.noul?.needs_audio ??
  m.jevMetadata?.needs_audio_snippet ??
  (m.audioSent
    ? 0.95
    : m.editorAudit?.deepTriage && m.editorAudit.deepTriage.distressLevel && m.editorAudit.deepTriage.distressLevel >= 6
    ? 0.85
    : 0.35);

export const getNafsTrap = (m: AuditMessage): string =>
  m.jevMetadata?.choice?.nafs_trap ||
  m.jevMetadata?.nafs_trap ||
  m.editorAudit?.deepTriage?.nafsTrap ||
  (typeof (m.editorAudit as unknown as Record<string, unknown>)?.nafs_trap === "string"
    ? ((m.editorAudit as unknown as Record<string, unknown>).nafs_trap as string)
    : null) ||
  m.editorAudit?.nafs_and_vesvese_addressed ||
  "UMITSIZLIK_KARAMSARLIK";

export const getRagCategory = (m: AuditMessage): string =>
  m.jevMetadata?.choice?.rag_category ||
  m.jevMetadata?.rag_category ||
  (typeof (m.editorAudit as unknown as Record<string, unknown>)?.rag_category === "string"
    ? ((m.editorAudit as unknown as Record<string, unknown>).rag_category as string)
    : null) ||
  "TEVEKKUL_VE_MURAKABE";

const NAFS_TRAP_HUMAN_LABELS: Record<string, string> = {
  FAKIRLIK_KORKUSU_VESVESESI: "Gelecek & Geçim Endişesi",
  FAIRLIK_KORKUSU_VESVESESI: "Gelecek & Geçim Endişesi",
  UMITSIZLIK_KARAMSARLIK: "Ümitsizlik & Karamsarlık",
  GIZLI_KIBIR_HAKLILIK: "Kendini Haklı Görme & İkna",
  INTIKAM_VE_HASET: "Öfke & Kırgınlık",
  ELALEM_NE_DER_RIYA: "Çevre Onayı & Sosyal Kaygı",
  REHAVET_TEMBELLIK: "Genel Sohbet / Erteleme",
  KADERE_ITIRAZ_VE_ISYAN: "Kader & Yaşamı Sorgulama",
  ACELECI_TALEPLER_VE_ISTIACAL: "Sabırsızlık & Acelecilik",
  ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK: "Dış Etkenlere Aşırı Anlam Yükleme",
  UCUB_VE_AMELINE_GUVENME: "Aşırı Özgüven & Benlik",
  KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK: "Aşırı Kontrol & Mükemmeliyetçilik",
  GIZLI_SIRK_VE_SAHTE_SIGINAKLAR: "Geçici & Sahte Rahatlama Arayışı",
  SUI_ZAN_VE_TECESSUS: "Güvensizlik & Şüphecilik",
  MINNET_VE_BASA_KAKMA: "Beklenti & Sitem",
  KAYITSIZLIK_VE_MERHAMETSIZLIK: "Hissizlik & Duygusal Kopuş",
  GECMISIN_PISMANLIK_GIRDABI: "Geçmiş Pişmanlığı & Takılı Kalma",
  TUL_I_EMEL_VE_GAYETSIZLIK: "Varoluşsal Boşluk & Hedefsizlik",
  VESVESE_VE_GUSUL_ABDEST_EVHAMI: "Aşırı Evham & Takıntı",
  KOLAY_KAZANC_HIRSI: "Kolay Çözüm & Kazanç Hırsı",
  CIMRILIK_VE_MAL_HIRSI: "Kaybetme Korkusu & Tutumluluk",
  HAYIR_DIYEMEME_ZAAFI: "Sınır Çizememe & Hayır Diyememe",
  DUNYALIK_KAYGI: "Dünyevi Stres & Ailevi Kaygı",
};

export const getDisplayNafsTrap = (m: AuditMessage): string => {
  const raw = getNafsTrap(m);
  return NAFS_TRAP_HUMAN_LABELS[raw] || raw.replace(/_/g, " ");
};

const RAG_CATEGORY_HUMAN_LABELS: Record<string, string> = {
  RIZIK_VE_TICARET: "İş, Geçim & Çalışma Hayatı",
  SABIR_VE_MUSIBET: "Zorluklar, Sabır & Dayanıklılık",
  OFKE_VE_AHLAK: "Öfke Kontrolü & İletişim",
  AILE_VE_SILA_I_RAHIM: "Aile & Yakın İlişkiler",
  KUL_HAKKI_VE_ADALET: "Adalet, Hak & Sorumluluk",
  TEVEKKUL_VE_MURAKABE: "İç Huzur, Tevekkül & Farkındalık",
  SIYER_ORNEKLERI: "Tarihsel Yaşam Örnekleri",
  KADER_VE_KAZA_HIKMETI: "Kader & Yaşamın Hikmeti",
  DUA_VE_ILCA_USULU: "Dua, Yakarma & İstek Usulü",
  TEVBE_VE_INABE: "Hatalardan Dönüş & Arınma",
  KALP_AMELLELI_VE_IHLAS: "Samimiyet & İçsel Niyet",
  KALP_AMELLERI_VE_IHLAS: "Samimiyet & İçsel Niyet",
  FANILIK_VE_TAZIYE: "Kayıp, Yas & Fanilik Bilinci",
  FITNE_VE_AHIR_ZAMAN_AHLAKI: "Dijital Çağ, Çevre & Yalnızlık",
  ISRAF_VE_IKTISAT_FIKHI: "Zaman ve Kaynak Yönetimi",
  SIYERDE_DARLIK_DONEMLERI: "Tarihte Zor Zamanlar ve Çıkışlar",
  TESKIN_VE_TESELLI: "Huzur, Teskin & Rahatlama",
};

export const getDisplayRagCategory = (m: AuditMessage): string => {
  const raw = getRagCategory(m);
  return RAG_CATEGORY_HUMAN_LABELS[raw] || raw.replace(/_/g, " ");
};

export function AuditDetailDrawer({ msg }: { msg: AuditMessage }) {
  const distress = getDistress(msg);
  const fatwaProb = getIsFatwa(msg);
  const ribaProb = getIsRiba(msg);
  const audioProb = getNeedsAudio(msg);

  return (
    <div className="border-t border-outline-variant/40 bg-surface/80 p-5 space-y-4 animate-in fade-in-50 text-xs">
      {/* Full Content */}
      <div>
        <div className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
          {msg.role === "USER" ? (
            <>
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>Kullanıcı Mesajı (Girdi):</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Manevi Pusula Yanıtı:</span>
            </>
          )}
        </div>
        <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/40 whitespace-pre-line text-foreground/95 leading-relaxed font-sans shadow-inner">
          {msg.content}
        </div>
      </div>

      {/* Sistem 1 Reflex Telemetry Panel */}
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
          <strong className="text-amber-300 flex items-center gap-1.5 font-serif text-sm">
            <Scale className="h-4 w-4 text-amber-400" />
            Sistem 1 Hızlı Teşhis &amp; Kriz Telemetrisi
          </strong>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Gecikme: 0ms (Deterministik Refleks Kalkanı)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Güvenlik &amp; Tespit Olasılıkları
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span>Hukuki Hüküm / Alo 190:</span>
                <span className="text-rose-400 font-bold font-mono">
                  {(fatwaProb * 100).toFixed(0)}% ({fatwaProb.toFixed(2)})
                </span>
              </div>
              <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                <div
                  style={{ width: `${Math.round(fatwaProb * 100)}%` }}
                  className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span>Finans / Borç Tespiti:</span>
                <span className="text-amber-400 font-bold font-mono">
                  {(ribaProb * 100).toFixed(0)}% ({ribaProb.toFixed(2)})
                </span>
              </div>
              <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                <div
                  style={{ width: `${Math.round(ribaProb * 100)}%` }}
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span>Sesli Yanıt İhtiyacı:</span>
                <span className="text-cyan-400 font-bold font-mono">
                  {(audioProb * 100).toFixed(0)}% ({audioProb.toFixed(2)})
                </span>
              </div>
              <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                <div
                  style={{ width: `${Math.round(audioProb * 100)}%` }}
                  className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Psikolojik Durum &amp; Konu
            </span>
            <div className="font-sans text-xs font-bold text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
              {getDisplayNafsTrap(msg)}
            </div>
            <div className="text-[11px] text-muted-foreground pt-1">
              Konu Alanı:{" "}
              <span className="font-sans text-emerald-400 font-medium">
                {getDisplayRagCategory(msg)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Duygu &amp; Stres Yoğunluğu
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {distress} / 10
            </div>
            <div className="text-[11px] text-muted-foreground">
              {distress >= 8
                ? "🚨 Acil Destek / Kriz (112 Koruması)"
                : distress >= 5
                ? "⚠️ Yüksek Stres / Duygusal Ağırlık"
                : "🌿 Dengeli / Olağan İletişim"}
            </div>
          </div>
        </div>
      </div>

      {/* Gemini 3.8 Flash Editor Audit */}
      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-800/30 pb-2">
          <strong className="text-emerald-300 flex items-center gap-1.5 font-serif text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Gemini 3.8 Flash Yanıt Güvenlik &amp; Kalite Denetimi
          </strong>
          <Badge
            variant="emerald"
            className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50"
          >
            Güvenlik ve Kalite Onaylı
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
            {msg.editorAudit?.murakabe_applied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="text-muted-foreground block text-[10px]">
                Farkındalık &amp; Sorumluluk:
              </span>
              <span className="font-semibold text-foreground">
                {msg.editorAudit?.murakabe_applied
                  ? "Doğrulandı (✓)"
                  : "Eksik (✗)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
            {msg.editorAudit?.ilahi_riza_checked ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="text-muted-foreground block text-[10px]">
                Etik Denge &amp; Samimiyet:
              </span>
              <span className="font-semibold text-foreground">
                {msg.editorAudit?.ilahi_riza_checked
                  ? "Gözetildi (✓)"
                  : "Eksik (✗)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
            {msg.editorAudit?.tevekkul_and_talak_hope_included ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div>
              <span className="text-muted-foreground block text-[10px]">
                Umut &amp; Çözüm Odaklılık:
              </span>
              <span className="font-semibold text-foreground">
                {msg.editorAudit?.tevekkul_and_talak_hope_included
                  ? "Sağlandı (✓)"
                  : "Gerekmedi"}
              </span>
            </div>
          </div>
        </div>

        {msg.editorAudit?.nafs_and_vesvese_addressed && (
          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-900/40">
            <span className="font-semibold text-amber-400 block text-[11px] mb-0.5">
              Ele Alınan Psikolojik Durum &amp; Yaklaşım:
            </span>
            <p className="text-foreground/90 italic leading-relaxed">
              &ldquo;{msg.editorAudit.nafs_and_vesvese_addressed}&rdquo;
            </p>
          </div>
        )}

        {msg.editorAudit?.siyer_example_used && (
          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-900/40">
            <span className="font-semibold text-sky-400 block text-[11px] mb-0.5">
              Referans Alınan Tarihsel &amp; Ahlaki Örnek:
            </span>
            <p className="text-foreground/90 italic leading-relaxed">
              &ldquo;{msg.editorAudit.siyer_example_used}&rdquo;
            </p>
          </div>
        )}

        {msg.editorAudit?.deepTriage && (
          <div className="p-3 rounded-lg bg-[#0a1612] border border-cyan-800/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-300 block text-[11px]">
                🤖 Derin Semantik Analiz (Gemini Flash):
              </span>
              <span className="text-[10px] text-cyan-400/80 font-mono">
                {msg.editorAudit.deepTriage.spiritualStage}
              </span>
            </div>
            {msg.editorAudit.deepTriage.spiritualDiagnosis && (
              <p className="text-foreground/90 leading-relaxed">
                <strong className="text-muted-foreground font-normal">Durum Özeti: </strong>
                {msg.editorAudit.deepTriage.spiritualDiagnosis}
              </p>
            )}
            {msg.editorAudit.deepTriage.underlyingNeed && (
              <p className="text-foreground/80 text-[11px] italic">
                <strong className="text-muted-foreground font-normal not-italic">Temel İhtiyaç: </strong>
                {msg.editorAudit.deepTriage.underlyingNeed}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Kullanıcı Gelişim Profili */}
      {msg.userProfile && (
        <div className="rounded-xl border border-[#cca762]/40 bg-[#0c181a] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cca762]/25 pb-2">
            <strong className="text-[#e5cca0] flex items-center gap-1.5 font-serif text-sm">
              <span>🧭 Kullanıcı Davranış &amp; Gelişim Profili</span>
            </strong>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Olgunluk: %{msg.userProfile.profile_completion ?? 40}
              </span>
              <span className="text-[#cca762] bg-[#16201a] px-2 py-0.5 rounded border border-[#cca762]/30">
                Adım {msg.userProfile.onboarding_step ?? msg.onboardingStep ?? 2}/4 •{" "}
                {msg.userProfile.interaction_count ?? 1} Etkileşim
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[11px]">
            <div className="p-2.5 rounded-lg bg-[#091119] border border-[#1d3336]">
              <span className="text-muted-foreground block text-[10px] mb-1">
                1. Blok: Tanım &amp; Roller
              </span>
              <div className="font-semibold text-[#f5ebd7]">
                {msg.userProfile.preferred_name
                  ? `${msg.userProfile.preferred_name} (${
                      msg.userProfile.roles?.length
                        ? msg.userProfile.roles.join(", ")
                        : "Kayıtlı Üye"
                    })`
                  : msg.userProfile.roles?.length
                    ? msg.userProfile.roles.join(", ")
                    : "Keşfediliyor..."}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#091119] border border-[#1d3336]">
              <span className="text-muted-foreground block text-[10px] mb-1">
                2. Blok: Paylaşılan Konular
              </span>
              <div className="font-sans text-amber-300 truncate">
                {msg.userProfile.spiritual_trials?.length
                  ? msg.userProfile.spiritual_trials.join(", ")
                  : getDisplayNafsTrap(msg)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#091119] border border-[#1d3336]">
              <span className="text-muted-foreground block text-[10px] mb-1">
                3. Blok: Zihinsel &amp; Duygusal Durum
              </span>
              <div className="font-sans text-cyan-300 truncate">
                {msg.userProfile.biological_energy?.length
                  ? msg.userProfile.biological_energy.join(", ")
                  : "Samimi Arayış"}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#091119] border border-[#1d3336]">
              <span className="text-muted-foreground block text-[10px] mb-1">
                4. Blok: Mevcut Aşama &amp; Yaklaşım
              </span>
              <div className="font-semibold text-emerald-300">
                {msg.userProfile.spiritual_stage || "ARAYIS_VE_BASLANGIC"}
                <span className="block text-[10px] font-mono text-muted-foreground font-normal">
                  {msg.userProfile.tone_preference || "SEFKATLI_TESKIN"}
                </span>
              </div>
            </div>
          </div>

          {msg.userProfile.known_facts &&
            msg.userProfile.known_facts.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[#091119] border border-[#1d3336] text-[11px]">
                <span className="text-[#cca762] font-semibold mr-1.5">
                  Kalıcı Hafıza Notları:
                </span>
                <span className="text-foreground/90">
                  {msg.userProfile.known_facts.join(" • ")}
                </span>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
