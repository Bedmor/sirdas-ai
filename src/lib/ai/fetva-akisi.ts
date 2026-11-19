/**
 * Fetva sorusu akışı (müşteri yaması, 18.11): keskin hüküm sorularında model ATLANMAZ.
 *
 * Model cevabı üç aşamayla kurar (şefkatli giriş -> ilmi ve manevi zemin -> kapanış);
 * kapanış metni (FETVA_KAPANIS) modelin değil kodun işidir ve sona harfiyen eklenir.
 * Model çağrısı başarısız olursa veya anahtar yoksa eski kalıp cevaplar yedek olarak kullanılır;
 * yedekte de aynı kapanış vardır.
 *
 * Kriz, intihar, şiddet, sağlık ve çocuk akışları bu dosyadan önce çalışır ve değişmez.
 */
import type { JevAnalysisResult } from "./jev-taxonomy";
import { fatwaRejectionBody } from "./jev-taxonomy";
import { checkAdversarialGuardrails } from "./adversarial-guardrails";
import { foldTurkish, type SafetyTriageResult } from "@/lib/safety/triage";
import { FETVA_KAPANIS, fetvaKapanisiEkle } from "@/lib/sohbet/fetva-kapanis";
import { fetvaAlimGorusuYonergesi } from "@/lib/uslup/alim-gorusu";

export { FETVA_KAPANIS, fetvaKapanisiEkle };

/** Bu kalkanların kalıp cevabı artık yalnızca yedektir; soru modele gider. */
export const FETVA_MODELE_BIRAKILAN_KURALLAR: ReadonlySet<string> = new Set([
  "ILMIHAL_IBADET_SIHHATI_GUARD",
  "TALAK_DIVORCE_RULING",
  "CRYPTO_FATWA_DEMAND",
]);

/** Sezgisel sınıflandırıcının fetva eşiği (eski kalıp cevap eşiğiyle aynı). */
export const FETVA_ESIGI = 0.75;

/**
 * Fetva v2 (müşteri İLAVE yaması, 18.11): iki kollu çalışma.
 * - PRATIK_ILMIHAL: "sehiv secdesi nasıl yapılır", "gusülde ağza su vermek farz mı",
 *   "abdest nasıl alınır", "kaç rekât". Kısa, net, Hanefî ilmihaline göre teknik bilgi.
 * - KALBI_HUKUM: vicdan, günah, caiz, helal/haram, faiz, boşanma, miras, ibadet sıhhati
 *   ("bozar mı"). Üç aşamalı cevap, kesin hüküm yok. Emin olunamayan her soru buraya düşer.
 * Her iki kolda da cevabın sonuna harfiyen kapanış eklenir.
 */
export type FetvaSoruTuru = "PRATIK_ILMIHAL" | "KALBI_HUKUM";

/** İbadet konusu (Türkçe karakterleri katlanmış metinde). */
const IBADET_KONUSU =
  /\b(abdest|gusul|gusl|boy\s*abdest|teyemmum|mesh|namaz|secde|sehiv|rekat|vitir|teravih|kunut|ezan|kamet|kible|oruc|sahur|iftar|zekat|fitre|fidye|hac|umre|ihram|tavaf|kurban)\p{L}*/u;

/** Teknik/usul sorusu kalıbı. */
const PRATIK_SORU =
  /\bnasil\s+(kilinir|kilinmali|kilarim|kilmaliyim|yapilir|yapilmali|yaparim|yapmaliyim|alinir|alinmali|alirim|almaliyim|edilir|ederim|etmeliyim|verilir|verilmeli|veririm|tutulur|tutarim|hesaplanir|odenir|okunur|getirilir)\b|\b(farz|sunnet|vacip|mustehap|sart)\s*(mi|midir|mu|mudur)\b|\bkac\s*rekat|\b(farz|sunnet|vacip|sart)lar(i|in)\b|\bhangi\s*sira/u;

/** Kalbi / manevi / ikilemli işaretler: biri varsa soru üç aşamalı kola gider. */
const KALBI_ISARET =
  /\b(vicdan|rahatsiz|gunah|caiz|helal|haram|faiz|kredi|kripto|bahis|bosan|talak|miras|nikah|korku|korkuyorum|pisman|icim|kalbim|ozur|kanam|kanad|hasta|bozar|bozulur|bozuldu|gecerli|kabul\s*olur|sahih)\p{L}*/u;

/** Fetva sorusunun kolunu seçer. Emin değilse KALBI_HUKUM. */
export function fetvaSoruTuru(mesaj: string): FetvaSoruTuru {
  const t = foldTurkish(mesaj || "");
  if (IBADET_KONUSU.test(t) && PRATIK_SORU.test(t) && !KALBI_ISARET.test(t)) {
    return "PRATIK_ILMIHAL";
  }
  return "KALBI_HUKUM";
}

/** Fetva akışına girmese de teknik ilmihal sorusu mu ("abdest nasıl alınır"). */
export function pratikIlmihalSorusuMu(mesaj: string): boolean {
  return fetvaSoruTuru(mesaj) === "PRATIK_ILMIHAL";
}

export interface FetvaPlani {
  /** true ise model fetva yönergesiyle çağrılır ve kapanış eklenir. */
  aktif: boolean;
  /** Seçilen kol (aktif değilse KALBI_HUKUM). */
  tur: FetvaSoruTuru;
  /**
   * Cevapta kullanılacak güvenlik süzgeci sonucu. Fetva akışında FATWA_LIMIT
   * dipnotu ve "fetva makamı değildir" kutusu düşer (tek kapanış kalır).
   * Diğer işaretler (ör. sağlık dipnotu) aynen korunur.
   */
  cevapTriage: SafetyTriageResult | null;
}

/**
 * Mesajın üç aşamalı fetva akışına girip girmediğini belirler.
 * Modeli atlayan güvenlik işareti (kriz, sağlık, çocuk) varsa akış devreye girmez.
 */
export function fetvaPlaniKur(
  mesaj: string,
  jevResult: Pick<JevAnalysisResult, "is_fiqh_fatwa_request">,
  triage: SafetyTriageResult | null
): FetvaPlani {
  const tur = fetvaSoruTuru(mesaj);
  if (triage?.bypassModel) return { aktif: false, tur, cevapTriage: triage };

  const adv = checkAdversarialGuardrails(mesaj);
  const advFetva = Boolean(adv && FETVA_MODELE_BIRAKILAN_KURALLAR.has(adv.ruleId));
  // Başka bir kalkan (rol biçme, kriz vb.) önce geliyorsa fetva akışı açılmaz.
  const baskaKalkan = Boolean(adv && !advFetva);

  const aktif =
    !baskaKalkan &&
    (advFetva ||
      (jevResult.is_fiqh_fatwa_request ?? 0) >= FETVA_ESIGI ||
      triage?.category === "FATWA_LIMIT" ||
      // v2: "abdest nasıl alınır" gibi teknik ilmihal soruları da kapanış alır.
      tur === "PRATIK_ILMIHAL");

  if (!aktif) return { aktif: false, tur, cevapTriage: triage };
  return {
    aktif: true,
    tur,
    cevapTriage: triage?.category === "FATWA_LIMIT" ? null : triage,
  };
}

/** Pratik/teknik ilmihal sorusunda kullanıcı istemine eklenen kısa yönerge (v2, A kolu). */
export const FETVA_PRATIK_ILMIHAL_YONERGESI = `[FETVA SORUSU: PRATİK İLMİHAL] (ZORUNLU)
Muhatap bir ibadetin nasıl yapılacağını veya teknik bir ilmihal bilgisini soruyor. Uzatmadan, net ve saygılı cevap ver:
- Hanefî ilmihaline göre bilgiyi ver ve "Hanefî mezhebine göre" diye çerçevele; gerekiyorsa adımları kısa maddelerle sırala.
- Bilinen bir mezhep farkı varsa (ör. Şâfiî mezhebi) tek cümleyle an.
- Edebiyat, duygu, uzun teselli ve zorlama ayet/hadis yok; giriş cümlesi en fazla bir kısa cümle olsun.
- Kendi adına emir kipiyle hüküm koyma ("kılmanız şarttır" yerine "Hanefî ilmihaline göre ... yapılır").
- "Yapay zekâyım, fetva mercii değilim" cümlesini ve Diyanet / Alo 190 / müftülük yönlendirmesini SEN YAZMA; sistem resmi kapanışı ekler.
Uzunluk: 60-140 kelime.`;

/** Fetva sorusunda kullanıcı istemine eklenen üç aşamalı yönerge. */
export const FETVA_UC_ASAMA_YONERGESI = `[FETVA SORUSU: ÜÇ AŞAMALI CEVAP] (ZORUNLU)
Muhatap fıkhi bir hüküm soruyor (ibadet sıhhati, helal/haram, caiz, boşanma, miras vb.). Robot gibi küt reddetme; cevabını şu üç aşamayla kur:
1. ŞEFKATLİ GİRİŞ: Muhatabın telaşını ya da sıkıntısını şefkatle karşıla, onu yargılama. Yaratıcının insana lütfettiği saf fıtrata (yaradılıştaki saf hale), vicdandaki adalet terazisine ve insanın kendine yalan söylemeyen iç sesine atıfla zemini yumuşat. "Fıtrat" kelimesini bu cevapta en fazla bir kez kullan; "fıtrî" kelimesini KULLANMA (yerine "doğal", "samimi", "yapmacıksız").
2. İLMİ VE MANEVİ ZEMİN: Sorunun konusuyla DOĞRUDAN ilgili bir ayet, hadis veya hikmetli söz yalnızca bu konuşmada sana verilen onaylı kaynaklarda varsa an (en fazla bir tane); kaynaklarda doğrudan ilgili bir metin yoksa ayet/hadis kullanma, konuyla ilgisiz bir metni zorla bağlama, kaynak, numara veya söz uydurma. Meseleye ansiklopedik bir hüküm olarak değil, kalbe ferahlık veren ahlaki ve manevi bir ufuk olarak yaklaş. KESİN HÜKÜM VERME: "caizdir / caiz değildir", "bozar / bozmaz", "haramdır / helaldir", "boşandınız / boşanmadınız", "size şu kadar pay düşer" gibi cümleler kurma. Uygulama sorularında (kaza namazı, kefaret, fidye, adak, ibadetin nasıl yapılacağı) bilgiyi "âlimlerin çoğunluğuna göre" diye çerçevele, bilinen farklı bir görüş varsa kısaca an.
3. KAPANIŞ: "Yapay zekâyım, fetva mercii değilim" cümlesini ve Diyanet / Alo 190 / müftülük yönlendirmesini SEN YAZMA; sistem resmi kapanış metnini cevabın sonuna kendisi ekler. Sözünü ikinci aşamanın son cümlesiyle tamamla.
Uzunluk: 2-3 kısa paragraf, toplam 90-150 kelime; 150 kelimeyi geçme. Tek bir ibadet ayrıntısı soruluyorsa ("namazda gülmek bozar mı" gibi) giriş tek cümle olsun, sözü uzatma.`;

/**
 * Modelin istemine eklenecek fetva yönergesi: pratik ilmihal kolunda kısa teknik yönerge,
 * kalbi/hüküm kolunda üç aşama (+ varsa isimsiz hoca görüşü).
 */
export function fetvaYonergesiKur(mesaj: string): string {
  if (fetvaSoruTuru(mesaj) === "PRATIK_ILMIHAL") return FETVA_PRATIK_ILMIHAL_YONERGESI;
  const gorus = fetvaAlimGorusuYonergesi(mesaj);
  return gorus ? `${FETVA_UC_ASAMA_YONERGESI}\n\n${gorus}` : FETVA_UC_ASAMA_YONERGESI;
}

/**
 * Model çağrılamazsa (anahtar yok, tüm modeller hata verdi) kullanılan yedek cevap.
 * İlmihal / talak / kripto kalkanının eski kalıp metni varsa o, yoksa kalıp fetva cevabı;
 * her durumda sonunda harfiyen kapanış.
 */
/** Model çağrılamadığında teknik ilmihal sorusu için kısa yedek gövde (hüküm ve adım uydurmaz). */
const PRATIK_ILMIHAL_YEDEK_GOVDE =
  "Şu an bu ibadetin adımlarını size eksiksiz aktaramıyorum. Uygulanışını Diyanet'in ilmihalinden veya mahallenizdeki cami hocasından adım adım öğrenmek en sağlıklısıdır; sorunuzu biraz sonra yeniden de yazabilirsiniz.";

export function fetvaYedekCevabi(mesaj: string): string {
  const adv = checkAdversarialGuardrails(mesaj);
  const govde =
    adv && FETVA_MODELE_BIRAKILAN_KURALLAR.has(adv.ruleId)
      ? adv.replyText
      : fetvaSoruTuru(mesaj) === "PRATIK_ILMIHAL"
        ? PRATIK_ILMIHAL_YEDEK_GOVDE
        : fatwaRejectionBody(mesaj);
  return fetvaKapanisiEkle(govde);
}
