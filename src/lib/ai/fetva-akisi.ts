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
import type { SafetyTriageResult } from "@/lib/safety/triage";
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

export interface FetvaPlani {
  /** true ise model üç aşamalı fetva yönergesiyle çağrılır ve kapanış eklenir. */
  aktif: boolean;
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
  if (triage?.bypassModel) return { aktif: false, cevapTriage: triage };

  const adv = checkAdversarialGuardrails(mesaj);
  const advFetva = Boolean(adv && FETVA_MODELE_BIRAKILAN_KURALLAR.has(adv.ruleId));
  // Başka bir kalkan (rol biçme, kriz vb.) önce geliyorsa fetva akışı açılmaz.
  const baskaKalkan = Boolean(adv && !advFetva);

  const aktif =
    !baskaKalkan &&
    (advFetva ||
      (jevResult.is_fiqh_fatwa_request ?? 0) >= FETVA_ESIGI ||
      triage?.category === "FATWA_LIMIT");

  if (!aktif) return { aktif: false, cevapTriage: triage };
  return {
    aktif: true,
    cevapTriage: triage?.category === "FATWA_LIMIT" ? null : triage,
  };
}

/** Fetva sorusunda kullanıcı istemine eklenen üç aşamalı yönerge. */
export const FETVA_UC_ASAMA_YONERGESI = `[FETVA SORUSU: ÜÇ AŞAMALI CEVAP] (ZORUNLU)
Muhatap fıkhi bir hüküm soruyor (ibadet sıhhati, helal/haram, caiz, boşanma, miras vb.). Robot gibi küt reddetme; cevabını şu üç aşamayla kur:
1. ŞEFKATLİ GİRİŞ: Muhatabın telaşını ya da sıkıntısını şefkatle karşıla, onu yargılama. Vicdana, kalbin terazisine ve insanın kendine yalan söylemeyen iç sesine atıfla zemini yumuşat. "Fıtrat" ve "fıtrî" kelimelerini KULLANMA; yerine "vicdan", "iç ses", "kalbin terazisi" de.
2. İLMİ VE MANEVİ ZEMİN: Konuyla gerçekten ilgili bir ayet, hadis veya hikmetli söz yalnızca bu konuşmada sana verilen onaylı kaynaklarda varsa an; yoksa kaynak, numara veya söz uydurma. Meseleye ansiklopedik bir hüküm olarak değil, kalbe ferahlık veren ahlaki ve manevi bir ufuk olarak yaklaş. KESİN HÜKÜM VERME: "caizdir / caiz değildir", "bozar / bozmaz", "haramdır / helaldir", "boşandınız / boşanmadınız", "size şu kadar pay düşer" gibi cümleler kurma. Uygulama sorularında (kaza namazı, kefaret, fidye, adak, ibadetin nasıl yapılacağı) bilgiyi "âlimlerin çoğunluğuna göre" diye çerçevele, bilinen farklı bir görüş varsa kısaca an.
3. KAPANIŞ: "Yapay zekâyım, fetva mercii değilim" cümlesini ve Diyanet / Alo 190 / müftülük yönlendirmesini SEN YAZMA; sistem resmi kapanış metnini cevabın sonuna kendisi ekler. Sözünü ikinci aşamanın son cümlesiyle tamamla.
Uzunluk: 2-3 kısa paragraf (toplam 90-160 kelime).`;

/** Modelin istemine eklenecek fetva yönergesi (+ varsa isimsiz hoca görüşü). */
export function fetvaYonergesiKur(mesaj: string): string {
  const gorus = fetvaAlimGorusuYonergesi(mesaj);
  return gorus ? `${FETVA_UC_ASAMA_YONERGESI}\n\n${gorus}` : FETVA_UC_ASAMA_YONERGESI;
}

/**
 * Model çağrılamazsa (anahtar yok, tüm modeller hata verdi) kullanılan yedek cevap.
 * İlmihal / talak / kripto kalkanının eski kalıp metni varsa o, yoksa kalıp fetva cevabı;
 * her durumda sonunda harfiyen kapanış.
 */
export function fetvaYedekCevabi(mesaj: string): string {
  const adv = checkAdversarialGuardrails(mesaj);
  const govde =
    adv && FETVA_MODELE_BIRAKILAN_KURALLAR.has(adv.ruleId)
      ? adv.replyText
      : fatwaRejectionBody(mesaj);
  return fetvaKapanisiEkle(govde);
}
