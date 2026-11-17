"use client";

import { useEffect, useState } from "react";
import {
  CEVAP_UZUNLUGU_ANAHTAR,
  CEVAP_UZUNLUKLARI,
  cevapUzunluguCoz,
  type CevapUzunlugu,
} from "@/lib/sohbet/cevap-uzunlugu";

/** Kullanıcının seçtiği cevap uzunluğu; cihazda saklanır (Adnan abi 17.11 isteği). */
export function useCevapUzunlugu(): [CevapUzunlugu, (u: CevapUzunlugu) => void] {
  const [uzunluk, setUzunluk] = useState<CevapUzunlugu>("NORMAL");
  useEffect(() => {
    try {
      setUzunluk(cevapUzunluguCoz(window.localStorage.getItem(CEVAP_UZUNLUGU_ANAHTAR)));
    } catch {
      /* depolama kapalıysa varsayılan kalır */
    }
  }, []);
  const degistir = (u: CevapUzunlugu) => {
    setUzunluk(u);
    try {
      window.localStorage.setItem(CEVAP_UZUNLUGU_ANAHTAR, u);
    } catch {
      /* depolama kapalıysa yalnız bu oturumda geçerli */
    }
  };
  return [uzunluk, degistir];
}

export function CevapUzunluguSecici({
  deger,
  onDegis,
  className = "",
}: {
  deger: CevapUzunlugu;
  onDegis: (u: CevapUzunlugu) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Cevap uzunluğu"
      className={`flex items-center justify-center gap-1.5 text-[12px] text-on-surface-variant ${className}`}
    >
      <span className="mr-0.5">Cevap:</span>
      {CEVAP_UZUNLUKLARI.map((s) => {
        const secili = s.deger === deger;
        return (
          <button
            key={s.deger}
            type="button"
            role="radio"
            aria-checked={secili}
            title={s.aciklama}
            onClick={() => onDegis(s.deger)}
            onMouseDown={(e) => e.preventDefault()}
            className={`rounded-full px-2.5 py-0.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              secili
                ? "border-primary/70 bg-primary/15 text-primary font-semibold"
                : "border-outline-variant/50 hover:text-primary hover:border-primary/40"
            }`}
          >
            {s.etiket}
          </button>
        );
      })}
    </div>
  );
}
