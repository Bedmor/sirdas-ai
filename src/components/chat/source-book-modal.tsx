"use client";

import React, { useState, useEffect } from "react";
import type {
  BookSourceDetail,
  QuranBookDetail,
  HadithBookDetail,
  SiyerBookDetail,
  HalisAydemirBookDetail,
  GenericBookDetail,
} from "@/lib/knowledge/source-resolver";

export interface SourceBookModalProps {
  source: {
    id: string;
    sourceType: string;
    sourceTitle: string;
    content?: string;
    audioUrl?: string | null;
  } | null;
  onClose: () => void;
}

type TabType = "all" | "arabic" | "meal" | "tefsir";

export function SourceBookModal({ source, onClose }: SourceBookModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [detail, setDetail] = useState<BookSourceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">("large");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchDetail = async () => {
      try {
        const queryParams = new URLSearchParams({
          id: source.id,
          title: source.sourceTitle,
          sourceType: source.sourceType,
          content: source.content || "",
        });
        if (source.audioUrl) {
          queryParams.set("audioUrl", source.audioUrl);
        }

        const res = await fetch(`/api/knowledge/detail?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Detay yüklenemedi");
        const json = await res.json();
        if (isMounted && json.success && json.detail) {
          setDetail(json.detail);
        }
      } catch (err) {
        console.warn("[SourceBookModal fetch fallback]", err);
        if (isMounted) {
          // Graceful fallback if network fails
          setDetail({
            kind: "GENERIC",
            title: source.sourceTitle,
            sourceType: source.sourceType,
            content: source.content || "",
            audioUrl: source.audioUrl,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [source]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!source) return null;

  const handleCopy = async (text: string, sectionKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(null), 2200);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const getArabicFontSize = () => {
    switch (fontSizeLevel) {
      case "normal":
        return "text-xl sm:text-2xl leading-[2]";
      case "xlarge":
        return "text-3xl sm:text-4xl leading-[2.5]";
      case "large":
      default:
        return "text-2xl sm:text-3xl leading-[2.2]";
    }
  };

  const isQuran = detail?.kind === "QURAN";
  const quranDetail = isQuran ? (detail as QuranBookDetail) : null;
  const hadithDetail = detail?.kind === "HADITH" ? (detail as HadithBookDetail) : null;
  const siyerDetail = detail?.kind === "SIYER" ? (detail as SiyerBookDetail) : null;
  const halisDetail = detail?.kind === "HALIS_AYDEMIR" ? (detail as HalisAydemirBookDetail) : null;
  const genericDetail = detail?.kind === "GENERIC" ? (detail as GenericBookDetail) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-book-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[36px] bg-surface-container-high border border-outline-variant/60 shadow-m3-5 overflow-hidden animate-m3e-spring">
        {/* Book Header / Top Bar (M3 App Bar) */}
        <div className="relative px-6 py-4 border-b border-outline-variant/40 bg-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container border border-secondary/30 text-lg shadow-xs">
              {isQuran ? "📖" : hadithDetail ? "📜" : siyerDetail ? "🧭" : "💡"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {isQuran
                    ? "Mushaf-ı Şerîf & Tefsîr Kitabı"
                    : hadithDetail
                    ? "Sahih Hadis Kütüphanesi"
                    : siyerDetail
                    ? "Siyer-i Nebî Kroniği"
                    : "Hikmet Kaynağı"}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-secondary-container text-on-secondary-container border border-secondary/30">
                  Çelik Kasa RAG Sahih Mührü
                </span>
              </div>
              <h2
                id="source-book-modal-title"
                className="text-base sm:text-lg font-heading font-medium text-on-surface line-clamp-1"
              >
                {detail?.title || source.sourceTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size Zoom for reading comfort */}
            {isQuran && (
              <div className="hidden sm:flex items-center bg-surface-container-highest rounded-full border border-outline-variant/50 p-0.5 text-xs">
                <button
                  type="button"
                  title="Yazı boyutunu küçült"
                  onClick={() => setFontSizeLevel("normal")}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    fontSizeLevel === "normal"
                      ? "bg-primary text-on-primary font-bold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  title="Normal yazı boyutu"
                  onClick={() => setFontSizeLevel("large")}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    fontSizeLevel === "large"
                      ? "bg-primary text-on-primary font-bold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  title="Yazı boyutunu büyüt"
                  onClick={() => setFontSizeLevel("xlarge")}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    fontSizeLevel === "xlarge"
                      ? "bg-primary text-on-primary font-bold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  A+
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="rounded-full p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200 ease-m3e-spring-bouncy hover:scale-110 active:scale-90 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Mushaf / Meâl / Tefsir / Tam Sayfa) (M3 Primary Tabs) */}
        {(isQuran || hadithDetail) && (
          <div className="px-6 py-2.5 bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-primary text-on-primary shadow-m3-1 font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                🌟 Kitap Sayfası (Kombine)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("arabic")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "arabic"
                    ? "bg-primary text-on-primary shadow-m3-1 font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                {isQuran ? "📖 Mushaf (Arapça)" : "📜 Hadis-i Şerîf (Arapça)"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("meal")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "meal"
                    ? "bg-primary text-on-primary shadow-m3-1 font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                {isQuran ? "📜 Meâl-i Şerîf" : "📖 Tercüme-i Âlî"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tefsir")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "tefsir"
                    ? "bg-primary text-on-primary shadow-m3-1 font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                {isQuran ? "💡 Tefsîr & Nüzûl Hikmeti" : "💡 Esbâb-ı Vürûd & Şerh"}
              </button>
            </div>

            {quranDetail && (
              <div className="hidden md:flex items-center gap-3 text-[11px] text-on-surface-variant">
                <span>{quranDetail.revelationPlaceTr}</span>
                <span>•</span>
                <span>{quranDetail.versesRange}</span>
                {quranDetail.juzNumber && (
                  <>
                    <span>•</span>
                    <span>{quranDetail.juzNumber}. Cüz</span>
                  </>
                )}
              </div>
            )}

            {hadithDetail && (
              <div className="hidden md:flex items-center gap-2.5 text-[11px] text-on-surface-variant">
                {hadithDetail.ravi && (
                  <span className="text-primary font-medium">
                    Râvi: {hadithDetail.ravi}
                  </span>
                )}
                <span>•</span>
                <span>{hadithDetail.sahihlikDerecesi}</span>
              </div>
            )}
          </div>
        )}

        {/* Book Body (Scrollable Container) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 bg-surface-container-lowest custom-scrollbar">
          {isLoading && !detail ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-block animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-primary font-medium tracking-wide">
                Çelik Kasa Sahih Mushaf Kitabı Açılıyor...
              </p>
            </div>
          ) : isQuran && quranDetail ? (
            /* ============================================================== */
            /* 1. QURAN BOOK PRESENTATION                                      */
            /* ============================================================== */
            <div className="space-y-6">
              {/* Surah Illuminated Banner */}
              <div className="rounded-2xl bg-gradient-to-b from-surface-container to-surface-container-low border border-primary/35 p-5 text-center relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
                
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-xs text-primary">
                  <span className="font-semibold uppercase tracking-widest">
                    {quranDetail.surahNumber}. Sure: {quranDetail.surahNameTr} Suresi
                  </span>
                  <span>•</span>
                  <span>{quranDetail.revelationPlaceTr}</span>
                  <span>•</span>
                  <span>Toplam {quranDetail.totalVersesInSurah} Âyet</span>
                </div>

                {/* Surah Arabic Calligraphy Title */}
                <h3 className="text-2xl sm:text-3xl font-arabic text-primary-fixed-dim my-1 tracking-normal" dir="rtl" lang="ar">
                  {quranDetail.surahNameAr}
                </h3>

                {/* Bismillah (Except Surah 9 / Tevbe) */}
                {quranDetail.surahNumber !== 9 && (
                  <p
                    dir="rtl"
                    lang="ar"
                    className="font-arabic text-xl sm:text-2xl text-primary-fixed-dim pt-2 tracking-normal select-none"
                  >
                    {quranDetail.bismillahArabic}
                  </p>
                )}
              </div>

              {/* Audio Recitation (if available) */}
              {quranDetail.audioUrl && (
                <div className="rounded-xl bg-surface-container border border-primary/30 p-3.5 flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-primary font-medium">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Sesli Kıraat / Tefekkür Dinletisi
                    </span>
                  </div>
                  <audio className="w-full h-9 rounded" controls preload="auto" src={quranDetail.audioUrl}>
                    Tarayıcınız ses oynatmayı desteklemiyor.
                  </audio>
                </div>
              )}

              {/* SECTION A: ARABIC MUSHAF VIEW */}
              {(activeTab === "all" || activeTab === "arabic") && (
                <div className="rounded-2xl bg-surface-container-lowest border-2 border-primary/30 p-5 sm:p-7 shadow-xl relative">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Mushaf-ı Şerîf Hattı (Arapça Lafız)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(quranDetail.combinedArabic, "arabic")}
                      className="text-xs text-primary hover:text-primary-fixed-dim transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      {copiedSection === "arabic" ? "✓ Kopyalandı" : "Metni Kopyala"}
                    </button>
                  </div>

                  <div
                    dir="rtl"
                    lang="ar"
                    className={`font-arabic text-primary-fixed-dim text-right select-text tracking-normal ${getArabicFontSize()}`}
                  >
                    {quranDetail.verses.map((v) => (
                      <span key={v.number} className="inline">
                        <span className="leading-loose">{v.arabic}</span>
                        <span
                          className="inline-flex items-center justify-center mx-2 px-2.5 py-0.5 rounded-full border border-primary/70 bg-primary/20 text-primary-fixed-dim text-xs sm:text-sm font-sans font-bold select-none align-middle shadow-xs"
                          dir="ltr"
                          title={`${v.number}. Âyet`}
                        >
                          {v.number}
                        </span>
                        {" "}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION B: TURKISH MEAL VIEW */}
              {(activeTab === "all" || activeTab === "meal") && (
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-5 sm:p-7 shadow-md">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-on-secondary-container">
                        Türkçe Meâl-i Âlîsi (Kelime ve Cümle Anlamı)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(quranDetail.combinedMeal, "meal")}
                      className="text-xs text-on-secondary-container hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      {copiedSection === "meal" ? "✓ Kopyalandı" : "Meâli Kopyala"}
                    </button>
                  </div>

                  <div className="space-y-3.5 text-on-surface leading-relaxed text-[15px] sm:text-base select-text">
                    {quranDetail.verses.map((v) => (
                      <div key={v.number} className="flex gap-2.5 items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-surface-container-high border border-outline-variant text-[11px] font-bold text-primary shrink-0 mt-0.5">
                          {v.number}
                        </span>
                        <p className="italic text-on-surface">
                          &ldquo;{v.translation}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION C: TEFSIR & NUZUL & HIKMET VIEW */}
              {(activeTab === "all" || activeTab === "tefsir") && (
                <div className="rounded-2xl bg-surface-container-low border border-primary/30 p-5 sm:p-7 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Tefsîr-i Şerîf & Esbâb-ı Nüzûl İzahı
                      </h4>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">
                      {quranDetail.tefsir.kaynak}
                    </span>
                  </div>

                  {/* Nüzul Sebebi Context (If exists) */}
                  {quranDetail.tefsir.nuzulSebebi && (
                    <div className="rounded-xl bg-surface-container border border-outline-variant p-4 text-xs leading-relaxed text-on-surface-variant">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Esbâb-ı Nüzûl (Âyetin İniş Hadisesi):
                      </div>
                      <p className="text-on-surface">{quranDetail.tefsir.nuzulSebebi}</p>
                    </div>
                  )}

                  {/* Classical Commentary */}
                  <div className="text-[14px] sm:text-[15px] leading-relaxed text-on-surface space-y-3 select-text">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Müfessirun İzahı ve Şerh:
                    </div>
                    {quranDetail.tefsir.tefsirMetni.split(/\n{2,}|\n/).map((paragraph, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>

                  {/* Manevi Hikmet / İkaz Box */}
                  {quranDetail.tefsir.maneviHikmet && (
                    <div className="rounded-xl bg-surface-container-high border border-primary/30 p-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                        <span>💡</span>
                        <span>Manevî Hikmet & Nefis Tezkiyesi Dersi:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed italic">
                        {quranDetail.tefsir.maneviHikmet}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : hadithDetail ? (
            /* ============================================================== */
            /* 2. HADITH BOOK PRESENTATION                                     */
            /* ============================================================== */
            <div className="space-y-6">
              {/* Hadith Top Header */}
              <div className="rounded-2xl bg-gradient-to-b from-surface-container to-surface-container-low border border-primary/35 p-5 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-xs">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30">
                    {hadithDetail.sahihlikDerecesi}
                  </span>
                  {hadithDetail.ravi && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                      Râvi: {hadithDetail.ravi}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-semibold text-on-surface">
                  {hadithDetail.kaynak}
                </h3>
                {hadithDetail.kitapBolumu && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    {hadithDetail.kitapBolumu} {hadithDetail.babNo ? `• Bab ${hadithDetail.babNo}` : ""}
                  </p>
                )}
              </div>

              {/* SECTION A: ARABIC HADITH TEXT */}
              {(activeTab === "all" || activeTab === "arabic") && hadithDetail.arabicText && (
                <div className="rounded-2xl bg-surface-container-lowest border-2 border-primary/30 p-5 sm:p-7 shadow-xl">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Lafz-ı Hadis (Arapça Metin)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(hadithDetail.arabicText || "", "hadith-arabic")}
                      className="text-xs text-primary hover:text-primary-fixed-dim transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      {copiedSection === "hadith-arabic" ? "✓ Kopyalandı" : "Metni Kopyala"}
                    </button>
                  </div>
                  <div
                    dir="rtl"
                    lang="ar"
                    className={`font-arabic text-primary-fixed-dim text-right select-text tracking-normal ${getArabicFontSize()}`}
                  >
                    {hadithDetail.arabicText}
                  </div>
                </div>
              )}

              {/* SECTION B: TURKISH TRANSLATION & RAVI */}
              {(activeTab === "all" || activeTab === "meal") && (
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-5 sm:p-7 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-on-secondary-container">
                        Türkçe Tercüme-i Şerîf
                      </h4>
                    </div>
                    {hadithDetail.ravi && (
                      <span className="text-xs text-primary font-medium">
                        Râvi: {hadithDetail.ravi}
                      </span>
                    )}
                  </div>
                  <blockquote className="text-[15px] sm:text-base text-on-surface italic leading-relaxed border-l-2 border-primary pl-4 select-text">
                    &ldquo;{hadithDetail.turkishMeal}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* SECTION C: ESBAB-I VURUD & KLASIK SERH */}
              {(activeTab === "all" || activeTab === "tefsir") && (
                <div className="rounded-2xl bg-surface-container-low border border-primary/30 p-5 sm:p-7 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Esbâb-ı Vürûd & Hadis Şerhi
                      </h4>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">
                      Kütüb-i Sitte & İmam Nevevî Şerhi
                    </span>
                  </div>

                  {/* Esbâb-ı Vürûd (Hadisin İrad Buyrulma Hadisesi) */}
                  {hadithDetail.esbabIVurud && (
                    <div className="rounded-xl bg-surface-container border border-outline-variant p-4 text-xs leading-relaxed text-on-surface-variant">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Esbâb-ı Vürûd (Hadisin Söyleniş Hadisesi / Bağlamı):
                      </div>
                      <p className="text-on-surface">{hadithDetail.esbabIVurud}</p>
                    </div>
                  )}

                  {/* Classical Hadith Commentary */}
                  {hadithDetail.serh && (
                    <div className="text-[14px] sm:text-[15px] leading-relaxed text-on-surface space-y-2 select-text">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Muhaddisîn Tahlili ve Şerh:
                      </div>
                      <p className="leading-relaxed">{hadithDetail.serh}</p>
                    </div>
                  )}

                  {/* Manevi Hikmet / Amel Dersi */}
                  {hadithDetail.maneviHikmet && (
                    <div className="rounded-xl bg-surface-container-high border border-primary/30 p-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                        <span>💡</span>
                        <span>Manevî Hikmet & Kalp Ameli Dersi:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed italic">
                        {hadithDetail.maneviHikmet}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : siyerDetail ? (
            /* ============================================================== */
            /* 3. SIYER BOOK PRESENTATION                                      */
            /* ============================================================== */
            <div className="space-y-6">
              <div className="rounded-2xl bg-surface-container border border-primary/30 p-5 text-center">
                <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                  {siyerDetail.donem}
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-semibold text-on-surface mt-1">
                  {siyerDetail.olayAdi}
                </h3>
              </div>

              <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-6 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Tarihî Sahne & Nebevî Hadise:
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-on-surface select-text">
                  {siyerDetail.ozetMetin}
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container-low border border-primary/30 p-6 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">
                  Müminin Çıkaracağı İbret & Teselli:
                </div>
                <p className="text-sm leading-relaxed text-on-surface italic">
                  {siyerDetail.maneviHikmet}
                </p>
              </div>
            </div>
          ) : halisDetail ? (
            /* ============================================================== */
            /* 4. HALIS AYDEMIR SOHBET PRESENTATION                            */
            /* ============================================================== */
            <div className="space-y-6">
              <div className="rounded-2xl bg-surface-container border border-primary/30 p-5 text-center">
                <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                  Dr. Halis Aydemir • Tefekkür Sohbeti
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-semibold text-on-surface mt-1">
                  {halisDetail.sohbetKonusu}
                </h3>
              </div>

              {halisDetail.audioUrl && (
                <div className="rounded-xl bg-surface-container border border-primary/30 p-4 space-y-2">
                  <div className="text-xs font-medium text-primary flex items-center gap-1.5">
                    <span>🎙️</span>
                    <span>Sesli Sohbet Kesiti Dinle:</span>
                  </div>
                  <audio className="w-full h-10 rounded" controls preload="auto" src={halisDetail.audioUrl}>
                    Tarayıcınız ses oynatmayı desteklemiyor.
                  </audio>
                </div>
              )}

              <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-6 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Sohbet Deşifresi ve Tefekkür Metni:
                </div>
                <div className="text-sm sm:text-base leading-relaxed text-on-surface select-text space-y-2.5">
                  {halisDetail.desifreMetni.split(/\n+/).map((line, idx) => (
                    <p key={idx}>{line.trim()}</p>
                  ))}
                </div>
              </div>

              {halisDetail.maneviMesaj && (
                <div className="rounded-xl bg-surface-container-low border border-primary/30 p-4 text-xs text-primary italic">
                  💡 {halisDetail.maneviMesaj}
                </div>
              )}
            </div>
          ) : (
            /* ============================================================== */
            /* 5. GENERIC FALLBACK                                             */
            /* ============================================================== */
            <div className="space-y-4">
              <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-6">
                <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">
                  {genericDetail?.sourceType || "KAYNAK METNİ"}
                </div>
                <p className="text-sm leading-relaxed text-on-surface">
                  {genericDetail?.content || source.content}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Security / Authenticity Seal */}
          <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high p-3.5 flex items-center gap-3 text-xs text-on-surface-variant">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>
              Çelik Kasa RAG Sahih Kaynak Mührü: Metinler, Kur&apos;ân-ı Kerîm lafzına ve Kütüb-i Sitte rivayetlerine harfiyen mutabık olarak mühürlenmiştir.
            </span>
          </div>
        </div>

        {/* Book Footer / Action Bar */}
        <div className="px-5 py-3.5 border-t border-primary/30 bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!detail) return;
              let fullText = `${detail.title}\n\n`;
              if (detail.kind === "QURAN") {
                fullText += `[Arapça Lafız]\n${detail.combinedArabic}\n\n[Meâl]\n${detail.combinedMeal}\n\n[Tefsir]\n${detail.tefsir.tefsirMetni}`;
              } else if (detail.kind === "HADITH") {
                fullText += `${detail.ravi ? `[Râvi: ${detail.ravi}]\n` : ""}${detail.arabicText ? detail.arabicText + "\n\n" : ""}[Tercüme]\n${detail.turkishMeal}\n\n${detail.esbabIVurud ? `[Esbâb-ı Vürûd]\n${detail.esbabIVurud}\n\n` : ""}${detail.serh ? `[Hadis Şerhi]\n${detail.serh}\n\n` : ""}${detail.maneviHikmet ? `[Manevî Hikmet]\n${detail.maneviHikmet}\n\n` : ""}(${detail.kaynak})`;
              } else if (detail.kind === "SIYER") {
                fullText += `${detail.ozetMetin}\n\n${detail.maneviHikmet}`;
              } else if (detail.kind === "HALIS_AYDEMIR") {
                fullText += detail.desifreMetni;
              } else {
                fullText += detail.content;
              }
              handleCopy(fullText, "all");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/15 transition-colors border border-primary/35 cursor-pointer"
          >
            {copiedSection === "all" ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">Tüm Sayfa Kopyalandı!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Tüm Kitap Sayfasını Kopyala</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-semibold px-5 py-2 text-xs transition-colors cursor-pointer shadow-md active:scale-95"
          >
            Kitabı Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
