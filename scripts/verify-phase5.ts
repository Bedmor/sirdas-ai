import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest } from "next/server";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   SIRDAŞ AI - PHASE 5 WEB & API VERIFICATION TEST");
  console.log("=======================================================\n");

  const rootDir = process.cwd();

  // Test 1: Files existence
  console.log("[1] Checking Web Interfaces & Modular Components Existence...");
  const requiredPages = [
    "src/app/page.tsx",
    "src/app/gizlilik-politikasi/page.tsx",
    "src/app/sorumluluk-reddi/page.tsx",
    "src/app/askida-sirdas/page.tsx",
    "src/app/askida-sirdas/basarili/page.tsx",
    "src/app/askida-sirdas/hata/page.tsx",
    "src/app/admin/layout.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/vas-reports/page.tsx",
    "src/app/admin/audit-logs/page.tsx",
    "src/app/admin/knowledge/page.tsx",
    "src/app/api/admin/stats/route.ts",
    "src/app/api/admin/vas-export/route.ts",
    "src/app/api/admin/knowledge/route.ts",
    "src/app/api/webhook/payment/route.ts",
    "src/app/api/donation/checkout/route.ts",
    "src/components/layout/Navbar.tsx",
    "src/components/layout/Footer.tsx",
    "src/components/layout/DisclaimerBanner.tsx",
    "src/components/landing/hero.tsx",
    "src/components/landing/manifesto.tsx",
    "src/components/landing/features.tsx",
    "src/components/donation/pool-counter.tsx",
    "src/components/donation/donation-box.tsx",
    "src/components/admin/metric-cards.tsx",
    "src/components/admin/vas-chart.tsx",
    "src/components/admin/audit-table.tsx",
    "src/lib/payment/paytr.ts",
    "src/lib/payment/iyzico.ts",
    "src/components/ui/button.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/dialog.tsx",
    "src/components/ui/tabs.tsx",
  ];

  for (const file of requiredPages) {
    const fullPath = path.join(rootDir, file);
    assert(fs.existsSync(fullPath), `${file} exists`);
  }

  // Test 2: Landing Page & Dark Theme
  console.log("\n[2] Checking Landing Page & Design Requirements...");
  const layoutContent = fs.readFileSync(path.join(rootDir, "src/app/layout.tsx"), "utf-8");
  assert(layoutContent.includes('className="dark"'), "Root layout sets dark theme class by default");

  const landingContent = fs.readFileSync(path.join(rootDir, "src/app/page.tsx"), "utf-8");
  const heroContent = fs.readFileSync(path.join(rootDir, "src/components/landing/hero.tsx"), "utf-8");
  assert(heroContent.includes("Gönül Yaralarına"), "Landing page hero contains primary headline");
  assert(landingContent.includes("wa.me"), "Landing page contains direct WhatsApp CTA link");
  assert(landingContent.includes("Hero"), "Landing page imports modular Hero component");
  assert(landingContent.includes("Manifesto"), "Landing page imports modular Manifesto component");
  assert(landingContent.includes("Features"), "Landing page imports modular Features component");
  assert(landingContent.includes("Halis Aydemir Sohbet Kesitleri"), "Landing page contains Halis Aydemir audio section");
  assert(landingContent.includes("Sıkça Sorulan Sorular"), "Landing page contains FAQ section");

  const manifestoContent = fs.readFileSync(path.join(rootDir, "src/components/landing/manifesto.tsx"), "utf-8");
  assert(manifestoContent.includes("Murakabe"), "Manifesto contains Murakabe spiritual filter");
  assert(manifestoContent.includes("İlahi Rıza Mizanı"), "Manifesto contains İlahi Rıza Mizanı filter");
  assert(manifestoContent.includes("Mutlak Tevekkül"), "Manifesto contains Tevekkül filter");
  assert(manifestoContent.includes("Talâk 2-3"), "Manifesto contains Talak 2-3 exit hope filter");
  assert(manifestoContent.includes("İmtihan Bilinci"), "Manifesto contains İmtihan Bilinci filter");
  assert(manifestoContent.includes("Siyer ve Ashab Mührü"), "Manifesto contains Siyer Mührü");

  // Test 3: Legal & Disclaimer Pages
  console.log("\n[3] Checking Legal & Religious Disclaimer Pages...");
  const privacyContent = fs.readFileSync(path.join(rootDir, "src/app/gizlilik-politikasi/page.tsx"), "utf-8");
  assert(privacyContent.includes("KVKK"), "Privacy policy complies with KVKK");
  assert(privacyContent.includes("waMessageId"), "Privacy policy details retry storm / idempotency tracking");
  assert(privacyContent.includes("Meta WhatsApp Cloud API"), "Privacy policy mentions Meta API");

  const disclaimerContent = fs.readFileSync(path.join(rootDir, "src/app/sorumluluk-reddi/page.tsx"), "utf-8");
  assert(disclaimerContent.includes("Alo 190"), "Disclaimer highlights Diyanet Alo 190 Fetva Hattı");
  assert(disclaimerContent.includes("112 Acil"), "Disclaimer highlights 112 Acil Çağrı");
  assert(disclaimerContent.includes("182"), "Disclaimer highlights 182 MHRS Sağlık Hattı");
  assert(disclaimerContent.includes("Fetva Mercii Değildir"), "Disclaimer explicitly denies fatwa authority");

  // Test 4: Askıda Sırdaş Page
  console.log("\n[4] Checking Askıda Sırdaş Page & Donation Components...");
  const askidaContent = fs.readFileSync(path.join(rootDir, "src/app/askida-sirdas/page.tsx"), "utf-8");
  assert(askidaContent.includes("PoolCounter"), "Askıda page renders modular PoolCounter");
  assert(askidaContent.includes("DonationBox"), "Askıda page renders modular DonationBox");

  const poolCounterContent = fs.readFileSync(path.join(rootDir, "src/components/donation/pool-counter.tsx"), "utf-8");
  assert(poolCounterContent.includes("142.850 adet"), "PoolCounter supports 142.850 sponsored messages");
  assert(poolCounterContent.includes("24.300 ₺"), "PoolCounter supports 24.300 ₺ balance");

  const donationBoxContent = fs.readFileSync(path.join(rootDir, "src/components/donation/donation-box.tsx"), "utf-8");
  assert(donationBoxContent.includes("PRESET_AMOUNTS"), "DonationBox defines preset amounts");
  assert(donationBoxContent.includes("PAYTR"), "DonationBox integrates PayTR");
  assert(donationBoxContent.includes("IYZICO"), "DonationBox integrates iyzico");

  // Test 5: Admin Dashboards & Distress Filter
  console.log("\n[5] Checking Admin Dashboard & Audit Logs...");
  const auditLogsContent = fs.readFileSync(path.join(rootDir, "src/app/admin/audit-logs/page.tsx"), "utf-8");
  assert(auditLogsContent.includes("filterDistress"), "Audit logs page implements distress score filter state");
  assert(auditLogsContent.includes("Kriz / Distress Skoru"), "Audit logs toolbar contains Distress Score selector");
  assert(auditLogsContent.includes("Kriz:"), "Audit logs display tiered distress indicator badge");

  const vasReportsContent = fs.readFileSync(path.join(rootDir, "src/app/admin/vas-reports/page.tsx"), "utf-8");
  assert(vasReportsContent.includes("VasChart"), "VAS reports page renders VasChart visual component");

  // Test 6: API Route - Admin Stats
  console.log("\n[6] Testing /api/admin/stats Route Handler...");
  const statsRoute = await import("../src/app/api/admin/stats/route");
  const statsResponse = await statsRoute.GET();
  assert(statsResponse.status === 200, "/api/admin/stats returns 200 OK");
  const statsJson = await statsResponse.json();
  assert(statsJson.success === true, "stats response indicates success: true");
  assert(statsJson.data.users !== undefined, "stats data includes users");
  assert(statsJson.data.conversations !== undefined, "stats data includes active conversations");
  assert(statsJson.data.messages !== undefined, "stats data includes messages");
  assert(statsJson.data.donations !== undefined, "stats data includes donations pool");
  assert(statsJson.data.vas !== undefined, "stats data includes VAS metrics");
  assert(statsJson.data.knowledge !== undefined, "stats data includes knowledge metrics");

  // Test 7: API Route - Knowledge Chunks
  console.log("\n[7] Testing /api/admin/knowledge Route Handler...");
  const knowledgeRoute = await import("../src/app/api/admin/knowledge/route");
  const knowledgeReq = new NextRequest("http://localhost:3000/api/admin/knowledge");
  const knowledgeRes = await knowledgeRoute.GET(knowledgeReq);
  assert(knowledgeRes.status === 200, "/api/admin/knowledge returns 200 OK");
  const knowledgeJson = await knowledgeRes.json();
  assert(knowledgeJson.success === true, "Knowledge API returns success: true");
  assert(Array.isArray(knowledgeJson.data) && knowledgeJson.data.length > 0, "Knowledge API returns array of chunks");
  assert(
    knowledgeJson.data.some((c: any) => c.sourceType === "HALIS_AYDEMIR" && c.audioUrl),
    "Knowledge chunks include Halis Aydemir audio preview"
  );

  // Test 8: API Route - VAS Export (CSV & JSON)
  console.log("\n[8] Testing /api/admin/vas-export Route Handler...");
  const vasExportRoute = await import("../src/app/api/admin/vas-export/route");

  // 8a: JSON format
  const jsonReq = new NextRequest("http://localhost:3000/api/admin/vas-export?format=json");
  const jsonRes = await vasExportRoute.GET(jsonReq);
  assert(jsonRes.status === 200, "vas-export JSON returns 200 OK");
  const vasData = await jsonRes.json();
  assert(vasData.success === true, "vas-export JSON returns success: true");
  assert(Array.isArray(vasData.data) && vasData.data.length > 0, "vas-export returns array of logs");

  // 8b: CSV format
  const csvReq = new NextRequest("http://localhost:3000/api/admin/vas-export?format=csv");
  const csvRes = await vasExportRoute.GET(csvReq);
  assert(csvRes.status === 200, "vas-export CSV returns 200 OK");
  const csvHeader = csvRes.headers.get("content-type");
  assert(csvHeader?.includes("text/csv") === true, "vas-export CSV sets text/csv Content-Type");
  const csvBody = await csvRes.text();
  assert(csvBody.includes("Kayit_ID") && csvBody.includes("Operator_Esdeger_Dakika"), "CSV body contains required headers");

  // Test 9: API Route - Donation Checkout
  console.log("\n[9] Testing /api/donation/checkout Route Handler...");
  const checkoutRoute = await import("../src/app/api/donation/checkout/route");
  const checkoutReq = new NextRequest("http://localhost:3000/api/donation/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: 250,
      donorName: "Veli Kul",
      donorPhone: "+905551112233",
      paymentProvider: "PAYTR",
      isAnonymous: false,
    }),
  });
  const checkoutRes = await checkoutRoute.POST(checkoutReq);
  assert(checkoutRes.status === 200, "/api/donation/checkout returns 200 OK");
  const checkoutJson = await checkoutRes.json();
  assert(checkoutJson.success === true, "Checkout returns success: true");
  assert(checkoutJson.amount === 250, "Checkout records correct amount 250");
  assert(checkoutJson.redirectUrl.includes("basarili"), "Checkout provides return URL to /askida-sirdas/basarili");

  // Test 10: API Route - Webhook Payment & Hash Verification
  console.log("\n[10] Testing /api/webhook/payment Route Handler & Hash Verification...");
  const paymentWebhookRoute = await import("../src/app/api/webhook/payment/route");

  // 10a: Generic IPN update
  const ipnReq = new NextRequest("http://localhost:3000/api/webhook/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      donationId: checkoutJson.donationId,
      transactionId: checkoutJson.transactionId,
      status: "SUCCESS",
    }),
  });
  const ipnRes = await paymentWebhookRoute.POST(ipnReq);
  assert(ipnRes.status === 200, "Payment webhook handles generic notification with 200 OK");

  // 10b: PayTR HMAC verification test
  const { verifyPayTrHash } = await import("../src/lib/payment/paytr");
  // Temporarily set keys to test verification security
  process.env.PAYTR_MERCHANT_KEY = "test_key_123";
  process.env.PAYTR_MERCHANT_SALT = "test_salt_456";

  const badHashResult = verifyPayTrHash({
    merchant_oid: "test_oid",
    status: "success",
    total_amount: "1000",
    hash: "invalid_hash_signature",
  });
  assert(badHashResult.isValid === false, "verifyPayTrHash rejects invalid hash signature");

  const missingHashResult = verifyPayTrHash({
    merchant_oid: "test_oid",
    status: "success",
    total_amount: "1000",
  });
  assert(missingHashResult.isValid === false, "verifyPayTrHash rejects missing hash when keys are set");

  const expectedToken = `test_oidtest_salt_456success1000`;
  const validHash = crypto.createHmac("sha256", "test_key_123").update(expectedToken).digest("base64");
  const validHashResult = verifyPayTrHash({
    merchant_oid: "test_oid",
    status: "success",
    total_amount: "1000",
    hash: validHash,
  });
  assert(validHashResult.isValid === true, "verifyPayTrHash accepts valid HMAC signature");

  // Restore env
  delete process.env.PAYTR_MERCHANT_KEY;
  delete process.env.PAYTR_MERCHANT_SALT;

  // Summary
  console.log("\n=======================================================");
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test threw error:", err);
  process.exit(1);
});
