import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { AyetOkuyucu } from "@/components/araclar/ayet-okuyucu";
import { BESMELE_AR, SURELER, sureOku } from "@/lib/kuran";

export const dynamicParams = false;

export function generateStaticParams() {
  return SURELER.map((s) => ({ no: String(s.no) }));
}

export async function generateMetadata({ params }: { params: Promise<{ no: string }> }): Promise<Metadata> {
  const { no } = await params;
  const s = SURELER.find((x) => String(x.no) === no);
  if (!s) return { title: "Kur'an-ı Kerim | Manevi Pusula" };
  return {
    title: `${s.ad} Suresi | Kur'an-ı Kerim | Manevi Pusula`,
    description: `${s.ad} Suresi (${s.ayetSayisi} ayet, ${s.yer}): Arapça metin ve Elmalılı Hamdi Yazır meali.`,
  };
}

export default async function SurePage({ params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  const sure = sureOku(Number(no));
  if (!sure) notFound();
  const onceki = SURELER.find((s) => s.no === sure.no - 1);
  const sonraki = SURELER.find((s) => s.no === sure.no + 1);

  const gezinme = (
    <nav aria-label="Sureler arası geçiş" className="flex items-center justify-between gap-3 text-sm">
      {onceki ? (
        <Link href={`/araclar/kuran/${onceki.no}`} className="rounded-full border border-outline-variant/50 px-4 py-2 text-on-surface-variant hover:text-primary hover:border-primary/50">
          ← {onceki.ad}
        </Link>
      ) : (
        <span />
      )}
      <Link href="/araclar/kuran" className="text-primary hover:underline underline-offset-2">
        Sure listesi
      </Link>
      {sonraki ? (
        <Link href={`/araclar/kuran/${sonraki.no}`} className="rounded-full border border-outline-variant/50 px-4 py-2 text-on-surface-variant hover:text-primary hover:border-primary/50">
          {sonraki.ad} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );

  return (
    <AracSayfasi
      ust={`Kur'an-ı Kerim · ${sure.no}. sure`}
      baslik={`${sure.ad} Suresi`}
      aciklama={`${sure.ayetSayisi} ayet · ${sure.yer}'de indi. Arapça metin ve Elmalılı Hamdi Yazır meali.`}
      geriHref="/araclar/kuran"
    >
      <p className="font-arabic text-center text-4xl text-primary/90" dir="rtl" lang="ar">
        {sure.arapcaAd}
      </p>
      {gezinme}
      <AyetOkuyucu ayetler={sure.ayetler} besmele={sure.besmele} besmeleAr={BESMELE_AR} />
      {gezinme}
    </AracSayfasi>
  );
}
