import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Check, Lock } from "lucide-react";

export const PRESET_AMOUNTS = [50, 100, 250, 500];

export interface DonationFormData {
  amount: number;
  donorName: string;
  donorPhone: string;
  paymentProvider: "PAYTR" | "IYZICO";
  isAnonymous: boolean;
}

interface DonationBoxProps {
  onSubmit: (data: DonationFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DonationBox({ onSubmit, isSubmitting = false }: DonationBoxProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const [donorName, setDonorName] = useState<string>("");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [paymentProvider, setPaymentProvider] = useState<"PAYTR" | "IYZICO">("PAYTR");

  const currentAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;
  const sponsoredMessagesEst = Math.round(currentAmount * 2);

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setIsCustom(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount <= 0) {
      alert("Lütfen geçerli bir bağış tutarı giriniz.");
      return;
    }

    await onSubmit({
      amount: currentAmount,
      donorName: isAnonymous ? "Anonim İnfak Sahibi" : donorName,
      donorPhone,
      paymentProvider,
      isAnonymous,
    });
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg space-y-8 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-serif text-foreground">
          Bir Kardeşinizin Sırdaşı Olun
        </h2>
        <p className="text-sm text-muted-foreground">
          İstediğiniz tutarı seçerek veya serbest bir miktar belirleyerek
          havuza katkıda bulunabilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            İnfak Tutarı Seçiniz
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = !isCustom && selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-3.5 px-4 rounded-xl font-serif text-lg font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-102"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  <span>{amt} ₺</span>
                  <span className="text-[10px] font-sans font-normal opacity-80">
                    ~{amt * 2} mesaj
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Field */}
          <div className="pt-2">
            <label className="text-xs text-muted-foreground mb-1 block">
              Veya Farklı Bir Tutar Giriniz:
            </label>
            <div className="relative">
              <Input
                type="number"
                min="10"
                placeholder="Örn: 750"
                value={customAmount}
                onChange={handleCustomChange}
                className="pl-8 text-base font-medium"
              />
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">
                ₺
              </span>
            </div>
          </div>

          {/* Estimation Pill */}
          {currentAmount > 0 && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                <strong>{currentAmount} ₺</strong> tutarındaki infakınız ile:
              </span>
              <span className="font-semibold text-amber-400">
                Ortalama {sponsoredMessagesEst} mesaj karşılanır
              </span>
            </div>
          )}
        </div>

        {/* Donor Information */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Hayırsever Bilgileri
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <span>İsmim gizli kalsın (Anonim İnfak)</span>
            </label>
          </div>

          {!isAnonymous && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Adınız Soyadınız
              </label>
              <Input
                placeholder="Ad Soyad"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Telefon Numaranız veya E-postanız (Dekont Bilgilendirmesi İçin - İsteğe Bağlı)
            </label>
            <Input
              placeholder="05XX XXX XX XX veya isim@eposta.com"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Payment Provider Selection */}
        <div className="space-y-3 pt-4 border-t border-border">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Güvenli Ödeme Altyapısı
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentProvider("PAYTR")}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                paymentProvider === "PAYTR"
                  ? "border-primary bg-primary/10 text-foreground font-semibold"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                <span>PayTR Güvenli Ödeme</span>
              </div>
              {paymentProvider === "PAYTR" && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setPaymentProvider("IYZICO")}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                paymentProvider === "IYZICO"
                  ? "border-primary bg-primary/10 text-foreground font-semibold"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <span>iyzico Korumalı Ödeme</span>
              </div>
              {paymentProvider === "IYZICO" && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>256-bit SSL ve 3D Secure ile korumalı güvenli işlem</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || currentAmount <= 0}
          variant="gold"
          size="lg"
          className="w-full text-base font-bold shadow-lg"
        >
          {isSubmitting
            ? "Ödeme Oturumu Hazırlanıyor..."
            : `${currentAmount} ₺ İle Askıya Bırak`}
        </Button>
      </form>
    </div>
  );
}
