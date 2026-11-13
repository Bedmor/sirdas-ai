import { test } from "node:test";
import assert from "node:assert/strict";
import {
  denetimIzleriniAyikla,
  uyariTetiklendi,
  bildirilecekKuralKodu,
  yersizBildirimGovdesi,
} from "../../src/lib/denetim/yersiz-uyari";

test("güvenlik, kalkan ve çıkış süzgecinde 'Bu uyarı yersiz miydi?' gösterilir", () => {
  for (const tur of ["GUVENLIK_ON_SUZGECI", "MANEVI_KALKAN", "CIKIS_SUZGECI"]) {
    assert.equal(uyariTetiklendi([{ tur, kuralKodu: "KURAL_1" }]), true);
  }
});

test("yalnız giriş maskelemesi varsa ya da olay yoksa gösterilmez", () => {
  assert.equal(uyariTetiklendi([{ tur: "GIRIS_MASKELEME", kuralKodu: "TELEFON" }]), false);
  assert.equal(uyariTetiklendi([]), false);
  assert.equal(uyariTetiklendi(undefined), false);
});

test("sunucudan gelen bozuk veri ayıklanır", () => {
  const izler = denetimIzleriniAyikla([
    { tur: "CIKIS_SUZGECI", kuralKodu: "TEK_SIRDAS" },
    { tur: "x", kuralKodu: 3 },
    null,
    "metin",
    { tur: "<script>", kuralKodu: "A" },
  ]);
  assert.deepEqual(izler, [{ tur: "CIKIS_SUZGECI", kuralKodu: "TEK_SIRDAS" }]);
  assert.deepEqual(denetimIzleriniAyikla("bozuk"), []);
});

test("bildirim gövdesi içerik taşımaz: yalnız evet, kural kodu, mesaj numarası", () => {
  const izler = [
    { tur: "GIRIS_MASKELEME", kuralKodu: "TELEFON" },
    { tur: "GUVENLIK_ON_SUZGECI", kuralKodu: "SAFETY_CRISIS" },
  ];
  assert.equal(bildirilecekKuralKodu(izler), "SAFETY_CRISIS");
  const govde = yersizBildirimGovdesi({
    sunucuMesajId: "0f8fad5b-d9cb-469f-a165-70867728950e",
    izler,
    clientId: "kimlik-12345678",
  });
  assert.deepEqual(govde, {
    yersiz: true,
    kuralKodu: "SAFETY_CRISIS",
    messageId: "0f8fad5b-d9cb-469f-a165-70867728950e",
    clientId: "kimlik-12345678",
  });
  assert.deepEqual(Object.keys(yersizBildirimGovdesi({ izler })).sort(), ["kuralKodu", "yersiz"]);
});
