"use client";

import { useMemo, useState } from "react";
import esma from "@/lib/esmaul-husna.json";

type Isim = { no: number; ad: string; arapca: string; anlam: string };
const ISIMLER = esma as Isim[];

function sadelestir(m: string): string {
  return m
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/^(el|er|es|en|ed|ez|et|eş)-/, "")
    .replace(/[^a-z0-9ğüşöç ]/g, "");
}

export function EsmaulHusna() {
  const [arama, setArama] = useState("");
  const gorunen = useMemo(() => {
    const a = sadelestir(arama.trim());
    if (!a) return ISIMLER;
    return ISIMLER.filter((i) => String(i.no) === a || sadelestir(i.ad).includes(a) || sadelestir(i.anlam).includes(a));
  }, [arama]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={arama}
        onChange={(e) => setArama(e.target.value)}
        aria-label="İsim veya anlam ara"
        placeholder="İsim veya anlam ara"
        className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-high px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/15"
      />
      {gorunen.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Bu aramayla eşleşen isim bulunamadı.</p>
      ) : (
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gorunen.map((i) => (
            <li key={i.no} className="rounded-2xl border border-outline-variant/40 bg-surface-container/75 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-primary/40 px-2 text-xs font-semibold text-primary">
                  {i.no}
                </span>
                <span className="flex-1 pt-1 font-heading text-lg font-semibold text-on-surface">{i.ad}</span>
                <span className="font-arabic text-2xl leading-[1.8] text-primary/90" dir="rtl" lang="ar">
                  {i.arapca}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{i.anlam}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
