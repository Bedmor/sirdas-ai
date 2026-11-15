"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { VakitSeridi } from "./vakit-seridi";

/**
 * Sade üst bar: solda Menü (ana sohbette) ya da Geri (alt sayfalarda), ortada logo ve marka
 * (her yerden ana sohbete döner), sağda Yeni Sohbet (kalem). Altında ince canlı vakit şeridi.
 */

const IC_GEZINME = "manevi-pusula:ic-gezinme";

/** Kök yerleşimde durur: site içinde en az bir sayfa geçişi olduysa Geri tarayıcı geçmişine döner. */
export function GezinmeIzleyici() {
  const yol = usePathname();
  const ilk = useRef(true);
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    try {
      window.sessionStorage.setItem(IC_GEZINME, "1");
    } catch {
      /* yok say */
    }
  }, [yol]);
  return null;
}

const SIMGE_DUGME =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface active:scale-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function GeriDugmesi({ yedekHref }: { yedekHref: string }) {
  const router = useRouter();
  return (
    <Link
      href={yedekHref}
      aria-label="Geri"
      title="Geri"
      className={SIMGE_DUGME}
      onClick={(e) => {
        let ic = false;
        try {
          ic = window.sessionStorage.getItem(IC_GEZINME) === "1" && window.history.length > 1;
        } catch {
          /* yok say */
        }
        if (ic) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

export function MenuDugmesi({ onClick, acik }: { onClick: () => void; acik?: boolean }) {
  return (
    <button type="button" aria-label="Menüyü aç" aria-expanded={acik} title="Menü" onClick={onClick} className={SIMGE_DUGME}>
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function KalemSimgesi() {
  return (
    <svg aria-hidden="true" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
      <path d="M12 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  /** Sol düğme: ana sohbette "menu", diğer her yerde "geri". */
  sol: { tur: "menu"; onClick: () => void; acik?: boolean } | { tur: "geri"; yedekHref: string };
  /** Ana sohbette yeni sohbeti başlatır; verilmezse ana sohbete yeni sohbet olarak gider. */
  onYeniSohbet?: () => void;
  /** Logoya basılınca (ana sohbetteyken çekmeceyi kapatmak gibi) ek iş. */
  onLogo?: () => void;
  /** Masaüstünde sol düğme gizlensin mi (ör. yan menü zaten açıkken). */
  className?: string;
  solClassName?: string;
};

export function UstBar({ sol, onYeniSohbet, onLogo, className = "", solClassName = "" }: Props) {
  const yol = usePathname();
  return (
    <div className={`mp-ust-bar relative z-20 shrink-0 ${className}`}>
      <header className="grid h-14 grid-cols-[3rem_1fr_3rem] items-center gap-1 border-b border-outline-variant/40 bg-surface/85 px-1.5 backdrop-blur-md sm:px-4">
        <div className={`flex justify-start ${solClassName}`}>
          {sol.tur === "menu" ? (
            <MenuDugmesi onClick={sol.onClick} acik={sol.acik} />
          ) : (
            <GeriDugmesi yedekHref={sol.yedekHref} />
          )}
        </div>

        <Link
          href="/"
          onClick={(e) => {
            if (yol === "/") e.preventDefault();
            onLogo?.();
          }}
          aria-label="Manevi Pusula: ana sohbete dön"
          className="mx-auto flex min-w-0 items-center gap-2 rounded-full px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-outline-variant/50 bg-surface-container-high shadow-xs">
            <Image alt="" className="h-full w-full object-cover" height={32} width={32} priority src="/icon.png" />
          </span>
          <span className="truncate font-heading text-[17px] font-semibold tracking-tight text-on-surface">Manevi Pusula</span>
        </Link>

        <div className="flex justify-end">
          {onYeniSohbet ? (
            <button type="button" onClick={onYeniSohbet} aria-label="Yeni sohbet" title="Yeni sohbet" className={SIMGE_DUGME}>
              <KalemSimgesi />
            </button>
          ) : (
            <Link href="/?yeni=1" aria-label="Yeni sohbet" title="Yeni sohbet" className={SIMGE_DUGME}>
              <KalemSimgesi />
            </Link>
          )}
        </div>
      </header>
      <VakitSeridi />
    </div>
  );
}
