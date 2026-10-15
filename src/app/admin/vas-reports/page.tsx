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
  ShieldCheck,
  CheckCircle2,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="blue"
              className="text-[11px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 font-mono"
            >
              GSM VAS (Value Added Services)
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Operatör Mutabakat Protokolü
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            Operatör Trafik ve Dakika Raporlama
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            GSM operatörleri ile manevi VAS sponsorlukları, eşdeğer ses dakikası mutabakatı ve
            RFC 4180 uyumlu muhasebe dökümü.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a href={getCsvDownloadUrl()} download>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-emerald-800/60 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 hover:text-emerald-100 transition-all duration-150 shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>CSV İndir</span>
            </Button>
          </a>
          <a href="/api/admin/vas-export?format=json" target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 hover:text-cyan-100 transition-all duration-150 shadow-sm"
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              <span>JSON API</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="h-7 w-7 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Tarih Aralığı:</span>
            <span className="text-muted-foreground ml-1.5 hidden sm:inline text-[11px]">
              Mutabakat periyodunu seçin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/40 p-1 rounded-xl border border-emerald-900/40">
          <button
            type="button"
            onClick={() => setSelectedRange("today")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              selectedRange === "today"
                ? "bg-emerald-900 text-emerald-100 font-semibold shadow-sm border border-emerald-700/60"
                : "text-muted-foreground hover:text-foreground hover:bg-emerald-950/60"
            }`}
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange("7d")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              selectedRange === "7d"
                ? "bg-emerald-900 text-emerald-100 font-semibold shadow-sm border border-emerald-700/60"
                : "text-muted-foreground hover:text-foreground hover:bg-emerald-950/60"
            }`}
          >
            Son 7 Gün
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange("30d")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              selectedRange === "30d"
                ? "bg-emerald-900 text-emerald-100 font-semibold shadow-sm border border-emerald-700/60"
                : "text-muted-foreground hover:text-foreground hover:bg-emerald-950/60"
            }`}
          >
            Son 30 Gün
          </button>
          <button
            type="button"
            onClick={() => setSelectedRange("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              selectedRange === "all"
                ? "bg-emerald-900 text-emerald-100 font-semibold shadow-sm border border-emerald-700/60"
                : "text-muted-foreground hover:text-foreground hover:bg-emerald-950/60"
            }`}
          >
            Tüm Kayıtlar
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="group p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-emerald-700/60 transition-all duration-200 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-semibold text-muted-foreground/90 tracking-wider">
              Toplam Gelen Mesaj
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
            {loading ? "..." : totalIncoming.toLocaleString("tr-TR")}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Kullanıcı dertleşme girdileri (WhatsApp)
          </p>
        </div>

        <div className="group p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-cyan-700/60 transition-all duration-200 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-semibold text-muted-foreground/90 tracking-wider">
              Toplam Giden Mesaj
            </span>
            <div className="h-8 w-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
            {loading ? "..." : totalOutgoing.toLocaleString("tr-TR")}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Sırdaş AI hikmet &amp; sesli yanıtları
          </p>
        </div>

        <div className="group p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-amber-500/50 transition-all duration-200 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-semibold text-muted-foreground/90 tracking-wider">
              Eşdeğer Dakika Hacmi
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-amber-400 tabular-nums">
            {loading ? "..." : Math.round(totalMinutes).toLocaleString("tr-TR")}{" "}
            <span className="text-xl font-sans text-amber-400/80 font-normal">dk</span>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            GSM operatör sesli görüşme mutabakatı
          </p>
        </div>
      </div>

      {/* Interactive VAS Traffic & Minutes Distribution Chart */}
      <VasChart data={logs} loading={loading} />

      {/* VAS Data Table */}
      <div className="rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="p-5 border-b border-emerald-950/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold font-serif text-foreground">
              Günlük Operatör Trafik Dökümü
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Kullanıcı telefon numaraları KVKK uyarınca maskelenmiştir (+90 5XX ••• XX).
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/40">
            {logs.length} adet kayıt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-950/30 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-emerald-950/60">
              <tr>
                <th className="py-3 px-4 font-semibold">Tarih</th>
                <th className="py-3 px-4 font-semibold">Kullanıcı No (Maskeli)</th>
                <th className="py-3 px-4 font-semibold text-right">Gelen Mesaj</th>
                <th className="py-3 px-4 font-semibold text-right">Giden Mesaj</th>
                <th className="py-3 px-4 font-semibold text-right">Eşdeğer Dakika</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-5 w-5 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                      <span>Veriler yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    Bu tarih aralığında kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="hover:bg-emerald-950/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-foreground whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400/80">
                      {row.userPhone}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-400 tabular-nums">
                      {row.incomingCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-cyan-400 tabular-nums">
                      {row.outgoingCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-300 tabular-nums">
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

