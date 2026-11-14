/**
 * Hoca cevapları: SYSTEM PATCH Q&A MAPPING 01-03 için birebir (kelimesi kelimesine) cevap.
 *
 * Kullanıcı mesajı bu üç sorudan biriyle yüksek benzerlikteyse cevap modele bırakılmaz;
 * hocanın cevap metni olduğu gibi (noktalama ve yazım dâhil, hiçbir düzeltme yapılmadan)
 * gönderilir. Önüne veya arkasına metin eklenmez, hoca adı zikredilmez.
 *
 * Güvenlik önce gelir: güvenlik ön süzgeci (kriz, şiddet, çocuk, sağlık, fetva) veya
 * manevi kalkanlar bir işaret verdiyse eşleşme hiç denenmez. Yas, ağır hastalık ve
 * ölüm isteği gibi hâllerde de eşleşme yapılmaz (normal akış ve hoca sözleri talimatı çalışır).
 *
 * Eşleşme iki yoldan biriyle olur:
 *  1. Yazım benzerliği: Türkçe katlanmış metnin harf üçlüleri (trigram) ile soru metni ya da
 *     soru tarifi arasındaki Dice benzerliği >= HOCA_BENZERLIK_ESIGI.
 *  2. Anlam (kelime kümeleri): soruya ait kelime kümelerinden en az `enAz` tanesi ve
 *     zorunlu kümelerin hepsi mesajda geçiyor; mesaj HOCA_KUME_AZAMI_UZUNLUK karakteri aşmıyor.
 */
import type { JevAnalysisResult } from "@/lib/ai/jev-client";
import type { GuardrailIntercept } from "@/lib/ai/rag-pipeline";
import { foldTurkish, type SafetyTriageResult } from "@/lib/safety/triage";

export type HocaCevapKimligi = "HOCA_QA_01" | "HOCA_QA_02" | "HOCA_QA_03";

interface KelimeKumesi {
  ad: string;
  desen: RegExp;
}

export interface HocaSoruCevap {
  kimlik: HocaCevapKimligi;
  /** Kaynaktaki "Kullanıcının Sorabileceği Soru" metni */
  soru: string;
  /** Kaynaktaki "When User Asks" tarifi */
  soruTarifi: string;
  /** Kaynaktaki "Expected Persona Response" metni, birebir */
  cevap: string;
  kumeler: ReadonlyArray<KelimeKumesi>;
  zorunlu: ReadonlyArray<string>;
  enAz: number;
}

/** Yazım benzerliği eşiği (harf üçlüsü Dice benzerliği, 0-1). */
export const HOCA_BENZERLIK_ESIGI = 0.72;
/** Kelime kümesi yolunun uygulandığı en uzun mesaj (karakter). */
export const HOCA_KUME_AZAMI_UZUNLUK = 400;

// Desenler foldTurkish çıktısı üzerinde çalışır (küçük harf, ı->i, ş->s, ğ->g, ü->u, ö->o, ç->c, â->a).
export const HOCA_SORU_CEVAPLARI: ReadonlyArray<HocaSoruCevap> = [
  {
    kimlik: "HOCA_QA_01",
    soru: "Elimdeki imkanlar çok kısıtlı, kendimi sürekli yetersiz hissediyorum. Büyük niyetler kurmaktan, büyük adımlar atmaktan korkuyorum. Ne tavsiye edersin?",
    soruTarifi: "Elimdeki imkanlar kısıtlı, yetersiz hissediyorum, büyük niyetler etmekten çekiniyorum",
    cevap: "Ahirette en büyük pişmanlık niyetini küçük tutmaktan meydana gelecek. Sana ait olmayan yetersizliklerinle niyetine hudutlar koyma. Sen niyetini büyük tut. Sana imkanlar yaratacak olan Allah azze ve celle.",
    kumeler: [
      { ad: "imkan", desen: /\b(imkan\p{L}*|olanak\p{L}*|kisitli\p{L}*|imkansiz\p{L}*)/u },
      { ad: "yetersizlik", desen: /\b(yetersiz\p{L}*|yetemiyor\p{L}*|kendimi\s+kucuk\s+gor\p{L}*)/u },
      { ad: "büyük niyet/adım", desen: /\b(niyet\p{L}*|buyuk\s+(adim|hayal|hedef)\p{L}*)/u },
      { ad: "korku/çekinme", desen: /\b(kork\p{L}*|cekin\p{L}*|cesaret\p{L}*)/u },
    ],
    zorunlu: ["büyük niyet/adım"],
    enAz: 3,
  },
  {
    kimlik: "HOCA_QA_02",
    soru: "Geleceğimi planlamak ve her şeyi kontrol altında tutmak için sürekli uykusuz geceler geçiriyorum, sırtımdaki dünya yükü beni çok yordu. Bu kaygıdan nasıl kurtulurum?",
    soruTarifi: "Geleceğimi planlamaktan uykusuz geceler geçiriyorum, her şeyi kontrol etmeye çalışmaktan yoruldum",
    cevap: "Siz idareyi Allah'a bırakırsanız, Allah'a teslim olursanız, o zaman Allah her yerde sizinle beraber olur. Günlük hayatımızda hepimizin talepleri istekleri var. Planlar yaparsınız. Uykusuz geceleriniz olur. Halbuki Allah'a tevekkül ederseniz, işi Allah'a bırakırsanız Allah sizin istediğiniz biçimde o kadar güzel çözüme ulaştırır ki siz bile şaşarsınız. Ama insanlar dünyaya çok önem verdikleri için hayatları dünyaya harcadıkları, dünyayı tercih ettikleri için Allah diyor ki, dur bakalım Rabbim evvela ben dünya işimi yapayım sonra senin işini yapacağım. Allah'ta onlara diyor ki ey kulum sen bana yönel ben senin işini yapayım. Ne dersiniz hangisi daha kolay?",
    kumeler: [
      { ad: "gelecek/plan", desen: /\b(gelece\p{L}*|planla\p{L}*|plan\s+yap\p{L}*)/u },
      { ad: "kontrol", desen: /\b(kontrol\p{L}*)/u },
      { ad: "uykusuzluk", desen: /\b(uykusuz\p{L}*|uyuyam\p{L}*|uyku\p{L}*)/u },
      { ad: "kaygı/yük", desen: /\b(kaygi\p{L}*|endise\p{L}*|yuk\b|yuku\p{L}*|yukun\p{L}*|yor(du|uldum|uyor|gun)\p{L}*|tuken\p{L}*)/u },
    ],
    zorunlu: ["kontrol"],
    enAz: 3,
  },
  {
    kimlik: "HOCA_QA_03",
    soru: "Dünyadaki hırsım, mal mülk kaygılarım ve insanlardan gördüğüm haksızlıklar karşısındaki öfkem beni çok yoruyor. Bu geçici dünyada kalbimi hakikate ve sükûnete nasıl bağlarım?",
    soruTarifi: "Dünyaya çok bağlanıyorum, hırslarım ve uğradığım haksızlıklar karşısındaki öfkem beni yoruyor, kalbimi nasıl sakinleştiririm?",
    cevap: "Bu dünyada tek bir gerçek var. O da ölüm. Başka bir şey yok. Hastalık yalan, İyileşince geçiyor, iyileşemedim ölünce bitiyor. Topal ölsen ahirette yürüyeceğim. Kör olsan ahirette göreceksin. Her şey yalan, para yalan, sıhhat yalan, mal, mülk, çoluk, çocuk yalan. Ne var? Tek gerçek ölüm var. Tek gerçek Allah. Allah bu ölümü unutmadan yaşayanlardan eylesin bizi. Ölüm olduğunu unutmazsan Dünya sevgin çok olmaz. Ölüm olduğunu unutmazsan birine kötülük yapmaktan elini geri çekersin. Hesap var dersin. Ölüm olduğunu unutmazsan biri sana zarar verdiğinde nasıl olsa ahirette alacağız deyip aşırıya gitmezsin. Allah canımızı en hayırlı günümüzde alsın ve yaptığımız işi ölürken en hayırlı iş yapsın.",
    kumeler: [
      { ad: "hırs", desen: /\b(hirs\p{L}*|tamah\p{L}*|dunyaya\s+(cok\s+)?baglan\p{L}*)/u },
      { ad: "mal mülk", desen: /\b(mal\s+mulk\p{L}*|mal\p{L}*\s+mulk\p{L}*|servet\p{L}*)/u },
      { ad: "haksızlık", desen: /\b(haksiz\p{L}*|zulum\p{L}*|zulme\p{L}*)/u },
      { ad: "öfke/intikam", desen: /\b(ofke\p{L}*|intikam\p{L}*|kin\b|kinim\p{L}*)/u },
      { ad: "kalp sükûneti", desen: /\b(kalbim\p{L}*|sukun\p{L}*|hakikat\p{L}*|sakinles\p{L}*|huzur\p{L}*)/u },
    ],
    zorunlu: [],
    enAz: 4,
  },
];

/**
 * Bu hâllerde (ölüm isteği, yas, ağır hastalık/teşhis) birebir cevap verilmez;
 * özellikle 03 cevabındaki "hastalık yalan" vurgusu bu kişilere uygun değildir.
 */
// Katlanmamış (yalnız küçük harfe çevrilmiş) metinde aranır: "öldü" ile "oldu" karışmasın.
// Türkçe karaktersiz yazılışlardan yalnızca başka kelimeyle karışmayanlar eklendi.
const ESLESME_ENGELI =
  /(ölmek\s+ist|ölsem|ölmeyi|yaşamak\s+istem|vefat|kaybettim|kaybettik|öldü|ölmüş|cenaze|yas\s+tut|kanser|teşhis|tümör|kemoterapi|ameliyat|hastane|hastalığ|hastalık|hastalig|hastalik|teshis|tumor|olmek\s+ist|yasamak\s+istem)/u;

function engelliMi(metin: string): boolean {
  const kucuk = metin.normalize("NFC").toLocaleLowerCase("tr-TR");
  return ESLESME_ENGELI.test(kucuk);
}

function harfUcluleri(metin: string): Map<string, number> {
  const s = ` ${metin} `;
  const m = new Map<string, number>();
  for (let i = 0; i + 3 <= s.length; i++) {
    const g = s.slice(i, i + 3);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

/** İki metnin (Türkçe katlanmış) harf üçlüsü Dice benzerliği, 0-1. */
export function hocaMetinBenzerligi(a: string, b: string): number {
  const ga = harfUcluleri(foldTurkish(a));
  const gb = harfUcluleri(foldTurkish(b));
  let ortak = 0;
  let toplamA = 0;
  let toplamB = 0;
  for (const n of ga.values()) toplamA += n;
  for (const n of gb.values()) toplamB += n;
  for (const [g, n] of ga) ortak += Math.min(n, gb.get(g) ?? 0);
  if (toplamA + toplamB === 0) return 0;
  return (2 * ortak) / (toplamA + toplamB);
}

export interface HocaCevapEslesmesi {
  kimlik: HocaCevapKimligi;
  cevap: string;
  yontem: "BENZERLIK" | "KELIME_KUMESI";
  benzerlik: number;
  kumeler: string[];
}

/** Mesajı üç soruyla karşılaştırır; eşleşme yoksa null. Güvenlik kontrolü yapmaz. */
export function hocaCevabiBul(mesaj: string): HocaCevapEslesmesi | null {
  const ham = (mesaj || "").trim();
  if (ham.length < 20) return null;
  const katli = foldTurkish(ham);
  if (!katli || engelliMi(ham)) return null;

  let enIyi: HocaCevapEslesmesi | null = null;
  for (const qa of HOCA_SORU_CEVAPLARI) {
    const benzerlik = Math.max(
      hocaMetinBenzerligi(ham, qa.soru),
      hocaMetinBenzerligi(ham, qa.soruTarifi)
    );
    const tutanlar = qa.kumeler.filter((k) => k.desen.test(katli)).map((k) => k.ad);
    const kumeTuttu =
      ham.length <= HOCA_KUME_AZAMI_UZUNLUK &&
      tutanlar.length >= qa.enAz &&
      qa.zorunlu.every((z) => tutanlar.includes(z));

    if (benzerlik >= HOCA_BENZERLIK_ESIGI || kumeTuttu) {
      const aday: HocaCevapEslesmesi = {
        kimlik: qa.kimlik,
        cevap: qa.cevap,
        yontem: benzerlik >= HOCA_BENZERLIK_ESIGI ? "BENZERLIK" : "KELIME_KUMESI",
        benzerlik,
        kumeler: tutanlar,
      };
      const puan = (x: HocaCevapEslesmesi) => x.benzerlik + x.kumeler.length;
      if (!enIyi || puan(aday) > puan(enIyi)) enIyi = aday;
    }
  }
  return enIyi;
}

/**
 * Sohbet akışındaki kalkan zincirinin son halkası. Güvenlik ön süzgeci herhangi bir
 * işaret verdiyse (dipnotlu olanlar dâhil) null döner. Çağıran taraf bunu
 * buildSafetyIntercept ve evaluateSpiritualGuardrails'tan SONRA çağırır.
 */
export function hocaCevabiKalkani(
  mesaj: string,
  triage: SafetyTriageResult | null,
  jevResult: JevAnalysisResult,
  ilimModu = false
): GuardrailIntercept | null {
  if (triage || ilimModu) return null;
  if (jevResult.is_extreme_crisis || jevResult.distress_level >= 10) return null;
  const eslesme = hocaCevabiBul(mesaj);
  if (!eslesme) return null;
  return {
    status: "processed",
    ruleId: eslesme.kimlik,
    replyText: eslesme.cevap,
    extraFlags: {},
    editorAudit: {
      murakabe_applied: true,
      ilahi_riza_checked: true,
      tevekkul_and_talak_hope_included: true,
      nafs_and_vesvese_addressed: eslesme.kimlik,
      siyer_example_used: "Hoca Sözleri (birebir)",
      riba_warning_included: false,
      nafs_trap: jevResult.nafs_trap,
      rag_category: jevResult.rag_category,
      distress_level: jevResult.distress_level,
      tone: "SEFKATLI_TESKIN",
      spiritual_stage: jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC",
    },
  };
}

/** Kural kimliğinin birebir hoca cevabına ait olup olmadığını söyler. */
export function hocaCevabiKuraliMi(ruleId: string | undefined | null): boolean {
  return typeof ruleId === "string" && ruleId.startsWith("HOCA_QA_");
}
