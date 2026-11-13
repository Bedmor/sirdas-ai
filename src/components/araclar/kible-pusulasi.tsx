"use client";

import React, { useState } from "react";
import { aciFarki, gercekYon, kabeyeUzaklikKm, kibleAcisi, manyetikKibleAcisi, yonAdi } from "@/lib/araclar/kible";
import { manyetikSapma } from "@/lib/araclar/manyetik-sapma";
import { usePusulaSensoru } from "./pusula-sensoru";
import { KameraliKible } from "./kamerali-kible";

const sayi = (n: number, basamak = 1) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: basamak, maximumFractionDigits: basamak });

const isaretli = (n: number) => `${n >= 0 ? "+" : "-"}${sayi(Math.abs(n))}`;

export function KiblePusulasi() {
  const [konum, setKonum] = useState<{ lat: number; lng: number } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [konumBekliyor, setKonumBekliyor] = useState(false);
  const [kameraAcik, setKameraAcik] = useState(false);
  const pusula = usePusulaSensoru("duz");
  const sensorDurumu = pusula.durum;

  const aci = konum ? kibleAcisi(konum.lat, konum.lng) : null;
  const sapma = konum ? manyetikSapma(konum.lat, konum.lng) : null;
  const pusulaAcisi = aci !== null && sapma !== null ? manyetikKibleAcisi(aci, sapma) : null;
  // Telefon pusulası manyetik kuzeyi verir; gerçek kuzeye çevrilerek kıbleyle kıyaslanır.
  const yon = pusula.yon !== null ? gercekYon(pusula.yon, sapma) : null;

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
    await pusula.baslat();
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
              {pusulaAcisi !== null ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pusulada okunacak açı</p>
                  <p className="font-heading text-4xl font-semibold tabular-nums text-on-surface">{sayi(pusulaAcisi, 0)}°</p>
                  <p className="text-sm text-slate-200">
                    Coğrafi kuzeye göre {sayi(aci)}° · {yonAdi(aci)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Bu bölgede manyetik sapma {isaretli(sapma as number)}° (doğu). Diyanet&apos;in yazdığı kıble açısı da
                    pusulaya göredir.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-heading text-4xl font-semibold tabular-nums text-on-surface">{sayi(aci)}°</p>
                  <p className="text-sm text-slate-200">
                    Kıble, coğrafi kuzeyden saat yönünde {sayi(aci)}° · {yonAdi(aci)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Türkiye dışında manyetik sapma hesaplanamıyor; telefon pusulası birkaç derece farklı gösterebilir.
                  </p>
                </>
              )}
              {konum && (
                <p className="text-xs text-on-surface-variant">
                  Kâbe&apos;ye kuş uçuşu yaklaşık {Math.round(kabeyeUzaklikKm(konum.lat, konum.lng)).toLocaleString("tr-TR")} km
                </p>
              )}
              {fark !== null && (
                <p className={`text-base font-semibold ${hizali ? "text-secondary" : "text-primary"}`}>
                  {hizali
                    ? "Kıble yönündesiniz."
                    : `${sayi(Math.abs(fark), 0)}° ${fark > 0 ? "sağa" : "sola"} dönün.`}
                </p>
              )}
              {pusula.kalibrasyonGerekli && (
                <p className="text-sm text-primary">
                  Pusula ayarsız görünüyor. Telefonu havada birkaç kez 8 çizerek döndürün.
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
            className="inline-flex min-h-12 items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-secondary-container text-on-secondary-container border border-secondary/30 hover:bg-secondary-container/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <i aria-hidden="true" className="ph ph-map-pin text-base"></i>
            {konumBekliyor ? "Konum alınıyor…" : konum ? "Konumu yenile" : "Konumumu bul"}
          </button>
          {aci !== null && sensorDurumu !== "acik" && (
            <button
              type="button"
              onClick={pusulayiAc}
              disabled={sensorDurumu === "bekliyor"}
              className="inline-flex min-h-12 items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <i aria-hidden="true" className="ph ph-compass text-base"></i>
              {sensorDurumu === "bekliyor" ? "Sensör bekleniyor…" : "Pusulayı aç"}
            </button>
          )}
          {aci !== null && (
            <button
              type="button"
              onClick={() => setKameraAcik(true)}
              className="inline-flex min-h-12 items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-secondary/50 text-on-surface hover:bg-secondary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <i aria-hidden="true" className="ph ph-camera text-base"></i>
              Kamerayla göster
            </button>
          )}
        </div>

        {sensorDurumu === "yok" && (
          <p className="text-sm text-center text-slate-300">
            Bu cihazda pusula sensörü bulunamadı. Açıyı bir pusulayla uygulayabilirsiniz: pusulanın kuzeyine dönüp saat
            yönünde {pusulaAcisi !== null ? `${sayi(pusulaAcisi, 0)}°` : aci !== null ? `${sayi(aci, 0)}°` : "belirtilen açı kadar"} dönün.
          </p>
        )}
        {sensorDurumu === "izin-yok" && (
          <p className="text-sm text-center text-slate-300">
            Pusula izni verilmedi. İzin vermek için sayfayı yenileyip &quot;Pusulayı aç&quot; düğmesine yeniden dokunun.
            Açıyı yukarıdaki yazıdan da takip edebilirsiniz.
          </p>
        )}
      </div>

      {hata && (
        <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {hata}
        </div>
      )}

      {kameraAcik && aci !== null && (
        <KameraliKible kibleAcisi={aci} sapma={sapma} onKapat={() => setKameraAcik(false)} />
      )}

      <ul className="text-[11px] text-on-surface-variant leading-relaxed space-y-1 list-disc pl-4">
        <li>Konumunuz yalnızca bu cihazda, açıyı hesaplamak için kullanılır; sunucuya gönderilmez ve kaydedilmez.</li>
        <li>
          Telefon pusulası metal eşyalardan ve elektrikli cihazlardan etkilenebilir. Telefonu yere paralel tutun; gerekirse
          havada 8 çizerek pusulayı ayarlayın.
        </li>
        <li>
          Açı, Kâbe&apos;ye en kısa yol (büyük daire) üzerinden hesaplanır. Telefon pusulası manyetik kuzeyi gösterdiği
          için bulunduğunuz yerin manyetik sapması (Türkiye&apos;de yaklaşık 5,5 ile 7 derece) otomatik düzeltilir.
        </li>
      </ul>
    </div>
  );
}
