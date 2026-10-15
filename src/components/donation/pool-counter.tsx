import React from "react";
import { Sparkles, Coins, HeartHandshake } from "lucide-react";

interface PoolCounterProps {
  sponsoredMessages?: number | string;
  poolBalance?: number | string;
  donorCount?: number | string;
}

export function PoolCounter({
  sponsoredMessages = "142.850 adet",
  poolBalance = "24.300 ₺",
  donorCount = "1.280 hayırsever",
}: PoolCounterProps) {
  const formattedMessages =
    typeof sponsoredMessages === "number"
      ? `${sponsoredMessages.toLocaleString("tr-TR")} adet`
      : sponsoredMessages;

  const formattedBalance =
    typeof poolBalance === "number"
      ? `${poolBalance.toLocaleString("tr-TR")} ₺`
      : poolBalance;

  const formattedDonors =
    typeof donorCount === "number"
      ? `${donorCount.toLocaleString("tr-TR")} hayırsever`
      : donorCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Karşılanan Manevi Teskin */}
      <div className="relative group rounded-2xl border border-emerald-900/60 bg-gradient-to-b from-[#0e1713]/90 via-[#0a110e]/90 to-[#070c09]/95 p-7 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_36px_-5px_rgba(5,150,105,0.2)] hover:border-emerald-600/40 transition-all duration-300 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between text-emerald-400">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-300">
            Bu Ay Karşılanan
          </span>
          <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shadow-inner">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-tight">
            {formattedMessages}
          </div>
          <p className="text-xs text-emerald-200/70 mt-1.5 font-light">
            Karşılanan Manevi Sohbet ve gönül ferahlatan teskin mesajı
          </p>
        </div>

        <div className="pt-3 border-t border-emerald-950/80 text-[11px] text-emerald-400/80 flex items-center gap-1.5 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>WhatsApp Jetonları Karşılandı</span>
        </div>
      </div>

      {/* 2. Askıdaki Güncel Bakiye (Centerpiece Infak Fund) */}
      <div className="relative group rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-[#141d17]/95 via-[#0e1612]/95 to-[#080d0b]/98 p-7 shadow-[0_12px_40px_-5px_rgba(217,119,6,0.22)] hover:border-amber-400/60 transition-all duration-300 backdrop-blur-md space-y-4">
        {/* Top gold sheen */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
        />

        <div className="flex items-center justify-between text-amber-400">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-amber-300">
            Askıdaki Güncel Bakiye
          </span>
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/45 flex items-center justify-center text-amber-300 shadow-inner">
            <Coins className="h-4 w-4" />
          </div>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-bold font-serif text-amber-300 tracking-tight">
            {formattedBalance}
          </div>
          <p className="text-xs text-emerald-200/70 mt-1.5 font-light">
            Hazır bekleyen Havuz Bakiyesi ve infak fonu
          </p>
        </div>

        <div className="pt-3 border-t border-amber-500/20 text-[11px] text-amber-300/80 flex items-center gap-1.5 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Şeffaf Sadaka-i Cariye Hesabı</span>
        </div>
      </div>

      {/* 3. Gönüllü Destekçi */}
      <div className="relative group rounded-2xl border border-emerald-900/60 bg-gradient-to-b from-[#0e1713]/90 via-[#0a110e]/90 to-[#070c09]/95 p-7 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_36px_-5px_rgba(217,119,6,0.15)] hover:border-amber-500/35 transition-all duration-300 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between text-amber-400">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-300">
            Gönüllü Destekçi
          </span>
          <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-amber-300 shadow-inner">
            <HeartHandshake className="h-4 w-4" />
          </div>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-tight">
            {formattedDonors}
          </div>
          <p className="text-xs text-emerald-200/70 mt-1.5 font-light">
            Kardeşinin derdine ortak olan Hayırsever Gönüllü infak ehli
          </p>
        </div>

        <div className="pt-3 border-t border-emerald-950/80 text-[11px] text-emerald-400/80 flex items-center gap-1.5 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Osmanlı Sadaka Taşı Geleneği</span>
        </div>
      </div>
    </div>
  );
}

