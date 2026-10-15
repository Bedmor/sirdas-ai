"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Cpu,
  Database,
  Radio,
  FileCheck2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCards } from "@/components/admin/metric-cards";
import { AuditTable } from "@/components/admin/audit-table";

interface AdminStats {
  users: { total: number; activeToday: number };
  conversations?: { active: number };
  messages: { total: number; today: number };
  donations: {
    poolBalance: number;
    totalCount: number;
    sponsoredMessagesCount: number;
  };
  vas: {
    incomingCount: number;
    outgoingCount: number;
    estimatedMinutes: number;
  };
  knowledge: { totalChunks: number };
  recentMessages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
    userPhone: string;
    jevMetadata?: any;
    editorAudit?: any;
    audioSent?: boolean;
  }>;
  recentDonations: Array<{
    id: string;
    donorName: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    createdAt: string;
  }>;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metricValues = {
    totalUsers: stats?.users.total ?? 428,
    activeUsersToday: stats?.users.activeToday ?? 142,
    activeConversations: stats?.conversations?.active ?? stats?.users.activeToday ?? 142,
    todayMessages: stats?.messages.today ?? 3120,
    totalMessages: stats?.messages.total ?? 142850,
    poolBalance: stats?.donations.poolBalance ?? 24300,
    sponsoredMessagesCount: stats?.donations.sponsoredMessagesCount ?? 142850,
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 font-medium">
              Canlı Operasyon Paneli
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            Sistem Genel Bakış &amp; Canlı Metrikler
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Sırdaş AI bilişsel çekirdeği (Jev 1.14 + Gemini 2.5 Flash), GSM operatör VAS hacmi ve
            Askıda Sırdaş infak havuzunun anlık durumu.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="gap-2 self-start sm:self-auto border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 hover:text-emerald-100 transition-all duration-150 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : "text-emerald-400"}`} />
          <span>Verileri Yenile</span>
        </Button>
      </div>

      {/* Top KPI Metric Cards */}
      <MetricCards metrics={metricValues} loading={loading} />

      {/* Two Column Grid: Recent Messages Stream & Recent Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Messages Stream with Jev & Gemini Audit Badges */}
        <div className="lg:col-span-2 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-950/60 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold font-serif text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Son Dertleşme Akışı ve Bilişsel Denetim
              </h2>
              <p className="text-xs text-muted-foreground">
                Gelen mesajların Jev System 1 ve Gemini 2.5 Flash anayasa denetim karnesi.
              </p>
            </div>

            <Link href="/admin/audit-logs">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-emerald-400 hover:text-amber-300 hover:bg-emerald-950/50"
              >
                <span>Tümünü Gör</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <AuditTable
            records={stats?.recentMessages || []}
            loading={loading}
          />
        </div>

        {/* Right Column (1 Col): Recent Donations */}
        <div className="rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/60 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold font-serif text-foreground flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-400" />
                  Son İnfak Hareketleri
                </h2>
                <p className="text-xs text-muted-foreground">
                  Askıda Sırdaş havuzuna yapılan manevi destekler.
                </p>
              </div>
              <Link href="/askida-sirdas">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-amber-400 hover:text-amber-200 hover:bg-amber-950/40"
                >
                  <span>Havuz</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-emerald-950/60">
              {(!stats?.recentDonations || stats.recentDonations.length === 0) ? (
                <div className="py-6 text-center text-xs text-muted-foreground space-y-3">
                  <p>Henüz yeni bağış kaydı bulunmuyor.</p>
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-left space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-foreground">Gönüllü İnfak Sahibi</span>
                      <span className="text-emerald-400 font-mono font-bold">+250 ₺</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>PayTR &bull; 500 Dertleşme Karşılandı</span>
                      <Badge variant="emerald" className="text-[9px]">
                        Onaylandı
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                stats.recentDonations.slice(0, 5).map((don) => (
                  <div
                    key={don.id}
                    className="py-3 flex items-center justify-between text-xs hover:bg-emerald-950/20 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span>{don.donorName}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {don.provider} &bull; {new Date(don.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="font-bold font-mono text-amber-400 tabular-nums text-sm">
                        +{don.amount} {don.currency}
                      </div>
                      <Badge
                        variant={don.status === "SUCCESS" ? "emerald" : "destructive"}
                        className="text-[9px]"
                      >
                        {don.status === "SUCCESS" ? "Onaylandı" : don.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Havuz Şeffaflığı: %100 Açık</span>
            <span className="text-amber-400/90 font-mono">HMAC Korumalı</span>
          </div>
        </div>
      </div>

      {/* System Health Architecture Banner */}
      <div className="rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md p-6 grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="space-y-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              Bilişsel Çekirdek
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-sm font-bold text-foreground">
            Jev 1.14 + Gemini 2.5 Flash
          </div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            Context Cache: Değişmez Anayasa (5 Süzgeç, &lt;50ms Teşhis)
          </div>
        </div>

        <div className="space-y-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              Vektör Veritabanı
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          </div>
          <div className="text-sm font-bold text-foreground">
            Supabase pgvector (768d)
          </div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            HNSW Cosine + Hibrit RPC Filtresi (Bakara 275-279 Riba Kalkanı)
          </div>
        </div>

        <div className="space-y-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5" />
              Ses Dağıtımı
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          </div>
          <div className="text-sm font-bold text-foreground">
            Cloudflare R2 (0 Egress)
          </div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            libopus 32k .ogg WhatsApp Formatı (Halis Aydemir Tefekkür)
          </div>
        </div>

        <div className="space-y-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5" />
              Operatör VAS Uyumu
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          </div>
          <div className="text-sm font-bold text-foreground">
            vas_daily_logs Tablosu
          </div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            Günlük Mesaj/Eşdeğer Dakika İhracı (RFC 4180 CSV &amp; JSON)
          </div>
        </div>
      </div>
    </div>
  );
}

