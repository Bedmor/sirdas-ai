import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { DiniGunler } from "@/components/araclar/dini-gunler";

export const metadata: Metadata = {
  title: "Dini Günler | Manevi Pusula",
  description: "Kandiller, bayramlar ve mübarek geceler: Diyanet takvimine göre 2026-2028 dini günleri ve sıradaki güne kalan süre.",
};

export default function DiniGunlerPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Dini Günler"
      aciklama="Kandiller, bayramlar ve mübarek geceler. Tarihler Diyanet İşleri Başkanlığı'nın resmi takviminden alınmıştır; kandiller, gecenin idrak edildiği günün tarihiyle yazılmıştır."
    >
      <DiniGunler />
      <p className="text-xs text-on-surface-variant/80">Kaynak: Diyanet İşleri Başkanlığı, dini günler takvimi.</p>
    </AracSayfasi>
  );
}
