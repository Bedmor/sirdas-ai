import test from "node:test";
import assert from "node:assert/strict";
import { sohbetDosyaAdi, sohbetMetni } from "../../src/lib/sohbet/sohbet-disa-aktar";

test("sohbet metni sırayla ve vurgusuz yazılır", () => {
  const t = sohbetMetni(
    {
      title: "Sabır",
      messages: [
        { role: "user", content: "Canım sıkkın", createdAt: "2026-11-19T10:00:00" },
        { role: "assistant", content: "**Hayır olsun** kardeşim.", createdAt: "2026-11-19T10:01:00" },
        { role: "assistant", content: "   ", createdAt: "2026-11-19T10:02:00" },
      ],
    },
    new Date("2026-11-19T11:00:00")
  );
  assert.match(t, /Konu: Sabır/);
  assert.ok(t.indexOf("Siz (19.11.2026 10:00):") < t.indexOf("Sırdaş (19.11.2026 10:01):"));
  assert.match(t, /Hayır olsun kardeşim\./);
  assert.doesNotMatch(t, /\*\*/);
  assert.equal((t.match(/^Sırdaş/gm) ?? []).length, 1);
});

test("dosya adı tarihli", () => {
  assert.equal(sohbetDosyaAdi(new Date("2026-11-19T11:00:00")), "manevi-pusula-sohbet-19-11-2026.txt");
});
