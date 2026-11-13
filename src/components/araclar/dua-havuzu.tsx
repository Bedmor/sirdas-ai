"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Clock, HandHeart, Trash2 } from "lucide-react";
import { CLIENT_ID_STORAGE_KEY, yeniCihazKimligiUret } from "@/lib/cihaz-temizle";
import { DUA_KONULARI, type DuaKonusu } from "@/lib/dua-havuzu/kurallar";

type Dua = {
  id: string;
  metin: string;
  olusturma: string;
  bitis: string;
  sayac: number;
  dedim: boolean;
  benim: boolean;
};

type Bildirim = { tur: "basari" | "uyari"; mesaj: string };

function cihazKimligi(): string {
  try {
    let k = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (!k) {
      k = yeniCihazKimligiUret();
      window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, k);
    }
    return k;
  } catch {
    return "";
  }
}

function basliklar(): HeadersInit {
  const k = cihazKimligi();
  return k
    ? { "Content-Type": "application/json", "x-sirdas-client-id": k }
    : { "Content-Type": "application/json" };
}

function neZaman(iso: string, simdi: number): string {
  const fark = Math.max(0, simdi - new Date(iso).getTime());
  const dk = Math.floor(fark / 60_000);
  if (dk < 2) return "Az önce";
  if (dk < 60) return `${dk} dakika önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} saat önce`;
  const gun = Math.floor(sa / 24);
  return gun === 1 ? "Dün" : `${gun} gün önce`;
}

function kalanSure(iso: string, simdi: number): string {
  const fark = new Date(iso).getTime() - simdi;
  const sa = Math.max(1, Math.ceil(fark / 3_600_000));
  if (sa < 24) return `${sa} saat sonra listeden kalkacak`;
  return `${Math.ceil(sa / 24)} gün sonra listeden kalkacak`;
}

function DuaMetni({ metin }: { metin: string }) {
  return <p className="break-words text-lg leading-relaxed text-on-surface">{metin}</p>;
}

function Sayac({ sayi }: { sayi: number }) {
  return (
    <p className="text-base text-on-surface-variant">
      {sayi > 0 ? (
        <>
          <span className="font-semibold tabular-nums text-on-surface">{sayi}</span> kişi dua etti
        </>
      ) : (
        "Henüz kimse dua etmedi"
      )}
    </p>
  );
}

export function DuaHavuzu() {
  const [istekler, setIstekler] = useState<Dua[]>([]);
  const [benimkiler, setBenimkiler] = useState<Dua[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yuklemeHatasi, setYuklemeHatasi] = useState<string | null>(null);
  const [gonderilen, setGonderilen] = useState<DuaKonusu | null>(null);
  const [bildirim, setBildirim] = useState<Bildirim | null>(null);
  const [basiliyor, setBasiliyor] = useState<string | null>(null);
  const [simdi, setSimdi] = useState(() => Date.now());
  const bildirimRef = useRef<HTMLDivElement>(null);

  const yukle = useCallback(async () => {
    try {
      const r = await fetch("/api/dua-havuzu", { headers: basliklar(), cache: "no-store" });
      const v = await r.json();
      if (!r.ok) throw new Error(v?.hata || "");
      setIstekler(Array.isArray(v.istekler) ? v.istekler : []);
      setBenimkiler(Array.isArray(v.benimkiler) ? v.benimkiler : []);
      setYuklemeHatasi(null);
    } catch (e) {
      setYuklemeHatasi(
        (e as Error)?.message || "Dua havuzu şu an yüklenemedi. Lütfen biraz sonra yeniden deneyin."
      );
    } finally {
      setYukleniyor(false);
      setSimdi(Date.now());
    }
  }, []);

  useEffect(() => {
    yukle();
  }, [yukle]);

  useEffect(() => {
    if (bildirim) bildirimRef.current?.focus();
  }, [bildirim]);

  /** Bu cihazın listede duran isteklerinin cümleleri (aynı konu yeniden seçilemesin) */
  const birakilanlar = new Set(benimkiler.map((d) => d.metin));

  const birak = async (konu: DuaKonusu) => {
    if (gonderilen) return;
    setGonderilen(konu);
    setBildirim(null);
    try {
      const r = await fetch("/api/dua-havuzu", {
        method: "POST",
        headers: basliklar(),
        body: JSON.stringify({ konu }),
      });
      const v = await r.json().catch(() => ({}));
      if (r.ok && v?.tamam) {
        setBildirim({ tur: "basari", mesaj: "İsteğiniz dua havuzuna eklendi. Rabbim kabul etsin." });
        await yukle();
      } else {
        setBildirim({
          tur: "uyari",
          mesaj: v?.mesaj || v?.hata || "İsteğiniz şu an gönderilemedi. Lütfen biraz sonra yeniden deneyin.",
        });
      }
    } catch {
      setBildirim({ tur: "uyari", mesaj: "Bağlantı kurulamadı. Lütfen internetinizi kontrol edip yeniden deneyin." });
    } finally {
      setGonderilen(null);
    }
  };

  const yardimci = async (id: string) => {
    if (basiliyor) return;
    setBasiliyor(id);
    // Hemen işaretle; sunucu cevabıyla düzelt.
    setIstekler((l) => l.map((d) => (d.id === id && !d.dedim ? { ...d, dedim: true, sayac: d.sayac + 1 } : d)));
    try {
      const r = await fetch("/api/dua-havuzu/destek", {
        method: "POST",
        headers: basliklar(),
        body: JSON.stringify({ id }),
      });
      const v = await r.json().catch(() => ({}));
      if (r.ok && typeof v.sayac === "number") {
        setIstekler((l) => l.map((d) => (d.id === id ? { ...d, dedim: true, sayac: v.sayac } : d)));
      } else if (v?.durum === "bulunamadi") {
        setIstekler((l) => l.filter((d) => d.id !== id));
      } else {
        await yukle();
      }
    } catch {
      await yukle();
    } finally {
      setBasiliyor(null);
    }
  };

  const kaldir = async (id: string) => {
    if (!window.confirm("Bu dua isteğiniz listeden kaldırılsın mı?")) return;
    try {
      await fetch("/api/dua-havuzu", { method: "DELETE", headers: basliklar(), body: JSON.stringify({ id }) });
    } finally {
      await yukle();
    }
  };

  return (
    <div className="space-y-8">
      {/* İstek bırakma */}
      <section
        aria-labelledby="dua-birak-baslik"
        className="rounded-[24px] border border-outline-variant/50 bg-surface-container/85 p-5 sm:p-6 shadow-md space-y-4"
      >
        <h2 id="dua-birak-baslik" className="font-heading text-xl font-semibold text-on-surface">
          Ne için dua istersiniz?
        </h2>
        <p className="text-base text-on-surface-variant">
          Bir seçeneğe dokunun; isteğiniz adınız olmadan listeye eklenir. Kardeşleriniz okuyup sizin için dua eder.
        </p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Dua seçenekleri">
          {DUA_KONULARI.map((k) => {
            const birakildi = birakilanlar.has(k.metin);
            const bekliyor = gonderilen === k.anahtar;
            return (
              <li key={k.anahtar}>
                <button
                  type="button"
                  onClick={() => birak(k.anahtar)}
                  disabled={birakildi || gonderilen !== null}
                  aria-pressed={birakildi}
                  className={`flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2 text-center text-lg font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 ${
                    birakildi
                      ? "cursor-default border-secondary/60 bg-secondary-container text-on-secondary-container"
                      : "border-primary/70 bg-surface-container-high text-on-surface hover:bg-primary/15 disabled:cursor-wait disabled:opacity-70"
                  }`}
                >
                  {birakildi && <CircleCheck aria-hidden="true" className="h-5 w-5 shrink-0" />}
                  <span>{bekliyor ? "Gönderiliyor..." : k.etiket}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="flex gap-2 text-[15px] leading-snug text-on-surface-variant">
          <Clock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
          <span>İstek üç gün sonra listeden kendiliğinden kalkar.</span>
        </p>

        <div ref={bildirimRef} tabIndex={-1} aria-live="polite" className="outline-none">
          {bildirim?.tur === "basari" && (
            <p className="flex gap-2 rounded-2xl border border-secondary/50 bg-secondary-container px-4 py-3 text-base text-on-secondary-container">
              <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{bildirim.mesaj}</span>
            </p>
          )}
          {bildirim?.tur === "uyari" && (
            <p
              role="alert"
              className="flex gap-2 rounded-2xl border-2 border-error/70 bg-error-container px-4 py-3 text-base text-on-error-container"
            >
              <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{bildirim.mesaj}</span>
            </p>
          )}
        </div>
      </section>

      {/* Kendi istekleri */}
      {benimkiler.length > 0 && (
        <section aria-labelledby="benim-baslik" className="space-y-3">
          <h2 id="benim-baslik" className="font-heading text-xl font-semibold text-on-surface">
            Sizin isteğiniz
          </h2>
          <ul className="space-y-3">
            {benimkiler.map((d) => (
              <li
                key={d.id}
                className="rounded-[22px] border-2 border-primary/50 bg-surface-container/85 p-4 sm:p-5 space-y-3"
              >
                <DuaMetni metin={d.metin} />
                <div className="flex items-center gap-2 rounded-2xl bg-surface-container-high px-4 py-3">
                  <HandHeart aria-hidden="true" className="h-7 w-7 shrink-0 text-primary" />
                  <p className="text-lg text-on-surface">
                    {d.sayac > 0 ? (
                      <>
                        <span className="font-semibold tabular-nums">{d.sayac}</span> kişi sizin için
                        &ldquo;Allah yardımcın olsun&rdquo; dedi
                      </>
                    ) : (
                      "Henüz kimse dua etmedi; isteğiniz listede."
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-on-surface-variant">
                  <span>
                    {neZaman(d.olusturma, simdi)}, {kalanSure(d.bitis, simdi)}
                  </span>
                  <button
                    type="button"
                    onClick={() => kaldir(d.id)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-medium text-on-surface-variant underline underline-offset-2 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Kaldır
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Genel liste */}
      <section aria-labelledby="liste-baslik" className="space-y-3">
        <h2 id="liste-baslik" className="font-heading text-xl font-semibold text-on-surface">
          Dua bekleyenler
        </h2>

        {yukleniyor && <p className="text-base text-on-surface-variant">Yükleniyor...</p>}

        {!yukleniyor && yuklemeHatasi && (
          <p role="alert" className="rounded-2xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-base text-on-surface">
            {yuklemeHatasi}
          </p>
        )}

        {!yukleniyor && !yuklemeHatasi && istekler.length === 0 && (
          <p className="rounded-2xl border border-outline-variant/60 bg-surface-container/85 px-4 py-4 text-base text-on-surface-variant">
            Şu an dua bekleyen bir istek yok. İlk isteği siz bırakabilirsiniz.
          </p>
        )}

        <ul className="space-y-3">
          {istekler.map((d) => (
            <li
              key={d.id}
              className="rounded-[22px] border border-outline-variant/50 bg-surface-container/85 p-4 sm:p-5 space-y-3 shadow-sm"
            >
              <DuaMetni metin={d.metin} />
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <Sayac sayi={d.sayac} />
                <span className="text-sm text-on-surface-variant">{neZaman(d.olusturma, simdi)}</span>
              </div>
              <button
                type="button"
                onClick={() => yardimci(d.id)}
                disabled={d.dedim || basiliyor === d.id}
                aria-pressed={d.dedim}
                className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 px-5 text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 ${
                  d.dedim
                    ? "border-secondary/60 bg-secondary-container text-on-secondary-container cursor-default"
                    : "border-primary/70 bg-surface-container-high text-on-surface hover:bg-primary/15"
                }`}
              >
                {d.dedim ? (
                  <CircleCheck aria-hidden="true" className="h-6 w-6 shrink-0" />
                ) : (
                  <HandHeart aria-hidden="true" className="h-6 w-6 shrink-0" />
                )}
                {d.dedim ? "Dua ettiniz" : "Allah yardımcın olsun"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
