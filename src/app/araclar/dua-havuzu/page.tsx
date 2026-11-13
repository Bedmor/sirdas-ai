import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { DuaHavuzu } from "@/components/araclar/dua-havuzu";

export const metadata: Metadata = {
  title: "Dua Havuzu | Manevi Pusula",
  description:
    "İsimsiz kısa dua istekleri. Kardeşleriniz okuyup \"Allah yardımcın olsun\" der; istekler üç gün sonra listeden kalkar.",
};

export default function DuaHavuzuPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Dua Havuzu"
      aciklama="Kısa bir dua isteği bırakın, kardeşleriniz sizin için dua etsin. Siz de başkalarının isteğini okuyup “Allah yardımcın olsun” diyebilirsiniz."
    >
      <DuaHavuzu />
    </AracSayfasi>
  );
}
