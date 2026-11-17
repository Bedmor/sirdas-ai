"use client";

import { useEffect, useState } from "react";
import type { Ayet } from "@/lib/kuran";

type Gorunum = "IKISI" | "ARAPCA" | "MEAL";
type Boyut = 0 | 1 | 2;

const ANAHTAR = "mp-kuran-ayar";
const ARAPCA_BOYUT = ["text-2xl sm:text-[1.7rem]", "text-3xl sm:text-[2.1rem]", "text-4xl sm:text-[2.6rem]"];
const MEAL_BOYUT = ["text-[0.95rem]", "text-[1.05rem]", "text-[1.2rem]"];

/** Arapça + meal okuma alanı. Görünüm ve yazı boyu cihazda hatırlanır. */
export function AyetOkuyucu({
  ayetler,
  besmele,
  besmeleAr,
}: {
  ayetler: Ayet[];
  besmele: boolean;
  besmeleAr: string;
}) {
  const [gorunum, setGorunum] = useState<Gorunum>("IKISI");
  const [boyut, setBoyut] = useState<Boyut>(1);

  useEffect(() => {
    try {
      const k = JSON.parse(window.localStorage.getItem(ANAHTAR) || "{}");
      if (k.gorunum === "IKISI" || k.gorunum === "ARAPCA" || k.gorunum === "MEAL") setGorunum(k.gorunum);
      if (k.boyut === 0 || k.boyut === 1 || k.boyut === 2) setBoyut(k.boyut);
    } catch {
      /* varsayılan kalır */
    }
  }, []);

  const kaydet = (g: Gorunum, b: Boyut) => {
    setGorunum(g);
    setBoyut(b);
    try {
      window.localStorage.setItem(ANAHTAR, JSON.stringify({ gorunum: g, boyut: b }));
    } catch {
      /* yalnız bu oturumda geçerli */
    }
  };

  const arapcaVar = gorunum !== "MEAL";
  const mealVar = gorunum !== "ARAPCA";
  const secenek = (aktif: boolean) =>
    `rounded-full px-3 py-1 border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      aktif
        ? "border-primary/70 bg-primary/15 text-primary font-semibold"
        : "border-outline-variant/50 text-on-surface-variant hover:text-primary"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-outline-variant/40 bg-surface/90 px-3 py-2 backdrop-blur-md">
        <div role="radiogroup" aria-label="Görünüm" className="flex gap-1.5">
          {(
            [
              ["IKISI", "Arapça + Meal"],
              ["ARAPCA", "Arapça"],
              ["MEAL", "Meal"],
            ] as const
          ).map(([g, etiket]) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={gorunum === g}
              onClick={() => kaydet(g, boyut)}
              className={secenek(gorunum === g)}
            >
              {etiket}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5" aria-label="Yazı boyu">
          <button
            type="button"
            aria-label="Yazıyı küçült"
            disabled={boyut === 0}
            onClick={() => kaydet(gorunum, (boyut - 1) as Boyut)}
            className={secenek(false) + " disabled:opacity-40"}
          >
            A−
          </button>
          <button
            type="button"
            aria-label="Yazıyı büyüt"
            disabled={boyut === 2}
            onClick={() => kaydet(gorunum, (boyut + 1) as Boyut)}
            className={secenek(false) + " disabled:opacity-40"}
          >
            A+
          </button>
        </div>
      </div>

      {besmele && arapcaVar && (
        <p className={`font-arabic text-center text-primary/90 leading-[2.2] ${ARAPCA_BOYUT[boyut]}`} dir="rtl" lang="ar">
          {besmeleAr}
        </p>
      )}

      <ol className="space-y-3">
        {ayetler.map((a) => (
          <li
            key={a.n}
            id={`ayet-${a.n}`}
            className="scroll-mt-24 rounded-2xl border border-outline-variant/40 bg-surface-container/70 p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-primary/40 px-2 text-xs font-semibold text-primary">
                {a.n}
              </span>
            </div>
            {arapcaVar && (
              <p className={`font-arabic text-right text-on-surface leading-[2.3] ${ARAPCA_BOYUT[boyut]}`} dir="rtl" lang="ar">
                {a.ar}
              </p>
            )}
            {mealVar && (
              <p className={`text-slate-200 leading-relaxed ${MEAL_BOYUT[boyut]}`}>{a.tr}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
