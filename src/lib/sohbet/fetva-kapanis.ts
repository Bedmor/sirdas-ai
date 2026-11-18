/**
 * Fetva sorularında cevabın sonuna eklenen resmi kapanış (müşteri yaması, 18.11).
 *
 * Metin harfiyen korunur; modelin yazmasına bırakılmaz, kodla sona eklenir.
 * Model aynı metni (veya kendi Alo 190 / "fetva mercii değilim" cümlesini) cevabın
 * sonunda yazmışsa önce o kısım temizlenir, sonra kapanış TEK kez eklenir.
 *
 * Saf modül: sunucuda ve tarayıcıda (hızlı yanıt düğmeleri) kullanılabilir.
 */

export const FETVA_KAPANIS =
  "Ben bir yapay zekâyım ve fetva mercii değilim; Bu sorunuzun şer'i/fıkhi hükmü (ibadet sıhhati, helal/haram, caiz, boşanma, miras vb.) için lütfen Diyanet İşleri Başkanlığı'nı (Alo 190 Fetva Hattı) arayınız veya ehliyetli müftülüklere danışınız.";

/** Karşılaştırma için: kalın/italik işaretleri, tırnak çeşitleri ve boşluklar sadeleşir. */
function sadelestir(metin: string): string {
  return metin
    .normalize("NFC")
    .replace(/[*_]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

const KAPANIS_SADE = sadelestir(FETVA_KAPANIS);

/** Cevapta resmi kapanış (biçim işaretleri hariç birebir) var mı. */
export function fetvaKapanisiVarMi(metin: string): boolean {
  return sadelestir(metin || "").includes(KAPANIS_SADE);
}

/**
 * Sondaki paragraflarda yönlendirme cümlesi sayılan izler: Alo 190, müftülük,
 * "fetva mercii/makamı değilim", "yapay zekâyım". Bu cümleler kapanışın tekrarı olur.
 */
const YONLENDIRME_IZI =
  /\b190\b|m[üu]ft[üu]l[üu]|fetva\s+(mercii|makam[ıi])|yapay\s+zek[aâ]y[ıi]m|diyanet\s+i[şs]leri\s+ba[şs]kanl/iu;

function cumlelereBol(paragraf: string): string[] {
  return paragraf.split(/(?<=[.!?…])\s+/u).filter((c) => c.trim().length > 0);
}

/**
 * Cevabın sonundaki yönlendirme cümlelerini ayıklar (kapanış zaten eklenecek).
 * Yalnız sondan başa doğru ilerler: bir paragrafta yönlendirme dışı cümle kalırsa durur.
 * Cevabın gövdesindeki ayet/hadis ve manevi kısma dokunmaz.
 */
export function sondakiYonlendirmeyiAyikla(metin: string): string {
  const paragraflar = (metin || "").replace(/\r\n/g, "\n").trimEnd().split(/\n{2,}/);
  while (paragraflar.length > 0) {
    const son = paragraflar[paragraflar.length - 1];
    const cumleler = cumlelereBol(son);
    const kalan = cumleler.filter((c) => !YONLENDIRME_IZI.test(c));
    if (kalan.length === cumleler.length) break;
    if (kalan.length === 0) {
      paragraflar.pop();
      continue;
    }
    paragraflar[paragraflar.length - 1] = kalan.join(" ");
    break;
  }
  return paragraflar.join("\n\n").trimEnd();
}

/**
 * Kapanışı harfiyen ve TEK kez ekler. Metnin içindeki kapanış kopyaları ve sondaki
 * yönlendirme cümleleri (eski fetva dipnotu dâhil) önce temizlenir.
 */
export function fetvaKapanisiEkle(metin: string): string {
  let govde = (metin || "").replace(/\r\n/g, "\n");
  // Biçim işaretli ya da işaretsiz kapanış kopyalarını gövdeden çıkar.
  const paragraflar = govde.split(/\n{2,}/).map((p) => {
    if (!fetvaKapanisiVarMi(p)) return p;
    return sadelestir(p) === KAPANIS_SADE ? "" : p.split(FETVA_KAPANIS).join("").trim();
  });
  govde = paragraflar.filter((p) => p.trim().length > 0).join("\n\n");
  govde = sondakiYonlendirmeyiAyikla(govde);
  return govde.trim() ? `${govde.trimEnd()}\n\n${FETVA_KAPANIS}` : FETVA_KAPANIS;
}
