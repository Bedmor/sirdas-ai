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
    <div className="rounded-3xl border border-rose-500/30 bg-card p-8 sm:p-12 shadow-xl text-center space-y-6 max-w-2xl mx-auto animate-in zoom-in-95">
      <div className="h-20 w-20 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-500 flex items-center justify-center mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
          Ödeme Tamamlanamadı
        </span>
        <h1 className="text-3xl font-bold font-serif text-foreground">
          İşlem Gerçekleştirilemedi
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {amount ? `${amount} ₺ tutarındaki infak ` : "İnfak "}
          işleminiz banka veya ödeme sağlayıcı onayı alamadığı için tamamlanamadı.
          Kartınızdan herhangi bir ücret tahsil edilmemiş olabilir.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">İşlem Referansı:</span>
          <span className="font-mono text-foreground">{tx}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Durum:</span>
          <span className="text-rose-500 font-semibold">Başarısız / İptal Edildi</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1 text-left flex items-start gap-2.5">
        <HelpCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p>
          Banka kartınızın internet alışverişine ve 3D Secure onayına açık olduğundan emin olunuz.
          Sorun devam ederse bankanızla irtibata geçebilir veya başka bir kart deneyebilirsiniz.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/askida-sirdas">
          <Button variant="default" className="w-full sm:w-auto gap-2">
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto gap-2">
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
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Yükleniyor...</div>}>
          <ErrorContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
