"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  VAKITLER,
  bolgeZamani,
  kalanSureMetni,
  kalanSureSaat,
  siradakiVakit,
  type VakitYaniti,
} from "@/lib/araclar/namaz-vakitleri";
import { ILLER, ilBul } from "@/lib/araclar/iller";

type Secenek = { id: string; ad: string };
type Kayit = { il: Secenek; ilce: Secenek };

const ANAHTAR = "manevi-pusula:namaz-vakitleri:secim:v1";
const VARSAYILAN_IL: Secenek = { id: "539", ad: "İstanbul" };
const IL_SECENEKLERI: Secenek[] = ILLER.map((x) => ({ id: x.id, ad: x.ad }));

/** Kaynağa ulaşılamazsa ilçe seçimi il merkezine düşer. */
function yalnizMerkez(il: Secenek): Secenek[] {
  const kayit = ilBul(il.id);
  return kayit ? [{ id: kayit.merkezIlceId, ad: kayit.ad }] : [];
}

function kayitOku(): Kayit | null {
  try {
    const ham = window.localStorage.getItem(ANAHTAR);
    if (!ham) return null;
    const k = JSON.parse(ham) as Kayit;
    const il = ilBul(String(k?.il?.id ?? ""));
    if (il && /^\d+$/.test(k?.ilce?.id)) return { il: { id: il.id, ad: il.ad }, ilce: k.ilce };
  } catch {
    // yok say
  }
  return null;
}

function kayitYaz(k: Kayit) {
  try {
    window.localStorage.setItem(ANAHTAR, JSON.stringify(k));
  } catch {
    // Tarayıcı kaydı kapalı; seçim bu oturumda kalır.
  }
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { hata?: string }).hata || "Vakit bilgisi alınamadı.");
  return j as T;
}

const tarihMetni = (iso: string) => {
  const [y, a, g] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, a - 1, g)));
};

const selectSinifi =
  "w-full min-w-0 appearance-none rounded-2xl border border-outline-variant/60 bg-surface-container px-4 py-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50";

export function NamazVakitleri() {
  const iller = IL_SECENEKLERI;
  const [ilceler, setIlceler] = useState<Secenek[]>([]);
  const [il, setIl] = useState<Secenek | null>(null);
  const [ilce, setIlce] = useState<Secenek | null>(null);
  const [veri, setVeri] = useState<VakitYaniti | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [konumBekliyor, setKonumBekliyor] = useState(false);
  const [simdi, setSimdi] = useState<Date | null>(null);
  /** Vakitler il seçimiyle mi, konumla mı alındı (açıklama notu için). */
  const [mod, setMod] = useState<"il" | "konum">("il");

  // Saat (her saniye)
  useEffect(() => {
    setSimdi(new Date());
    const t = window.setInterval(() => setSimdi(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const vakitleriGetir = useCallback(async (secilenIlce: Secenek, secilenIl: Secenek) => {
    setYukleniyor(true);
    setHata(null);
    try {
      const v = await getJson<VakitYaniti>(
        `/api/namaz-vakitleri?il=${encodeURIComponent(secilenIl.id)}&ilce=${encodeURIComponent(secilenIlce.id)}`
      );
      const yer =
        v.kaynak === "hesap"
          ? `${secilenIl.ad} (il merkezi)`
          : secilenIlce.ad === secilenIl.ad
            ? secilenIl.ad
            : `${secilenIlce.ad}, ${secilenIl.ad}`;
      setVeri({ ...v, yer });
      setMod("il");
      kayitYaz({ il: secilenIl, ilce: secilenIlce });
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Vakit bilgisi alınamadı.");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  const ilceleriGetir = useCallback(
    async (secilenIl: Secenek, tercihIlceId?: string) => {
      setIlceler([]);
      let liste: Secenek[];
      try {
        liste = await getJson<Secenek[]>(`/api/namaz-vakitleri?tip=ilceler&il=${encodeURIComponent(secilenIl.id)}`);
        if (!Array.isArray(liste) || liste.length === 0) liste = yalnizMerkez(secilenIl);
      } catch {
        liste = yalnizMerkez(secilenIl);
      }
      setIlceler(liste);
      const merkez =
        liste.find((x) => x.id === tercihIlceId) ||
        liste.find((x) => x.ad.toLocaleLowerCase("tr-TR") === secilenIl.ad.toLocaleLowerCase("tr-TR")) ||
        liste[0];
      if (merkez) {
        setIlce(merkez);
        vakitleriGetir(merkez, secilenIl);
      }
    },
    [vakitleriGetir]
  );

  // İlk açılış: son seçim (yoksa İstanbul). İl listesi statik.
  useEffect(() => {
    const kayit = kayitOku();
    const baslangicIl = kayit?.il ?? VARSAYILAN_IL;
    setIl(baslangicIl);
    ilceleriGetir(baslangicIl, kayit?.ilce.id);
  }, [ilceleriGetir]);

  const konumlaBul = () => {
    if (!("geolocation" in navigator)) {
      setHata("Tarayıcınız konum özelliğini desteklemiyor. Lütfen il ve ilçe seçin.");
      return;
    }
    setKonumBekliyor(true);
    setHata(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const v = await getJson<VakitYaniti>(
            `/api/namaz-vakitleri?lat=${latitude.toFixed(2)}&lng=${longitude.toFixed(2)}`
          );
          setVeri(v);
          setMod("konum");
        } catch (e) {
          setHata(e instanceof Error ? e.message : "Vakit bilgisi alınamadı.");
        } finally {
          setKonumBekliyor(false);
        }
      },
      () => {
        setKonumBekliyor(false);
        setHata("Konum izni verilmedi veya konum bulunamadı. İl ve ilçe seçerek devam edebilirsiniz.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 }
    );
  };

  const durum = useMemo(() => {
    if (!veri || !simdi) return null;
    const bz = bolgeZamani(simdi, veri.saatDilimi);
    const bugun = veri.gunler.find((g) => g.tarih === bz.tarih) ?? veri.gunler[0];
    return { bugun, siradaki: siradakiVakit(veri.gunler, bz) };
  }, [veri, simdi]);

  return (
    <div className="space-y-6">
      {/* Yer seçimi */}
      <div className="rounded-[28px] border border-outline-variant/50 bg-surface-container/80 p-5 sm:p-6 space-y-4 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1.5 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">İl</span>
            <div className="relative">
              <select
                className={selectSinifi}
                value={il?.id ?? ""}
                onChange={(e) => {
                  const secilen = iller.find((x) => x.id === e.target.value);
                  if (!secilen) return;
                  setIl(secilen);
                  setIlce(null);
                  ilceleriGetir(secilen);
                }}
              >
                {iller.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.ad}
                  </option>
                ))}
              </select>
              <i aria-hidden="true" className="ph ph-caret-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"></i>
            </div>
          </label>
          <label className="space-y-1.5 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">İlçe</span>
            <div className="relative">
              <select
                className={selectSinifi}
                value={ilce?.id ?? ""}
                disabled={ilceler.length === 0}
                onChange={(e) => {
                  const secilen = ilceler.find((x) => x.id === e.target.value);
                  if (!secilen || !il) return;
                  setIlce(secilen);
                  vakitleriGetir(secilen, il);
                }}
              >
                {ilceler.length === 0 && <option value="">Yükleniyor…</option>}
                {ilceler.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.ad}
                  </option>
                ))}
              </select>
              <i aria-hidden="true" className="ph ph-caret-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"></i>
            </div>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={konumlaBul}
            disabled={konumBekliyor}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold border border-secondary/40 bg-secondary-container/20 text-secondary hover:bg-secondary-container/30 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <i aria-hidden="true" className="ph ph-map-pin text-sm"></i>
            {konumBekliyor ? "Konum alınıyor…" : "Konumumu kullan"}
          </button>
          <span className="text-[11px] text-on-surface-variant leading-snug">
            Konumunuz yalnızca vakit hesabı için kullanılır; kaydedilmez.
          </span>
        </div>
      </div>

      {hata && (
        <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {hata}
        </div>
      )}

      {/* Vakitler */}
      <div
        className={`rounded-[28px] border border-outline-variant/50 bg-surface-container/80 p-5 sm:p-6 shadow-md space-y-5 transition-opacity ${
          yukleniyor || konumBekliyor ? "opacity-60" : ""
        }`}
        aria-busy={yukleniyor || konumBekliyor}
      >
        {!veri || !durum ? (
          <p className="text-sm text-slate-300">Vakitler yükleniyor…</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-semibold text-on-surface break-words">{veri.yer}</h2>
                <p className="text-xs text-slate-300">
                  {tarihMetni(durum.bugun.tarih)}
                  {durum.bugun.hicri ? ` · ${durum.bugun.hicri}` : ""}
                </p>
              </div>
            </div>

            {durum.siradaki ? (
              <div className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-4" aria-live="polite">
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                  {durum.siradaki.ad} vaktine kalan
                </p>
                <p className="font-heading text-4xl sm:text-5xl font-semibold tabular-nums text-on-surface mt-1">
                  {kalanSureSaat(durum.siradaki.kalanSaniye)}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {durum.siradaki.ad} {durum.siradaki.saat} · yaklaşık {kalanSureMetni(durum.siradaki.kalanSaniye)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-300">Sıradaki vakit için yarının verisi henüz yok.</p>
            )}

            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VAKITLER.map((v) => {
                const aktif = durum.siradaki?.mevcut === v.anahtar;
                return (
                  <li
                    key={v.anahtar}
                    className={`rounded-2xl border px-4 py-3 ${
                      aktif
                        ? "border-secondary/60 bg-secondary-container/25"
                        : "border-outline-variant/40 bg-surface-container-high/60"
                    }`}
                  >
                    <span className={`block text-xs ${aktif ? "text-secondary font-semibold" : "text-on-surface-variant"}`}>
                      {v.ad}
                      {aktif ? " · şu an" : ""}
                    </span>
                    <span className="block font-heading text-2xl font-semibold tabular-nums text-on-surface">
                      {durum.bugun[v.anahtar]}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Kaynak: {veri.kaynakAdi}.
              {veri.kaynak === "hesap"
                ? mod === "konum"
                  ? " Konuma göre hesaplanan vakitler, Diyanet tablosundan ±1 dakika farklı olabilir. En kesin sonuç için il ve ilçe seçin."
                  : " Diyanet tablosuna şu an ulaşılamadığı için vakitler il merkezine göre hesaplandı; Diyanet tablosundan ±1 dakika farklı olabilir ve ilçe seçimi il merkezi olarak kabul edilir."
                : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
