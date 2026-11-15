import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAYLASIM_ADRESI,
  PAYLASIM_METNI,
  paylasimVerisi,
  paylasimTamMetni,
  whatsappPaylasimBaglantisi,
  degerlendirmeEpostaBaglantisi,
} from "../../src/lib/sohbet/paylas";

test("Paylaşım adresi canlı site adresidir", () => {
  assert.equal(PAYLASIM_ADRESI, "https://sirdas-ai.vercel.app");
  assert.equal(paylasimVerisi().url, PAYLASIM_ADRESI);
});

test("Paylaşım metni kısa ve sabittir (sohbet içeriği alamaz)", () => {
  assert.ok(PAYLASIM_METNI.length <= 180);
  // İşlevler hiçbir parametre almaz: kullanıcı içeriği metne giremez.
  assert.equal(paylasimVerisi.length, 0);
  assert.equal(paylasimTamMetni.length, 0);
  assert.equal(whatsappPaylasimBaglantisi.length, 0);
  assert.equal(paylasimTamMetni(), `${PAYLASIM_METNI}\n${PAYLASIM_ADRESI}`);
});

test("WhatsApp bağlantısı metni ve adresi kodlanmış taşır", () => {
  const b = whatsappPaylasimBaglantisi();
  assert.ok(b.startsWith("https://wa.me/?text="));
  const metin = decodeURIComponent(b.slice("https://wa.me/?text=".length));
  assert.equal(metin, paylasimTamMetni());
});

test("Değerlendirme e-postası puanı 1-5 aralığında tutar", () => {
  const b = degerlendirmeEpostaBaglantisi(9, "  Çok güzel  ");
  assert.ok(b.startsWith("mailto:adnan.kus@hotmail.com?subject="));
  const konu = decodeURIComponent(b.split("subject=")[1].split("&body=")[0]);
  assert.equal(konu, "Manevi Pusula - Değerlendirme (5/5)");
  const govde = decodeURIComponent(b.split("&body=")[1]);
  assert.ok(govde.includes("Puanım: 5/5"));
  assert.ok(govde.includes("Çok güzel"));
  assert.ok(decodeURIComponent(degerlendirmeEpostaBaglantisi(0)).includes("(1/5)"));
});

import { cevapPaylasimMetni, vurguIsaretleriniTemizle } from "../../src/lib/sohbet/paylas";
import { BASLANGIC_CIPLERI } from "../../src/lib/sohbet/hizli-yanitlar";

test("Cevap paylaşımı: yalnız cevap metni + kaynak satırı, vurgu işaretleri temizlenir", () => {
  const m = cevapPaylasimMetni("Rabbimiz **sabredenlerle** beraberdir. _Hasbünallah_ de.");
  assert.equal(m, "Rabbimiz sabredenlerle beraberdir. Hasbünallah de.\n\nManevi Pusula: https://sirdas-ai.vercel.app");
  assert.equal(vurguIsaretleriniTemizle("adres_bir_iki"), "adres_bir_iki");
});

test("Başlangıç çipleri kısa etiketli ve tek satırlık", () => {
  assert.ok(BASLANGIC_CIPLERI.length >= 4);
  for (const c of BASLANGIC_CIPLERI) {
    assert.ok(c.etiket.length <= 24);
    assert.ok(c.gonderilecek.length >= 10);
  }
});
