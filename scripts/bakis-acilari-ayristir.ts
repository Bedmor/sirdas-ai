/**
 * Kullanım: npx tsx scripts/bakis-acilari-ayristir.ts "<BAKIŞ AÇILARI PRONTLAR.txt>" [cikti.json]
 * Kılavuzu merceklere ayırır, tekrarları ayıklar, sayıları yazdırır.
 * Denetim (TEMİZ / YUMUŞAT / SOR) bu betiğin dışında, insan + yapay zekâ incelemesiyle yapılır;
 * derlemeye (src/data/corpus/bakis_acilari.json) yalnızca TEMİZ ve YUMUŞATILMIŞ olanlar girer.
 */
import fs from "fs";
import { ayristir } from "../src/lib/bakis/ayristirici";

const [kaynak, cikti] = process.argv.slice(2);
if (!kaynak) {
  console.error("Kaynak dosya yolu gerekli");
  process.exit(1);
}
const sonuc = ayristir(fs.readFileSync(kaynak, "utf8"));
const otomatik = sonuc.tekrarlar.filter((t) => t.tur === "otomatik");
console.log(
  JSON.stringify({
    toplamBlok: sonuc.toplamBlok,
    net: sonuc.net.length,
    tekrar: sonuc.tekrarlar.length,
    otomatikTekrar: otomatik.length,
    birebir: otomatik.filter((t) => t.birebir).length,
    ayniKonu: sonuc.tekrarlar.length - otomatik.length,
    bozuk: sonuc.bozuk.length,
  })
);
if (cikti) fs.writeFileSync(cikti, JSON.stringify(sonuc, null, 1), "utf8");
