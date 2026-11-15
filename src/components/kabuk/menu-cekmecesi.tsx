"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { YaziBoyutuDugmesi } from "@/components/ui/yazi-boyutu";
import { TemaSecici } from "@/components/ui/tema-secici";
import { useGonulDefteri } from "@/components/chat/gonul-defteri-dugmesi";

export const GORUS_EPOSTA =
  "mailto:adnan.kus@hotmail.com?subject=Manevi%20Pusula%20-%20G%C3%B6r%C3%BC%C5%9F%20ve%20%C3%96neri";

/** Menüdeki "Yazı Boyutu" ve tema ayarı (üst bardan buraya taşındı; seçim cihazda hatırlanır). */
export function MenuGorunumBolumu() {
  return (
    <section aria-labelledby="menu-gorunum" className="space-y-2">
      <h2 id="menu-gorunum" className="px-1 text-xs font-semibold tracking-wide text-on-surface-variant">
        Görünüm
      </h2>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container px-3 py-2">
        <span className="text-sm font-medium text-on-surface">Yazı Boyutu</span>
        <YaziBoyutuDugmesi />
      </div>
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container p-2">
        <TemaSecici />
      </div>
    </section>
  );
}

const SATIR =
  "flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function GonulDefterimSatiri({ onClick }: { onClick?: () => void }) {
  const { kayitlar } = useGonulDefteri();
  return (
    <Link href="/gonul-defterim" onClick={onClick} className={SATIR}>
      <i aria-hidden="true" className="ph ph-bookmark-simple text-xl text-primary"></i>
      <span className="flex-1">Gönül Defterim</span>
      {kayitlar.length > 0 && (
        <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-semibold text-on-secondary-container">
          {kayitlar.length}
        </span>
      )}
    </Link>
  );
}

export function AcilHatlar() {
  return (
    <div className="flex items-center gap-2">
      <a
        aria-label="Diyanet Alo 190 Fetva Hattı"
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface"
        href="tel:190"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span>Alo 190 Fetva</span>
      </a>
      <a
        aria-label="112 Acil Çağrı Merkezi"
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-error/20 bg-error-container px-3 py-2 text-xs font-medium text-on-error-container"
        href="tel:112"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-error" />
        <span>112 Acil</span>
      </a>
    </div>
  );
}

/** Araç ve alt sayfalarda açılan yan çekmece (ana sohbetin kendi yan menüsü vardır). */
export function MenuCekmecesi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => e.key === "Escape" && onKapat();
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [acik, onKapat]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onKapat}
        className={`mp-perde fixed inset-0 z-[60] bg-black/45 transition-opacity duration-300 ${
          acik ? "opacity-100 backdrop-blur-[6px]" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Menü"
        aria-hidden={!acik}
        inert={!acik ? true : undefined}
        className={`fixed inset-y-0 left-0 z-[61] flex w-[300px] max-w-[86vw] flex-col overflow-y-auto overscroll-contain border-r border-outline-variant/40 bg-surface-container-low shadow-m3-4 transition-transform duration-300 ease-out ${
          acik ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-outline-variant/40 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-outline-variant/50 bg-surface-container-high">
              <Image src="/icon.png" alt="" width={36} height={36} className="h-full w-full object-cover" />
            </span>
            <span className="truncate whitespace-nowrap font-heading text-lg font-medium text-on-surface">Manevi Pusula</span>
          </div>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Menüyü kapat"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <i aria-hidden="true" className="ph ph-x text-xl"></i>
          </button>
        </div>

        <nav aria-label="Menü bağlantıları" className="space-y-1 p-3">
          <GonulDefterimSatiri onClick={onKapat} />
          <Link href="/?menu=1" onClick={onKapat} className={SATIR}>
            <i aria-hidden="true" className="ph ph-chats-circle text-xl text-primary"></i>
            <span>Geçmiş sohbetler</span>
          </Link>
          <Link href="/araclar" onClick={onKapat} className={SATIR}>
            <i aria-hidden="true" className="ph ph-compass text-xl text-primary"></i>
            <span>Manevi Araçlar</span>
          </Link>
          <Link href="/araclar/cuma-hutbesi" onClick={onKapat} className={SATIR}>
            <i aria-hidden="true" className="ph ph-headphones text-xl text-primary"></i>
            <span>Cuma Hutbesi</span>
          </Link>
        </nav>

        <div className="space-y-4 border-t border-outline-variant/40 p-3">
          <MenuGorunumBolumu />

          <div className="space-y-1">
            <a href={GORUS_EPOSTA} className={SATIR}>
              <i aria-hidden="true" className="ph ph-chat-centered-text text-xl text-primary"></i>
              <span>Görüş &amp; Öneri Bildir</span>
            </a>
            <Link href="/askida-sirdas" onClick={onKapat} className={SATIR}>
              <i aria-hidden="true" className="ph ph-hand-heart text-xl text-primary"></i>
              <span>Askıda Pusula</span>
            </Link>
            <Link href="/tanitim" onClick={onKapat} className={SATIR}>
              <i aria-hidden="true" className="ph ph-info text-xl text-primary"></i>
              <span>Tanıtım</span>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-1 text-xs text-on-surface-variant/90">
            <Link className="hover:text-primary" href="/sorumluluk-reddi" onClick={onKapat}>
              Şer&apos;i Hukuki Çerçeve
            </Link>
            <Link className="hover:text-primary" href="/gizlilik-politikasi" onClick={onKapat}>
              Mahremiyet Esasları
            </Link>
          </div>

          <AcilHatlar />
        </div>
      </aside>
    </>
  );
}
