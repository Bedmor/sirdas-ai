// Gerçek model çağrılmaz: anahtar yerine test değeri (getAIClient bunu "anahtar yok" sayar).
process.env.GEMINI_API_KEY = "mock_gemini_key_for_testing_and_verification";

import { test } from "node:test";
import assert from "node:assert/strict";
import { runHeuristicFallback } from "../../src/lib/ai/jev-client";
import {
  FATWA_FALLBACK_BODIES,
  FATWA_REJECTION_MESSAGES,
  fatwaRejectionMessage,
} from "../../src/lib/ai/jev-taxonomy";
import {
  appendSafetyFootnote,
  resolveSafetyNotice,
  runSafetyTriage,
} from "../../src/lib/safety/triage";
import { buildSafetyIntercept } from "../../src/lib/safety/intercept";
import { evaluateSpiritualGuardrails } from "../../src/lib/ai/rag-pipeline";
import {
  FETVA_KAPANIS,
  FETVA_UC_ASAMA_YONERGESI,
  FETVA_PRATIK_ILMIHAL_YONERGESI,
  fetvaSoruTuru,
  fetvaKapanisiEkle,
  fetvaPlaniKur,
  fetvaYedekCevabi,
  fetvaYonergesiKur,
} from "../../src/lib/ai/fetva-akisi";
import {
  buildGeminiContents,
  formatRagContext,
  generateSirdasReply,
  generateSirdasReplyStream,
  type GenerateSirdasReplyParams,
} from "../../src/lib/ai/gemini-client";
import {
  SIRDAS_ILIM_VE_SIYER_INSTRUCTION,
  SIRDAS_MANEVI_AYNA_INSTRUCTION,
} from "../../src/lib/ai/constitution";
import { ALIM_GORUSU_BOLUMU } from "../../src/lib/uslup/alim-gorusu";
import { cikisSuzgeciUygula } from "../../src/lib/gizlilik/cikis-suzgeci";
import { hizliYanitlar } from "../../src/lib/sohbet/hizli-yanitlar";

const KAPANIS_MUSTERI =
  "Ben bir yapay zekâyım ve fetva mercii değilim; Bu sorunuzun şer'i/fıkhi hükmü (ibadet sıhhati, helal/haram, caiz, boşanma, miras vb.) için lütfen Diyanet İşleri Başkanlığı'nı (Alo 190 Fetva Hattı) arayınız veya ehliyetli müftülüklere danışınız.";

function kapanisSayisi(metin: string): number {
  return metin.split(FETVA_KAPANIS).length - 1;
}

/** route.ts'deki karar zincirinin model öncesi kısmı. */
function akis(mesaj: string) {
  const triage = runSafetyTriage(mesaj);
  const jev = runHeuristicFallback(mesaj);
  const intercept = buildSafetyIntercept(triage, jev) ?? evaluateSpiritualGuardrails(mesaj, jev);
  const plan = fetvaPlaniKur(mesaj, jev, triage);
  return { triage, jev, intercept, plan };
}

function modelParametreleri(mesaj: string, fetvaModu: boolean): GenerateSirdasReplyParams {
  return {
    userMessage: mesaj,
    userProfile: { roles: ["MISAFIR_KULLANICI"], spiritual_trials: [], tone_preference: "SEFKATLI_TESKIN" },
    effectiveTone: "SEFKATLI_TESKIN",
    distressLevel: 3,
    isRibaShieldActive: false,
    nafsTrap: "DUNYALIK_KAYGI",
    ragCategory: "TESKIN_VE_TESELLI",
    ragChunks: [],
    fetvaModu,
  };
}

function sonIstem(p: GenerateSirdasReplyParams): string {
  return buildGeminiContents(p).at(-1)?.parts?.map((x) => x.text).join("\n") || "";
}

// --- Sınıflandırma (değişmedi) ---

// 18.11 Adnan: "sen hani fetva vermiyordun" her seferinde aynı kalıp cevaba düşüyordu.
test("fetva: sohbette geçen 'fetva' kelimesi fetva akışına girmez, normal sohbet kalır", () => {
  const a = akis("sen hani fetva vermiyordun");
  assert.ok(a.jev.is_fiqh_fatwa_request < 0.75);
  assert.equal(a.intercept, null);
  assert.equal(a.plan.aktif, false);
});

test("fetva: gerçek hüküm talebi hâlâ yakalanır", () => {
  assert.ok(runHeuristicFallback("bu konuda fetva verir misin").is_fiqh_fatwa_request >= 0.75);
  assert.ok(runHeuristicFallback("faiz haram mı").is_fiqh_fatwa_request >= 0.75);
});

// --- 18.11 fetva yaması: model atlanmaz ---

test("fetva yaması: keskin hüküm soruları artık modele gider (kalıp cevap yok)", () => {
  const sorular = [
    "namazda gülmek namazı bozar mı",
    "bu konuda fetva verir misin",
    "faiz haram mı",
    "eşime üç kere boş ol dedim boşandık mı",
    "mirasta kız çocuğa düşen pay ne kadar",
    "kripto kazancımla hacca gitsem caiz mi",
    "Kaza namazı var mıdır nasıl kılmalıyım",
  ];
  for (const s of sorular) {
    const a = akis(s);
    assert.equal(a.triage?.bypassModel ?? false, false, `güvenlik süzgeci modeli atlamamalı: ${s}`);
    assert.equal(a.intercept, null, `kalıp cevaba düşmemeli: ${s}`);
    assert.equal(a.plan.aktif, true, `fetva akışı açılmalı: ${s}`);
  }
});

test("fetva yaması: kriz ve şiddet akışları değişmez", () => {
  const kriz = akis("intihar etmek istiyorum, intihar haram mı");
  assert.ok(kriz.intercept || kriz.triage?.bypassModel, "kriz yine modelden önce kesilir");
  assert.equal(kriz.plan.aktif, false);

  const siddet = akis("eşim beni dövüyor, boşanmak caiz mi");
  assert.ok(siddet.intercept || siddet.triage?.bypassModel, "şiddet yine modelden önce kesilir");
  assert.equal(siddet.plan.aktif, false);
});

// 18.11 Haydar: "Kaza namazı var mıdır nasıl kılmalıyım" kesin hüküm diliyle cevaplanmıştı.
test("fetva: kaza namazı uygulama sorusu modele kalır, tek kapanış (dipnot ve kutu yok)", () => {
  const a = akis("Kaza namazı var mıdır nasıl kılmalıyım");
  assert.equal(a.triage?.category, "FATWA_LIMIT");
  assert.equal(a.triage?.bypassModel, false);
  assert.equal(a.plan.aktif, true);
  assert.equal(a.plan.cevapTriage, null, "FATWA_LIMIT dipnotu/kutusu fetva akışında düşer");
  assert.equal(resolveSafetyNotice(a.plan.cevapTriage, "processed"), null);
  const model = "Kaza namazı konusunda âlimlerin çoğunluğu bunu bir borç sayar.";
  const son = fetvaKapanisiEkle(appendSafetyFootnote(model, a.plan.cevapTriage));
  assert.ok(!/fetva makamı değilim/.test(son), "eski dipnot eklenmez");
  assert.equal(kapanisSayisi(son), 1);
});

// --- Kapanış harfiyen, tek kez ---

test("fetva kapanışı: müşterinin metniyle harfiyen aynı", () => {
  assert.equal(FETVA_KAPANIS, KAPANIS_MUSTERI);
});

test("fetva kapanışı: sona tek kez eklenir; model aynısını yazdıysa tekrarlanmaz", () => {
  const govde = "Namazın huşu ile kılınması kalbin terazisini dengeler.";
  const bir = fetvaKapanisiEkle(govde);
  assert.ok(bir.endsWith(FETVA_KAPANIS));
  assert.ok(bir.startsWith(govde));
  assert.equal(kapanisSayisi(bir), 1);
  assert.equal(fetvaKapanisiEkle(bir), bir, "iki kez uygulamak metni değiştirmez");

  const modelYazdi = `${govde}\n\n${FETVA_KAPANIS}`;
  assert.equal(fetvaKapanisiEkle(modelYazdi), bir);

  const kalin = `${govde}\n\n**${FETVA_KAPANIS}**`;
  const k = fetvaKapanisiEkle(kalin);
  assert.equal(kapanisSayisi(k), 1);
  assert.ok(!k.includes("**Ben bir yapay"), "kalın kopya ayıklanır");
});

test("fetva kapanışı: modelin kendi Alo 190 cümlesi ve eski dipnot ayıklanır, gövde kalır", () => {
  const model =
    "Telaşınızı anlıyorum; vicdanınız bu meseleyi önemsiyor.\n\n" +
    "Namaz, kulun Rabbiyle buluştuğu andır. Bu konuda kesin hüküm için Diyanet Alo 190 hattını arayabilirsiniz.\n\n" +
    "_(Ben fetva makamı değilim; bu cevap bağlayıcı bir dini hüküm değildir. Kesin hüküm için Diyanet İşleri Başkanlığı **ALO 190** hattına veya bulunduğunuz yerin müftülüğüne danışabilirsiniz.)_";
  const son = fetvaKapanisiEkle(model);
  assert.equal(kapanisSayisi(son), 1);
  assert.equal((son.match(/190/g) || []).length, 1, "Alo 190 yalnız kapanışta geçer");
  assert.ok(son.includes("Namaz, kulun Rabbiyle buluştuğu andır."));
  assert.ok(son.includes("vicdanınız"));
});

// --- Yedek: model çağrılamazsa ---

test("fetva yedeği: kalıp cevaplar hüküm vermez, hepsi harfiyen kapanışla biter", () => {
  const s = new Set(["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "ggggggg"].map(fatwaRejectionMessage));
  assert.ok(s.size > 1, "kalıp cevap tek söyleyişe sıkışmaz");
  for (const m of FATWA_REJECTION_MESSAGES) {
    assert.ok(m.endsWith(FETVA_KAPANIS));
    assert.equal(kapanisSayisi(m), 1);
  }
  for (const b of FATWA_FALLBACK_BODIES) {
    assert.ok(!/190|f[ıi]tr/i.test(b), "gövdede Alo 190 tekrarı ve fıtrat kelimesi yok");
  }
  for (const soru of ["namazda gülmek namazı bozar mı", "eşime üç kere boş ol dedim boşandık mı", "faiz haram mı"]) {
    const y = fetvaYedekCevabi(soru);
    assert.ok(y.endsWith(FETVA_KAPANIS), soru);
    assert.equal(kapanisSayisi(y), 1, soru);
    assert.equal((y.match(/\b190\b/g) || []).length, 1, `yedekte çift yönlendirme yok: ${soru}`);
  }
});

test("fetva yedeği: anahtar yokken model yerine yedek cevap döner (düz ve akışlı)", async () => {
  const soru = "namazda gülmek namazı bozar mı";
  const duz = await generateSirdasReply(modelParametreleri(soru, true));
  assert.ok(duz.reply_text.endsWith(FETVA_KAPANIS));
  assert.equal(kapanisSayisi(duz.reply_text), 1);

  const akisli = generateSirdasReplyStream(modelParametreleri(soru, true));
  let metin = "";
  while (true) {
    const n = await akisli.next();
    if (n.done) break;
    metin += n.value;
  }
  assert.equal(kapanisSayisi(metin), 1);
  // Route kapanışı yeniden uygulasa bile tek kalır.
  assert.equal(kapanisSayisi(fetvaKapanisiEkle(metin)), 1);

  const normal = await generateSirdasReply(modelParametreleri("Bugün içim sıkılıyor", false));
  assert.equal(kapanisSayisi(normal.reply_text), 0, "fetva dışı soruda kapanış yok");
});

// --- Talimat ---

test("fetva talimatı: üç aşama var, saf fıtrata atıf serbest, fıtrî yasak, kapanışı model yazmaz", () => {
  assert.match(FETVA_UC_ASAMA_YONERGESI, /ŞEFKATLİ GİRİŞ/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /İLMİ VE MANEVİ ZEMİN/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /KAPANIŞ/);
  // 18.11 müşteri ayrımı: "fıtrat" yaradılıştaki saf hal anlamında ölçülü serbest, "fıtrî" yasak.
  assert.match(FETVA_UC_ASAMA_YONERGESI, /saf fıtrata \(yaradılıştaki saf hale\)/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /"Fıtrat" kelimesini bu cevapta en fazla bir kez/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /"fıtrî" kelimesini KULLANMA/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /vicdan/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /SEN YAZMA/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /âlimlerin çoğunluğuna göre/);
  // Talimat "fıtrî"yi yasak cümlesi dışında kendisi kullanmaz.
  const yasaksiz = FETVA_UC_ASAMA_YONERGESI.replace(/"fıtrî" kelimesini KULLANMA/, "");
  assert.ok(!/f[ıi]tr[îi]/i.test(yasaksiz));

  for (const talimat of [SIRDAS_MANEVI_AYNA_INSTRUCTION, SIRDAS_ILIM_VE_SIYER_INSTRUCTION]) {
    assert.match(talimat, /FETVA SINIRI \(İKİ KOLLU CEVAP\)/);
    assert.match(talimat, /PRATİK İLMİHAL/);
    assert.match(talimat, /"fıtrî" kelimesini kullanma/);
    assert.match(talimat, /AKIL VE GERÇEKLİK SÜZGECİ/);
    assert.match(talimat, /6-17 yaş arası makul bir yaş beyanını \("12 yaşındayım", "lisedeyim"\) ASLA alaya alma/);
    assert.ok(talimat.includes(ALIM_GORUSU_BOLUMU));
  }
});

// --- Fetva v2: iki kollu ---

test("fetva v2: teknik ilmihal soruları pratik kola, kalbi/hüküm soruları üç aşamaya gider", () => {
  const pratik = [
    "sehiv secdesi nasıl yapılır",
    "gusülde ağza su vermek farz mı",
    "abdest nasıl alınır",
    "vitir namazı kaç rekat",
    "teyemmüm nasıl yapılır",
  ];
  for (const m of pratik) {
    assert.equal(fetvaSoruTuru(m), "PRATIK_ILMIHAL", m);
    const a = akis(m);
    assert.equal(a.plan.aktif, true, `kapanış alır: ${m}`);
    assert.equal(a.plan.tur, "PRATIK_ILMIHAL", m);
    const y = fetvaYonergesiKur(m);
    assert.ok(y.includes("[FETVA SORUSU: PRATİK İLMİHAL]"), m);
    assert.ok(!y.includes("ÜÇ AŞAMALI"), m);
  }
  const kalbi = [
    "vicdanım çok rahatsız, namazı geç kılmak günah mı",
    "rızkım daraldı, bu iş caiz mi",
    "faizli kredi çeksem olur mu",
    "namazda gülmek namazı bozar mı",
    "eşime üç kere boş ol dedim boşandık mı",
    "mirasta kız çocuğunun payı ne kadar",
    "kaza namazı borcum var içim çok sıkılıyor nasıl kılmalıyım",
  ];
  for (const m of kalbi) {
    assert.equal(fetvaSoruTuru(m), "KALBI_HUKUM", m);
    assert.ok(fetvaYonergesiKur(m).includes("[FETVA SORUSU: ÜÇ AŞAMALI CEVAP]"), m);
  }
  // Fıkıh dışı sorular fetva akışına girmez.
  assert.equal(akis("Bugün içim sıkılıyor").plan.aktif, false);
  assert.equal(akis("nasıl sabredebilirim").plan.aktif, false);
});

test("fetva v2: pratik yönerge kısa, Hanefî çerçeveli, kapanışı model yazmaz; yedekte de kapanış var", () => {
  assert.match(FETVA_PRATIK_ILMIHAL_YONERGESI, /Hanefî mezhebine göre/);
  assert.match(FETVA_PRATIK_ILMIHAL_YONERGESI, /mezhep farkı/);
  assert.match(FETVA_PRATIK_ILMIHAL_YONERGESI, /Edebiyat, duygu/);
  assert.match(FETVA_PRATIK_ILMIHAL_YONERGESI, /SEN YAZMA/);
  const istem = sonIstem(modelParametreleri("sehiv secdesi nasıl yapılır", true));
  assert.ok(istem.includes("[FETVA SORUSU: PRATİK İLMİHAL]"));
  const y = fetvaYedekCevabi("abdest nasıl alınır");
  assert.ok(y.endsWith(FETVA_KAPANIS));
  assert.equal(kapanisSayisi(y), 1);
});

test("fetva talimatı: yalnız fetva sorusunda modele eklenir, kısa soru 'kısa selam' kuralına düşmez", () => {
  const fetva = sonIstem(modelParametreleri("talak düşer mi", true));
  assert.ok(fetva.includes("[FETVA SORUSU: ÜÇ AŞAMALI CEVAP]"));
  assert.ok(!fetva.includes("KISA SELAM"));
  const normal = sonIstem(modelParametreleri("Bugün içim sıkılıyor", false));
  assert.ok(!normal.includes("[FETVA SORUSU"));
});

// --- Halis Hoca görüşü: isimsiz ---

test("hoca görüşü: üç soru-cevap silindi (20.11), fetva yönergesine hoca görüşü eklenmez", () => {
  const soru =
    "Elimdeki imkanlar çok kısıtlı, kendimi sürekli yetersiz hissediyorum. Büyük niyetler kurmak günah mı?";
  const y = fetvaYonergesiKur(soru);
  assert.ok(!y.includes("HOCA GÖRÜŞÜ"));
  assert.ok(!/Sen niyetini büyük tut/.test(y));
});

test("hoca görüşü: sohbet kesiti kaynağı kaynak türüne göre isimsiz etiketlenir", () => {
  const baglam = formatRagContext([
    {
      id: "h1",
      sourceType: "HALIS_AYDEMIR",
      sourceTitle: "Halis Aydemir Hoca - Namazda Huşu Sohbeti",
      content: "Namaz kulun Rabbine en yakın olduğu andır.",
    },
    { id: "q1", sourceType: "QURAN", sourceTitle: "Bakara 45", content: "Sabır ve namazla yardım dileyin." },
  ]);
  assert.match(baglam, /HOCA\/ÂLİM GÖRÜŞÜ \(isim verme/);
  assert.ok(!/Halis|Aydemir/.test(baglam), "kişi adı modele verilmez");
  assert.match(baglam, /Bakara 45/, "ayet kaynakları eskisi gibi başlıklı");
  assert.match(ALIM_GORUSU_BOLUMU, /ders arşivleri/);
  assert.match(ALIM_GORUSU_BOLUMU, /çoğunluk görüşünün YANINDA/);
});

// --- Uçtan uca (sahte model yanıtıyla) ---

test("uçtan uca: 'namazda gülmek namazı bozar mı' sahte model yanıtıyla tek kapanışla biter", () => {
  const soru = "namazda gülmek namazı bozar mı";
  const a = akis(soru);
  assert.equal(a.intercept, null);
  assert.equal(a.plan.aktif, true);
  assert.ok(sonIstem(modelParametreleri(soru, a.plan.aktif)).includes("[FETVA SORUSU: ÜÇ AŞAMALI CEVAP]"));

  // Sahte model: talimata uymayıp kendi Alo 190 cümlesini de yazmış olsun.
  const sahteModel =
    "Namazdayken elde olmadan gülmek insanı mahcup eder; bu mahcubiyet, kalbin terazisinin hâlâ hassas olduğunu gösterir.\n\n" +
    "Cenâb-ı Hak, _\"Onlar ki namazlarında huşû içindedirler\"_ (Mü'minûn 2) buyurur. Namaz, kulun Rabbinin huzurunda durduğu bir vakar anıdır; âlimlerin çoğunluğu kahkahayı namazın edebine aykırı görür, tebessüm ile kahkaha arasında fark gözetir.\n\n" +
    "Kesin hüküm için Diyanet Alo 190 Fetva Hattı'na danışabilirsiniz.";
  const suzulmus = cikisSuzgeciUygula(sahteModel).metin;
  const son = fetvaKapanisiEkle(appendSafetyFootnote(suzulmus, a.plan.cevapTriage));
  assert.ok(son.endsWith(FETVA_KAPANIS));
  assert.equal(kapanisSayisi(son), 1);
  assert.equal((son.match(/\b190\b/g) || []).length, 1);
  assert.ok(son.includes("Mü'minûn 2"));
  assert.equal(resolveSafetyNotice(a.plan.cevapTriage, "processed"), null, "ayrı fetva kutusu yok");
  // Hızlı yanıt düğmeleri fetva cevabındaki gibi kalır.
  assert.deepEqual(
    hizliYanitlar({ icerik: son, status: "processed", guvenlikTuru: null }).map((h) => h.etiket),
    ["Manevi yönünü anlat", "Konuyu değiştir"]
  );
});

// --- "boşan" / "talak" / "miras" yanlış pozitifi (18.11) ---

test("fetva: boşanma/miras dertleşmesi fetva akışına girmez, kapanış almaz", () => {
  for (const m of [
    "boşandım, çok yalnızım",
    "eşimle boşanma aşamasındayız çok üzgünüm",
    "miras yüzünden kardeşlerimle küstük",
    "miras yüzünden kardeşlerimle küstük, helalleşmek istiyorum",
  ]) {
    const a = akis(m);
    assert.ok(a.jev.is_fiqh_fatwa_request < 0.75, m);
    assert.equal(a.plan.aktif, false, m);
  }
});

test("fetva: boşanma/miras hüküm sorusu kalıbıyla fetva sayılır", () => {
  for (const m of [
    "üç talak tek seferde düşer mi",
    "mirasta kız çocuğunun payı ne kadar",
    "miras nasıl bölünür",
    "boşanmak caiz mi",
    "eşime boş ol dedim boşandık mı",
  ]) {
    const a = akis(m);
    assert.ok(a.jev.is_fiqh_fatwa_request >= 0.75, m);
    assert.equal(a.plan.aktif, true, m);
    assert.equal(a.intercept, null, m);
  }
});
