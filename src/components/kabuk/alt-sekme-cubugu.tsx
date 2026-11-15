"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Alt 4'lü sekme çubuğu: Sohbet, Araçlar, Hutbe, Menü.
 * Sayfa geçişleri istemci tarafında (next/link) olur; böylece arkada çalan hutbe kesilmez.
 */

type Sekme = "sohbet" | "araclar" | "hutbe";

export function etkinSekme(yol: string | null): Sekme | null {
  if (!yol) return null;
  if (yol === "/") return "sohbet";
  if (yol.startsWith("/araclar/cuma-hutbesi")) return "hutbe";
  if (yol.startsWith("/araclar")) return "araclar";
  return null;
}

const SEKME =
  "group flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-[18px] text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95";

function Simge({ ad }: { ad: Sekme | "menu" }) {
  const ortak = { "aria-hidden": true, className: "h-[22px] w-[22px]", fill: "none", stroke: "currentColor", strokeWidth: 1.9, viewBox: "0 0 24 24" } as const;
  if (ad === "sohbet")
    return (
      <svg {...ortak}>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
      </svg>
    );
  if (ad === "araclar")
    return (
      <svg {...ortak}>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" strokeLinejoin="round" />
      </svg>
    );
  if (ad === "hutbe")
    return (
      <svg {...ortak}>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" strokeLinecap="round" />
        <rect x="3" y="14" width="4.5" height="6" rx="1.6" />
        <rect x="16.5" y="14" width="4.5" height="6" rx="1.6" />
      </svg>
    );
  return (
    <svg {...ortak}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function AltSekmeCubugu({
  onMenu,
  menuAcik = false,
  className = "",
}: {
  onMenu: () => void;
  menuAcik?: boolean;
  className?: string;
}) {
  const yol = usePathname();
  const etkin = menuAcik ? null : etkinSekme(yol);
  const renk = (e: boolean) =>
    e ? "bg-secondary-container/70 text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest";

  const ogeler: { ad: Sekme; etiket: string; href: string }[] = [
    { ad: "sohbet", etiket: "Sohbet", href: "/" },
    { ad: "araclar", etiket: "Araçlar", href: "/araclar" },
    { ad: "hutbe", etiket: "Hutbe", href: "/araclar/cuma-hutbesi" },
  ];

  return (
    <nav aria-label="Ana sekmeler" className={`mp-alt-cubuk ${className}`}>
      <ul className="grid grid-cols-4 gap-1 rounded-[24px] border border-outline-variant/50 bg-surface-container-high/95 p-1 shadow-m3-2 backdrop-blur-md">
        {ogeler.map((o) => {
          const e = etkin === o.ad;
          return (
            <li key={o.ad}>
              <Link href={o.href} aria-current={e ? "page" : undefined} className={`${SEKME} ${renk(e)}`}>
                <Simge ad={o.ad} />
                <span>{o.etiket}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={onMenu} aria-expanded={menuAcik} className={`${SEKME} ${renk(menuAcik)}`}>
            <Simge ad="menu" />
            <span>Menü</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
