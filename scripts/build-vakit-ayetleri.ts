/**
 * Vakit ayeti kartı için küçük veri dosyasını üretir.
 *
 * Kaynak: src/data/corpus/quran_full_corpus.json (quran.com API v4, Diyanet meali).
 * Yeni metin yazılmaz; yalnızca aşağıdaki listede adı geçen ayetlerin
 * Arapça metni ve Diyanet meali birebir kopyalanır.
 *
 * Seçim ölçütü: meali, ilgili günün vaktini (seher, sabah, kuşluk, ikindi,
 * akşam, gece) doğrudan anan ayetler. Liste hoca kontrolüne açıktır.
 *
 * Çalıştırma: npx tsx scripts/build-vakit-ayetleri.ts
 */
import fs from "fs";
import path from "path";

type Verse = {
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  translation_tr: string;
};
type Surah = { surah_id: number; name_turkish: string; verses: Verse[] };

// Dilim anahtarı -> ayet anahtarları (sure:ayet). Diyanet mealinde birleşik
// verilen ayetler (ör. 30:17-18) otomatik olarak aralık şeklinde alınır.
const SECIM: Record<string, string[]> = {
  seher: ["51:17", "3:17", "17:79", "73:6"],
  sabah: ["6:96", "30:17", "76:25"],
  kusluk: ["93:1", "24:36"],
  ikindi: ["103:1", "20:130", "50:39"],
  aksam: ["11:114", "28:73"],
  gece: ["92:1", "76:26", "25:64", "73:1", "52:48"],
};

const root = process.cwd();
const corpus = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/corpus/quran_full_corpus.json"), "utf-8")
) as { surahs: Surah[]; source: string };

function bul(key: string) {
  const [s, a] = key.split(":").map(Number);
  const surah = corpus.surahs.find((x) => x.surah_id === s);
  if (!surah) throw new Error(`Sure bulunamadı: ${key}`);
  const idx = surah.verses.findIndex((v) => v.verse_number === a);
  if (idx < 0) throw new Error(`Ayet bulunamadı: ${key}`);
  const meal = surah.verses[idx].translation_tr.trim();

  // Diyanet mealinde bazı ayetler tek metin olarak birleşik verilir;
  // aynı meali taşıyan komşu ayetleri birlikte al.
  let bas = idx;
  let son = idx;
  while (bas > 0 && surah.verses[bas - 1].translation_tr.trim() === meal) bas--;
  while (son < surah.verses.length - 1 && surah.verses[son + 1].translation_tr.trim() === meal) son++;
  const ayetler = surah.verses.slice(bas, son + 1);
  const ilk = ayetler[0].verse_number;
  const sonNo = ayetler[ayetler.length - 1].verse_number;
  return {
    anahtar: ilk === sonNo ? `${s}:${ilk}` : `${s}:${ilk}-${sonNo}`,
    sure: surah.name_turkish,
    sureNo: s,
    ayet: ilk === sonNo ? `${ilk}` : `${ilk}-${sonNo}`,
    arapca: ayetler.map((v) => v.text_uthmani.trim()).join(" "),
    meal,
  };
}

// İki ayetin birlikte okunması gereken yerler: ilk ayetin ardından gelen ayeti ekle.
const BIRLIKTE: Record<string, string> = {
  "51:17": "51:18",
  "93:1": "93:3",
  "92:1": "92:2",
  "103:1": "103:3",
  "52:48": "52:49",
};

function kayit(key: string) {
  const ana = bul(key);
  const ek = BIRLIKTE[key];
  if (!ek) return ana;
  const [s, a1] = key.split(":").map(Number);
  const a2 = Number(ek.split(":")[1]);
  const parcalar = [] as ReturnType<typeof bul>[];
  for (let a = a1; a <= a2; a++) parcalar.push(bul(`${s}:${a}`));
  return {
    anahtar: `${s}:${a1}-${a2}`,
    sure: ana.sure,
    sureNo: s,
    ayet: `${a1}-${a2}`,
    arapca: parcalar.map((p) => p.arapca).join(" "),
    meal: parcalar.map((p) => p.meal).join(" "),
  };
}

const cikti = {
  kaynak: corpus.source,
  not: "Metinler quran_full_corpus.json dosyasından birebir alınmıştır (Diyanet meali). Seçim listesi hoca kontrolüne açıktır.",
  dilimler: Object.fromEntries(
    Object.entries(SECIM).map(([dilim, keys]) => [dilim, keys.map(kayit)])
  ),
};

const hedef = path.join(root, "src/data/vakit-ayetleri.json");
fs.writeFileSync(hedef, JSON.stringify(cikti, null, 2) + "\n", "utf-8");
console.log(`Yazıldı: ${hedef}`);
