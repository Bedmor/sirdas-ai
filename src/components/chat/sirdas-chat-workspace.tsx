"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

export interface ChatSourceBadge {
  id: string;
  sourceType: string;
  sourceTitle: string;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: ChatSourceBadge[];
  audioUrl?: string | null;
  status?: "processed" | "fatwa_blocked" | "crisis_redirected";
}

export interface ChatConversationThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessageItem[];
}

const THREADS_STORAGE_KEY = "sirdas_chat_threads_v1";
const CLIENT_ID_STORAGE_KEY = "sirdas_anon_client_id_v1";

function getSourceTypeLabel(sourceType: string): string {
  switch (sourceType) {
    case "QURAN":
      return "Kur'ân-ı Kerîm";
    case "HADITH":
      return "Hadis-i Şerif";
    case "SIYER":
      return "Siyer-i Nebî";
    case "DUA":
      return "Nebevi Dua";
    case "HALIS_AYDEMIR":
      return "Tefekkür Sohbeti";
    default:
      return "Hikmet Kaynağı";
  }
}

function renderFormattedMessage(text: string): React.ReactNode {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((para, pIdx) => {
    const tokens = para.split(/(\*[^*]+\*|_[^_]+_)/g);
    return (
      <p
        key={pIdx}
        className="text-[15px] leading-[1.75] text-[#e0e3df] mb-3.5 last:mb-0 max-w-[68ch]"
        lang="tr"
      >
        {tokens.map((tok, tIdx) => {
          if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
            return (
              <strong
                key={tIdx}
                className="font-semibold text-primary-fixed-dim"
              >
                {tok.slice(1, -1)}
              </strong>
            );
          }
          if (tok.startsWith("_") && tok.endsWith("_") && tok.length > 2) {
            return (
              <em
                key={tIdx}
                className="font-heading italic text-primary text-[15px]"
              >
                {tok.slice(1, -1)}
              </em>
            );
          }
          return <React.Fragment key={tIdx}>{tok}</React.Fragment>;
        })}
      </p>
    );
  });
}

function generateClientUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `sirdas_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function SirdasChatWorkspace() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");

  const [threads, setThreads] = useState<ChatConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingSources, setStreamingSources] = useState<ChatSourceBadge[]>(
    [],
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;
  const activeMessages = activeThread?.messages || [];

  // Initialize anonymous Better-Auth-ready clientId & load threads from localStorage
  useEffect(() => {
    try {
      let storedClient = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (!storedClient) {
        storedClient = generateClientUuid();
        localStorage.setItem(CLIENT_ID_STORAGE_KEY, storedClient);
      }
      setClientId(storedClient);

      const rawThreads = localStorage.getItem(THREADS_STORAGE_KEY);
      if (rawThreads) {
        const parsed = JSON.parse(rawThreads) as ChatConversationThread[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(parsed[0].id);
        }
      }
    } catch {
      // Ignore storage errors in private mode
    }
  }, []);

  const saveThreadsToStorage = useCallback(
    (nextThreads: ChatConversationThread[]) => {
      setThreads(nextThreads);
      try {
        localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(nextThreads));
      } catch {
        // Ignore quota errors
      }
    },
    [],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, streamingText, isLoading]);

  // Progressive fallback for browsers without native CSS `field-sizing: content`
  const syncTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("field-sizing", "content")
    ) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleNewChat = () => {
    setActiveThreadId("");
    setInputMessage("");
    setStreamingText("");
    setStreamingSources([]);
    setErrorMsg(null);
    setMobileDrawerOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 40);
  };

  const handleSelectThread = (threadId: string) => {
    if (isLoading || isStreaming) return;
    setActiveThreadId(threadId);
    setErrorMsg(null);
    setMobileDrawerOpen(false);
  };

  const handleDeleteThread = (
    e: React.MouseEvent,
    threadIdToDelete: string,
  ) => {
    e.stopPropagation();
    const filtered = threads.filter((t) => t.id !== threadIdToDelete);
    saveThreadsToStorage(filtered);
    if (activeThreadId === threadIdToDelete) {
      setActiveThreadId(filtered[0]?.id || "");
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || isStreaming) return;

    const trimmed = inputMessage.trim();
    if (trimmed.length < 2) {
      setErrorMsg(
        "Lütfen gönlünüzü meşgul eden durumu birkaç kelimeyle ifade edin.",
      );
      return;
    }

    setErrorMsg(null);
    setInputMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const nowIso = new Date().toISOString();
    const userMsgItem: ChatMessageItem = {
      id: generateClientUuid(),
      role: "user",
      content: trimmed,
      createdAt: nowIso,
    };

    let currentThreadId = activeThreadId;
    let updatedThreads: ChatConversationThread[];
    const priorHistory = activeMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (!currentThreadId) {
      currentThreadId = generateClientUuid();
      const newTitle =
        trimmed.length > 42 ? `${trimmed.slice(0, 40)}...` : trimmed;
      const newThread: ChatConversationThread = {
        id: currentThreadId,
        title: newTitle,
        updatedAt: nowIso,
        messages: [userMsgItem],
      };
      updatedThreads = [newThread, ...threads];
      setActiveThreadId(currentThreadId);
    } else {
      updatedThreads = threads.map((t) =>
        t.id === currentThreadId
          ? {
              ...t,
              updatedAt: nowIso,
              messages: [...t.messages, userMsgItem],
            }
          : t,
      );
    }

    saveThreadsToStorage(updatedThreads);
    setIsLoading(true);
    setIsStreaming(false);
    setStreamingText("");
    setStreamingSources([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(clientId ? { "x-sirdas-client-id": clientId } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          conversationId: currentThreadId,
          clientId,
          history: priorHistory,
          stream: true,
        }),
      });

      if (!res.ok) {
        setIsLoading(false);
        setIsStreaming(false);
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(
          errJson.message ||
            "Şu anda yanıt oluşturulamadı, lütfen biraz sonra tekrar deneyin.",
        );
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
        let capturedSources: ChatSourceBadge[] = [];
        let capturedAudioUrl: string | null = null;
        let capturedStatus:
          | "processed"
          | "fatwa_blocked"
          | "crisis_redirected" = "processed";

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

            if (event === "meta") {
              try {
                const parsed = JSON.parse(dataStr);
                if (Array.isArray(parsed.sources)) {
                  capturedSources = parsed.sources;
                  setStreamingSources(parsed.sources);
                }
                if (parsed.status) {
                  capturedStatus = parsed.status;
                }
              } catch {}
            } else if (event === "token") {
              try {
                const parsed = JSON.parse(dataStr);
                const tok = parsed.token ?? parsed.text ?? "";
                accumulated += tok;
                setStreamingText(accumulated);
              } catch {
                accumulated += dataStr;
                setStreamingText(accumulated);
              }
            } else if (event === "done") {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.replyText) {
                  accumulated = parsed.replyText;
                }
                if (Array.isArray(parsed.sources)) {
                  capturedSources = parsed.sources;
                }
                if (parsed.audioUrl) {
                  capturedAudioUrl = parsed.audioUrl;
                }
                if (parsed.status) {
                  capturedStatus = parsed.status;
                }
              } catch {}
            } else if (event === "error") {
              try {
                const parsed = JSON.parse(dataStr);
                setErrorMsg(parsed.message || "Bir hata oluştu.");
              } catch {
                setErrorMsg("Sohbet akışı sırasında bir hata oluştu.");
              }
            }
          }
        }

        setIsStreaming(false);
        setStreamingText("");
        setStreamingSources([]);

        if (accumulated.trim()) {
          const assistantMsgItem: ChatMessageItem = {
            id: generateClientUuid(),
            role: "assistant",
            content: accumulated.trim(),
            createdAt: new Date().toISOString(),
            sources: capturedSources,
            audioUrl: capturedAudioUrl,
            status: capturedStatus,
          };

          const finalThreads = updatedThreads.map((t) =>
            t.id === currentThreadId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  messages: [...t.messages, assistantMsgItem],
                }
              : t,
          );
          saveThreadsToStorage(finalThreads);
        }
      } else {
        const json = await res.json();
        setIsLoading(false);
        setIsStreaming(false);

        if (json.replyText) {
          const assistantMsgItem: ChatMessageItem = {
            id: generateClientUuid(),
            role: "assistant",
            content: json.replyText,
            createdAt: new Date().toISOString(),
            sources: json.sources || [],
            audioUrl: json.audioUrl || null,
            status: json.status || "processed",
          };
          const finalThreads = updatedThreads.map((t) =>
            t.id === currentThreadId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  messages: [...t.messages, assistantMsgItem],
                }
              : t,
          );
          saveThreadsToStorage(finalThreads);
        }
      }
    } catch {
      setIsLoading(false);
      setIsStreaming(false);
      setErrorMsg(
        "Bağlantı sırasında bir sorun yaşandı. Lütfen tekrar deneyin.",
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = activeMessages.length > 0 || isLoading || isStreaming;

  return (
    <div
      className="flex h-dvh w-full overflow-hidden bg-[#040F0F] text-[#e1e9e8] spiritual-bg-pattern"
      style={{ colorScheme: "dark" }}
    >
      {/* MOBILE BACKDROP */}
      {mobileDrawerOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* COLLAPSIBLE SIDEBAR */}
      <aside
        aria-label="Sohbet Geçmişi ve Yan Menü"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#091119] border-r border-[#1d3336]/60 transition-[width,transform] duration-300 ease-out lg:static ${
          mobileDrawerOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full lg:translate-x-0"
        } ${sidebarOpen ? "lg:w-[280px]" : "lg:w-[68px]"}`}
      >
        {/* Sidebar Top Header */}
        <div className="flex h-16 items-center justify-between px-3.5 border-b border-[#1d3336]/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <button
              aria-label={
                sidebarOpen ? "Yan menüyü daralt" : "Yan menüyü genişlet"
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8b9ea0] hover:bg-[#0e2224] hover:text-[#e1e9e8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileDrawerOpen(false);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {(sidebarOpen || mobileDrawerOpen) && (
              <span className="font-heading text-lg font-semibold tracking-tight text-[#e1e9e8] truncate">
                Manevi Pusula
              </span>
            )}
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-3">
          <button
            aria-label="Yeni dertleşme başlat"
            className={`flex w-full items-center gap-3 rounded-xl bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] text-[#e5cca0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762] ${
              sidebarOpen || mobileDrawerOpen
                ? "px-3.5 py-2.5 justify-start"
                : "p-2.5 justify-center"
            }`}
            onClick={handleNewChat}
            title="Yeni Dertleşme Başlat"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[#cca762]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 4.5v15m7.5-7.5h-15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {(sidebarOpen || mobileDrawerOpen) && (
              <span className="text-sm font-medium truncate">
                Yeni Dertleşme
              </span>
            )}
          </button>
        </div>

        {/* Thread History List */}
        <div
          className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#1d3336 #091119",
          }}
        >
          {(sidebarOpen || mobileDrawerOpen) && (
            <div className="px-2 pb-1.5 pt-1 text-xs font-medium text-[#8b9ea0]">
              Geçmiş Sohbetler
            </div>
          )}

          {threads.length === 0
            ? (sidebarOpen || mobileDrawerOpen) && (
                <p className="px-2 py-4 text-xs text-[#8b9ea0]/70 leading-relaxed">
                  Henüz kayıtlı bir sohbetiniz bulunmuyor. Dilediğiniz vakit
                  içinizi dökebilirsiniz.
                </p>
              )
            : threads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    className={`group flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#0e2224] text-[#cca762] border border-[#1d3336]/60"
                        : "text-[#8b9ea0] hover:bg-[#0e2224]/50 hover:text-[#e1e9e8]"
                    } ${
                      sidebarOpen || mobileDrawerOpen
                        ? "px-3 py-2"
                        : "p-2 justify-center"
                    }`}
                    onClick={() => handleSelectThread(thread.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectThread(thread.id);
                      }
                    }}
                    title={thread.title}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <svg
                        aria-hidden="true"
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? "text-[#cca762]" : "text-[#5a6e70]"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {(sidebarOpen || mobileDrawerOpen) && (
                        <span className="text-xs truncate">{thread.title}</span>
                      )}
                    </div>

                    {(sidebarOpen || mobileDrawerOpen) && (
                      <button
                        aria-label="Sohbeti sil"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-[#5a6e70] hover:text-[#ffb4ab] transition-opacity"
                        onClick={(e) => handleDeleteThread(e, thread.id)}
                        type="button"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Sidebar Bottom Links & Emergency Lines */}
        <div className="border-t border-[#1d3336]/60 p-3 space-y-2.5">
          {sidebarOpen || mobileDrawerOpen ? (
            <>
              <div className="flex items-center gap-2">
                <a
                  aria-label="Diyanet Alo 190 Fetva Hattı"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] px-2.5 py-1.5 text-xs font-medium text-[#8b9ea0] hover:text-[#e1e9e8] transition-colors"
                  href="tel:190"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cca762]" />
                  <span>Alo 190 Fetva</span>
                </a>
                <a
                  aria-label="112 Acil Çağrı Merkezi"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#331418] hover:bg-[#481c22] border border-[#ffb4ab]/25 px-2.5 py-1.5 text-xs font-medium text-[#ffdad6] transition-colors"
                  href="tel:112"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffb4ab]" />
                  <span>112 Acil</span>
                </a>
              </div>

              <div className="flex items-center justify-between px-1 pt-1 text-xs text-[#8b9ea0]/75">
                <Link
                  className="hover:text-[#cca762] transition-colors"
                  href="/sorumluluk-reddi"
                >
                  Sınırlar &amp; Beyan
                </Link>
                <span>•</span>
                <Link
                  className="hover:text-[#cca762] transition-colors"
                  href="/gizlilik-politikasi"
                >
                  KVKK
                </Link>
                <span>•</span>
                <Link
                  className="hover:text-[#cca762] transition-colors"
                  href="/askida-sirdas"
                >
                  Askıda Pusula
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <a
                aria-label="Alo 190 Fetva Hattı"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e2224] border border-[#1d3336] text-[10px] font-semibold text-[#cca762]"
                href="tel:190"
                title="Alo 190 Diyanet Fetva Hattı"
              >
                190
              </a>
              <a
                aria-label="112 Acil Çağrı Merkezi"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#331418] border border-[#ffb4ab]/25 text-[10px] font-semibold text-[#ffdad6]"
                href="tel:112"
                title="112 Acil Çağrı Merkezi"
              >
                112
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONVERSATION STAGE */}
      <div className="flex flex-1 flex-col min-w-0 h-full relative">
        {/* Minimal Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 border-b border-[#1d3336]/60 bg-[rgb(14_34_36_/_0.9)] backdrop-blur-xs z-20">
          <div className="flex items-center gap-3">
            <button
              aria-label="Menüyü aç"
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg text-[#8b9ea0] hover:bg-[#0e2224] hover:text-[#e1e9e8]"
              onClick={() => setMobileDrawerOpen(true)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="h-12   w-12 rounded-full bg-[#0e2224] border border-[#1d3336] overflow-hidden shrink-0 flex items-center justify-center">
                <Image
                  alt="Manevi Pusula"
                  className="h-full w-full object-cover"
                  height={48}
                  priority
                  src="/icon.png"
                  width={48}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-base font-medium text-[#e1e9e8] leading-tight">
                  {activeThread ? activeThread.title : "Manevi Pusula"}
                </span>
                <span className="text-xs text-[#8b9ea0]">
                  Kur&apos;an ve Sünnet Rehberliğinde Tefekkür Odası
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main
          className="flex-1 overflow-y-auto px-4 sm:px-6"
          id="sirdas-chat-scroll"
          role="main"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#1d3336 #040F0F",
          }}
        >
          {!hasMessages ? (
            /* SERENE EMPTY STATE — NO STARTER PROMPT CARDS */
            <div className="mx-auto flex h-full max-w-[680px] flex-col items-center justify-center text-center py-12">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0e2224] border border-[#1d3336]">
                <Image
                  alt="Manevi Pusula"
                  className="h-11 w-11 rounded-full object-cover"
                  height={44}
                  src="/icon.png"
                  width={44}
                />
              </div>

              <h1
                className="font-heading text-3xl sm:text-4xl font-medium text-[#e1e9e8] tracking-tight leading-snug mb-4"
                lang="tr"
              >
                Selamün aleyküm kardeşim, gönlünü ne meşgul ediyor?
              </h1>

              <p
                className="text-[15px] text-[#8b9ea0] leading-relaxed max-w-[54ch]"
                lang="tr"
              >
                İçini daraltan imtihanı, kederi veya tefekkür etmek istediğin
                meseleyi dilediğin gibi paylaşabilirsin. Burada konuşulanlar
                Kur&apos;an ve Sünnet hikmetiyle, yargılamadan dinlenir.
              </p>
            </div>
          ) : (
            /* MULTI-TURN CONVERSATION STREAM */
            <div className="mx-auto max-w-[720px] py-8 space-y-8">
              {activeMessages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tr-xs bg-[#0e2726] border border-[#459b95]/35 px-5 py-3.5 text-[#e1e9e8]">
                        <p
                          className="text-[15px] leading-relaxed whitespace-pre-wrap"
                          lang="tr"
                        >
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <article
                    key={msg.id}
                    aria-label="Manevi Pusula Yanıtı"
                    className="flex items-start gap-3.5 sm:gap-4"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0e2224] border border-[#1d3336] overflow-hidden">
                      <Image
                        alt="Manevi Pusula"
                        className="h-full w-full object-cover"
                        height={32}
                        src="/icon.png"
                        width={32}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3.5">
                      <div className="rounded-2xl rounded-tl-xs bg-[#0a1c1e] border border-[#1d3336] px-5 py-4">
                        {renderFormattedMessage(msg.content)}
                      </div>

                      {/* Retrieved Çelik Kasa Source Badges */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          aria-label="İktibas Edilen Hikmet Kaynakları"
                          className="flex flex-wrap items-center gap-2"
                        >
                          {msg.sources.map((src) => (
                            <span
                              key={src.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0e2224] border border-[#1d3336] px-2.5 py-1 text-xs text-[#8b9ea0]"
                            >
                              <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rounded-full bg-[#cca762]"
                              />
                              <span className="font-medium text-[#e5cca0]">
                                {getSourceTypeLabel(src.sourceType)}:
                              </span>
                              <span className="truncate max-w-[220px]">
                                {src.sourceTitle}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Halis Aydemir Audio Snippet Player */}
                      {msg.audioUrl && (
                        <div className="rounded-xl bg-[#0e2224] border border-[#1d3336] p-3.5 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs text-[#e5cca0]">
                            <span className="font-medium">
                              Sesli Tefekkür Kesiti
                            </span>
                          </div>
                          <audio
                            className="w-full h-9"
                            controls
                            preload="none"
                            src={msg.audioUrl}
                          >
                            Tarayıcınız ses oynatmayı desteklemiyor.
                          </audio>
                        </div>
                      )}

                      {/* Message Action Bar */}
                      <div className="flex items-center gap-3 pt-0.5">
                        <button
                          aria-label="Yanıtı kopyala"
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[#8b9ea0]/75 hover:bg-[#0e2224] hover:text-[#e1e9e8] transition-colors"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>
                            {copiedMsgId === msg.id ? "Kopyalandı" : "Kopyala"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* ACTIVE STREAMING OR LOADING TURN */}
              {(isLoading || isStreaming) && (
                <article
                  aria-live="polite"
                  className="flex items-start gap-3.5 sm:gap-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0e2224] border border-[#cca762]/50 overflow-hidden">
                    <Image
                      alt="Manevi Pusula"
                      className="h-full w-full object-cover"
                      height={32}
                      src="/icon.png"
                      width={32}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="rounded-2xl rounded-tl-xs bg-[#0a1c1e] border border-[#1d3336] px-5 py-4">
                      {streamingText ? (
                        renderFormattedMessage(streamingText)
                      ) : (
                        <div className="flex items-center gap-2.5 text-sm text-[#8b9ea0]">
                          <span className="h-2 w-2 rounded-full bg-[#cca762] animate-pulse" />
                          <span>Manevi Pusula tefekkür ediyor...</span>
                        </div>
                      )}
                    </div>

                    {streamingSources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {streamingSources.map((src) => (
                          <span
                            key={src.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0e2224] border border-[#1d3336] px-2.5 py-1 text-xs text-[#8b9ea0]"
                          >
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-[#cca762]"
                            />
                            <span className="font-medium text-[#e5cca0]">
                              {getSourceTypeLabel(src.sourceType)}:
                            </span>
                            <span className="truncate max-w-[220px]">
                              {src.sourceTitle}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )}

              {errorMsg && (
                <div
                  className="rounded-xl bg-[#331418] border border-[#ffb4ab]/30 px-4 py-3 text-xs text-[#ffdad6]"
                  role="alert"
                >
                  {errorMsg}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* BOTTOM GEMINI-STYLE FLOATING INPUT DOCK */}
        <div className="shrink-0 bg-[#040F0F]/95 backdrop-blur-xs px-4 pb-4 pt-2 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            <form
              className="relative flex items-end gap-2 rounded-2xl bg-[#0a1c1e] border border-[#1d3336] focus-within:border-[#f0d098] px-4 py-3 transition-colors"
              onSubmit={handleSubmit}
            >
              <textarea
                ref={textareaRef}
                aria-label="Manevi Pusula ile dertleşme mesajınızı yazın"
                className="flex-1 bg-transparent text-[15px] leading-relaxed text-[#e1e9e8] placeholder-[#8b9ea0]/60 focus:outline-none resize-none"
                disabled={isLoading || isStreaming}
                id="sirdas-chat-input"
                maxLength={1200}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                  syncTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Gönlünü meşgul eden durumu buraya yaz..."
                rows={1}
                style={
                  {
                    fieldSizing: "content",
                    minBlockSize: "1.6lh",
                    maxBlockSize: "8lh",
                  } as React.CSSProperties
                }
                value={inputMessage}
              />

              <button
                aria-label="Mesajı gönder"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#cca762] hover:bg-[#dec288] disabled:opacity-40 text-[#1b1406] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
                disabled={
                  isLoading || isStreaming || inputMessage.trim().length < 2
                }
                id="sirdas-chat-submit"
                type="submit"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>

            <p
              className="mt-2 text-center text-xs text-[#8b9ea0]/75 leading-normal"
              lang="tr"
            >
              Manevi Pusula bir hoca, fetva makamı veya klinik merci değildir.
              Fıkhi hükümler için{" "}
              <a
                className="font-medium text-[#e5cca0] underline underline-offset-2 hover:text-[#cca762]"
                href="tel:190"
              >
                Alo 190
              </a>
              , acil durumlar için{" "}
              <a
                className="font-medium text-[#ffdad6] underline underline-offset-2 hover:text-[#ffb4ab]"
                href="tel:112"
              >
                112 Acil
              </a>{" "}
              esastır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
