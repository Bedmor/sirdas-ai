import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Check, Lock, Sparkles } from "lucide-react";

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
    <div className="relative rounded-3xl border border-amber-500/35 bg-gradient-to-b from-[#0f1814]/95 via-[#0b120f]/95 to-[#070c09]/98 p-6 sm:p-10 shadow-[0_16px_50px_-5px_rgba(0,0,0,0.5)] space-y-8 max-w-3xl mx-auto backdrop-blur-md overflow-hidden">
      {/* Top gold line highlight */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
      />

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
          Bir Kardeşinizin Sırdaşı Olun
        </h2>
        <p className="text-sm text-emerald-100/75 font-light leading-relaxed">
          İstediğiniz tutarı seçerek veya serbest bir miktar belirleyerek
          havuza katkıda bulunabilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Amount Selection */}
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 font-mono block">
            İnfak Tutarı Seçiniz
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = !isCustom && selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-4 px-4 rounded-xl font-serif text-lg font-bold border transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                    isSelected
                      ? "bg-gradient-to-b from-amber-500/20 to-amber-600/30 text-amber-200 border-amber-500/80 shadow-[0_0_20px_rgba(217,119,6,0.25)] scale-[1.02]"
                      : "bg-[#0a110e]/70 hover:bg-[#121c16] text-white border-emerald-950/80 hover:border-amber-500/40"
                  }`}
                >
                  <span className="tracking-tight">{amt} ₺</span>
                  <span className="text-[11px] font-mono font-normal text-emerald-300/80">
                    ~{amt * 2} mesaj
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Field */}
          <div className="pt-2">
            <label className="text-xs text-emerald-200/80 mb-1.5 block font-medium">
              Veya Farklı Bir Tutar Giriniz:
            </label>
            <div className="relative">
              <Input
                type="number"
                min="10"
                placeholder="Örn: 750"
                value={customAmount}
                onChange={handleCustomChange}
                className="pl-8 text-base font-medium bg-[#060a08]/80 border-emerald-900/60 focus:border-amber-400 text-white rounded-xl h-12"
              />
              <span className="absolute left-3 top-3.5 text-amber-400 text-sm font-semibold">
                ₺
              </span>
            </div>
          </div>

          {/* Estimation Pill */}
          {currentAmount > 0 && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>{currentAmount} ₺</strong> tutarındaki infakınız ile:
                </span>
              </span>
              <span className="font-semibold text-amber-300 font-mono flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Ortalama {sponsoredMessagesEst} mesaj karşılanır</span>
              </span>
            </div>
          )}
        </div>

        {/* Donor Information */}
        <div className="space-y-4 pt-5 border-t border-emerald-950/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 font-mono">
              Hayırsever Bilgileri
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-200/80 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-emerald-800 bg-[#060a08] text-amber-500 focus:ring-amber-500 h-4 w-4"
              />
              <span>İsmim gizli kalsın (Anonim İnfak)</span>
            </label>
          </div>

          {!isAnonymous && (
            <div>
              <label className="text-xs text-emerald-200/80 mb-1.5 block">
                Adınız Soyadınız
              </label>
              <Input
                placeholder="Ad Soyad"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="bg-[#060a08]/80 border-emerald-900/60 focus:border-amber-400 text-white rounded-xl h-11"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-emerald-200/80 mb-1.5 block">
              Telefon Numaranız veya E-postanız (Dekont Bilgilendirmesi İçin - İsteğe Bağlı)
            </label>
            <Input
              placeholder="05XX XXX XX XX veya isim@eposta.com"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              className="bg-[#060a08]/80 border-emerald-900/60 focus:border-amber-400 text-white rounded-xl h-11"
            />
          </div>
        </div>

        {/* Payment Provider Selection */}
        <div className="space-y-3.5 pt-5 border-t border-emerald-950/80">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 font-mono block">
            Güvenli Ödeme Altyapısı
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setPaymentProvider("PAYTR")}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                paymentProvider === "PAYTR"
                  ? "border-amber-500/70 bg-amber-500/10 text-white shadow-sm"
                  : "border-emerald-950/80 bg-[#0a110e]/60 text-emerald-200/70 hover:bg-[#121c16]"
              }`}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span>PayTR Güvenli Ödeme</span>
              </div>
              {paymentProvider === "PAYTR" && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setPaymentProvider("IYZICO")}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                paymentProvider === "IYZICO"
                  ? "border-amber-500/70 bg-amber-500/10 text-white shadow-sm"
                  : "border-emerald-950/80 bg-[#0a110e]/60 text-emerald-200/70 hover:bg-[#121c16]"
              }`}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-amber-400" />
                <span>iyzico Korumalı Ödeme</span>
              </div>
              {paymentProvider === "IYZICO" && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-300/70 pt-1">
            <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>256-bit SSL ve 3D Secure ile korumalı güvenli işlem</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || currentAmount <= 0}
          className="w-full text-base font-bold py-4 h-13 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-[#090d0b] shadow-[0_8px_30px_rgba(217,119,6,0.3)] hover:shadow-[0_12px_36px_rgba(217,119,6,0.45)] transition-all duration-200 active:scale-[0.98]"
        >
          {isSubmitting
            ? "Ödeme Oturumu Hazırlanıyor..."
            : `${currentAmount} ₺ İle Askıya Bırak`}
        </Button>
      </form>
    </div>
  );
}

