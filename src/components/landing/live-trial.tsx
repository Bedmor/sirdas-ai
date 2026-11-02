"use client";

import React, { useState, useEffect } from "react";
import {
  Scenario,
  SCENARIOS_DATA,
  EXAMPLE_TOPICS,
} from "./trial-scenarios-data";
import { ScenariosShowcase } from "./scenarios-showcase";

export type { Scenario };
export { SCENARIOS_DATA, EXAMPLE_TOPICS };

export interface TrialData {
  userMessage: string;
  replyText: string;
  audioUrl?: string | null;
  editorAudit?: {
    murakabe_applied?: boolean;
    nafs_trap?: string;
    rag_category?: string;
    [key: string]: unknown;
  };
}

const LOCAL_STORAGE_KEY = "sirdas_web_trial_cache_v1";

export function LiveTrialSection({ waUrl }: { waUrl: string }) {
  const [activeTab, setActiveTab] = useState<"trial" | "scenarios">("trial");
  const [isDevMode, setIsDevMode] = useState(false);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [trialUsed, setTrialUsed] = useState(false);
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === "#sohbet-ornekleri") {
        setActiveTab("scenarios");
      } else if (hash === "#simdi-dene") {
        setActiveTab("trial");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleResetChat = () => {
    setTrialData(null);
    setSentMessage("");
    setStreamingText("");
    setInputMessage("");
    setErrorMsg(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  };

  useEffect(() => {
    let mounted = true;

    async function checkTrialStatus() {
      try {
        const isLocalDev =
          process.env.NODE_ENV === "development" ||
          (typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1"));

        if (isLocalDev) {
          setIsDevMode(true);
          try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch {}
        } else {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as TrialData;
            if (parsed && parsed.userMessage && parsed.replyText && mounted) {
              setTrialData(parsed);
              setTrialUsed(true);
            }
          }
        }

        const res = await fetch("/api/trial", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isDev || isLocalDev) {
            setIsDevMode(true);
            setTrialUsed(false);
            try {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            } catch {}
            if (data.previousTrial && mounted) {
              setTrialData(data.previousTrial);
            }
          } else if (data.used && mounted) {
            setTrialUsed(true);
            if (data.previousTrial) {
              setTrialData(data.previousTrial);
              localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(data.previousTrial)
              );
            }
          }
        }
      } catch {
        // Ignore initial status check failure
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
    if (trialUsed || isLoading || isStreaming) return;

    const trimmed = inputMessage.trim();
    if (trimmed.length < 5) {
      setErrorMsg(
        "Lütfen gönlünüzü meşgul eden durumu birkaç kelimeyle ifade ediniz."
      );
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setIsStreaming(false);
    setStreamingText("");
    setSentMessage(trimmed);
    setInputMessage("");

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        credentials: "include",
        body: JSON.stringify({ message: trimmed, stream: true }),
      });

      if (!res.ok) {
        setIsLoading(false);
        setIsStreaming(false);
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 429 || errJson.error === "TRIAL_LIMIT_REACHED") {
          setTrialUsed(true);
          setErrorMsg(
            errJson.message ||
              "Buradaki tek seferlik deneme hakkınızı kullandınız. Web sitemiz ve mobil uygulamamız üzerinden kesintisiz dertleşmeye devam edebilirsiniz."
          );
        } else {
          setErrorMsg(
            errJson.message ||
              "Şu anda yanıt oluşturulamadı, lütfen tekrar deneyin."
          );
        }
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && res.body) {
        setIsLoading(false);
        setIsStreaming(true);

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulated = "";
        let buffer = "";
        let finalTrial: TrialData | null = null;
        let streamErrored = false;
        let streamIsDev = isDevMode;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() || "";

            for (const block of blocks) {
              if (!block.trim()) continue;
              const lines = block.split("\n");
              let event = "token";
              let dataStr = "";

              for (const line of lines) {
                if (line.startsWith("event:")) {
                  event = line.replace(/^event:\s*/, "").trim();
                } else if (line.startsWith("data:")) {
                  dataStr = line.replace(/^data:\s*/, "").trim();
                }
              }

              if (event === "token") {
                try {
                  const parsed = JSON.parse(dataStr);
                  const token = parsed.token ?? parsed.text ?? "";
                  accumulated += token;
                  setStreamingText(accumulated);
                } catch {
                  accumulated += dataStr;
                  setStreamingText(accumulated);
                }
              } else if (event === "done") {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.trial) {
                    finalTrial = {
                      userMessage: parsed.trial.userMessage || trimmed,
                      replyText: parsed.trial.replyText || accumulated,
                      audioUrl: parsed.trial.audioUrl ?? null,
                      editorAudit: parsed.trial.editorAudit,
                    };
                  }
                  if (parsed.isDev) {
                    streamIsDev = true;
                    setIsDevMode(true);
                  }
                } catch {}
              } else if (event === "error") {
                streamErrored = true;
                try {
                  const parsed = JSON.parse(dataStr);
                  setErrorMsg(parsed.message || "Bir hata oluştu.");
                } catch {
                  setErrorMsg("Bir hata oluştu.");
                }
                break;
              }
            }
            if (streamErrored) break;
          }

          if (!streamErrored && (finalTrial || accumulated.trim().length > 0)) {
            const resolvedTrial: TrialData = finalTrial || {
              userMessage: trimmed,
              replyText: accumulated,
            };
            setTrialData(resolvedTrial);
            if (!streamIsDev) {
              setTrialUsed(true);
              try {
                localStorage.setItem(
                  LOCAL_STORAGE_KEY,
                  JSON.stringify(resolvedTrial)
                );
              } catch {}
            } else {
              setTrialUsed(false);
              try {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
              } catch {}
            }
          }
        } catch (streamErr) {
          console.warn("[Stream Reading Warning]", streamErr);
          if (!accumulated.trim()) {
            setErrorMsg(
              "Akış sırasında bağlantı kesildi, lütfen tekrar deneyin."
            );
          }
        } finally {
          setIsStreaming(false);
          setIsLoading(false);
        }
      } else {
        const data = await res.json();
        if (data.isDev) {
          setIsDevMode(true);
        }
        if (data.trial) {
          setTrialData(data.trial);
          if (!isDevMode && !data.isDev) {
            setTrialUsed(true);
            try {
              localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(data.trial)
              );
            } catch {}
          } else {
            setTrialUsed(false);
            try {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            } catch {}
          }
        }
        setIsLoading(false);
        setIsStreaming(false);
      }
    } catch {
      setIsLoading(false);
      setIsStreaming(false);
      setErrorMsg(
        "Bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin."
      );
    }
  };

  const renderFormattedReply = (text: string) => {
    return text.split("\n\n").map((paragraph, pIdx) => (
      <p
        key={pIdx}
        className="text-sm leading-relaxed text-[#d1d7db] mb-3 last:mb-0"
      >
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
    <div
      aria-label="Manevi Pusula Canlı Dertleşme Arayüzü"
      className="w-full max-w-3xl mx-auto mt-8 sm:mt-12 text-left"
      id="simdi-dene"
    >
      <span id="sohbet-ornekleri" className="sr-only" />

      <div className="rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/40 bg-[#0b141a]">
        {/* Chat Interface Header */}
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
                className={`absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full ring-2 ring-[#1f2c34] ${
                  isStreaming ? "animate-pulse" : ""
                }`}
              ></span>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-bold">Manevi Pusula</span>
                <span
                  aria-label="Onaylı Manevi Pusula Hattı"
                  className="material-symbols-outlined text-secondary text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <span className="text-emerald-400 text-xs leading-tight font-medium">
                {activeTab === "trial"
                  ? isStreaming
                    ? "Yazıyor..."
                    : isLoading
                    ? "Dinliyor ve tefekkür ediyor..."
                    : isDevMode
                    ? "Çevrimiçi • Geliştirici Modu (Sınırsız)"
                    : trialUsed
                    ? "Çevrimiçi • Deneme tamamlandı"
                    : "Çevrimiçi • 1 mesaj hakkı"
                  : "Çevrimiçi • Örnek Hâller"}
              </span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#111b21] p-1 rounded-xl border border-outline-variant/30">
            <button
              aria-label="Canlı dertleşme deneme moduna geç"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "trial"
                  ? "bg-secondary-container text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
              onClick={() => setActiveTab("trial")}
              type="button"
            >
              <span>Şimdi Dene</span>
            </button>
            <button
              aria-label="Örnek dertleşme senaryolarına geç"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "scenarios"
                  ? "bg-secondary-container text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
              onClick={() => setActiveTab("scenarios")}
              type="button"
            >
              <span>Örnekler (5)</span>
            </button>
          </div>
        </div>

        {/* MODE 1: LIVE TRIAL */}
        {activeTab === "trial" && (
          <>
            <div
              aria-live="polite"
              className="p-4 md:p-6 min-h-[300px] flex flex-col justify-between gap-4 bg-gradient-to-b from-[#0b141a] via-[#091117] to-[#0b141a]"
              id="sohbet-alani"
            >
              {!trialData && !isLoading && !isStreaming && (
                <div className="self-start max-w-[90%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none shadow-md">
                  <p className="text-sm text-[#d1d7db] leading-relaxed" lang="tr">
                    Selamun Aleykum. Gecenin bir vaktinde yahut günün telaşında
                    kalbini daraltan, kimseye açamadığın bir yük varsa aşağıya
                    yazabilirsin. Seni yargılamadan dinlemek ve Kur&apos;an ile
                    Sünnet ikliminde birlikte soluklanmak için buradayım.
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-outline-variant/10 text-[10px] text-slate-400">
                    <span className="text-primary-fixed-dim">
                      Tek seferlik tanışma tefekkürü
                    </span>
                    <span>Şimdi</span>
                  </div>
                </div>
              )}

              {(isLoading || isStreaming) && (
                <div className="flex flex-col gap-4">
                  <div className="self-end max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-md">
                    <p className="text-sm leading-relaxed" lang="tr">
                      {sentMessage || inputMessage}
                    </p>
                    <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-300">
                      <span>Şimdi</span>
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-xs text-[#53bdeb]"
                      >
                        done_all
                      </span>
                    </div>
                  </div>

                  {streamingText ? (
                    <div className="self-start max-w-[92%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none shadow-lg flex flex-col gap-2">
                      <div>
                        {renderFormattedReply(streamingText)}
                        <span
                          aria-hidden="true"
                          className="inline-block w-1.5 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Manevi Pusula yazıyor...
                        </span>
                        <span className="text-[10px] text-slate-400">Şimdi</span>
                      </div>
                    </div>
                  ) : (
                    <div className="self-start max-w-[85%] bg-[#202c33] text-on-surface px-4 py-3 rounded-xl rounded-tl-none shadow-md flex items-center gap-3">
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                      </div>
                      <p className="text-xs text-slate-300 italic">
                        Manevi Pusula tefekkür ediyor...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {trialData && !isLoading && !isStreaming && (
                <div className="flex flex-col gap-4">
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

                  <div className="self-start max-w-[92%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none shadow-lg flex flex-col gap-2">
                    <div>{renderFormattedReply(trialData.replyText)}</div>
                    {trialData.audioUrl && (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                          <span className="material-symbols-outlined text-sm">
                            mic
                          </span>
                          <span>Sesli Tefekkür Kesiti</span>
                        </div>
                        <audio
                          controls
                          preload="metadata"
                          className="w-full h-9 rounded-lg"
                          src={trialData.audioUrl}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-end pt-1">
                      <span className="text-[10px] text-slate-400">Şimdi</span>
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-error-container/70 border border-red-500/30 text-xs text-red-200"
                >
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="bg-[#1f2c34] p-4 border-t border-outline-variant/20">
              {!trialUsed ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {!isCheckingStatus && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
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
                      {isDevMode && trialData && (
                        <button
                          type="button"
                          onClick={handleResetChat}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1 transition-colors"
                          title="Geliştirici modu: Sohbeti baştan başlat"
                        >
                          <span>🔄 Sohbeti Sıfırla</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                    <textarea
                      aria-label="Manevi Pusula deneme mesajınızı yazın"
                      className="flex-grow bg-[#2a3942] text-on-surface placeholder-slate-400 text-sm rounded-xl px-4 py-3 border border-outline-variant/40 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 resize-none leading-relaxed"
                      disabled={isLoading || isStreaming || isCheckingStatus}
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
                      disabled={
                        isLoading ||
                        isStreaming ||
                        isCheckingStatus ||
                        inputMessage.trim().length < 5
                      }
                      id="trial-submit-btn"
                      type="submit"
                    >
                      <span>
                        {isStreaming
                           ? "Yazıyor..."
                          : isLoading
                          ? "Gönderiliyor..."
                          : "Gönder"}
                      </span>
                      <i
                        aria-hidden="true"
                        className="ph ph-paper-plane-right text-sm"
                      ></i>
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1"
                  id="trial-locked-banner"
                >
                  <div className="text-left">
                    <p
                      className="text-xs text-slate-300 leading-relaxed font-medium"
                      lang="tr"
                    >
                      Bu vitrin alanındaki tek mesajlık tanışma hakkınızı kullandınız.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Kesintisiz ve mahrem dertleşmeye Manevi Pusula Tefekkür Odasında devam
                      edebilirsiniz.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab("scenarios")}
                      className="text-xs text-slate-300 hover:text-primary px-3 py-2 rounded-lg border border-outline-variant/40 transition-colors"
                    >
                      Örnekleri Gör
                    </button>
                    <a
                      aria-label="Sohbete tam ekran devam et"
                      className="inline-flex items-center justify-center gap-2 bg-secondary-container hover:bg-[#117a51] text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-colors flex-grow sm:flex-grow-0 shadow-lg shadow-secondary/10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                      href={waUrl || "/"}
                    >
                      <i
                        aria-hidden="true"
                        className="ph ph-chat-circle-dots text-base text-secondary"
                      ></i>
                      <span>Sohbete Tam Ekran Devam Et</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* MODE 2: SCENARIOS SHOWCASE */}
        {activeTab === "scenarios" && (
          <ScenariosShowcase
            waUrl={waUrl}
            onSwitchToTrial={() => setActiveTab("trial")}
          />
        )}
      </div>
    </div>
  );
}
