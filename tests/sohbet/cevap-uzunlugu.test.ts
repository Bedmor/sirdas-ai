import { test } from "node:test";
import assert from "node:assert/strict";
import { cevapUzunluguCoz, cevapUzunluguYonergesi } from "../../src/lib/sohbet/cevap-uzunlugu";

test("cevap uzunluğu: bilinmeyen değer NORMAL olur", () => {
  assert.equal(cevapUzunluguCoz(undefined), "NORMAL");
  assert.equal(cevapUzunluguCoz("abc"), "NORMAL");
  assert.equal(cevapUzunluguCoz("KISA"), "KISA");
  assert.equal(cevapUzunluguCoz("UZUN"), "UZUN");
});

test("cevap uzunluğu: NORMAL mevcut kurala dokunmaz, KISA/UZUN yönerge ekler", () => {
  assert.equal(cevapUzunluguYonergesi("NORMAL"), "");
  assert.match(cevapUzunluguYonergesi("KISA"), /KISA CEVAP/);
  assert.match(cevapUzunluguYonergesi("KISA"), /kriz/);
  assert.match(cevapUzunluguYonergesi("UZUN"), /DETAYLI CEVAP/);
});
