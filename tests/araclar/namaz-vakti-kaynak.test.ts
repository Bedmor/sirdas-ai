import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { ILLER, ilBul } from "../../src/lib/araclar/iller";
import { bolgeZamani } from "../../src/lib/araclar/namaz-vakitleri";
import { ilVakitleri, ilceListesi, kaynakDurumunuSifirla } from "../../src/lib/araclar/namaz-vakti-kaynak";
import { GET } from "../../src/app/api/namaz-vakitleri/route";
import { NextRequest } from "next/server";

const gercekFetch = globalThis.fetch;
let istekler: string[] = [];

type Cevap = { durum: number; govde?: unknown };
function fetchTaklidi(yonlendir: (url: string) => Cevap) {
  globalThis.fetch = (async (girdi: string | URL | Request) => {
    const url = String(girdi instanceof Request ? girdi.url : girdi);
    istekler.push(url);
    const c = yonlendir(url);
    return new Response(JSON.stringify(c.govde ?? {}), {
      status: c.durum,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

function aladhanGovdesi(url: string) {
  const tarih = url.match(/timings\/(\d{2}-\d{2}-\d{4})/)![1];
  return {
    data: {
      timings: { Fajr: "06:13", Sunrise: "07:41", Dhuhr: "12:53", Asr: "15:32", Maghrib: "17:55", Isha: "19:18 (+03)" },
      date: { gregorian: { date: tarih } },
      meta: { timezone: "Europe/Istanbul" },
    },
  };
}

beforeEach(() => {
  istekler = [];
  kaynakDurumunuSifirla();
});
afterEach(() => {
  globalThis.fetch = gercekFetch;
});

const yakin = (a: number, b: number, tolerans = 0.05) =>
  assert.ok(Math.abs(a - b) <= tolerans, `${a} ile ${b} arasındaki fark ${tolerans}'ten büyük`);

test("Statik il listesi: 81 il, kodlar tekil, koordinatlar Türkiye içinde", () => {
  assert.equal(ILLER.length, 81);
  assert.equal(new Set(ILLER.map((i) => i.id)).size, 81);
  assert.equal(new Set(ILLER.map((i) => i.plaka)).size, 81);
  for (const il of ILLER) {
    assert.ok(il.lat > 35.5 && il.lat < 42.2 && il.lng > 25.5 && il.lng < 45, il.ad);
    assert.match(il.merkezIlceId, /^\d+$/);
  }
});

test("Statik listeden İstanbul, Ankara, Bursa koordinatı", () => {
  const ist = ilBul("539")!;
  assert.equal(ist.ad, "İstanbul");
  assert.equal(ist.plaka, 34);
  yakin(ist.lat, 41.01);
  yakin(ist.lng, 28.98);

  const ank = ilBul("506")!;
  assert.equal(ank.ad, "Ankara");
  yakin(ank.lat, 39.92);
  yakin(ank.lng, 32.85);

  const bur = ilBul("520")!;
  assert.equal(bur.ad, "Bursa");
  yakin(bur.lat, 40.18);
  yakin(bur.lng, 29.07);
});

test("Bilinmeyen il kodu listede yok", () => {
  assert.equal(ilBul("999"), undefined);
  assert.equal(ilBul(""), undefined);
});

test("ezanvakti reddedince il merkezi koordinatıyla Aladhan method=13'e düşer", async () => {
  fetchTaklidi((url) => (url.includes("ezanvakti") ? { durum: 403 } : { durum: 200, govde: aladhanGovdesi(url) }));
  const v = await ilVakitleri(ilBul("539"), "9541", "İstanbul");
  assert.equal(v.kaynak, "hesap");
  assert.equal(v.yer, "İstanbul");
  assert.equal(v.saatDilimi, "Europe/Istanbul");
  assert.equal(v.gunler.length, 2);
  assert.equal(v.gunler[0].imsak, "06:13");
  assert.equal(v.gunler[0].yatsi, "19:18");
  assert.equal(v.gunler[0].hicri, undefined, "Aladhan modunda hicri tarih gösterilmez");
  assert.ok(istekler[0].includes("ezanvakti.emushaf.net/vakitler/9541"));
  const aladhan = istekler.filter((u) => u.includes("aladhan"));
  assert.equal(aladhan.length, 2);
  for (const u of aladhan) assert.ok(u.includes("latitude=41.01&longitude=28.98&method=13"), u);

  // Kaynak bir süre denenmez; ikinci istek doğrudan yedeğe gider (önbellekten).
  istekler = [];
  const v2 = await ilVakitleri(ilBul("506"), "9206", "Ankara");
  assert.equal(v2.kaynak, "hesap");
  assert.equal(istekler.filter((u) => u.includes("ezanvakti")).length, 0);
  assert.ok(istekler.every((u) => u.includes("latitude=39.92&longitude=32.85")));
});

test("ezanvakti ağ hatasında da yedeğe düşer", async () => {
  globalThis.fetch = (async (girdi: string | URL | Request) => {
    const url = String(girdi);
    istekler.push(url);
    if (url.includes("ezanvakti")) throw new TypeError("fetch failed");
    return new Response(JSON.stringify(aladhanGovdesi(url)), { status: 200 });
  }) as typeof fetch;
  const v = await ilVakitleri(ilBul("520"), undefined, "Bursa");
  assert.equal(v.kaynak, "hesap");
  assert.ok(istekler[0].includes("/vakitler/9335"), "ilçe yoksa il merkezi kodu denenir");
});

test("ezanvakti çalışırsa Diyanet tablosu ve hicri tarih döner", async () => {
  const bugun = bolgeZamani(new Date(), "Europe/Istanbul").tarih;
  const [y, a, g] = bugun.split("-");
  fetchTaklidi((url) =>
    url.includes("ezanvakti")
      ? {
          durum: 200,
          govde: [
            {
              MiladiTarihKisa: `${g}.${a}.${y}`,
              HicriTarihUzun: "2 Cemaziyelahir 1448",
              Imsak: "06:13",
              Gunes: "07:41",
              Ogle: "12:53",
              Ikindi: "15:31",
              Aksam: "17:56",
              Yatsi: "19:18",
            },
          ],
        }
      : { durum: 500 }
  );
  const v = await ilVakitleri(ilBul("539"), "9541", "İstanbul");
  assert.equal(v.kaynak, "diyanet");
  assert.equal(v.gunler[0].hicri, "2 Cemaziyelahir 1448");
  assert.equal(v.gunler[0].ikindi, "15:31");
  assert.equal(istekler.filter((u) => u.includes("aladhan")).length, 0);
});

test("İlçe listesi alınamazsa yalnız il merkezi döner", async () => {
  fetchTaklidi(() => ({ durum: 403 }));
  const liste = await ilceListesi(ilBul("539")!);
  assert.deepEqual(liste, [{ id: "9541", ad: "İstanbul" }]);
});

test("Her iki kaynak da çökerse hata yükselir (sayfa 502 alır)", async () => {
  fetchTaklidi(() => ({ durum: 503 }));
  await assert.rejects(() => ilVakitleri(ilBul("539"), "9541", "İstanbul"));
});

const istek = (q: string) => GET(new NextRequest(`http://yerel/api/namaz-vakitleri?${q}`));

test("API: bilinmeyen ve geçersiz il kodu 400 döner, dış kaynağa gidilmez", async () => {
  fetchTaklidi(() => ({ durum: 200, govde: [] }));
  for (const q of ["il=999", "tip=ilceler&il=999", "il=abc", "il=539&ilce=x1", "tip=ilceler&il=1234567"]) {
    const r = await istek(q);
    assert.equal(r.status, 400, q);
    const j = (await r.json()) as { hata: string };
    assert.ok(j.hata.length > 0);
  }
  assert.equal(istekler.length, 0);
});

test("API: il listesi statik, 81 il, dış kaynağa gitmez", async () => {
  fetchTaklidi(() => ({ durum: 403 }));
  const r = await istek("tip=iller");
  assert.equal(r.status, 200);
  const j = (await r.json()) as { id: string; ad: string }[];
  assert.equal(j.length, 81);
  assert.ok(j.some((x) => x.id === "539" && x.ad === "İstanbul"));
  assert.equal(istekler.length, 0);
});

test("API: ezanvakti engelliyken İstanbul vakitleri 200 döner", async () => {
  fetchTaklidi((url) => (url.includes("ezanvakti") ? { durum: 403 } : { durum: 200, govde: aladhanGovdesi(url) }));
  const ilceler = await istek("tip=ilceler&il=539");
  assert.equal(ilceler.status, 200);
  assert.deepEqual(await ilceler.json(), [{ id: "9541", ad: "İstanbul" }]);
  const r = await istek("il=539&ilce=9541");
  assert.equal(r.status, 200);
  const j = (await r.json()) as { kaynak: string; gunler: unknown[] };
  assert.equal(j.kaynak, "hesap");
  assert.equal(j.gunler.length, 2);
});
