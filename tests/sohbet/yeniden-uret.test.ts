import { test } from "node:test";
import assert from "node:assert/strict";
import { yenidenUretPlani, yenidenUretilebilirMi } from "../../src/lib/sohbet/yeniden-uret";

type M = { id: string; role: "user" | "assistant"; content: string; status?: string; safety?: { kind: string } | null };

const sohbet: M[] = [
  { id: "1", role: "user", content: "Selam" },
  { id: "2", role: "assistant", content: "Aleyküm selam." },
  { id: "3", role: "user", content: "  İçim çok daralıyor, ne yapmalıyım?  " },
  { id: "4", role: "assistant", content: "Sabret, dua et." },
];

test("yeniden üret: son soruyu aynen ve öncesindeki geçmişi verir", () => {
  const p = yenidenUretPlani(sohbet);
  assert.ok(p);
  assert.equal(p.soru, "İçim çok daralıyor, ne yapmalıyım?");
  assert.deepEqual(p.oncekiMesajlar.map((m) => m.id), ["1", "2"]);
  assert.equal(p.soruMesaji.id, "3");
});

test("yeniden üret: son mesaj kullanıcıdaysa ya da sohbet boşsa plan yok", () => {
  assert.equal(yenidenUretPlani(sohbet.slice(0, 3)), null);
  assert.equal(yenidenUretPlani([]), null);
  assert.equal(yenidenUretPlani([{ id: "x", role: "assistant", content: "Hoş geldin" }]), null);
});

test("yeniden üret: kriz yönlendirmesi ve kriz uyarılı cevap yeniden üretilmez", () => {
  const kriz = [...sohbet.slice(0, 3), { ...sohbet[3], status: "crisis_redirected" }];
  assert.equal(yenidenUretPlani(kriz), null);
  const uyari = [...sohbet.slice(0, 3), { ...sohbet[3], safety: { kind: "crisis" } }];
  assert.equal(yenidenUretPlani(uyari), null);
  assert.equal(yenidenUretilebilirMi(uyari[3]), false);
});

test("yeniden üret: fetva sınırı veya sağlık uyarısı olan cevap yeniden üretilebilir (sunucu süzgeci yine çalışır)", () => {
  const fetva = [...sohbet.slice(0, 3), { ...sohbet[3], status: "fatwa_blocked", safety: { kind: "fatwa" } }];
  assert.ok(yenidenUretPlani(fetva));
});

test("yeniden üret: arka arkaya iki asistan mesajında soru belirsizdir", () => {
  assert.equal(yenidenUretPlani([...sohbet, { id: "5", role: "assistant", content: "Ek not." }]), null);
});
