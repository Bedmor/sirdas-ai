import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { VakitAyetiKarti } from "@/components/araclar/vakit-ayeti-karti";

export const metadata: Metadata = {
  title: "Manevi Araçlar | Manevi Pusula",
  description:
    "Zikirmatik, Diyanet namaz vakitleri, kıble pusulası, dua havuzu, cuma hutbesi ve günün vaktine göre ayet kartı. Manevi Pusula'nın sade günlük araçları.",
};

const ARACLAR = [
  {
    href: "/araclar/namaz-vakitleri",
    ikon: "ph-clock",
    baslik: "Namaz Vakitleri",
    aciklama: "İl ve ilçenize göre Diyanet vakitleri ve sıradaki vakte kalan süre.",
  },
  {
    href: "/araclar/kible",
    ikon: "ph-compass",
    baslik: "Kıble Pusulası",
    aciklama: "Konumunuzdan Kâbe yönünün açısı; destekleyen telefonlarda canlı pusula.",
  },
  {
    href: "/araclar/zikirmatik",
    ikon: "ph-hand-tap",
    baslik: "Zikirmatik",
    aciklama: "Büyük dokunma alanıyla tesbihat sayacı; sayım yalnızca cihazınızda saklanır.",
  },
  {
    href: "/araclar/dua-havuzu",
    ikon: "ph-hands-praying",
    baslik: "Dua Havuzu",
    aciklama: "Ne için dua istediğinizi seçip isimsiz istek bırakın; kardeşleriniz sizin için dua etsin.",
  },
  {
    href: "/araclar/cuma-hutbesi",
    ikon: "ph-book-open-text",
    baslik: "Cuma Hutbesi",
    aciklama: "Diyanet'in bu haftaki cuma hutbesi; önceki dört haftanın hutbeleri de burada.",
  },
];

export default function AraclarPage() {
  return (
    <AracSayfasi
      ust="Günlük Manevi Araçlar"
      baslik="Manevi Araçlar"
      aciklama="Gün içinde elinizin altında olsun diye hazırlanmış sade araçlar. Hiçbiri hesap açmanızı istemez; kişisel bilgileriniz kaydedilmez."
      geriLink={false}
    >
      <VakitAyetiKarti />

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ARACLAR.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container/85 p-5 shadow-md transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface-container-high text-secondary group-hover:text-primary transition-colors">
                <i aria-hidden="true" className={`ph ${a.ikon} text-2xl`}></i>
              </span>
              <span className="font-heading text-lg font-semibold text-on-surface">{a.baslik}</span>
              <span className="text-xs text-slate-300 leading-relaxed">{a.aciklama}</span>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Aç <i aria-hidden="true" className="ph ph-arrow-right text-sm"></i>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AracSayfasi>
  );
}
