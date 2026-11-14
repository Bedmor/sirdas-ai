import { test } from "node:test";
import assert from "node:assert/strict";
import {
  espriTekMesaj,
  espriUygunMu,
  uslupYonergesiKur,
  USLUP_SISTEM_BOLUMU,
  USLUP_ILIM_BOLUMU,
  USLUP_YONERGELERI,
} from "../../src/lib/uslup";
import { buildGeminiContents, type GenerateSirdasReplyParams } from "../../src/lib/ai/gemini-client";

const ESPRI_ETIKETI = "HAFİF ESPRİ İZNİ";

// --- Kapı açılır -----------------------------------------------------------

test("espri: hafif, neşeli mesajlarda kapı açılır", () => {
  for (const msg of [
    "Selam, bugün kahveyi fazla kaçırdım galiba haha",
    "Pazartesi sabahı alarmı üç kere erteledim :)",
    "Günaydın, keyfim yerinde bugün",
    "Trafikte iki saat kaldım ama neyse, şaka gibi bir gün",
    "Merhaba, nasılsın?",
  ]) {
    const k = espriUygunMu({ mesaj: msg });
    assert.equal(k.uygun, true, `Açık bekleniyordu: "${msg}" (neden: ${k.neden})`);
  }
});

// --- Kapı kapalı kalır -----------------------------------------------------

test("espri: yas, kriz, fetva, olumsuz duygu mesajlarında kapı kapalı", () => {
  for (const msg of [
    "Babamı kaybettim",
    "İntihar etmeyi düşünüyorum",
    "Faiz haram mı?",
    "Çok bunaldım, ağlıyorum",
  ]) {
    assert.equal(espriUygunMu({ mesaj: msg }).uygun, false, `Kapalı bekleniyordu: "${msg}"`);
    // Gülme işareti eklense bile hassas konu ağır basar.
    assert.equal(espriUygunMu({ mesaj: `${msg} haha` }).uygun, false, `Kapalı bekleniyordu: "${msg} haha"`);
  }
});

test("espri: hastalık, ölüm, şiddet, borç, dini konu, çocuk, siyaset ve etnik konu kapalı", () => {
  for (const msg of [
    "Annem hastanede yatıyor haha neyse",
    "Dedem öldü, kahve içemiyorum bile",
    "Eşim beni dövüyor, şaka değil",
    "Kredi kartı borcum bitmiyor haha",
    "Namazda kahve içmek aklıma geldi haha",
    "Allah'ın işine şaşırdım haha",
    "Hadis okurken güldüm",
    "Çocuğum ateşlendi, kahve bile içemedim",
    "Seçim sonuçlarına güldüm haha",
    "Kürt arkadaşla ilgili bir şaka anlatayım",
  ]) {
    assert.equal(espriUygunMu({ mesaj: msg }).uygun, false, `Kapalı bekleniyordu: "${msg}"`);
  }
});

test("espri: İlim modu, riba kalkanı, gece, yüksek sıkıntı ve olumsuz ruh hâlinde kapalı", () => {
  const msg = "Selam, bugün kahveyi fazla kaçırdım galiba haha";
  assert.equal(espriUygunMu({ mesaj: msg, ilimModu: true }).uygun, false);
  assert.equal(espriUygunMu({ mesaj: msg, ribaKalkani: true }).uygun, false);
  assert.equal(espriUygunMu({ mesaj: msg, geceGecSaat: true }).uygun, false);
  assert.equal(espriUygunMu({ mesaj: msg, geceFesihAktif: true }).uygun, false);
  assert.equal(espriUygunMu({ mesaj: msg, sikintiSeviyesi: 7 }).uygun, false);
  assert.equal(espriUygunMu({ mesaj: msg, oturumRuhHali: "HUZUNLU_VE_KIRGIN" }).uygun, false);
  assert.equal(espriUygunMu({ mesaj: msg, oturumRuhHali: "KAYGILI_VE_DARALMIS" }).uygun, false);
  assert.equal(espriUygunMu({ mesaj: msg, oturumRuhHali: "SAKIN_VE_DENGELI", sikintiSeviyesi: 2 }).uygun, true);
});

test("espri: hafiflik işareti olmayan sıradan mesaj ve kurgu mesajı kapalı", () => {
  assert.equal(espriTekMesaj("Bugün işe gittim, akşam eve döndüm").hafif, false);
  // Kurgunun kendi tebessüm süzgeci var; espri yönergesi üst üste binmez.
  assert.equal(espriTekMesaj("Mars'ta kolonide yaşıyorum, kahve bulamıyorum haha").hafif, false);
});

test("espri: yakın geçmişte hassas konu varsa kapı kapalı", () => {
  const k = espriUygunMu({
    mesaj: "Kahve iyi geldi haha",
    gecmis: [
      { role: "user", content: "Babamı kaybettim, çok zor günler" },
      { role: "assistant", content: "Başınız sağ olsun." },
    ],
  });
  assert.equal(k.uygun, false);
});

test("espri: sıklık sınırı, art arda iki cevapta izin verilmez", () => {
  const gecmis = [
    { role: "user" as const, content: "Selam, bugün kahveyi fazla kaçırdım galiba haha" },
    { role: "assistant" as const, content: "Kahve gönlü uyandırır ama gözü de açık bırakır." },
  ];
  const ikinci = espriUygunMu({ mesaj: "Evet, şimdi de çay demledim haha", gecmis });
  assert.equal(ikinci.uygun, false);
  assert.equal(ikinci.neden, "sıklık sınırı");

  const ucuncu = espriUygunMu({
    mesaj: "Çay da bitti haha",
    gecmis: [
      ...gecmis,
      { role: "user", content: "Bugün işe gittim, akşam eve döndüm" },
      { role: "assistant", content: "Hayırlı akşamlar." },
    ],
  });
  assert.equal(ucuncu.uygun, true);
});

// --- Kural metinleri ---------------------------------------------------------

test("espri: kural metni sistem bölümünde, İlim modunda yasak yazılı, emoji yok", () => {
  assert.ok(USLUP_SISTEM_BOLUMU.includes("HAFİF ESPRİ (ARA SIRA)"));
  assert.ok(USLUP_SISTEM_BOLUMU.includes(ESPRI_ETIKETI));
  assert.ok(USLUP_ILIM_BOLUMU.includes("ESPRİ YOK"));
  for (const metin of [USLUP_SISTEM_BOLUMU, USLUP_YONERGELERI.espri]) {
    assert.ok(metin.includes("Allah"));
    assert.ok(metin.includes("etnik"));
    assert.ok(!/\p{Extended_Pictographic}/u.test(metin), "emoji var");
  }
});

test("espri: üslup yönergesine yalnızca kapı açıkken eklenir", () => {
  assert.ok(uslupYonergesiKur({ mesaj: "Selam, bugün kahveyi fazla kaçırdım galiba haha" }).includes(ESPRI_ETIKETI));
  for (const msg of ["Babamı kaybettim", "İntihar etmeyi düşünüyorum", "Faiz haram mı?", "Çok bunaldım, ağlıyorum"]) {
    assert.ok(!uslupYonergesiKur({ mesaj: msg }).includes(ESPRI_ETIKETI), msg);
  }
  assert.ok(
    !uslupYonergesiKur({ mesaj: "Selam, bugün kahveyi fazla kaçırdım galiba haha", ilimModu: true }).includes(ESPRI_ETIKETI)
  );
});

// --- Model girdisi (gerçek model çağrısı yok) --------------------------------

function ornekParams(over: Partial<GenerateSirdasReplyParams>): GenerateSirdasReplyParams {
  return {
    userMessage: "Merhaba",
    userProfile: {},
    effectiveTone: "SEFKATLI_TESKIN",
    distressLevel: 2,
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

test("model girdisi: espri yönergesi yalnızca kapı açıkken eklenir", () => {
  const acik = sonKullaniciMetni(ornekParams({ userMessage: "Selam, bugün kahveyi fazla kaçırdım galiba haha" }));
  assert.ok(acik.includes(ESPRI_ETIKETI));

  for (const msg of ["Babamı kaybettim", "İntihar etmeyi düşünüyorum", "Faiz haram mı?", "Çok bunaldım, ağlıyorum"]) {
    assert.ok(!sonKullaniciMetni(ornekParams({ userMessage: msg })).includes(ESPRI_ETIKETI), msg);
  }

  const ilim = sonKullaniciMetni(
    ornekParams({ userMessage: "Selam, bugün kahveyi fazla kaçırdım galiba haha", intentMode: "ILIM_VE_SIYER" })
  );
  assert.ok(!ilim.includes(ESPRI_ETIKETI));

  const sikinti = sonKullaniciMetni(
    ornekParams({ userMessage: "Selam, bugün kahveyi fazla kaçırdım galiba haha", distressLevel: 8 })
  );
  assert.ok(!sikinti.includes(ESPRI_ETIKETI));
});
