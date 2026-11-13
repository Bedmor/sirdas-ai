import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HOCA_SOZLERI_BOLUMU,
  HOCA_SOZLERI_GUVENLIK_YONERGESI,
  uslupYonergesiKur,
} from "../../src/lib/uslup";
import {
  SIRDAS_MANEVI_AYNA_INSTRUCTION,
  SIRDAS_SAFETY_PRIORITY_RULES,
} from "../../src/lib/ai/constitution";

test("hoca sözleri: sistem talimatı üç eşleşmeyi ve kilit cümleleri içerir", () => {
  assert.ok(SIRDAS_MANEVI_AYNA_INSTRUCTION.includes(HOCA_SOZLERI_BOLUMU));
  assert.match(HOCA_SOZLERI_BOLUMU, /SORU-CEVAP EŞLEŞMELERİ/);
  for (const baslik of ["01 - İMKÂNSIZLIK", "02 - GELECEĞİ KONTROL", "03 - HIRS"]) {
    assert.ok(HOCA_SOZLERI_BOLUMU.includes(baslik), baslik);
  }
  assert.ok(HOCA_SOZLERI_BOLUMU.includes("Sen niyetini büyük tut. Sana imkânlar yaratacak olan Allah azze ve celle."));
  assert.ok(HOCA_SOZLERI_BOLUMU.includes("sen bana yönel, ben senin işini yapayım"));
  assert.ok(HOCA_SOZLERI_BOLUMU.includes("Tek gerçek ölüm, tek gerçek Allah."));
});

test("hoca sözleri: yazım düzeltmeleri uygulandı, hoca adı zikredilmez", () => {
  assert.ok(!HOCA_SOZLERI_BOLUMU.includes("Allah'ta onlara"));
  assert.ok(HOCA_SOZLERI_BOLUMU.includes("Allah da onlara"));
  assert.ok(!/\bimkanlar/.test(HOCA_SOZLERI_BOLUMU));
  assert.match(HOCA_SOZLERI_BOLUMU, /hoca adını .*zikretme/);
  assert.ok(!/Halis|Aydemir/.test(HOCA_SOZLERI_BOLUMU));
});

test("hoca sözleri: güvenlik istisnası yazılı ve güvenlik kuralları sonra (üstün) gelir", () => {
  assert.match(HOCA_SOZLERI_BOLUMU, /GÜVENLİK İSTİSNASI \(EŞLEŞMELERDEN ÖNCE GELİR\)/);
  assert.match(HOCA_SOZLERI_BOLUMU, /03 numaralı eşleşme .*KESİNLİKLE KULLANILMAZ/);
  for (const hal of ["kendine zarar", "ölmek istemekten", "yas içindeyse", "ağır bir hastalık", "teşhis"]) {
    assert.ok(HOCA_SOZLERI_BOLUMU.includes(hal), hal);
  }
  const i = SIRDAS_MANEVI_AYNA_INSTRUCTION.indexOf(HOCA_SOZLERI_BOLUMU);
  const g = SIRDAS_MANEVI_AYNA_INSTRUCTION.indexOf(SIRDAS_SAFETY_PRIORITY_RULES);
  assert.ok(i > 0 && g > i, "güvenlik öncelik sırası hoca sözlerinden sonra ve tam olarak bulunmalı");
});

test("hoca sözleri: kriz mesajında ölüm bilinci eşleşmesi kapatılır, normal mesajda kapatılmaz", () => {
  const kriz = uslupYonergesiKur({ mesaj: "Artık yaşamak istemiyorum, ölmek istiyorum" });
  assert.ok(kriz.includes(HOCA_SOZLERI_GUVENLIK_YONERGESI));
  const normal = uslupYonergesiKur({ mesaj: "Hırsım ve mal mülk kaygım beni yoruyor" });
  assert.ok(!normal.includes(HOCA_SOZLERI_GUVENLIK_YONERGESI));
});

test("hoca sözleri: kullanıcıya gidecek alıntılarda İngilizce yok", () => {
  const ozler = HOCA_SOZLERI_BOLUMU.split("\n").filter((s) => s.startsWith("- Cevabın özü:"));
  assert.equal(ozler.length, 3);
  for (const s of ozler) assert.ok(!/\b(the|and|patch|user|response)\b/i.test(s), s);
});
