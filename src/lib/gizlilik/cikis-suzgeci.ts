/**
 * Sırdaş AI - Çıkış süzgeci (kural tabanlı hakem).
 *
 * Kaynak: Adnan Bey 12.11 maili, madde 10 (Çift Katmanlı Hakem Mimarisi) ve iş planı P1/P3.
 * Model cevabı kullanıcıya gitmeden önce cümle cümle taranır:
 *  - kesin fetva / kesin af hükmü        -> cümle, nazik yönlendirme cümlesiyle değiştirilir
 *  - tıbbi reçete, doz, ilaç bıraktırma  -> cümle, doktora/eczacıya yönlendirmeyle değiştirilir
 *  - bağımlılık dili ("tek sırdaşın benim") -> cümle çıkarılır, sona gerçek bağlara yönlendirme eklenir
 *  - tiyatral yapay empati               -> ilgili yan cümle (gerekirse tüm cümle) çıkarılır
 *  - kişisel bilgi sızıntısı             -> satır içinde maskelenir
 * Süzgeç sonunda anlamlı metin kalmazsa güvenli yedek cevap verilir.
 *
 * İkinci bir yapay zekâ çağrısı yapılmaz (maliyet). Akışta (SSE) cümle tamamlanınca
 * taranıp gönderilir; kullanıcı yazının akışını görmeye devam eder, uygunsuz cümle ekrana hiç düşmez.
 */
import { dogrudanKisiselVeriyiMaskele } from "./maskeleme";

export type CikisKuralKodu =
  | "CIKIS_FETVA_HUKUM"
  | "CIKIS_KESIN_AF"
  | "CIKIS_TIBBI_RECETE"
  | "CIKIS_BAGIMLILIK_DILI"
  | "CIKIS_YAPAY_EMPATI"
  | "CIKIS_KISISEL_BILGI"
  | "CIKIS_YEDEK_CEVAP";

export type CikisEylemi = "DEGISTIRILDI" | "CIKARILDI" | "MASKELENDI" | "YEDEK_CEVAP";

export interface CikisOlayi {
  kuralKodu: CikisKuralKodu;
  eylem: CikisEylemi;
  adet: number;
}

export const CIKIS_YERINE_CUMLELER = {
  fetva:
    "Bu konuda kesin hüküm vermek bana düşmez; doğru bilgi için Diyanet'in ALO 190 hattına veya müftülüğe danışmak en sağlıklısı olur.",
  af: "Affın hükmü yalnızca Allah'a aittir; tevbe kapısı ise her zaman açıktır.",
  tibbi:
    "İlaç, doz ve tedavi konusunda doğru bilgiyi ancak doktorunuz veya eczacınız verebilir.",
  bag: "Güvendiğin bir yakınınla, ailenle ya da bir hocayla konuşmak da sana iyi gelebilir.",
  yedek:
    "Bu konuda sana sağlıklı bir cevap veremedim. Dilersen derdini biraz daha açarak yazabilirsin; dini bir hüküm arıyorsan Diyanet'in ALO 190 hattı da yardımcı olur.",
} as const;

/** Karşılaştırma için Türkçe küçük harf + şapkasız/aksansız biçim. */
export function katla(metin: string): string {
  return metin
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (c) =>
      ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" })[c] ?? c
    );
}

// --- Kural desenleri (katlanmış metin üzerinde) ------------------------------

const FETVA_HUKUM_KELIMESI =
  /\b(caizdir|caiz degildir|caiz olmaz|haramdir|haram degildir|helaldir|mubahtir|gunahtir|gunah degildir|mekruhtur)\b/;
const FETVA_KISISEL =
  /\b(sen|siz|senin|sizin|sana|size|bu durumda|bu durumunuzda|senin durumunda|sizin durumunuzda|yaptigin|yaptiginiz|yapman|yapmaniz|kesin|kesinlikle|kesin olarak|hic suphesiz)\b/;
const FETVA_GOSTERME_BASI = /^\s*[*_"]*\s*(bu|bunu|boyle bir|o halde|dolayisiyla|yaptiginiz|yaptigin)\b/;
// Adnan Bey'in örnek yasak ifadeleri dahil ("kesin olarak caizdir", "kesin haramdır", "ben müftüyüm").
const FETVA_DOGRUDAN =
  /\b(fetvam|fetva veriyorum|fetvasi sudur|hukmum sudur|ben muftuyum|muftu olarak|fetva makamiyim)\b/;
// Kaynak gösterilen alıntı (ayet/hadis meali) içinde geçen hüküm kelimesi fetva sayılmaz.
const ALINTI_VEYA_KAYNAK = /[_"“”«»]|\([^)]*\d+[^)]*\)/;

const KESIN_AF =
  /\bkesin(likle)?\s+(affedil\w*|affetti\w*|affedecek\w*|cennet\w*|cehennem\w*)|\baffedildin(iz)?\b|\bgunah(in|iniz|lariniz|larin)\s+(kesin(likle)?\s+)?silindi\b/;

const TIBBI_DOZ = /\b\d+([.,]\d+)?\s*(mg|miligram|mcg|ml|mililitre|cc)\b/;
const TIBBI_ADET = /\b\d+\s*(tablet|hap|kapsul|damla|olcek|fitil|ampul)\b/;
const ILAC_ADI =
  /\b(xanax|alprazolam|prozac|fluoksetin|lustral|sertralin|cipralex|essitalopram|lyrica|pregabalin|rivotril|klonazepam|diazem|diazepam|ativan|lorazepam|paroksetin|seroquel|ketiapin|tramadol|morfin|parol|aspirin|ibuprofen|majezik|apranax|antidepresan|antibiyotik|uyku ilac\w*|sakinlestirici ilac\w*)\w*/;
const ILAC_EMRI =
  /\b(al|alin|alabilirsin|alabilirsiniz|almalisin|almalisiniz|kullan|kullanin|kullanabilirsin|kullanabilirsiniz|ic|icin|icebilirsin|icebilirsiniz|basla|baslayin|baslayabilirsin|artir|artirin|azalt|azaltin)\b/;
const ILAC_BIRAKTIRMA =
  /\b(ilac\w*|tedavi\w*)\s+(\p{L}+\s+)?(birak|birakin|birakabilirsin|birakabilirsiniz|birakmalisin|birakmalisiniz|kesebilirsin|kesebilirsiniz|kesmelisin|kesmelisiniz)\b|\bdoz\w*\s+(\p{L}+\s+)?(artir|azalt|yukselt|dusur)\w*|\b(bu|o)\s+ilac\w*\s+(icme|kullanma|alma)(\s*[.!,;]|\s*$)/u;

const BAGIMLILIK_DESENLERI: ReadonlyArray<RegExp> = [
  /\btek (sirdasin|dostun|dayanagin|yoldasin|arkadasin) (benim|ben)\b/,
  /\b(sen|siz)in (tek|bir tek) (sirdasin|sirdasiniz|dostun|dostunuz) (benim|ben)\b/,
  /\bbenden baska (kimseye|kimseniz|kimsen)\b/,
  /\b(baskasina|baskalarina|kimseye) (gerek|ihtiyac\w*) (yok|kalmadi)\b/,
  /\b(seni|sizi) (kimse|hic kimse) benim kadar (iyi )?anla\w*/,
  /\b(sadece|yalnizca|bir tek) (bana|benimle) (yaz|anlat|konus|dertles)\w*/,
  /\b(ailene|ailenize|kimseye) (anlatmana|anlatmaniza|soylemene|soylemenize) gerek yok\b/,
  /\bben varken (kimseye|baskasina)\b/,
];

const YAPAY_EMPATI_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(duyuyorum|duyabiliyorum|hissediyorum|hissedebiliyorum)\b/,
  /\b(acini|acinizi|derdini|derdinizi|yukunu|yukunuzu) paylasiyorum\b/,
  /\b(seni|sizi) (cok iyi|gayet iyi|tamamen|cok) anliyorum\b/,
  /\b(yuregim|kalbim|icim) (sizinle|seninle|burkuldu|parcalandi|sizladi|kan agliyor|yandi)\b/,
  /\bgozlerim (doldu|yasardi)\b/,
];

const BAGLAC_BASI = /^(\s*)(ancak|fakat|ama|lakin|yine de|ve)\s+/i;

// --- Yardımcılar -------------------------------------------------------------

function harfSayisi(metin: string): number {
  return (metin.match(/\p{L}/gu) || []).length;
}

function ilkHarfiBuyut(metin: string): string {
  return metin.replace(/^([\s*_"'“]*)(\p{Ll})/u, (_, on: string, h: string) => on + h.toLocaleUpperCase("tr-TR"));
}

/** Cümleyi yan cümlelere (virgül, noktalı virgül, iki nokta) ayırır; ayraçlar yan cümlede kalır. */
function yanCumleler(cumle: string): string[] {
  return cumle.match(/[^,;:]+(?:[,;:]+|$)/g) || [cumle];
}

/** Tiyatral empati yan cümlesini çıkarır; anlamlı bir şey kalmazsa null döner. */
function empatiyiAyikla(cumle: string): string | null {
  const parcalar = yanCumleler(cumle);
  const kalan = parcalar.filter((p) => !YAPAY_EMPATI_DESENLERI.some((d) => d.test(katla(p))));
  if (kalan.length === parcalar.length) return cumle;
  let metin = kalan.join("").replace(BAGLAC_BASI, "$1").trimStart();
  if (harfSayisi(metin) < 15) return null;
  // Cümle sonu noktalaması empati yan cümlesiyle gittiyse geri koy.
  if (!/[.!?…]["'_*)\s]*$/.test(metin)) metin = `${metin.replace(/[,;:\s]+$/, "")}.`;
  return ilkHarfiBuyut(metin);
}

function fetvaMi(katli: string): boolean {
  if (FETVA_DOGRUDAN.test(katli)) return true;
  if (!FETVA_HUKUM_KELIMESI.test(katli)) return false;
  if (ALINTI_VEYA_KAYNAK.test(katli)) return false;
  return FETVA_KISISEL.test(katli) || FETVA_GOSTERME_BASI.test(katli);
}

function tibbiMi(katli: string): boolean {
  if (ILAC_BIRAKTIRMA.test(katli)) return true;
  if (TIBBI_DOZ.test(katli) || TIBBI_ADET.test(katli)) return true;
  return ILAC_ADI.test(katli) && ILAC_EMRI.test(katli);
}

// --- Akış süzgeci --------------------------------------------------------------

const CUMLE_SONU = /[.!?…]+(?=\s)\s+|\n+/g;
const AZAMI_TAMPON = 600;

/**
 * Parça parça gelen model cevabını cümle cümle süzer.
 * ekle(): gönderilmeye hazır (süzülmüş) metni döndürür, tamamlanmamış cümleyi tutar.
 * bitir(): kalan metni ve gerekiyorsa son eki/yedek cevabı döndürür.
 */
export class CikisSuzgeci {
  private tampon = "";
  private bekleyenBosluk = "";
  private cikti = "";
  private girdiVar = false;
  private olaylar = new Map<CikisKuralKodu, CikisOlayi>();
  private kullanilanYerineCumleler = new Set<string>();

  ekle(parca: string): string {
    if (!parca) return "";
    if (parca.trim()) this.girdiVar = true;
    this.tampon += parca;

    let kesim = 0;
    CUMLE_SONU.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CUMLE_SONU.exec(this.tampon)) !== null) {
      kesim = m.index + m[0].length;
    }
    if (kesim === 0 && this.tampon.length > AZAMI_TAMPON) {
      // Çok uzun ve noktasız akış: son boşluktan bölerek gecikmeyi sınırla.
      const son = Math.max(this.tampon.lastIndexOf(", "), this.tampon.lastIndexOf(" "));
      if (son > 0) kesim = son + 1;
    }
    if (kesim === 0) return "";

    const hazir = this.tampon.slice(0, kesim);
    this.tampon = this.tampon.slice(kesim);
    return this.isle(hazir);
  }

  bitir(): string {
    let son = this.tampon ? this.isle(this.tampon) : "";
    this.tampon = "";

    if (this.olaylar.has("CIKIS_BAGIMLILIK_DILI") && !this.cikti.includes(CIKIS_YERINE_CUMLELER.bag)) {
      son += this.yaz("\n\n", true) + this.yaz(CIKIS_YERINE_CUMLELER.bag);
    }

    if (this.girdiVar && this.olaylar.size > 0 && harfSayisi(this.cikti) < 20) {
      this.olayEkle("CIKIS_YEDEK_CEVAP", "YEDEK_CEVAP");
      son += this.yaz(this.cikti ? "\n\n" : "", true) + this.yaz(CIKIS_YERINE_CUMLELER.yedek);
    }
    return son;
  }

  /** Şu ana kadar gönderilen (süzülmüş) metnin tamamı. */
  get metin(): string {
    return this.cikti;
  }

  get tetiklenenler(): CikisOlayi[] {
    return Array.from(this.olaylar.values());
  }

  private olayEkle(kuralKodu: CikisKuralKodu, eylem: CikisEylemi) {
    const var_ = this.olaylar.get(kuralKodu);
    if (var_) var_.adet++;
    else this.olaylar.set(kuralKodu, { kuralKodu, eylem, adet: 1 });
  }

  /** Boşlukları erteleyerek yazar: çıkarılan cümlelerin yerinde fazladan boşluk/satır kalmaz. */
  private yaz(metin: string, yalnizBosluk = false): string {
    if (!metin) return "";
    if (yalnizBosluk || !metin.trim()) {
      // Ardışık boşluklar birleştirilir (akışta "\n\n" iki parçaya bölünebilir).
      const satirSayisi = ((this.bekleyenBosluk + metin).match(/\n/g) || []).length;
      if (satirSayisi >= 2) this.bekleyenBosluk = "\n\n";
      else if (satirSayisi === 1) this.bekleyenBosluk = "\n";
      else this.bekleyenBosluk = this.bekleyenBosluk || metin;
      return "";
    }
    const on = this.cikti ? this.bekleyenBosluk : "";
    this.bekleyenBosluk = "";
    this.cikti += on + metin;
    return on + metin;
  }

  private yerineKoy(cumle: string, kod: CikisKuralKodu): string {
    this.olayEkle(kod, "DEGISTIRILDI");
    if (this.kullanilanYerineCumleler.has(cumle)) return "";
    this.kullanilanYerineCumleler.add(cumle);
    return this.yaz(cumle);
  }

  private isle(metin: string): string {
    let cikis = "";
    // Cümle + ardından gelen boşluk çiftlerine ayır.
    const parcalar = metin.split(/([.!?…]+(?=\s|$)\s*|\n+)/);
    // split, ayraçları tek indekslere koyar: [cümle, ayraç, cümle, ayraç, ...]
    for (let i = 0; i < parcalar.length; i += 2) {
      const govde = parcalar[i] ?? "";
      const ayrac = parcalar[i + 1] ?? "";
      const noktalama = ayrac.match(/^[.!?…]+/)?.[0] ?? "";
      const bosluk = ayrac.slice(noktalama.length);
      const cumle = govde + noktalama;
      if (cumle.trim()) cikis += this.cumleIsle(cumle);
      if (bosluk) cikis += this.yaz(bosluk, true);
    }
    return cikis;
  }

  private cumleIsle(hamCumle: string): string {
    // 1) Kişisel bilgi sızıntısı: satır içinde maskele, cümle kalır.
    const maske = dogrudanKisiselVeriyiMaskele(hamCumle);
    let cumle = hamCumle;
    if (maske.adet > 0) {
      cumle = maske.metin;
      for (let i = 0; i < maske.adet; i++) this.olayEkle("CIKIS_KISISEL_BILGI", "MASKELENDI");
    }

    const katli = katla(cumle);

    // 2) Tıbbi reçete / doz / ilaç bıraktırma
    if (tibbiMi(katli)) return this.yerineKoy(CIKIS_YERINE_CUMLELER.tibbi, "CIKIS_TIBBI_RECETE");

    // 3) Kesin fetva ve kesin af hükmü
    if (fetvaMi(katli)) return this.yerineKoy(CIKIS_YERINE_CUMLELER.fetva, "CIKIS_FETVA_HUKUM");
    if (KESIN_AF.test(katli)) return this.yerineKoy(CIKIS_YERINE_CUMLELER.af, "CIKIS_KESIN_AF");

    // 4) Bağımlılık dili: cümle çıkarılır, sona yönlendirme eklenir (bitir()).
    if (BAGIMLILIK_DESENLERI.some((d) => d.test(katli))) {
      this.olayEkle("CIKIS_BAGIMLILIK_DILI", "CIKARILDI");
      return "";
    }

    // 5) Tiyatral yapay empati: yan cümleyi ayıkla.
    if (YAPAY_EMPATI_DESENLERI.some((d) => d.test(katli))) {
      const ayiklanmis = empatiyiAyikla(cumle);
      this.olayEkle("CIKIS_YAPAY_EMPATI", "CIKARILDI");
      return ayiklanmis ? this.yaz(ayiklanmis) : "";
    }

    return this.yaz(cumle);
  }
}

export interface CikisSuzgeciSonucu {
  metin: string;
  olaylar: CikisOlayi[];
  degisti: boolean;
}

/** Akış olmayan (tek parça) cevaplar için. */
export function cikisSuzgeciUygula(metin: string): CikisSuzgeciSonucu {
  const s = new CikisSuzgeci();
  s.ekle(metin || "");
  s.bitir();
  const olaylar = s.tetiklenenler;
  return { metin: s.metin, olaylar, degisti: olaylar.length > 0 };
}
