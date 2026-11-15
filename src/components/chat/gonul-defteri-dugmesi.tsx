"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  GONUL_DEFTERI_ANAHTAR,
  GONUL_DEFTERI_OLAY,
  defterDegistir,
  defterdeMi,
  defteriOku,
  type GonulKaydi,
} from "@/lib/sohbet/gonul-defteri";

/** Gönül Defteri: yalnız bu cihazda (localStorage) tutulur; sunucuya hiçbir şey gönderilmez. */

function depo(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useGonulDefteri() {
  const [kayitlar, setKayitlar] = useState<GonulKaydi[]>([]);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    const yenile = () => setKayitlar(defteriOku(depo()));
    yenile();
    setHazir(true);
    const depoDinle = (e: StorageEvent) => {
      if (e.key === null || e.key === GONUL_DEFTERI_ANAHTAR) yenile();
    };
    window.addEventListener(GONUL_DEFTERI_OLAY, yenile);
    window.addEventListener("storage", depoDinle);
    return () => {
      window.removeEventListener(GONUL_DEFTERI_OLAY, yenile);
      window.removeEventListener("storage", depoDinle);
    };
  }, []);

  const degistir = useCallback(
    (islem: Parameters<typeof defterDegistir>[1]): boolean => {
      const d = depo();
      if (!d) return false;
      const { liste, yazildi } = defterDegistir(d, islem);
      setKayitlar(liste);
      window.dispatchEvent(new Event(GONUL_DEFTERI_OLAY));
      return yazildi;
    },
    [],
  );

  return { kayitlar, hazir, degistir };
}

export function GonulDefteriDugmesi({
  id,
  metin,
  className = "",
  onBildirim,
}: {
  id: string;
  metin: string;
  className?: string;
  onBildirim?: (mesaj: string) => void;
}) {
  const { kayitlar, hazir, degistir } = useGonulDefteri();
  if (!hazir) return null;
  const ekli = defterdeMi(kayitlar, id);

  return (
    <button
      type="button"
      aria-pressed={ekli}
      aria-label={ekli ? "Gönül Defterimden çıkar" : "Gönül Defterime ekle"}
      title={ekli ? "Gönül Defterinizde kayıtlı (çıkarmak için dokunun)" : "Gönül Defterime ekle (yalnız bu cihazda saklanır)"}
      onClick={() => {
        const ok = ekli
          ? degistir({ tur: "cikar", id })
          : degistir({ tur: "ekle", kayit: { id, metin, eklenme: new Date().toISOString() } });
        if (!ok) onBildirim?.("Bu cihazda kayıt yapılamıyor (tarayıcı depolaması kapalı).");
        else onBildirim?.(ekli ? "Gönül Defterinizden çıkarıldı." : "Gönül Defterinize eklendi.");
      }}
      className={`${className} ${ekli ? "text-primary" : ""}`}
    >
      <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={ekli ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3.75h12a.75.75 0 0 1 .75.75v16.2a.4.4 0 0 1-.62.33L12 17l-6.13 4.03a.4.4 0 0 1-.62-.33V4.5A.75.75 0 0 1 6 3.75Z" strokeLinejoin="round" />
      </svg>
      <span>{ekli ? "Defterimde" : "Deftere ekle"}</span>
    </button>
  );
}
