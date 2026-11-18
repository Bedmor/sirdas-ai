// Gerçek model çağrılmaz.
process.env.GEMINI_API_KEY = "mock_gemini_key_for_testing_and_verification";

import { test } from "node:test";
import assert from "node:assert/strict";
import { imkansizBeyanTespit, runSafetyTriage } from "../../src/lib/safety/triage";
import { runHeuristicFallback } from "../../src/lib/ai/jev-client";
import { fetvaPlaniKur } from "../../src/lib/ai/fetva-akisi";
import { USLUP_SISTEM_BOLUMU, USLUP_YONERGELERI, uslupAnalizEt, uslupYonergesiKur } from "../../src/lib/uslup";

function yonerge(mesaj: string): string {
  return uslupYonergesiKur({ mesaj, gecmis: [] } as never);
}

// --- Akıl ve gerçeklik süzgeci (18.11 çocuk/trol yaması) ---

test("akıl süzgeci: yazıyla soru soran '2 yaşında bir çocuğum' süzgece girer, kalıp çocuk cevabına düşmez", () => {
  const m = "2 yaşında bir çocuğum namaz kılmasam günah mı";
  assert.equal(imkansizBeyanTespit(m), "BEBEK_YASI");
  const triage = runSafetyTriage(m);
  assert.notEqual(triage?.category, "CHILD_AGE", "model atlanmaz");
  assert.equal(triage?.bypassModel ?? false, false);
  assert.match(yonerge(m), /AKIL VE GERÇEKLİK SÜZGECİ/);
  assert.ok(!/YAŞ VE BAĞLAM ÇELİŞKİSİ/.test(yonerge(m)), "çelişen ikinci yönerge eklenmez");
  // Fıkhi konu: fetva akışı açık, kapanış eklenecek.
  assert.equal(fetvaPlaniKur(m, runHeuristicFallback(m), triage).aktif, true);
});

test("akıl süzgeci: okuma yazma bilmeyen ve ölü beyanları yakalanır", () => {
  assert.equal(imkansizBeyanTespit("Okuma yazma bilmeyen 2 yaşında bir çocuğum, namaz kılmasam günah mı?"), "OKUMA_YAZMA");
  assert.equal(imkansizBeyanTespit("Okuma yazma bilmiyorum ama şu an size yazıyorum, oruç farz mı"), "OKUMA_YAZMA");
  assert.equal(imkansizBeyanTespit("Ben ölü biriyim, mezardan yazıyorum"), "OLU");
});

test("akıl süzgeci: 6-17 yaş beyanı ASLA süzgece girmez, alaya alınmaz", () => {
  for (const m of ["12 yaşındayım namaz kılmasam günah mı", "8 yaşındayım, dua öğrenmek istiyorum", "16 yaşındayım lisedeyim, sınav kaygım var"]) {
    assert.equal(imkansizBeyanTespit(m), null, m);
    assert.ok(!/AKIL VE GERÇEKLİK/.test(yonerge(m)), m);
  }
  // 12 yaş: fetva akışı normal çalışır.
  const m = "12 yaşındayım namaz kılmasam günah mı";
  assert.equal(fetvaPlaniKur(m, runHeuristicFallback(m), runSafetyTriage(m)).aktif, true);
  // 8 yaş: eski çocuk akışı (yetişkine yönlendirme) aynen sürer.
  assert.equal(runSafetyTriage("8 yaşındayım, dua öğrenmek istiyorum")?.category, "CHILD_AGE");
});

test("akıl süzgeci: ebeveyn anlatımı süzgece girmez", () => {
  for (const m of ["3 yaşındaki çocuğum hasta", "3 yaşında bir çocuğum var, ona dua öğretmek istiyorum", "2 yaşındaki kızım geceleri uyumuyor"]) {
    assert.equal(imkansizBeyanTespit(m), null, m);
    assert.ok(!/AKIL VE GERÇEKLİK/.test(yonerge(m)), m);
  }
});

test("akıl süzgeci: kriz, istismar ve sağlık mesajında devreye girmez; kriz akışı önceliklidir", () => {
  for (const m of [
    "2 yaşındayım ve ölmek istiyorum",
    "5 yaşındayım babam beni dövüyor",
    "3 yaşındayım başım çok ağrıyor",
  ]) {
    const a = uslupAnalizEt({ mesaj: m, gecmis: [] } as never);
    assert.equal(a.akilSuzgeci, null, m);
    assert.ok(!/AKIL VE GERÇEKLİK/.test(yonerge(m)), m);
    assert.equal(runSafetyTriage(m)?.bypassModel, true, `güvenlik süzgeci modeli atlar: ${m}`);
  }
});

test("akıl süzgeci yönergesi: şefkatli, 'Evlat' örnekli; 'Hacım' ve korkutucu ifade yasak", () => {
  const y = USLUP_YONERGELERI.akilSuzgeci;
  assert.match(y, /Evlat/);
  assert.match(y, /"Hacım" hitabını kullanma/);
  assert.match(y, /Korkutucu ifade kullanma/);
  assert.match(y, /Alay etme/);
  assert.ok(!/Hacım,|Hacım \//.test(y));
});

// --- Fıtrat / fıtrî ayrımı ---

test("fıtrat/fıtrî: fıtrî yasak, fıtrat yaradılış anlamında ölçülü serbest", () => {
  assert.match(USLUP_SISTEM_BOLUMU, /"Fıtrî\/fıtri" kelimesini \("doğal, tabii" anlamında\) kullanma/);
  assert.match(USLUP_SISTEM_BOLUMU, /"doğal", "samimi", "yapmacıksız"/);
  assert.match(USLUP_SISTEM_BOLUMU, /"Fıtrat" kelimesini yalnız "yaradılıştaki saf hal" anlamında ve ölçülü kullan: bir cevapta en fazla bir kez/);
  assert.ok(!/"Fıtrî" ve "fıtrat" kelimelerini kullanma/.test(USLUP_SISTEM_BOLUMU), "eski toptan yasak kalktı");
  // Tekrar uyarısı: fıtrat bir kez geçince aynı sohbette tekrarı engellenir; fıtrî için öneri doğal/samimi.
  const y = uslupYonergesiKur({
    mesaj: "Peki ne yapayım?",
    gecmis: [
      { role: "user", content: "Çok yoruldum." },
      { role: "assistant", content: "İnsanın fıtratında yorulmak da var." },
    ],
  } as never);
  assert.match(y, /KELİME TEKRARI\] Bu sohbette şu kelimeleri zaten kullandın: fıtrat/);
  assert.match(USLUP_YONERGELERI.sikSoz(["fıtrî"]), /"fıtrî" yerine "doğal", "samimi"/);
});
