import test from "node:test";
import assert from "node:assert/strict";
import { hataBildirimiTespit, uslupAnalizEt, uslupYonergesiKur } from "../../src/lib/uslup";
import { USLUP_SISTEM_BOLUMU, USLUP_YONERGELERI } from "../../src/lib/uslup/kurallar";
import { SIRDAS_MANEVI_AYNA_INSTRUCTION } from "../../src/lib/ai/constitution";
import { sohbetDenetimOlaylari } from "../../src/lib/denetim/kayit";
import { FETVA_UC_ASAMA_YONERGESI } from "../../src/lib/ai/fetva-akisi";

test("hata bildirimi yakalanır", () => {
  for (const m of ["Yanlış söyledin, böyle bir hadis yok", "Cevabın yanlış", "yanılıyorsun hocam", "Bu bilgi doğru değil", "hata yaptın"]) {
    assert.ok(hataBildirimiTespit(m), m);
  }
});

test("sıradan mesaj hata bildirimi sayılmaz", () => {
  for (const m of ["Yanlış bir iş yaptım, tevbe kabul olur mu?", "Hata yapmaktan korkuyorum", "Namaz nasıl kılınır?"]) {
    assert.equal(hataBildirimiTespit(m), false, m);
  }
});

test("hata bildiriminde tevazu yönergesi eklenir, kriz mesajında eklenmez", () => {
  const y = uslupYonergesiKur({ mesaj: "Yanlış söyledin", gecmis: [] } as never);
  assert.match(y, /HATA BİLDİRİMİ/);
  const kriz = uslupAnalizEt({ mesaj: "yanlış söyledin, artık yaşamak istemiyorum", gecmis: [] } as never);
  assert.equal(kriz.hataBildirimi, false);
});

test("hata bildirimi içeriksiz denetim olayı üretir", () => {
  const o = sohbetDenetimOlaylari({ kullaniciHataBildirdi: true });
  assert.deepEqual(o, [{ tur: "GELISTIRICI_GERI_BILDIRIMI", kuralKodu: "KULLANICI_HATA_BILDIRDI", eylem: "INCELENECEK" }]);
  assert.deepEqual(sohbetDenetimOlaylari({}), []);
});

test("19.11 yamaları sistem talimatında", () => {
  assert.match(USLUP_SISTEM_BOLUMU, /Kurban olduğum/);
  assert.match(USLUP_SISTEM_BOLUMU, /KİMLİK VE KÜNYE/);
  assert.match(USLUP_SISTEM_BOLUMU, /İMANÎ OMURGA/);
  assert.match(USLUP_SISTEM_BOLUMU, /BENİ TANIYOR MUSUN/);
  assert.match(USLUP_SISTEM_BOLUMU, /Binaenaleyh/);
  assert.match(SIRDAS_MANEVI_AYNA_INSTRUCTION, /FİTNE KORUMASI/);
  assert.match(SIRDAS_MANEVI_AYNA_INSTRUCTION, /Tirmizî, Sıfatü'l-Kıyâme 60/);
  assert.match(SIRDAS_MANEVI_AYNA_INSTRUCTION, /astroloji/);
});

test("akıl süzgeci Evlat ile başlatır, fetva cevabı 150 kelimeyi geçmez", () => {
  assert.match(USLUP_YONERGELERI.akilSuzgeci, /İLK cümlesi "Evlat,"/);
  assert.match(FETVA_UC_ASAMA_YONERGESI, /150 kelimeyi geçme/);
});
