import React from "react";
import { HUTBE_LISTE_ADRESI, KAYNAK_ADI, tarihiYaz, type Hutbe } from "@/lib/araclar/cuma-hutbesi";
import type { GosterilecekHutbeler } from "@/lib/araclar/cuma-hutbesi-kaynak";

/**
 * Cuma hutbesi gösterimi (sunucu bileşeni, istemci betiği yok).
 * Bu haftanın hutbesi açık, önceki dört hafta <details> ile açılıp kapanır.
 */

function DisBaglanti({ href, ikon, children }: { href: string; ikon: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-high px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <i aria-hidden="true" className={`ph ${ikon} text-lg`}></i>
      <span>{children}</span>
      <span className="sr-only"> (yeni sekmede açılır)</span>
    </a>
  );
}

function HutbeGovdesi({ hutbe }: { hutbe: Hutbe }) {
  const m = hutbe.metin;
  return (
    <div className="space-y-5">
      {hutbe.ses && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-on-surface">Sesli hutbe</p>
          <audio controls preload="none" src={hutbe.ses} className="w-full max-w-xl">
            <a href={hutbe.ses}>Sesli hutbeyi indirin</a>
          </audio>
        </div>
      )}

      {m ? (
        <div className="max-w-[68ch] space-y-4 text-[17px] leading-[1.8] text-on-surface" lang="tr">
          {m.paragraflar.map((p, i) =>
            p.tur === "hitap" ? (
              <p key={i} className="pt-1 font-semibold text-primary">
                {p.metin}
              </p>
            ) : p.tur === "imza" ? (
              <p key={i} className="text-right text-[15px] italic text-on-surface-variant">
                {p.metin}
              </p>
            ) : (
              <p key={i}>{p.metin}</p>
            ),
          )}
          {m.dipnotlar.length > 0 && (
            <ol className="space-y-1 border-t border-outline-variant/40 pt-4 text-sm leading-relaxed text-on-surface-variant">
              {m.dipnotlar.map((d) => (
                <li key={d.no}>
                  <span className="font-semibold">{d.no}.</span> {d.metin}
                </li>
              ))}
            </ol>
          )}
          {m.arapcaAtlandi && (
            <p className="rounded-xl border border-outline-variant/40 bg-surface-container-high px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
              Hutbenin başındaki ayet ve hadislerin Arapça asılları bu sayfada gösterilmiyor; PDF dosyasında
              okuyabilirsiniz.
            </p>
          )}
        </div>
      ) : (
        <p className="text-[17px] leading-[1.8] text-on-surface">
          Bu hutbenin metnini burada gösteremiyoruz. Diyanet&apos;in yayımladığı PDF dosyasından okuyabilirsiniz.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {hutbe.pdf && (
          <DisBaglanti href={hutbe.pdf} ikon="ph-file-pdf">
            PDF olarak açın
          </DisBaglanti>
        )}
        <DisBaglanti href={HUTBE_LISTE_ADRESI} ikon="ph-arrow-square-out">
          Diyanet sitesinde görün
        </DisBaglanti>
      </div>
    </div>
  );
}

function KaynakNotu() {
  return (
    <p className="text-sm leading-relaxed text-on-surface-variant">
      Kaynak: {KAYNAK_ADI}, Din Hizmetleri Genel Müdürlüğü.{" "}
      <a
        href={HUTBE_LISTE_ADRESI}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
      >
        Hutbelerin özgün sayfası
        <span className="sr-only"> (yeni sekmede açılır)</span>
      </a>
      . Metinler Diyanet&apos;in yayımladığı hâliyle, değiştirilmeden aktarılır.
    </p>
  );
}

export function CumaHutbesi({ veri }: { veri: GosterilecekHutbeler }) {
  if (!veri || !veri.buHafta) {
    return (
      <section className="space-y-4 rounded-2xl border border-outline-variant/50 bg-surface-container/85 p-5 sm:p-7 shadow-md">
        <p className="text-[17px] leading-[1.8] text-on-surface">
          Hutbeye şu an ulaşılamıyor, Diyanet sitesinden okuyabilirsiniz.
        </p>
        <DisBaglanti href={HUTBE_LISTE_ADRESI} ikon="ph-arrow-square-out">
          Diyanet hutbe sayfasını açın
        </DisBaglanti>
      </section>
    );
  }

  const { buHafta, arsiv } = veri;
  return (
    <div className="space-y-10">
      <article
        aria-labelledby="bu-hafta-baslik"
        className="space-y-5 rounded-2xl border border-primary/40 bg-surface-container/85 p-5 sm:p-8 shadow-md"
      >
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Bu haftanın hutbesi · {tarihiYaz(buHafta.tarih)}
          </p>
          <h2 id="bu-hafta-baslik" className="font-heading text-2xl sm:text-3xl font-semibold text-on-surface">
            {buHafta.baslik}
          </h2>
        </header>
        <HutbeGovdesi hutbe={buHafta} />
      </article>

      {arsiv.length > 0 && (
        <section aria-labelledby="arsiv-baslik" className="space-y-4">
          <h2 id="arsiv-baslik" className="font-heading text-xl sm:text-2xl font-semibold text-on-surface">
            Önceki haftaların hutbeleri
          </h2>
          <ul className="space-y-3">
            {arsiv.map((h) => (
              <li key={h.tarih}>
                <details className="group rounded-2xl border border-outline-variant/50 bg-surface-container/85 shadow-md open:border-primary/40">
                  <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 rounded-2xl px-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">
                      <span className="block text-sm text-on-surface-variant">{tarihiYaz(h.tarih)}</span>
                      <span className="block text-[17px] font-semibold text-on-surface">{h.baslik}</span>
                    </span>
                    <i
                      aria-hidden="true"
                      className="ph ph-caret-down text-xl text-primary transition-transform group-open:rotate-180"
                    ></i>
                  </summary>
                  <div className="border-t border-outline-variant/40 px-5 pb-6 pt-5">
                    <HutbeGovdesi hutbe={h} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <KaynakNotu />
    </div>
  );
}
