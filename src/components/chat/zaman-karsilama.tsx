"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DILIM_ADLARI, vakitAyetiSec, type VakitAyeti } from "@/lib/araclar/vakit-ayeti";
import { turkiyeAni, zamanAkisi, type ZamanAkisi } from "@/lib/sohbet/zaman-akisi";

/**
 * Sohbetin ilk ekranı: Türkiye saatine göre karşılama, o vakte uygun kısa öneri
 * ve mevcut vakit ayeti (aynı gün dilimi, aynı veri). Öneri yalnızca yazıdır;
 * hazır soru kartı yoktur.
 */
export function ZamanKarsilama() {
  const [akis, setAkis] = useState<ZamanAkisi | null>(null);
  const [ayet, setAyet] = useState<VakitAyeti | null>(null);
  const [cuma, setCuma] = useState(false);

  useEffect(() => {
    const guncelle = () => {
      const an = new Date();
      setAkis(zamanAkisi(an));
      setCuma(turkiyeAni(an).haftaGunu === 5);
      setAyet(vakitAyetiSec(an, turkiyeAni(an).saat).ayet);
    };
    guncelle();
    const t = window.setInterval(guncelle, 5 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <>
      <p
        className="mb-3 min-h-[1.75rem] text-sm font-semibold tracking-wide text-primary"
        lang="tr"
        aria-live="polite"
      >
        {akis
          ? [akis.gunNotu, akis.gunNotu && akis.selam === "Hayırlı günler" ? null : akis.selam]
              .filter(Boolean)
              .join(" · ")
          : ""}
      </p>
      {cuma && (
        <p className="-mt-1 mb-3 text-sm" lang="tr">
          <Link
            href="/araclar/cuma-hutbesi"
            className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4 hover:no-underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <i aria-hidden="true" className="ph ph-book-open-text text-base"></i>
            Bu haftanın hutbesi
          </Link>
        </p>
      )}

      <h1
        className="font-heading text-3xl sm:text-4xl font-normal text-on-surface tracking-tight leading-snug mb-4"
        lang="tr"
      >
        Selamün aleyküm kardeşim, gönlünü ne meşgul ediyor?
      </h1>

      <p className="text-[15px] text-on-surface-variant leading-[1.8] max-w-[54ch]" lang="tr">
        İçini daraltan imtihanı, kederi veya tefekkür etmek istediğin meseleyi dilediğin gibi paylaşabilirsin.
        Burada konuşulanlar Kur&apos;an ve Sünnet hikmetiyle, yargılamadan dinlenir.
      </p>

      {akis && (
        <p className="mt-4 text-[15px] leading-[1.8] text-on-surface max-w-[54ch]" lang="tr">
          {akis.oneri}
        </p>
      )}

      {akis && ayet && (
        <figure
          className="mt-6 w-full max-w-[54ch] rounded-[16px] border border-primary/30 bg-surface-container/80 px-5 py-4 text-left shadow-m3-1"
          lang="tr"
        >
          <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            {DILIM_ADLARI[akis.dilim]} · Vakit ayeti
          </figcaption>
          <blockquote className="text-[15px] leading-[1.8] text-on-surface">{ayet.meal}</blockquote>
          <p className="mt-2 text-[11px] text-on-surface-variant">
            {ayet.sure} Suresi, {ayet.ayet}. {ayet.ayet.includes("-") ? "ayetler" : "ayet"} · Meal: Diyanet İşleri
            Başkanlığı
          </p>
        </figure>
      )}
    </>
  );
}
