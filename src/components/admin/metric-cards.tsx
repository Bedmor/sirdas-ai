import React from "react";
import { Users, MessageSquare, Coins, Activity, ArrowUpRight } from "lucide-react";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Metric 1: Total Users */}
      <div className="group relative p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-emerald-700/60 transition-all duration-200">
        <div className="flex items-center justify-between text-muted-foreground mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Toplam Kullanıcı
          </span>
          <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200 shadow-[0_0_10px_rgba(5,150,105,0.2)]">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
          {loading ? "..." : metrics.totalUsers.toLocaleString("tr-TR")}
        </div>
        <div className="mt-2 pt-2 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {loading ? "..." : metrics.activeUsersToday} aktif bugün
          </span>
          <span className="text-[10px] text-muted-foreground/70 font-mono">24s döngü</span>
        </div>
      </div>

      {/* Metric 2: Active Conversations */}
      <div className="group relative p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-teal-700/60 transition-all duration-200">
        <div className="flex items-center justify-between text-muted-foreground mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Aktif Sohbetler
          </span>
          <div className="h-9 w-9 rounded-xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform duration-200 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
          {loading ? "..." : metrics.activeConversations.toLocaleString("tr-TR")}
        </div>
        <div className="mt-2 pt-2 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 text-teal-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            Canlı WhatsApp hattı
          </span>
          <span className="text-[10px] text-muted-foreground/70 font-mono">wa.me</span>
        </div>
      </div>

      {/* Metric 3: Today's Messages */}
      <div className="group relative p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-sky-700/60 transition-all duration-200">
        <div className="flex items-center justify-between text-muted-foreground mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Bugünün Mesajları
          </span>
          <div className="h-9 w-9 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform duration-200 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
          {loading ? "..." : metrics.todayMessages.toLocaleString("tr-TR")}
        </div>
        <div className="mt-2 pt-2 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="text-sky-300/90 font-medium">
            {loading ? "..." : metrics.totalMessages.toLocaleString("tr-TR")} toplam
          </span>
          <span className="text-[10px] text-muted-foreground/70 font-mono">VAS hacim</span>
        </div>
      </div>

      {/* Metric 4: Askıda Pool Balance */}
      <div className="group relative p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-amber-500/50 transition-all duration-200">
        <div className="flex items-center justify-between text-muted-foreground mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Askıda Havuz Bakiyesi
          </span>
          <div className="h-9 w-9 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform duration-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Coins className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight text-amber-400 tabular-nums">
          {loading ? "..." : metrics.poolBalance.toLocaleString("tr-TR")}{" "}
          <span className="text-xl font-serif text-amber-400/80 font-normal">₺</span>
        </div>
        <div className="mt-2 pt-2 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="text-amber-300/90 font-medium">
            ~{loading ? "..." : metrics.sponsoredMessagesCount.toLocaleString("tr-TR")} mesaj
          </span>
          <span className="text-[10px] text-amber-400/70 font-mono">Vakıf infak</span>
        </div>
      </div>
    </div>
  );
}

