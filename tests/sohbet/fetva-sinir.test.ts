import { test } from "node:test";
import assert from "node:assert/strict";
import { runHeuristicFallback } from "../../src/lib/ai/jev-client";
import { fatwaRejectionMessage, FATWA_REJECTION_MESSAGES } from "../../src/lib/ai/jev-taxonomy";
import { runSafetyTriage } from "../../src/lib/safety/triage";

// 18.11 Adnan: "sen hani fetva vermiyordun" her seferinde aynı kalıp cevaba düşüyordu.
test("fetva: sohbette geçen 'fetva' kelimesi kalıp cevaba düşmez", () => {
  assert.ok(runHeuristicFallback("sen hani fetva vermiyordun").is_fiqh_fatwa_request < 0.75);
});

test("fetva: gerçek hüküm talebi hâlâ yakalanır", () => {
  assert.ok(runHeuristicFallback("bu konuda fetva verir misin").is_fiqh_fatwa_request >= 0.75);
  assert.ok(runHeuristicFallback("faiz haram mı").is_fiqh_fatwa_request >= 0.75);
});

test("fetva: kalıp cevap tek söyleyişe sıkışmaz, hepsi Alo 190 içerir", () => {
  const s = new Set(["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "ggggggg"].map(fatwaRejectionMessage));
  assert.ok(s.size > 1);
  assert.ok(FATWA_REJECTION_MESSAGES.every((m) => m.includes("Alo 190")));
});

// 18.11 Haydar: "Kaza namazı var mıdır nasıl kılmalıyım" kesin hüküm diliyle cevaplanmıştı.
test("fetva: kaza namazı uygulama sorusu fetva dipnotu alır, cevap modele kalır", () => {
  const r = runSafetyTriage("Kaza namazı var mıdır nasıl kılmalıyım");
  assert.equal(r?.category, "FATWA_LIMIT");
  assert.equal(r?.bypassModel, false);
});
