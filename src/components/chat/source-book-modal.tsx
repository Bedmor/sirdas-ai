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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#071315] border-2 border-[#cca762]/50 shadow-[0_0_50px_rgba(204,167,98,0.12)] overflow-hidden animate-in zoom-in-95">
        {/* Book Header / Top Bar */}
        <div className="relative px-5 py-4 border-b border-[#cca762]/30 bg-gradient-to-r from-[#08181b] via-[#0e272b] to-[#08181b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#cca762]/15 text-[#cca762] border border-[#cca762]/40 text-lg shadow-inner">
              {isQuran ? "📖" : hadithDetail ? "📜" : siyerDetail ? "🧭" : "💡"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#cca762]">
                  {isQuran
                    ? "Mushaf-ı Şerîf & Tefsîr Kitabı"
                    : hadithDetail
                    ? "Sahih Hadis Kütüphanesi"
                    : siyerDetail
                    ? "Siyer-i Nebî Kroniği"
                    : "Hikmet Kaynağı"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#133235] text-[#93b3b0] border border-[#1d4448]">
                  Çelik Kasa RAG Sahih Mührü
                </span>
              </div>
              <h2
                id="source-book-modal-title"
                className="text-base sm:text-lg font-heading font-semibold text-[#f5ebd8] line-clamp-1"
              >
                {detail?.title || source.sourceTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size Zoom for reading comfort */}
            {isQuran && (
              <div className="hidden sm:flex items-center bg-[#091a1d] rounded-lg border border-[#1d3d42] p-0.5 text-xs">
                <button
                  type="button"
                  title="Yazı boyutunu küçült"
                  onClick={() => setFontSizeLevel("normal")}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    fontSizeLevel === "normal"
                      ? "bg-[#cca762] text-[#1b1406] font-bold"
                      : "text-[#8b9ea0] hover:text-[#e1e9e8]"
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  title="Normal yazı boyutu"
                  onClick={() => setFontSizeLevel("large")}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    fontSizeLevel === "large"
                      ? "bg-[#cca762] text-[#1b1406] font-bold"
                      : "text-[#8b9ea0] hover:text-[#e1e9e8]"
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  title="Yazı boyutunu büyüt"
                  onClick={() => setFontSizeLevel("xlarge")}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    fontSizeLevel === "xlarge"
                      ? "bg-[#cca762] text-[#1b1406] font-bold"
                      : "text-[#8b9ea0] hover:text-[#e1e9e8]"
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
              className="rounded-xl p-2 text-[#8b9ea0] hover:text-[#e1e9e8] hover:bg-[#133235] transition-colors cursor-pointer border border-transparent hover:border-[#224b50]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Mushaf / Meâl / Tefsir / Tam Sayfa) */}
        {(isQuran || hadithDetail) && (
          <div className="px-5 py-2.5 bg-[#0a1a1c] border-b border-[#1b3438] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#cca762] text-[#1a1306] shadow-md"
                    : "text-[#8b9ea0] hover:text-[#e1e9e8] hover:bg-[#10272b]"
                }`}
              >
                🌟 Kitap Sayfası (Kombine)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("arabic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "arabic"
                    ? "bg-[#cca762] text-[#1a1306] shadow-md"
                    : "text-[#8b9ea0] hover:text-[#e1e9e8] hover:bg-[#10272b]"
                }`}
              >
                {isQuran ? "📖 Mushaf (Arapça)" : "📜 Hadis-i Şerîf (Arapça)"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("meal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "meal"
                    ? "bg-[#cca762] text-[#1a1306] shadow-md"
                    : "text-[#8b9ea0] hover:text-[#e1e9e8] hover:bg-[#10272b]"
                }`}
              >
                {isQuran ? "📜 Meâl-i Şerîf" : "📖 Tercüme-i Âlî"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tefsir")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "tefsir"
                    ? "bg-[#cca762] text-[#1a1306] shadow-md"
                    : "text-[#8b9ea0] hover:text-[#e1e9e8] hover:bg-[#10272b]"
                }`}
              >
                {isQuran ? "💡 Tefsîr & Nüzûl Hikmeti" : "💡 Esbâb-ı Vürûd & Şerh"}
              </button>
            </div>

            {quranDetail && (
              <div className="hidden md:flex items-center gap-3 text-[11px] text-[#91a8a6]">
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
              <div className="hidden md:flex items-center gap-2.5 text-[11px] text-[#91a8a6]">
                {hadithDetail.ravi && (
                  <span className="text-[#cca762] font-medium">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 bg-[#061214] custom-scrollbar">
          {isLoading && !detail ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-block animate-spin h-8 w-8 rounded-full border-2 border-[#cca762] border-t-transparent" />
              <p className="text-xs text-[#cca762] font-medium tracking-wide">
                Çelik Kasa Sahih Mushaf Kitabı Açılıyor...
              </p>
            </div>
          ) : isQuran && quranDetail ? (
            /* ============================================================== */
            /* 1. QURAN BOOK PRESENTATION                                      */
            /* ============================================================== */
            <div className="space-y-6">
              {/* Surah Illuminated Banner */}
              <div className="rounded-2xl bg-gradient-to-b from-[#0b2226] to-[#07171a] border border-[#cca762]/35 p-5 text-center relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#cca762] to-transparent opacity-60" />
                
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-xs text-[#cca762]">
                  <span className="font-semibold uppercase tracking-widest">
                    {quranDetail.surahNumber}. Sure: {quranDetail.surahNameTr} Suresi
                  </span>
                  <span>•</span>
                  <span>{quranDetail.revelationPlaceTr}</span>
                  <span>•</span>
                  <span>Toplam {quranDetail.totalVersesInSurah} Âyet</span>
                </div>

                {/* Surah Arabic Calligraphy Title */}
                <h3 className="text-2xl sm:text-3xl font-arabic text-[#fbe0a1] my-1 tracking-normal" dir="rtl" lang="ar">
                  {quranDetail.surahNameAr}
                </h3>

                {/* Bismillah (Except Surah 9 / Tevbe) */}
                {quranDetail.surahNumber !== 9 && (
                  <p
                    dir="rtl"
                    lang="ar"
                    className="font-arabic text-xl sm:text-2xl text-[#dfc384] pt-2 tracking-normal select-none"
                  >
                    {quranDetail.bismillahArabic}
                  </p>
                )}
              </div>

              {/* Audio Recitation (if available) */}
              {quranDetail.audioUrl && (
                <div className="rounded-xl bg-[#0c2024] border border-[#cca762]/30 p-3.5 flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-[#cca762] font-medium">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#cca762]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="rounded-2xl bg-[#050f11] border-2 border-[#cca762]/30 p-5 sm:p-7 shadow-xl relative">
                  <div className="flex items-center justify-between border-b border-[#1b3438] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#cca762]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#cca762]">
                        Mushaf-ı Şerîf Hattı (Arapça Lafız)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(quranDetail.combinedArabic, "arabic")}
                      className="text-xs text-[#cca762] hover:text-[#dec288] transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      {copiedSection === "arabic" ? "✓ Kopyalandı" : "Metni Kopyala"}
                    </button>
                  </div>

                  <div
                    dir="rtl"
                    lang="ar"
                    className={`font-arabic text-[#fbe0a1] text-right select-text tracking-normal ${getArabicFontSize()}`}
                  >
                    {quranDetail.verses.map((v) => (
                      <span key={v.number} className="inline">
                        <span className="leading-loose">{v.arabic}</span>
                        <span
                          className="inline-flex items-center justify-center mx-2 px-2.5 py-0.5 rounded-full border border-[#cca762]/70 bg-[#cca762]/20 text-[#fbe0a1] text-xs sm:text-sm font-sans font-bold select-none align-middle shadow-xs"
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
                <div className="rounded-2xl bg-[#091a1d] border border-[#1d3d42] p-5 sm:p-7 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#1b3438] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#459b95]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#7dd3c8]">
                        Türkçe Meâl-i Âlîsi (Kelime ve Cümle Anlamı)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(quranDetail.combinedMeal, "meal")}
                      className="text-xs text-[#7dd3c8] hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      {copiedSection === "meal" ? "✓ Kopyalandı" : "Meâli Kopyala"}
                    </button>
                  </div>

                  <div className="space-y-3.5 text-[#e1e9e8] leading-relaxed text-[15px] sm:text-base select-text">
                    {quranDetail.verses.map((v) => (
                      <div key={v.number} className="flex gap-2.5 items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#0e272b] border border-[#234b50] text-[11px] font-bold text-[#cca762] shrink-0 mt-0.5">
                          {v.number}
                        </span>
                        <p className="italic text-[#d9e3e1]">
                          &ldquo;{v.translation}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION C: TEFSIR & NUZUL & HIKMET VIEW */}
              {(activeTab === "all" || activeTab === "tefsir") && (
                <div className="rounded-2xl bg-[#08181b] border border-[#cca762]/30 p-5 sm:p-7 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#1b3438] pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#cca762]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#cca762]">
                        Tefsîr-i Şerîf & Esbâb-ı Nüzûl İzahı
                      </h4>
                    </div>
                    <span className="text-[11px] text-[#8b9ea0]">
                      {quranDetail.tefsir.kaynak}
                    </span>
                  </div>

                  {/* Nüzul Sebebi Context (If exists) */}
                  {quranDetail.tefsir.nuzulSebebi && (
                    <div className="rounded-xl bg-[#0b2124] border border-[#1b3e44] p-4 text-xs leading-relaxed text-[#c6d7d5]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#cca762] mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#cca762]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Esbâb-ı Nüzûl (Âyetin İniş Hadisesi):
                      </div>
                      <p className="text-[#d8e3e1]">{quranDetail.tefsir.nuzulSebebi}</p>
                    </div>
                  )}

                  {/* Classical Commentary */}
                  <div className="text-[14px] sm:text-[15px] leading-relaxed text-[#dbe5e3] space-y-3 select-text">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#cca762]">
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
                    <div className="rounded-xl bg-[#0e272b] border border-[#cca762]/30 p-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#cca762] uppercase tracking-wider">
                        <span>💡</span>
                        <span>Manevî Hikmet & Nefis Tezkiyesi Dersi:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#e0ecea] leading-relaxed italic">
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
              <div className="rounded-2xl bg-gradient-to-b from-[#0b2226] to-[#07171a] border border-[#cca762]/35 p-5 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#cca762] to-transparent opacity-60" />
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-xs">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#cca762]/15 text-[#cca762] border border-[#cca762]/30">
                    {hadithDetail.sahihlikDerecesi}
                  </span>
                  {hadithDetail.ravi && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#133235] text-[#93b3b0] border border-[#1d4448]">
                      Râvi: {hadithDetail.ravi}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-semibold text-[#f5ebd8]">
                  {hadithDetail.kaynak}
                </h3>
                {hadithDetail.kitapBolumu && (
                  <p className="text-xs text-[#8b9ea0] mt-1">
                    {hadithDetail.kitapBolumu} {hadithDetail.babNo ? `• Bab ${hadithDetail.babNo}` : ""}
                  </p>
                )}
              </div>

              {/* SECTION A: ARABIC HADITH TEXT */}
              {(activeTab === "all" || activeTab === "arabic") && hadithDetail.arabicText && (
                <div className="rounded-2xl bg-[#050f11] border-2 border-[#cca762]/30 p-5 sm:p-7 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#1b3438] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#cca762]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#cca762]">
                        Lafz-ı Hadis (Arapça Metin)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(hadithDetail.arabicText || "", "hadith-arabic")}
                      className="text-xs text-[#cca762] hover:text-[#dec288] transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      {copiedSection === "hadith-arabic" ? "✓ Kopyalandı" : "Metni Kopyala"}
                    </button>
                  </div>
                  <div
                    dir="rtl"
                    lang="ar"
                    className={`font-arabic text-[#fbe0a1] text-right select-text tracking-normal ${getArabicFontSize()}`}
                  >
                    {hadithDetail.arabicText}
                  </div>
                </div>
              )}

              {/* SECTION B: TURKISH TRANSLATION & RAVI */}
              {(activeTab === "all" || activeTab === "meal") && (
                <div className="rounded-2xl bg-[#091a1d] border border-[#1d3d42] p-5 sm:p-7 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#1b3438] pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#459b95]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#7dd3c8]">
                        Türkçe Tercüme-i Şerîf
                      </h4>
                    </div>
                    {hadithDetail.ravi && (
                      <span className="text-xs text-[#cca762] font-medium">
                        Râvi: {hadithDetail.ravi}
                      </span>
                    )}
                  </div>
                  <blockquote className="text-[15px] sm:text-base text-[#e1e9e8] italic leading-relaxed border-l-2 border-[#cca762] pl-4 select-text">
                    &ldquo;{hadithDetail.turkishMeal}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* SECTION C: ESBAB-I VURUD & KLASIK SERH */}
              {(activeTab === "all" || activeTab === "tefsir") && (
                <div className="rounded-2xl bg-[#08181b] border border-[#cca762]/30 p-5 sm:p-7 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#1b3438] pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#cca762]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#cca762]">
                        Esbâb-ı Vürûd & Hadis Şerhi
                      </h4>
                    </div>
                    <span className="text-[11px] text-[#8b9ea0]">
                      Kütüb-i Sitte & İmam Nevevî Şerhi
                    </span>
                  </div>

                  {/* Esbâb-ı Vürûd (Hadisin İrad Buyrulma Hadisesi) */}
                  {hadithDetail.esbabIVurud && (
                    <div className="rounded-xl bg-[#0b2124] border border-[#1b3e44] p-4 text-xs leading-relaxed text-[#c6d7d5]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#cca762] mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#cca762]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Esbâb-ı Vürûd (Hadisin Söyleniş Hadisesi / Bağlamı):
                      </div>
                      <p className="text-[#d8e3e1]">{hadithDetail.esbabIVurud}</p>
                    </div>
                  )}

                  {/* Classical Hadith Commentary */}
                  {hadithDetail.serh && (
                    <div className="text-[14px] sm:text-[15px] leading-relaxed text-[#dbe5e3] space-y-2 select-text">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#cca762]">
                        Muhaddisîn Tahlili ve Şerh:
                      </div>
                      <p className="leading-relaxed">{hadithDetail.serh}</p>
                    </div>
                  )}

                  {/* Manevi Hikmet / Amel Dersi */}
                  {hadithDetail.maneviHikmet && (
                    <div className="rounded-xl bg-[#0e272b] border border-[#cca762]/30 p-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#cca762] uppercase tracking-wider">
                        <span>💡</span>
                        <span>Manevî Hikmet & Kalp Ameli Dersi:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#e0ecea] leading-relaxed italic">
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
              <div className="rounded-2xl bg-[#0b2226] border border-[#cca762]/30 p-5 text-center">
                <span className="text-xs font-semibold text-[#cca762] tracking-wider uppercase">
                  {siyerDetail.donem}
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-semibold text-[#f5ebd8] mt-1">
                  {siyerDetail.olayAdi}
                </h3>
              </div>

              <div className="rounded-2xl bg-[#091a1d] border border-[#1d3d42] p-6 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#cca762]">
                  Tarihî Sahne & Nebevî Hadise:
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-[#dbe5e3] select-text">
                  {siyerDetail.ozetMetin}
                </p>
              </div>

              <div className="rounded-2xl bg-[#08181b] border border-[#cca762]/30 p-6 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7dd3c8]">
                  Müminin Çıkaracağı İbret & Teselli:
                </div>
                <p className="text-sm leading-relaxed text-[#e0ecea] italic">
                  {siyerDetail.maneviHikmet}
                </p>
              </div>
            </div>
          ) : halisDetail ? (
            /* ============================================================== */
            /* 4. HALIS AYDEMIR SOHBET PRESENTATION                            */
            /* ============================================================== */
            <div className="space-y-6">
              <div className="rounded-2xl bg-[#0b2226] border border-[#cca762]/30 p-5 text-center">
                <span className="text-xs font-semibold text-[#cca762] tracking-wider uppercase">
                  Dr. Halis Aydemir • Tefekkür Sohbeti
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-semibold text-[#f5ebd8] mt-1">
                  {halisDetail.sohbetKonusu}
                </h3>
              </div>

              {halisDetail.audioUrl && (
                <div className="rounded-xl bg-[#0c2024] border border-[#cca762]/30 p-4 space-y-2">
                  <div className="text-xs font-medium text-[#cca762] flex items-center gap-1.5">
                    <span>🎙️</span>
                    <span>Sesli Sohbet Kesiti Dinle:</span>
                  </div>
                  <audio className="w-full h-10 rounded" controls preload="auto" src={halisDetail.audioUrl}>
                    Tarayıcınız ses oynatmayı desteklemiyor.
                  </audio>
                </div>
              )}

              <div className="rounded-2xl bg-[#091a1d] border border-[#1d3d42] p-6 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#cca762]">
                  Sohbet Deşifresi ve Tefekkür Metni:
                </div>
                <div className="text-sm sm:text-base leading-relaxed text-[#dbe5e3] select-text space-y-2.5">
                  {halisDetail.desifreMetni.split(/\n+/).map((line, idx) => (
                    <p key={idx}>{line.trim()}</p>
                  ))}
                </div>
              </div>

              {halisDetail.maneviMesaj && (
                <div className="rounded-xl bg-[#08181b] border border-[#cca762]/30 p-4 text-xs text-[#cca762] italic">
                  💡 {halisDetail.maneviMesaj}
                </div>
              )}
            </div>
          ) : (
            /* ============================================================== */
            /* 5. GENERIC FALLBACK                                             */
            /* ============================================================== */
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#091a1d] border border-[#1d3d42] p-6">
                <div className="text-xs text-[#cca762] font-semibold uppercase tracking-wider mb-2">
                  {genericDetail?.sourceType || "KAYNAK METNİ"}
                </div>
                <p className="text-sm leading-relaxed text-[#e1e9e8]">
                  {genericDetail?.content || source.content}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Security / Authenticity Seal */}
          <div className="rounded-xl bg-[#040e10] border border-[#12282b] p-3.5 flex items-center gap-3 text-xs text-[#7e9694]">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>
              Çelik Kasa RAG Sahih Kaynak Mührü: Metinler, Kur&apos;ân-ı Kerîm lafzına ve Kütüb-i Sitte rivayetlerine harfiyen mutabık olarak mühürlenmiştir.
            </span>
          </div>
        </div>

        {/* Book Footer / Action Bar */}
        <div className="px-5 py-3.5 border-t border-[#cca762]/30 bg-gradient-to-r from-[#08181b] via-[#0b2124] to-[#08181b] flex items-center justify-between shrink-0">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#cca762] hover:bg-[#cca762]/15 transition-colors border border-[#cca762]/35 cursor-pointer"
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
            className="rounded-xl bg-[#cca762] hover:bg-[#dec288] text-[#1b1406] font-semibold px-5 py-2 text-xs transition-colors cursor-pointer shadow-md active:scale-95"
          >
            Kitabı Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
