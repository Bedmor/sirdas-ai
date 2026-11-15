"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Uygulama genelinde TEK ses oynatıcı (kök yerleşimde durur).
 * Sayfa değişse de <audio> öğesi yerinde kaldığı için hutbe arkada çalmaya devam eder.
 * Dış servis yok: yalnız hutbenin kendi ses adresi çalınır.
 */

export const HIZLAR = [1, 1.25, 1.5] as const;
export type Hiz = (typeof HIZLAR)[number];

export type Parca = { src: string; baslik: string; altBaslik?: string };

type SesDurumu = {
  parca: Parca | null;
  caliyor: boolean;
  yukleniyor: boolean;
  sure: number;
  konum: number;
  hiz: Hiz;
  hata: boolean;
};

type SesBaglami = SesDurumu & {
  cal: (p: Parca) => void;
  duraklat: () => void;
  devam: () => void;
  git: (saniye: number) => void;
  atla: (fark: number) => void;
  hizAyarla: (h: Hiz) => void;
  kapat: () => void;
};

const Baglam = createContext<SesBaglami | null>(null);

export function useSesOynatici(): SesBaglami | null {
  return useContext(Baglam);
}

export function sureYaz(saniye: number): string {
  if (!Number.isFinite(saniye) || saniye < 0) return "0:00";
  const s = Math.floor(saniye);
  const sa = Math.floor(s / 3600);
  const dk = Math.floor((s % 3600) / 60);
  const sn = String(s % 60).padStart(2, "0");
  return sa > 0 ? `${sa}:${String(dk).padStart(2, "0")}:${sn}` : `${dk}:${sn}`;
}

export function SesOynaticiSaglayici({ children }: { children: React.ReactNode }) {
  const ses = useRef<HTMLAudioElement | null>(null);
  const parcaRef = useRef<Parca | null>(null);
  const hizRef = useRef<Hiz>(1);
  const [d, setD] = useState<SesDurumu>({
    parca: null,
    caliyor: false,
    yukleniyor: false,
    sure: 0,
    konum: 0,
    hiz: 1,
    hata: false,
  });

  useEffect(() => {
    const a = ses.current;
    if (!a) return;
    const g = (p: Partial<SesDurumu>) => setD((o) => ({ ...o, ...p }));
    const olaylar: [string, () => void][] = [
      ["play", () => g({ caliyor: true, hata: false })],
      ["pause", () => g({ caliyor: false })],
      ["ended", () => g({ caliyor: false })],
      ["waiting", () => g({ yukleniyor: true })],
      ["playing", () => g({ yukleniyor: false })],
      ["canplay", () => g({ yukleniyor: false })],
      ["loadedmetadata", () => g({ sure: a.duration || 0 })],
      ["durationchange", () => g({ sure: a.duration || 0 })],
      ["timeupdate", () => g({ konum: a.currentTime })],
      ["error", () => g({ hata: true, caliyor: false, yukleniyor: false })],
    ];
    olaylar.forEach(([o, f]) => a.addEventListener(o, f));
    return () => olaylar.forEach(([o, f]) => a.removeEventListener(o, f));
  }, []);

  const cal = useCallback((p: Parca) => {
    const a = ses.current;
    if (!a) return;
    if (parcaRef.current?.src !== p.src) {
      parcaRef.current = p;
      a.src = p.src;
      a.defaultPlaybackRate = hizRef.current;
      a.playbackRate = hizRef.current;
      setD((o) => ({ ...o, parca: p, konum: 0, sure: 0, yukleniyor: true, hata: false }));
    }
    a.play().catch(() => setD((o) => ({ ...o, caliyor: false, yukleniyor: false })));
  }, []);

  const duraklat = useCallback(() => ses.current?.pause(), []);
  const devam = useCallback(() => {
    ses.current?.play().catch(() => undefined);
  }, []);
  const git = useCallback((s: number) => {
    const a = ses.current;
    if (a && Number.isFinite(s)) a.currentTime = Math.max(0, Math.min(s, a.duration || s));
  }, []);
  const atla = useCallback((fark: number) => {
    const a = ses.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.currentTime + fark, a.duration || a.currentTime + fark));
  }, []);
  const hizAyarla = useCallback((h: Hiz) => {
    hizRef.current = h;
    if (ses.current) {
      ses.current.defaultPlaybackRate = h;
      ses.current.playbackRate = h;
    }
    setD((o) => ({ ...o, hiz: h }));
  }, []);
  const kapat = useCallback(() => {
    parcaRef.current = null;
    const a = ses.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setD((o) => ({ ...o, parca: null, caliyor: false, konum: 0, sure: 0, yukleniyor: false, hata: false }));
  }, []);

  const deger = useMemo<SesBaglami>(
    () => ({ ...d, cal, duraklat, devam, git, atla, hizAyarla, kapat }),
    [d, cal, duraklat, devam, git, atla, hizAyarla, kapat],
  );

  return (
    <Baglam.Provider value={deger}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- hutbe sesi; metni aynı sayfada yazılı olarak duruyor */}
      <audio ref={ses} preload="none" className="hidden" />
    </Baglam.Provider>
  );
}

/** Küçük oynatıcı: bir hutbe yüklüyken başka sayfalarda da görünür (çal/duraklat, kapat). */
export function MiniOynatici({ className = "" }: { className?: string }) {
  const s = useSesOynatici();
  if (!s || !s.parca) return null;
  const oran = s.sure > 0 ? Math.min(100, (s.konum / s.sure) * 100) : 0;
  return (
    <div
      role="region"
      aria-label="Çalan hutbe"
      className={`mp-mini-oynatici relative flex items-center gap-2 overflow-hidden rounded-full border border-primary/40 bg-surface-container-high/95 py-1 pl-1 pr-2 shadow-m3-2 backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={s.caliyor ? s.duraklat : s.devam}
        aria-label={s.caliyor ? "Hutbeyi duraklat" : "Hutbeyi sürdür"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <i aria-hidden="true" className={`ph ${s.caliyor ? "ph-pause" : "ph-play"} text-base`}></i>
      </button>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[12px] font-semibold text-on-surface">{s.parca.baslik}</p>
        <p className="truncate text-[11px] text-on-surface-variant">
          {s.hata ? "Ses açılamadı" : `${sureYaz(s.konum)} / ${sureYaz(s.sure)} · ${s.hiz}x`}
        </p>
      </div>
      <button
        type="button"
        onClick={s.kapat}
        aria-label="Oynatıcıyı kapat"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <i aria-hidden="true" className="ph ph-x text-base"></i>
      </button>
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] bg-primary/70" style={{ width: `${oran}%` }} />
    </div>
  );
}
