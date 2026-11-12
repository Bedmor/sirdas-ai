import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { NamazVakitleri } from "@/components/araclar/namaz-vakitleri";

export const metadata: Metadata = {
  title: "Namaz Vakitleri | Manevi Pusula",
  description: "İl ve ilçenize göre Diyanet İşleri Başkanlığı namaz vakitleri ve sıradaki vakte kalan süre.",
};

export default function NamazVakitleriPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Namaz Vakitleri"
      aciklama="İl ve ilçenizi seçin; günün vakitlerini ve sıradaki vakte ne kadar kaldığını görün. Vakitler Diyanet İşleri Başkanlığı tablosundan alınır."
    >
      <NamazVakitleri />
    </AracSayfasi>
  );
}
