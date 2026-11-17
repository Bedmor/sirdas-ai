"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SureOzeti } from "@/lib/kuran";

function sadelestir(metin: string): string {
  return metin
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9ğüşöç ]/g, "")
    .trim();
}

export function SureListesi({ sureler }: { sureler: SureOzeti[] }) {
  const [arama, setArama] = useState("");
  const gorunen = useMemo(() => {
    const a = sadelestir(arama);
    if (!a) return sureler;
    return sureler.filter((s) => String(s.no) === a || sadelestir(s.ad).includes(a));
  }, [arama, sureler]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">Sure ara</span>
        <input
          type="search"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Sure adı veya numarası (ör. Yâsîn)"
          className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-high px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/15"
        />
      </label>

      {gorunen.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Bu aramayla eşleşen sure bulunamadı.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {gorunen.map((s) => (
            <li key={s.no}>
              <Link
                href={`/araclar/kuran/${s.no}`}
                className="flex items-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container/85 px-4 py-3 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 text-sm font-semibold text-primary">
                  {s.no}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-on-surface">{s.ad} Suresi</span>
                  <span className="block text-xs text-on-surface-variant">
                    {s.ayetSayisi} ayet · {s.yer}
                  </span>
                </span>
                <span className="font-arabic text-xl text-primary/90" dir="rtl" lang="ar">
                  {s.arapcaAd}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
