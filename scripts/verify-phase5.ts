import "dotenv/config";
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
    "src/app/admin/audit-logs/page.tsx",
    "src/app/admin/knowledge/page.tsx",
    "src/app/api/admin/stats/route.ts",
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

  // Test 2: Landing Page (/tanitim) & Root Chat Workspace (/)
  console.log("\n[2] Checking Landing Page (/tanitim) & Root Chat Workspace (/) Requirements...");
  const layoutContent = fs.readFileSync(path.join(rootDir, "src/app/layout.tsx"), "utf-8");
  assert(layoutContent.includes('className="dark"'), "Root layout sets dark theme class by default");

  const rootPageContent = fs.readFileSync(path.join(rootDir, "src/app/page.tsx"), "utf-8");
  assert(rootPageContent.includes("SirdasChatWorkspace"), "Root page (/) renders SirdasChatWorkspace");

  const landingContent = fs.readFileSync(path.join(rootDir, "src/app/tanitim/page.tsx"), "utf-8");
  const heroContent = fs.readFileSync(path.join(rootDir, "src/components/landing/hero.tsx"), "utf-8");
  assert(heroContent.includes("Gönül Yaralarına"), "Landing page hero contains primary headline");
  assert(landingContent.includes("Manevi Pusula ile Dertleş") || landingContent.includes("Sırdaş ile Dertleş"), "Landing page contains direct in-app chat CTA link");
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
  assert(privacyContent.includes("retry storm") || privacyContent.includes("waMessageId"), "Privacy policy details retry storm / idempotency tracking");
  assert(privacyContent.includes("Web Sitesi ve Mobil Uygulama") || privacyContent.includes("Meta WhatsApp Cloud API"), "Privacy policy mentions supported platforms");

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
    knowledgeJson.data.some((c: any) => c.sourceType === "QURAN" || c.sourceType === "HADITH" || c.sourceType === "SIYER"),
    "Knowledge chunks include verified Quran/Hadith/Siyer sources"
  );

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

  // Test 11: Live Trial Section & 1-Time Per-User Limit (/api/trial)
  console.log("\n[11] Testing Live Trial Section & /api/trial 1-Time Limit Enforcement...");
  // Örnek senaryo vitrini (LiveTrialSection) 13.11'de Adnan Bey'in isteğiyle kaldırıldı.
  assert(!landingContent.includes("LiveTrialSection"), "Landing page no longer renders the example scenarios section");

  const trialRoute = await import("../src/app/api/trial/route");
  const uniqueTestIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
  const uniqueTestUa = `SirdasVerifyBot/1.0-${Date.now()}`;

  // 11a: Initial GET /api/trial should show remaining = 1, used = false
  const initialTrialGetReq = new NextRequest("http://localhost:3000/api/trial", {
    method: "GET",
    headers: {
      "x-forwarded-for": uniqueTestIp,
      "user-agent": uniqueTestUa,
    },
  });
  const initialTrialGetRes = await trialRoute.GET(initialTrialGetReq);
  assert(initialTrialGetRes.status === 200, "GET /api/trial returns 200 OK for new visitor");
  const initialTrialGetJson = await initialTrialGetRes.json();
  assert(initialTrialGetJson.used === false && initialTrialGetJson.remaining === 1, "New visitor has remaining: 1 and used: false");

  // 11b: First POST /api/trial should succeed (200 OK) and set signed HttpOnly cookie
  const firstTrialPostReq = new NextRequest("http://localhost:3000/api/trial", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": uniqueTestIp,
      "user-agent": uniqueTestUa,
    },
    body: JSON.stringify({
      message: "Gelecek kaygısı ve iş stresinden dolayı geceleri kalbim çok daralıyor, ne yapmalıyım?",
    }),
  });
  const firstTrialPostRes = await trialRoute.POST(firstTrialPostReq);
  assert(firstTrialPostRes.status === 200, "1st POST /api/trial returns 200 OK");
  const firstSetCookie = firstTrialPostRes.headers.get("set-cookie") || "";
  assert(
    firstSetCookie.includes("sirdas_trial_v1=") && firstSetCookie.toLowerCase().includes("httponly"),
    "1st POST /api/trial sets HMAC-signed HttpOnly cookie sirdas_trial_v1"
  );
  const firstTrialPostJson = await firstTrialPostRes.json();
  assert(firstTrialPostJson.success === true && firstTrialPostJson.remaining === 0, "1st POST /api/trial returns success: true and remaining: 0");
  assert(typeof firstTrialPostJson.trial?.replyText === "string" && firstTrialPostJson.trial.replyText.length > 20, "1st POST /api/trial returns non-empty Sırdaş AI reply");

  // 11c: Second POST /api/trial from same IP+UA WITHOUT cookie must still be blocked (429) via server fingerprint
  const secondTrialNoCookieReq = new NextRequest("http://localhost:3000/api/trial", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": uniqueTestIp,
      "user-agent": uniqueTestUa,
    },
    body: JSON.stringify({
      message: "İkinci kez deneme yapmak istiyorum, çerezleri sildim.",
    }),
  });
  const secondTrialNoCookieRes = await trialRoute.POST(secondTrialNoCookieReq);
  assert(secondTrialNoCookieRes.status === 429, "2nd POST /api/trial (even with cleared cookies) is blocked with 429 Too Many Requests");
  const secondTrialNoCookieJson = await secondTrialNoCookieRes.json();
  assert(secondTrialNoCookieJson.error === "TRIAL_LIMIT_REACHED", "2nd POST /api/trial returns error code TRIAL_LIMIT_REACHED");

  // 11d: Second POST /api/trial from a different IP but WITH the signed cookie must also be blocked (429)
  const cookieTokenMatch = firstSetCookie.match(/sirdas_trial_v1=([^;]+)/);
  const cookieHeaderVal = cookieTokenMatch ? `sirdas_trial_v1=${cookieTokenMatch[1]}` : "";
  const secondTrialWithCookieReq = new NextRequest("http://localhost:3000/api/trial", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.199",
      "user-agent": "DifferentBrowser/2.0",
      cookie: cookieHeaderVal,
    },
    body: JSON.stringify({
      message: "Farklı ağdan ama aynı tarayıcı çereziyle ikinci deneme.",
    }),
  });
  const secondTrialWithCookieRes = await trialRoute.POST(secondTrialWithCookieReq);
  assert(secondTrialWithCookieRes.status === 429, "2nd POST /api/trial with signed cookie on different IP is blocked with 429");

  // Summary
  console.log("\n=======================================================");
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test threw error:", err);
  process.exit(1);
});
