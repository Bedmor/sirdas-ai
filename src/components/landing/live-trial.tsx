"use client";

import React, { useState, useEffect } from "react";

interface TrialData {
  userMessage: string;
  replyText: string;
  audioUrl?: string | null;
}

const LOCAL_STORAGE_KEY = "sirdas_web_trial_cache_v1";

const EXAMPLE_TOPICS = [
  {
    label: "Rızık ve borç darlığı",
    text: "Borçlarım birikti, çıkış yolu bulamıyorum. Aileme mahcup olmaktan çok korkuyorum, kalbim daralıyor..."
  },
  {
    label: "Gece seherinde kaygı",
    text: "Gece yarısı oldu uyuyamıyorum. İçimde geleceğe dair tarifsiz bir ağırlık var, gönlüm huzur bulmuyor..."
  },
  {
    label: "Haksızlık ve kırgınlık",
    text: "En güvendiğim insanlar tarafından haksızlığa uğradım. İçimdeki öfke ve kırgınlığı bir türlü dindiremiyorum..."
  }
];

export function LiveTrialSection({ waUrl }: { waUrl: string }) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [trialUsed, setTrialUsed] = useState(false);
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkTrialStatus() {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as TrialData;
          if (parsed && parsed.userMessage && parsed.replyText && mounted) {
            setTrialData(parsed);
            setTrialUsed(true);
          }
        }

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
      setErrorMsg("Lütfen gönlünüzü meşgul eden durumu birkaç kelimeyle ifade ediniz.");
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
              "Buradaki tek seferlik dertleşme hakkınızı kullandınız. Sohbete WhatsApp üzerinden devam edebilirsiniz."
          );
        } else {
          setErrorMsg(data.message || "Şu anda yanıt oluşturulamadı, lütfen tekrar deneyin.");
        }
        return;
      }

      if (data.trial) {
        setTrialData(data.trial);
        setTrialUsed(true);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.trial));
        } catch {
          // Gizli sekme veya depolama sınırı
        }
      }
    } catch {
      setErrorMsg("Bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

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
      {/* Bölüm Başlığı — Kicker veya yapay rozet yok, sade ve vakur tipografi */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h2
          className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface mb-3 tracking-tight"
          id="simdi-dene-baslik"
          lang="tr"
        >
          Gönlündeki Darlığı Yaz, Birlikte Tefekkür Edelim
        </h2>
        <p
          className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto font-light"
          lang="tr"
        >
          WhatsApp&apos;a geçmeden önce, kalbini yoran bir meseleyi buradan paylaşarak
          Sırdaş&apos;ın üslubunu ve yaklaşımını bir defaya mahsus tecrübe edebilirsin.
        </p>
      </div>

      {/* Sohbet Penceresi — Hero'daki WhatsApp penceresiyle birebir aynı dingin dil */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/40 bg-[#0b141a]">
          {/* WhatsApp Üst Bar */}
          <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary"
                >
                  <span className="material-symbols-outlined text-2xl">spa</span>
                </div>
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full ring-2 ring-[#1f2c34]"
                ></span>
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-bold">Sırdaş AI</span>
                  <span
                    aria-label="Onaylı Sırdaş Hattı"
                    className="material-symbols-outlined text-secondary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <span className="text-emerald-400 text-xs leading-tight font-medium">
                  {isLoading
                    ? "Dinliyor ve tefekkür ediyor..."
                    : "Çevrimiçi • Sekinet ve Dinleme Hali"}
                </span>
              </div>
            </div>

            <span className="text-xs text-slate-300">
              {trialUsed ? "Deneme tamamlandı" : "1 mesaj hakkı"}
            </span>
          </div>

          {/* Sohbet Gövdesi */}
          <div
            aria-live="polite"
            className="p-4 md:p-6 min-h-[220px] flex flex-col justify-between gap-4 bg-gradient-to-b from-[#0b141a] via-[#091117] to-[#0b141a]"
          >
            {/* Karşılama Mesajı (Henüz deneme yapılmadıysa) */}
            {!trialData && !isLoading && (
              <div className="self-start max-w-[90%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none shadow-md">
                <p className="text-sm text-[#d1d7db] leading-relaxed" lang="tr">
                  Selamun Aleykum. Gecenin bir vaktinde yahut günün telaşında
                  kalbini daraltan, kimseye açamadığın bir yük varsa aşağıya
                  yazabilirsin. Seni yargılamadan dinlemek ve Kur&apos;an ile
                  Sünnet ikliminde birlikte soluklanmak için buradayım.
                </p>
              </div>
            )}

            {/* Gönderiliyor Durumu */}
            {isLoading && (
              <div className="flex flex-col gap-4">
                <div className="self-end max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-md">
                  <p className="text-sm leading-relaxed" lang="tr">
                    {inputMessage}
                  </p>
                </div>
                <div className="self-start max-w-[85%] bg-[#202c33] text-on-surface px-4 py-3 rounded-xl rounded-tl-none shadow-md">
                  <p className="text-xs text-slate-300 italic">
                    Sırdaş mesajınızı okuyor, birazdan yanıtlayacak...
                  </p>
                </div>
              </div>
            )}

            {/* Yanıt Gösterimi */}
            {trialData && !isLoading && (
              <div className="flex flex-col gap-4">
                {/* Kullanıcının Mesajı */}
                <div className="self-end max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-md">
                  <p className="text-sm leading-relaxed" lang="tr">
                    {trialData.userMessage}
                  </p>
                  <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-300">
                    <span>Az önce</span>
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-xs text-[#53bdeb]"
                    >
                      done_all
                    </span>
                  </div>
                </div>

                {/* Sırdaş Yanıtı — Sade, müdahalesiz sohbet balonu */}
                <div className="self-start max-w-[92%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none shadow-lg flex flex-col gap-2">
                  <div>{renderFormattedReply(trialData.replyText)}</div>
                  <div className="flex items-center justify-end pt-1">
                    <span className="text-[10px] text-slate-400">Şimdi</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hata Mesajı */}
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-error-container/70 border border-red-500/30 text-xs text-red-200"
              >
                {errorMsg}
              </div>
            )}
          </div>

          {/* Alt Yazma Alanı veya WhatsApp Devam Çağrısı */}
          <div className="bg-[#1f2c34] p-4 border-t border-outline-variant/20">
            {!trialUsed ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Sade Örnek Cümle Seçimi */}
                {!isCheckingStatus && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">Örnek konular:</span>
                    {EXAMPLE_TOPICS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputMessage(item.text);
                          setErrorMsg(null);
                        }}
                        className="text-xs text-slate-300 hover:text-primary underline underline-offset-4 decoration-outline-variant hover:decoration-primary transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded px-1 py-0.5"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                  <textarea
                    aria-label="Sırdaş AI deneme mesajınızı yazın"
                    className="flex-grow bg-[#2a3942] text-on-surface placeholder-slate-400 text-sm rounded-xl px-4 py-3 border border-outline-variant/40 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 resize-none leading-relaxed"
                    disabled={isLoading || isCheckingStatus}
                    id="trial-message-input"
                    maxLength={600}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Gönlünüzü meşgul eden derdi buraya yazın..."
                    rows={2}
                    value={inputMessage}
                  />

                  <button
                    aria-label="Mesajı gönder"
                    className="inline-flex items-center justify-center gap-2 bg-secondary-container hover:bg-[#117a51] disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                    disabled={isLoading || isCheckingStatus || inputMessage.trim().length < 5}
                    id="trial-submit-btn"
                    type="submit"
                  >
                    <span>{isLoading ? "Gönderiliyor..." : "Gönder"}</span>
                    <i aria-hidden="true" className="ph ph-paper-plane-right text-sm"></i>
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1"
                id="trial-locked-banner"
              >
                <p className="text-xs text-slate-300 leading-relaxed text-center sm:text-left" lang="tr">
                  Web üzerindeki tek mesajlık tanışma hakkınızı kullandınız.
                  Sohbete dilediğiniz zaman WhatsApp üzerinden ücretsiz devam
                  edebilirsiniz.
                </p>

                <a
                  aria-label="Sohbete WhatsApp üzerinden devam et"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary-container hover:bg-[#117a51] text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  href={waUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <i aria-hidden="true" className="ph ph-whatsapp-logo text-base text-secondary"></i>
                  <span>WhatsApp&apos;ta Devam Et</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
