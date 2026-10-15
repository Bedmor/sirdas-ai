import React from "react";
import { Users, MessageSquare, Coins, Activity } from "lucide-react";

export interface MetricData {
  totalUsers: number;
  activeUsersToday: number;
  activeConversations: number;
  todayMessages: number;
  totalMessages: number;
  poolBalance: number;
  sponsoredMessagesCount: number;
}

interface MetricCardsProps {
  metrics: MetricData;
  loading?: boolean;
}

export function MetricCards({ metrics, loading = false }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Users */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">
            Toplam Kullanıcı
          </span>
          <div className="h-8 w-8 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-serif text-foreground">
          {loading ? "..." : metrics.totalUsers.toLocaleString("tr-TR")}
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span className="text-emerald-500 font-semibold">
            {loading ? "..." : metrics.activeUsersToday} aktif
          </span>{" "}
          bugün etkileşimde
        </p>
      </div>

      {/* Metric 2: Active Conversations */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">
            Aktif Sohbetler
          </span>
          <div className="h-8 w-8 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-serif text-foreground">
          {loading ? "..." : metrics.activeConversations.toLocaleString("tr-TR")}
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span className="text-emerald-500 font-semibold">Canlı diyalog</span> akışı
        </p>
      </div>

      {/* Metric 3: Today's Messages */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">
            Bugünün Mesajları
          </span>
          <div className="h-8 w-8 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-serif text-foreground">
          {loading ? "..." : metrics.todayMessages.toLocaleString("tr-TR")}
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span className="text-blue-500 font-semibold">
            {loading ? "..." : metrics.totalMessages.toLocaleString("tr-TR")}
          </span>{" "}
          toplam mesaj hacmi
        </p>
      </div>

      {/* Metric 4: Askıda Pool Balance */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">
            Askıda Havuz Bakiyesi
          </span>
          <div className="h-8 w-8 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Coins className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-serif text-foreground">
          {loading ? "..." : metrics.poolBalance.toLocaleString("tr-TR")} ₺
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span className="text-amber-500 font-semibold">
            ~{loading ? "..." : metrics.sponsoredMessagesCount.toLocaleString("tr-TR")}
          </span>{" "}
          mesaj karşılayabilir
        </p>
      </div>
    </div>
  );
}
