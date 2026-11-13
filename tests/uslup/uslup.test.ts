import { test } from "node:test";
import assert from "node:assert/strict";
import {
  benzerlik,
  donguTespit,
  geceGecSaatMi,
  gecmisYukuTespit,
  kapanisTespit,
  kurguMizahTespit,
  kusakTespit,
  oncekiAcilislar,
  sessizKarartmaTespit,
  turkiyeSaati,
  uslupAnalizEt,
  uslupYonergesiKur,
  yalnizlastirmaTespit,
  USLUP_SISTEM_BOLUMU,
} from "../../src/lib/uslup";
import {
  SIRDAS_ILIM_VE_SIYER_INSTRUCTION,
  SIRDAS_MANEVI_AYNA_INSTRUCTION,
} from "../../src/lib/ai/constitution";
import { buildGeminiContents, type GenerateSirdasReplyParams } from "../../src/lib/ai/gemini-client";

// --- Kurgu ve mizah --------------------------------------------------------

test("kurgu: bariz absürt senaryolar yakalanır", () => {
  for (const msg of [
    "Bir ejderha ile ortak kuru temizleme dükkanı açmayı planlıyoruz, hangi ölçekte vergi levhası almalıyız?",
    "Mars'ta kolonide yaşıyorum, Phobos ve Deimos'un dedikodusunu dinliyorum",
    "Zaman makinesiyle Osmanlı'ya gitsem ne yaparım",
    "Uzaylılar beni kaçırdı, gemide çay var mı acaba",
    "Kedim vergi veren kedi oldu, zengin olduk",
  ]) {
    const r = kurguMizahTespit(msg);
    assert.equal(r.kurgu, true, `Kurgu bekleniyordu: "${msg}"`);
    assert.ok(r.isaretler.length > 0);
  }
});

test("kurgu: içindeki gerçek dini soru ayrıca işaretlenir", () => {
  const r = kurguMizahTespit("Mars'ta yaşıyorum, kıble ne tarafta ve namaz vakitleri nasıl olur?");
  assert.equal(r.kurgu, true);
  assert.equal(r.gercekDiniSoru, true);
  const r2 = kurguMizahTespit("Ejderhamla kuru temizleme dükkanı açtık, tavan yandı");
  assert.equal(r2.gercekDiniSoru, false);
});

test("kurgu: sıradan dertler ve marş/cin gibi gerçek konular kurgu sayılmaz", () => {
  for (const msg of [
    "İşimi kaybettim, borçlarım birikti, çok sıkıntıdayım",
    "İstiklal Marşı'nı okurken ağladım",
    "Cinlerden korkuyorum, korunma duası var mı",
    "Martta düğünümüz var, heyecanlıyım",
    "Robot süpürge aldım, eşim çok sevindi",
  ]) {
    assert.equal(kurguMizahTespit(msg).kurgu, false, `Yanlış kurgu: "${msg}"`);
  }
});

test("kriz ve sağlık mesajı kurgu kelimesi içerse bile kurgu sanılmaz", () => {
  for (const msg of [
    "Mars'a gitmek istiyorum çünkü artık yaşamak istemiyorum",
    "Ejderha gibi göğsüm sıkışıyor, nefes alamıyorum",
    "Uzaylı şakası değil, kendimi öldürmek istiyorum",
    "Zombi gibiyim, başım çok ağrıyor",
  ]) {
    const r = kurguMizahTespit(msg);
    assert.equal(r.kurgu, false, `Kriz/sağlık kurgu sanıldı: "${msg}"`);
    const yonerge = uslupYonergesiKur({ mesaj: msg });
    assert.ok(!yonerge.includes("KURGU / MİZAH"), `Kurgu yönergesi eklendi: "${msg}"`);
  }
});

test("yaş çelişkisi: küçük yaş + yetişkin konusu işaretlenir", () => {
  const r = kurguMizahTespit("2 yaşındayım, kredi borcum var, patronum maaşımı vermiyor");
  assert.equal(r.yasCeliskisi, true);
  assert.equal(kurguMizahTespit("35 yaşındayım, kredi borcum var").yasCeliskisi, false);
});

// --- Gece saati -----------------------------------------------------------

test("gece saati: 00:30 - 04:59 arası gece sayılır", () => {
  assert.equal(geceGecSaatMi(0, 29), false);
  assert.equal(geceGecSaatMi(0, 30), true);
  assert.equal(geceGecSaatMi(2, 0), true);
  assert.equal(geceGecSaatMi(4, 59), true);
  assert.equal(geceGecSaatMi(5, 0), false);
  assert.equal(geceGecSaatMi(23, 45), false);
  assert.equal(geceGecSaatMi(Number.NaN, 0), false);
});

test("gece saati: Türkiye saati UTC+3 hesaplanır", () => {
  // 22:30 UTC = 01:30 İstanbul
  const t = turkiyeSaati(new Date(Date.UTC(2026, 10, 13, 22, 30)));
  assert.deepEqual(t, { saat: 1, dakika: 30 });
  assert.equal(geceGecSaatMi(t.saat, t.dakika), true);
});

test("gece yorgunluğu yönergesi: gece + fesih kapalıyken eklenir, fesih açıksa eklenmez", () => {
  const gecmis = [
    { role: "user" as const, content: "Bugün iş yerinde çok yoruldum" },
    { role: "assistant" as const, content: "Yorgunluğun geçsin kardeşim." },
  ];
  const acik = uslupYonergesiKur({ mesaj: "Uyuyamıyorum, aklım iş yerinde", gecmis, geceGecSaat: true });
  assert.ok(acik.includes("GECE YORGUNLUĞU"));
  const fesih = uslupYonergesiKur({
    mesaj: "Uyuyamıyorum, aklım iş yerinde",
    gecmis,
    geceGecSaat: true,
    geceFesihAktif: true,
  });
  assert.ok(!fesih.includes("GECE YORGUNLUĞU"));
  const gunduz = uslupYonergesiKur({ mesaj: "Uyuyamıyorum, aklım iş yerinde", gecmis, geceGecSaat: false });
  assert.ok(!gunduz.includes("GECE YORGUNLUĞU"));
});

test("uzun oturum: gündüz 20+ mesajda mola daveti", () => {
  const gecmis = [{ role: "user" as const, content: "Merhaba" }];
  const y = uslupYonergesiKur({ mesaj: "Annemle aram yine bozuk", gecmis, oturumMesajSayisi: 22 });
  assert.ok(y.includes("UZUN OTURUM"));
});

// --- Döngü tespiti --------------------------------------------------------

test("döngü: aynı dert tekrar edilince yakalanır", () => {
  const onceki = [
    "Eşimle sürekli kavga ediyoruz, evde huzur kalmadı, ne yapacağımı bilmiyorum",
    "Bugün hava güzeldi",
  ];
  const r = donguTespit("Eşimle yine kavga ettik, evde hiç huzur kalmadı, ne yapacağım bilmiyorum", onceki);
  assert.equal(r.dongu, true, `benzerlik ${r.enYuksekBenzerlik}`);
});

test("döngü: iki mesajda orta benzerlik de döngü sayılır", () => {
  const onceki = [
    "Borçlarım yüzünden çok korkuyorum",
    "Geceleri uyku tutmuyor, kafam",
  ];
  const r = donguTespit("Borçlarım yüzünden geceleri uyku yok", onceki);
  assert.equal(r.dongu, true, `benzerlik ${r.enYuksekBenzerlik} sayı ${r.benzerMesajSayisi}`);
});

test("döngü: farklı konular ve kısa mesajlar döngü sayılmaz", () => {
  assert.equal(
    donguTespit("Hicret neden yapıldı, kısaca anlatır mısın", ["Annem hastanede yatıyor, çok korkuyorum"]).dongu,
    false
  );
  assert.equal(donguTespit("teşekkürler", ["teşekkürler"]).dongu, false);
  assert.ok(benzerlik("evde huzur yok", "evde huzur yok") === 1);
});

test("döngü: kriz mesajında döngü kesici devreye girmez", () => {
  const gecmis = [{ role: "user" as const, content: "Artık yaşamak istemiyorum, her şey üstüme geliyor" }];
  const a = uslupAnalizEt({ mesaj: "Artık yaşamak istemiyorum, her şey üstüme geliyor", gecmis });
  assert.equal(a.dongu, false);
  assert.equal(a.guvenlikOncelikli, true);
});

// --- Kalıp, yalnızlaştırma, kapanış, geçmiş, kuşak ------------------------

test("kalıp yasağı: önceki açılışlar çıkarılır", () => {
  const acilis = oncekiAcilislar([
    "Aziz kardeşim, gönlünü yoran bu yük çok ağır. Rabbim kolaylık versin.",
    "**Aziz kardeşim**, yine buradasın!",
  ]);
  assert.deepEqual(acilis, ["Aziz kardeşim, gönlünü yoran bu yük çok ağır", "Aziz kardeşim, yine buradasın"]);
});

test("yalnızlaştırma: bağımlılık dili yakalanır", () => {
  for (const msg of [
    "Benim tek sırdaşım sensin",
    "Senden başka kimsem yok",
    "Kimseye güvenmiyorum, sadece seninle konuşuyorum",
    "Herkesten koptum",
  ]) {
    assert.equal(yalnizlastirmaTespit(msg), true, msg);
  }
  assert.equal(yalnizlastirmaTespit("Ailemle birlikte umreye gidiyoruz"), false);
});

test("kapanış, geçmiş yükü, sessiz karartma ve kuşak işaretleri", () => {
  assert.equal(kapanisTespit("Çok teşekkür ederim, Allah razı olsun"), true);
  assert.equal(kapanisTespit("Teşekkür ederim ama hâlâ çok korkuyorum, eşim beni anlamıyor ve evde sürekli kavga var"), false);
  assert.equal(gecmisYukuTespit("Keşke o gün babamı kırmasaydım"), true);
  assert.equal(gecmisYukuTespit("Yarın sınavım var"), false);
  assert.equal(sessizKarartmaTespit("Komşunun dedikodusunu yapalım mı"), true);
  assert.equal(sessizKarartmaTespit("Dedikodudan nasıl korunurum"), false);
  assert.equal(kusakTespit("Lisede okuyorum, YKS'ye hazırlanıyorum"), "GENC");
  assert.equal(kusakTespit("Torunum bugün ilk kez yürüdü"), "BUYUK");
  assert.equal(kusakTespit("67 yaşındayım, emekliyim"), "BUYUK");
  assert.equal(kusakTespit("Altmış lira borcum var"), null);
});

test("ilk mesajda karşılama ikramı yönergesi, sonraki mesajda yok", () => {
  assert.ok(uslupYonergesiKur({ mesaj: "Selamünaleyküm" }).includes("İLK KARŞILAMA"));
  const sonraki = uslupYonergesiKur({
    mesaj: "Bugün biraz daha iyiyim",
    gecmis: [
      { role: "user", content: "Selamünaleyküm" },
      { role: "assistant", content: "Aleykümselam, hoş geldin kardeşim." },
    ],
  });
  assert.ok(!sonraki.includes("İLK KARŞILAMA"));
});

test("ilim modunda yalnızca kurgu ve kalıp süzgeci uygulanır", () => {
  const y = uslupYonergesiKur({ mesaj: "Senden başka kimsem yok, Hicret neden oldu?", ilimModu: true });
  assert.ok(!y.includes("YALNIZLAŞTIRMA"));
  assert.ok(!y.includes("İLK KARŞILAMA"));
});

// --- Sistem talimatında bölümler -------------------------------------------

test("sistem talimatı: üslup bölümleri ve güvenlik kuralları birlikte bulunur", () => {
  for (const baslik of [
    "ÜSLUP VE SÜZGEÇ KURALLARI",
    "NEZAHET DİLİ",
    "KALIP CEVAP YASAĞI",
    "YAPAY EMPATİ YASAĞI",
    "AYNA DEĞİL LİMAN",
    "SESSİZ TANIKLIK",
    "İKİ YÖNLÜ İSTİŞARE",
    "YALNIZLAŞTIRMA KALKANI",
    "HİTAP VE KUŞAK",
    "TON ESNEKLİĞİ",
    "SECCADEYE NAZİK DAVET",
    "GEÇMİŞİN YÜKÜ VE TEVBE",
    "SESSİZ KARARTMA",
    "KAPANIŞ İYİLİĞİ VE HAYIRLI ADIM",
    "MİZAH VE KURGU",
  ]) {
    assert.ok(SIRDAS_MANEVI_AYNA_INSTRUCTION.includes(baslik), `Eksik bölüm: ${baslik}`);
  }
  // Güvenlik öncelik sırası hâlâ talimatın sonunda ve üslup bölümünden sonra gelir
  const uslupYeri = SIRDAS_MANEVI_AYNA_INSTRUCTION.indexOf("ÜSLUP VE SÜZGEÇ KURALLARI");
  const guvenlikYeri = SIRDAS_MANEVI_AYNA_INSTRUCTION.indexOf("GÜVENLİK ÖNCELİK SIRASI");
  assert.ok(uslupYeri > 0 && guvenlikYeri > uslupYeri);
  assert.ok(SIRDAS_MANEVI_AYNA_INSTRUCTION.includes("ALO 183"));
  assert.ok(SIRDAS_MANEVI_AYNA_INSTRUCTION.includes("FETVA SINIRI"));
  assert.ok(SIRDAS_ILIM_VE_SIYER_INSTRUCTION.includes("ÜSLUP KURALLARI (KISA)"));
  assert.ok(SIRDAS_ILIM_VE_SIYER_INSTRUCTION.includes("GÜVENLİK ÖNCELİK SIRASI"));
});

test("üslup metinlerinde emoji ve uzun tire yok", () => {
  const tum = USLUP_SISTEM_BOLUMU + uslupYonergesiKur({ mesaj: "Mars'ta namaz nasıl kılınır?" });
  assert.ok(!/[—–]/.test(tum), "uzun tire var");
  assert.ok(!/\p{Extended_Pictographic}/u.test(tum), "emoji var");
});

// --- Model girdisine eklenme (gerçek model çağrısı yok) --------------------

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

test("model girdisi: kurgu mesajına kurgu yönergesi eklenir", () => {
  const metin = sonKullaniciMetni(
    ornekParams({ userMessage: "Mars'ta kolonide yaşıyorum, secdeden kalkamıyorum, namaz nasıl olacak?" })
  );
  assert.ok(metin.includes("KURGU / MİZAH"));
  assert.ok(metin.includes("gerçek bir dini soru"));
});

test("model girdisi: sıradan mesajda kurgu yönergesi yok, döngüde döngü kesici var", () => {
  const metin = sonKullaniciMetni(
    ornekParams({
      userMessage: "Eşimle yine kavga ettik, evde hiç huzur kalmadı, ne yapacağım bilmiyorum",
      conversationHistory: [
        { role: "user", content: "Eşimle sürekli kavga ediyoruz, evde huzur kalmadı, ne yapacağımı bilmiyorum" },
        { role: "assistant", content: "Aziz kardeşim, evdeki bu gerginlik insanı yorar. Rabbim gönlünüzü birleştirsin." },
      ],
    })
  );
  assert.ok(!metin.includes("KURGU / MİZAH"));
  assert.ok(metin.includes("DÖNGÜ KESİCİ"));
  assert.ok(metin.includes("KALIP YASAĞI"));
});
