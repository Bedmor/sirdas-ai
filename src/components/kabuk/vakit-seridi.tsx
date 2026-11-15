"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  NAMAZ_SECIM_ANAHTAR,
  bolgeZamani,
  kalanSureKisa,
  siradakiVakit,
  vakteKalanEtiketi,
  type VakitYaniti,
} from "@/lib/araclar/namaz-vakitleri";

/**
 * Logo altındaki ince canlı vakit şeridi: "İkindiye kalan 01:42".
 * Namaz vakitleri aracının kaydettiği il/ilçe seçimini ve aynı ara katmanı (/api/namaz-vakitleri)
 * kullanır; yeni dış servis yoktur. Seçim yoksa kibarca il seçmeye çağırır.
 * Sayfa geçişlerinde tekrar istek atmamak için günün verisi oturum deposunda tutulur.
 */

type Secim = { il: { id: string; ad: string }; ilce: { id: string; ad: string } };
const ONBELLEK = "manevi-pusula:vakit-seridi:v1";

function secimOku(): Secim | null {
  try {
    const ham = window.localStorage.getItem(NAMAZ_SECIM_ANAHTAR);
    if (!ham) return null;
    const k = JSON.parse(ham) as Secim;
    if (/^\d+$/.test(String(k?.il?.id)) && /^\d+$/.test(String(k?.ilce?.id))) return k;
  } catch {
    /* yok say */
  }
  return null;
}

function yerAdi(s: Secim): string {
  return s.ilce.ad && s.ilce.ad !== s.il.ad ? s.ilce.ad : s.il.ad;
}

type Durum =
  | { tur: "bekliyor" }
  | { tur: "secimYok" }
  | { tur: "hazir"; veri: VakitYaniti; yer: string }
  | { tur: "hata" };

export function VakitSeridi({ className = "" }: { className?: string }) {
  const [durum, setDurum] = useState<Durum>({ tur: "bekliyor" });
  const [simdi, setSimdi] = useState<Date | null>(null);

  useEffect(() => {
    let iptal = false;
    const secim = secimOku();
    if (!secim) {
      setDurum({ tur: "secimYok" });
      return;
    }
    const anahtar = `${secim.il.id}:${secim.ilce.id}`;
    try {
      const ham = window.sessionStorage.getItem(ONBELLEK);
      if (ham) {
        const o = JSON.parse(ham) as { anahtar: string; veri: VakitYaniti };
        if (o.anahtar === anahtar && siradakiVakit(o.veri.gunler, bolgeZamani(new Date(), o.veri.saatDilimi))) {
          setDurum({ tur: "hazir", veri: o.veri, yer: yerAdi(secim) });
          return;
        }
      }
    } catch {
      /* önbellek okunamadı; yeniden alınır */
    }
    fetch(`/api/namaz-vakitleri?il=${encodeURIComponent(secim.il.id)}&ilce=${encodeURIComponent(secim.ilce.id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<VakitYaniti>) : Promise.reject(new Error("vakit"))))
      .then((veri) => {
        if (iptal || !Array.isArray(veri?.gunler)) return;
        try {
          window.sessionStorage.setItem(ONBELLEK, JSON.stringify({ anahtar, veri }));
        } catch {
          /* yok say */
        }
        setDurum({ tur: "hazir", veri, yer: yerAdi(secim) });
      })
      .catch(() => !iptal && setDurum({ tur: "hata" }));
    return () => {
      iptal = true;
    };
  }, []);

  useEffect(() => {
    if (durum.tur !== "hazir") return;
    setSimdi(new Date());
    const t = window.setInterval(() => setSimdi(new Date()), 15000);
    return () => window.clearInterval(t);
  }, [durum.tur]);

  const kap = `mp-vakit-seridi flex h-7 shrink-0 items-center justify-center gap-1.5 border-b border-outline-variant/30 bg-surface-container-low px-3 text-[12px] leading-none text-on-surface-variant ${className}`;

  if (durum.tur === "secimYok") {
    return (
      <div className={kap}>
        <i aria-hidden="true" className="ph ph-hourglass-medium text-[13px] text-primary"></i>
        <Link
          href="/araclar/namaz-vakitleri"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Vakit için il seçin
        </Link>
      </div>
    );
  }

  if (durum.tur === "hata") return null;

  if (durum.tur === "bekliyor" || !simdi) {
    // Yer tutucu: şerit belirdiğinde sayfa zıplamasın.
    return <div aria-hidden="true" className={kap} />;
  }

  const sv = siradakiVakit(durum.veri.gunler, bolgeZamani(simdi, durum.veri.saatDilimi));
  if (!sv) return <div aria-hidden="true" className={kap} />;

  return (
    <Link
      href="/araclar/namaz-vakitleri"
      className={`${kap} transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary`}
      aria-label={`${vakteKalanEtiketi(sv.anahtar)} ${kalanSureKisa(sv.kalanSaniye)}, ${durum.yer}. Namaz vakitlerini aç.`}
    >
      <i aria-hidden="true" className="ph ph-hourglass-medium text-[13px] text-primary"></i>
      <span>{vakteKalanEtiketi(sv.anahtar)}:</span>
      <span className="font-semibold tabular-nums text-on-surface">{kalanSureKisa(sv.kalanSaniye)}</span>
      <span aria-hidden="true" className="text-on-surface-variant/50">·</span>
      <span className="max-w-[9rem] truncate">{durum.yer}</span>
    </Link>
  );
}
