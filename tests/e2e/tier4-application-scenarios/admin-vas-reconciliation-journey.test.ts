import { describe, it, expect } from "../harness";
import { createMockRequest, parseCsv } from "../harness/utils";
import { GET as vasExportHandler } from "@/app/api/admin/vas-export/route";
import { GET as statsHandler } from "@/app/api/admin/stats/route";

describe("Tier 4: Real-World Scenario — Admin VAS Reconciliation Journey", { tier: 4, feature: "Admin VAS Journey" }, () => {
  it("T4-SCN.4: GSM VAS Partner Monthly Reconciliation: Telemetry -> Aggregation -> CSV Export", async () => {
    // 1. Verify telemetry KPIs exist for VAS volume
    const statsRes = await statsHandler();
    expect(statsRes.status).toBe(200);

    const stats = await statsRes.json();
    expect(stats.success).toBe(true);
    expect(stats.data.vas.incomingCount).toBeGreaterThan(0);
    expect(stats.data.vas.outgoingCount).toBeGreaterThan(0);
    expect(stats.data.vas.estimatedMinutes).toBeGreaterThan(0);

    // 2. Request date-filtered CSV reconciliation export
    const req = createMockRequest("http://localhost:3000/api/admin/vas-export?format=csv&startDate=2026-10-01&endDate=2026-10-15");
    const res = await vasExportHandler(req);
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type") || "";
    expect(contentType).toContain("text/csv");

    const disposition = res.headers.get("content-disposition") || "";
    expect(disposition).toContain("attachment");
    expect(disposition).toContain(".csv");

    // 3. Validate RFC 4180 parsing and data integrity
    const csvText = await res.text();
    const { headers, rows } = parseCsv(csvText);

    expect(headers).toEqual([
      "Kayit_ID",
      "Tarih",
      "Kullanici_Maskeli_No",
      "Gelen_Mesaj_Adedi",
      "Giden_Mesaj_Adedi",
      "Operator_Esdeger_Dakika",
    ]);

    expect(rows.length).toBeGreaterThan(0);

    // Reconcile total incoming and outgoing messages
    let totalIncoming = 0;
    let totalOutgoing = 0;
    let totalMinutes = 0;

    for (const row of rows) {
      const incoming = parseInt(row[3], 10);
      const outgoing = parseInt(row[4], 10);
      const minutes = parseFloat(row[5]);

      expect(isNaN(incoming)).toBe(false);
      expect(isNaN(outgoing)).toBe(false);
      expect(isNaN(minutes)).toBe(false);

      totalIncoming += incoming;
      totalOutgoing += outgoing;
      totalMinutes += minutes;
    }

    expect(totalIncoming).toBeGreaterThan(0);
    expect(totalOutgoing).toBeGreaterThan(0);
    expect(totalMinutes).toBeGreaterThan(0);
  });
});
