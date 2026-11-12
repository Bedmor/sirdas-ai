import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { KiblePusulasi } from "@/components/araclar/kible-pusulasi";

export const metadata: Metadata = {
  title: "Kıble Pusulası | Manevi Pusula",
  description: "Bulunduğunuz yerden Kâbe yönünün açısı ve destekleyen telefonlarda canlı kıble pusulası.",
};

export default function KiblePage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Kıble Pusulası"
      aciklama="Konumunuzu paylaşın; Kâbe yönünün kuzeye göre açısını hesaplayalım. Telefonunuzda pusula varsa kadran kendiliğinden döner."
    >
      <KiblePusulasi />
    </AracSayfasi>
  );
}
