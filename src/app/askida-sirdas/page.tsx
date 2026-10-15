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
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
        {/* Header & Philosophy */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="gold" className="text-xs uppercase tracking-wider">
            Sadaka-i Cariye &amp; Dijital İnfak
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight text-foreground">
            Askıda Sırdaş Havuzu
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Sırdaş AI darda olan, yalnız hisseden veya vesveseyle boğuşan her bir
            kula tamamen ücretsizdir. Sunucu ve yapay zeka maliyetleri,
            ecrini yalnız Allah&apos;tan bekleyen hayırseverlerin infaklarıyla
            karşılanır.
          </p>
        </div>

        {/* Live Transparent Pool Counters */}
        <PoolCounter
          sponsoredMessages="142.850 adet"
          poolBalance="24.300 ₺"
          donorCount="1.280 hayırsever"
        />

        {/* Modular Donation Box Form */}
        <DonationBox
          onSubmit={handleDonationSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Informative Explanation / Hadis */}
        <div className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-8 max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground font-serif">
            <HelpCircle className="h-4 w-4 text-amber-500" />
            <span>Askıda Sırdaş Havuzu Nasıl Çalışır?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Eski medeniyetimizdeki &ldquo;sadaka taşları&rdquo; ve &ldquo;askıda ekmek&rdquo;
            mimarisi bugün dijitalleşiyor. Bir mümin kardeşimiz gece yarısı içine doğan
            bir keder, vesvese veya rızık endişesiyle Sırdaş AI&apos;ye yazdığında,
            onun mesajını yanıtlayan yapay zeka sunucu masrafı sizin infakınızla
            karşılanmış olur.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-serif italic border-l-2 border-amber-500/40 pl-3">
            &ldquo;Sadaka vermekle mal eksilmez. Kul başkalarının ayıbını örttükçe
            Allah da onun şerefini artırır.&rdquo; (Müslim, Birr 69)
          </p>
        </div>
      </main>

      {/* CHECKOUT MODAL / POPUP */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent onClose={() => setCheckoutModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-serif">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Güvenli Ödeme Doğrulaması
            </DialogTitle>
            <DialogDescription>
              {activeProvider === "PAYTR" ? "PayTR 3D Secure" : "iyzico Korumalı Ödeme"} üzerinden{" "}
              <strong>{checkoutSession?.amount} ₺</strong> tutarındaki infak işleminizi onaylayınız.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">İşlem Referansı:</span>
                <span className="font-mono font-medium">{checkoutSession?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sağlayıcı:</span>
                <span className="font-semibold">{checkoutSession?.amount} ₺ ({activeProvider})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Güvenlik:</span>
                <span className="text-emerald-500 font-medium">3D Secure Aktif</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
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
            >
              İptal Et / Başarısız Senaryosu
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handleSimulatePaymentSuccess}
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
