"use client";

import React, { useState } from "react";
import Link from "next/link";

const DONATION_CHIPS = [
  { amount: 50, label: "Gönül Katkısı" },
  { amount: 100, label: "Pusula Desteği" },
  { amount: 250, label: "Bereket İnfakı" },
  { amount: 500, label: "Kardeşlik Fonu" },
];

export function AskidaSirdasSection() {
  const [donationAmount, setDonationAmount] = useState<number | string>(100);

  const handleDonate = () => {
    const num = Number(donationAmount);
    if (!num || num <= 0) {
      alert("Lütfen geçerli bir katkı tutarı giriniz.");
      return;
    }
    window.location.href = `/askida-sirdas?amount=${num}`;
  };

  return (
    <section
      aria-labelledby="askida-baslik"
      className="w-full bg-surface py-20 border-y border-outline-variant/30"
      id="askida"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="bg-surface-container rounded-2xl p-6 md:p-12 border border-outline-variant/40 relative">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p
              className="font-arabic text-xl sm:text-2xl text-primary/90 mb-3"
              dir="rtl"
              lang="ar"
            >
              وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ
            </p>
            <blockquote
              className="font-heading text-xl sm:text-2xl font-semibold text-on-surface mb-2"
              id="askida-baslik"
              lang="tr"
            >
              “İyilik ve takva üzerinde yardımlaşın...”
            </blockquote>
            <span className="text-xs text-primary-fixed-dim font-medium block mb-4">
              Mâide Suresi, 2. Âyet-i Kerime
            </span>
            <p
              className="text-sm text-slate-300 leading-relaxed font-light"
              lang="tr"
            >
              Manevi Pusula ticari bir kazanç aracı değildir. Sunucu ve yapay zeka
              altyapı giderleri, gönüldaşların askıya bıraktığı samimi
              katkılarla karşılanır; böylece kederli veya darda olan her
              kardeşimiz hiçbir maddi engel olmadan dertleşebilir.
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-4 text-center">
              Askı Havuzuna Bir Katkı Bırak
            </span>
            <div
              aria-label="Askı bağış miktarı seçenekleri"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5"
              id="chips-container"
              role="group"
            >
              {DONATION_CHIPS.map((chip) => {
                const isSelected = Number(donationAmount) === chip.amount;
                return (
                  <button
                    aria-label={`${chip.amount} Türk Lirası ${chip.label}`}
                    aria-pressed={isSelected ? "true" : "false"}
                    className={`infak-chip p-3 rounded-xl text-center transition-all border focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isSelected
                        ? "active bg-surface-container-highest border-primary/60"
                        : "bg-surface-container border-outline-variant/40 hover:border-primary/50"
                    }`}
                    key={chip.amount}
                    onClick={() => setDonationAmount(chip.amount)}
                    type="button"
                  >
                    <span className="text-sm font-bold text-primary block">
                      {chip.amount} ₺
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      {chip.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:flex-grow">
                <span
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 font-medium text-xs"
                >
                  ₺
                </span>
                <input
                  aria-label="Özel katkı tutarı (TL)"
                  className="w-full bg-surface-container pl-8 pr-3 py-2.5 rounded-xl text-on-surface font-mono text-sm border border-outline-variant/50 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  id="custom-donation-input"
                  min="1"
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Tutar"
                  type="number"
                  value={donationAmount}
                />
              </div>
              <button
                aria-label="Belirlenen tutar ile Askıya Katıl"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={handleDonate}
                type="button"
              >
                <i aria-hidden="true" className="ph ph-heart text-sm"></i>
                <span>Askıya Katıl</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-slate-400">
              <span>Güvenli kart ödemesi veya detaylı infak havuzu için:</span>
              <Link
                className="text-primary hover:underline font-semibold"
                href="/askida-sirdas"
              >
                Askıda Pusula Sayfası →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
