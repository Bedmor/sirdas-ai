"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { PoolCounter } from "@/components/donation/pool-counter";
import { DonationBox, DonationFormData, PRESET_AMOUNTS } from "@/components/donation/donation-box";

export default function AskidaSirdasPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [activeProvider, setActiveProvider] = useState<"PAYTR" | "IYZICO">("PAYTR");
  const [checkoutSession, setCheckoutSession] = useState<{
    donationId: string;
    transactionId: string;
    amount: number;
    redirectUrl: string;
    failureUrl: string;
    paymentUrl?: string;
  } | null>(null);

  const handleDonationSubmit = async (formData: DonationFormData) => {
    setIsSubmitting(true);
    setActiveProvider(formData.paymentProvider);
    try {
      const res = await fetch("/api/donation/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setCheckoutSession(data);
        setCheckoutModalOpen(true);
      } else {
        alert(data.error || "Ödeme başlatılamadı.");
      }
    } catch (err) {
      console.error("Donation initiation failed:", err);
      alert("Bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!checkoutSession) return;
    try {
      // Notify webhook
      await fetch("/api/webhook/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId: checkoutSession.donationId,
          transactionId: checkoutSession.transactionId,
          status: "SUCCESS",
        }),
      });
      setCheckoutModalOpen(false);
      router.push(checkoutSession.redirectUrl);
    } catch {
      router.push(checkoutSession.redirectUrl);
    }
  };

  const handleSimulatePaymentFailure = () => {
    if (!checkoutSession) return;
    setCheckoutModalOpen(false);
    router.push(checkoutSession.failureUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d0b] text-foreground antialiased selection:bg-amber-500/25 selection:text-amber-200">
      <DisclaimerBanner />
      <Navbar />

      <main className="relative flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-20 overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,_rgba(5,150,105,0.18),_rgba(217,119,6,0.08)_50%,_transparent_75%)] blur-3xl pointer-events-none"
        />

        {/* Header & Philosophy */}
        <div className="relative text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="gold" className="text-xs uppercase tracking-wider px-3.5 py-1">
            Sadaka-i Cariye &amp; Dijital İnfak
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight text-white leading-tight">
            Askıda Sırdaş Havuzu
          </h1>
          <p className="text-base sm:text-lg text-emerald-100/80 leading-relaxed font-light">
            Sırdaş AI darda olan, yalnız hisseden veya vesveseyle boğuşan her bir
            kula tamamen ücretsizdir. Sunucu ve yapay zeka maliyetleri,
            ecrini yalnız Allah&apos;tan bekleyen hayırseverlerin infaklarıyla
            karşılanır.
          </p>
        </div>

        {/* Live Transparent Pool Counters */}
        <div className="relative">
          <PoolCounter
            sponsoredMessages="142.850 adet"
            poolBalance="24.300 ₺"
            donorCount="1.280 hayırsever"
          />
        </div>

        {/* Modular Donation Box Form */}
        <div className="relative">
          <DonationBox
            onSubmit={handleDonationSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Informative Explanation / Hadis */}
        <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#0e1713]/90 via-[#0a110e]/90 to-[#070c09]/95 p-8 sm:p-10 max-w-3xl mx-auto space-y-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2.5 text-base font-bold text-white font-serif">
            <HelpCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <span>Askıda Sırdaş Havuzu Nasıl Çalışır?</span>
          </div>
          <p className="text-sm text-emerald-100/75 leading-relaxed font-light">
            Eski medeniyetimizdeki &ldquo;sadaka taşları&rdquo; ve &ldquo;askıda ekmek&rdquo;
            mimarisi bugün dijitalleşiyor. Bir mümin kardeşimiz gece yarısı içine doğan
            bir keder, vesvese veya rızık endişesiyle Sırdaş AI&apos;ye yazdığında,
            onun mesajını yanıtlayan yapay zeka sunucu masrafı sizin infakınızla
            karşılanmış olur.
          </p>
          <p className="text-sm text-amber-300 font-serif italic border-l-2 border-amber-400/60 pl-4 py-1 leading-relaxed bg-amber-500/5 rounded-r-xl">
            &ldquo;Sadaka vermekle mal eksilmez. Kul başkalarının ayıbını örttükçe
            Allah da onun şerefini artırır.&rdquo; (Müslim, Birr 69)
          </p>
        </div>
      </main>

      {/* CHECKOUT MODAL / POPUP */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent onClose={() => setCheckoutModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-serif text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Güvenli Ödeme Doğrulaması
            </DialogTitle>
            <DialogDescription className="text-emerald-100/70">
              {activeProvider === "PAYTR" ? "PayTR 3D Secure" : "iyzico Korumalı Ödeme"} üzerinden{" "}
              <strong className="text-amber-300 font-semibold">{checkoutSession?.amount} ₺</strong> tutarındaki infak işleminizi onaylayınız.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="rounded-xl border border-emerald-900/60 bg-[#060a08]/80 p-4 text-xs space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span className="text-emerald-300/70">İşlem Referansı:</span>
                <span className="font-mono text-white font-medium">{checkoutSession?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300/70">Sağlayıcı:</span>
                <span className="text-amber-300 font-semibold">{checkoutSession?.amount} ₺ ({activeProvider})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300/70">Güvenlik:</span>
                <span className="text-emerald-400 font-medium">3D Secure Aktif</span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-200/60 leading-snug">
              Bu ekran geliştirme ve doğrulama ortamında güvenli ödeme simülasyonunu test etmenize imkan tanır.
              Onayla butonuna tıkladığınızda ödeme webhooks doğrulanır ve teşekkür ekranına yönlendirilirsiniz.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulatePaymentFailure}
              className="border-emerald-900/80 hover:bg-[#121c16] text-emerald-200"
            >
              İptal Et / Başarısız Senaryosu
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSimulatePaymentSuccess}
              className="bg-amber-600 hover:bg-amber-500 text-[#090d0b] font-bold"
            >
              Ödemeyi Onayla ({checkoutSession?.amount} ₺)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>

  );
}
