import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { GonulDefteriListesi } from "@/components/chat/gonul-defteri-listesi";

export const metadata: Metadata = {
  title: "Gönül Defterim | Manevi Pusula",
  description: "Saklamak istediğiniz cevaplar. Yalnızca bu cihazda tutulur; hiçbir sunucuya gönderilmez.",
};

export default function GonulDefterimPage() {
  return (
    <AracSayfasi
      ust="Menü"
      baslik="Gönül Defterim"
      aciklama="Cevapların altındaki “Deftere ekle” düğmesiyle sakladıklarınız burada durur. Kayıtlar yalnızca bu cihazda, bu tarayıcıda tutulur; hiçbir sunucuya gönderilmez."
      geriHref="/"
    >
      <GonulDefteriListesi />
    </AracSayfasi>
  );
}
