"use client";

import React, { useState } from "react";

/**
 * "Bu uyarı yersiz miydi?": güvenlik veya çıkış süzgeci devreye girmiş
 * cevapların altında küçük, sade bir metin bağlantısı. "Faydalı oldu / Olmadı"
 * düğmelerinden ayrı dursun diye düğme değil, alt çizgili küçük yazıdır.
 * Basınca yalnız evet bilgisi ve kural kodu gönderilir; içerik gönderilmez.
 */
export function YersizUyariBaglantisi({
  bildirildi,
  onBildir,
}: {
  bildirildi?: boolean;
  onBildir: () => Promise<boolean>;
}) {
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState(false);

  if (bildirildi) {
    return (
      <p className="text-[12px] text-on-surface-variant/80" aria-live="polite" lang="tr">
        Teşekkürler, not aldık.
      </p>
    );
  }

  return (
    <div className="text-[12px] text-on-surface-variant/80" aria-live="polite" lang="tr">
      <button
        type="button"
        disabled={gonderiliyor}
        onClick={async () => {
          setGonderiliyor(true);
          setHata(false);
          const tamam = await onBildir();
          if (!tamam) setHata(true);
          setGonderiliyor(false);
        }}
        className="min-h-8 underline underline-offset-4 decoration-outline-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded disabled:opacity-60 cursor-pointer"
      >
        {gonderiliyor ? "Gönderiliyor..." : "Bu uyarı yersiz miydi?"}
      </button>
      {hata && <span className="ml-2">Şu an iletilemedi, biraz sonra tekrar deneyin.</span>}
    </div>
  );
}
