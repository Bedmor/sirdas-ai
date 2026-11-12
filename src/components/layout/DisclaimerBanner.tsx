import React from "react";

export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label="Manevi Sınırlar ve Yasal Uyarı Bildirimi"
      id="top-sinirlar-banner"
      className={`w-full bg-surface-container-low/95 border-b border-outline-variant/40 py-2.5 px-4 relative z-50 text-xs text-on-surface-variant backdrop-blur-sm ${className}`}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2 text-center md:text-left truncate">
          <span className="text-xs font-semibold tracking-wider text-primary flex-shrink-0">
            Manevi Sınırlar &amp; Beyan:
          </span>
          <p className="text-[11px] text-slate-300 leading-snug truncate" lang="tr">
            Manevi Pusula fetva mercii değildir, hata yapabilir; bağlayıcılığı yoktur. Fıkhi hükümler için{" "}
            <strong className="text-white font-medium">Alo 190</strong>, kriz ve acil durumlarda{" "}
            <strong className="text-white font-medium">112 Acil</strong> esastır.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            aria-label="Diyanet Alo 190 Fetva Hattını Ara"
            className="px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-[11px] text-on-surface hover:text-primary flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href="tel:190"
          >
            <span
              aria-hidden="true"
              className="w-5 h-5 rounded-full bg-secondary-container text-secondary flex items-center justify-center text-[10px] border border-secondary/30 flex-shrink-0"
            >
              <i className="ph ph-book-open text-xs"></i>
            </span>
            <span className="font-medium">Alo 190</span>
          </a>

          <a
            aria-label="112 Acil Çağrı Merkezini Ara"
            className="px-2.5 py-1 rounded-full bg-error-container/60 border border-red-500/30 text-red-200 text-[11px] flex items-center gap-1.5 hover:bg-error-container transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href="tel:112"
          >
            <span
              aria-hidden="true"
              className="w-5 h-5 rounded-full bg-red-950/80 text-red-300 flex items-center justify-center text-[10px] border border-red-500/40 flex-shrink-0"
            >
              <i className="ph ph-first-aid text-xs"></i>
            </span>
            <span className="font-medium">112 Acil</span>
          </a>

          <a
            aria-label="182 MHRS Sağlık Hattını Ara"
            className="hidden sm:flex px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-[11px] text-on-surface hover:text-primary items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href="tel:182"
          >
            <span
              aria-hidden="true"
              className="w-5 h-5 rounded-full bg-blue-950 text-blue-300 flex items-center justify-center text-[10px] border border-blue-500/30 flex-shrink-0"
            >
              <i className="ph ph-heartbeat text-xs"></i>
            </span>
            <span className="font-medium">182 Sağlık</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
