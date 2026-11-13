/**
 * Metin duvarı kırıcı: asistan cevabını EKRANDA kısa bloklara ayırır.
 * Model cevabı değiştirilmez; kopyalama, kaynak süzgeci ve kayıt ham metinle çalışır.
 *
 * Kurallar:
 * - Boş satır ve tek satır sonu paragraf sınırıdır.
 * - "- ", "• ", "* " veya "1. " / "1) " ile başlayan satırlar maddeye dönüşür.
 * - Uzun paragraf yalnızca güvenli cümle sınırından (. ! ? … sonrası boşluk ve
 *   büyük harf / tırnak) bölünür. Kısaltmalar (Hz., s.a.v., vb.), sayılar (2.),
 *   açık tırnak, parantez veya *vurgu* içindeki noktalar bölünmez.
 */

export type MetinBlogu =
  | { tur: "paragraf"; metin: string }
  | { tur: "liste"; sirali: boolean; maddeler: string[] };

/** Bu uzunluğun altındaki paragraflara dokunulmaz. */
export const UZUN_PARAGRAF = 280;
/** Bölünen paragrafta bir parçanın hedef azami uzunluğu. */
export const PARCA_HEDEF = 220;

const KISALTMALAR = new Set([
  "hz",
  "s.a.v",
  "a.s",
  "r.a",
  "k.s",
  "s.a",
  "c.c",
  "vb",
  "vs",
  "bkz",
  "dr",
  "prof",
  "doç",
  "örn",
  "no",
  "md",
  "sh",
  "s",
  "c",
  "h",
  "ö",
  "m",
]);

const MADDE = /^\s*(?:[-•*]\s+|(\d{1,2})[.)]\s+)(.*)$/;
const BUYUK = /["“‘'(«\p{Lu}\d]/u;

function kisaltmaMi(onceki: string): boolean {
  // Noktadan önceki son "kelime" (noktalı kısaltmalar dahil)
  const m = onceki.match(/([\p{L}.]+)$/u);
  if (!m) return false;
  const kelime = m[1].toLocaleLowerCase("tr-TR").replace(/^\.+/, "");
  if (KISALTMALAR.has(kelime)) return true;
  // Tek harfli baş harf (ör. "M. Ali")
  return /^\p{L}$/u.test(kelime);
}

/** Bir paragrafı güvenli cümle sınırlarından cümlelere ayırır. */
export function cumlelereAyir(metin: string): string[] {
  const cumleler: string[] = [];
  let bas = 0;
  let tirnak = 0; // " ve “ ” dengesi
  let parantez = 0;
  let yildiz = 0;
  let altCizgi = 0;
  // Dengesiz işaret (tek başına * veya kapanmamış tırnak) bütün bölmeyi durdurmasın
  const say = (r: RegExp) => (metin.match(r) ?? []).length;
  const izle = {
    tirnak: say(/"/g) % 2 === 0 && say(/“/g) === say(/”/g),
    parantez: say(/\(/g) === say(/\)/g),
    yildiz: say(/\*+/g) % 2 === 0,
    alt: say(/_/g) % 2 === 0,
  };
  for (let i = 0; i < metin.length; i++) {
    const ch = metin[i];
    if (ch === "“") tirnak++;
    else if (ch === "”") tirnak = Math.max(0, tirnak - 1);
    else if (ch === '"') tirnak = tirnak > 0 ? tirnak - 1 : tirnak + 1;
    else if (ch === "(") parantez++;
    else if (ch === ")") parantez = Math.max(0, parantez - 1);
    else if (ch === "*") {
      yildiz ^= 1;
      while (metin[i + 1] === "*") i++; // **kalın** tek vurgu sayılır
      continue;
    } else if (ch === "_") altCizgi ^= 1;

    const icerde =
      (izle.tirnak && tirnak) || (izle.parantez && parantez) || (izle.yildiz && yildiz) || (izle.alt && altCizgi);
    if (icerde) continue;
    // Noktalamayla biten alıntı/parantez kapanışı da cümle sonudur: ...beraberdir." Bu
    const kapanis = (ch === '"' || ch === "”" || ch === ")") && /[.!?…]/.test(metin[i - 1] ?? "");
    if (kapanis) {
      const sonra = metin.slice(i + 1);
      const b = sonra.match(/^\s+/);
      if (b && BUYUK.test(sonra[b[0].length] ?? "")) {
        cumleler.push(metin.slice(bas, i + 1).trim());
        bas = i + 1;
      }
      continue;
    }
    if (ch !== "." && ch !== "!" && ch !== "?" && ch !== "…") continue;
    // Art arda noktalama (..., ?!) bitene kadar ilerle
    let j = i;
    while (j + 1 < metin.length && /[.!?…]/.test(metin[j + 1])) j++;
    const sonra = metin.slice(j + 1);
    const bosluk = sonra.match(/^\s+/);
    if (!bosluk) continue;
    const sonrakiHarf = sonra[bosluk[0].length];
    if (!sonrakiHarf || !BUYUK.test(sonrakiHarf)) continue;
    if (ch === "." && j === i) {
      const onceki = metin.slice(bas, i);
      if (/\d$/.test(onceki)) continue; // "2. ayet", "1.5"
      if (kisaltmaMi(onceki)) continue;
    }
    cumleler.push(metin.slice(bas, j + 1).trim());
    bas = j + 1;
    i = j;
  }
  const kalan = metin.slice(bas).trim();
  if (kalan) cumleler.push(kalan);
  return cumleler;
}

/** Uzun paragrafı 2-3 cümlelik, okunur parçalara böler. */
export function paragrafiBol(paragraf: string, hedef = PARCA_HEDEF): string[] {
  if (paragraf.length <= UZUN_PARAGRAF) return [paragraf];
  const cumleler = cumlelereAyir(paragraf);
  if (cumleler.length < 2) return [paragraf];
  const parcalar: string[] = [];
  let simdiki = "";
  for (const c of cumleler) {
    if (simdiki && simdiki.length + 1 + c.length > hedef) {
      parcalar.push(simdiki);
      simdiki = c;
    } else {
      simdiki = simdiki ? `${simdiki} ${c}` : c;
    }
  }
  if (simdiki) {
    // Çok kısa son parçayı (tek kısa cümle) bir öncekine ekle
    if (parcalar.length && simdiki.length < 60) parcalar[parcalar.length - 1] += ` ${simdiki}`;
    else parcalar.push(simdiki);
  }
  return parcalar;
}

/** Ham cevap metnini ekranda gösterilecek bloklara çevirir. */
export function metniBloklaraAyir(ham: string): MetinBlogu[] {
  const bloklar: MetinBlogu[] = [];
  const satirlar = (ham ?? "").replace(/\r\n?/g, "\n").split("\n");
  let liste: { sirali: boolean; maddeler: string[] } | null = null;

  const listeyiKapat = () => {
    if (liste && liste.maddeler.length) bloklar.push({ tur: "liste", ...liste });
    liste = null;
  };

  for (const hamSatir of satirlar) {
    const satir = hamSatir.trim();
    if (!satir) {
      listeyiKapat();
      continue;
    }
    const m = satir.match(MADDE);
    // "*vurgu* ile başlayan" satır madde değildir: "* " (yıldız + boşluk) gerekir.
    if (m && m[2].trim()) {
      const sirali = m[1] !== undefined;
      if (!liste || liste.sirali !== sirali) {
        listeyiKapat();
        liste = { sirali, maddeler: [] };
      }
      liste.maddeler.push(m[2].trim());
      continue;
    }
    listeyiKapat();
    for (const parca of paragrafiBol(satir)) bloklar.push({ tur: "paragraf", metin: parca });
  }
  listeyiKapat();
  return bloklar;
}
