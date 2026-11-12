"use client";

import React, { useEffect, useRef, useState } from "react";
import { aciFarki, kabeyeUzaklikKm, kibleAcisi, yonAdi } from "@/lib/araclar/kible";

type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type IzinliOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const sayi = (n: number, basamak = 1) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: basamak, maximumFractionDigits: basamak });

export function KiblePusulasi() {
  const [konum, setKonum] = useState<{ lat: number; lng: number } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [konumBekliyor, setKonumBekliyor] = useState(false);
  const [yon, setYon] = useState<number | null>(null); // cihazın baktığı yön (kuzeyden derece)
  const [sensorDurumu, setSensorDurumu] = useState<"kapali" | "bekliyor" | "acik" | "yok">("kapali");
  const temizle = useRef<(() => void) | null>(null);

  useEffect(() => () => temizle.current?.(), []);

  const aci = konum ? kibleAcisi(konum.lat, konum.lng) : null;

  const konumAl = () => {
    if (!("geolocation" in navigator)) {
      setHata("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }
    setKonumBekliyor(true);
    setHata(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKonum({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setKonumBekliyor(false);
      },
      () => {
        setKonumBekliyor(false);
        setHata("Konum izni verilmedi veya konum bulunamadı. Kıble açısı için konum gereklidir.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const pusulayiAc = async () => {
    setHata(null);
    const DOE = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as
      | IzinliOrientation
      | undefined;
    if (!DOE) {
      setSensorDurumu("yok");
      return;
    }
    try {
      if (typeof DOE.requestPermission === "function") {
        const izin = await DOE.requestPermission();
        if (izin !== "granted") {
          setHata("Pusula sensörü izni verilmedi. Açıyı aşağıdaki yazıdan takip edebilirsiniz.");
          return;
        }
      }
    } catch {
      setHata("Pusula sensörü izni alınamadı.");
      return;
    }

    temizle.current?.();
    setSensorDurumu("bekliyor");
    let veriGeldi = false;
    let kare = 0;
    let sonYon: number | null = null;

    const isle = (e: DeviceOrientationEvent, mutlak: boolean) => {
      const ios = (e as IOSOrientationEvent).webkitCompassHeading;
      let h: number | null = null;
      if (typeof ios === "number" && !Number.isNaN(ios)) h = ios;
      else if ((mutlak || e.absolute) && typeof e.alpha === "number") h = (360 - e.alpha) % 360;
      if (h === null) return;
      veriGeldi = true;
      sonYon = h;
      if (!kare) {
        kare = window.requestAnimationFrame(() => {
          kare = 0;
          setYon(sonYon);
          setSensorDurumu("acik");
        });
      }
    };
    const mutlakDinle = (e: Event) => isle(e as DeviceOrientationEvent, true);
    const normalDinle = (e: Event) => isle(e as DeviceOrientationEvent, false);
    window.addEventListener("deviceorientationabsolute", mutlakDinle);
    window.addEventListener("deviceorientation", normalDinle);
    const zaman = window.setTimeout(() => {
      if (!veriGeldi) {
        setSensorDurumu("yok");
        temizle.current?.();
      }
    }, 3000);
    temizle.current = () => {
      window.removeEventListener("deviceorientationabsolute", mutlakDinle);
      window.removeEventListener("deviceorientation", normalDinle);
      window.clearTimeout(zaman);
      if (kare) window.cancelAnimationFrame(kare);
    };
  };

  const fark = aci !== null && yon !== null ? aciFarki(aci, yon) : null;
  const hizali = fark !== null && Math.abs(fark) <= 5;
  // Kadran, cihaz yönü biliniyorsa gerçek kuzeye hizalanır.
  const kadranDonus = yon !== null ? -yon : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-outline-variant/50 bg-surface-container/80 p-5 sm:p-8 shadow-md space-y-6">
        {/* Kadran */}
        <div className="relative mx-auto aspect-square w-full max-w-[300px]">
          <div
            className="absolute inset-0 transition-transform duration-150 ease-out"
            style={{ transform: `rotate(${kadranDonus}deg)` }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
              <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-outline-variant/60" />
              {Array.from({ length: 72 }).map((_, i) => {
                const buyuk = i % 18 === 0;
                const orta = i % 6 === 0;
                return (
                  <line
                    key={i}
                    x1="100"
                    y1={buyuk ? 10 : orta ? 13 : 16}
                    x2="100"
                    y2="20"
                    stroke="currentColor"
                    strokeWidth={buyuk ? 2 : 1}
                    className={buyuk ? "text-on-surface" : "text-outline-variant"}
                    transform={`rotate(${i * 5} 100 100)`}
                  />
                );
              })}
              {(
                [
                  ["K", 100, 39],
                  ["D", 166, 105],
                  ["G", 100, 171],
                  ["B", 34, 105],
                ] as const
              ).map(([harf, x, y]) => (
                <text
                  key={harf}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className={`${harf === "K" ? "fill-primary" : "fill-slate-300"} font-heading`}
                  fontSize="14"
                  fontWeight="600"
                >
                  {harf}
                </text>
              ))}
              {aci !== null && (
                <g transform={`rotate(${aci} 100 100)`}>
                  <line x1="100" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-secondary" />
                  <rect x="91" y="44" width="18" height="18" rx="2" className="fill-surface-container-highest stroke-secondary" strokeWidth="1.5" />
                  <rect x="91" y="48" width="18" height="3" className="fill-tertiary" />
                </g>
              )}
              <circle cx="100" cy="100" r="5" className="fill-on-surface" />
            </svg>
          </div>
          {yon !== null && (
            // Telefonun baktığı yön: sabit üst işaret
            <div aria-hidden="true" className="absolute left-1/2 -top-1 -translate-x-1/2 h-0 w-0 border-x-[9px] border-x-transparent border-t-[14px] border-t-primary" />
          )}
        </div>

        {/* Bilgi */}
        <div className="text-center space-y-2" aria-live="polite">
          {aci === null ? (
            <p className="text-sm text-slate-300">Kıble yönünü hesaplamak için konumunuzu paylaşın.</p>
          ) : (
            <>
              <p className="font-heading text-4xl font-semibold tabular-nums text-on-surface">{sayi(aci)}°</p>
              <p className="text-sm text-slate-200">
                Kıble, kuzeyden saat yönünde {sayi(aci)}° · {yonAdi(aci)}
              </p>
              {konum && (
                <p className="text-xs text-on-surface-variant">
                  Kâbe&apos;ye kuş uçuşu yaklaşık {Math.round(kabeyeUzaklikKm(konum.lat, konum.lng)).toLocaleString("tr-TR")} km
                </p>
              )}
              {fark !== null && (
                <p className={`text-sm font-semibold ${hizali ? "text-secondary" : "text-primary"}`}>
                  {hizali
                    ? "Kıble yönündesiniz."
                    : `${sayi(Math.abs(fark), 0)}° ${fark > 0 ? "sağa" : "sola"} dönün.`}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={konumAl}
            disabled={konumBekliyor}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container border border-secondary/30 hover:bg-secondary-container/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <i aria-hidden="true" className="ph ph-map-pin text-sm"></i>
            {konumBekliyor ? "Konum alınıyor…" : konum ? "Konumu yenile" : "Konumumu bul"}
          </button>
          {aci !== null && sensorDurumu !== "acik" && (
            <button
              type="button"
              onClick={pusulayiAc}
              disabled={sensorDurumu === "bekliyor"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <i aria-hidden="true" className="ph ph-compass text-sm"></i>
              {sensorDurumu === "bekliyor" ? "Sensör bekleniyor…" : "Pusulayı aç"}
            </button>
          )}
        </div>

        {sensorDurumu === "yok" && (
          <p className="text-xs text-center text-slate-300">
            Bu cihazda pusula sensörü bulunamadı. Yukarıdaki açıyı bir pusulayla ya da kuzeyi bilerek
            uygulayabilirsiniz: kuzeye dönüp saat yönünde {aci !== null ? `${sayi(aci, 0)}°` : "belirtilen açı kadar"} dönün.
          </p>
        )}
      </div>

      {hata && (
        <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {hata}
        </div>
      )}

      <ul className="text-[11px] text-on-surface-variant leading-relaxed space-y-1 list-disc pl-4">
        <li>Konumunuz yalnızca bu cihazda, açıyı hesaplamak için kullanılır; sunucuya gönderilmez ve kaydedilmez.</li>
        <li>
          Telefon pusulası metal eşyalardan ve elektrikli cihazlardan etkilenebilir. Telefonu yere paralel tutun; gerekirse
          havada 8 çizerek pusulayı ayarlayın.
        </li>
        <li>
          Açı, Kâbe&apos;ye en kısa yol (büyük daire) üzerinden ve coğrafi kuzeye göre hesaplanır. Telefon pusulaları
          çoğunlukla manyetik kuzeye göre çalıştığından gösterge birkaç derece sapabilir.
        </li>
      </ul>
    </div>
  );
}
