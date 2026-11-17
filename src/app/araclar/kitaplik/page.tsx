import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";

export const metadata: Metadata = {
  title: "Kitaplık | Manevi Pusula",
  description:
    "Kur'an-ı Kerim, Esmâü'l-Hüsnâ, dini günler, cuma hutbeleri ve Diyanet'in ücretsiz okunabilen resmi kaynakları tek yerde.",
};

const ICERDE = [
  { href: "/araclar/kuran", ikon: "ph-book-open", baslik: "Kur'an-ı Kerim", aciklama: "114 sure ayet ayet: Arapça metin ve Elmalılı meali." },
  { href: "/araclar/esmaul-husna", ikon: "ph-sparkle", baslik: "Esmâü'l-Hüsnâ", aciklama: "Allah'ın güzel isimleri: Arapça yazılışı, okunuşu ve anlamı." },
  { href: "/araclar/dini-gunler", ikon: "ph-calendar-star", baslik: "Dini Günler", aciklama: "Kandiller, bayramlar ve mübarek geceler; Diyanet takvimiyle." },
  { href: "/araclar/cuma-hutbesi", ikon: "ph-microphone-stage", baslik: "Cuma Hutbeleri", aciklama: "Diyanet'in bu haftaki ve önceki dört haftanın hutbeleri." },
];

const DISARIDA = [
  { href: "https://dijital.diyanet.gov.tr/Kitaplik", baslik: "Diyanet Dijital e-Kitaplar", aciklama: "İlmihal, Kur'an, hadis, siyer ve çocuk kitapları; birçoğu ücretsiz okunur." },
  { href: "https://kuran.diyanet.gov.tr/", baslik: "Diyanet Kur'an Platformu", aciklama: "Mushaf, mealler ve dinleme." },
  { href: "https://hadis.diyanet.gov.tr/", baslik: "Diyanet Hadis ve Siyer", aciklama: "Hadislerle İslam ve siyer kaynakları." },
  { href: "https://kurul.diyanet.gov.tr/", baslik: "Din İşleri Yüksek Kurulu", aciklama: "Dini sorulara resmi cevaplar ve kararlar (fıkhi sorular için)." },
  { href: "https://islamansiklopedisi.org.tr/", baslik: "TDV İslâm Ansiklopedisi", aciklama: "Kavramlar, şahsiyetler ve eserler hakkında ilmî maddeler." },
];

export default function KitaplikPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Kitaplık"
      aciklama="Okumak ve öğrenmek için güvenilir kaynaklar. Üstteki bölümler Manevi Pusula'nın içinde açılır; alttakiler Diyanet ve TDV'nin resmi sitelerine götürür."
    >
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-on-surface">Manevi Pusula içinde</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ICERDE.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="flex h-full items-start gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container/85 p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <i aria-hidden="true" className={`ph ${a.ikon} text-2xl text-primary`}></i>
                <span>
                  <span className="block font-semibold text-on-surface">{a.baslik}</span>
                  <span className="block text-xs text-slate-300 leading-relaxed">{a.aciklama}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-on-surface">Resmi kaynaklar</h2>
        <ul className="space-y-2.5">
          {DISARIDA.map((a) => (
            <li key={a.href}>
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container/70 p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-on-surface">{a.baslik}</span>
                  <span className="block text-xs text-slate-300 leading-relaxed">{a.aciklama}</span>
                </span>
                <i aria-hidden="true" className="ph ph-arrow-square-out text-xl text-on-surface-variant"></i>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </AracSayfasi>
  );
}
