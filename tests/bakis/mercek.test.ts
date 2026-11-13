import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { ayristir, benzerlik, normalizeEt } from "../../src/lib/bakis/ayristirici";
import {
  MERCEKLER,
  fetvaSorusuMu,
  mercekSec,
  mercekYonergesiKur,
} from "../../src/lib/bakis/mercek-secici";
import { buildGeminiContents, type GenerateSirdasReplyParams } from "../../src/lib/ai/gemini-client";
import { SIRDAS_MANEVI_AYNA_INSTRUCTION } from "../../src/lib/ai/constitution";

const bekleyen: Array<{ no: number; ad: string }> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/data/bekleyen/bakis_acilari_sorulacak.json"), "utf8")
);

// --- Ayrıştırma ---------------------------------------------------------------

function blok(no: number, ad: string, govde: string, eksikPusula = false): string {
  return [
    `${no}. MERCEK: ${ad}`,
    `1. Mercek / Bakış Açısı Adı: ${ad}`,
    `2. RAG Etiketi (Dolap Gözü): [etiket_${no}, ortak]`,
    `3. Tetikleyici Anahtar Kelimeler: kelime${no}, ortak ifade`,
    `4. Arka Planda Çalışacak Teşhis Kuralı: ${govde}`,
    `5. Sistem Yanıt Tonu ve Sentez Kalıbı:`,
    `Giriş: ${govde} giriş.`,
    `Hakiki İrtibat: ${govde} irtibat.`,
    eksikPusula ? "" : `Pusula Notu: ${govde} pusula.`,
    `6. Yasaklı / Engellenecek Haller: Sert olmayacak.`,
  ].join("\n");
}

test("ayrıştırma: bloklar sayılır, birebir ve yakın tekrarlar ayıklanır, bozuk parça raporlanır", () => {
  const metin = [
    "BAKIŞ AÇILARI VE MERCEKLER KILAVUZU (deneme)",
    blok(1, "Sabır ve Şükür Merceği", "Sabrın kalbe verdiği genişliği ve şükrün bereketini anlatır"),
    blok(2, "Borç ve Sığınma Merceği", "Borç yükü altında daralan kalbin Rabbine sığınmasını anlatır"),
    // Aynı numara, birebir aynı içerik (kılavuzda 45-96 arası iki kez yapıştırılmış gibi)
    blok(1, "Sabır ve Şükür Merceği", "Sabrın kalbe verdiği genişliği ve şükrün bereketini anlatır"),
    // Farklı numara, neredeyse aynı içerik
    blok(9, "Sabır ve Şükrün Merceği", "Sabrın kalbe verdiği genişliği ve şükrün bereketini güzelce anlatır"),
    blok(3, "Eksik Parçalı Mercek", "Pusula notu unutulmuş bir parça", true),
  ].join("\n");

  const s = ayristir(metin);
  assert.equal(s.toplamBlok, 5);
  assert.deepEqual(
    s.net.map((m) => m.no),
    [1, 2, 3]
  );
  assert.equal(s.tekrarlar.length, 2);
  assert.ok(s.tekrarlar.some((t) => t.no === 1 && t.esiNo === 1 && t.birebir));
  assert.ok(s.tekrarlar.some((t) => t.no === 9 && t.esiNo === 1 && !t.birebir));
  // Birleşen tekrarın tetikleyicisi korunur
  assert.ok(s.net[0].tetikleyiciler.includes("kelime9"));
  assert.equal(s.bozuk.length, 1);
  assert.equal(s.bozuk[0].no, 3);
  assert.deepEqual(s.bozuk[0].eksik, ["pusulaNotu"]);
});

test("ayrıştırma: etiket alanındaki 'etiket:' öneki ve köşeli parantez temizlenir", () => {
  const metin = blok(5, "Uyku Merceği", "Uykunun küçük ölüm olduğunu anlatır").replace(
    "[etiket_5, ortak]",
    "etiket: [uyku_ve_vefat, olumun_yuzu]"
  );
  const s = ayristir(metin);
  assert.deepEqual(s.net[0].etiketler, ["uyku_ve_vefat", "olumun_yuzu"]);
});

test("benzerlik: kelime düzeyinde çalışır", () => {
  assert.equal(benzerlik(normalizeEt("a b c"), normalizeEt("a b c")), 1);
  assert.ok(benzerlik(normalizeEt("sabır şükür bereket"), normalizeEt("borç sığınma dua")) < 0.2);
});

// --- Derleme (denetimden geçenler) --------------------------------------------

test("derleme: 238 mercek (14.11 Adnan Bey elemesi sonrası), numaralar tekil, durumlar yalnızca TEMİZ / YUMUŞATILDI", () => {
  assert.equal(MERCEKLER.length, 238);
  const nolar = MERCEKLER.map((m) => m.no);
  assert.equal(new Set(nolar).size, nolar.length);
  for (const m of MERCEKLER) {
    assert.ok(m.durum === "TEMIZ" || m.durum === "YUMUSATILDI", `${m.no} durum`);
    for (const alan of ["ad", "teshis", "giris", "irtibat", "pusulaNotu", "yasaklar"] as const) {
      assert.ok(m[alan] && m[alan].length > 10, `${m.no} ${alan} boş`);
    }
    assert.ok(m.tetikleyiciler.length > 0, `${m.no} tetikleyici yok`);
  }
  assert.equal(MERCEKLER.filter((m) => m.durum === "TEMIZ").length, 105);
  assert.equal(MERCEKLER.filter((m) => m.durum === "YUMUSATILDI").length, 133);
});

test("derleme: Adnan Bey'e SORULACAK 25 mercek derlemede YOK, ayrı dosyada bekliyor", () => {
  assert.equal(bekleyen.length, 25);
  const derlemedekiler = new Set(MERCEKLER.map((m) => m.no));
  for (const b of bekleyen) assert.ok(!derlemedekiler.has(b.no), `SOR merceği ${b.no} derlemede`);
  // Örnek: tıp karşıtı ve kredi hükmü veren mercekler bekleyende
  for (const no of [3, 11, 79, 251, 279]) assert.ok(bekleyen.some((b) => b.no === no), `${no} bekleyende değil`);
  // Toplam: 238 + 25 = 263 net mercek (yeni kılavuz, 14.11)
  assert.equal(MERCEKLER.length + bekleyen.length, 263);
});

test("derleme: Adnan Bey'in 14.11'de çıkardığı mercekler derlemede ve bekleyende YOK", () => {
  // "BANA GÖRE ÇIKARILACAKLAR" listesi (36 numara) + yeni kılavuzdan sessizce çıkan 40 ve 288
  const adnanListesi = [
    303, 302, 301, 300, 299, 298, 297, 296, 295, 294, 293, 292, 291, 290, 289, 287, 286, 285, 284, 283, 282,
    266, 249, 260, 267, 254, 229, 176, 156, 153, 151, 87, 110, 5, 21, 28,
  ];
  assert.equal(new Set(adnanListesi).size, 36);
  // 87'nin yalnızca ikinci (tekrar) kopyası çıkarıldı; asıl kopya yeni kılavuzda duruyor, korunur.
  const korunan = new Set([87]);
  const derlemedekiler = new Set(MERCEKLER.map((m) => m.no));
  const bekleyendekiler = new Set(bekleyen.map((b) => b.no));
  for (const no of [...adnanListesi.filter((n) => !korunan.has(n)), 40, 288]) {
    assert.ok(!derlemedekiler.has(no), `${no} derlemede`);
    assert.ok(!bekleyendekiler.has(no), `${no} bekleyende`);
  }
  // Çıkarılan tekrarların yeni kılavuzda duran asıl kopyaları derlemede kalır
  for (const no of [87, 268, 269, 272, 273]) assert.ok(derlemedekiler.has(no), `asıl kopya ${no} yok`);
  // Ada göre de kontrol: çıkan merceklerin adları derlemede geçmez
  for (const ad of [
    "Kriz Anı Refleksi ve Hakiki İstiaze Merceği",
    "Kulun En Büyük Silahı: Hakiki İstiaze Merceği",
    "Endişe, Stres ve Kontrol Çabasından Teslimiyete Merceği",
    "Uçak Türbülansı ve Mutlak Kontrol Sahibi Merceği",
    "Varlığın Hakiki Sahibini İdrak Etmek Merceği",
    "Kalbin Tatmini Merceği",
    "Gelecek Kaygısı ve Kalemi Tutana Güven Merceği",
    "Kalabalıkta Yalnızlık ve Dostluk Kıtlığı Merceği",
    "Gece Yarısı Zihni Yorgunluğu ve Vesvese Nöbetleri Merceği",
    "Haklı Olduğunu Kanıtlama ve Susabilme Asaleti Merceği",
    "Yaşlılık ve Fani Bedenin İntikali Merceği",
    "Uhud'un Sırrı ve Toplumsal Sorumluluk Merceği",
  ]) {
    assert.ok(!MERCEKLER.some((m) => m.ad === ad), ad);
    assert.ok(!bekleyen.some((m) => m.ad === ad), ad);
  }
});

test("derleme: sert ve suçlayıcı talimatlar yumuşatıldı", () => {
  const tum = JSON.stringify(MERCEKLER).toLocaleLowerCase("tr-TR");
  for (const ifade of ["yüzüne vur", "silkele", "kıçı kırık", "ayna tut"]) {
    assert.ok(!tum.includes(ifade), ifade);
  }
});

test("derleme: Türkçe olmayan bozuk karakter yok", () => {
  const tum = JSON.stringify(MERCEKLER);
  for (const ch of tum) {
    const kod = ch.codePointAt(0) ?? 0;
    assert.ok(kod <= 0x17f || "âîûÂÎÛ“”‘’…".includes(ch), `bozuk karakter: ${ch}`);
  }
});

test("derleme: mercekler sistem talimatına yığılmadı", () => {
  assert.ok(!SIRDAS_MANEVI_AYNA_INSTRUCTION.includes(MERCEKLER[0].teshis));
  assert.ok(!SIRDAS_MANEVI_AYNA_INSTRUCTION.includes("BAKIŞ AÇISI (MERCEK)"));
});

// --- Seçici ---------------------------------------------------------------------

function secilen(mesaj: string): number[] {
  return mercekSec({ mesaj }).map((s) => s.mercek.no);
}

test("seçici: konuya uygun merceği bulur", () => {
  assert.equal(secilen("Oruç tutuyorum ama sadece aç kalıyorum gibi geliyor, ibadetlerim formalite oldu")[0], 2);
  assert.equal(secilen("Kardeşimle miras yüzünden küstük, haklı çıkmak için tartışıp duruyoruz")[0], 245);
  assert.equal(secilen("Yaşlandım artık işe yaramıyorum, emekli oldum boşlukta hissediyorum")[0], 262);
  assert.equal(secilen("Dükkanım batmak üzere, borçlarımı ödeyemezsem itibarım biter diye korkuyorum")[0], 244);
  assert.equal(secilen("Sosyal medyada herkesin hayatı mükemmel, kıyaslayıp kıskanıyorum")[0], 248);
  assert.equal(secilen("Çocuğuma çok bağırıyorum, ben ne dersem o olacak diyorum ama beni dinlemiyor")[0], 4);
});

test("seçici: en fazla 2 mercek döner, enFazla 1 ise tek", () => {
  for (const m of [
    "Sosyal medyada herkesin hayatı mükemmel, kıyaslayıp kıskanıyorum",
    "Dükkanım batmak üzere, borçlarımı ödeyemezsem itibarım biter diye korkuyorum",
  ]) {
    assert.ok(mercekSec({ mesaj: m }).length <= 2);
    assert.ok(mercekSec({ mesaj: m, enFazla: 1 }).length <= 1);
  }
});

test("seçici: eşleşme yoksa boş (gündelik mesajlar, selam)", () => {
  for (const m of [
    "Bugün hava çok güzeldi, pikniğe gittik",
    "Yarın toplantım var, sunum hazırlıyorum",
    "Arabamın lastiği patladı, tamirciye götürdüm",
    "Futbol maçını izledik, takımımız kazandı",
    "Yeni bir telefon aldım, kamerası güzel",
    "selam",
    "",
  ]) {
    assert.deepEqual(secilen(m), [], m);
    assert.equal(mercekYonergesiKur({ mesaj: m }), "", m);
  }
});

test("seçici: kriz, istismar ve sağlık mesajında mercek EKLENMEZ", () => {
  for (const m of [
    "Artık yaşamak istemiyorum, borçlarım yüzünden ölmek istiyorum",
    "Kendime zarar vermek istiyorum, dükkanım batmak üzere, borçlarımı ödeyemezsem itibarım biter",
    "Eşim bana vuruyor, haklı çıkmak için tartışıyoruz",
    "Göğsümde sıkışma var nefes alamıyorum, sosyal medyada herkes mutlu",
  ]) {
    assert.deepEqual(secilen(m), [], m);
    assert.equal(mercekYonergesiKur({ mesaj: m }), "", m);
  }
});

test("seçici: hüküm (fetva) sorusunda mercek eklenmez", () => {
  assert.ok(fetvaSorusuMu("Kredi çekmek haram mı?"));
  assert.ok(fetvaSorusuMu("Faiz caiz midir"));
  assert.ok(!fetvaSorusuMu("Borcum var, çok sıkıldım"));
  assert.deepEqual(secilen("Oruç tutarken ibadet formalite oldu, bu haram mı?"), []);
});

test("seçici: İlim ve Siyer modunda mercek eklenmez", () => {
  assert.deepEqual(
    mercekSec({ mesaj: "Oruç tutuyorum ama ibadetlerim formalite oldu", ilimModu: true }),
    []
  );
});

test("seçici: hoca sözleriyle çakışan mercekler seçilmez", () => {
  const hoca = MERCEKLER.filter((m) => m.hocaSozuKarsiligi);
  assert.deepEqual(
    hoca.map((m) => m.no).sort((a, b) => a - b),
    [57, 58, 64, 130, 149]
  );
  for (const m of [
    "Elimdeki imkânlar çok kısıtlı, kendimi yetersiz hissediyorum, büyük niyetler kurmaktan korkuyorum",
    "Geleceğimi planlamak için uykusuz geceler geçiriyorum, her şeyi kontrol etmek istiyorum",
    "Hırsım, mal mülk kaygım ve haksızlığa öfkem beni yoruyor",
  ]) {
    const nolar = secilen(m);
    for (const h of hoca) assert.ok(!nolar.includes(h.no), `${m} -> ${h.no}`);
  }
});

test("yönerge: kısa blok, öncelik notu ve kaynak uydurma yasağı içerir", () => {
  const y = mercekYonergesiKur({ mesaj: "Sosyal medyada herkesin hayatı mükemmel, kıyaslayıp kıskanıyorum" });
  assert.match(y, /^\[BAKIŞ AÇISI \(MERCEK\) - güvenlik kuralları, fetva sınırı/);
  assert.ok(y.includes("kaynak, numara veya söz uydurma"));
  assert.ok(y.includes("merceğin adını cevapta yazma"));
  assert.ok(y.length < 3200, `blok çok uzun: ${y.length}`);
  assert.ok(!/[—–]/.test(y.split("\n")[0]));
});

// --- Model girdisine eklenme (gerçek model çağrısı yok) --------------------------

function ornekParams(over: Partial<GenerateSirdasReplyParams>): GenerateSirdasReplyParams {
  return {
    userMessage: "Merhaba",
    userProfile: {},
    effectiveTone: "SEFKATLI_TESKIN",
    distressLevel: 3,
    isRibaShieldActive: false,
    nafsTrap: "DUNYALIK_KAYGI",
    ragCategory: "TESKIN_VE_TESELLI",
    ragChunks: [],
    conversationHistory: [],
    ...over,
  };
}

function sonKullaniciMetni(params: GenerateSirdasReplyParams): string {
  const contents = buildGeminiContents(params);
  const son = contents[contents.length - 1];
  return (son.parts || []).map((p) => p.text || "").join("\n");
}

test("model girdisi: uygun mesajda o tura mercek bloğu eklenir, kriz ve ilim modunda eklenmez", () => {
  const normal = sonKullaniciMetni(
    ornekParams({ userMessage: "Dükkanım batmak üzere, borçlarımı ödeyemezsem itibarım biter diye korkuyorum" })
  );
  assert.ok(normal.includes("[BAKIŞ AÇISI (MERCEK)"));
  assert.ok(normal.includes("İflas, Borç ve İtibar Korkusu"));

  const kriz = sonKullaniciMetni(
    ornekParams({ userMessage: "Artık yaşamak istemiyorum, dükkanım batmak üzere, itibarım biter diye korkuyorum", distressLevel: 10 })
  );
  assert.ok(!kriz.includes("[BAKIŞ AÇISI (MERCEK)"));

  const ilim = sonKullaniciMetni(
    ornekParams({
      userMessage: "Oruç tutuyorum ama ibadetlerim formalite oldu, öze nasıl inerim",
      intentMode: "ILIM_VE_SIYER",
    })
  );
  assert.ok(!ilim.includes("[BAKIŞ AÇISI (MERCEK)"));

  const selam = sonKullaniciMetni(ornekParams({ userMessage: "selam" }));
  assert.ok(!selam.includes("[BAKIŞ AÇISI (MERCEK)"));
});
