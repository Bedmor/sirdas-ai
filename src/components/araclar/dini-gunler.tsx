"use client";

import { useEffect, useMemo, useState } from "react";
import veri from "@/lib/dini-gunler.json";

type Gun = { tarih: string; ad: string; hicri?: string; tur: string; gun?: string; not?: string };
const GUNLER = (veri as { gunler: Gun[] }).gunler;
const ACIKLAMA = (veri as { aciklamalar: Record<string, string> }).aciklamalar;

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function tarihYaz(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${AYLAR[m - 1]} ${y}`;
}

/** "Kurban Bayramı 2. Gün" -> "Kurban Bayramı" açıklaması */
function aciklamaBul(ad: string): string | undefined {
  return ACIKLAMA[ad] ?? ACIKLAMA[ad.replace(/\s+\d+\.\s*Gün$/, "")];
}

function bugunIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + "T12:00:00") - Date.parse(a + "T12:00:00")) / 86_400_000);
}

export function DiniGunler() {
  const [bugun, setBugun] = useState<string | null>(null);
  const [gecmisiGoster, setGecmisiGoster] = useState(false);
  useEffect(() => setBugun(bugunIso()), []);

  const { siradaki, liste } = useMemo(() => {
    const b = bugun ?? "0000-00-00";
    const gelecek = GUNLER.filter((g) => g.tarih >= b);
    return { siradaki: bugun ? gelecek[0] : undefined, liste: gecmisiGoster ? GUNLER : gelecek };
  }, [bugun, gecmisiGoster]);

  const yillar = useMemo(() => {
    const m = new Map<string, Gun[]>();
    for (const g of liste) {
      const y = g.tarih.slice(0, 4);
      m.set(y, [...(m.get(y) ?? []), g]);
    }
    return [...m.entries()];
  }, [liste]);

  return (
    <div className="space-y-6">
      {siradaki && bugun && (
        <div className="rounded-3xl border border-primary/40 bg-primary/10 p-5 text-center space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Sıradaki mübarek gün</p>
          <p className="font-heading text-2xl font-semibold text-on-surface">{siradaki.ad}</p>
          <p className="text-sm text-slate-200">
            {tarihYaz(siradaki.tarih)}
            {siradaki.gun ? `, ${siradaki.gun}` : ""}
            {siradaki.hicri ? ` · ${siradaki.hicri}` : ""}
          </p>
          <p className="text-lg font-semibold text-primary">
            {gunFarki(bugun, siradaki.tarih) === 0 ? "Bugün" : `${gunFarki(bugun, siradaki.tarih)} gün kaldı`}
          </p>
          {aciklamaBul(siradaki.ad) && (
            <p className="text-sm leading-relaxed text-slate-300 max-w-lg mx-auto">{aciklamaBul(siradaki.ad)}</p>
          )}
        </div>
      )}

      {yillar.map(([yil, gunler]) => (
        <section key={yil} className="space-y-2.5">
          <h2 className="font-heading text-xl font-semibold text-on-surface">{yil}</h2>
          <ul className="space-y-2">
            {gunler.map((g) => {
              const gecti = bugun ? g.tarih < bugun : false;
              const aciklama = aciklamaBul(g.ad);
              return (
                <li
                  key={g.tarih + g.ad}
                  className={`rounded-2xl border border-outline-variant/40 bg-surface-container/70 px-4 py-3 ${gecti ? "opacity-55" : ""}`}
                >
                  <details>
                    <summary className="flex cursor-pointer list-none items-center gap-3">
                      <span className="w-[4.5rem] shrink-0 text-sm font-semibold text-primary">{tarihYaz(g.tarih).replace(/ \d{4}$/, "")}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-on-surface">{g.ad}</span>
                        <span className="block text-xs text-on-surface-variant">
                          {g.gun}
                          {g.hicri ? ` · ${g.hicri}` : ""}
                        </span>
                      </span>
                      {aciklama && <i aria-hidden="true" className="ph ph-caret-down text-on-surface-variant"></i>}
                    </summary>
                    {(aciklama || g.not) && (
                      <div className="mt-2 space-y-1 pl-[5.25rem] text-sm leading-relaxed text-slate-300">
                        {aciklama && <p>{aciklama}</p>}
                        {g.not && <p className="text-xs text-on-surface-variant">{g.not}</p>}
                      </div>
                    )}
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setGecmisiGoster((v) => !v)}
          className="rounded-full border border-outline-variant/50 px-4 py-2 text-sm text-on-surface-variant hover:text-primary"
        >
          {gecmisiGoster ? "Geçmiş günleri gizle" : "Geçmiş günleri de göster"}
        </button>
      </div>
    </div>
  );
}
