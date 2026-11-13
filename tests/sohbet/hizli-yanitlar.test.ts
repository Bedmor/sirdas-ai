import { test } from "node:test";
import assert from "node:assert/strict";
import { geceGecMi, hizliYanitlar } from "../../src/lib/sohbet/hizli-yanitlar";

const etiketler = (x: { etiket: string }[]) => x.map((y) => y.etiket);

test("Normal cevapta sade düğmeler", () => {
  const d = hizliYanitlar({ icerik: "Sabır güzeldir.", intentMode: "MANEVI_AYNA" });
  assert.deepEqual(etiketler(d), ["Biraz daha anlat", "Bir dua öner", "Bugün ne yapabilirim?", "Konuyu değiştir"]);
});

test("Cevapta dua varsa duanın anlamı düğmesi çıkar", () => {
  const d = hizliYanitlar({ icerik: "Şöyle diyebilirsin: Allah'ım bana sabır ver." });
  assert.ok(etiketler(d).includes("Duanın anlamı"));
  assert.ok(!etiketler(d).includes("Bir dua öner"));
});

test("İlim modunda uygulama düğmesi", () => {
  assert.deepEqual(etiketler(hizliYanitlar({ icerik: "Hicret...", intentMode: "ILIM_VE_SIYER" })), [
    "Biraz daha anlat",
    "Hayatıma nasıl uygularım?",
    "Konuyu değiştir",
  ]);
});

test("Kriz, sağlık ve çocuk uyarısında düğme yok (kriz kutusu tek yönlendirme)", () => {
  for (const tur of ["crisis", "health", "child"] as const) {
    assert.deepEqual(hizliYanitlar({ icerik: "x", guvenlikTuru: tur }), []);
  }
  assert.deepEqual(hizliYanitlar({ icerik: "x", status: "crisis_redirected" }), []);
});

test("Fetva sınırında yalnız manevi yön ve konu değiştirme", () => {
  assert.deepEqual(etiketler(hizliYanitlar({ icerik: "x", guvenlikTuru: "fatwa" })), [
    "Manevi yönünü anlat",
    "Konuyu değiştir",
  ]);
});

test("Boş cevapta düğme yok; metinlerde emoji ve uzun tire yok", () => {
  assert.deepEqual(hizliYanitlar({ icerik: "  " }), []);
  const hepsi = [
    ...hizliYanitlar({ icerik: "a" }),
    ...hizliYanitlar({ icerik: "Rabbim", intentMode: "MANEVI_AYNA" }),
    ...hizliYanitlar({ icerik: "a", intentMode: "ILIM_VE_SIYER" }),
    ...hizliYanitlar({ icerik: "a", guvenlikTuru: "fatwa" }),
  ];
  for (const h of hepsi) assert.doesNotMatch(h.etiket + h.gonderilecek, /[–—]|\p{Extended_Pictographic}/u);
});

test("Gece geç saatte 'Bugün ne yapabilirim?' ve 'Biraz daha anlat' çıkmaz", () => {
  const d = etiketler(hizliYanitlar({ icerik: "Sabır güzeldir.", intentMode: "MANEVI_AYNA", geceGec: true }));
  assert.ok(!d.includes("Bugün ne yapabilirim?"));
  assert.ok(!d.includes("Biraz daha anlat"));
  assert.deepEqual(d, ["Uyumadan önce bir dua", "Yarın ne yapabilirim?"]);
  const ilim = etiketler(hizliYanitlar({ icerik: "Hicret...", intentMode: "ILIM_VE_SIYER", geceGec: true }));
  assert.ok(!ilim.includes("Biraz daha anlat"));
});

test("Gece saati aralığı üslup süzgeciyle aynı (00:30-04:59)", () => {
  const saat = (s: number, d: number) => new Date(2026, 10, 13, s, d);
  assert.equal(geceGecMi(saat(0, 29)), false);
  assert.equal(geceGecMi(saat(0, 30)), true);
  assert.equal(geceGecMi(saat(3, 0)), true);
  assert.equal(geceGecMi(saat(4, 59)), true);
  assert.equal(geceGecMi(saat(5, 0)), false);
  assert.equal(geceGecMi(saat(14, 0)), false);
});

test("Kullanıcı vedalaştıysa düğme çıkmaz (kapanış iyiliği, kanca yok)", () => {
  assert.deepEqual(hizliYanitlar({ icerik: "Allah razı olsun.", kullaniciSonMesaj: "Çok teşekkür ederim" }), []);
  assert.deepEqual(hizliYanitlar({ icerik: "Hayırlı geceler.", kullaniciSonMesaj: "iyi geceler" }), []);
  assert.ok(hizliYanitlar({ icerik: "Sabır güzeldir.", kullaniciSonMesaj: "İşimi kaybettim" }).length > 0);
});
