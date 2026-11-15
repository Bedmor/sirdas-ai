/**
 * Sesli okuma için metni hazırlar: biçim işaretlerini ayıklar, uzun metni cümle sınırlarından
 * kısa parçalara böler (bazı tarayıcılar çok uzun tek parçayı yarıda kesiyor).
 */

export const PARCA_SINIRI = 220;

export function okunacakMetin(ham: string): string {
  return ham
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [yazı](bağlantı) -> yazı
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[*_`#>~]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function okunacakParcalar(ham: string, sinir = PARCA_SINIRI): string[] {
  const metin = okunacakMetin(ham);
  if (!metin) return [];
  const cumleler = metin.match(/[^.!?…;:]+[.!?…;:]*\s*/g) ?? [metin];
  const parcalar: string[] = [];
  let birikim = "";
  const it = (p: string) => {
    const t = p.trim();
    if (t) parcalar.push(t);
  };
  for (const c of cumleler) {
    if (c.length > sinir) {
      it(birikim);
      birikim = "";
      // Çok uzun cümle: virgül/boşluktan böl.
      let kalan = c;
      while (kalan.length > sinir) {
        let kes = kalan.lastIndexOf(",", sinir);
        if (kes < sinir / 2) kes = kalan.lastIndexOf(" ", sinir);
        if (kes <= 0) kes = sinir;
        it(kalan.slice(0, kes + 1));
        kalan = kalan.slice(kes + 1);
      }
      birikim = kalan;
      continue;
    }
    if ((birikim + c).length > sinir) {
      it(birikim);
      birikim = c;
    } else birikim += c;
  }
  it(birikim);
  return parcalar;
}
