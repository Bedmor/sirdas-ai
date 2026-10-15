"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";

function SuccessContent() {
  const searchParams = useSearchParams();
  const tx = searchParams.get("tx") || `tx_${Date.now()}`;
  const amount = searchParams.get("amount") || "100";
  const name = searchParams.get("name") || "Gönüllü İnfak Sahibi";

  return (
    <div className="relative rounded-2xl border border-outline-variant/40 bg-surface-container/95 p-8 sm:p-14 shadow-2xl text-center space-y-7 max-w-2xl mx-auto backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Top gold line sheen */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="h-16 w-16 rounded-full bg-surface-container-high border border-secondary/40 text-secondary flex items-center justify-center mx-auto shadow-inner">
        <i className="ph ph-check text-3xl text-secondary"></i>
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          İnfakınız Kaydedildi
        </span>
        <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-on-surface tracking-tight">
          Allah Kabul Eylesin
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed font-light">
          Sayın <strong className="text-white font-medium">{name}</strong>, yapmış olduğunuz{" "}
          <strong className="text-primary font-medium">{amount} ₺</strong> tutarındaki infak
          &ldquo;Askıda Sırdaş&rdquo; havuzuna başarıyla aktarılmıştır.
        </p>
      </div>

      {/* Islamic Dua Banner */}
      <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-slate-300 italic space-y-2">
        <p className="text-sm text-primary leading-relaxed" lang="tr">
          “Allah infakınızı dergâh-ı izzetinde en güzel şekilde kabul buyursun. Ömrünüze ve
          kazancınıza bereket, kalbinize sekinet ihsan eylesin.”
        </p>
        <span className="text-[11px] text-slate-400 not-italic block pt-1">
          Vesilenizle darda olan kardeşlerimizin manevi dertleşme mesajları karşılanacaktır.
        </span>
      </div>

      {/* Transaction Details */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-xs text-left space-y-2 font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">İşlem Numarası:</span>
          <span className="text-on-surface">{tx}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">İnfak Tutarı:</span>
          <span className="font-bold text-primary">{amount} ₺</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Tarih:</span>
          <span className="text-on-surface">{new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-xs text-slate-200 hover:text-white transition-colors"
        >
          <i className="ph ph-house text-base"></i>
          <span>Ana Sayfaya Dön</span>
        </Link>
        <Link
          href="/askida-sirdas"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-[#c99e70] text-[#1b1207] text-xs font-bold transition-colors shadow-md"
        >
          <i className="ph ph-hand-heart text-base"></i>
          <span>Askı Havuzunu Gör</span>
        </Link>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Suspense
          fallback={<div className="text-center py-20 text-slate-400">Yükleniyor...</div>}
        >
          <SuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
