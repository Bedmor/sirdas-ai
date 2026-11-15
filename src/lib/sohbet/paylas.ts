/**
 * "Paylaş" ve "Bizi değerlendir" için sabit metinler ve bağlantılar.
 *
 * Gizlilik: paylaşılan metin SABİTTİR; kullanıcının sohbet içeriği, sohbet başlığı
 * veya herhangi bir kişisel bilgi bu dosyadaki işlevlere hiç verilmez.
 */

export const PAYLASIM_ADRESI = "https://sirdas-ai.vercel.app";

export const PAYLASIM_BASLIGI = "Manevi Pusula";

/** Kısa, sıcak davet metni (adres ayrıca eklenir). */
export const PAYLASIM_METNI =
  "Gönlünü meşgul eden konularda Kur'an ve Sünnet ışığında sakin bir dertleşme alanı: Manevi Pusula. Bana iyi geldi, sana da iyi gelebilir.";

export interface PaylasimVerisi {
  title: string;
  text: string;
  url: string;
}

/** navigator.share için veri: yalnız sabit metin ve adres. */
export function paylasimVerisi(): PaylasimVerisi {
  return { title: PAYLASIM_BASLIGI, text: PAYLASIM_METNI, url: PAYLASIM_ADRESI };
}

/** Panoya kopyalanacak tam metin (metin + adres). */
export function paylasimTamMetni(): string {
  return `${PAYLASIM_METNI}\n${PAYLASIM_ADRESI}`;
}

/** WhatsApp ile paylaşım bağlantısı. */
export function whatsappPaylasimBaglantisi(): string {
  return `https://wa.me/?text=${encodeURIComponent(paylasimTamMetni())}`;
}

/** Ekrandaki vurgu işaretlerini (**kalın**, *eğik*, _eğik_) düz metne çevirir. */
export function vurguIsaretleriniTemizle(metin: string): string {
  return metin
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/(^|[\s("'“])_([^_\n]+)_(?=[\s.,;:!?)"'”]|$)/g, "$1$2");
}

/**
 * Tek bir asistan cevabını paylaşma metni: yalnız o cevabın metni + kaynak satırı.
 * Kullanıcının yazdıkları ve sohbetin geri kalanı bu işleve hiç verilmez.
 */
export function cevapPaylasimMetni(cevap: string): string {
  return `${vurguIsaretleriniTemizle(cevap).trim()}\n\n${PAYLASIM_BASLIGI}: ${PAYLASIM_ADRESI}`;
}

/** Verilen metin için WhatsApp paylaşım bağlantısı. */
export function whatsappMetinBaglantisi(metin: string): string {
  return `https://wa.me/?text=${encodeURIComponent(metin)}`;
}

export const GORUS_EPOSTA_ADRESI = "adnan.kus@hotmail.com";

/**
 * "Bizi değerlendir": mağaza henüz olmadığından mevcut Görüş & Öneri e-posta
 * yoluna yönlendirir. Yalnız seçilen puan ve kullanıcının bu kutuya kendi yazdığı
 * not gönderilir; sohbet içeriği eklenmez.
 */
export function degerlendirmeEpostaBaglantisi(puan: number, not?: string): string {
  const p = Math.min(5, Math.max(1, Math.round(puan)));
  const konu = `Manevi Pusula - Değerlendirme (${p}/5)`;
  const temizNot = (not ?? "").trim().slice(0, 1000);
  const govde =
    `Puanım: ${p}/5\n\n` +
    (temizNot ? `Notum:\n${temizNot}\n` : "--- Eklemek istediğiniz bir şey varsa buraya yazabilirsiniz ---\n");
  return `mailto:${GORUS_EPOSTA_ADRESI}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`;
}
