import React from "react";
import type { Metadata } from "next";
import { AracSayfasi } from "@/components/araclar/arac-sayfasi";
import { SureListesi } from "@/components/araclar/sure-listesi";
import { SURELER } from "@/lib/kuran";

export const metadata: Metadata = {
  title: "Kur'an-ı Kerim | Manevi Pusula",
  description: "114 surenin tamamı ayet ayet: Arapça metin ve Elmalılı Hamdi Yazır meali, kolay okunur düzende.",
};

export default function KuranPage() {
  return (
    <AracSayfasi
      ust="Manevi Araçlar"
      baslik="Kur'an-ı Kerim"
      aciklama="114 surenin tamamı ayet ayet: Arapça metin ve Elmalılı Hamdi Yazır meali. Sureyi seçin; isterseniz yalnız Arapçayı veya yalnız meali gösterip yazıyı büyütebilirsiniz."
    >
      <SureListesi sureler={SURELER} />
      <p className="text-xs text-on-surface-variant/80 leading-relaxed">
        Arapça metin: Tanzil Projesi. Meal: Elmalılı Muhammed Hamdi Yazır. Meal, ayetin anlamını aktarma çabasıdır; Kur&apos;an&apos;ın
        kendisinin yerini tutmaz.
      </p>
    </AracSayfasi>
  );
}
