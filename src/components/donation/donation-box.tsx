import React, { useState } from "react";

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
  initialAmount?: number;
}

export function DonationBox({
  onSubmit,
  isSubmitting = false,
  initialAmount,
}: DonationBoxProps) {
  const isPreset = initialAmount && PRESET_AMOUNTS.includes(initialAmount);
  const [selectedAmount, setSelectedAmount] = useState<number>(
    isPreset ? initialAmount : 100
  );
  const [customAmount, setCustomAmount] = useState<string>(
    initialAmount && !isPreset ? String(initialAmount) : ""
  );
  const [isCustom, setIsCustom] = useState<boolean>(
    Boolean(initialAmount && !isPreset)
  );

  const [donorName, setDonorName] = useState<string>("");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [paymentProvider, setPaymentProvider] = useState<"PAYTR" | "IYZICO">("PAYTR");

  React.useEffect(() => {
    if (initialAmount) {
      if (PRESET_AMOUNTS.includes(initialAmount)) {
        setSelectedAmount(initialAmount);
        setIsCustom(false);
        setCustomAmount("");
      } else {
        setIsCustom(true);
        setCustomAmount(String(initialAmount));
      }
    }
  }, [initialAmount]);

  const currentAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;
  const sponsoredMessagesEst = Math.round(currentAmount).toLocaleString("tr-TR");

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
    <div className="relative rounded-2xl border border-outline-variant/40 bg-surface-container/95 p-6 sm:p-10 shadow-2xl space-y-8 max-w-3xl mx-auto backdrop-blur-md overflow-hidden">
      {/* Top gold line highlight */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-on-surface tracking-tight">
          Bir Kardeşinize Manevi Pusula Olun
        </h2>
        <p className="text-sm text-slate-300 font-light leading-relaxed">
          İstediğiniz tutarı seçerek veya serbest bir miktar belirleyerek askı havuzuna katkıda
          bulunabilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Amount Selection */}
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
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
                  className={`p-3.5 rounded-xl text-center transition-all cursor-pointer border select-none ${
                    isSelected
                      ? "active bg-surface-container-highest border-primary/60 shadow-md ring-1 ring-primary/40"
                      : "bg-surface-container-low border-outline-variant/40 hover:border-primary/50 text-slate-300"
                  }`}
                >
                  <span className="text-base font-bold text-primary block">{amt} ₺</span>
                  <span className="text-[10px] text-slate-300 font-medium">~{amt.toLocaleString("tr-TR")} dertleşme</span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Field */}
          <div className="pt-2">
            <label className="text-xs text-slate-300 mb-1.5 block font-medium">
              Veya Farklı Bir Tutar Giriniz:
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">
                ₺
              </span>
              <input
                type="number"
                min="10"
                placeholder="Örn: 750"
                value={customAmount}
                onChange={handleCustomChange}
                className="w-full bg-surface-container-low pl-8 pr-3 py-2.5 rounded-xl text-on-surface font-mono text-sm border border-outline-variant/50 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
            </div>
          </div>

          {/* Estimation Box */}
          {currentAmount > 0 && (
            <div className="p-4 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <i className="ph ph-check-circle text-base text-secondary"></i>
                <span>
                  <strong className="text-on-surface">{currentAmount} ₺</strong> tutarındaki infakınız ile:
                </span>
              </span>
              <span className="font-semibold text-primary font-mono flex items-center gap-1.5">
                <i className="ph ph-sparkle text-sm text-primary"></i>
                <span>Ortalama {sponsoredMessagesEst} dertleşme karşılanır</span>
              </span>
            </div>
          )}
        </div>

        {/* Donor Information */}
        <div className="space-y-4 pt-5 border-t border-outline-variant/30">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Hayırsever Bilgileri
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-outline-variant bg-surface-container text-primary focus:ring-amber-500 h-4 w-4"
              />
              <span>İsmim gizli kalsın (Anonim İnfak)</span>
            </label>
          </div>

          {!isAnonymous && (
            <div>
              <label className="text-xs text-slate-300 mb-1.5 block">
                Adınız Soyadınız
              </label>
              <input
                placeholder="Ad Soyad"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl text-on-surface text-sm border border-outline-variant/50 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-300 mb-1.5 block">
              Telefon Numaranız veya E-postanız (Dekont ve Bilgilendirme - İsteğe Bağlı)
            </label>
            <input
              placeholder="05XX XXX XX XX veya isim@eposta.com"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl text-on-surface text-sm border border-outline-variant/50 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>
        </div>

        {/* Payment Provider Selection */}
        <div className="space-y-3.5 pt-5 border-t border-outline-variant/30">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
            Güvenli Ödeme Altyapısı
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setPaymentProvider("PAYTR")}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                paymentProvider === "PAYTR"
                  ? "border-primary/60 bg-surface-container-highest text-on-surface shadow-sm ring-1 ring-primary/40"
                  : "border-outline-variant/40 bg-surface-container-low text-slate-300 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                <i className="ph ph-credit-card text-base text-secondary"></i>
                <span>PayTR Güvenli Ödeme</span>
              </div>
              {paymentProvider === "PAYTR" && (
                <span className="h-2 w-2 rounded-full bg-primary shadow-sm" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setPaymentProvider("IYZICO")}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                paymentProvider === "IYZICO"
                  ? "border-primary/60 bg-surface-container-highest text-on-surface shadow-sm ring-1 ring-primary/40"
                  : "border-outline-variant/40 bg-surface-container-low text-slate-300 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                <i className="ph ph-shield-check text-base text-primary"></i>
                <span>iyzico Korumalı Ödeme</span>
              </div>
              {paymentProvider === "IYZICO" && (
                <span className="h-2 w-2 rounded-full bg-primary shadow-sm" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <i className="ph ph-lock-key text-xs text-secondary"></i>
            <span>256-bit SSL ve 3D Secure ile korumalı güvenli işlem</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || currentAmount <= 0}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary disabled:opacity-50 text-on-primary py-3.5 px-6 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-500 shadow-lg cursor-pointer"
        >
          <i className="ph ph-heart text-base"></i>
          <span>
            {isSubmitting
              ? "Ödeme Oturumu Hazırlanıyor..."
              : `${currentAmount} ₺ İle Askıya Bırak`}
          </span>
        </button>
      </form>
    </div>
  );
}
