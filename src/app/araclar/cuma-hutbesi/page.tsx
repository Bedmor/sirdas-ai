import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { CumaHutbesi } from "@/components/araclar/cuma-hutbesi";
import { cumaHutbeleri } from "@/lib/araclar/cuma-hutbesi-kaynak";

export const metadata: Metadata = {
  title: "Cuma Hutbesi | Manevi Pusula",
  description:
    "Diyanet İşleri Başkanlığı'nın bu haftaki cuma hutbesi ve önceki dört haftanın hutbeleri; metin, PDF ve sesli hutbe.",
};

// Bugünün tarihine göre seçim her istekte yapılır; Diyanet verisi ise
// önbellekten gelir (3 saat), ziyaretçi başına Diyanet'e istek gitmez.
export const dynamic = "force-dynamic";

export default async function CumaHutbesiPage() {
  const veri = await cumaHutbeleri();
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Cuma Hutbesi"
      aciklama="Diyanet İşleri Başkanlığı'nın bu hafta camilerde okunan cuma hutbesi. Her cuma yenisi gelir; önceki dört haftanın hutbeleri de aşağıda durur."
    >
      <CumaHutbesi veri={veri} />
    </AracSayfasi>
  );
}
