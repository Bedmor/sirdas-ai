/**
 * Kıble yönü hesabı (büyük daire / ortodromik başlangıç açısı).
 * Sonuç: coğrafi (gerçek) kuzeyden saat yönünde derece, 0-360.
 */

export const KABE = { lat: 21.4225, lng: 39.8262 } as const;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function kibleAcisi(lat: number, lng: number): number {
  const phi1 = rad(lat);
  const phi2 = rad(KABE.lat);
  const dLambda = rad(KABE.lng - lng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Kâbe'ye büyük daire uzaklığı (km, haversine). */
export function kabeyeUzaklikKm(lat: number, lng: number): number {
  const R = 6371;
  const dPhi = rad(KABE.lat - lat);
  const dLambda = rad(KABE.lng - lng);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(rad(lat)) * Math.cos(rad(KABE.lat)) * Math.sin(dLambda / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

const YONLER = [
  "Kuzey",
  "Kuzey-kuzeydoğu",
  "Kuzeydoğu",
  "Doğu-kuzeydoğu",
  "Doğu",
  "Doğu-güneydoğu",
  "Güneydoğu",
  "Güney-güneydoğu",
  "Güney",
  "Güney-güneybatı",
  "Güneybatı",
  "Batı-güneybatı",
  "Batı",
  "Batı-kuzeybatı",
  "Kuzeybatı",
  "Kuzey-kuzeybatı",
];

/** Açıyı 16 yönlü pusula adına çevirir (ör. 151° -> "Güney-güneydoğu"). */
export function yonAdi(aci: number): string {
  const norm = ((aci % 360) + 360) % 360;
  return YONLER[Math.round(norm / 22.5) % 16];
}

/** İki açı arasındaki en kısa işaretli fark (-180, 180]. Pozitif: saat yönünde dön. */
export function aciFarki(hedef: number, mevcut: number): number {
  let d = (((hedef - mevcut) % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}
