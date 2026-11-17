import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { EsmaulHusna } from "@/components/araclar/esmaul-husna";

export const metadata: Metadata = {
  title: "Esmâü'l-Hüsnâ | Manevi Pusula",
  description: "Allah'ın 99 güzel ismi: Arapça yazılışı, okunuşu ve anlamı.",
};

export default function EsmaulHusnaPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Esmâü'l-Hüsnâ"
      aciklama={"\"En güzel isimler Allah'ındır. Bundan dolayı Allah'a onlarla dua edin.\" (A'râf, 180, Elmalılı meali). Allah'ın 99 güzel ismi, Arapça yazılışı ve anlamıyla."}
    >
      <EsmaulHusna />
      <p className="text-xs text-on-surface-variant/80 leading-relaxed">
        Sıra, Tirmizî rivayetindeki yaygın sıradır. Anlamlar TDV İslâm Ansiklopedisi &quot;Esmâ-i Hüsnâ&quot; maddesinden özetlenmiştir.
      </p>
    </AracSayfasi>
  );
}
