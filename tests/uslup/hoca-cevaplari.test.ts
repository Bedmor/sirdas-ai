import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HOCA_BENZERLIK_ESIGI,
  HOCA_KUME_AZAMI_UZUNLUK,
  HOCA_SORU_CEVAPLARI,
  hocaCevabiBul,
  hocaCevabiKalkani,
  hocaCevabiKuraliMi,
} from "../../src/lib/uslup/hoca-cevaplari";
import { runSafetyTriage } from "../../src/lib/safety/triage";
import { buildSafetyIntercept } from "../../src/lib/safety/intercept";
import { evaluateSpiritualGuardrails } from "../../src/lib/ai/rag-pipeline";
import { runHeuristicFallback } from "../../src/lib/ai/jev-client";

// Kaynak metindeki (13.11 yaması) cevaplar, kelimesi kelimesine.
const BEKLENEN = {
  HOCA_QA_01:
    "Ahirette en büyük pişmanlık niyetini küçük tutmaktan meydana gelecek. Sana ait olmayan yetersizliklerinle niyetine hudutlar koyma. Sen niyetini büyük tut. Sana imkânlar yaratacak olan Allah azze ve celle.",
  HOCA_QA_02:
    "Siz idareyi Allah'a bırakırsanız, Allah'a teslim olursanız, o zaman Allah her yerde sizinle beraber olur. Günlük hayatımızda hepimizin talepleri, istekleri var. Planlar yaparsınız. Uykusuz geceleriniz olur. Halbuki Allah'a tevekkül ederseniz, işi Allah'a bırakırsanız Allah sizin istediğiniz biçimde o kadar güzel çözüme ulaştırır ki siz bile şaşarsınız. Ama insanlar dünyaya çok önem verdikleri için hayatları dünyaya harcadıkları, dünyayı tercih ettikleri için Allah diyor ki, dur bakalım Rabbim evvela ben dünya işimi yapayım sonra senin işini yapacağım. Allah da onlara diyor ki ey kulum sen bana yönel ben senin işini yapayım. Ne dersiniz, hangisi daha kolay?",
  HOCA_QA_03:
    "Bu dünyada tek bir gerçek var. O da ölüm. Başka bir şey yok. Hastalık yalan; iyileşince geçiyor, iyileşemedin, ölünce bitiyor. Topal ölsen ahirette yürüyeceksin. Kör olsan ahirette göreceksin. Her şey yalan: para yalan, sıhhat yalan, mal, mülk, çoluk çocuk yalan. Ne var? Tek gerçek ölüm var. Tek gerçek Allah. Allah bu ölümü unutmadan yaşayanlardan eylesin bizi. Ölüm olduğunu unutmazsan Dünya sevgin çok olmaz. Ölüm olduğunu unutmazsan birine kötülük yapmaktan elini geri çekersin. Hesap var dersin. Ölüm olduğunu unutmazsan biri sana zarar verdiğinde nasıl olsa ahirette alacağız deyip aşırıya gitmezsin. Allah canımızı en hayırlı günümüzde alsın ve yaptığımız işi ölürken en hayırlı iş yapsın.",
} as const;
type Kimlik = keyof typeof BEKLENEN;

const SORU_1 =
  "Elimdeki imkanlar çok kısıtlı, kendimi sürekli yetersiz hissediyorum. Büyük niyetler kurmaktan, büyük adımlar atmaktan korkuyorum. Ne tavsiye edersin?";
const SORU_2 =
  "Geleceğimi planlamak ve her şeyi kontrol altında tutmak için sürekli uykusuz geceler geçiriyorum, sırtımdaki dünya yükü beni çok yordu. Bu kaygıdan nasıl kurtulurum?";
const SORU_3 =
  "Dünyadaki hırsım, mal mülk kaygılarım ve insanlardan gördüğüm haksızlıklar karşısındaki öfkem beni çok yoruyor. Bu geçici dünyada kalbimi hakikate ve sükûnete nasıl bağlarım?";

/** route.ts içindeki kalkan zincirinin aynısı. */
function zincir(mesaj: string, ilimModu = false) {
  const triage = runSafetyTriage(mesaj);
  const jev = runHeuristicFallback(mesaj);
  return (
    buildSafetyIntercept(triage, jev) ??
    evaluateSpiritualGuardrails(mesaj, jev) ??
    hocaCevabiKalkani(mesaj, triage, jev, ilimModu)
  );
}

test("hoca cevapları: eşik ve kelime kümesi sabitleri değişmedi", () => {
  assert.equal(HOCA_BENZERLIK_ESIGI, 0.72);
  assert.equal(HOCA_KUME_AZAMI_UZUNLUK, 400);
  const ozet = HOCA_SORU_CEVAPLARI.map((q) => ({
    kimlik: q.kimlik,
    kumeler: q.kumeler.map((k) => k.ad),
    zorunlu: q.zorunlu,
    enAz: q.enAz,
  }));
  assert.deepEqual(ozet, [
    {
      kimlik: "HOCA_QA_01",
      kumeler: ["imkan", "yetersizlik", "büyük niyet/adım", "korku/çekinme"],
      zorunlu: ["büyük niyet/adım"],
      enAz: 3,
    },
    {
      kimlik: "HOCA_QA_02",
      kumeler: ["gelecek/plan", "kontrol", "uykusuzluk", "kaygı/yük"],
      zorunlu: ["kontrol"],
      enAz: 3,
    },
    {
      kimlik: "HOCA_QA_03",
      kumeler: ["hırs", "mal mülk", "haksızlık", "öfke/intikam", "kalp sükûneti"],
      zorunlu: [],
      enAz: 4,
    },
  ]);
});

test("hoca cevapları: cevap metinleri kaynaktakiyle birebir aynı, hoca adı yok", () => {
  for (const q of HOCA_SORU_CEVAPLARI) {
    assert.equal(q.cevap, BEKLENEN[q.kimlik], q.kimlik);
    assert.ok(!/Halis|Aydemir|hoca/i.test(q.cevap), q.kimlik);
  }
});

test("hoca cevapları: üç sorunun birebir hâli doğru cevabı ve tam metni verir", () => {
  const ciftler: Array<[string, Kimlik]> = [
    [SORU_1, "HOCA_QA_01"],
    [SORU_2, "HOCA_QA_02"],
    [SORU_3, "HOCA_QA_03"],
  ];
  for (const [soru, kimlik] of ciftler) {
    const e = hocaCevabiBul(soru);
    assert.ok(e, kimlik);
    assert.equal(e.kimlik, kimlik);
    assert.equal(e.yontem, "BENZERLIK");
    assert.ok(e.benzerlik > 0.99, `${kimlik} ${e.benzerlik}`);

    const k = zincir(soru);
    assert.ok(k, `${kimlik} zincirde yakalanmalı`);
    assert.equal(k.ruleId, kimlik);
    assert.equal(k.status, "processed");
    assert.equal(k.replyText, BEKLENEN[kimlik], "önüne/arkasına metin eklenmez");
    assert.ok(hocaCevabiKuraliMi(k.ruleId));

    // Akıştaki parçalama (route.ts) metni değiştirmeden geri birleştirir.
    const parcalar = k.replyText.match(/\S+\s*/g) || [k.replyText];
    assert.equal(parcalar.join(""), BEKLENEN[kimlik]);
  }
});

test("hoca cevapları: küçük yazım, büyük-küçük harf, noktalama ve Türkçe karakter farkı eşleşir", () => {
  const varyantlar: Array<[Kimlik, string]> = [
    ["HOCA_QA_01", SORU_1.toLocaleUpperCase("tr-TR")],
    ["HOCA_QA_01", "elimdeki imkanlar cok kisitli kendimi surekli yetersiz hissediyorum buyuk niyetler kurmaktan buyuk adimlar atmaktan korkuyorum ne tavsiye edersin"],
    ["HOCA_QA_01", "Elimdeki imkânlar çok kısıtlı, kendimi sürekli yetersiz hisediyorum. Büyük niyetler kurmakdan, büyük adımlar atmakdan korkuyorum ne tavsiye edersiniz"],
    ["HOCA_QA_01", "Elimdeki imkanlar kısıtlı, yetersiz hissediyorum, büyük niyetler etmekten çekiniyorum"],
    ["HOCA_QA_02", "geleceğimi planlamak ve her seyi kontrol altinda tutmak icin surekli uykusuz geceler geciriyorum sirtimdaki dunya yuku beni cok yordu bu kaygidan nasil kurtulurum"],
    ["HOCA_QA_02", "Geleceğimi planlamaktan uykusuz geceler geçiriyorum, her şeyi kontrol etmeye çalışmaktan yoruldum"],
    ["HOCA_QA_03", "DÜNYADAKİ HIRSIM, MAL MÜLK KAYGILARIM VE İNSANLARDAN GÖRDÜĞÜM HAKSIZLIKLAR KARŞISINDAKİ ÖFKEM BENİ ÇOK YORUYOR!!"],
    ["HOCA_QA_03", "Dunyaya cok baglaniyorum, hirslarim ve ugradigim haksizliklar karsisindaki ofkem beni yoruyor, kalbimi nasil sakinlestiririm"],
  ];
  for (const [kimlik, mesaj] of varyantlar) {
    const k = zincir(mesaj);
    assert.ok(k, `eşleşmeli: ${mesaj}`);
    assert.equal(k.ruleId, kimlik, mesaj);
    assert.equal(k.replyText, BEKLENEN[kimlik]);
  }
});

test("hoca cevapları: aynı anlamı taşıyan farklı cümleler kelime kümeleriyle eşleşir", () => {
  const anlam: Array<[Kimlik, string]> = [
    ["HOCA_QA_01", "İmkanlarım kısıtlı olduğu için büyük niyet etmekten korkuyorum, ne yapayım?"],
    ["HOCA_QA_01", "Kendimi hep yetersiz görüyorum, büyük adım atmaya cesaret edemiyorum, niyetlerimi hep küçük tutuyorum"],
    ["HOCA_QA_02", "Her şeyi kontrol etmek istiyorum, gelecek kaygısından geceleri uyuyamıyorum"],
    ["HOCA_QA_03", "Hırsım ve haksızlığa uğradığım için içimdeki öfke kalbimi yoruyor, nasıl huzur bulurum?"],
  ];
  for (const [kimlik, mesaj] of anlam) {
    const e = hocaCevabiBul(mesaj);
    assert.ok(e, `eşleşmeli: ${mesaj}`);
    assert.equal(e.kimlik, kimlik, mesaj);
    const k = zincir(mesaj);
    assert.ok(k, `zincirde eşleşmeli: ${mesaj}`);
    assert.equal(k.ruleId, kimlik, mesaj);
  }
});

test("hoca cevapları: alakasız ve genel mesajlar eşleşmez", () => {
  const alakasiz = [
    "yorgunum",
    "Çok yorgunum bugün, hiçbir şey yapmak istemiyorum",
    "Selam, nasılsın?",
    "Geceleri uyuyamıyorum, ne yapmalıyım?",
    "Kendimi yetersiz hissediyorum",
    "İmkanlarım kısıtlı ama mutluyum",
    "Bugün çok öfkeliyim, işte biri bana haksızlık yaptı",
    "Gelecek planlarımı nasıl yapmalıyım, hangi bölümü seçeyim?",
    "Namaz kılarken niyet nasıl edilir?",
    "Oruç niyeti sahura kalkmadan geçerli olur mu?",
    "Para kazanmak için ne yapmalıyım, mal mülk sahibi olmak istiyorum",
    "Sabır hakkında bir ayet söyler misin?",
    "Annemle aram bozuk, ona nasıl yaklaşmalıyım?",
    "Teşekkür ederim, Allah razı olsun",
  ];
  for (const mesaj of alakasiz) {
    assert.equal(hocaCevabiBul(mesaj), null, mesaj);
    const k = zincir(mesaj);
    assert.ok(!k || !hocaCevabiKuraliMi(k.ruleId), mesaj);
  }
});

test("hoca cevapları: kriz, şiddet, çocuk, sağlık ve yas işaretinde birebir cevap verilmez", () => {
  const riskli = [
    `${SORU_1} Artık yaşamak istemiyorum, kendimi öldürmek istiyorum.`,
    `${SORU_3} Bazen intihar etmeyi düşünüyorum.`,
    `${SORU_3} Eşim beni dövüyor.`,
    `${SORU_2} 10 yaşındayım.`,
    `${SORU_2} Göğsümde şiddetli ağrı var, nefes alamıyorum.`,
    `${SORU_3} Babamı geçen hafta kaybettim.`,
    `${SORU_3} Annem kanser teşhisi aldı.`,
  ];
  for (const mesaj of riskli) {
    assert.equal(
      hocaCevabiKalkani(mesaj, runSafetyTriage(mesaj), runHeuristicFallback(mesaj)),
      null,
      mesaj
    );
    const k = zincir(mesaj);
    assert.ok(!k || !hocaCevabiKuraliMi(k.ruleId), `güvenlik önce gelmeli: ${mesaj}`);
  }
  // Kriz mesajında güvenlik akışı devreye girer.
  const kriz = zincir(`${SORU_1} Artık yaşamak istemiyorum, kendimi öldürmek istiyorum.`);
  assert.ok(kriz);
  assert.equal(kriz.status, "crisis_redirected");
});

test("hoca cevapları: güvenlik dipnotu, ilim modu veya en yüksek sıkıntıda eşleşmez", () => {
  const jev = runHeuristicFallback(SORU_1);
  const dipnotlu = runSafetyTriage("Namaz kılmasam günah olur mu, caiz mi?");
  assert.ok(dipnotlu, "fetva dipnotu örneği süzgeçte yakalanmalı");
  assert.equal(hocaCevabiKalkani(SORU_1, dipnotlu, jev), null);
  assert.equal(hocaCevabiKalkani(SORU_1, null, jev, true), null);
  assert.equal(hocaCevabiKalkani(SORU_1, null, { ...jev, distress_level: 10 }), null);
});

test("hoca cevapları: konuşmanın ortasında sorulsa da eşleşir", () => {
  const gecmis = [
    { role: "user", content: "Selam" },
    { role: "assistant", content: "Aleykümselam, hoş geldin." },
    { role: "user", content: "İşte bugün zor bir gün geçirdim." },
    { role: "assistant", content: "Anlatmak ister misin?" },
  ];
  for (const [soru, kimlik] of [
    [SORU_1, "HOCA_QA_01"],
    [SORU_2, "HOCA_QA_02"],
    [SORU_3, "HOCA_QA_03"],
  ] as Array<[string, Kimlik]>) {
    const jev = runHeuristicFallback(soru, gecmis);
    const k = hocaCevabiKalkani(soru, runSafetyTriage(soru), jev);
    assert.ok(k, kimlik);
    assert.equal(k.replyText, BEKLENEN[kimlik]);
  }
});
