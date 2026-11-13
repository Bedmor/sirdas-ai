import { HAFIZA_STORAGE_KEY } from "./hafiza";

/**
 * "Bu cihazdan temizle": yalnız bu tarayıcıda görünen sohbet izlerini kaldırır.
 *
 * - Sunucudaki kayıtlar SİLİNMEZ (veritabanına dokunulmaz).
 * - Tema, yazı boyu, gizlilik ayarları, KVKK onayı, zikirmatik ve
 *   namaz vakti şehir seçimi korunur.
 * - Hafızam (emanetler ve hal hafızası) da bu cihazdan silinir.
 * - Yeni bir anonim cihaz kimliği üretilir; böylece sunucudaki eski
 *   profil ve notlar bu cihazda bir daha yüklenmez.
 */

export const THREADS_STORAGE_KEY = "sirdas_chat_threads_v1";
export const CLIENT_ID_STORAGE_KEY = "sirdas_anon_client_id_v1";
export const CONSENT_STORAGE_KEY = "sirdas_kvkk_consent_v1";
export const SETTINGS_STORAGE_KEY = "sirdas_privacy_settings_v1";
export const PROFILE_STORAGE_KEY = "sirdas_user_profile_v1";
export { HAFIZA_STORAGE_KEY };

/** Bu cihazdan temizlenecek (sohbet geçmişi ve ona bağlı önbellek) anahtarlar */
export const CIHAZDAN_SILINECEK_ANAHTARLAR: readonly string[] = [
  THREADS_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  HAFIZA_STORAGE_KEY,
];

/** localStorage ve sessionStorage için ortak, test edilebilir arayüz */
export interface AnahtarDeposu {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function yeniCihazKimligiUret(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `sirdas_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Sohbet geçmişini depodan kaldırır ve yeni cihaz kimliği yazar.
 * Diğer tüm anahtarlara dokunmaz. Yeni kimliği döndürür.
 */
export function cihazdanTemizle(
  depo: AnahtarDeposu,
  kimlikUret: () => string = yeniCihazKimligiUret,
): string {
  for (const anahtar of CIHAZDAN_SILINECEK_ANAHTARLAR) {
    try {
      depo.removeItem(anahtar);
    } catch {}
  }
  const yeniKimlik = kimlikUret();
  try {
    depo.setItem(CLIENT_ID_STORAGE_KEY, yeniKimlik);
  } catch {}
  return yeniKimlik;
}
