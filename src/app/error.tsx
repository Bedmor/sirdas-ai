"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Sayfada beklenmeyen bir hata olursa boş beyaz sayfa yerine bu görünür.
 * Sık sebep: tarayıcı eklentileri (reklam engelleyici, çeviri, karanlık mod vb.).
 */
export default function Hata({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Sayfa hatası:", error);
  }, [error]);
  return <HataKutusu onTekrar={reset} />;
}

function HataKutusu({ onTekrar }: { onTekrar: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-5 py-10 text-on-surface">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-outline-variant/50 bg-surface-container/90 p-6 text-center shadow-lg">
        <h1 className="font-heading text-2xl font-semibold">Sayfa açılırken bir sorun oldu</h1>
        <p className="text-sm leading-relaxed text-slate-300">
          Çoğu zaman sebep tarayıcıdaki bir eklentidir (reklam engelleyici, çeviri, karanlık mod gibi).
        </p>
        <ul className="space-y-2 text-left text-sm text-slate-300">
          <li>1. Aşağıdaki &quot;Tekrar dene&quot; düğmesine basın.</li>
          <li>2. Olmazsa eklentileri bu site için kapatın ya da gizli sekmede açın.</li>
          <li>3. Yine olmazsa başka bir tarayıcı (Chrome, Safari, Edge) deneyin.</li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onTekrar}
            className="rounded-full bg-primary px-5 py-2.5 font-semibold text-on-primary"
          >
            Tekrar dene
          </button>
          <Link href="/" className="rounded-full border border-outline-variant/60 px-5 py-2.5 text-on-surface-variant">
            Ana sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
