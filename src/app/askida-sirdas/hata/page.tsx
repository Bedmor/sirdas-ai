"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";

function ErrorContent() {
  const searchParams = useSearchParams();
  const tx = searchParams.get("tx") || "Belirtilmedi";
  const amount = searchParams.get("amount");

  return (
    <div className="relative rounded-2xl border border-red-500/40 bg-surface-container/95 p-8 sm:p-14 shadow-2xl text-center space-y-7 max-w-2xl mx-auto backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Top red highlight */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
      />

      <div className="h-16 w-16 rounded-full bg-error-container/60 border border-red-500/40 text-red-300 flex items-center justify-center mx-auto shadow-inner">
        <i className="ph ph-warning-circle text-3xl text-red-300"></i>
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-red-300 font-mono">
          Ödeme Tamamlanamadı
        </span>
        <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-on-surface tracking-tight">
          İşlem Gerçekleştirilemedi
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed font-light">
          {amount ? `${amount} ₺ tutarındaki infak ` : "İnfak "}
          işleminiz banka veya ödeme sağlayıcı onayı alamadığı için tamamlanamadı. Kartınızdan
          herhangi bir ücret tahsil edilmemiş olabilir.
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-xs text-left space-y-2 font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">İşlem Referansı:</span>
          <span className="text-on-surface">{tx}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Durum:</span>
          <span className="text-red-300 font-semibold">Başarısız / İptal Edildi</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-slate-300 space-y-1 text-left flex items-start gap-3">
        <i className="ph ph-info text-base text-primary shrink-0 mt-0.5"></i>
        <p className="leading-relaxed">
          Banka kartınızın internet alışverişine ve 3D Secure onayına açık olduğundan emin olunuz.
          Sorun devam ederse bankanızla irtibata geçebilir veya başka bir kart deneyebilirsiniz.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/askida-sirdas"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary text-on-primary text-xs font-bold transition-colors shadow-md"
        >
          <i className="ph ph-arrow-counter-clockwise text-base"></i>
          <span>Tekrar Dene</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-xs text-slate-200 hover:text-white transition-colors"
        >
          <i className="ph ph-house text-base"></i>
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </div>
  );
}

export default function DonationErrorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Suspense
          fallback={<div className="text-center py-20 text-slate-400">Yükleniyor...</div>}
        >
          <ErrorContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
