"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  KART_GENISLIK,
  KART_YUKSEKLIK,
  kartDosyaAdi,
  kartDuzeniHesapla,
  kartMetniSec,
} from "@/lib/sohbet/gonul-karti";

/**
 * Gönül Kartı: cevabın ilk anlamlı bölümünü toprak tonlu dikey (1080x1920) bir görsel karta çevirir.
 * Kart tarayıcıda canvas ile çizilir; metin sunucuya gitmez, ek ücret yoktur.
 * Cevap metni değiştirilmez: yalnız baştan tam cümleler alınır.
 */

export const KART_IMZASI = "Manevi Pusula";

const RENK = {
  zeminUst: "#f4ecdd",
  zeminOrta: "#ebdcc1",
  zeminAlt: "#dcc5a0",
  cerceve: "rgba(122, 90, 20, 0.42)",
  cerceveInce: "rgba(122, 90, 20, 0.22)",
  sus: "#9a7434",
  yazi: "#3a2a14",
  imza: "#7a5a14",
};

/** next/font'un ürettiği gerçek yazı tipi adını tema değişkeninden okur. */
function yaziTipi(degisken: string, yedek: string): string {
  try {
    const v = getComputedStyle(document.body).getPropertyValue(degisken).trim();
    return v ? `${v}, ${yedek}` : yedek;
  } catch {
    return yedek;
  }
}

function sekizKoseliYildiz(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  for (const aci of [0, Math.PI / 4]) {
    ctx.save();
    ctx.rotate(aci);
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function yuvarlakDikdortgen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Kartı verilen canvas'a çizer. */
export function gonulKartiCiz(canvas: HTMLCanvasElement, cevap: string) {
  const W = KART_GENISLIK;
  const H = KART_YUKSEKLIK;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const baslikYazisi = yaziTipi("--font-heading", "'Roboto Slab', Georgia, serif");
  const govdeYazisi = yaziTipi("--font-sans", "'Space Grotesk', system-ui, sans-serif");

  // Zemin: toprak tonlu dikey geçiş + ortada yumuşak ışık
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, RENK.zeminUst);
  g.addColorStop(0.55, RENK.zeminOrta);
  g.addColorStop(1, RENK.zeminAlt);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const isik = ctx.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, W * 0.9);
  isik.addColorStop(0, "rgba(255, 250, 238, 0.55)");
  isik.addColorStop(1, "rgba(255, 250, 238, 0)");
  ctx.fillStyle = isik;
  ctx.fillRect(0, 0, W, H);

  // Çift çerçeve
  ctx.strokeStyle = RENK.cerceve;
  ctx.lineWidth = 3;
  yuvarlakDikdortgen(ctx, 56, 56, W - 112, H - 112, 36);
  ctx.stroke();
  ctx.strokeStyle = RENK.cerceveInce;
  ctx.lineWidth = 1.5;
  yuvarlakDikdortgen(ctx, 74, 74, W - 148, H - 148, 26);
  ctx.stroke();

  // Üst süs: sekiz köşeli yıldız ve iki yanında ince çizgi
  const susY = 300;
  ctx.strokeStyle = RENK.sus;
  ctx.lineWidth = 2.5;
  sekizKoseliYildiz(ctx, W / 2, susY, 26);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 230, susY);
  ctx.lineTo(W / 2 - 58, susY);
  ctx.moveTo(W / 2 + 58, susY);
  ctx.lineTo(W / 2 + 230, susY);
  ctx.stroke();

  // Metin bloğu
  const { metin } = kartMetniSec(cevap);
  const alanGenislik = 800;
  const alanUst = 420;
  const alanAlt = 1520;
  const olc = (t: string, punto: number) => {
    ctx.font = `500 ${punto}px ${baslikYazisi}`;
    return ctx.measureText(t).width;
  };
  const duzen = kartDuzeniHesapla(metin, olc, {
    genislik: alanGenislik,
    yukseklik: alanAlt - alanUst,
    enBuyukPunto: 62,
    enKucukPunto: 38,
  });
  ctx.font = `500 ${duzen.punto}px ${baslikYazisi}`;
  ctx.fillStyle = RENK.yazi;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const paragrafBoslugu = Math.round(duzen.satirYuksekligi * 0.6);
  let y = alanUst + (alanAlt - alanUst - duzen.yukseklik) / 2;
  for (const satir of duzen.satirlar) {
    if (satir === "") {
      y += paragrafBoslugu;
      continue;
    }
    // Satırın yazı çizgisi: satır yüksekliğinin ortasına yakın
    ctx.fillText(satir, W / 2, y + duzen.satirYuksekligi * 0.5 + duzen.punto * 0.35);
    y += duzen.satirYuksekligi;
  }

  // Alt: küçük baklava süs + imza
  const imzaY = 1700;
  ctx.fillStyle = RENK.sus;
  ctx.save();
  ctx.translate(W / 2, imzaY - 78);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();
  ctx.strokeStyle = RENK.cerceve;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, imzaY - 78);
  ctx.lineTo(W / 2 - 24, imzaY - 78);
  ctx.moveTo(W / 2 + 24, imzaY - 78);
  ctx.lineTo(W / 2 + 120, imzaY - 78);
  ctx.stroke();

  ctx.fillStyle = RENK.imza;
  ctx.font = `600 34px ${govdeYazisi}`;
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in ls) ls.letterSpacing = "3px";
  ctx.fillText(KART_IMZASI, W / 2, imzaY);
  if ("letterSpacing" in ls) ls.letterSpacing = "0px";
}

async function yaziTipleriniYukle() {
  if (typeof document === "undefined" || !document.fonts) return;
  const ornek = "Gönül Şükür İğde ıüçöğş";
  const baslik = yaziTipi("--font-heading", "serif");
  const govde = yaziTipi("--font-sans", "sans-serif");
  try {
    await Promise.all([
      document.fonts.load(`500 48px ${baslik}`, ornek),
      document.fonts.load(`600 34px ${govde}`, ornek),
    ]);
  } catch {
    /* yedek yazı tipiyle çizilir */
  }
}

function KartSimgesi({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="6" y="2.75" width="12" height="18.5" rx="2.25" />
      <path d="M9.5 9h5M9.5 12h5M9.5 15h3" strokeLinecap="round" />
    </svg>
  );
}

export function GonulKartiDugmesi({ metin, className = "" }: { metin: string; className?: string }) {
  const [acik, setAcik] = useState(false);
  const [adres, setAdres] = useState<string | null>(null);
  const [dosya, setDosya] = useState<File | null>(null);
  const [hata, setHata] = useState(false);
  const [paylasilabilir, setPaylasilabilir] = useState(false);
  const kapatRef = useRef<HTMLButtonElement | null>(null);

  const kapat = useCallback(() => setAcik(false), []);

  // Telefonda geri tuşu sayfadan çıkarmasın: kart açılınca geçmişe bir adım eklenir,
  // geri tuşu yalnız kartı kapatır. Kart düğmeyle kapanırsa eklenen adım geri alınır.
  useEffect(() => {
    if (!acik || typeof window === "undefined") return;
    let geriIleKapandi = false;
    try {
      window.history.pushState({ gonulKarti: true }, "");
    } catch {
      return;
    }
    const geri = () => {
      geriIleKapandi = true;
      setAcik(false);
    };
    window.addEventListener("popstate", geri);
    return () => {
      window.removeEventListener("popstate", geri);
      if (!geriIleKapandi && window.history.state?.gonulKarti) {
        try {
          window.history.back();
        } catch {
          /* yut */
        }
      }
    };
  }, [acik]);

  useEffect(() => {
    if (!acik) return;
    let iptal = false;
    let url: string | null = null;
    setHata(false);
    setAdres(null);
    setDosya(null);
    kapatRef.current?.focus();
    (async () => {
      await yaziTipleriniYukle();
      if (iptal) return;
      const canvas = document.createElement("canvas");
      gonulKartiCiz(canvas, metin);
      const blob = await new Promise<Blob | null>((coz) => canvas.toBlob(coz, "image/png"));
      if (iptal) return;
      if (!blob) {
        setHata(true);
        return;
      }
      url = URL.createObjectURL(blob);
      const f = new File([blob], kartDosyaAdi(), { type: "image/png" });
      setAdres(url);
      setDosya(f);
      try {
        setPaylasilabilir(
          typeof navigator.share === "function" &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [f] }),
        );
      } catch {
        setPaylasilabilir(false);
      }
    })();
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tus);
    return () => {
      iptal = true;
      window.removeEventListener("keydown", tus);
      if (url) URL.revokeObjectURL(url);
    };
  }, [acik, metin, kapat]);

  const paylas = async () => {
    if (!dosya) return;
    try {
      await navigator.share({ files: [dosya], title: "Gönül Kartı" });
    } catch {
      /* vazgeçildi ya da desteklenmiyor: indirme düğmesi duruyor */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        aria-label="Gönül Kartı olarak paylaş"
        title="Cevabı paylaşılabilir bir görsel karta dönüştür"
        className={className}
      >
        <KartSimgesi />
        <span>Gönül Kartı</span>
      </button>
      {acik &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4" lang="tr">
            <div aria-hidden="true" className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={kapat} />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="gonul-karti-baslik"
              className="relative z-10 w-full max-w-sm rounded-[28px] border border-outline-variant/60 bg-surface-container-high p-5 text-on-surface shadow-m3-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="gonul-karti-baslik" className="font-heading text-lg font-semibold text-primary-fixed">
                    Gönül Kartı
                  </h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Durum ve hikâye için dikey görsel. Yalnız bu cevaptan alınır, cihazında hazırlanır.
                  </p>
                </div>
                <button
                  ref={kapatRef}
                  type="button"
                  onClick={kapat}
                  aria-label="Kapat"
                  className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mx-auto aspect-[9/16] max-h-[50vh] overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container shadow-m3-2">
                {adres ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={adres} alt="Gönül Kartı önizlemesi" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-on-surface-variant" role="status">
                    {hata ? "Kart hazırlanamadı. Lütfen tekrar deneyin." : "Kart hazırlanıyor…"}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <a
                  href={adres ?? undefined}
                  download={dosya?.name ?? kartDosyaAdi()}
                  target="_blank"
                  rel="noopener"
                  aria-disabled={!adres}
                  className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary shadow-m3-1 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    adres ? "" : "pointer-events-none opacity-50"
                  }`}
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  İndir
                </a>
                {paylasilabilir && (
                  <button
                    type="button"
                    onClick={paylas}
                    disabled={!dosya}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-highest active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M12 15V4m0 0L8 8m4-4 4 4M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Paylaş
                  </button>
                )}
              </div>
              <p className="text-center text-[11px] text-on-surface-variant">
                İndirme olmazsa görsele basılı tutup kaydedebilirsin.
              </p>
              <button
                type="button"
                onClick={kapat}
                className="flex min-h-[44px] w-full items-center justify-center rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Sohbete dön
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
