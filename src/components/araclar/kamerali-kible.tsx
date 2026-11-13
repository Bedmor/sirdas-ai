"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { aciFarki, gercekYon } from "@/lib/araclar/kible";
import { usePusulaSensoru } from "./pusula-sensoru";

/**
 * Kameralı kıble: arka kamera görüntüsünün üstünde kıble oku.
 * Ağır kütüphane yok; getUserMedia + yön sensörü + tek SVG ok.
 */

type Asama = "hazir" | "aciliyor" | "acik" | "hata";

const sayi = (n: number) => Math.round(n).toLocaleString("tr-TR");

function masaustuMu(): boolean {
  if (typeof window === "undefined") return false;
  const dokunmatik = "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
  return !dokunmatik;
}

export function KameraliKible({
  kibleAcisi,
  sapma,
  onKapat,
}: {
  /** Coğrafi kuzeye göre kıble açısı */
  kibleAcisi: number;
  /** Manyetik sapma (doğu +); bilinmiyorsa null */
  sapma: number | null;
  onKapat: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const akisRef = useRef<MediaStream | null>(null);
  const kapatRef = useRef<HTMLButtonElement | null>(null);
  const [asama, setAsama] = useState<Asama>("hazir");
  const [hata, setHata] = useState<string | null>(null);
  const [masaustu, setMasaustu] = useState(false);
  const [hazirMi, setHazirMi] = useState(false);
  const pusula = usePusulaSensoru("kamera");
  const sensoruDurdur = pusula.durdur;

  const kamerayiKapat = useCallback(() => {
    akisRef.current?.getTracks().forEach((t) => t.stop());
    akisRef.current = null;
  }, []);

  const kapat = useCallback(() => {
    kamerayiKapat();
    sensoruDurdur();
    onKapat();
  }, [kamerayiKapat, onKapat, sensoruDurdur]);

  useEffect(() => {
    setMasaustu(masaustuMu());
    setHazirMi(true);
  }, []);

  useEffect(() => {
    if (!hazirMi) return;
    kapatRef.current?.focus();
    // Arka sayfa kaymasın
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = onceki;
    };
  }, [hazirMi]);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [kapat]);

  useEffect(() => kamerayiKapat, [kamerayiKapat]);

  const baslat = async () => {
    setHata(null);
    setAsama("aciliyor");
    // iOS: yön izni dokunuştan hemen sonra istenmeli, kamera izninden önce.
    const sensorVar = await pusula.baslat();

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setAsama("hata");
      setHata("Kamera yalnızca güvenli (https) bağlantıda açılabilir.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setAsama("hata");
      setHata("Bu tarayıcı kamerayı açamıyor. Telefonunuzda Chrome veya Safari ile deneyin.");
      return;
    }
    try {
      const akis = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      akisRef.current = akis;
      if (videoRef.current) {
        videoRef.current.srcObject = akis;
        await videoRef.current.play().catch(() => undefined);
      }
      setAsama("acik");
      if (!sensorVar) {
        setHata("Yön sensörüne ulaşılamadı; ok gösterilemiyor. Kamerasız pusuladaki açıyı kullanabilirsiniz.");
      }
    } catch (e) {
      const ad = (e as { name?: string })?.name;
      setAsama("hata");
      if (ad === "NotAllowedError" || ad === "SecurityError") {
        setHata(
          "Kamera izni verilmedi. Tarayıcı ayarlarından bu siteye kamera izni verip yeniden deneyin. Kamerasız pusula da kullanılabilir."
        );
      } else if (ad === "NotFoundError" || ad === "OverconstrainedError") {
        setHata("Bu cihazda kamera bulunamadı. Kamerasız pusulayı kullanabilirsiniz.");
      } else if (ad === "NotReadableError") {
        setHata("Kamera başka bir uygulama tarafından kullanılıyor olabilir. O uygulamayı kapatıp yeniden deneyin.");
      } else {
        setHata("Kamera açılamadı. Kamerasız pusulayı kullanabilirsiniz.");
      }
    }
  };

  const yon = pusula.yon !== null ? gercekYon(pusula.yon, sapma) : null;
  const fark = yon !== null && !pusula.belirsiz ? aciFarki(kibleAcisi, yon) : null;
  const hizali = fark !== null && Math.abs(fark) <= 5;
  const kabeGorunur = fark !== null && Math.abs(fark) <= 35;

  if (!hazirMi) return null;

  // Sayfadaki dönüşümlü (transform) kapsayıcılardan etkilenmemek için body'ye taşınır.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kameralı kıble"
      className="fixed inset-0 z-[80] flex flex-col bg-black text-white"
      lang="tr"
    >
      {/* Kamera görüntüsü */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover ${asama === "acik" ? "opacity-100" : "opacity-0"}`}
      />

      {/* Üst şerit */}
      <div className="relative z-10 flex items-center justify-between gap-3 bg-black/60 px-4 py-3">
        <p className="text-base font-semibold">Kameralı kıble</p>
        <button
          ref={kapatRef}
          type="button"
          onClick={kapat}
          className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-black/50 px-5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Kapat
        </button>
      </div>

      {/* Orta alan */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        {asama !== "acik" && (
          <div className="max-w-sm space-y-4 rounded-3xl bg-black/70 p-6">
            {masaustu ? (
              <p className="text-base leading-relaxed">
                Kameralı kıble telefon veya tablette çalışır. Bilgisayarda yön sensörü olmadığı için ok gösterilemez.
                Kıble açısını önceki ekrandaki yazıdan takip edebilirsiniz.
              </p>
            ) : asama === "hata" ? (
              <p role="alert" className="text-base leading-relaxed">
                {hata}
              </p>
            ) : (
              <>
                <p className="text-base leading-relaxed">
                  Telefonu göğüs hizasında dik tutun. Ekrandaki ok kıbleyi gösterecek; ok tam yukarı bakınca kıble
                  karşınızdadır.
                </p>
                <p className="text-sm text-white/80">
                  Kamera ve pusula izni istenecek. Görüntü kaydedilmez, hiçbir yere gönderilmez.
                </p>
              </>
            )}
            {!masaustu && asama !== "hata" && (
              <button
                type="button"
                onClick={baslat}
                disabled={asama === "aciliyor"}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#d97706] px-6 text-lg font-semibold text-[#080c0a] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {asama === "aciliyor" ? "Açılıyor…" : "Kamerayı başlat"}
              </button>
            )}
            {asama === "hata" && (
              <button
                type="button"
                onClick={() => {
                  setAsama("hazir");
                  setHata(null);
                }}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/50 px-6 text-base font-semibold"
              >
                Yeniden dene
              </button>
            )}
          </div>
        )}

        {asama === "acik" && (
          <>
            {kabeGorunur && (
              <div
                aria-hidden="true"
                className="absolute top-[22%] -translate-x-1/2 transition-[left] duration-150 ease-out"
                style={{ left: `${50 + ((fark as number) / 35) * 42}%` }}
              >
                <svg viewBox="0 0 40 44" className="h-14 w-14 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  <rect x="4" y="8" width="32" height="32" rx="2" fill="#111" stroke="#fbbf24" strokeWidth="2" />
                  <rect x="4" y="14" width="32" height="4" fill="#fbbf24" />
                </svg>
              </div>
            )}
            <div
              aria-hidden="true"
              className={`flex h-56 w-56 items-center justify-center rounded-full border-4 ${
                hizali ? "border-[#34d399] bg-[#34d399]/15" : "border-white/70 bg-black/25"
              }`}
            >
              {fark !== null && (
                <svg
                  viewBox="0 0 100 100"
                  className="h-40 w-40 transition-transform duration-150 ease-out drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  style={{ transform: `rotate(${fark}deg)` }}
                >
                  <path d="M50 6 L78 46 H60 V92 H40 V46 H22 Z" fill={hizali ? "#34d399" : "#fbbf24"} stroke="#000" strokeWidth="3" />
                </svg>
              )}
            </div>
          </>
        )}
      </div>

      {/* Alt yazı */}
      {asama === "acik" && (
        <div className="relative z-10 space-y-1 bg-black/70 px-4 py-4 text-center" aria-live="polite">
          {pusula.durum === "bekliyor" ? (
            <p className="text-lg">Yön sensörü bekleniyor…</p>
          ) : pusula.durum !== "acik" ? (
            <p className="text-base">{hata ?? "Yön sensörü bulunamadı; ok gösterilemiyor."}</p>
          ) : pusula.belirsiz || fark === null ? (
            <p className="text-lg">Telefonu dik tutun; kamera karşıya baksın.</p>
          ) : hizali ? (
            <p className="text-xl font-semibold text-[#34d399]">Kıble karşınızda.</p>
          ) : (
            <p className="text-xl font-semibold">
              {sayi(Math.abs(fark))}° {fark > 0 ? "sağa" : "sola"} dönün
            </p>
          )}
          {pusula.kalibrasyonGerekli && (
            <p className="text-sm text-[#fbbf24]">Pusula ayarsız görünüyor. Telefonu havada birkaç kez 8 çizerek döndürün.</p>
          )}
          <p className="text-xs text-white/70">
            Metal eşyalar ve elektrikli cihazlar pusulayı şaşırtabilir.
            {sapma === null ? " Türkiye dışında manyetik sapma düzeltilemiyor; birkaç derece fark olabilir." : ""}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}
