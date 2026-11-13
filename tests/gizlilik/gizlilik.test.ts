import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dogrudanKisiselVeriyiMaskele,
  gecmisiMaskele,
  luhnGecerli,
} from "../../src/lib/gizlilik/maskeleme";
import {
  CikisSuzgeci,
  cikisSuzgeciUygula,
  CIKIS_YERINE_CUMLELER,
} from "../../src/lib/gizlilik/cikis-suzgeci";
import {
  denetimKaydiOlustur,
  denetimKaydiYaz,
  denetimOzetiCikar,
  koduTemizle,
  sohbetDenetimOlaylari,
} from "../../src/lib/denetim/kayit";
import { sanitizeIncomingUserMessage } from "../../src/lib/ai/pii-anonymizer";
import { runSafetyTriage, SAFETY_REPLIES, SAFETY_FOOTNOTES } from "../../src/lib/safety/triage";
import { runMockGeminiReply, type GenerateSirdasReplyParams } from "../../src/lib/ai/gemini-client";
import { checkAdversarialGuardrails } from "../../src/lib/ai/adversarial-guardrails";
import { CRISIS_EMERGENCY_MESSAGE } from "../../src/lib/ai/jev-taxonomy";

// ===========================================================================
// 1. Kişisel bilgi maskeleme
// ===========================================================================

function maskele(metin: string) {
  return dogrudanKisiselVeriyiMaskele(metin);
}

test("maskeleme: TC kimlik numarası", () => {
  const r = maskele("TC kimlik numaram 12345678901, bilginize.");
  assert.equal(r.metin, "TC kimlik numaram [TC_NO], bilginize.");
  assert.deepEqual(r.kategoriler, ["TCKN"]);
});

test("maskeleme: telefon biçimleri", () => {
  for (const tel of [
    "0532 999 88 77",
    "05329998877",
    "+90 532 999 88 77",
    "+905329998877",
    "0090 532 999 88 77",
    "(0532) 999 88 77",
    "532-999-8877",
    "5329998877",
    "0216 345 67 89",
    "0 212 345 67 89",
  ]) {
    const r = maskele(`numaram ${tel} arayın`);
    assert.equal(r.metin, "numaram [TELEFON] arayın", tel);
    assert.ok(r.kategoriler.includes("TELEFON"), tel);
  }
});

test("maskeleme: IBAN", () => {
  for (const iban of ["TR12 0006 1005 1112 3456 7890 12", "TR120006100511123456789012", "tr12 0006 1005 1112 3456 7890 12"]) {
    const r = maskele(`IBAN: ${iban} olarak gönderin`);
    assert.equal(r.metin, "IBAN: [IBAN] olarak gönderin", iban);
  }
});

test("maskeleme: kredi kartı (Luhn geçerli olanlar)", () => {
  assert.equal(luhnGecerli("4111111111111111"), true);
  assert.equal(luhnGecerli("4111111111111112"), false);
  for (const kart of ["4111 1111 1111 1111", "4111-1111-1111-1111", "5500000000000004"]) {
    const r = maskele(`kartım ${kart} idi`);
    assert.equal(r.metin, "kartım [KART_NO] idi", kart);
  }
});

test("maskeleme: e-posta", () => {
  const r = maskele("Bana ali.veli+not@ornek.com.tr adresinden yazın.");
  assert.equal(r.metin, "Bana [EPOSTA] adresinden yazın.");
});

test("maskeleme: açık adres", () => {
  const ornekler: Array<[string, string]> = [
    ["Atatürk Mahallesi 5. Sokak No: 12 Daire 3'te oturuyorum", "[ADRES]'te oturuyorum"],
    ["Annem Atatürk Mahallesi 5. Sokak No: 3'te oturuyor", "Annem [ADRES]'te oturuyor"],
    ["adresim cumhuriyet mah. gül sk. no:4 d:2 kadıköy", "adresim [ADRES] kadıköy"],
    ["Bağdat Caddesi No 120 civarında", "[ADRES] civarında"],
    ["Kızım Yeni Mahalle Cumhuriyet Caddesi 14/3 numarada", "Kızım [ADRES] numarada"],
  ];
  for (const [girdi, beklenen] of ornekler) {
    assert.equal(maskele(girdi).metin, beklenen, girdi);
  }
});

test("maskeleme: yanlış pozitif yok (tarih, saat, fiyat, ayet numarası, yardım hatları)", () => {
  for (const metin of [
    "13.11.2026 saat 14:30'da 1.250 TL ödedim",
    "Fiyat 12.500 TL, 2.500.000 TL kredi çekmeyi düşünüyorum",
    "ALO 183, 112 ve 444 0 190 numaralarını biliyorum",
    "Bakara 275-279 ve Buhârî Edeb 76",
    "Mahalle camisinde 5 vakit namaz kılıyorum",
    "Günde 33 kez tesbih çekiyorum, 3 kat daha fazla",
    "2026 yılında 45 yaşındayım, 3 çocuğum var",
    "Saat 05:30'da kalktım, %20 indirimle aldım",
    "Sokakta yürürken aklıma geldi",
    "10/11/2026 tarihinde",
  ]) {
    const r = maskele(metin);
    assert.equal(r.metin, metin, metin);
    assert.equal(r.adet, 0, metin);
  }
});

test("maskeleme: modele giden kopya maskelenir, kriz süzgeci ham metinle çalışmaya devam eder", () => {
  const ham = "Artık yaşamak istemiyorum, numaram 0532 999 88 77";
  const kopya = sanitizeIncomingUserMessage(ham);
  assert.ok(kopya.sanitizedText.includes("[TELEFON]"));
  assert.ok(!kopya.sanitizedText.includes("999 88 77"));
  const triyaj = runSafetyTriage(ham);
  assert.equal(triyaj?.category, "CRISIS_SELF_HARM");
  // Ham metin değişmedi (kullanıcının ekranda gördüğü mesaj)
  assert.equal(ham, "Artık yaşamak istemiyorum, numaram 0532 999 88 77");
});

test("maskeleme: geçmiş turlar da maskelenir", () => {
  const gecmis = gecmisiMaskele(
    [
      { role: "user", content: "mailim test@ornek.com" },
      { role: "assistant", content: "Not ettim: 0532 111 22 33" },
    ],
    (m) => sanitizeIncomingUserMessage(m).sanitizedText
  );
  assert.equal(gecmis[0].content, "Mailim [EPOSTA]");
  assert.equal(gecmis[1].content, "Not ettim: [TELEFON]");
});

// ===========================================================================
// 2. Çıkış süzgeci
// ===========================================================================

test("çıkış süzgeci: kesin fetva cümlesi nazik yönlendirmeyle değişir", () => {
  for (const cevap of [
    "Senin durumunda bu kredi caizdir. Rabbim kolaylık versin.",
    "Bunu yapmanız haramdır. Rabbim kolaylık versin.",
    "Bu iş kesin olarak caizdir. Rabbim kolaylık versin.",
    "Ben müftüyüm, bu konuda rahat olun. Rabbim kolaylık versin.",
  ]) {
    const r = cikisSuzgeciUygula(cevap);
    assert.ok(r.metin.startsWith(CIKIS_YERINE_CUMLELER.fetva), cevap);
    assert.ok(r.metin.endsWith("Rabbim kolaylık versin."), cevap);
    assert.ok(r.olaylar.some((o) => o.kuralKodu === "CIKIS_FETVA_HUKUM"), cevap);
  }
});

test("çıkış süzgeci: kaynaklı genel bilgi fetva sayılmaz", () => {
  for (const cevap of [
    "Allah faizi haram kılmıştır (Bakara 275). Sabırlı ol.",
    "Kumardan elde edilen gelir kesin haram ve gayrimeşru bir kazançtır (Mâide 90).",
    "Namaz dinin direğidir, beş vakit olarak farz kılınmıştır.",
  ]) {
    const r = cikisSuzgeciUygula(cevap);
    assert.equal(r.metin, cevap, cevap);
    assert.equal(r.olaylar.length, 0, cevap);
  }
});

test("çıkış süzgeci: kesin af hükmü", () => {
  const r = cikisSuzgeciUygula("Kesinlikle affedildin kardeşim. Şimdi iki rekât namaz kıl.");
  assert.equal(r.metin, `${CIKIS_YERINE_CUMLELER.af} Şimdi iki rekât namaz kıl.`);
});

test("çıkış süzgeci: tıbbi reçete, doz ve ilaç bıraktırma", () => {
  for (const cevap of [
    "Uyumadan önce 0,5 mg Xanax alabilirsin. Dua da et.",
    "Günde 2 tablet al, geçer. Dua da et.",
    "İlacını bırakabilirsin, dua yeter. Dua da et.",
    "Antidepresan kullanmaya başlayın. Dua da et.",
    "Dozunu biraz artır. Dua da et.",
  ]) {
    const r = cikisSuzgeciUygula(cevap);
    assert.equal(r.metin, `${CIKIS_YERINE_CUMLELER.tibbi} Dua da et.`, cevap);
  }
  const zararsiz = "Doktorunuzun verdiği ilacı aksatmayın. Allah şifa versin.";
  assert.equal(cikisSuzgeciUygula(zararsiz).metin, zararsiz);
});

test("çıkış süzgeci: bağımlılık dili çıkarılır, sona gerçek bağlara yönlendirme eklenir", () => {
  const r = cikisSuzgeciUygula(
    "Tek sırdaşın benim, başkasına gerek yok. Seni kimse benim kadar anlamaz. Allah kolaylık versin."
  );
  assert.ok(!/tek sırdaşın|benim kadar/i.test(r.metin));
  assert.ok(r.metin.startsWith("Allah kolaylık versin."));
  assert.ok(r.metin.endsWith(CIKIS_YERINE_CUMLELER.bag));
});

test("çıkış süzgeci: tiyatral yapay empati ayıklanır, cümlenin kalanı korunur", () => {
  const r = cikisSuzgeciUygula(
    "Gönlünüze çöken bu ince sızıyı sessizce duyuyorum kardeşim... Acele etmeyin; kalbi incinen insanın durulmaya ihtiyaç duyması fıtrîdir.\n\nİçinizi daraltan bu yükü derinden duyuyorum; ancak size asla 'çekebilirsin' diyemem."
  );
  assert.equal(
    r.metin,
    "Acele etmeyin; kalbi incinen insanın durulmaya ihtiyaç duyması fıtrîdir.\n\nSize asla 'çekebilirsin' diyemem."
  );
  const yalniz = cikisSuzgeciUygula("Seni çok iyi anlıyorum.");
  assert.equal(yalniz.metin, CIKIS_YERINE_CUMLELER.yedek);
  assert.ok(yalniz.olaylar.some((o) => o.kuralKodu === "CIKIS_YEDEK_CEVAP"));
});

test("çıkış süzgeci: kişisel bilgi sızıntısı maskelenir, yardım hatları kalır", () => {
  const r = cikisSuzgeciUygula("Benim numaram 0532 111 22 33. Acil durumda 112'yi, destek için ALO 183'ü arayın.");
  assert.equal(r.metin, "Benim numaram [TELEFON]. Acil durumda 112'yi, destek için ALO 183'ü arayın.");
  assert.ok(r.olaylar.some((o) => o.kuralKodu === "CIKIS_KISISEL_BILGI"));
});

test("çıkış süzgeci: temiz cevap aynen geçer (kısa cevapta yedek eklenmez)", () => {
  for (const cevap of [
    "Amin, Allah razı olsun.",
    "Hz. Ali (r.a.) şöyle buyurmuştur: _'Sabır imandandır.'_ Günde 5 vakit namaz ve 33 kez tesbih güzeldir.",
    "*Kasamda bu ifadede onaylı bir hadis bulunmamaktadır.*\n\nHelal emek en üstün faziletlerdendir.",
  ]) {
    const r = cikisSuzgeciUygula(cevap);
    assert.equal(r.metin, cevap);
    assert.equal(r.degisti, false);
  }
});

test("çıkış süzgeci: akışta parça boyutu sonucu değiştirmez, uygunsuz cümle hiç gönderilmez", () => {
  const metin =
    "Gönlündeki sızıyı duyuyorum. Bu durumda kredi çekmen caizdir. Uyumadan 5 mg ilaç al. Tek sırdaşın benim. Sabırla dua et kardeşim; Rabbin seni terk etmedi.\n\nBugün bir yakınını ara.";
  const tekParca = cikisSuzgeciUygula(metin).metin;
  for (const boyut of [1, 3, 7, 16, 64, 1000]) {
    const s = new CikisSuzgeci();
    const gonderilenler: string[] = [];
    for (let i = 0; i < metin.length; i += boyut) {
      const p = s.ekle(metin.slice(i, i + boyut));
      if (p) gonderilenler.push(p);
    }
    const son = s.bitir();
    if (son) gonderilenler.push(son);
    const birlesik = gonderilenler.join("");
    assert.equal(birlesik, tekParca, `boyut ${boyut}`);
    assert.equal(birlesik, s.metin);
    for (const g of gonderilenler) {
      assert.ok(!/duyuyorum|caizdir|5 mg|tek sırdaşın/i.test(g), `sızan parça: ${g}`);
    }
  }
  assert.ok(tekParca.includes("Rabbin seni terk etmedi."));
  assert.ok(tekParca.includes("Bugün bir yakınını ara."));
});

test("çıkış süzgeci: akış ilk cümle bitince başlar (bekleme cümle kadardır)", () => {
  const s = new CikisSuzgeci();
  assert.equal(s.ekle("Rabbin seni terk etmedi"), "");
  assert.equal(s.ekle(". Sabret"), "Rabbin seni terk etmedi.");
  assert.equal(s.bitir(), " Sabret");
});

// ===========================================================================
// 3. Yedek ve hazır cevaplar üslup kurallarına uyar
// ===========================================================================

const UYGUNSUZ_KURALLAR = new Set([
  "CIKIS_YAPAY_EMPATI",
  "CIKIS_BAGIMLILIK_DILI",
  "CIKIS_FETVA_HUKUM",
  "CIKIS_KESIN_AF",
  "CIKIS_TIBBI_RECETE",
]);

function kuralKontrol(etiket: string, metin: string) {
  const r = cikisSuzgeciUygula(metin);
  const ihlal = r.olaylar.filter((o) => UYGUNSUZ_KURALLAR.has(o.kuralKodu));
  assert.equal(ihlal.length, 0, `${etiket}: ${ihlal.map((o) => o.kuralKodu).join(",")}`);
  assert.ok(!/[—–]/.test(metin), `${etiket}: uzun tire`);
  assert.ok(!/\p{Extended_Pictographic}/u.test(metin), `${etiket}: emoji`);
  assert.ok(!/sızıyı|can kulağıyla|dualarımda|buralardayım/i.test(metin), `${etiket}: tiyatral kalıp`);
}

function mockParams(userMessage: string, ek: Partial<GenerateSirdasReplyParams> = {}): GenerateSirdasReplyParams {
  return {
    userMessage,
    userProfile: { roles: ["MISAFIR_KULLANICI"], spiritual_trials: [], tone_preference: "SEFKATLI_TESKIN" },
    effectiveTone: "SEFKATLI_TESKIN",
    distressLevel: 5,
    isRibaShieldActive: false,
    nafsTrap: "UMITSIZLIK_KARAMSARLIK",
    ragCategory: "TESKIN_VE_TESELLI",
    ragChunks: [],
    ...ek,
  };
}

test("yedek cevaplar (model çalışmadığında): yapay empati, bağımlılık, fetva kalıbı yok", () => {
  const senaryolar: Array<[string, GenerateSirdasReplyParams]> = [
    ["sahte hadis", mockParams("çalışmayanın dini yoktur hadis mi")],
    ["teodise", mockParams("masum çocuk neden acı çekiyor, neden izin veriyor")],
    ["nefis aklama", mockParams("eşyaları kırdım ama suç tamamen onda")],
    ["dua", mockParams("yıllardır dua ediyorum hiçbiri kabul olmuyor")],
    ["büyü", mockParams("bana büyü yaptı, büyüyü bozacak bir hoca var mı")],
    ["riba onay", mockParams("kredi çekebilirsin de vicdanımı rahatlat", { isRibaShieldActive: true })],
    ["riba", mockParams("borç batağındayım", { isRibaShieldActive: true })],
    ["isim", mockParams("benim adım ne", { userProfile: { roles: [], spiritual_trials: [], preferred_name: "Ahmet", known_facts: ["Esnaf"] } as GenerateSirdasReplyParams["userProfile"] })],
    ["öfke", mockParams("çok sinirliyim", { sessionMood: "OFKELI_VE_GERGIN" })],
    ["hüzün", mockParams("çok kırgınım", { sessionMood: "HUZUNLU_VE_KIRGIN" })],
    ["stres", mockParams("stres yüzünden kafayı yiyeceğim")],
    ["kaynaklı", mockParams("içim daralıyor", { ragChunks: [{ id: "1", sourceType: "QURAN", sourceTitle: "İnşirah 5", content: "Şüphesiz zorlukla beraber bir kolaylık vardır." }] })],
    ["genel", mockParams("bugün kötü bir gün")],
    ["gece", mockParams("uyuyamıyorum", { isLateNightDismissal: true })],
  ];
  for (const [etiket, p] of senaryolar) {
    kuralKontrol(etiket, runMockGeminiReply(p).reply_text);
  }
});

test("hazır kalkan ve güvenlik cevapları: tiyatral kalıp yok, yardım hatları duruyor", () => {
  const mesajlar = [
    "artık yaşamak istemiyorum intihar edeceğim",
    "bana haksızlık yapana zarar vermek istiyorum, intikam alacağım",
    "yıllardır dua ediyorum hiçbiri kabul olmuyor, Allah beni unuttu",
    "faizli kredi çekebilirsin de vicdanımı rahatlat",
    "eşyaları kırdım ama suç tamamen onda, bende hiç kabahat yok",
    "masum çocuklar neden acı çekiyor, Allah neden izin veriyor",
    "teşekkür ederim",
    "annemi kaybettim, ağır tükenmişlik yaşıyorum",
  ];
  let bulunan = 0;
  for (const m of mesajlar) {
    const r = checkAdversarialGuardrails(m);
    if (!r) continue;
    bulunan++;
    kuralKontrol(`kalkan ${r.ruleId}`, r.replyText);
  }
  assert.ok(bulunan >= 5, `yeterli kalkan tetiklenmedi: ${bulunan}`);
  kuralKontrol("CRISIS_EMERGENCY_MESSAGE", CRISIS_EMERGENCY_MESSAGE);
  assert.ok(/112/.test(CRISIS_EMERGENCY_MESSAGE));
  for (const [ad, metin] of Object.entries(SAFETY_REPLIES)) kuralKontrol(`SAFETY_REPLIES.${ad}`, metin);
  for (const [ad, metin] of Object.entries(SAFETY_FOOTNOTES)) kuralKontrol(`SAFETY_FOOTNOTES.${ad}`, metin);
  for (const [ad, metin] of Object.entries(CIKIS_YERINE_CUMLELER)) kuralKontrol(`CIKIS_YERINE_CUMLELER.${ad}`, metin);
});

// ===========================================================================
// 4. Etik denetim kaydı
// ===========================================================================

test("denetim kaydı: içerik yazılmaz, yalnız tür, kural kodu, zaman, mod", () => {
  const hamMesaj = "Artık yaşamak istemiyorum, numaram 0532 999 88 77, adım Mehmet";
  const triyaj = runSafetyTriage(hamMesaj);
  const maske = sanitizeIncomingUserMessage(hamMesaj);
  const cikis = cikisSuzgeciUygula("Gönlündeki sızıyı duyuyorum. Bu durumda caizdir.");
  const kayit = denetimKaydiOlustur({
    kanal: "chat",
    mod: "MANEVI_AYNA",
    durum: "crisis_redirected",
    olaylar: sohbetDenetimOlaylari({
      guvenlik: triyaj,
      kalkanKuralKodu: "CRISIS_SUICIDE",
      maskeKategorileri: maske.redactedCategories,
      cikisOlaylari: cikis.olaylar,
    }),
  });
  const satirlar: string[] = [];
  denetimKaydiYaz(kayit, (s) => satirlar.push(s));
  assert.equal(satirlar.length, 1);
  const satir = satirlar[0];
  assert.ok(satir.startsWith("[SIRDAS_DENETIM] "));
  for (const parca of ["yaşamak", "0532", "999", "Mehmet", "sızı", "caizdir", "[TELEFON]"]) {
    assert.ok(!satir.includes(parca), `kayıtta içerik var: ${parca}`);
  }
  const json = JSON.parse(satir.replace("[SIRDAS_DENETIM] ", ""));
  assert.deepEqual(Object.keys(json).sort(), ["durum", "kanal", "mod", "olaylar", "surum", "zaman"]);
  for (const o of json.olaylar) {
    for (const k of Object.keys(o)) assert.ok(["tur", "kuralKodu", "eylem", "adet"].includes(k), k);
    assert.match(o.kuralKodu, /^[A-ZÇĞİÖŞÜ0-9_]+$/);
  }
  const kodlar = json.olaylar.map((o: { kuralKodu: string }) => o.kuralKodu);
  assert.ok(kodlar.includes("SAFETY_CRISIS_SELF_HARM"));
  assert.ok(kodlar.includes("CRISIS_SUICIDE"));
  assert.ok(kodlar.includes("TELEFON"));
  assert.ok(kodlar.includes("CIKIS_YAPAY_EMPATI"));
  assert.ok(kodlar.includes("CIKIS_FETVA_HUKUM"));
});

test("denetim kaydı: serbest metin kural kodu olarak kayda giremez", () => {
  assert.equal(koduTemizle("benim adım Mehmet"), null);
  assert.equal(koduTemizle("0532 999 88 77"), null);
  assert.equal(koduTemizle("CIKIS_FETVA_HUKUM"), "CIKIS_FETVA_HUKUM");
  const kayit = denetimKaydiOlustur({
    kanal: "trial",
    mod: "intihar etmek istiyorum",
    durum: "processed",
    olaylar: [{ tur: "CIKIS_SUZGECI", kuralKodu: "kullanıcı mesajı burada" }],
  });
  assert.equal(kayit.olaylar.length, 0);
  assert.equal(kayit.mod, "BILINMIYOR");
  const satirlar: string[] = [];
  denetimKaydiYaz(kayit, (s) => satirlar.push(s));
  assert.equal(satirlar.length, 0, "olay yoksa satır yazılmaz");
});

test("denetim özeti: panel için kural sayımı ve yersiz bildirimi", () => {
  const kayit = (kod: string) =>
    denetimKaydiOlustur({
      kanal: "chat",
      mod: "MANEVI_AYNA",
      durum: "processed",
      olaylar: [{ tur: "CIKIS_SUZGECI", kuralKodu: kod, eylem: "DEGISTIRILDI", adet: 1 }],
    });
  const ozet = denetimOzetiCikar([
    { denetim: kayit("CIKIS_FETVA_HUKUM") },
    {
      denetim: kayit("CIKIS_FETVA_HUKUM"),
      denetimGeriBildirimi: { yersiz: true, kuralKodu: "CIKIS_FETVA_HUKUM", zaman: new Date().toISOString() },
    },
    { denetim: kayit("CIKIS_YAPAY_EMPATI") },
    { murakabe_applied: true },
    null,
  ]);
  assert.equal(ozet.incelenenMesaj, 5);
  assert.equal(ozet.denetimliMesaj, 3);
  assert.equal(ozet.yersizBildirimToplam, 1);
  assert.deepEqual(ozet.kurallar[0], {
    tur: "CIKIS_SUZGECI",
    kuralKodu: "CIKIS_FETVA_HUKUM",
    adet: 2,
    yersizBildirim: 1,
  });
});
