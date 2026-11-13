/**
 * Manyetik sapma (deklinasyon) tablosu ve basit il bazlı model.
 *
 * Telefon pusulaları (iOS webkitCompassHeading, Android deviceorientationabsolute)
 * yönü MANYETİK kuzeye göre verir. Kıble açısı ise coğrafi (gerçek) kuzeye göre
 * hesaplanır. Türkiye'de manyetik kuzey gerçek kuzeyin yaklaşık 5,5-7 derece
 * doğusundadır; düzeltme yapılmazsa pusula kıbleyi bu kadar şaşırır.
 *
 * Değerler: NOAA NCEI Dünya Manyetik Modeli WMM-2025, tarih 13.11.2026,
 * deniz seviyesi, 81 il merkezi (koordinatlar iller.json ile aynı).
 * Kaynak: https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml
 * Yıllık değişim Türkiye'de +0,01 ile +0,06 derece arasıdır; birkaç yıl
 * boyunca ihmal edilebilir. Tablo 2030'dan sonra yenilenmelidir.
 *
 * Doğu sapma pozitiftir: gercekYon = manyetikYon + sapma.
 */

/** [plaka, enlem, boylam, sapma (derece, doğu +)] */
export const IL_SAPMALARI: ReadonlyArray<readonly [number, number, number, number]> = [
  [1, 36.9864, 35.3253, 5.74], // Adana
  [2, 37.7603, 38.2773, 5.92], // Adıyaman
  [3, 38.7569, 30.5387, 5.83], // Afyonkarahisar
  [4, 39.7191, 43.0505, 6.39], // Ağrı
  [5, 40.6503, 35.8329, 6.48], // Amasya
  [6, 39.9208, 32.854, 6.17], // Ankara
  [7, 36.8866, 30.703, 5.56], // Antalya
  [8, 41.1831, 41.8287, 6.8], // Artvin
  [9, 37.8484, 27.8436, 5.51], // Aydın
  [10, 39.6474, 27.888, 5.77], // Balıkesir
  [11, 40.1435, 29.9753, 6.02], // Bilecik
  [12, 38.8861, 40.4972, 6.18], // Bingöl
  [13, 38.4021, 42.1085, 6.05], // Bitlis
  [14, 40.7333, 31.611, 6.25], // Bolu
  [15, 37.7248, 30.2887, 5.66], // Burdur
  [16, 40.1826, 29.0675, 5.95], // Bursa
  [17, 40.1463, 26.4029, 5.7], // Çanakkale
  [18, 40.5972, 33.6213, 6.35], // Çankırı
  [19, 40.5499, 34.9537, 6.41], // Çorum
  [20, 37.7828, 29.0966, 5.59], // Denizli
  [21, 37.9162, 40.2364, 5.95], // Diyarbakır
  [22, 41.6759, 26.5587, 5.96], // Edirne
  [23, 38.6747, 39.2227, 6.12], // Elazığ
  [24, 39.7468, 39.491, 6.38], // Erzincan
  [25, 39.9063, 41.2728, 6.44], // Erzurum
  [26, 39.7744, 30.5191, 6.0], // Eskişehir
  [27, 37.0628, 37.3793, 5.78], // Gaziantep
  [28, 40.9174, 38.3848, 6.64], // Giresun
  [29, 40.4618, 39.4757, 6.56], // Gümüşhane
  [30, 37.5767, 43.7378, 5.82], // Hakkari
  [31, 36.2025, 36.1603, 5.61], // Hatay
  [32, 37.7637, 30.5551, 5.68], // Isparta
  [33, 36.7978, 34.6298, 5.69], // Mersin
  [34, 41.0064, 28.9759, 6.08], // İstanbul
  [35, 38.4193, 27.1285, 5.53], // İzmir
  [36, 40.6071, 43.0948, 6.65], // Kars
  [37, 41.3765, 33.777, 6.52], // Kastamonu
  [38, 38.7219, 35.4873, 6.06], // Kayseri
  [39, 41.737, 27.2236, 6.04], // Kırklareli
  [40, 39.1461, 34.1606, 6.09], // Kırşehir
  [41, 40.7654, 29.9407, 6.12], // Kocaeli
  [42, 37.8727, 32.4924, 5.8], // Konya
  [43, 39.4199, 29.9858, 5.9], // Kütahya
  [44, 38.3487, 38.3191, 6.04], // Malatya
  [45, 38.6126, 27.4334, 5.58], // Manisa
  [46, 37.5813, 36.9275, 5.87], // Kahramanmaraş
  [47, 37.3133, 40.7354, 5.81], // Mardin
  [48, 37.2152, 28.3637, 5.46], // Muğla
  [49, 38.7322, 41.4899, 6.14], // Muş
  [50, 38.625, 34.7151, 6.02], // Nevşehir
  [51, 37.9698, 34.6764, 5.9], // Niğde
  [52, 40.9852, 37.8798, 6.64], // Ordu
  [53, 41.0248, 40.5199, 6.73], // Rize
  [54, 40.7726, 30.4039, 6.16], // Sakarya
  [55, 41.2946, 36.3321, 6.65], // Samsun
  [56, 37.9274, 41.9422, 5.94], // Siirt
  [57, 42.0266, 35.1512, 6.76], // Sinop
  [58, 39.7504, 37.0145, 6.32], // Sivas
  [59, 40.9781, 27.5108, 5.94], // Tekirdağ
  [60, 40.3234, 36.5522, 6.44], // Tokat
  [61, 41.0055, 39.7301, 6.71], // Trabzon
  [62, 39.1061, 39.5483, 6.23], // Tunceli
  [63, 37.1596, 38.7919, 5.8], // Şanlıurfa
  [64, 38.674, 29.4058, 5.74], // Uşak
  [65, 38.5009, 43.3946, 6.06], // Van
  [66, 39.8222, 34.8081, 6.26], // Yozgat
  [67, 41.4527, 31.7876, 6.4], // Zonguldak
  [68, 38.3705, 34.0269, 5.95], // Aksaray
  [69, 40.2552, 40.2205, 6.52], // Bayburt
  [70, 37.1809, 33.2195, 5.71], // Karaman
  [71, 39.841, 33.5059, 6.2], // Kırıkkale
  [72, 37.8836, 41.1278, 5.94], // Batman
  [73, 37.522, 42.457, 5.83], // Şırnak
  [74, 41.635, 32.3366, 6.48], // Bartın
  [75, 41.1103, 42.7036, 6.79], // Ardahan
  [76, 39.9219, 44.0468, 6.45], // Iğdır
  [77, 40.6583, 29.27, 6.05], // Yalova
  [78, 41.1955, 32.6231, 6.41], // Karabük
  [79, 36.7166, 37.1146, 5.71], // Kilis
  [80, 37.0734, 36.2508, 5.77], // Osmaniye
  [81, 40.8392, 31.1595, 6.23], // Düzce
];

export const SAPMA_KAYNAGI = "NOAA WMM-2025, 13.11.2026";

/** Tablo noktalarından bu kadar uzaktaki konumlar için sapma tahmin edilmez (km). */
const AZAMI_UZAKLIK_KM = 250;

const rad = (d: number) => (d * Math.PI) / 180;

function uzaklikKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dPhi = rad(lat2 - lat1);
  const dLambda = rad(lng2 - lng1);
  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLambda / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Konumun manyetik sapmasını en yakın 3 il merkezinden uzaklık ağırlıklı
 * ortalamayla verir. Türkiye ve yakın çevresi dışında `null` döner.
 */
export function manyetikSapma(lat: number, lng: number): number | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const yakinlar = IL_SAPMALARI.map(([, la, lo, d]) => ({ km: uzaklikKm(lat, lng, la, lo), d }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
  if (!yakinlar.length || yakinlar[0].km > AZAMI_UZAKLIK_KM) return null;
  if (yakinlar[0].km < 1) return yakinlar[0].d;
  let pay = 0;
  let payda = 0;
  for (const y of yakinlar) {
    const w = 1 / (y.km * y.km);
    pay += w * y.d;
    payda += w;
  }
  return pay / payda;
}
