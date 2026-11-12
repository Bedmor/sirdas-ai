import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";

type Props = {
  ust: string;
  baslik: string;
  aciklama: string;
  geriLink?: boolean;
  children: React.ReactNode;
};

/** Manevi Araçlar sayfalarının ortak kabuğu (üst bant, gezinme, başlık, alt bilgi). */
export function AracSayfasi({ ust, baslik, aciklama, geriLink = true, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern overflow-x-hidden">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 w-full py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="border-b border-outline-variant/30 pb-6 space-y-3">
            {geriLink && (
              <Link
                href="/araclar"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-primary transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                <i aria-hidden="true" className="ph ph-arrow-left text-sm"></i>
                <span>Manevi Araçlar</span>
              </Link>
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-primary block">{ust}</span>
            <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-on-surface tracking-tight">
              {baslik}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-light max-w-2xl">{aciklama}</p>
          </div>

          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
