"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aciFarki, alfadanYon, kameraYonu } from "@/lib/araclar/kible";

/**
 * Telefon pusulasını okuyan ortak kanca (kıble pusulası ve kameralı kıble).
 *
 * Döndürdüğü yön MANYETİK kuzeye göredir:
 * - iOS Safari: `webkitCompassHeading` (Apple: manyetik kuzeye göre, saat yönünde).
 * - Android Chrome: `deviceorientationabsolute` olayının alpha/beta/gamma değerleri
 *   (Android dönüş vektörü sensörü, manyetik kuzeye göre).
 * Gerçek kuzeye çevirmek için `gercekYon(yon, manyetikSapma(...))` kullanılır.
 *
 * mod "duz": telefon yere paralel, ekranın üst kenarının yönü.
 * mod "kamera": telefon dik, arka kameranın baktığı yön.
 */

type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};
type IzinliOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export type SensorDurumu = "kapali" | "bekliyor" | "acik" | "yok" | "izin-yok";

function ekranAcisi(): number {
  if (typeof window === "undefined") return 0;
  const a = window.screen?.orientation?.angle;
  if (typeof a === "number") return a;
  const eski = (window as unknown as { orientation?: number }).orientation;
  return typeof eski === "number" ? eski : 0;
}

/** iOS'ta izin penceresi yalnızca dokunuşla açılabilir; bu yüzden ilk iş olarak çağrılır. */
export async function yonIzniIste(): Promise<"verildi" | "reddedildi" | "desteklenmiyor"> {
  const DOE = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as
    | IzinliOrientation
    | undefined;
  if (!DOE) return "desteklenmiyor";
  if (typeof DOE.requestPermission !== "function") return "verildi";
  try {
    return (await DOE.requestPermission()) === "granted" ? "verildi" : "reddedildi";
  } catch {
    return "reddedildi";
  }
}

export function usePusulaSensoru(mod: "duz" | "kamera") {
  const [yon, setYon] = useState<number | null>(null);
  const [durum, setDurum] = useState<SensorDurumu>("kapali");
  const [kalibrasyonGerekli, setKalibrasyonGerekli] = useState(false);
  const [belirsiz, setBelirsiz] = useState(false);
  const temizle = useRef<(() => void) | null>(null);

  const durdur = useCallback(() => {
    temizle.current?.();
    temizle.current = null;
  }, []);

  useEffect(() => durdur, [durdur]);

  /** İzin zaten alınmışsa dinlemeye başlar. */
  const dinle = useCallback(() => {
    durdur();
    setDurum("bekliyor");
    let veriGeldi = false;
    let mutlakGeldi = false;
    let kare = 0;
    let suzulmus: number | null = null;
    let sonBelirsiz = false;
    let sonKalibrasyon = false;

    const isle = (e: DeviceOrientationEvent, mutlakOlay: boolean) => {
      const ios = e as IOSOrientationEvent;
      let h: number | null = null;
      let bosAci = false;
      if (typeof ios.webkitCompassHeading === "number" && !Number.isNaN(ios.webkitCompassHeading)) {
        h = mod === "duz" ? (ios.webkitCompassHeading + ekranAcisi()) % 360 : ios.webkitCompassHeading;
        const dogruluk = ios.webkitCompassAccuracy;
        sonKalibrasyon = typeof dogruluk === "number" && (dogruluk < 0 || dogruluk > 25);
      } else {
        if (mutlakOlay) mutlakGeldi = true;
        // Android'de göreli (mutlak olmayan) olay kuzeyi bilmez; mutlak olay geliyorsa onu kullan.
        if (!mutlakOlay && (mutlakGeldi || !e.absolute)) return;
        if (typeof e.alpha !== "number") return;
        if (mod === "duz") {
          h = alfadanYon(e.alpha, ekranAcisi());
        } else if (typeof e.beta === "number" && typeof e.gamma === "number") {
          h = kameraYonu(e.alpha, e.beta, e.gamma);
          if (h === null) bosAci = true;
        }
      }
      veriGeldi = true;
      sonBelirsiz = bosAci;
      if (h !== null) {
        // Titremeyi azaltmak için yumuşatma (açı farkı üzerinden, 359 -> 0 geçişinde sıçramaz)
        suzulmus = suzulmus === null ? h : (suzulmus + aciFarki(h, suzulmus) * 0.3 + 360) % 360;
      }
      if (!kare) {
        kare = window.requestAnimationFrame(() => {
          kare = 0;
          setYon(suzulmus);
          setBelirsiz(sonBelirsiz);
          setKalibrasyonGerekli(sonKalibrasyon);
          setDurum("acik");
        });
      }
    };
    const mutlakDinle = (e: Event) => isle(e as DeviceOrientationEvent, true);
    const normalDinle = (e: Event) => isle(e as DeviceOrientationEvent, false);
    window.addEventListener("deviceorientationabsolute", mutlakDinle);
    window.addEventListener("deviceorientation", normalDinle);
    const zaman = window.setTimeout(() => {
      if (!veriGeldi) {
        durdur();
        setDurum("yok");
      }
    }, 3000);
    temizle.current = () => {
      window.removeEventListener("deviceorientationabsolute", mutlakDinle);
      window.removeEventListener("deviceorientation", normalDinle);
      window.clearTimeout(zaman);
      if (kare) window.cancelAnimationFrame(kare);
    };
  }, [durdur, mod]);

  /** Dokunuşla çağrılır: önce izin (iOS), sonra dinleme. */
  const baslat = useCallback(async (): Promise<boolean> => {
    const izin = await yonIzniIste();
    if (izin === "desteklenmiyor") {
      setDurum("yok");
      return false;
    }
    if (izin === "reddedildi") {
      setDurum("izin-yok");
      return false;
    }
    dinle();
    return true;
  }, [dinle]);

  return { yon, durum, kalibrasyonGerekli, belirsiz, baslat, dinle, durdur };
}
