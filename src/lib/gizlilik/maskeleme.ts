/**
 * Sırdaş AI - Doğrudan kişisel veri maskeleme (KVKK).
 *
 * Kaynak: Adnan Bey 12.11 maili, madde 9 (Hassas Veri ve Gizlilik Maskeleme Katmanı).
 * Modele (Gemini) giden kopyada TC kimlik no, telefon, IBAN, kart numarası,
 * e-posta ve açık adres kalıplarını yer tutucuyla değiştirir.
 *
 * Kurallar:
 * - Kullanıcının ekranda gördüğü kendi mesajı değişmez (bu fonksiyon yalnızca kopyaya uygulanır).
 * - Kriz/güvenlik süzgeci maskelenmemiş metinle çalışmaya devam eder.
 * - Tarih, saat, fiyat, ayet/hadis numarası ve yardım hattı numaraları (112, 183, 190) maskelenmez.
 */

export type MaskeKategorisi =
  | "EPOSTA"
  | "IBAN"
  | "KREDİ_KARTI"
  | "TCKN"
  | "TELEFON"
  | "ADRES";

export const MASKE_YER_TUTUCU: Record<MaskeKategorisi, string> = {
  EPOSTA: "[EPOSTA]",
  IBAN: "[IBAN]",
  KREDİ_KARTI: "[KART_NO]",
  TCKN: "[TC_NO]",
  TELEFON: "[TELEFON]",
  ADRES: "[ADRES]",
};

export interface MaskelemeSonucu {
  metin: string;
  adet: number;
  kategoriler: MaskeKategorisi[];
}

const EPOSTA_DESENI = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// TR IBAN: TR + 24 hane (boşluk veya tire ile gruplanmış olabilir)
const IBAN_DESENI = /\bTR\s?\d{2}(?:[\s-]?\d{4}){5}[\s-]?\d{2}(?!\d)/gi;

// 13-19 haneli kart numarası adayı (boşluk/tire ile gruplanmış olabilir); Luhn ile doğrulanır.
const KART_ADAYI_DESENI = /(?<![\d.,])(?:\d[ -]?){12,18}\d(?![\d.,]\d)/g;

// 11 haneli, 0 ile başlamayan sayı dizisi (TC kimlik numarası biçimi)
const TCKN_DESENI = /(?<![\d.,])[1-9]\d{10}(?![\d.,]?\d)/g;

// Telefon: +90 / 0090 / 0 önekli sabit veya cep hattı, ya da öneksiz 5xx cep hattı.
const TELEFON_DESENI =
  /(?<![\d+(])\(?((?:\+|00)\s?90[\s.-]*|0[\s.-]*)?\(?([2-58]\d{2})\)?[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?![\d])/g;

/** Kart numarası Luhn kontrolü: gerçek kartlar geçer, rastgele sayı dizilerinin çoğu geçmez. */
export function luhnGecerli(rakamlar: string): boolean {
  let toplam = 0;
  let ikiKat = false;
  for (let i = rakamlar.length - 1; i >= 0; i--) {
    let d = rakamlar.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (ikiKat) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    toplam += d;
    ikiKat = !ikiKat;
  }
  return toplam % 10 === 0;
}

// --- Açık adres --------------------------------------------------------------
// Büyük/küçük harf ve Türkçe karakter duyarsız anahtar kelime üretici.
function hd(kelime: string): string {
  const esler: Record<string, string> = {
    i: "[iİ]",
    ı: "[ıI]",
    ğ: "[ğĞ]",
    ü: "[üÜ]",
    ş: "[şŞ]",
    ö: "[öÖ]",
    ç: "[çÇ]",
    ".": "\\.",
  };
  return kelime
    .split("")
    .map((c) => esler[c] ?? (/[a-z]/.test(c) ? `[${c}${c.toUpperCase()}]` : c))
    .join("");
}

const ADRES_ANAHTARLARI = [
  "mahallesi",
  "mahalle",
  "mah.",
  "mh.",
  "caddesi",
  "cadde",
  "cad.",
  "cd.",
  "sokağı",
  "sokak",
  "sok.",
  "sk.",
  "bulvarı",
  "blv.",
  "apartmanı",
  "apt.",
  "sitesi",
  "blok",
].map(hd);

// Adresin parçası sayılmayan yaygın kelimeler (anahtarın önündeki kelime olarak yutulmaz).
const ADRES_DISI_KELIMELER = [
  "adresim", "adresimiz", "adres", "annem", "babam", "annemler", "evim", "evimiz", "bizim", "benim",
  "kızım", "oğlum", "eşim", "kardeşim", "abim", "ablam", "ben", "biz", "ve", "ile", "de", "da", "bu", "şu", "o", "ev", "iş", "işyerim", "dükkanım",
  "oturuyorum", "oturuyoruz", "yaşıyorum", "yaşıyoruz", "kalıyorum", "taşındık", "taşındım",
].map(hd);

// Anahtarın önündeki en çok iki kelime ("Atatürk", "gül", "5." gibi)
const ADRES_ONCESI_KELIME = String.raw`(?!(?:${ADRES_DISI_KELIMELER.join("|")})\s)[\p{L}\d]+\.?\s+`;
const ADRES_PARCASI = String.raw`(?<![\p{L}\d])(?:${ADRES_ONCESI_KELIME}){0,2}(?:${ADRES_ANAHTARLARI.join("|")})(?![\p{L}])`;
const ADRES_NUMARASI = String.raw`(?:(?:${hd("no")}|${hd("numara")}|${hd("daire")}|${hd("kat")})\s*[:.]?\s*\d+[A-Za-z]?(?:\s*\/\s*\d+)?|(?:[dDkK])\s*[:.]\s*\d+|\d+\s*\/\s*\d+)(?!\d)`;
const ADRES_ZINCIRI = new RegExp(
  String.raw`(?:${ADRES_PARCASI}|${ADRES_NUMARASI})(?:[\s,/-]+(?:${ADRES_PARCASI}|${ADRES_NUMARASI}))+`,
  "gu"
);
const ADRES_PARCASI_TEK = new RegExp(ADRES_PARCASI, "u");

/**
 * Metindeki doğrudan kişisel verileri yer tutucularla değiştirir.
 * Sıra önemlidir: e-posta ve IBAN önce, ardından kart, TC kimlik, telefon ve adres.
 */
export function dogrudanKisiselVeriyiMaskele(girdi: string): MaskelemeSonucu {
  if (!girdi || typeof girdi !== "string") {
    return { metin: "", adet: 0, kategoriler: [] };
  }

  let metin = girdi;
  let adet = 0;
  const kategoriler: MaskeKategorisi[] = [];
  const isaretle = (k: MaskeKategorisi) => {
    adet++;
    if (!kategoriler.includes(k)) kategoriler.push(k);
    return MASKE_YER_TUTUCU[k];
  };

  metin = metin.replace(EPOSTA_DESENI, () => isaretle("EPOSTA"));
  metin = metin.replace(IBAN_DESENI, () => isaretle("IBAN"));

  metin = metin.replace(KART_ADAYI_DESENI, (eslesme) => {
    const rakamlar = eslesme.replace(/\D/g, "");
    if (rakamlar.length < 13 || rakamlar.length > 19) return eslesme;
    return luhnGecerli(rakamlar) ? isaretle("KREDİ_KARTI") : eslesme;
  });

  metin = metin.replace(TCKN_DESENI, () => isaretle("TCKN"));

  metin = metin.replace(TELEFON_DESENI, (eslesme, onek: string | undefined, alan: string) => {
    // Öneksiz numarada yalnızca 5xx cep hattı kabul edilir (sabit hat için 0 veya +90 gerekir).
    if (!onek && !alan.startsWith("5")) return eslesme;
    return isaretle("TELEFON");
  });

  metin = metin.replace(ADRES_ZINCIRI, (eslesme) => {
    // Zincirde en az bir mahalle/cadde/sokak parçası olmalı ("No: 5, Kat: 2" tek başına adres sayılmaz).
    if (!ADRES_PARCASI_TEK.test(eslesme)) return eslesme;
    const sondakiBosluk = eslesme.match(/\s+$/)?.[0] ?? "";
    return isaretle("ADRES") + sondakiBosluk;
  });

  return { metin, adet, kategoriler };
}

/** Geçmiş konuşma turlarında doğrudan kişisel veri maskeleme (modele giden kopya için). */
export function gecmisiMaskele<T extends { role: string; content: string }>(
  turlar: ReadonlyArray<T>,
  kullaniciMesajiTemizle: (metin: string) => string = (m) =>
    dogrudanKisiselVeriyiMaskele(m).metin
): T[] {
  return turlar.map((tur) => ({
    ...tur,
    content:
      tur.role === "user"
        ? kullaniciMesajiTemizle(tur.content)
        : dogrudanKisiselVeriyiMaskele(tur.content).metin,
  }));
}
