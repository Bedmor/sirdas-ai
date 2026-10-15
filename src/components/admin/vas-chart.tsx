"use client";

import React, { useState } from "react";
import { BarChart3, TrendingUp, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface VasDataPoint {
  id: string;
  date: string;
  incomingCount: number;
  outgoingCount: number;
  estimatedMinutes: number;
}

interface VasChartProps {
  data: VasDataPoint[];
  loading?: boolean;
}

export function VasChart({ data, loading = false }: VasChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <span>Operatör trafik grafiği yükleniyor...</span>
      </div>
    );
  }

  // Reverse so older dates are on the left, newer on the right
  const points = [...data].reverse().slice(-14);

  const maxMessages = Math.max(
    ...points.map((p) => Math.max(p.incomingCount, p.outgoingCount)),
    100
  );

  const totalIncoming = points.reduce((acc, p) => acc + p.incomingCount, 0);
  const totalOutgoing = points.reduce((acc, p) => acc + p.outgoingCount, 0);
  const totalMinutes = points.reduce((acc, p) => acc + p.estimatedMinutes, 0);

  const hoveredItem = points.find((p) => p.id === hoveredId);

  return (
    <div className="rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-5">
      {/* Chart Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950/60 pb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Operatör Trafik ve Hacim Dağılımı
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gelen ve giden mesaj hacmi ikili karşılaştırması ve operatör eşdeğer dakika telemetrisi.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-900/40">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-muted-foreground text-[11px]">Gelen Mesaj</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-sky-600 to-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
            <span className="text-muted-foreground text-[11px]">Giden Mesaj</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
            <span className="text-muted-foreground text-[11px]">Eşdeğer Dakika</span>
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="py-14 text-center text-xs text-muted-foreground rounded-xl bg-emerald-950/20 border border-emerald-950/60">
          Görüntülenecek operatör trafik verisi bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Active Hover Inspector Strip */}
          <div className="min-h-[28px] flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
            {hoveredItem ? (
              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                <span className="font-mono text-emerald-300 font-semibold">{hoveredItem.date}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ArrowDownLeft className="h-3 w-3" /> Gelen: {hoveredItem.incomingCount}
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <ArrowUpRight className="h-3 w-3" /> Giden: {hoveredItem.outgoingCount}
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-mono font-medium">
                  <Clock className="h-3 w-3 text-amber-400" /> {hoveredItem.estimatedMinutes.toFixed(1)} dk konuşma eşdeğeri
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Detaylı gün dökümü için sütunların üzerine gelin
              </span>
            )}
            <span className="text-[11px] font-mono text-muted-foreground/70 hidden sm:inline">
              Tepe: {maxMessages} mesaj/gün
            </span>
          </div>

          {/* Visual Dual-Bar Chart Area with Grid Lines */}
          <div className="relative pt-6 pb-2">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-6 px-1 opacity-20">
              <div className="border-b border-emerald-500/40 w-full" />
              <div className="border-b border-emerald-500/30 w-full" />
              <div className="border-b border-emerald-500/20 w-full" />
            </div>

            {/* Bars Column Container */}
            <div className="relative flex items-end gap-2 sm:gap-3 h-52 w-full px-2 border-b border-emerald-950/80 overflow-x-auto scrollbar-none">
              {points.map((item) => {
                const incomingPct = Math.round((item.incomingCount / maxMessages) * 100);
                const outgoingPct = Math.round((item.outgoingCount / maxMessages) * 100);
                const isHovered = hoveredId === item.id;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="flex-1 min-w-[36px] max-w-[56px] flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Talk-time minutes floating indicator */}
                    <div
                      className={`text-[9px] font-mono px-1 py-0.5 rounded-md mb-1.5 transition-all duration-150 whitespace-nowrap ${
                        isHovered
                          ? "bg-amber-500 text-stone-950 font-bold scale-110 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                          : "bg-amber-950/60 text-amber-300 border border-amber-600/30"
                      }`}
                    >
                      {item.estimatedMinutes.toFixed(1)}m
                    </div>

                    {/* Dual Bars side-by-side */}
                    <div className="w-full flex items-end justify-center gap-1 h-36 px-0.5">
                      {/* Incoming Bar (Emerald Gradient) */}
                      <div
                        style={{ height: `${Math.max(incomingPct, 6)}%` }}
                        className={`w-1/2 rounded-t-md transition-all duration-200 ${
                          isHovered
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                            : "bg-gradient-to-t from-emerald-800 to-emerald-500/90 hover:from-emerald-700 hover:to-emerald-400"
                        }`}
                      />

                      {/* Outgoing Bar (Cyan/Teal Gradient) */}
                      <div
                        style={{ height: `${Math.max(outgoingPct, 6)}%` }}
                        className={`w-1/2 rounded-t-md transition-all duration-200 ${
                          isHovered
                            ? "bg-gradient-to-t from-sky-600 to-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.7)]"
                            : "bg-gradient-to-t from-sky-900 to-cyan-500/90 hover:from-sky-800 hover:to-cyan-400"
                        }`}
                      />
                    </div>

                    {/* X-axis Date Label */}
                    <span
                      className={`text-[9px] font-mono mt-2 truncate w-full text-center transition-colors ${
                        isHovered ? "text-amber-300 font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-950/60 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gelen Trafik:</span>
              <span className="font-mono font-semibold text-emerald-400">{totalIncoming}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
              <span>Giden Trafik:</span>
              <span className="font-mono font-semibold text-cyan-400">{totalOutgoing}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Eşdeğer Süre:</span>
              <span className="font-mono font-semibold text-amber-300">{totalMinutes.toFixed(1)} dk</span>
            </div>
            <div className="text-right font-mono text-[10px] text-muted-foreground/80 sm:block hidden">
              Dönem İçi 14 Gün
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

