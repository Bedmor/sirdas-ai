import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { DuaHavuzu } from "@/components/araclar/dua-havuzu";

export const metadata: Metadata = {
  title: "Dua Havuzu | Manevi Pusula",
  description:
    "İsimsiz dua istekleri. Ne için dua istediğinizi seçin; kardeşleriniz \"Allah yardımcın olsun\" der, istekler üç gün sonra listeden kalkar.",
};

export default function DuaHavuzuPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Dua Havuzu"
      aciklama="Ne için dua istediğinizi seçin, kardeşleriniz sizin için dua etsin. Siz de başkalarının isteğini okuyup “Allah yardımcın olsun” diyebilirsiniz."
    >
      <DuaHavuzu />
    </AracSayfasi>
  );
}
