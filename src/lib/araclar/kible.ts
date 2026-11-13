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

const norm360 = (d: number) => ((d % 360) + 360) % 360;

/**
 * Pusulada (manyetik kuzeye göre) okunacak kıble açısı.
 * Diyanet'in il sayfalarında yazan "kıble açısı" bu türdendir.
 * `sapma` doğu yönlü manyetik sapmadır (Türkiye'de yaklaşık +5,5 / +7).
 */
export function manyetikKibleAcisi(gercekAci: number, sapma: number): number {
  return norm360(gercekAci - sapma);
}

/** Manyetik pusula yönünü coğrafi (gerçek) kuzeye çevirir. */
export function gercekYon(manyetikYon: number, sapma: number | null): number {
  return norm360(manyetikYon + (sapma ?? 0));
}

/**
 * Telefon yere paralel tutulurken ekranın üst kenarının baktığı yön.
 * `alpha`: deviceorientationabsolute olayından (Android), saat yönünün tersine.
 * `ekranAcisi`: screen.orientation.angle (dikey 0, yatay 90/270).
 */
export function alfadanYon(alpha: number, ekranAcisi = 0): number {
  return norm360(360 - alpha + ekranAcisi);
}

/**
 * Telefon dik tutulurken arka kameranın baktığı yön (W3C DeviceOrientation,
 * "Calculating compass heading" bölümü). Kamera neredeyse yere veya göğe
 * bakıyorsa yön belirsizdir ve `null` döner.
 */
export function kameraYonu(alpha: number, beta: number, gamma: number): number | null {
  const a = rad(alpha);
  const b = rad(beta);
  const g = rad(gamma);
  const cA = Math.cos(a);
  const sA = Math.sin(a);
  const sB = Math.sin(b);
  const cG = Math.cos(g);
  const sG = Math.sin(g);
  const dogu = -cA * sG - sA * sB * cG;
  const kuzey = -sA * sG + cA * sB * cG;
  if (Math.hypot(dogu, kuzey) < 0.3) return null;
  return norm360(deg(Math.atan2(dogu, kuzey)));
}
