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
    <div className="rounded-3xl border border-emerald-800/40 bg-card p-8 sm:p-12 shadow-xl text-center space-y-6 max-w-2xl mx-auto animate-in zoom-in-95">
      <div className="h-20 w-20 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
          İnfakınız Kaydedildi
        </span>
        <h1 className="text-3xl font-bold font-serif text-foreground">
          Allah Kabul Eylesin
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sayın <strong>{name}</strong>, yapmış olduğunuz <strong>{amount} ₺</strong> tutarındaki
          infak &ldquo;Askıda Sırdaş&rdquo; havuzuna başarıyla aktarılmıştır.
        </p>
      </div>

      {/* Islamic Dua Banner */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-foreground/90 font-serif italic space-y-1">
        <p>
          &ldquo;Allah infakınızı dergâh-ı izzetinde en güzel şekilde kabul buyursun.
          Ömrünüze ve kazancınıza bereket, kalbinize sekine ihsan eylesin.&rdquo;
        </p>
        <span className="text-[11px] text-muted-foreground not-italic block pt-1">
          Vesilenizle darda olan kardeşlerimizin manevi dertleşme mesajları karşılanacaktır.
        </span>
      </div>

      {/* Transaction Details */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">İşlem Numarası:</span>
          <span className="font-mono text-foreground">{tx}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">İnfak Tutarı:</span>
          <span className="font-bold text-foreground">{amount} ₺</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tarih:</span>
          <span className="text-foreground">{new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto gap-2">
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
        </Link>
        <Link href="/askida-sirdas">
          <Button variant="gold" className="w-full sm:w-auto gap-2">
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
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Yükleniyor...</div>}>
          <SuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
