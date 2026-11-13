"use client";

/**
 * "Hafızam" ekranı (P4): emanetleri listele, ekle, düzelt, tek tek sil;
 * "hafızayı kapat" anahtarı; son hal notunu ve açılmayacak konuları göster.
 * Veriler yalnızca bu cihazda tutulur. Tarayıcı alert/confirm kullanılmaz;
 * silme onayı satırın içinde iki adımla alınır. Büyük dokunma alanları (en az 56px).
 */
import React, { useEffect, useRef, useState } from "react";
import {
  EMANET_EN_FAZLA,
  EMANET_EN_UZUN,
  EMANET_TURU_ETIKET,
  HAL_KONU_ETIKET,
  emanetDuzelt,
  emanetEkle,
  emanetSil,
  hafizaAcKapat,
  hafizayiTemizle,
  type EmanetTuru,
  type HafizaDurumu,
  type HalKonusu,
} from "@/lib/hafiza";

const TURLER: EmanetTuru[] = ["HITAP", "KONU", "ZIKIR", "NOT"];

const ORNEKLER: Record<EmanetTuru, string> = {
  HITAP: "Örnek: Ahmet abi",
  KONU: "Örnek: Dükkânın geçimi",
  ZIKIR: "Örnek: Hasbunallahu ve nimel vekil",
  NOT: "Örnek: Sabah namazına kalkmak istiyorum",
};

const BUYUK_DUGME =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-[20px] px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer";

function gunFarki(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

function neZaman(iso: string): string {
  const g = gunFarki(iso);
  if (g === 0) return "bugün";
  if (g === 1) return "dün";
  return `${g} gün önce`;
}

export interface HafizamPaneliProps {
  acik: boolean;
  durum: HafizaDurumu;
  onDegistir: (yeni: HafizaDurumu) => void;
  onKapat: () => void;
}

export function HafizamPaneli({ acik, durum, onDegistir, onKapat }: HafizamPaneliProps) {
  const [tur, setTur] = useState<EmanetTuru>("HITAP");
  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  // Ekleme ve düzeltme bildirimi, düğmenin hemen yanında gösterilir (yaşlı kullanıcı yerini kaybetmesin)
  const [formMesaj, setFormMesaj] = useState<{ hata: boolean; metin: string } | null>(null);
  const [satirHata, setSatirHata] = useState<string | null>(null);
  const [duzeltilen, setDuzeltilen] = useState<string | null>(null);
  const [duzeltMetni, setDuzeltMetni] = useState("");
  const [silinecek, setSilinecek] = useState<string | null>(null);
  const [hepsiniSilOnay, setHepsiniSilOnay] = useState(false);
  const kapatRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!acik) return;
    setHata(null);
    setBilgi(null);
    setFormMesaj(null);
    setSatirHata(null);
    setSilinecek(null);
    setDuzeltilen(null);
    setHepsiniSilOnay(false);
    const zaman = setTimeout(() => kapatRef.current?.focus(), 30);
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
    };
    window.addEventListener("keydown", tus);
    return () => {
      clearTimeout(zaman);
      window.removeEventListener("keydown", tus);
    };
  }, [acik, onKapat]);

  if (!acik) return null;

  const bildir = (m: string) => {
    setHata(null);
    setBilgi(m);
  };

  const ekle = () => {
    const r = emanetEkle(durum, tur, metin);
    if (r.hata) {
      setFormMesaj({ hata: true, metin: r.hata });
      return;
    }
    onDegistir(r.durum);
    setMetin("");
    setFormMesaj({ hata: false, metin: "Emanet kaydedildi. Yukarıdaki listede görebilirsiniz." });
  };

  const duzeltKaydet = (id: string) => {
    const r = emanetDuzelt(durum, id, duzeltMetni);
    if (r.hata) {
      setSatirHata(r.hata);
      return;
    }
    onDegistir(r.durum);
    setSatirHata(null);
    setDuzeltilen(null);
    bildir("Emanet düzeltildi.");
  };

  const sil = (id: string) => {
    onDegistir(emanetSil(durum, id));
    setSilinecek(null);
    bildir("Emanet silindi.");
  };

  const halSil = () => {
    onDegistir({ ...durum, sonHal: null });
    bildir("Son konuşulan konu unutuldu.");
  };

  const acilmayacakGeriAl = (k: HalKonusu) => {
    onDegistir({ ...durum, acilmayacak: durum.acilmayacak.filter((x) => x !== k) });
    bildir("Bu konu yeniden hatırlanabilir.");
  };

  const hal = durum.sonHal;
  const halGorunur = durum.acik && hal && !hal.kriz && hal.konu;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" onClick={onKapat} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="hafizam-baslik"
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-outline-variant/60 bg-surface-container-high text-on-surface shadow-m3-5 sm:rounded-[32px]"
      >
        {/* Başlık */}
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/40 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <h2 id="hafizam-baslik" className="font-heading text-2xl font-semibold text-on-surface">
              Benim eklediklerim
            </h2>
            <p className="mt-1 text-base leading-relaxed text-on-surface-variant">
              Yalnızca bu cihazda durur.
            </p>
          </div>
          <button
            ref={kapatRef}
            type="button"
            onClick={onKapat}
            aria-label="Hafızam ekranını kapat"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Hafıza anahtarı */}
          <div className="flex items-center justify-between gap-4 rounded-[24px] border border-outline-variant/50 bg-surface-container p-4">
            <div className="min-w-0">
              <div id="hafiza-anahtar-etiket" className="text-lg font-semibold text-on-surface">
                Hafıza {durum.acik ? "açık" : "kapalı"}
              </div>
              <p className="mt-1 text-base leading-relaxed text-on-surface-variant">
                {durum.acik
                  ? "Emanetleriniz ve son konuştuğunuz konu hatırlanır."
                  : "Hiçbir şey hatırlanmaz. Emanetleriniz silinmez, sadece kullanılmaz."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={durum.acik}
              aria-labelledby="hafiza-anahtar-etiket"
              onClick={() => {
                const yeni = hafizaAcKapat(durum, !durum.acik);
                onDegistir(yeni);
                bildir(yeni.acik ? "Hafıza açıldı." : "Hafıza kapatıldı. Bundan sonra hiçbir şey hatırlanmaz.");
              }}
              className={`relative inline-flex h-10 w-[72px] shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer ${
                durum.acik ? "border-primary bg-primary" : "border-outline bg-surface-container-highest"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-7 w-7 rounded-full shadow transition-transform ${
                  durum.acik ? "translate-x-[34px] bg-on-primary" : "translate-x-1 bg-outline"
                }`}
              />
            </button>
          </div>

          {/* Durum ve hata bildirimi */}
          <div aria-live="polite" className="empty:hidden">
            {hata && (
              <p className="rounded-[20px] border border-error/40 bg-error-container px-4 py-3 text-base leading-relaxed text-on-error-container">
                {hata}
              </p>
            )}
            {!hata && bilgi && (
              <p className="rounded-[20px] border border-primary/40 bg-surface-container px-4 py-3 text-base leading-relaxed text-on-surface">
                {bilgi}
              </p>
            )}
          </div>

          {/* Emanet listesi */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-on-surface">Emanetlerim</h3>
              <span className="text-base text-on-surface-variant">
                {durum.emanetler.length} / {EMANET_EN_FAZLA}
              </span>
            </div>

            {!durum.acik && durum.emanetler.length > 0 && (
              <p className="text-base leading-relaxed text-on-surface-variant">
                Hafıza kapalıyken bu emanetler kullanılmaz.
              </p>
            )}
            {durum.emanetler.length === 0 ? (
              <p className="rounded-[20px] border border-dashed border-outline-variant bg-surface-container px-4 py-4 text-base leading-relaxed text-on-surface-variant">
                Henüz emanet yok. Aşağıdan size nasıl hitap edilmesini istediğinizi veya sevdiğiniz bir zikri ekleyebilirsiniz.
              </p>
            ) : (
              <ul className="space-y-3">
                {durum.emanetler.map((e) => (
                  <li key={e.id} className="rounded-[20px] border border-outline-variant/50 bg-surface-container p-4">
                    <div className="text-sm font-semibold text-primary">{EMANET_TURU_ETIKET[e.tur]}</div>
                    {duzeltilen === e.id ? (
                      <div className="mt-2 space-y-3">
                        <label className="sr-only" htmlFor={`duzelt-${e.id}`}>
                          Emaneti düzelt
                        </label>
                        <input
                          id={`duzelt-${e.id}`}
                          value={duzeltMetni}
                          maxLength={EMANET_EN_UZUN}
                          onChange={(ev) => setDuzeltMetni(ev.target.value)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter") duzeltKaydet(e.id);
                          }}
                          className="min-h-14 w-full rounded-[16px] border border-outline bg-surface px-4 text-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {satirHata && (
                          <p role="alert" className="rounded-[16px] border border-error/40 bg-error-container px-4 py-3 text-base leading-relaxed text-on-error-container">
                            {satirHata}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => duzeltKaydet(e.id)} className={`${BUYUK_DUGME} bg-primary text-on-primary`}>
                            Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSatirHata(null);
                              setDuzeltilen(null);
                            }}
                            className={`${BUYUK_DUGME} border border-outline-variant bg-surface-container-high text-on-surface`}
                          >
                            Vazgeç
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-1 break-words text-lg leading-relaxed text-on-surface">{e.metin}</p>
                        {silinecek === e.id ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-base font-medium text-on-surface">Bu emanet silinsin mi?</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => sil(e.id)}
                                className={`${BUYUK_DUGME} bg-error text-on-error`}
                              >
                                Evet, sil
                              </button>
                              <button
                                type="button"
                                onClick={() => setSilinecek(null)}
                                className={`${BUYUK_DUGME} border border-outline-variant bg-surface-container-high text-on-surface`}
                              >
                                Vazgeç
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSilinecek(null);
                                setSatirHata(null);
                                setDuzeltilen(e.id);
                                setDuzeltMetni(e.metin);
                              }}
                              aria-label={`Düzelt: ${e.metin}`}
                              className={`${BUYUK_DUGME} border border-outline-variant bg-surface-container-high text-on-surface`}
                            >
                              Düzelt
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDuzeltilen(null);
                                setSilinecek(e.id);
                              }}
                              aria-label={`Sil: ${e.metin}`}
                              className={`${BUYUK_DUGME} border border-error/50 bg-surface-container-high text-error`}
                            >
                              Sil
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Yeni emanet */}
          {durum.acik && (
            <div className="space-y-3 rounded-[24px] border border-outline-variant/50 bg-surface-container p-4">
              <h3 className="text-lg font-semibold text-on-surface">Yeni emanet ekle</h3>
              <div role="radiogroup" aria-label="Emanet türü" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TURLER.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={tur === t}
                    onClick={() => setTur(t)}
                    className={`flex min-h-14 items-center rounded-[16px] border px-4 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                      tur === t
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant bg-surface-container-high text-on-surface"
                    }`}
                  >
                    {EMANET_TURU_ETIKET[t]}
                  </button>
                ))}
              </div>
              <label htmlFor="yeni-emanet" className="block text-base font-medium text-on-surface">
                Ne hatırlansın?
              </label>
              <input
                id="yeni-emanet"
                value={metin}
                maxLength={EMANET_EN_UZUN}
                placeholder={ORNEKLER[tur]}
                onChange={(ev) => {
                  setMetin(ev.target.value);
                  if (formMesaj) setFormMesaj(null);
                }}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") ekle();
                }}
                className="min-h-14 w-full rounded-[16px] border border-outline bg-surface px-4 text-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-base leading-relaxed text-on-surface-variant">
                Hastalık, kimlik numarası, telefon ve adres gibi bilgiler emanete yazılmaz.
              </p>
              {formMesaj && (
                <p
                  role={formMesaj.hata ? "alert" : "status"}
                  className={`rounded-[16px] border px-4 py-3 text-base leading-relaxed ${
                    formMesaj.hata
                      ? "border-error/40 bg-error-container text-on-error-container"
                      : "border-primary/40 bg-surface-container-high text-on-surface"
                  }`}
                >
                  {formMesaj.metin}
                </p>
              )}
              <button type="button" onClick={ekle} className={`${BUYUK_DUGME} w-full bg-primary text-on-primary`}>
                Emanet et
              </button>
            </div>
          )}

          {/* Son konuşulan konu ve açılmayacak konular */}
          {(halGorunur || durum.acilmayacak.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-on-surface">Son konuştuklarımız</h3>
              {halGorunur && hal?.konu && (
                <div className="rounded-[20px] border border-outline-variant/50 bg-surface-container p-4">
                  <p className="text-lg leading-relaxed text-on-surface">
                    {neZaman(hal.tarih)}: {HAL_KONU_ETIKET[hal.konu]}
                  </p>
                  <p className="mt-1 text-base leading-relaxed text-on-surface-variant">
                    Birkaç gün sonra döndüğünüzde bir kez hâlinizi sorabilirim.
                  </p>
                  <button
                    type="button"
                    onClick={halSil}
                    className={`${BUYUK_DUGME} mt-3 border border-outline-variant bg-surface-container-high text-on-surface`}
                  >
                    Bunu unut
                  </button>
                </div>
              )}
              {durum.acilmayacak.map((k) => (
                <div key={k} className="rounded-[20px] border border-outline-variant/50 bg-surface-container p-4">
                  <p className="text-lg leading-relaxed text-on-surface">Açılmayacak konu: {HAL_KONU_ETIKET[k]}</p>
                  <button
                    type="button"
                    onClick={() => acilmayacakGeriAl(k)}
                    className={`${BUYUK_DUGME} mt-3 border border-outline-variant bg-surface-container-high text-on-surface`}
                  >
                    Yeniden hatırlanabilir
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hepsini sil */}
          {(durum.emanetler.length > 0 || durum.sonHal || durum.acilmayacak.length > 0) && (
            <div className="border-t border-outline-variant/40 pt-4">
              {hepsiniSilOnay ? (
                <div className="space-y-2">
                  <p className="text-base font-medium text-on-surface">Bütün emanetler ve hatırlanan konular silinsin mi?</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDegistir(hafizayiTemizle(durum));
                        setHepsiniSilOnay(false);
                        bildir("Hafızanız temizlendi.");
                      }}
                      className={`${BUYUK_DUGME} bg-error text-on-error`}
                    >
                      Evet, hepsini sil
                    </button>
                    <button
                      type="button"
                      onClick={() => setHepsiniSilOnay(false)}
                      className={`${BUYUK_DUGME} border border-outline-variant bg-surface-container-high text-on-surface`}
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setHepsiniSilOnay(true)}
                  className={`${BUYUK_DUGME} w-full border border-error/50 bg-surface-container text-error`}
                >
                  Hafızamı tamamen sil
                </button>
              )}
            </div>
          )}

          <p className="text-base leading-relaxed text-on-surface-variant">
            Kriz anlarında konuştuklarınız hiçbir zaman hatırlatılmaz. Sohbette &ldquo;bunu açma&rdquo; derseniz o konu bir daha açılmaz.
          </p>
        </div>
      </section>
    </div>
  );
}
