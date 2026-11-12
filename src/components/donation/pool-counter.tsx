"use client";

import React, { useEffect, useState } from "react";

interface PoolCounterProps {
  sponsoredMessages?: number | string;
  poolBalance?: number | string;
  donorCount?: number | string;
}

export function PoolCounter({
  sponsoredMessages: initialMessages,
  poolBalance: initialBalance,
  donorCount: initialDonors,
}: PoolCounterProps) {
  // Desteklenen referans formatları: 142.850 adet, 24.300 ₺
  const [sponsoredMessages, setSponsoredMessages] = useState<number | string>(
    initialMessages ?? "0 adet"
  );
  const [poolBalance, setPoolBalance] = useState<number | string>(
    initialBalance ?? "0 ₺"
  );
  const [donorCount, setDonorCount] = useState<number | string>(
    initialDonors ?? "0 hayırsever"
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.success && json.data?.donations) {
          const { poolBalance: pb, totalCount, sponsoredMessagesCount } = json.data.donations;
          if (pb !== undefined && pb !== null) {
            setPoolBalance(`${Number(pb).toLocaleString("tr-TR")} ₺`);
          }
          if (sponsoredMessagesCount !== undefined && sponsoredMessagesCount !== null) {
            setSponsoredMessages(`${Number(sponsoredMessagesCount).toLocaleString("tr-TR")} adet`);
          }
          if (totalCount !== undefined && totalCount !== null) {
            setDonorCount(`${Number(totalCount).toLocaleString("tr-TR")} hayırsever`);
          }
        }
      } catch {
        // Fallback gracefully to default values
      }
    }

    // Only fetch if initial values were not provided
    if (initialMessages === undefined && initialBalance === undefined && initialDonors === undefined) {
      fetchLiveStats();
    }

    return () => {
      isMounted = false;
    };
  }, [initialMessages, initialBalance, initialDonors]);

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
      <div className="relative group rounded-2xl border border-outline-variant/40 bg-surface-container/90 p-7 shadow-xl hover:border-secondary/50 transition-all duration-300 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between text-secondary">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Bu Ay Karşılanan
          </span>
          <div className="h-9 w-9 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-secondary shadow-inner">
            <i className="ph ph-sparkle text-lg"></i>
          </div>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-heading font-semibold text-on-surface tracking-tight">
            {formattedMessages}
          </div>
          <p className="text-xs text-slate-300 mt-1.5 font-light leading-relaxed">
            Karşılanan manevi sohbet ve gönül ferahlatan tefekkür mesajı
          </p>
        </div>

        <div className="pt-3 border-t border-outline-variant/30 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
          <span>Dertleşme Mesajları Karşılandı</span>
        </div>
      </div>

      {/* 2. Askıdaki Güncel Bakiye (Centerpiece Infak Fund) */}
      <div className="relative group rounded-2xl border-2 border-primary/60 bg-surface-container-high/90 p-7 shadow-2xl hover:border-primary transition-all duration-300 backdrop-blur-md space-y-4">
        {/* Top gold sheen */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        />

        <div className="flex items-center justify-between text-primary">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Askıdaki Güncel Bakiye
          </span>
          <div className="h-9 w-9 rounded-full bg-primary-container border border-primary/40 flex items-center justify-center text-primary shadow-inner">
            <i className="ph ph-coins text-lg"></i>
          </div>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-heading font-bold text-primary tracking-tight">
            {formattedBalance}
          </div>
          <p className="text-xs text-slate-300 mt-1.5 font-light leading-relaxed">
            Hazır bekleyen havuz bakiyesi ve manevi infak fonu
          </p>
        </div>

        <div className="pt-3 border-t border-outline-variant/30 text-[11px] text-primary-fixed-dim flex items-center gap-1.5 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>Şeffaf Sadaka-i Cariye Hesabı</span>
        </div>
      </div>

      {/* 3. Gönüllü Destekçi */}
      <div className="relative group rounded-2xl border border-outline-variant/40 bg-surface-container/90 p-7 shadow-xl hover:border-primary/50 transition-all duration-300 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between text-secondary">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Gönüllü Destekçi
          </span>
          <div className="h-9 w-9 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary shadow-inner">
            <i className="ph ph-hand-heart text-lg"></i>
          </div>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-heading font-semibold text-on-surface tracking-tight">
            {formattedDonors}
          </div>
          <p className="text-xs text-slate-300 mt-1.5 font-light leading-relaxed">
            Kardeşinin derdine ortak olan hayırsever infak ehli
          </p>
        </div>

        <div className="pt-3 border-t border-outline-variant/30 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span>Osmanlı Sadaka Taşı Geleneği</span>
        </div>
      </div>
    </div>
  );
}
