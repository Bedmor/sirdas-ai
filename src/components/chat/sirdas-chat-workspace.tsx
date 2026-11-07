"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SourceBookModal } from "./source-book-modal";
import { filterUsedSourcesByReply } from "@/lib/ai/source-citation-filter";

export interface ChatSourceBadge {
  id: string;
  sourceType: string;
  sourceTitle: string;
  content?: string;
  audioUrl?: string | null;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: ChatSourceBadge[];
  audioUrl?: string | null;
  status?: "processed" | "fatwa_blocked" | "crisis_redirected";
  intentMode?: "MANEVI_AYNA" | "ILIM_VE_SIYER";
}

export interface ChatConversationThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessageItem[];
}

const THREADS_STORAGE_KEY = "sirdas_chat_threads_v1";
const CLIENT_ID_STORAGE_KEY = "sirdas_anon_client_id_v1";
const CONSENT_STORAGE_KEY = "sirdas_kvkk_consent_v1";
const SETTINGS_STORAGE_KEY = "sirdas_privacy_settings_v1";
const PROFILE_STORAGE_KEY = "sirdas_user_profile_v1";

export interface UserProfileData {
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
}

const SPIRITUAL_STAGE_LABELS: Record<
  string,
  { title: string; subtitle: string; step: number }
> = {
  ARAYIS_VE_BASLANGIC: {
    title: "Arayış ve Başlangıç",
    subtitle: "Gönül kapısını aralama ve ilk hasbihal",
    step: 1,
  },
  DARLIK_VE_BUNALIM: {
    title: "Sabır ve Teskin Makamı",
    subtitle: "İmtihan fırtınasında sükûnet ve sığınma",
    step: 1,
  },
  MUHASEBE_VE_TEVBE: {
    title: "Muhasebe ve İstiğfar",
    subtitle: "İçsel yüzleşme, nefis tezkiyesi ve arınma",
    step: 2,
  },
  ISTIKAMET_VE_INSA: {
    title: "İstikamet ve İnşa",
    subtitle: "Amel, dua ve tevekkülle istikrarlı yürüyüş",
    step: 3,
  },
  DERINLESMIS_SALIK: {
    title: "Derinleşmiş Sâlik",
    subtitle: "Murakabe, ihlas ve hikmet eksenli tefekkür",
    step: 4,
  },
};

const ROLE_LABELS: Record<string, string> = {
  EVLI: "Evli",
  BEKAR: "Bekâr",
  EBEVEYN: "Anne / Baba",
  ESNAF: "Esnaf / Ticaret",
  CALISAN: "Çalışan / Memur",
  OGRENCI: "Öğrenci",
  YAZILIMCI_MUHENDIS: "Mühendis / Teknoloji",
  OGRETMEN: "Eğitimci / Öğretmen",
  SAGLIK_CALISANI: "Sağlık Çalışanı",
  HASTA_BAKIMI: "Yakınına Bakım Veren",
  EMEKLI: "Emekli",
  EV_HANIMI: "Ev Hanımı",
  GURBETCI: "Gurbette Yaşayan",
};

export interface SirdasPrivacySettings {
  autoPurgeOnClose: boolean;
  inactivityTimeoutMinutes: number; // 0 (Kapalı), 15, 30, 60
  ttlHours: number; // 0 (Süresiz), 12, 24, 72
}

const DEFAULT_PRIVACY_SETTINGS: SirdasPrivacySettings = {
  autoPurgeOnClose: false,
  inactivityTimeoutMinutes: 0,
  ttlHours: 0,
};

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

function formatMessageTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function getDatePillLabel(isoString?: string): string {
  if (!isoString) return "";
  try {
    const target = new Date(isoString);
    if (isNaN(target.getTime())) return "";

    const today = new Date();
    // Normalize to midnight for accurate day comparison
    const targetMidnight = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
    ).getTime();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();

    const diffDays = Math.round(
      (todayMidnight - targetMidnight) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Dün";
    if (diffDays > 1 && diffDays < 7) {
      const daysTr = [
        "Pazar",
        "Pazartesi",
        "Salı",
        "Çarşamba",
        "Perşembe",
        "Cuma",
        "Cumartesi",
      ];
      return daysTr[target.getDay()];
    }

    const monthsTr = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];

    if (target.getFullYear() === today.getFullYear()) {
      return `${target.getDate()} ${monthsTr[target.getMonth()]}`;
    }
    return `${target.getDate()} ${monthsTr[target.getMonth()]} ${target.getFullYear()}`;
  } catch {
    return "";
  }
}

function getDateGroupKey(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

const CONTEMPLATION_PHRASES_SPIRITUAL = [
  "Gönül süzgecinden geçiriliyor...",
  "Hikmet kapıları aralanıyor...",
  "Âyet ve sünnet hikmetiyle tefekkür ediliyor...",
  "Sekinet ve teslimiyetle tartılıyor...",
  "Ruhun yaralarına merhem aranıyor...",
  "Kalbin sesine kulak veriliyor...",
];

const CONTEMPLATION_PHRASES_ILIM = [
  "Siyer ve ilim kaynakları taranıyor...",
  "Sahih rivayetler ve tarihi vesikalar inceleniyor...",
  "Asr-ı Saadet tablosu tefekkür ediliyor...",
  "İlmi mesnetler süzgeçten geçiriliyor...",
];

function getRandomContemplationPhrase(isIlim: boolean): string {
  const list = isIlim
    ? CONTEMPLATION_PHRASES_ILIM
    : CONTEMPLATION_PHRASES_SPIRITUAL;
  return list[Math.floor(Math.random() * list.length)];
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
  const [streamingIntentMode, setStreamingIntentMode] = useState<
    "MANEVI_AYNA" | "ILIM_VE_SIYER" | null
  >(null);
  const [contemplationPhrase, setContemplationPhrase] = useState<string>(
    "Gönül süzgecinden geçiriliyor...",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [activeDetailSource, setActiveDetailSource] = useState<ChatSourceBadge | null>(null);

  // KVKK Kalkanı: Açık Rıza ve Unutulma Hakkı Durumları
  const [hasGivenConsent, setHasGivenConsent] = useState<boolean>(true);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Hafıza & Gizlilik Ayarları (Kapanışta İmha, Hareketsizlik, TTL)
  const [privacySettings, setPrivacySettings] = useState<SirdasPrivacySettings>(
    DEFAULT_PRIVACY_SETTINGS,
  );
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);

  // Salt Okunur Sırdaş Profili & Kalıcı Hafıza Durumları
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    roles: [],
    known_facts: [],
    spiritual_trials: [],
    biological_energy: ["SAMIMI_ARAYIS"],
    tone_preference: "SEFKATLI_TESKIN",
    spiritual_stage: "ARAYIS_VE_BASLANGIC",
    interaction_count: 0,
    onboarding_step: 1,
    onboarding_completed: false,
    profile_completion: 20,
  });
  const profileDialogRef = useRef<HTMLDialogElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;
  const activeMessages = activeThread?.messages || [];

  const applyAndSaveProfile = useCallback((nextProfile: UserProfileData) => {
    setUserProfile((prev) => {
      const merged = { ...prev, ...nextProfile };
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  const fetchServerProfile = useCallback(
    async (activeClientId: string) => {
      if (!activeClientId) return;
      try {
        const res = await fetch("/api/chat", {
          method: "GET",
          headers: {
            "x-sirdas-client-id": activeClientId,
          },
        });
        const json = await res.json();
        if (json?.userProfile && typeof json.userProfile === "object") {
          applyAndSaveProfile(json.userProfile as UserProfileData);
        }
      } catch {}
    },
    [applyAndSaveProfile],
  );

  const handleOpenProfileModal = useCallback(() => {
    if (clientId) {
      fetchServerProfile(clientId);
    }
    const dialog = profileDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [clientId, fetchServerProfile]);

  const handleCloseProfileModal = useCallback(() => {
    const dialog = profileDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  }, []);

  // Native <dialog closedby="any"> light-dismiss fallback for browsers without closedBy support (e.g. Safari)
  useEffect(() => {
    const dialog = profileDialogRef.current;
    if (
      !dialog ||
      typeof HTMLDialogElement === "undefined" ||
      "closedBy" in HTMLDialogElement.prototype
    ) {
      return;
    }
    const onDialogClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInsideContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInsideContent) {
        dialog.close();
      }
    };
    dialog.addEventListener("click", onDialogClick);
    return () => dialog.removeEventListener("click", onDialogClick);
  }, []);

  const handlePurgeAllData = useCallback(
    async (customSuccessMessage?: string) => {
      setIsPurging(true);
      try {
        await fetch("/api/chat", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(clientId ? { "x-sirdas-client-id": clientId } : {}),
          },
          body: JSON.stringify({ clientId }),
        });
      } catch (err) {
        console.warn("[Purge Error]", err);
      }

      try {
        localStorage.removeItem(THREADS_STORAGE_KEY);
        localStorage.removeItem(PROFILE_STORAGE_KEY);
        const newClient = generateClientUuid();
        localStorage.setItem(CLIENT_ID_STORAGE_KEY, newClient);
        setClientId(newClient);
      } catch {}

      setUserProfile({
        roles: [],
        known_facts: [],
        spiritual_trials: [],
        biological_energy: ["SAMIMI_ARAYIS"],
        tone_preference: "SEFKATLI_TESKIN",
        spiritual_stage: "ARAYIS_VE_BASLANGIC",
        interaction_count: 0,
        onboarding_step: 1,
        onboarding_completed: false,
        profile_completion: 20,
      });
      setThreads([]);
      setActiveThreadId("");
      setInputMessage("");
      setStreamingText("");
      setStreamingSources([]);
      setIsPurging(false);
      setIsResetModalOpen(false);
      setToastMsg(
        customSuccessMessage ||
          "✅ Benlik hafızanız, tüm sohbetleriniz ve sunucudaki anonim JSON kaydınız kalıcı olarak silindi.",
      );
      setTimeout(() => setToastMsg(null), 4500);
    },
    [clientId],
  );

  // Initialize anonymous Better-Auth-ready clientId, KVKK consent & load threads from localStorage
  useEffect(() => {
    try {
      let storedClient = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (!storedClient) {
        storedClient = generateClientUuid();
        localStorage.setItem(CLIENT_ID_STORAGE_KEY, storedClient);
      }
      setClientId(storedClient);

      const rawCachedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (rawCachedProfile) {
        try {
          const parsedProfile = JSON.parse(rawCachedProfile);
          if (parsedProfile && typeof parsedProfile === "object") {
            applyAndSaveProfile(parsedProfile);
          }
        } catch {}
      }
      fetchServerProfile(storedClient);

      // Gizlilik Ayarlarını Yükle
      let currentPrivacy = DEFAULT_PRIVACY_SETTINGS;
      const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (rawSettings) {
        try {
          const parsed = JSON.parse(rawSettings);
          if (parsed && typeof parsed === "object") {
            currentPrivacy = { ...DEFAULT_PRIVACY_SETTINGS, ...parsed };
            setPrivacySettings(currentPrivacy);
          }
        } catch {}
      }

      const rawThreads = localStorage.getItem(THREADS_STORAGE_KEY);
      if (rawThreads) {
        const parsed = JSON.parse(rawThreads) as ChatConversationThread[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 3. Zaman Ayarlı Kendini İmhâ (TTL): Süresi dolan kayıtları ayıkla
          if (currentPrivacy.ttlHours > 0) {
            const cutoff =
              Date.now() - currentPrivacy.ttlHours * 60 * 60 * 1000;
            const validThreads = parsed.filter((t) => {
              const tTime = new Date(t.updatedAt).getTime();
              return !isNaN(tTime) && tTime >= cutoff;
            });
            if (validThreads.length < parsed.length) {
              setThreads(validThreads);
              setActiveThreadId(validThreads[0]?.id || "");
              localStorage.setItem(
                THREADS_STORAGE_KEY,
                JSON.stringify(validThreads),
              );
              setToastMsg(
                `⏱️ Zaman ayarlı imha (TTL ${currentPrivacy.ttlHours} saat): Süresi dolan eski kayıtlar otomatik silindi.`,
              );
              setTimeout(() => setToastMsg(null), 4500);
            } else {
              setThreads(parsed);
              setActiveThreadId(parsed[0].id);
            }
          } else {
            setThreads(parsed);
            setActiveThreadId(parsed[0].id);
          }
        }
      }

      // KVKK Kalkanı: İlk açılışta Açık Rıza ve Özel Nitelikli Veri Pop-up kontrolü
      const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (storedConsent) {
        try {
          const parsedConsent = JSON.parse(storedConsent);
          if (parsedConsent && parsedConsent.accepted) {
            setHasGivenConsent(true);
            setIsConsentModalOpen(false);
          } else {
            setHasGivenConsent(false);
            setIsConsentModalOpen(true);
          }
        } catch {
          setHasGivenConsent(false);
          setIsConsentModalOpen(true);
        }
      } else {
        setHasGivenConsent(false);
        setIsConsentModalOpen(true);
      }
    } catch {
      // Ignore storage errors in private mode
    }
  }, []);

  // 1. Dinamik Tefekkür İfadeleri Rotasyonu (Cevap üretilirken Gemini tarzı yaşayan muhatap hissi)
  useEffect(() => {
    if (!isLoading && !isStreaming) return;

    // Hemen ilk rastgele ifadeyi ata
    setContemplationPhrase(
      getRandomContemplationPhrase(streamingIntentMode === "ILIM_VE_SIYER"),
    );

    const intervalId = setInterval(() => {
      setContemplationPhrase((prev) => {
        const isIlim = streamingIntentMode === "ILIM_VE_SIYER";
        const pool = isIlim
          ? CONTEMPLATION_PHRASES_ILIM
          : CONTEMPLATION_PHRASES_SPIRITUAL;
        const available = pool.filter((p) => p !== prev);
        return available[Math.floor(Math.random() * available.length)] || pool[0];
      });
    }, 2800);

    return () => clearInterval(intervalId);
  }, [isLoading, isStreaming, streamingIntentMode]);

  // 1. Sayfayı/Uygulamayı Kapattığı An (Browser Close Event - Beacon Purge)
  useEffect(() => {
    if (!privacySettings.autoPurgeOnClose || !clientId) return;

    const handleWindowClose = () => {
      try {
        localStorage.removeItem(THREADS_STORAGE_KEY);
        if (navigator.sendBeacon) {
          const payload = JSON.stringify({ clientId, action: "purge" });
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/chat?action=purge", blob);
        }
      } catch {}
    };

    window.addEventListener("pagehide", handleWindowClose);
    window.addEventListener("beforeunload", handleWindowClose);
    return () => {
      window.removeEventListener("pagehide", handleWindowClose);
      window.removeEventListener("beforeunload", handleWindowClose);
    };
  }, [privacySettings.autoPurgeOnClose, clientId]);

  // 2. Belirli Bir Süre Hareketsizlik (Inactivity Timeout - 30 Dk)
  useEffect(() => {
    if (
      !privacySettings.inactivityTimeoutMinutes ||
      privacySettings.inactivityTimeoutMinutes <= 0 ||
      threads.length === 0
    ) {
      return;
    }

    const timeoutMs = privacySettings.inactivityTimeoutMinutes * 60 * 1000;
    let lastActive = Date.now();

    const onUserActivity = () => {
      lastActive = Date.now();
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) =>
      window.addEventListener(e, onUserActivity, { passive: true }),
    );

    const timer = setInterval(() => {
      if (Date.now() - lastActive >= timeoutMs) {
        handlePurgeAllData(
          `⏱️ ${privacySettings.inactivityTimeoutMinutes} dakika hareketsizlik algılandığı için benlik hafızanız güvenlik gereği otomatik imha edildi.`,
        );
      }
    }, 15_000);

    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, onUserActivity));
    };
  }, [
    privacySettings.inactivityTimeoutMinutes,
    threads.length,
    handlePurgeAllData,
  ]);

  const handleUpdatePrivacySettings = (
    newSettings: Partial<SirdasPrivacySettings>,
  ) => {
    const merged = { ...privacySettings, ...newSettings };
    setPrivacySettings(merged);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  };

  const handleAcceptConsent = () => {
    try {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          accepted: true,
          acceptedAt: new Date().toISOString(),
          version: "v1.0",
        }),
      );
    } catch {}
    setHasGivenConsent(true);
    setIsConsentModalOpen(false);
    setErrorMsg(null);
  };

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
    if (!hasGivenConsent) {
      setIsConsentModalOpen(true);
      setErrorMsg(
        "Sohbete başlamadan önce lütfen KVKK Açık Rıza ve Özel Nitelikli Veri metnini onaylayınız.",
      );
      return;
    }

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
      const nowLocal = new Date();
      const userTimeZone =
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "Europe/Istanbul";
      const sessionUserMessagesCount =
        priorHistory.filter((m) => m.role === "user").length + 1;

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
          userProfile,
          history: priorHistory,
          localHour: nowLocal.getHours(),
          localMinute: nowLocal.getMinutes(),
          timeZone: userTimeZone,
          sessionUserMessagesCount,
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
        let capturedIntentMode: "MANEVI_AYNA" | "ILIM_VE_SIYER" | undefined;
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
                if (parsed.intentMode) {
                  capturedIntentMode = parsed.intentMode;
                  setStreamingIntentMode(parsed.intentMode);
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
                  setStreamingSources(parsed.sources);
                }
                if (parsed.audioUrl) {
                  capturedAudioUrl = parsed.audioUrl;
                }
                if (parsed.status) {
                  capturedStatus = parsed.status;
                }
                if (parsed.intentMode) {
                  capturedIntentMode = parsed.intentMode;
                }
                if (
                  parsed.userProfile &&
                  typeof parsed.userProfile === "object"
                ) {
                  applyAndSaveProfile(parsed.userProfile as UserProfileData);
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
        setStreamingIntentMode(null);

        if (accumulated.trim()) {
          const assistantMsgItem: ChatMessageItem = {
            id: generateClientUuid(),
            role: "assistant",
            content: accumulated.trim(),
            createdAt: new Date().toISOString(),
            sources: capturedSources,
            audioUrl: capturedAudioUrl,
            status: capturedStatus,
            intentMode: capturedIntentMode,
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

        // Arka plandaki gemini-3.5-flash-lite triyaj zenginleştirmesini senkronize et
        if (clientId) {
          setTimeout(() => {
            fetchServerProfile(clientId);
          }, 2200);
          setTimeout(() => {
            fetchServerProfile(clientId);
          }, 5000);
        }
      } else {
        const json = await res.json();
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingIntentMode(null);

        if (json.userProfile && typeof json.userProfile === "object") {
          applyAndSaveProfile(json.userProfile as UserProfileData);
        }

        if (json.replyText) {
          const assistantMsgItem: ChatMessageItem = {
            id: generateClientUuid(),
            role: "assistant",
            content: json.replyText,
            createdAt: new Date().toISOString(),
            sources: json.sources || [],
            audioUrl: json.audioUrl || null,
            status: json.status || "processed",
            intentMode: json.intentMode,
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

        if (clientId) {
          setTimeout(() => {
            fetchServerProfile(clientId);
          }, 2200);
          setTimeout(() => {
            fetchServerProfile(clientId);
          }, 5000);
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-300"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* COLLAPSIBLE SIDEBAR */}
      <aside
        aria-label="Sohbet Geçmişi ve Yan Menü"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#091119] border-r border-[#1d3336]/60 transition-[width,transform] duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] lg:static ${
          mobileDrawerOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full lg:translate-x-0"
        } ${sidebarOpen ? "lg:w-[280px]" : "lg:w-[68px]"}`}
      >
        {/* Sidebar Top Header */}
        <div
          className={`flex h-16 items-center border-b border-[#1d3336]/60 ${
            sidebarOpen || mobileDrawerOpen
              ? "justify-between px-3.5"
              : "justify-center px-2"
          }`}
        >
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

          {(sidebarOpen || mobileDrawerOpen) && (
            <Link
              href="/tanitim"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8b9ea0] hover:bg-[#0e2224] hover:text-[#cca762] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
              title="Tanıtım & Ana Sayfaya Dön"
              aria-label="Tanıtım & Ana Sayfaya Dön"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </Link>
          )}
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
        {sidebarOpen || mobileDrawerOpen ? (
          <div
            className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#1d3336 #091119",
            }}
          >
            <div className="px-2 pb-1.5 pt-1 text-xs font-medium text-[#8b9ea0]">
              Geçmiş Sohbetler
            </div>

            {threads.length === 0 ? (
              <p className="px-2 py-4 text-xs text-[#8b9ea0]/70 leading-relaxed">
                Henüz kayıtlı bir sohbetiniz bulunmuyor. Dilediğiniz vakit
                içinizi dökebilirsiniz.
              </p>
            ) : (
              threads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#0e2224] text-[#cca762] border border-[#1d3336]/60"
                        : "text-[#8b9ea0] hover:bg-[#0e2224]/50 hover:text-[#e1e9e8]"
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
                      <span className="text-xs truncate">{thread.title}</span>
                    </div>

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
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Memory Security, Profile & Privacy Actions (Sol Alt) */}
        <div className="p-3 border-t border-[#1d3336]/60 space-y-2">
          {sidebarOpen || mobileDrawerOpen ? (
            <>
              {/* Sade Sırdaş Profilim Satırı */}
              <button
                type="button"
                onClick={handleOpenProfileModal}
                className="w-full flex items-center justify-between gap-2.5 rounded-xl bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] px-3 py-2.5 text-left transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
                title="Sırdaş Profilimi ve Tutulan Notları Görüntüle"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#081517] border border-[#cca762]/30 text-[#cca762] text-xs font-semibold">
                    {userProfile.preferred_name ? (
                      userProfile.preferred_name.charAt(0).toLocaleUpperCase("tr-TR")
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#e1e9e8] truncate group-hover:text-[#cca762] transition-colors">
                      {userProfile.preferred_name || "Sırdaş Profilim"}
                    </div>
                    <div className="text-xs text-[#8b9ea0] truncate">
                      {(userProfile.known_facts || []).length > 0
                        ? `${(userProfile.known_facts || []).length} kalıcı not`
                        : SPIRITUAL_STAGE_LABELS[
                            userProfile.spiritual_stage || "ARAYIS_VE_BASLANGIC"
                          ]?.title || "Arayış ve Başlangıç"}
                    </div>
                  </div>
                </div>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[#8b9ea0] group-hover:text-[#cca762] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2 w-full">
                {/* 1. Hafıza & Gizlilik Ayarları Butonu (Sol Alt) */}
              <button
                aria-label="Hafıza ve gizlilik ayarlarını aç"
                className="flex-1 flex h-10 items-center justify-center rounded-xl bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] text-[#cca762] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
                onClick={() => setIsSettingsModalOpen(true)}
                title="Hafıza ve Gizlilik Ayarları (Otomatik İmha, Hareketsizlik, TTL)"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* 2. Benlik Hafızamı Sıfırla Butonu */}
              <button
                aria-label="Benlik hafızamı sıfırla ve tüm verilerimi sil"
                className="flex-1 flex h-10 items-center justify-center rounded-xl bg-[#201013] hover:bg-[#2d1418] border border-[#ffb4ab]/30 text-[#ffb4ab] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]"
                onClick={() => setIsResetModalOpen(true)}
                title="Benlik Hafızamı Sıfırla / Tüm Verilerimi Sil (KVKK Unutulma Hakkı)"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                aria-label="Sırdaş profilimi görüntüle"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] text-[#cca762] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
                onClick={handleOpenProfileModal}
                title="Sırdaş Profilim"
                type="button"
              >
                {userProfile.preferred_name ? (
                  userProfile.preferred_name.charAt(0).toLocaleUpperCase("tr-TR")
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                )}
              </button>
              <button
                aria-label="Hafıza ve gizlilik ayarlarını aç"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] text-[#cca762] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
                onClick={() => setIsSettingsModalOpen(true)}
                title="Hafıza ve Gizlilik Ayarları"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          )}
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
                <button
                  type="button"
                  onClick={() => setIsConsentModalOpen(true)}
                  className="hover:text-[#cca762] transition-colors cursor-pointer"
                  title="KVKK Açık Rıza ve Özel Nitelikli Veri Sözleşmesini Görüntüle"
                >
                  KVKK
                </button>
                <span>•</span>
                <Link
                  className="hover:text-[#cca762] transition-colors"
                  href="/askida-sirdas"
                >
                  Askıda Pusula
                </Link>
              </div>

              <div className="pt-1 px-1">
                <a
                  href="mailto:adnan.kus@hotmail.com?subject=Manevi%20Pusula%20-%20G%C3%B6r%C3%BC%C5%9F%2C%20%C3%96neri%20ve%20Tenkit"
                  className="flex items-center justify-center gap-1.5 w-full py-1 text-[11px] text-[#8b9ea0]/80 hover:text-[#cca762] transition-colors rounded hover:bg-[#0e2224]/50"
                  title="Görüş, öneri ve tenkitlerinizi bize iletin: adnan.kus@hotmail.com"
                >
                  <svg className="w-3.5 h-3.5 text-[#cca762]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <span>Görüş &amp; Tenkit Bildir</span>
                </a>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <a
                aria-label="Görüş, Öneri ve Tenkit (adnan.kus@hotmail.com)"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e2224] border border-[#1d3336] text-[#cca762] hover:text-[#dec288]"
                href="mailto:adnan.kus@hotmail.com?subject=Manevi%20Pusula%20-%20G%C3%B6r%C3%BC%C5%9F%2C%20%C3%96neri%20ve%20Tenkit"
                title="Görüş & Tenkit: adnan.kus@hotmail.com"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </a>
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

          <div className="flex items-center gap-2">
            <Link
              href="/tanitim"
              className={`${
                sidebarOpen ? "flex lg:hidden" : "flex"
              } h-9 w-9 items-center justify-center rounded-lg bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] text-[#8b9ea0] hover:text-[#cca762] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]`}
              title="Tanıtım & Ana Sayfaya Dön"
              aria-label="Tanıtım & Ana Sayfaya Dön"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setIsConsentModalOpen(true)}
              className={`${
                sidebarOpen ? "hidden sm:inline-flex lg:hidden" : "hidden sm:inline-flex"
              } items-center gap-1.5 rounded-lg bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] px-2.5 py-1.5 text-xs text-[#8b9ea0] hover:text-[#cca762] transition-colors`}
              title="KVKK Kalkanı ve Özel Nitelikli Kişisel Veri Metni"
            >
              <span className="h-2 w-2 rounded-full bg-[#459b95]" />
              <span className="font-medium">KVKK Kalkanı</span>
            </button>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className={`${
                sidebarOpen ? "hidden sm:inline-flex lg:hidden" : "hidden sm:inline-flex"
              } items-center gap-1.5 rounded-lg bg-[#201013] hover:bg-[#2d1418] border border-[#ffb4ab]/30 px-2.5 py-1.5 text-xs text-[#ffdad6] hover:text-white transition-colors`}
              title="Benlik Hafızamı Sıfırla / Tüm Verilerimi Sil (KVKK Unutulma Hakkı)"
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 text-[#ffb4ab]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Hafızamı Sıfırla</span>
            </button>
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
            <div className="mx-auto max-w-[720px] py-8 space-y-6">
              {activeMessages.map((msg, index) => {
                const prevMsg = index > 0 ? activeMessages[index - 1] : null;
                const currentDateKey = getDateGroupKey(msg.createdAt);
                const prevDateKey = prevMsg ? getDateGroupKey(prevMsg.createdAt) : null;
                const isNewDateGroup = index === 0 || currentDateKey !== prevDateKey;
                const dateLabel = getDatePillLabel(msg.createdAt);
                const timeString = formatMessageTime(msg.createdAt);
                const verifiedSources =
                  msg.role === "assistant" && msg.sources && msg.sources.length > 0
                    ? filterUsedSourcesByReply(msg.sources, msg.content)
                    : [];

                return (
                  <React.Fragment key={msg.id}>
                    {isNewDateGroup && dateLabel && (
                      <div className="sticky top-2 z-10 my-4 flex justify-center pointer-events-none">
                        <span className="inline-flex items-center rounded-full bg-[#0a1c1e]/90 border border-[#1d3336]/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-[#cca762] shadow-sm backdrop-blur-md">
                          {dateLabel}
                        </span>
                      </div>
                    )}

                    {msg.role === "user" ? (
                      <div className="flex justify-end animate-in fade-in duration-300">
                        <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tr-xs bg-[#0e2726] border border-[#459b95]/35 px-5 py-3.5 text-[#e1e9e8] shadow-xs">
                          <p
                            className="text-[15px] leading-relaxed whitespace-pre-wrap"
                            lang="tr"
                          >
                            {msg.content}
                          </p>
                          {timeString && (
                            <div className="mt-1 flex justify-end text-[10px] text-[#459b95]/80 select-none">
                              <time dateTime={msg.createdAt}>{timeString}</time>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <article
                        aria-label="Manevi Pusula Yanıtı"
                        className="flex items-start gap-3.5 sm:gap-4 animate-in fade-in duration-300"
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
                            {msg.intentMode === "ILIM_VE_SIYER" && (
                              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-md bg-[#0e2726] border border-[#459b95]/30 px-2 py-0.5 text-[11px] font-medium text-[#7dd3c8]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#459b95]" />
                                <span>Vakur İlim &amp; Hikmet Modu</span>
                              </div>
                            )}
                            {renderFormattedMessage(msg.content)}
                          </div>

                          {/* Retrieved Çelik Kasa Source Badges (Only sources genuinely cited/used in reply) */}
                          {verifiedSources.length > 0 && (
                            <div
                              aria-label="İktibas Edilen Hikmet Kaynakları"
                              className="flex flex-wrap items-center gap-2"
                            >
                              {verifiedSources.map((src) => (
                                <button
                                  type="button"
                                  key={src.id}
                                  onClick={() => setActiveDetailSource(src)}
                                  title="Detaylı âyet, hadis veya sohbet metnini incelemek için tıklayın"
                                  className="group inline-flex items-center gap-1.5 rounded-lg bg-[#0e2224] hover:bg-[#133235] border border-[#1d3336] hover:border-[#cca762]/60 px-2.5 py-1 text-xs text-[#8b9ea0] hover:text-[#e1e9e8] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="h-1.5 w-1.5 rounded-full bg-[#cca762] group-hover:scale-125 transition-transform"
                                  />
                                  <span className="font-medium text-[#e5cca0] group-hover:text-amber-300 transition-colors">
                                    {getSourceTypeLabel(src.sourceType)}:
                                  </span>
                                  <span className="truncate max-w-[200px] sm:max-w-[260px]">
                                    {src.sourceTitle}
                                  </span>
                                  <svg
                                    className="w-3 h-3 text-[#cca762]/60 group-hover:text-[#cca762] ml-0.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
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

                          {/* Message Action Bar & Timestamp */}
                          <div className="flex items-center justify-between pt-0.5 text-xs text-[#8b9ea0]/75">
                            <div className="flex items-center gap-2">
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

                              <a
                                href={`mailto:adnan.kus@hotmail.com?subject=${encodeURIComponent("Manevi Pusula - Hatalı Cevap / Tenkit Bildirimi")}&body=${encodeURIComponent(`Mesaj Tarihi: ${msg.createdAt}\nMesaj ID: ${msg.id}\nYanıt Kesiti:\n${msg.content.slice(0, 300)}...\n\n--- Görüş, Tenkit veya Hatalı Yanıt Düzeltme Öneriniz ---\n`)}`}
                                className="inline-flex items-center justify-center rounded-md p-1 text-[#8b9ea0]/75 hover:bg-[#0e2224] hover:text-[#cca762] transition-colors"
                                title="Hatalı cevap veya tenkit bildir (adnan.kus@hotmail.com)"
                                aria-label="Hatalı cevap veya tenkit bildir"
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
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                                  />
                                </svg>
                              </a>
                            </div>

                            {timeString && (
                              <time
                                dateTime={msg.createdAt}
                                className="text-[10px] text-[#8b9ea0]/60 select-none mr-1"
                              >
                                {timeString}
                              </time>
                            )}
                          </div>
                        </div>
                      </article>
                    )}
                  </React.Fragment>
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
                      {streamingIntentMode === "ILIM_VE_SIYER" && (
                        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-md bg-[#0e2726] border border-[#459b95]/30 px-2 py-0.5 text-[11px] font-medium text-[#7dd3c8]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#459b95]" />
                          <span>Vakur İlim &amp; Hikmet Modu</span>
                        </div>
                      )}
                      {streamingText ? (
                        renderFormattedMessage(streamingText)
                      ) : (
                        <div className="flex items-center gap-2.5 text-sm text-[#8b9ea0]">
                          <span className="h-2 w-2 rounded-full bg-[#cca762] animate-pulse" />
                          <span className="animate-in fade-in duration-300">
                            {contemplationPhrase}
                          </span>
                        </div>
                      )}
                    </div>

                    {streamingSources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {streamingSources.map((src) => (
                          <button
                            type="button"
                            key={src.id}
                            onClick={() => setActiveDetailSource(src)}
                            title="Detaylı âyet, hadis veya sohbet metnini incelemek için tıklayın"
                            className="group inline-flex items-center gap-1.5 rounded-lg bg-[#0e2224] hover:bg-[#133235] border border-[#1d3336] hover:border-[#cca762]/60 px-2.5 py-1 text-xs text-[#8b9ea0] hover:text-[#e1e9e8] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-[#cca762] group-hover:scale-125 transition-transform"
                            />
                            <span className="font-medium text-[#e5cca0] group-hover:text-amber-300 transition-colors">
                              {getSourceTypeLabel(src.sourceType)}:
                            </span>
                            <span className="truncate max-w-[200px] sm:max-w-[260px]">
                              {src.sourceTitle}
                            </span>
                            <svg
                              className="w-3 h-3 text-[#cca762]/60 group-hover:text-[#cca762] ml-0.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
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
                onClick={() => {
                  if (!hasGivenConsent) {
                    setIsConsentModalOpen(true);
                  }
                }}
                placeholder={
                  hasGivenConsent
                    ? "Gönlünü meşgul eden durumu buraya yaz..."
                    : "Sohbete başlamak için lütfen KVKK Açık Rıza onayını verin (tıklayın)..."
                }
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
              className="mt-2 text-center text-[11px] text-[#8b9ea0]/75 flex items-center justify-center flex-wrap gap-x-1.5 gap-y-0.5 leading-tight"
              lang="tr"
            >
              <span>Manevi Pusula fetva mercii değildir, hata yapabilir.</span>
              <span className="hidden sm:inline text-[#8b9ea0]/40">•</span>
              <span>
                Fıkıh:{" "}
                <a
                  className="font-medium text-[#e5cca0] hover:text-[#cca762] underline underline-offset-2"
                  href="tel:190"
                >
                  Alo 190
                </a>
              </span>
              <span className="text-[#8b9ea0]/40">•</span>
              <span>
                Acil:{" "}
                <a
                  className="font-medium text-[#ffdad6] hover:text-[#ffb4ab] underline underline-offset-2"
                  href="tel:112"
                >
                  112
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* FLOATING SUCCESS TOAST NOTIFICATION */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-[#0f2d24] border border-[#459b95] px-4 py-3 text-xs text-[#d2f8ea] shadow-2xl animate-in fade-in slide-in-from-top-4"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-[#4ade80] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* 1. KVKK KALKANI: AÇIK RIZA & ÖZEL NİTELİKLİ VERİ SÖZLEŞMESİ POP-UP */}
      {isConsentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kvkk-modal-title"
        >
          <div className="relative w-full max-w-xl rounded-2xl bg-[#091416] border border-[#cca762]/50 p-6 sm:p-7 shadow-2xl text-[#e1e9e8] space-y-5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#182823] border border-[#459b95]/40 px-3 py-1 text-xs text-[#a2e8dd]">
                <span className="h-2 w-2 rounded-full bg-[#459b95] animate-pulse" />
                <span className="font-medium">Hukuki Zırh • KVKK Kalkanı</span>
              </div>
              <h2
                id="kvkk-modal-title"
                className="font-heading text-xl sm:text-2xl font-semibold text-[#f5ebd7] tracking-tight"
              >
                Açık Rıza ve Özel Nitelikli Kişisel Veri Sözleşmesi
              </h2>
              <p className="text-xs text-[#8b9ea0] leading-relaxed">
                6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca
                manevi rehberlik mahremiyeti ve yasal güvenceniz
              </p>
            </div>

            {/* 3 Pillars Content */}
            <div className="space-y-3.5 text-xs">
              {/* 1. Açık Rıza Metni */}
              <div className="rounded-xl border border-[#cca762]/50 bg-[#16201a] p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#cca762] font-semibold text-[13px]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cca762]/20 text-[#cca762] text-[11px] font-bold">
                    1
                  </span>
                  <span>Açık Rıza Metni (Pop-up Onayı)</span>
                </div>
                <p className="text-[#f0e6d2] font-medium leading-relaxed italic pl-7 text-[13px]">
                  &ldquo;Size daha iyi bir manevi rehberlik sunabilmek adına,
                  aktardığınız anonimleştirilmiş durum özetlerinin şifrelenerek
                  hafızada tutulmasını kabul ediyorsunuz.&rdquo;
                </p>
              </div>

              {/* 2. Kendi İradesiyle Paylaşım İlkesi */}
              <div className="rounded-xl border border-[#1d3336] bg-[#0c181a] p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-[#7dd3c8] font-semibold text-[13px]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#459b95]/20 text-[#7dd3c8] text-[11px] font-bold">
                    2
                  </span>
                  <span>Kendi İradesiyle Paylaşım İlkesi (Hukuki Zırh)</span>
                </div>
                <p className="text-[#a0b5b7] leading-relaxed pl-7">
                  Türkiye&apos;de Kişisel Verileri Koruma Kanunu&apos;na (KVKK
                  md. 6) göre dini inanç, ruhsal durum ve ailevi bilgiler{" "}
                  <strong className="text-[#e1e9e8]">
                    &ldquo;Özel Nitelikli Kişisel Veri&rdquo;
                  </strong>{" "}
                  sınıfına girer. Hukukta temel kuraldır; kişi kendi rızasıyla
                  ve anonim bir ortamda durumunu anlatıyorsa ve sistem bunu
                  kimliğiyle eşleştirmiyorsa burada veri ihlali doğmaz. Manevi
                  Pusula kimlik bilgisi <strong className="font-bold text-[#e1e9e8]">(ad, soyad, T.C. kimlik numarası, ikametgah, telefon rehberi)</strong> talep
                  etmez; tamamen rastgele üretilmiş anonim oturum
                  anahtarıyla çalışır.
                </p>
              </div>

              {/* 3. Tek Tıkla Hafızamı Sil */}
              <div className="rounded-xl border border-[#1d3336] bg-[#0c181a] p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-[#ffb4ab] font-semibold text-[13px]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] text-[11px] font-bold">
                    3
                  </span>
                  <span>
                    Tek Tıkla Hafızamı Sil (Unutulma Hakkı - Right to be
                    Forgotten)
                  </span>
                </div>
                <p className="text-[#a0b5b7] leading-relaxed pl-7">
                  Dilediğiniz an sol menüde veya ekranın üst kısmında yer alan{" "}
                  <strong className="text-[#ffdad6]">
                    &ldquo;Benlik Hafızamı Sıfırla / Tüm Verilerimi Sil&rdquo;
                  </strong>{" "}
                  butonuna basabilirsiniz. Butona bastığınız an arka plandaki
                  tüm durum özetleri ve anonim JSON kaydı PostgreSQL veri
                  tabanından kalıcı olarak silinir. Kullanıcıya bu kontrolün
                  verilmesi sizi ve bizi KVKK nezdinde kusursuz kılar.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1d3336]/60">
              <Link
                href="/gizlilik-politikasi#ozel-nitelikli-veri"
                target="_blank"
                className="text-xs text-[#cca762] hover:text-[#dec288] underline underline-offset-4"
              >
                Detaylı Aydınlatma Metnini İncele →
              </Link>
              <button
                type="button"
                onClick={handleAcceptConsent}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#cca762] hover:bg-[#dec288] text-[#1b1406] font-semibold px-5 py-2.5 text-xs sm:text-sm transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
              >
                <span>Okudum, Açık Rıza Veriyorum ve Başla</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BENLİK HAFIZAMI SIFIRLA / TÜM VERİLERİMİ SİL CONFIRM MODAL */}
      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[#0d1618] border border-[#ffb4ab]/40 p-6 shadow-2xl text-[#e1e9e8] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#331418] border border-[#ffb4ab]/30 text-[#ffb4ab]">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </div>
              <div>
                <h2
                  id="reset-modal-title"
                  className="font-heading text-lg font-semibold text-[#ffdad6]"
                >
                  Benlik Hafızasını ve Tüm Verileri Sil
                </h2>
                <span className="text-[11px] text-[#ffb4ab]/80">
                  KVKK Unutulma Hakkı (Right to be Forgotten)
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#a0b5b7] leading-relaxed">
              <p>Bu işlem geri alınamaz. Onayladığınız takdirde:</p>
              <ul className="list-disc pl-5 space-y-1 text-[#e1e9e8]/90">
                <li>Cihazınızdaki tüm geçmiş sohbet kayıtları,</li>
                <li>Sunucuda tutulan anonim durum özetleri ve mesajlar,</li>
                <li>
                  Arka plandaki 4 bloklu dijital ikiz profil kaydınız (JSON),
                </li>
              </ul>
              <p className="pt-1 text-[#ffb4ab]">
                PostgreSQL veri tabanından kalıcı olarak silinecek ve oturumunuz
                tamamen sıfırlanacaktır.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setIsResetModalOpen(false)}
                className="rounded-xl bg-[#0e2224] hover:bg-[#132c2e] border border-[#1d3336] px-4 py-2 text-xs font-medium text-[#8b9ea0] hover:text-[#e1e9e8] transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={() => handlePurgeAllData()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#93000a] hover:bg-[#b3261e] text-white px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isPurging ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <span>Evet, Tüm Verilerimi Kalıcı Olarak Sil</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. HAFIZA & GİZLİLİK AYARLARI MODALI (OTOMATİK İMHA KALKANI) */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-[#091416] border border-[#cca762]/50 p-6 shadow-2xl text-[#e1e9e8] space-y-5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#182823] border border-[#459b95]/40 px-2.5 py-0.5 text-[11px] text-[#a2e8dd] mb-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#459b95]" />
                  <span>Otomatik İmha Kalkanı</span>
                </div>
                <h2
                  id="settings-modal-title"
                  className="font-heading text-xl font-semibold text-[#f5ebd7]"
                >
                  Hafıza ve Gizlilik Ayarları
                </h2>
                <p className="text-xs text-[#8b9ea0]">
                  Sohbet verisi ve benlik hafızanız için otomatik imha
                  kurallarını seçin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-lg p-1 text-[#8b9ea0] hover:bg-[#0e2224] hover:text-[#e1e9e8] transition-colors"
                aria-label="Ayarları kapat"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 3 Short & Crisp Options */}
            <div className="space-y-4 text-xs">
              {/* Option 1: Sayfayı/Uygulamayı Kapattığı An */}
              <div className="rounded-xl border border-[#1d3336] bg-[#0c181a] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cca762]/20 text-[#cca762] text-[11px] font-bold">
                      1
                    </span>
                    <span className="font-semibold text-[13px] text-[#e1e9e8]">
                      Sekme / Uygulama Kapanışında İmha
                    </span>
                  </div>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={privacySettings.autoPurgeOnClose}
                    onClick={() =>
                      handleUpdatePrivacySettings({
                        autoPurgeOnClose: !privacySettings.autoPurgeOnClose,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762] ${
                      privacySettings.autoPurgeOnClose
                        ? "bg-[#cca762]"
                        : "bg-[#1d3336]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#040F0F] shadow-lg ring-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        privacySettings.autoPurgeOnClose
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[#8b9ea0] leading-relaxed pl-7">
                  Sekmeyi kapattığınız veya uygulamadan çıktığınız an, arka
                  plana sinyal gönderilerek sohbet ve benlik hafızası
                  milisaniyeler içinde imha edilir.
                </p>
                <div className="pl-7 pt-0.5">
                  <span
                    className={`text-[11px] font-medium ${
                      privacySettings.autoPurgeOnClose
                        ? "text-[#cca762]"
                        : "text-[#8b9ea0]/70"
                    }`}
                  >
                    Durum:{" "}
                    {privacySettings.autoPurgeOnClose
                      ? "Aktif (Kapanışta anında silinir)"
                      : "Kapalı (Oturum cihazda saklanır)"}
                  </span>
                </div>
              </div>

              {/* Option 2: Belirli Bir Süre Hareketsizlik */}
              <div className="rounded-xl border border-[#1d3336] bg-[#0c181a] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#459b95]/20 text-[#7dd3c8] text-[11px] font-bold">
                    2
                  </span>
                  <span className="font-semibold text-[13px] text-[#e1e9e8]">
                    Hareketsizlik Zaman Aşımı (Inactivity Timeout)
                  </span>
                </div>
                <p className="text-[#8b9ea0] leading-relaxed pl-7">
                  Uygulama açık unutulup işlem yapılmazsa, belirlenen süre
                  dolduğunda güvenlik gereği hafıza otomatik sıfırlanır.
                </p>
                <div className="pl-7 flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: "Kapalı", value: 0 },
                    { label: "15 Dk", value: 15 },
                    { label: "30 Dk (Önerilen)", value: 30 },
                    { label: "60 Dk", value: 60 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        handleUpdatePrivacySettings({
                          inactivityTimeoutMinutes: opt.value,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        privacySettings.inactivityTimeoutMinutes === opt.value
                          ? "bg-[#cca762] text-[#1b1406] font-semibold"
                          : "bg-[#0e2224] text-[#8b9ea0] hover:text-[#e1e9e8] border border-[#1d3336]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Zaman Ayarlı Kendini İmhâ (TTL) */}
              <div className="rounded-xl border border-[#1d3336] bg-[#0c181a] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] text-[11px] font-bold">
                    3
                  </span>
                  <span className="font-semibold text-[13px] text-[#e1e9e8]">
                    Zaman Ayarlı Kendini İmhâ (TTL)
                  </span>
                </div>
                <p className="text-[#8b9ea0] leading-relaxed pl-7">
                  Veri tabanındaki kayıtlar için son kullanma tarihi tanımlanır;
                  süre dolduğunda arka plandaki hafıza kaydı kendi kendine
                  siler.
                </p>
                <div className="pl-7 flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: "12 Saat", value: 12 },
                    { label: "24 Saat (Önerilen)", value: 24 },
                    { label: "3 Gün (72s)", value: 72 },
                    { label: "Süresiz (Manuel)", value: 0 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        handleUpdatePrivacySettings({
                          ttlHours: opt.value,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        privacySettings.ttlHours === opt.value
                          ? "bg-[#cca762] text-[#1b1406] font-semibold"
                          : "bg-[#0e2224] text-[#8b9ea0] hover:text-[#e1e9e8] border border-[#1d3336]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#1d3336]/60">
              <button
                type="button"
                onClick={() => {
                  handleUpdatePrivacySettings(DEFAULT_PRIVACY_SETTINGS);
                  setToastMsg("Varsayılan gizlilik ayarları yüklendi.");
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="text-xs text-[#8b9ea0] hover:text-[#cca762] transition-colors"
              >
                Varsayılanlara Sıfırla
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setToastMsg("✅ Hafıza ve gizlilik ayarlarınız kaydedildi.");
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="rounded-xl bg-[#cca762] hover:bg-[#dec288] text-[#1b1406] font-semibold px-4 py-2 text-xs transition-colors"
              >
                Kaydet ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salt Okunur Sırdaş Profilim Modalı */}
      <dialog
        ref={profileDialogRef}
        {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby="profile-modal-title"
        className="m-auto w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-[#1d3336] bg-[#081517] p-6 text-[#e1e9e8] focus:outline-none"
      >
        <div className="space-y-5">
          {/* Başlık */}
          <div className="flex items-start justify-between gap-4 border-b border-[#1d3336]/70 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0e2224] border border-[#cca762]/35 text-[#cca762] text-sm font-semibold">
                {userProfile.preferred_name ? (
                  userProfile.preferred_name.charAt(0).toLocaleUpperCase("tr-TR")
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <h2
                  id="profile-modal-title"
                  className="font-heading text-lg font-semibold text-[#e1e9e8] truncate"
                >
                  {userProfile.preferred_name
                    ? `${userProfile.preferred_name} • Sırdaş Profilim`
                    : "Sırdaş Profilim"}
                </h2>
                <p className="text-xs text-[#9cb0b2] mt-0.5 leading-relaxed">
                  Hasbihallerinizden otomatik olarak öğrenilen ve size özel tutulan hafıza özeti.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseProfileModal}
              className="rounded-lg p-1.5 text-[#9cb0b2] hover:bg-[#132c2e] hover:text-[#e1e9e8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
              aria-label="Profili kapat"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Kimlik & Manevi Seyir Özeti (Salt Okunur) */}
          <div className="space-y-3 border-b border-[#1d3336]/70 pb-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-[#9cb0b2]">Hitap İsmi</div>
                <div className="mt-1 text-sm font-medium text-[#e1e9e8]">
                  {userProfile.preferred_name || "Henüz paylaşılmadı"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9cb0b2]">Manevi Seyir Evresi</div>
                <div className="mt-1 text-sm font-medium text-[#cca762]">
                  {SPIRITUAL_STAGE_LABELS[
                    userProfile.spiritual_stage || "ARAYIS_VE_BASLANGIC"
                  ]?.title || "Arayış ve Başlangıç"}
                </div>
              </div>
            </div>

            {(userProfile.roles || []).length > 0 && (
              <div className="pt-1">
                <div className="text-xs text-[#9cb0b2] mb-1.5">
                  Tanınan Hayat Bağlamı
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(userProfile.roles || []).map((roleKey) => (
                    <span
                      key={roleKey}
                      className="rounded-md bg-[#0e2224] border border-[#1d3336] px-2.5 py-1 text-xs text-[#e1e9e8]"
                    >
                      {ROLE_LABELS[roleKey] || roleKey}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sırdaş'ın Tuttuğu Kalıcı Notlar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#e1e9e8]">
                Sırdaş&apos;ın Tuttuğu Kalıcı Notlar
              </h3>
              <span className="text-xs text-[#9cb0b2]">
                {(userProfile.known_facts || []).length} kayıt
              </span>
            </div>

            {(userProfile.known_facts || []).length > 0 ? (
              <ul className="space-y-1.5">
                {(userProfile.known_facts || []).map((fact, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-lg bg-[#0c181a] border border-[#1d3336]/80 px-3 py-2 text-xs text-[#e1e9e8] leading-relaxed"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#cca762]"
                    />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#9cb0b2] leading-relaxed py-2">
                Sohbet içinde paylaştığınız yaşam durumları, ruhsal hassasiyetleriniz, sağlık süreçleriniz ve dua niyetleriniz burada kendiliğinden birikir.
              </p>
            )}
          </div>

          {/* Alt Bilgi & Kapat */}
          <form
            method="dialog"
            className="flex items-center justify-between gap-4 border-t border-[#1d3336]/70 pt-4"
          >
            <span className="text-xs text-[#9cb0b2] leading-snug">
              Dilediğiniz an sol alttaki silme butonuyla tüm hafızayı sıfırlayabilirsiniz.
            </span>
            <button
              type="submit"
              autoFocus
              className="shrink-0 rounded-xl bg-[#cca762] hover:bg-[#dec288] text-[#1b1406] font-semibold px-4 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca762]"
            >
              Kapat
            </button>
          </form>
        </div>
      </dialog>

      {/* Çelik Kasa RAG Sahih Mushaf & Hikmet Kitabı Modalı */}
      <SourceBookModal
        source={activeDetailSource}
        onClose={() => setActiveDetailSource(null)}
      />
    </div>
  );
}
