"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Users,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VasChart } from "@/components/admin/vas-chart";

interface VasLogItem {
  id: string;
  date: string;
  userPhone: string;
  incomingCount: number;
  outgoingCount: number;
  estimatedMinutes: number;
}

export default function VasReportsPage() {
  const [logs, setLogs] = useState<VasLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<"today" | "7d" | "30d" | "all">("7d");

  const fetchVasData = async (range: string) => {
    setLoading(true);
    try {
      let query = "/api/admin/vas-export?format=json";
      const now = new Date();
      if (range === "today") {
        const todayStr = now.toISOString().split("T")[0];
        query += `&startDate=${todayStr}`;
      } else if (range === "7d") {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        query += `&startDate=${d.toISOString().split("T")[0]}`;
      } else if (range === "30d") {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        query += `&startDate=${d.toISOString().split("T")[0]}`;
      }

      const res = await fetch(query);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error("Failed to load VAS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVasData(selectedRange);
  }, [selectedRange]);

  const totalIncoming = logs.reduce((acc, curr) => acc + curr.incomingCount, 0);
  const totalOutgoing = logs.reduce((acc, curr) => acc + curr.outgoingCount, 0);
  const totalMinutes = logs.reduce((acc, curr) => acc + curr.estimatedMinutes, 0);

  const getCsvDownloadUrl = () => {
    let url = "/api/admin/vas-export?format=csv";
    const now = new Date();
    if (selectedRange === "today") {
      url += `&startDate=${now.toISOString().split("T")[0]}`;
    } else if (selectedRange === "7d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      url += `&startDate=${d.toISOString().split("T")[0]}`;
    } else if (selectedRange === "30d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      url += `&startDate=${d.toISOString().split("T")[0]}`;
    }
    return url;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" className="text-xs">
              VAS (Value Added Services)
            </Badge>
            <span className="text-xs text-muted-foreground">GSM Operatör Mutabakatı</span>
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-tight text-foreground mt-1">
            Operatör Trafik ve Dakika Raporlama
          </h1>
          <p className="text-xs text-muted-foreground">
            GSM operatörleri ile manevi VAS sponsorlukları ve dakika eşdeğeri mutabakat paneli.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a href={getCsvDownloadUrl()} download>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span>CSV İndir</span>
            </Button>
          </a>
          <a href="/api/admin/vas-export?format=json" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <FileCode className="h-3.5 w-3.5 text-blue-500" />
              <span>JSON API</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5 text-foreground" />
          <span className="font-semibold text-foreground">Tarih Aralığı:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedRange("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedRange === "today"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange("7d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedRange === "7d"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Son 7 Gün
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange("30d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedRange === "30d"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Son 30 Gün
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedRange === "all"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Tüm Kayıtlar
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-medium">Toplam Gelen Mesaj</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-foreground">
            {loading ? "..." : totalIncoming.toLocaleString("tr-TR")}
          </div>
          <p className="text-[11px] text-muted-foreground">Kullanıcı dertleşme girdileri</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-medium">Toplam Giden Mesaj</span>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-foreground">
            {loading ? "..." : totalOutgoing.toLocaleString("tr-TR")}
          </div>
          <p className="text-[11px] text-muted-foreground">Sırdaş AI hikmet &amp; ses yanıtları</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-medium">Eşdeğer Dakika Hacmi</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-foreground">
            {loading ? "..." : Math.round(totalMinutes).toLocaleString("tr-TR")} dk
          </div>
          <p className="text-[11px] text-muted-foreground">Operatör sesli görüşme karşılığı</p>
        </div>
      </div>

      {/* Interactive VAS Traffic & Minutes Distribution Chart */}
      <VasChart data={logs} loading={loading} />

      {/* VAS Data Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <h2 className="text-sm font-bold font-serif text-foreground">
            Günlük Operatör Trafik Dökümü
          </h2>
          <span className="text-xs text-muted-foreground">
            {logs.length} adet kayıt listeleniyor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Tarih</th>
                <th className="py-3 px-4 font-semibold">Kullanıcı No (Maskeli)</th>
                <th className="py-3 px-4 font-semibold text-right">Gelen Mesaj</th>
                <th className="py-3 px-4 font-semibold text-right">Giden Mesaj</th>
                <th className="py-3 px-4 font-semibold text-right">Eşdeğer Dakika</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Veriler yükleniyor...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Bu tarih aralığında kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {row.userPhone}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-500">
                      {row.incomingCount}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-500">
                      {row.outgoingCount}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">
                      {row.estimatedMinutes.toFixed(1)} dk
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
