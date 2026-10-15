"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, HelpCircle } from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const tx = searchParams.get("tx") || "Belirtilmedi";
  const amount = searchParams.get("amount");

  return (
    <div className="relative rounded-3xl border border-rose-500/35 bg-gradient-to-b from-[#140e10]/95 via-[#0f0c0d]/95 to-[#070c09]/98 p-8 sm:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-7 max-w-2xl mx-auto backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Top rose highlight */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"
      />

      <div className="h-20 w-20 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
        <AlertCircle className="h-10 w-10 text-rose-400" />
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">
          Ödeme Tamamlanamadı
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-tight">
          İşlem Gerçekleştirilemedi
        </h1>
        <p className="text-sm text-emerald-100/75 leading-relaxed font-light">
          {amount ? `${amount} ₺ tutarındaki infak ` : "İnfak "}
          işleminiz banka veya ödeme sağlayıcı onayı alamadığı için tamamlanamadı.
          Kartınızdan herhangi bir ücret tahsil edilmemiş olabilir.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-950/80 bg-[#060a08]/70 p-4 text-xs text-left space-y-2 font-mono">
        <div className="flex justify-between">
          <span className="text-emerald-300/70">İşlem Referansı:</span>
          <span className="text-white">{tx}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-300/70">Durum:</span>
          <span className="text-rose-400 font-semibold">Başarısız / İptal Edildi</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#060a08]/80 border border-emerald-950/80 text-xs text-emerald-200/80 space-y-1 text-left flex items-start gap-3 shadow-inner">
        <HelpCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Banka kartınızın internet alışverişine ve 3D Secure onayına açık olduğundan emin olunuz.
          Sorun devam ederse bankanızla irtibata geçebilir veya başka bir kart deneyebilirsiniz.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/askida-sirdas">
          <Button className="w-full sm:w-auto gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-[#090d0b] font-bold shadow-md">
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto gap-2 border-emerald-900/60 bg-[#0a110e] hover:bg-[#121c16] text-emerald-200">
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function DonationErrorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d0b] text-foreground antialiased selection:bg-amber-500/25 selection:text-amber-200">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Yükleniyor...</div>}>
          <ErrorContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

