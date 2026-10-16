"use client";

import React, { useState, useEffect } from "react";

interface TrialData {
  userMessage: string;
  replyText: string;
  jevResult?: {
    is_fiqh_fatwa_request?: number;
    is_debt_or_riba_related?: number;
    nafs_trap?: string;
    rag_category?: string;
    distress_level?: number;
  };
  editorAudit?: {
    murakabe_applied?: boolean;
    ilahi_riza_checked?: boolean;
    tevekkul_and_talak_hope_included?: boolean;
    nafs_and_vesvese_addressed?: string;
    siyer_example_used?: string;
    riba_warning_included?: boolean;
  };
  audioUrl?: string | null;
}

const LOCAL_STORAGE_KEY = "sirdas_web_trial_cache_v1";

const QUICK_PROMPTS = [
  {
    label: "Rızık & Borç Darlığı",
    text: "Kredi kartı ve borçlarım birikti, faiz sarmalından çıkamıyorum. Aileme mahcup olmaktan çok korkuyorum, ne yapmalıyım?"
  },
  {
    label: "Gece Kaygısı & Bunalım",
    text: "Gece yarısı oldu uyuyamıyorum. İçimde geleceğe dair tarifsiz bir korku ve göğsümde daralma var, kalbim hiç huzur bulmuyor..."
  },
  {
    label: "Haksızlık & Öfke",
    text: "En güvendiğim insanlar tarafından haksızlığa uğradım. İçimdeki öfke ve kırgınlığı bir türlü soğutamıyorum..."
  }
];

const NAFS_LABELS: Record<string, string> = {
  FAIRLIK_KORKUSU_VESVESESI: "Fakirlik Korkusu & Rızık Vesvesesi (Bakara 268)",
  GIZLI_KIBIR_HAKLILIK: "Nefsin Haklılık İddiası & İmtihan",
  UMITSIZLIK_KARAMSARLIK: "Ümitsizlik & Darlık Vesvesesi",
  INTIKAM_VE_HASET: "Öfke, Kırgınlık & Adalet Teslimiyeti",
  ELALEM_NE_DER_RIYA: "İnsanların Onayını Arama (Elalem Putu)",
  REHAVET_TEMBELLIK: "Atalet & Mesuliyet Ağırlığı"
};

const CATEGORY_LABELS: Record<string, string> = {
  RIZIK_VE_TICARET: "Rızık, Bereket & İnfak Mizanı",
  SABIR_VE_MUSIBET: "Sabr-ı Cemil & Musibet Hikmeti",
  OFKE_VE_AHLAK: "Öfke Terbiyesi & Hilm Ahlakı",
  AILE_VE_SILA_I_RAHIM: "Aile Emaneti & Sıla-i Rahim",
  KUL_HAKKI_VE_ADALET: "Kul Hakkı & İlahi Adalet",
  TEVEKKUL_VE_MURAKABE: "Tevekkül, Murakabe & Sekinet",
  SIYER_ORNEKLERI: "Siyer-i Nebi & Asr-ı Saadet İbreti"
};

export function LiveTrialSection({ waUrl }: { waUrl: string }) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [trialUsed, setTrialUsed] = useState(false);
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sayfa yüklendiğinde hem localStorage hem de sunucu (HttpOnly Cookie + IP Parmak İzi) kontrolü yap
  useEffect(() => {
    let mounted = true;

    async function checkTrialStatus() {
      try {
        // 1. Önce localStorage kontrolü (hızlı geri yükleme)
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as TrialData;
          if (parsed && parsed.userMessage && parsed.replyText && mounted) {
            setTrialData(parsed);
            setTrialUsed(true);
          }
        }

        // 2. Sunucu kontrolü (Cookie veya IP parmak izi ile kullanılmış mı?)
        const res = await fetch("/api/trial", { method: "GET", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.used && mounted) {
            setTrialUsed(true);
            if (data.previousTrial) {
              setTrialData(data.previousTrial);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.previousTrial));
            }
          }
        }
      } catch {
        // Sessizce devam et
      } finally {
        if (mounted) setIsCheckingStatus(false);
      }
    }

    checkTrialStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trialUsed || isLoading) return;

    const trimmed = inputMessage.trim();
    if (trimmed.length < 5) {
      setErrorMsg("Lütfen gönlünüzü meşgul eden durumu en az birkaç kelimeyle yazınız.");
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.error === "TRIAL_LIMIT_REACHED") {
          setTrialUsed(true);
          setErrorMsg(
            data.message ||
              "Web üzerindeki tek seferlik deneme hakkınızı kullandınız. WhatsApp üzerinden sınırsız devam edebilirsiniz."
          );
        } else {
          setErrorMsg(data.message || "Bir hata oluştu, lütfen tekrar deneyin.");
        }
        return;
      }

      if (data.trial) {
        setTrialData(data.trial);
        setTrialUsed(true);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.trial));
        } catch {
          // Storage full veya gizli sekme
        }
      }
    } catch {
      setErrorMsg("Bağlantı hatası yaşandı. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp formatındaki *kalın* ve _italik_ ifadeleri zenginleştiren yardımcı
  const renderFormattedReply = (text: string) => {
    return text.split("\n\n").map((paragraph, pIdx) => (
      <p key={pIdx} className="text-sm leading-relaxed text-[#d1d7db] mb-3 last:mb-0">
        {paragraph.split(/(\*[^*]+\*|_[^_]+_)/g).map((part, idx) => {
          if (part.startsWith("*") && part.endsWith("*")) {
            return (
              <strong key={idx} className="text-primary font-semibold">
                {part.slice(1, -1)}
              </strong>
            );
          }
          if (part.startsWith("_") && part.endsWith("_")) {
            return (
              <em key={idx} className="text-primary-fixed-dim italic">
                {part.slice(1, -1)}
              </em>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    ));
  };

  return (
    <section
      aria-labelledby="simdi-dene-baslik"
      className="w-full max-w-[1200px] mx-auto px-6 py-20 border-t border-outline-variant/30"
      id="simdi-dene"
    >
      {/* Bölüm Başlığı */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant/50 text-xs text-primary mb-4">
          <span
            aria-hidden="true"
            className={`w-2 h-2 rounded-full ${
              trialUsed ? "bg-amber-500" : "bg-secondary animate-pulse"
            }`}
          ></span>
          <span className="font-medium tracking-wide">
            {trialUsed
              ? "Misafir Deneme Hakkı: 0 / 1 (Tamamlandı)"
              : "Canlı Tefekkür Deneyimi • Kullanıcı Başına 1 Ücretsiz Hak"}
          </span>
        </div>

        <h2
          className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface mb-3 tracking-tight"
          id="simdi-dene-baslik"
          lang="tr"
        >
          Kalbindeki Yükü Yaz,{" "}
          <span className="text-primary font-bold">Sırdaş&apos;ı Şimdi Dene</span>
        </h2>
        <p
          className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto font-light"
          lang="tr"
        >
          WhatsApp&apos;a geçmeden önce, gönlünü daraltan bir meseleyi aşağıya yazarak
          Sırdaş AI&apos;nın Kur&apos;an-ı Kerim, Sahih Sünnet ve Siyer mizanındaki
          yaklaşımını canlı olarak tecrübe et.
        </p>
      </div>

      {/* Ana Deneme Konteyneri */}
      <div className="max-w-3xl mx-auto">
        {/* Hızlı Örnek Seçenekleri (Sadece hak kullanılmadıysa göster) */}
        {!trialUsed && !isCheckingStatus && (
          <div className="mb-5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2.5 text-center sm:text-left">
              Örnek Bir Hal Seçin veya Kendi Cümlenizi Yazın:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputMessage(item.text);
                    setErrorMsg(null);
                  }}
                  className="text-left p-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 transition-all group focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary group-hover:text-primary-fixed-dim">
                      {item.label}
                    </span>
                    <i
                      aria-hidden="true"
                      className="ph ph-arrow-up-right text-xs text-slate-400 group-hover:text-primary transition-colors"
                    ></i>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                    “{item.text}”
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Tarzı Canlı Tefekkür Penceresi */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/50 bg-[#0b141a]">
          {/* Üst Bar */}
          <div className="bg-[#1f2c34] px-5 py-3.5 flex items-center justify-between border-b border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary border border-secondary/30">
                  <span className="material-symbols-outlined text-xl">spa</span>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-[#1f2c34]"></span>
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-bold">
                    Sırdaş AI • Canlı Tefekkür Odası
                  </span>
                  <span
                    aria-label="Doğrulanmış Manevi Rehber"
                    className="material-symbols-outlined text-secondary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <span className="text-emerald-400 text-[11px] font-medium">
                  {isLoading
                    ? "System 1 (Jev) & System 2 (Gemini) tefekkür ediyor..."
                    : "Çelik Kasa RAG Bağlantısı Aktif • Kur'an & Siyer Mizanı"}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono px-2.5 py-1 rounded-md bg-surface-container-lowest/80 text-slate-300 border border-outline-variant/30">
              <i aria-hidden="true" className="ph ph-shield-check text-secondary text-sm"></i>
              <span>{trialUsed ? "Hak: 0/1" : "Hak: 1/1"}</span>
            </div>
          </div>

          {/* Sohbet Gövdesi */}
          <div
            aria-live="polite"
            className="p-5 sm:p-6 min-h-[240px] flex flex-col justify-between gap-5 bg-gradient-to-b from-[#0b141a] via-[#091117] to-[#0b141a]"
          >
            {/* Karşılama Mesajı (Henüz deneme yapılmadıysa) */}
            {!trialData && !isLoading && (
              <div className="self-start max-w-[90%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none border-l-2 border-secondary shadow-md">
                <p className="text-xs sm:text-sm text-[#d1d7db] leading-relaxed">
                  Selamun Aleykum aziz kardeşim. Burası Sırdaş AI&apos;nın canlı
                  tecrübe odasıdır. Kalbini yoran, uykunu kaçıran veya nefsini
                  zorlayan bir durumu aşağıya yaz; sana Kur&apos;an, Sünnet ve
                  Siyer ışığında nasıl ayna tuttuğumuzu bizzat gör.
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20 text-[10px] text-slate-400">
                  <span>5 Manevi Süzgeç &amp; Siyer Mührü</span>
                  <span>Şimdi</span>
                </div>
              </div>
            )}

            {/* Yükleniyor Durumu */}
            {isLoading && (
              <div className="flex flex-col gap-4 my-auto py-6">
                <div className="self-end max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-md">
                  <p className="text-xs sm:text-sm leading-relaxed">{inputMessage}</p>
                </div>
                <div className="self-start max-w-[88%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none border-l-2 border-primary shadow-lg flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>
                      Niyet ve vesvese teşhisi yapılıyor, sahih kaynaklar taranıyor...
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-2/3 animate-pulse rounded-full"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Sonuç Gösterimi (Deneme tamamlandıysa) */}
            {trialData && !isLoading && (
              <div className="flex flex-col gap-4">
                {/* Kullanıcının Mesajı */}
                <div className="self-end max-w-[88%] bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-md">
                  <p className="text-xs sm:text-sm leading-relaxed" lang="tr">
                    {trialData.userMessage}
                  </p>
                  <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-200">
                    <span>Gönderildi</span>
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-xs text-[#53bdeb]"
                    >
                      done_all
                    </span>
                  </div>
                </div>

                {/* Sırdaş AI Yanıtı */}
                <div className="self-start max-w-[95%] bg-[#202c33] text-on-surface p-4 sm:p-5 rounded-xl rounded-tl-none border-l-4 border-primary shadow-xl flex flex-col gap-3">
                  <div>{renderFormattedReply(trialData.replyText)}</div>

                  {/* Bilişsel Şeffaflık & İçsel Editör Denetim Özeti */}
                  {(trialData.jevResult || trialData.editorAudit) && (
                    <div className="mt-2 pt-3 border-t border-outline-variant/30 bg-surface-container-lowest/70 p-3 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                        <span className="flex items-center gap-1.5">
                          <i aria-hidden="true" className="ph ph-sparkle"></i>
                          Manevi Ayna &amp; İçsel Editör Denetimi
                        </span>
                        <span className="text-[10px] font-mono text-secondary">
                          5/5 Süzgeç Onaylı
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {trialData.jevResult?.nafs_trap && (
                          <div className="bg-surface-container/80 px-2.5 py-1.5 rounded border border-outline-variant/30">
                            <span className="text-slate-400 block text-[10px]">
                              Teşhis Edilen Vesvese / İmtihan:
                            </span>
                            <span className="text-on-surface font-medium">
                              {NAFS_LABELS[trialData.jevResult.nafs_trap] ||
                                trialData.jevResult.nafs_trap}
                            </span>
                          </div>
                        )}
                        {trialData.jevResult?.rag_category && (
                          <div className="bg-surface-container/80 px-2.5 py-1.5 rounded border border-outline-variant/30">
                            <span className="text-slate-400 block text-[10px]">
                              Çelik Kasa Rehberlik Alanı:
                            </span>
                            <span className="text-on-surface font-medium">
                              {CATEGORY_LABELS[trialData.jevResult.rag_category] ||
                                trialData.jevResult.rag_category}
                            </span>
                          </div>
                        )}
                      </div>

                      {trialData.editorAudit?.siyer_example_used && (
                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1">
                          <i
                            aria-hidden="true"
                            className="ph ph-seal-check text-secondary text-sm flex-shrink-0"
                          ></i>
                          <span className="truncate">
                            <strong className="text-on-surface">Siyer Mührü:</strong>{" "}
                            {trialData.editorAudit.siyer_example_used}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hata Mesajı */}
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-error-container/70 border border-red-500/40 text-xs text-red-200 flex items-center gap-2"
              >
                <i aria-hidden="true" className="ph ph-warning-circle text-base text-red-300"></i>
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Alt Giriş veya Kilitli WhatsApp Devam Barı */}
          <div className="bg-[#1f2c34] p-4 border-t border-outline-variant/30">
            {!trialUsed ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative">
                  <textarea
                    aria-label="Sırdaş AI deneme mesajınızı yazın"
                    className="w-full bg-[#2a3942] text-on-surface placeholder-slate-400 text-xs sm:text-sm rounded-xl p-3.5 pr-16 border border-outline-variant/40 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 resize-none leading-relaxed"
                    disabled={isLoading || isCheckingStatus}
                    id="trial-message-input"
                    maxLength={600}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Gönlünüzü daraltan meseleyi samimiyetle buraya yazın (Örn: Borçlarım birikti, içim çok daralıyor...)"
                    rows={3}
                    value={inputMessage}
                  />
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-400">
                    {inputMessage.length}/600
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <i aria-hidden="true" className="ph ph-lock-key text-primary text-sm"></i>
                    <span>
                      Web üzerinde her ziyaretçimiz için{" "}
                      <strong className="text-white">1 ücretsiz deneme</strong> hakkı
                      tanımlanmıştır.
                    </span>
                  </span>

                  <button
                    aria-label="Mesajı gönder ve Sırdaş AI ile tefekkür et"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#e59f65] disabled:opacity-50 text-[#1b1207] px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                    disabled={isLoading || isCheckingStatus || inputMessage.trim().length < 5}
                    id="trial-submit-btn"
                    type="submit"
                  >
                    <span>{isLoading ? "Tefekkür Ediliyor..." : "Sırdaş ile Tefekkür Et"}</span>
                    <i aria-hidden="true" className="ph ph-paper-plane-right text-sm"></i>
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="bg-surface-container-lowest/90 p-4 rounded-xl border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4"
                id="trial-locked-banner"
              >
                <div className="flex items-start sm:items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary flex-shrink-0">
                    <i aria-hidden="true" className="ph ph-check-circle text-lg"></i>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-on-surface block">
                      Web Üzerindeki Tek Seferlik Deneme Hakkınızı Kullandınız
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Sırdaş AI ile sesli tefekkür kesitleri ve 4 bloklu kişisel
                      künyenizle dertleşmeye WhatsApp&apos;ta{" "}
                      <strong className="text-secondary">%100 ücretsiz ve sınırsız</strong>{" "}
                      devam edebilirsiniz.
                    </span>
                  </div>
                </div>

                <a
                  aria-label="Sohbete WhatsApp üzerinden ücretsiz ve sınırsız devam et"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary-container hover:bg-[#117a51] text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all flex-shrink-0 shadow-lg focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  href={waUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <i aria-hidden="true" className="ph ph-whatsapp-logo text-base text-secondary"></i>
                  <span>WhatsApp&apos;ta Sınırsız Devam Et</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
