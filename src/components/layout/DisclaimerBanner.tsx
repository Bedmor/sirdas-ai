import React from "react";
import { AlertTriangle, PhoneCall, ShieldAlert, HeartPulse } from "lucide-react";

export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label="Kalıcı Sorumluluk ve Manevi Uyarı Bildirimi"
      className={`w-full bg-amber-500/10 border-y border-amber-500/25 py-2.5 px-4 text-xs ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="leading-snug">
            <span className="font-semibold underline decoration-amber-500/40 mr-1">
              Fıkhi &amp; Hukuki Sınır:
            </span>
            Sırdaş AI bir fetva makamı veya ruh sağlığı tedavi mercii değildir. Şer&apos;i ve
            hukuki bağlayıcılığı yoktur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="tel:190"
            title="Diyanet Alo 190 Fetva Hattı"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 dark:text-amber-200 font-medium transition-colors border border-amber-500/30 text-[11px]"
          >
            <PhoneCall className="h-3 w-3 text-amber-700 dark:text-amber-400" />
            <span>Alo 190 (Diyanet Fetva)</span>
          </a>
          <a
            href="tel:112"
            title="112 Acil Çağrı Merkezi"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-950 dark:text-rose-200 font-medium transition-colors border border-rose-500/30 text-[11px]"
          >
            <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            <span>112 (Acil Kriz)</span>
          </a>
          <a
            href="tel:182"
            title="182 Sağlık & Psikolojik Danışma"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-950 dark:text-blue-200 font-medium transition-colors border border-blue-500/30 text-[11px]"
          >
            <HeartPulse className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span>182 (MHRS / Sağlık)</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
