import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { Zikirmatik } from "@/components/araclar/zikirmatik";

export const metadata: Metadata = {
  title: "Zikirmatik | Manevi Pusula",
  description: "Tesbihat ve zikirlerinizi sayabileceğiniz sade dijital zikirmatik. Sayım yalnızca cihazınızda saklanır.",
};

export default function ZikirmatikPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Zikirmatik"
      aciklama="Zikrinizi ve hedefinizi seçin, ortadaki halkaya dokunarak sayın. Uygulamayı kapatsanız da sayınız bu cihazda kalır."
    >
      <Zikirmatik />
    </AracSayfasi>
  );
}
