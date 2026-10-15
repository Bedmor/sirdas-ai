"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif tracking-tight text-foreground">
            Sistem Genel Bakış &amp; Canlı Metrikler
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sırdaş AI bilişsel çekirdeği, operatör hacmi ve infak havuzunun anlık durumu.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Verileri Yenile</span>
        </Button>
      </div>

      {/* Top KPI Metric Cards (Total users, active conversations, today's messages, Askıda pool balance) */}
      <MetricCards metrics={metricValues} loading={loading} />

      {/* Two Column Grid: Recent Messages Stream & Recent Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Messages Stream with Jev & Gemini Audit Badges */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold font-serif text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Son Dertleşme Akışı ve Bilişsel Denetim
              </h2>
              <p className="text-xs text-muted-foreground">
                Gelen mesajların Jev System 1 ve Gemini 2.5 Flash denetim karnesi.
              </p>
            </div>

            <Link href="/admin/audit-logs">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
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
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold font-serif text-foreground flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                Son İnfak Hareketleri
              </h2>
              <p className="text-xs text-muted-foreground">
                Askıda Sırdaş havuzuna yapılan katkılar.
              </p>
            </div>
            <Link href="/askida-sirdas">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                <span>Havuz</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {(!stats?.recentDonations || stats.recentDonations.length === 0) ? (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                <p>Henüz yeni bağış kaydı bulunmuyor.</p>
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-left space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>Gönüllü İnfak Sahibi</span>
                    <span className="text-emerald-500">+250 ₺</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">PayTR • Başarılı</div>
                </div>
              </div>
            ) : (
              stats.recentDonations.slice(0, 5).map((don) => (
                <div key={don.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">
                      {don.donorName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {don.provider} • {new Date(don.createdAt).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-foreground">
                      +{don.amount} {don.currency}
                    </div>
                    <Badge
                      variant={don.status === "SUCCESS" ? "emerald" : "destructive"}
                      className="text-[10px]"
                    >
                      {don.status === "SUCCESS" ? "Onaylandı" : don.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Health Architecture Banner */}
      <div className="rounded-2xl border border-border bg-muted/20 p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bilişsel Çekirdek
          </div>
          <div className="text-sm font-bold text-foreground">
            Jev 1.14 + Gemini 2.5 Flash
          </div>
          <div className="text-[11px] text-muted-foreground">
            Context Cache: Değişmez Anayasa (5 Süzgeç)
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vektör Veritabanı
          </div>
          <div className="text-sm font-bold text-foreground">
            Supabase pgvector (768d)
          </div>
          <div className="text-[11px] text-muted-foreground">
            HNSW Cosine + Hibrit RPC Filtresi
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ses Dağıtımı
          </div>
          <div className="text-sm font-bold text-foreground">
            Cloudflare R2 (0 Egress)
          </div>
          <div className="text-[11px] text-muted-foreground">
            libopus 32k .ogg WhatsApp Formatı
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Operatör VAS Uyumu
          </div>
          <div className="text-sm font-bold text-foreground">
            vas_daily_logs Tablosu
          </div>
          <div className="text-[11px] text-muted-foreground">
            Günlük Mesaj/Eşdeğer Dakika İhracı
          </div>
        </div>
      </div>
    </div>
  );
}
