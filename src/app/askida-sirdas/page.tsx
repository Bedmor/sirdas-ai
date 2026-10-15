"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PoolCounter } from "@/components/donation/pool-counter";
import { DonationBox, DonationFormData } from "@/components/donation/donation-box";

export default function AskidaSirdasPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [, setActiveProvider] = useState<"PAYTR" | "IYZICO">("PAYTR");
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
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern">
      <DisclaimerBanner />
      <Navbar />

      <main className="relative flex-1 py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16 overflow-hidden">
        {/* Ayet & Header Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <p className="font-arabic text-2xl sm:text-3xl text-primary/90 mb-2" dir="rtl" lang="ar">
            وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ
          </p>
          <blockquote className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface">
            “İyilik ve takva üzerinde yardımlaşın...”
          </blockquote>
          <span className="text-xs text-primary-fixed-dim font-medium block">
            Mâide Suresi, 2. Âyet-i Kerime
          </span>
          <p className="text-sm text-slate-300 leading-relaxed font-light max-w-2xl mx-auto pt-2">
            Sırdaş AI ticari bir kazanç aracı değildir. Sunucu ve yapay zeka altyapı giderleri,
            gönüldaşların askıya bıraktığı samimi katkılarla karşılanır; böylece kederli veya darda
            olan her kardeşimiz hiçbir maddi engel olmadan dertleşebilir.
          </p>
        </section>

        {/* Live Pool Counter */}
        <section aria-label="Canlı Askı Havuzu İstatistikleri">
          <PoolCounter />
        </section>

        {/* Interactive Donation Box */}
        <section aria-label="Askıya Katkı Formu">
          <DonationBox onSubmit={handleDonationSubmit} isSubmitting={isSubmitting} />
        </section>

        {/* Spiritual Assurance Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-surface-container/70 p-6 rounded-2xl border border-outline-variant/40 space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary mb-3">
              <i className="ph ph-hand-heart text-xl"></i>
            </div>
            <h3 className="font-heading text-base font-semibold text-on-surface">
              Şeffaf ve Emanet Bilinci
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Askıdaki her kuruş yalnızca yapay zeka token giderleri ve sunucu maliyetleri için
              sarf edilir, hiçbir ticari kâr gayesi güdülmez.
            </p>
          </div>

          <div className="bg-surface-container/70 p-6 rounded-2xl border border-outline-variant/40 space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-secondary mb-3">
              <i className="ph ph-sparkle text-xl"></i>
            </div>
            <h3 className="font-heading text-base font-semibold text-on-surface">
              Sadaka-i Cariye Niyeti
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Gecenin bir yarısı derdini döken bir kulun kalbine sekine olmasına vesile olmak,
              amellerin en faziletlilerindendir.
            </p>
          </div>

          <div className="bg-surface-container/70 p-6 rounded-2xl border border-outline-variant/40 space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary mb-3">
              <i className="ph ph-shield-check text-xl"></i>
            </div>
            <h3 className="font-heading text-base font-semibold text-on-surface">
              256-bit Güvenli Ödeme
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Tüm ödemeler BDDK lisanslı PayTR ve iyzico altyapısıyla 3D Secure korumalı olarak
              gerçekleştirilir. Kart verileriniz saklanmaz.
            </p>
          </div>
        </section>
      </main>

      {/* Simulated 3D Secure Checkout Dialog */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/50 text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-semibold text-on-surface flex items-center gap-2">
              <i className="ph ph-shield-check text-xl text-secondary"></i>
              <span>3D Secure Güvenli Ödeme Simülasyonu</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 pt-1">
              Ödeme sağlayıcı gateway oturumu başlatıldı. Test ortamında işlemi simüle
              edebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          {checkoutSession && (
            <div className="my-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">İnfak Tutarı:</span>
                <span className="text-primary font-bold">{checkoutSession.amount} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">İşlem Kodu:</span>
                <span className="text-slate-200">{checkoutSession.transactionId}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleSimulatePaymentFailure}
              className="px-4 py-2 rounded-xl border border-red-500/40 text-red-300 hover:bg-error-container text-xs font-medium transition-colors"
            >
              Ödemeyi İptal Et / Başarısız
            </button>
            <button
              type="button"
              onClick={handleSimulatePaymentSuccess}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-[#c99e70] text-[#1b1207] text-xs font-bold transition-colors shadow-md"
            >
              Ödemeyi Onayla (Başarılı)
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
