import React from "react";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { AracKabugu } from "@/components/kabuk/arac-kabugu";

type Props = {
  ust: string;
  baslik: string;
  aciklama: string;
  /** false: araçlar merkezinin kendisi (Geri ana sohbete döner). */
  geriLink?: boolean;
  /** Geri düğmesinin, site içi geçmiş yoksa gideceği sayfa. */
  geriHref?: string;
  children: React.ReactNode;
};

/** Manevi Araçlar ve alt sayfaların ortak kabuğu (üst bar + vakit şeridi, başlık, alt sekmeler, alt bilgi). */
export function AracSayfasi({ ust, baslik, aciklama, geriLink = true, geriHref, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-primary selection:text-on-primary spiritual-bg-pattern overflow-x-clip">
      <AracKabugu geriHref={geriHref ?? (geriLink ? "/araclar" : "/")} ust={<DisclaimerBanner />}>
        <main className="flex-1 w-full pt-6 pb-10 md:pt-10 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="border-b border-outline-variant/30 pb-6 space-y-3">
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
        {/* Alt sekme çubuğu içeriği örtmesin */}
        <div aria-hidden="true" className="h-24" />
      </AracKabugu>
    </div>
  );
}
