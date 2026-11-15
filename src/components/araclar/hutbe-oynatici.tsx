"use client";

import React from "react";
import { HIZLAR, sureYaz, useSesOynatici } from "@/components/kabuk/ses-oynatici";

/**
 * Cuma hutbesi için podcast tarzı ses kartı: çal/duraklat, 15 sn geri/ileri, ilerleme çubuğu,
 * 1x / 1.25x / 1.5x hız. Ses kökteki tek oynatıcıdan çalar; sohbet ya da dua havuzuna geçince kesilmez.
 */
export function HutbeOynatici({ src, baslik, tarih }: { src: string; baslik: string; tarih: string }) {
  const s = useSesOynatici();

  // Sağlayıcı yoksa (beklenmez) tarayıcının kendi oynatıcısına düş.
  if (!s) {
    return (
      <audio controls preload="none" src={src} className="w-full">
        <a href={src}>Sesli hutbeyi indirin</a>
      </audio>
    );
  }

  const bu = s.parca?.src === src;
  const caliyor = bu && s.caliyor;
  const konum = bu ? s.konum : 0;
  const sure = bu ? s.sure : 0;
  const oran = sure > 0 ? Math.min(100, (konum / sure) * 100) : 0;

  const calDuraklat = () => {
    if (caliyor) s.duraklat();
    else if (bu) s.devam();
    else s.cal({ src, baslik, altBaslik: tarih });
  };

  const atlaDugme =
    "flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div
      className="mp-hutbe-oynatici relative overflow-hidden rounded-[24px] border border-primary/30 p-4 sm:p-5 shadow-m3-2"
      style={{
        background:
          "linear-gradient(135deg, rgb(var(--c-secondary-container) / 0.55), rgb(var(--c-surface-container-high) / 0.95) 60%)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-surface-container-highest text-primary">
          <i aria-hidden="true" className="ph ph-headphones text-2xl"></i>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Sesli hutbe</p>
          <p className="line-clamp-2 font-heading text-base font-semibold leading-snug text-on-surface">{baslik}</p>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={sure || 0}
          step={1}
          value={konum}
          disabled={!bu || !sure}
          onChange={(e) => s.git(Number(e.target.value))}
          aria-label="Hutbede ilerle"
          aria-valuetext={`${sureYaz(konum)} / ${sureYaz(sure)}`}
          className="mp-ses-cubugu w-full"
          style={{ ["--oran" as string]: `${oran}%` }}
        />
        <div className="mt-1 flex justify-between text-[12px] tabular-nums text-on-surface-variant">
          <span>{sureYaz(konum)}</span>
          <span>{sure ? sureYaz(sure) : "--:--"}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
        <div role="group" aria-label="Oynatma hızı" className="flex rounded-full border border-outline-variant/50 bg-surface-container p-0.5">
          {HIZLAR.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={s.hiz === h}
              onClick={() => s.hizAyarla(h)}
              className={`min-h-[36px] min-w-[44px] rounded-full px-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                s.hiz === h ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {h}x
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => s.atla(-15)} disabled={!bu} aria-label="15 saniye geri" className={atlaDugme}>
            <i aria-hidden="true" className="ph ph-arrow-counter-clockwise text-xl"></i>
          </button>
          <button
            type="button"
            onClick={calDuraklat}
            aria-label={caliyor ? "Hutbeyi duraklat" : "Hutbeyi dinle"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-m3-2 transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {bu && s.yukleniyor ? (
              <i aria-hidden="true" className="ph ph-circle-notch animate-spin text-2xl"></i>
            ) : (
              <i aria-hidden="true" className={`ph ${caliyor ? "ph-pause" : "ph-play"} text-2xl`}></i>
            )}
          </button>
          <button type="button" onClick={() => s.atla(15)} disabled={!bu} aria-label="15 saniye ileri" className={atlaDugme}>
            <i aria-hidden="true" className="ph ph-arrow-clockwise text-xl"></i>
          </button>
        </div>
      </div>

      {bu && s.hata && (
        <p className="mt-3 text-sm text-error">
          Ses açılamadı.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
            Ses dosyasını doğrudan açın
          </a>
          .
        </p>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-on-surface-variant">
        Dinlerken sohbete ya da diğer araçlara geçebilirsiniz; hutbe arkada çalmaya devam eder.
      </p>
    </div>
  );
}
