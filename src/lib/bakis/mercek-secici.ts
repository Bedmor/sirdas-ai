/**
 * Bakış Açıları / Mercekler ("sihirli dosya dolabı").
 *
 * Adnan Bey'in mercek kılavuzu sistem talimatına toptan yığılmaz. Her turda
 * kullanıcının mesajına tetikleyici kelime + etiket eşleşmesiyle en ilgili
 * 1 (en fazla 2) mercek seçilir ve o tura kısa bir blok olarak eklenir.
 * Eşleşme yoksa hiçbir şey eklenmez. Embedding / veri tabanı gerekmez; tamamen yereldir.
 *
 * Güvenlik önceliği: kriz, istismar, sağlık ve çocuk işareti taşıyan mesajda
 * mercek EKLENMEZ (guvenlikOncelikliMi). Fetva soruları zaten bu aşamadan önce
 * Alo 190 yönlendirmesine düşer. Hoca sözleri eşleşmeleriyle çakışan mercekler
 * (hocaSozuKarsiligi dolu olanlar) seçilmez; o konuda hoca sözü önceliklidir.
 *
 * Derlemede yalnızca denetimden TEMİZ ya da YUMUŞATILMIŞ olarak geçen mercekler var.
 * Adnan Bey'in kararını bekleyenler src/data/bekleyen/ altındadır ve buraya yüklenmez.
 */
import veri from "@/data/corpus/bakis_acilari.json";
import { foldTurkish } from "../safety/triage";
import { guvenlikOncelikliMi } from "../uslup/siniflandirici";

export interface Mercek {
  no: number;
  ad: string;
  etiketler: string[];
  tetikleyiciler: string[];
  teshis: string;
  giris: string;
  irtibat: string;
  pusulaNotu: string;
  yasaklar: string;
  durum: "TEMIZ" | "YUMUSATILDI";
  /** Bu mercek bir hoca sözü eşleşmesiyle örtüşüyorsa o eşleşmenin numarası ("01" vb.). */
  hocaSozuKarsiligi?: string | null;
}

export interface MercekSecimi {
  mercek: Mercek;
  puan: number;
  eslesenler: string[];
}

export interface MercekGirdisi {
  mesaj: string;
  /** İlim ve Siyer modunda mercek eklenmez (ansiklopedik cevap modu). */
  ilimModu?: boolean;
  /** En fazla kaç mercek (1 veya 2). Varsayılan 2. */
  enFazla?: 1 | 2;
}

export const MERCEKLER: ReadonlyArray<Mercek> = veri as Mercek[];

/** Seçim eşiği: en az bu kadar puan ve mesajda en az iki ayrı kelimenin eşleşmesi (ya da tam bir ifade). */
export const MERCEK_ESIK = 2;
/** İkinci merceğin eklenmesi için birinciye oranla gereken puan. */
const IKINCI_ORAN = 0.85;
/** İkinci mercek için mesajda eşleşmesi gereken en az ayrı kelime sayısı. */
const IKINCI_EN_AZ_KELIME = 3;
/** Mesaj kelimesi merceğin adında da geçiyorsa eklenen küçük puan. */
const AD_BONUSU = 0.3;

/** Çok genel olduğu için anlam taşımayan kelimeler (katlanmış biçimde). */
const GENEL_KELIMELER = new Set([
  "allah", "rab", "rabbi", "rabbim", "rabbin", "hayat", "hayati", "hayatin", "insan", "insanin", "insanlar",
  "dunya", "dunyevi", "kalp", "kalbi", "kalbim", "iman", "imani", "din", "dini", "ruh", "ruhu", "ruhum", "ruhun",
  "nefs", "nefis", "nefsi", "hal", "hali", "his", "zaman", "sey", "her", "bir", "ve", "ile", "icin", "gibi",
  "cok", "ben", "beni", "bana", "sen", "seni", "biz", "bizi", "kararlar", "iyiler", "kotu", "iyi", "hakikat",
  "hakikati", "hakiki", "manevi", "ilahi", "olmak", "etmek", "yapmak", "gun", "gunluk", "hep", "yok", "var",
  "olan", "olarak", "kadar", "daha", "ama", "fakat", "icin", "diye", "degil", "bile", "nasil", "neden",
  "mercek", "mercegi", "bakis", "acisi", "yanilgisi", "bilinci", "sirri", "olmasi", "karsi", "karsisinda",
  "artik", "sadece", "kendi", "kendini", "kendimi", "kendim", "yeni", "eski", "buyuk", "kucuk", "gercek",
]);

function kelimeler(metin: string): string[] {
  return foldTurkish(metin)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Türkçe ekleri tolere eden kök eşleşmesi: ortak baş harf sayısı, kısa kelimenin
 * en az (uzunluk - 1) harfi ve en az 4 harf olmalı ("borc" ~ "borclandim", "cocuk" ~ "cocuguma").
 * 3 harfli kelimeler yalnızca birebir eşleşir.
 */
function kelimeEslesir(a: string, b: string): boolean {
  if (a === b) return true;
  const kisa = Math.min(a.length, b.length);
  if (kisa < 4) return false;
  let ortak = 0;
  while (ortak < kisa && a[ortak] === b[ortak]) ortak++;
  return ortak >= Math.max(4, kisa - 1);
}

/** Çok kelimeli ifade: kelimeleri sırayla, aralarında en fazla bir kelime boşlukla geçmeli. */
function ifadeEslesir(ifade: string[], mesaj: string[]): boolean {
  for (let i = 0; i < mesaj.length; i++) {
    if (!kelimeEslesir(ifade[0], mesaj[i])) continue;
    let j = i;
    let tamam = true;
    for (let k = 1; k < ifade.length; k++) {
      let bulundu = false;
      for (let s = j + 1; s <= Math.min(j + 2, mesaj.length - 1); s++) {
        if (kelimeEslesir(ifade[k], mesaj[s])) {
          j = s;
          bulundu = true;
          break;
        }
      }
      if (!bulundu) {
        tamam = false;
        break;
      }
    }
    if (tamam) return true;
  }
  return false;
}

interface Ifade {
  metin: string;
  parcalar: string[];
  bonus: number;
}

interface HazirMercek {
  mercek: Mercek;
  /** kelime -> ağırlık (tetikleyici kelimeleri, etiket ve ad kelimeleri; nadirliğe göre) */
  kelimeAgirligi: Map<string, number>;
  /** Merceğin adındaki kelimeler (adı doğrudan karşılanan mercek eşitlikte öne geçer) */
  adKelimeleri: Set<string>;
  ifadeler: Ifade[];
}

let hazirlik: HazirMercek[] | null = null;

function anlamli(parcalar: string[]): string[] {
  return parcalar.filter((p) => p.length >= 3 && !GENEL_KELIMELER.has(p));
}

function hazirla(): HazirMercek[] {
  if (hazirlik) return hazirlik;
  const ham = MERCEKLER.map((m) => {
    const tet = m.tetikleyiciler.map((t) => anlamli(kelimeler(t)));
    const etk = m.etiketler.map((e) => anlamli(kelimeler(e.replace(/_/g, " "))));
    const ad = anlamli(kelimeler(m.ad));
    return { m, tet, etk, ad };
  });

  // Belge sıklığı: bir kelime kaç mercekte geçiyor (çok yaygınsa ağırlığı düşer)
  const siklik = new Map<string, number>();
  for (const h of ham) {
    const gorulen = new Set<string>([...h.tet.flat(), ...h.etk.flat(), ...h.ad]);
    for (const p of gorulen) siklik.set(p, (siklik.get(p) ?? 0) + 1);
  }
  const N = ham.length || 1;
  const nadirlik = (p: string) => Math.min(1.5, Math.log(1 + N / (siklik.get(p) ?? 1)) / 2);
  // Merceklerin %6'sından fazlasında geçen kelime ayırt edici değildir ("olan", "baskalari" vb.)
  const yaygin = (p: string) => (siklik.get(p) ?? 0) > Math.max(8, N * 0.06);

  hazirlik = ham.map(({ m, tet, etk, ad }) => {
    const kelimeAgirligi = new Map<string, number>();
    const ekle = (p: string, temel: number) => {
      if (yaygin(p)) return;
      const w = temel * nadirlik(p);
      if (w > (kelimeAgirligi.get(p) ?? 0)) kelimeAgirligi.set(p, w);
    };
    tet.forEach((parcalar) => parcalar.forEach((p) => ekle(p, parcalar.length === 1 ? 1 : 0.7)));
    etk.forEach((parcalar) => parcalar.forEach((p) => ekle(p, 0.5)));
    ad.forEach((p) => ekle(p, 0.6));
    const ifadeler: Ifade[] = m.tetikleyiciler
      .map((t, i) => ({ metin: t, parcalar: tet[i], bonus: 1.5 }))
      .filter((f) => f.parcalar.length >= 2);
    return { mercek: m, kelimeAgirligi, adKelimeleri: new Set(ad.filter((p) => !yaygin(p))), ifadeler };
  });
  return hazirlik;
}

/** Hüküm soran mesaj ("caiz mi", "haram mı" ...): fetva sınırı merceklerden önce gelir. */
export function fetvaSorusuMu(mesaj: string): boolean {
  const k = foldTurkish(mesaj);
  return /\b(caiz|haram|helal|farz|vacip|mekruh|gunah|mubah)\s*(mi|mu|midir|mudur|degil\s*mi)\b/.test(k) ||
    /\b(fetva\w*|hukmu\s*nedir|dinen\s*(uygun|dogru|sakinca)\w*\s*m[iu]|nikah\w*\s*dus\w*|bosanmis\s*(say\w*|ol\w*)\s*m[iu])/.test(k);
}

/** Mesaja en uygun mercekleri döndürür (puana göre sıralı). Eşleşme yoksa boş dizi. */
export function mercekSec(girdi: MercekGirdisi): MercekSecimi[] {
  const mesaj = (girdi.mesaj || "").trim();
  if (!mesaj || girdi.ilimModu) return [];
  if (guvenlikOncelikliMi(mesaj)) return [];
  if (fetvaSorusuMu(mesaj)) return [];

  const sonuc = mercekPuanlari(mesaj).filter(
    (s) => s.puan >= MERCEK_ESIK && s.ifadeVar
  );
  if (sonuc.length === 0) return [];
  const enFazla = girdi.enFazla ?? 2;
  const secilen: MercekSecimi[] = [sonuc[0]];
  if (
    enFazla === 2 &&
    sonuc[1] &&
    sonuc[1].puan >= sonuc[0].puan * IKINCI_ORAN &&
    sonuc[1].kelimeSayisi >= IKINCI_EN_AZ_KELIME
  ) {
    secilen.push(sonuc[1]);
  }
  return secilen.map(({ mercek, puan, eslesenler }) => ({ mercek, puan, eslesenler }));
}

/**
 * Eşik uygulanmadan tüm merceklerin puanı (puanı sıfırdan büyük olanlar, sıralı).
 * Güvenlik süzgecini UYGULAMAZ; yalnızca ayar ve test içindir. Sohbet akışı mercekSec kullanır.
 */
export function mercekPuanlari(
  mesaj: string
): Array<MercekSecimi & { ifadeVar: boolean; kelimeSayisi: number }> {
  const genel = [...GENEL_KELIMELER];
  const mesajKelimeleri = kelimeler(mesaj || "").filter(
    (w) => w.length >= 3 && !genel.some((g) => g.length >= 4 && kelimeEslesir(g, w)) && !GENEL_KELIMELER.has(w)
  );
  if (mesajKelimeleri.length < 2) return [];

  const sonuc: Array<MercekSecimi & { ifadeVar: boolean; kelimeSayisi: number }> = [];
  for (const { mercek, kelimeAgirligi, adKelimeleri, ifadeler } of hazirla()) {
    if (mercek.hocaSozuKarsiligi) continue;
    let puan = 0;
    let ifadeVar = false;
    const eslesenler: string[] = [];
    const eslesenMesajKelimesi = new Set<number>();
    for (const [kelime, agirlik] of kelimeAgirligi) {
      const i = mesajKelimeleri.findIndex((w) => kelimeEslesir(kelime, w));
      if (i >= 0) {
        // Bir mesaj kelimesi aynı mercekte yalnızca bir kez (en yüksek ağırlıkla) sayılır
        if (eslesenMesajKelimesi.has(i)) continue;
        eslesenMesajKelimesi.add(i);
        puan += agirlik + (adKelimeleri.has(kelime) ? AD_BONUSU : 0);
        eslesenler.push(kelime);
      }
    }
    for (const f of ifadeler) {
      if (ifadeEslesir(f.parcalar, mesajKelimeleri)) {
        puan += f.bonus;
        ifadeVar = true;
        eslesenler.push(`"${f.metin}"`);
      }
    }
    if (puan > 0) {
      const tamEslesme = eslesenMesajKelimesi.size >= 2 || ifadeVar;
      sonuc.push({
        mercek,
        puan: Math.round(puan * 100) / 100,
        eslesenler,
        ifadeVar: tamEslesme,
        kelimeSayisi: eslesenMesajKelimesi.size,
      });
    }
  }

  sonuc.sort((a, b) => b.puan - a.puan || a.mercek.no - b.mercek.no);
  return sonuc;
}

function mercekSatiri(m: Mercek): string {
  return [
    `• ${m.ad}`,
    `  Teşhis: ${m.teshis}`,
    `  Cevap akışı: (1) ${m.giris} (2) ${m.irtibat} (3) ${m.pusulaNotu}`,
    `  Kaçın: ${m.yasaklar}`,
  ].join("\n");
}

/**
 * O tura eklenecek mercek bloğu. Eşleşme yoksa boş metin döner.
 */
export function mercekYonergesiKur(girdi: MercekGirdisi): string {
  const secim = mercekSec(girdi);
  if (secim.length === 0) return "";
  return `[BAKIŞ AÇISI (MERCEK) - güvenlik kuralları, fetva sınırı, üslup kuralları ve hoca sözleri bunun önündedir]:
${secim.map((s) => mercekSatiri(s.mercek)).join("\n")}
Kullanım: Bu bir bakış açısıdır, kalıp değildir. Yalnızca muhatabın hâline gerçekten uyuyorsa cevabın yönünü buna göre kur; uymuyorsa yok say. "Teşhis", "Giriş", "Pusula Notu" gibi başlıkları ve merceğin adını cevapta yazma. Muhatabı yargılama, suçlama; şefkatli ve vakur kal. Ayet ve hadisi yalnızca onaylı kaynaklar bölümünde varsa iktibas et; mercekten kaynak, numara veya söz uydurma.`;
}
