"use client";

import React, { useCallback, useState } from "react";
import { UstBar } from "./ust-bar";
import { AltSekmeCubugu } from "./alt-sekme-cubugu";
import { MenuCekmecesi } from "./menu-cekmecesi";
import { MiniOynatici } from "./ses-oynatici";

/**
 * Araç ve alt sayfaların ortak uygulama kabuğu: üst bar (Geri, logo, yeni sohbet) + vakit şeridi,
 * alt sekme çubuğu ve menü çekmecesi. Sayfa içeriği `children` olarak gelir.
 */
export function AracKabugu({
  geriHref,
  ust,
  children,
}: {
  geriHref: string;
  /** Üst barın üstünde duran içerik (yasal uyarı şeridi). */
  ust?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const kapat = useCallback(() => setMenu(false), []);
  return (
    <>
      {ust}
      <div className="sticky top-0 z-40">
        <UstBar sol={{ tur: "geri", yedekHref: geriHref }} />
      </div>
      {children}
      <div className="mp-alt-kabuk pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-2 sm:pb-3">
        <div className="pointer-events-auto mx-auto w-full max-w-[520px] space-y-1.5">
          <MiniOynatici />
          <AltSekmeCubugu onMenu={() => setMenu(true)} menuAcik={menu} />
        </div>
      </div>
      <MenuCekmecesi acik={menu} onKapat={kapat} />
    </>
  );
}
