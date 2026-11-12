import { test } from "node:test";
import assert from "node:assert/strict";
import { saattenDilim, vakitAyetiSec } from "../../src/lib/araclar/vakit-ayeti";

test("Saat dilimleri", () => {
  assert.equal(saattenDilim(4), "seher");
  assert.equal(saattenDilim(7), "sabah");
  assert.equal(saattenDilim(10), "kusluk");
  assert.equal(saattenDilim(15), "ikindi");
  assert.equal(saattenDilim(18), "aksam");
  assert.equal(saattenDilim(23), "gece");
  assert.equal(saattenDilim(1), "gece");
});

test("Her saat için boş olmayan ayet seçilir", () => {
  for (let h = 0; h < 24; h++) {
    const { ayet } = vakitAyetiSec(new Date(2026, 10, 12, h, 0));
    assert.ok(ayet.meal.length > 10 && ayet.arapca.length > 5, `${h}:00 için ayet boş`);
  }
});
