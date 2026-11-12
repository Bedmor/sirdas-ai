/**
 * Türkiye'nin 81 ili: statik liste (dış servise bağlı değildir).
 *
 * Kaynaklar (12.11.2026'da derlendi):
 * - `id` ve `merkezIlceId`: ezanvakti.emushaf.net `/sehirler/2` ve `/ilceler/{id}`
 *   (Diyanet vakit tablosundaki il ve il merkezi ilçe kodları).
 * - `lat` / `lng`: il merkezi koordinatı, github.com/ubeydeozdmr/turkiye-api
 *   `datasets/2025/provinces.json` (MIT lisansı), 4 ondalığa yuvarlandı.
 * - `ad`: aynı veri setindeki Türkçe il adı.
 *
 * Koordinatlar, Diyanet kaynağına ulaşılamadığında vakitleri Aladhan
 * (method=13, Diyanet yöntemi) ile il merkezine göre hesaplamak için kullanılır.
 * İlçe koordinatı tutulmaz; bu durumda ilçe seçimi il merkezine düşer.
 */
import hamListe from "./iller.json";

export type Il = {
  /** Diyanet (ezanvakti) il kodu, ör. İstanbul = "539" */
  id: string;
  plaka: number;
  ad: string;
  /** Diyanet (ezanvakti) il merkezi ilçe kodu */
  merkezIlceId: string;
  lat: number;
  lng: number;
};

export const ILLER: readonly Il[] = [...(hamListe as Il[])].sort((a, b) => a.ad.localeCompare(b.ad, "tr-TR"));

const ID_ILE = new Map(ILLER.map((il) => [il.id, il]));

export function ilBul(id: string): Il | undefined {
  return ID_ILE.get(id);
}
