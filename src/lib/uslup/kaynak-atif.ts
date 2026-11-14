/**
 * Kaynak atfı sadakati: sahabe/âlim sözlerinin, atasözlerinin ve kaynağı belirsiz
 * sözlerin Peygamber Efendimiz'e (s.a.v.) "hadis" diye atfedilmesini önler.
 *
 * Olay (14.11): canlı model "Hesaba çekilmeden önce kendinizi hesaba çekin" sözünü
 * hadis diye verdi. Bu söz Hz. Ömer'e nispet edilir. Kasada bu söz İmam Gazalî'nin
 * İhyâ kaydında geçiyor ve o kayıt teknik olarak HADITH türüyle yükleniyor; model
 * bunu hadis sanabiliyor. Bu yüzden üç katman var:
 *  1) Sistem talimatına eklenen atıf kuralı + bilinen yanlış atıflar listesi.
 *  2) Kaynak bağlamında âlim eserlerinin "hadis değil" diye etiketlenmesi.
 *  3) Çıkış süzgecinde (cümle cümle) listedeki söz nebevi atıfla geçerse düzeltme.
 *
 * Listeye yalnızca hadis usulünde durumu açık ve yaygın kabul gören sözler girer.
 * Emin olunmayan söz listeye eklenmez.
 */

export interface YanlisAtif {
  /** Denetim ve test için kısa kod. */
  kod: string;
  /** Sözün yaygın Türkçe biçimi. */
  soz: string;
  /** Normalize edilmiş metin üzerinde sözü yakalayan desen. */
  desen: RegExp;
  /** Sözün doğru sahibi geçiyorsa cümle zaten doğrudur (normalize metin). */
  dogruSahipDeseni?: RegExp;
  /** Doğru atıf / hüküm (isteme yazılır). */
  hukum: string;
  /** Dayanak (isteme ve rapora yazılır). */
  dayanak: string;
  /** Çıkış süzgecinde yanlış atıflı cümlenin yerine konan metin. */
  yerine: string;
}

export const YANLIS_ATIFLAR: ReadonlyArray<YanlisAtif> = [
  {
    kod: "HESABA_CEKIN_HZ_OMER",
    soz: "Hesaba çekilmeden önce kendinizi hesaba çekin.",
    desen:
      /\bhesaba cekil\w*\s+(once|evvel)\w*\s+(kendi\w*\s+)?(kendi\w*|nefs\w*)\s+hesaba cek|\bhasibu\s+enfus/,
    dogruSahipDeseni: /\bomer\b|\bomerin\b|\bomere\b|\bfaruk\w*/,
    hukum: "Hz. Ömer'in (r.a.) sözüdür; merfu hadis değildir.",
    dayanak:
      "Tirmizî, Sıfatü'l-Kıyâme 25'te Peygamberimiz'in \"Akıllı kimse nefsini hesaba çekendir\" hadisinden sonra Hz. Ömer'in sözü olarak nakledilir.",
    yerine:
      "_\"Hesaba çekilmeden önce kendinizi hesaba çekin.\"_ Bu söz hadis değildir; Hz. Ömer'e (r.a.) nispet edilen bir söz olarak bilinir.",
  },
  {
    kod: "BESIKTEN_MEZARA_ILIM",
    soz: "Beşikten mezara kadar ilim öğreniniz.",
    desen: /\bbesikten\s+mezara\b/,
    hukum: "Hadis olarak sabit değildir.",
    dayanak: "Muteber hadis kaynaklarında senediyle yer almaz; hadis âlimleri hadis olarak kabul etmez.",
    yerine:
      "_\"Beşikten mezara kadar ilim öğreniniz.\"_ sözü halk arasında hadis diye bilinir; ancak hadis olarak sabit değildir. İlmin kıymeti ise Kur'an'da ve sahih hadislerde açıkça övülür.",
  },
  {
    kod: "ILIM_CINDE_DE_OLSA",
    soz: "İlim Çin'de de olsa arayınız.",
    desen: /\b(ilim\w*|ilm\w*)\b.*\bcin(de|e)\b|\bcin(de|e)\b.*\b(ilim\w*|ilm\w*)\b/,
    hukum: "Zayıf kabul edilir; bazı hadis âlimleri uydurma (mevzu) sayar.",
    dayanak:
      "Beyhakî (Şuabü'l-îmân) ve İbn Adî (el-Kâmil) zayıf senetle nakleder; İbnü'l-Cevzî el-Mevzûât'ta uydurma rivayetler arasında sayar.",
    yerine:
      "_\"İlim Çin'de de olsa arayınız.\"_ sözü halk arasında hadis diye bilinir; ancak hadis âlimleri bu rivayeti zayıf, bir kısmı da uydurma kabul eder. İlim öğrenmenin fazileti ise sahih hadislerle sabittir.",
  },
  {
    kod: "VATAN_SEVGISI_IMANDANDIR",
    soz: "Vatan sevgisi imandandır.",
    desen: /\bvatan\s+(sevgisi|muhabbeti|aski)\s+iman\w*|\bhubb\w*\s+(ul\s+|el\s+)?vatan\w*/,
    hukum: "Hadis olarak sabit değildir.",
    dayanak:
      "Sehâvî (el-Makâsıdü'l-hasene) bu söze hadis olarak rastlamadığını söyler; Sâgânî uydurma sözler arasında sayar.",
    yerine:
      "_\"Vatan sevgisi imandandır.\"_ sözü halk arasında hadis diye bilinir; ancak hadis olarak sabit değildir. Vatanını sevmek ise insanın fıtratındaki güzel bir duygudur.",
  },
];

/** Karşılaştırma için: Türkçe küçük harf, şapkasız, kesme ve işaretsiz, tek boşluk. */
export function atifNormalize(metin: string): string {
  return (metin || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (c) =>
      ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" })[c] ?? c
    )
    .replace(/['’`´]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Peygamberimiz'e veya hadise atıf işaretleri (normalize metin). */
const NEBEVI_ISARET =
  /\b(peygamber\w*|resul\w*|rasul\w*|efendimiz\w*|nebi\w*|nebev\w*|hz muhammed\w*|hazreti muhammed\w*|hadis\w*|s a v|sav|sallallahu\w*|aleyhisselam|buyur\w*|buyr\w*)\b/;

/** Cümlede sözün hadis olmadığı zaten söyleniyorsa dokunulmaz (normalize metin). */
const ZATEN_DUZELTILMIS =
  /\b(sabit degil\w*|hadis degil\w*|hadis olmadig\w*|uydurma\w*|mevzu\w*|zayif\w*|asli yok\w*|asli olmadig\w*|asli bulunma\w*|kaynagi (yok|belirsiz)\w*|hadis diye (bilin|dolas|anlat|soylen)\w*|hadis (zannedil|sanil)\w*|hadis olarak (bilin|dolas)\w*|nispet edil\w*|buyuklerimiz\w*|atasoz\w*)\b/;

/** "Peygamberimiz şöyle buyurur:" gibi bir sonraki cümleye alıntı açan giriş mi. */
export function nebeviGirisMi(cumle: string): boolean {
  const n = atifNormalize(cumle);
  if (!NEBEVI_ISARET.test(n)) return false;
  return /:\s*["'“_*]*\s*$/.test(cumle.trim()) || /\bsoyle\b/.test(n);
}

/**
 * Cümlede listedeki bir söz Peygamberimiz'e/hadise atfedilerek geçiyorsa o kaydı döndürür.
 * oncekiCumleNebeviGiris: bir önceki cümle "Efendimiz şöyle buyurur:" gibi bir girişse
 * ve söz bu cümlede kendi başına geçiyorsa da yanlış atıf sayılır.
 */
export function yanlisAtifBul(cumle: string, oncekiCumleNebeviGiris = false): YanlisAtif | null {
  const n = atifNormalize(cumle);
  if (!n) return null;
  for (const kayit of YANLIS_ATIFLAR) {
    if (!kayit.desen.test(n)) continue;
    if (ZATEN_DUZELTILMIS.test(n)) return null;
    if (kayit.dogruSahipDeseni?.test(n)) return null;
    if (NEBEVI_ISARET.test(n) || oncekiCumleNebeviGiris) return kayit;
    return null;
  }
  return null;
}

/**
 * Kasada HADITH türüyle yüklenen ama hadis olmayan âlim eserleri (İhyâ, akaid metinleri).
 * Kaynak bağlamında model bunları hadis sanmasın diye ayrı etiketlenir.
 */
export function alimEseriKaynagiMi(kaynak: {
  sourceType?: string;
  sourceTitle?: string;
  content?: string;
}): boolean {
  if ((kaynak.sourceType || "").toUpperCase() !== "HADITH") return false;
  const icerik = (kaynak.content || "").trimStart();
  if (/^(Ahlak ve Kalp Ameli|İtikad Esası)\s*:/u.test(icerik)) return true;
  return /ihy[aâ]|gazal[iî]|f[ıi]kh|tah[aâ]v[iî]|akaid|akîde|akide/iu.test(kaynak.sourceTitle || "");
}

/** Kaynak bağlamında âlim eserine gösterilen tür etiketi. */
export const ALIM_ESERI_ETIKETI = "ÂLİM ESERİ (hadis değildir)";

const listeSatirlari = YANLIS_ATIFLAR.map(
  (k) => `- "${k.soz.replace(/\.$/, "")}": ${k.hukum} Dayanak: ${k.dayanak}`
).join("\n");

/** Her iki modun sistem talimatına eklenen bölüm. */
export const KAYNAK_ATIF_BOLUMU = `## KAYNAK VE ATIF SADAKATİ (GÜVENLİK ÖNCELİK SIRASININ ALTINDADIR)
1. Bir sözü Peygamber Efendimiz'e (s.a.v.) yalnızca iki durumda atfet: (a) söz, bu konuşmada sana verilen kaynaklar arasında türü HADITH olan ve "Resûlullah (s.a.v.) buyurdu" diye başlayan bir kayıtta geçiyorsa; (b) temel hadis kaynaklarında (Buhârî, Müslim vb.) geçtiğinden emin olduğun, çok bilinen sahih bir hadisse.
2. "${ALIM_ESERI_ETIKETI}" etiketli kaynaklar (İmam Gazalî'nin İhyâ'sı, akaid metinleri vb.) hadis değildir. İçlerindeki sözü "hadis-i şerif", "Peygamberimiz buyurdu" diye sunma; söz sahibini biliyorsan ona, bilmiyorsan eserin müellifine nispet et.
3. Sahabe ve âlim sözlerini, atasözlerini ve kaynağından emin olmadığın hikmetli sözleri "hadis", "Resulullah buyurdu", "Efendimiz buyuruyor" diye verme. Sahibi kesin biliniyorsa ona nispet et ("Hz. Ömer'e nispet edilen söz"); bilinmiyorsa yumuşak ver ("büyüklerimizin güzel bir sözü", "hikmet ehlinin dediği gibi").
4. Kaynak, kitap, bab veya hadis numarası uydurma. Emin değilsen numara yazma; şüpheli bir sözü hadis diye güçlendirmektense hiç kullanma.
5. Aşağıdaki sözler halk arasında hadis diye bilinir ama hadis değildir; bunları Peygamberimiz'e ATFETME (sorulursa durumlarını nazikçe açıkla):
${listeSatirlari}
6. Tirmizî'deki "Akıllı kimse nefsini hesaba çeken ve ölümden sonrası için çalışandır" hadisi ile Hz. Ömer'in "Hesaba çekilmeden önce kendinizi hesaba çekin" sözü ayrı şeylerdir; ikisini birbirine karıştırma.`;
