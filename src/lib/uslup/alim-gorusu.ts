/**
 * Hoca ve âlim görüşlerini anma kuralı (kaynak türüne bağlı genel kural, 18.11 fetva yaması).
 *
 * Kasadaki bazı kayıtlar ayet/hadis değil, bir hocanın görüşü veya sohbetidir
 * (Halis Hoca soru-cevapları, Halis Hoca sohbet kesitleri; ileride kurandersleri arşivi).
 * Bu kayıtlar:
 *  - modele "HOCA/ÂLİM GÖRÜŞÜ" etiketiyle ve kişi adı olmadan verilir,
 *  - cevapta isim verilmeden ("bazı âlimler/hocalarımız şöyle der") anılır,
 *  - fıkhi soruda çoğunluk görüşünün YANINDA anılır, onun yerine konmaz.
 *
 * Yeni bir arşiv eklendiğinde yalnızca kaynak türünü ALIM_GORUSU_KAYNAK_TURLERI listesine
 * eklemek yeter; etiket, isim gizleme ve fetva yönergesi aynı kuralla çalışır.
 */
import { hocaCevabiBul } from "./hoca-cevaplari";
import { HOCA_SOZLERI_AKTIF } from "./hoca-sozleri";

/** Görüş/sohbet niteliğindeki kaynak türleri (büyük harf). */
export const ALIM_GORUSU_KAYNAK_TURLERI: ReadonlyArray<string> = [
  "HALIS_AYDEMIR", // sohbet kesitleri (ses + deşifre)
  "HOCA_CEVABI", // hoca soru-cevapları (Q&A 01-03)
  "KURANDERSLERI", // ileride eklenecek ders arşivi
];

/** Kaynak bağlamında görüş kayıtlarına gösterilen tür etiketi. */
export const ALIM_GORUSU_ETIKETI = "HOCA/ÂLİM GÖRÜŞÜ (isim verme, hadis değildir)";

/** Görüş kaydının başlığı yerine modele gösterilen ad (kişi adı sızmasın). */
export const ALIM_GORUSU_BASLIGI = "İsimsiz hoca görüşü";

export function alimGorusuKaynagiMi(kaynak: { sourceType?: string | null }): boolean {
  return ALIM_GORUSU_KAYNAK_TURLERI.includes((kaynak.sourceType || "").toUpperCase());
}

/** Her iki modun sistem talimatına eklenen bölüm. */
export const ALIM_GORUSU_BOLUMU = `## HOCA VE ÂLİM GÖRÜŞLERİNİ ANMA (KAYNAK TÜRÜNE BAĞLI GENEL KURAL)
1. Kaynak bağlamında "${ALIM_GORUSU_ETIKETI}" etiketiyle gelen kayıtlar (hoca sohbet kesitleri, hoca soru-cevapları ve ileride eklenecek ders arşivleri) bir kişinin görüşü veya sohbetidir; ayet, hadis ya da bağlayıcı hüküm değildir.
2. Bu kayıtları aktarırken kişinin adını, unvanını veya lakabını zikretme; "bazı âlimler şöyle der", "bazı hocalarımız şöyle buyurur", "büyüklerimizden bazıları" diye isimsiz an.
3. Fıkhi bir soruda (ibadet sıhhati, helal/haram, caiz, boşanma, miras, kaza, kefaret vb.) bu görüşü yalnızca çoğunluk görüşünün YANINDA, "bir görüşe göre" diye an; çoğunluk görüşünün yerine koyma, kesin hüküm gibi sunma.
4. Kayıtta geçmeyen bir sözü bu kaynaklara mal etme; görüşü Peygamberimiz'e (s.a.v.) atfetme.`;

export interface AlimGorusuKaydi {
  kaynakTuru: string;
  metin: string;
}

/**
 * Mesajla ilgili depodaki görüş kayıtlarını bulur (şimdilik hoca soru-cevapları).
 * İleride eklenecek arşivler bu fonksiyona yeni bir arama olarak bağlanır.
 */
export function ilgiliAlimGorusleri(mesaj: string): AlimGorusuKaydi[] {
  const sonuc: AlimGorusuKaydi[] = [];
  const hoca = HOCA_SOZLERI_AKTIF ? hocaCevabiBul(mesaj) : null;
  if (hoca) sonuc.push({ kaynakTuru: "HOCA_CEVABI", metin: hoca.cevap });
  return sonuc;
}

/**
 * Fetva sorusunda modele eklenen kısa yönerge: ilgili görüş varsa isimsiz anılabilir.
 * İlgili görüş yoksa null döner (model görüş uydurmasın).
 */
export function fetvaAlimGorusuYonergesi(mesaj: string): string | null {
  const gorusler = ilgiliAlimGorusleri(mesaj);
  if (gorusler.length === 0) return null;
  const satirlar = gorusler.map((g) => `- "${g.metin}"`).join("\n");
  return `[İLGİLİ HOCA GÖRÜŞÜ: İSİMSİZ ANILIR]
Kaynak deposunda bu soruyla ilgili şu görüş var:
${satirlar}
İstersen çoğunluk görüşünün yanında bunu "bazı hocalarımız şöyle der" diye İSİM VERMEDEN an; kesin hüküm gibi sunma, çoğunluk görüşünün yerine koyma.`;
}
