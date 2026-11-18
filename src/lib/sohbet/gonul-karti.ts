/**
 * Gönül Kartı: asistan cevabından paylaşılabilir dikey (1080x1920) görsel kart.
 * Kart tarayıcıda canvas ile çizilir; sunucuya hiçbir şey gitmez.
 *
 * Bu dosyada yalnız saf mantık var (test edilebilir):
 * - kartMetniSec: uzun cevabın ilk anlamlı bölümünü TAM CÜMLELERLE seçer.
 *   Metin yeniden yazılmaz; cümle ortasından kesilmez (tek cümle bile sığmazsa
 *   kelime sınırından kesilip "…" konur).
 * - satirlaraBol / kartDuzeniHesapla: verilen ölçüm işleviyle satır kırma ve
 *   kartın taşmayacağı yazı boyutunu bulma.
 */

import { cumlelereAyir } from "./metin-bicim";
import { vurguIsaretleriniTemizle } from "./paylas";

export const KART_GENISLIK = 1080;
export const KART_YUKSEKLIK = 1920;
/** Kartta gösterilecek azami karakter (yaklaşık). */
export const KART_KARAKTER_SINIRI = 340;
/** Selamlama gibi kısa ilk paragraflardan sonra metin eklemeye devam etme eşiği. */
const KISA_PARAGRAF = 120;

const MADDE_BASI = /^\s*(?:[-•*]\s+|\d{1,2}[.)]\s+)/;
const UC_NOKTA = "…";

export type KartMetni = { metin: string; kisaltildi: boolean };

function kelimeSinirindanKes(metin: string, sinir: number): string {
  if (metin.length <= sinir) return metin;
  const kesik = metin.slice(0, sinir);
  const bosluk = kesik.lastIndexOf(" ");
  const govde = (bosluk > sinir * 0.6 ? kesik.slice(0, bosluk) : kesik).replace(/[\s,;:–-]+$/u, "");
  return `${govde}${UC_NOKTA}`;
}

/** Cevabın ilk anlamlı bölümü: paragraf ve cümle sınırına saygılı, en çok ~sinir karakter. */
export function kartMetniSec(ham: string, sinir = KART_KARAKTER_SINIRI): KartMetni {
  const paragraflar = vurguIsaretleriniTemizle(ham)
    .split(/\n+/)
    .map((p) => p.replace(MADDE_BASI, "").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const secilen: string[] = [];
  let uzunluk = 0;
  let kisaltildi = false;

  dis: for (let pi = 0; pi < paragraflar.length; pi++) {
    const cumleler = cumlelereAyir(paragraflar[pi]);
    const paragrafCumleleri: string[] = [];
    for (let ci = 0; ci < cumleler.length; ci++) {
      const c = cumleler[ci];
      const ek = c.length + (paragrafCumleleri.length || secilen.length ? 1 : 0);
      if (uzunluk + ek > sinir) {
        if (uzunluk === 0) {
          // Tek cümle bile sığmıyor: kelime sınırından kes
          paragrafCumleleri.push(kelimeSinirindanKes(c, sinir));
          uzunluk = sinir;
        }
        kisaltildi = true;
        if (paragrafCumleleri.length) secilen.push(paragrafCumleleri.join(" "));
        break dis;
      }
      paragrafCumleleri.push(c);
      uzunluk += ek;
    }
    secilen.push(paragrafCumleleri.join(" "));
    // İlk anlamlı bölüm yeterince doluysa sonraki paragraflara geçme
    if (uzunluk >= KISA_PARAGRAF && pi < paragraflar.length - 1) {
      kisaltildi = true;
      break;
    }
  }

  return { metin: secilen.join("\n"), kisaltildi };
}

export type Olcucu = (metin: string, punto: number) => number;

/** Bir paragrafı verilen genişliğe kelime kelime kırar; tek başına sığmayan kelime harf harf bölünür. */
export function satirlaraBol(paragraf: string, genislik: number, punto: number, olc: Olcucu): string[] {
  const kelimeler = paragraf.split(/\s+/).filter(Boolean);
  const satirlar: string[] = [];
  let satir = "";
  for (const kelime of kelimeler) {
    const aday = satir ? `${satir} ${kelime}` : kelime;
    if (olc(aday, punto) <= genislik) {
      satir = aday;
      continue;
    }
    if (satir) satirlar.push(satir);
    if (olc(kelime, punto) <= genislik) {
      satir = kelime;
      continue;
    }
    // Çok uzun kelime (bağlantı vb.): harf harf böl
    let parca = "";
    for (const harf of Array.from(kelime)) {
      if (parca && olc(parca + harf, punto) > genislik) {
        satirlar.push(parca);
        parca = harf;
      } else {
        parca += harf;
      }
    }
    satir = parca;
  }
  if (satir) satirlar.push(satir);
  return satirlar;
}

export type KartDuzeni = {
  punto: number;
  satirYuksekligi: number;
  /** "" = paragraf arası boşluk satırı */
  satirlar: string[];
  /** Metin bloğunun toplam yüksekliği */
  yukseklik: number;
  /** En küçük puntoda da sığmadığı için satır kesildi mi */
  kesildi: boolean;
};

export type DuzenSecenekleri = {
  genislik: number;
  yukseklik: number;
  enBuyukPunto?: number;
  enKucukPunto?: number;
  satirAraligi?: number;
  /** Paragraf arası boşluk, satır yüksekliğinin oranı */
  paragrafAraligi?: number;
};

function duzenKur(metin: string, punto: number, s: Required<DuzenSecenekleri>, olc: Olcucu) {
  const satirYuksekligi = Math.round(punto * s.satirAraligi);
  const bosluk = Math.round(satirYuksekligi * s.paragrafAraligi);
  const satirlar: string[] = [];
  let yukseklik = 0;
  metin.split("\n").forEach((p, i) => {
    if (i > 0) {
      satirlar.push("");
      yukseklik += bosluk;
    }
    const s2 = satirlaraBol(p, s.genislik, punto, olc);
    satirlar.push(...s2);
    yukseklik += s2.length * satirYuksekligi;
  });
  return { satirYuksekligi, bosluk, satirlar, yukseklik };
}

/** Metnin alana sığdığı en büyük puntoyu bulur; en küçükte de sığmazsa son satırları atıp "…" ekler. */
export function kartDuzeniHesapla(metin: string, olc: Olcucu, secenek: DuzenSecenekleri): KartDuzeni {
  const s: Required<DuzenSecenekleri> = {
    enBuyukPunto: 64,
    enKucukPunto: 38,
    satirAraligi: 1.45,
    paragrafAraligi: 0.6,
    ...secenek,
  };
  for (let punto = s.enBuyukPunto; punto >= s.enKucukPunto; punto -= 2) {
    const d = duzenKur(metin, punto, s, olc);
    if (d.yukseklik <= s.yukseklik) {
      return { punto, satirYuksekligi: d.satirYuksekligi, satirlar: d.satirlar, yukseklik: d.yukseklik, kesildi: false };
    }
  }
  const punto = s.enKucukPunto;
  const d = duzenKur(metin, punto, s, olc);
  const satirlar = [...d.satirlar];
  let yukseklik = d.yukseklik;
  while (satirlar.length > 1 && yukseklik > s.yukseklik) {
    const atilan = satirlar.pop()!;
    yukseklik -= atilan === "" ? d.bosluk : d.satirYuksekligi;
  }
  while (satirlar.length && satirlar[satirlar.length - 1] === "") {
    satirlar.pop();
    yukseklik -= d.bosluk;
  }
  let son = satirlar[satirlar.length - 1] ?? "";
  if (!son.endsWith(UC_NOKTA)) {
    while (son && olc(`${son}${UC_NOKTA}`, punto) > s.genislik) son = son.slice(0, -1);
    son = `${son.replace(/[\s,;:]+$/u, "")}${UC_NOKTA}`;
  }
  satirlar[satirlar.length - 1] = son;
  return { punto, satirYuksekligi: d.satirYuksekligi, satirlar, yukseklik, kesildi: true };
}

/** İndirilecek dosyanın adı (tarihli). */
export function kartDosyaAdi(tarih = new Date()): string {
  const iki = (n: number) => String(n).padStart(2, "0");
  return `gonul-karti-${tarih.getFullYear()}${iki(tarih.getMonth() + 1)}${iki(tarih.getDate())}-${iki(tarih.getHours())}${iki(tarih.getMinutes())}.png`;
}
