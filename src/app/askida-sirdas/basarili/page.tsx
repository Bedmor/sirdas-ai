"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HeartHandshake, Home, ArrowRight } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const tx = searchParams.get("tx") || `tx_${Date.now()}`;
  const amount = searchParams.get("amount") || "100";
  const name = searchParams.get("name") || "Gönüllü İnfak Sahibi";

  return (
    <div className="relative rounded-3xl border border-amber-500/35 bg-gradient-to-b from-[#0e1713]/95 via-[#0b120f]/95 to-[#070c09]/98 p-8 sm:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-7 max-w-2xl mx-auto backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Top gold line sheen */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
      />

      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
          İnfakınız Kaydedildi
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-tight">
          Allah Kabul Eylesin
        </h1>
        <p className="text-sm text-emerald-100/80 leading-relaxed font-light">
          Sayın <strong className="text-white font-medium">{name}</strong>, yapmış olduğunuz{" "}
          <strong className="text-amber-300 font-medium">{amount} ₺</strong> tutarındaki
          infak &ldquo;Askıda Sırdaş&rdquo; havuzuna başarıyla aktarılmıştır.
        </p>
      </div>

      {/* Islamic Dua Banner */}
      <div className="p-5 rounded-2xl bg-[#060a08]/80 border border-emerald-900/60 text-xs text-emerald-200/90 font-serif italic space-y-2 shadow-inner">
        <p className="text-sm text-amber-200/90 leading-relaxed">
          &ldquo;Allah infakınızı dergâh-ı izzetinde en güzel şekilde kabul buyursun.
          Ömrünüze ve kazancınıza bereket, kalbinize sekine ihsan eylesin.&rdquo;
        </p>
        <span className="text-[11px] text-emerald-400/80 not-italic block pt-1 font-sans">
          Vesilenizle darda olan kardeşlerimizin manevi dertleşme mesajları karşılanacaktır.
        </span>
      </div>

      {/* Transaction Details */}
      <div className="rounded-xl border border-emerald-950/80 bg-[#060a08]/60 p-4 text-xs text-left space-y-2 font-mono">
        <div className="flex justify-between">
          <span className="text-emerald-300/70">İşlem Numarası:</span>
          <span className="text-white">{tx}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-300/70">İnfak Tutarı:</span>
          <span className="font-bold text-amber-300">{amount} ₺</span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-300/70">Tarih:</span>
          <span className="text-white">{new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto gap-2 border-emerald-900/60 bg-[#0a110e] hover:bg-[#121c16] text-emerald-200">
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
        </Link>
        <Link href="/askida-sirdas">
          <Button className="w-full sm:w-auto gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-[#090d0b] font-bold shadow-md">
            <HeartHandshake className="h-4 w-4" />
            Askı Havuzunu Gör
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d0b] text-foreground antialiased selection:bg-amber-500/25 selection:text-amber-200">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Yükleniyor...</div>}>
          <SuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

