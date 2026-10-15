import React from "react";
import { BarChart3, TrendingUp } from "lucide-react";

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
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground animate-pulse">
        Grafik verileri yükleniyor...
      </div>
    );
  }

  // Reverse so older dates are on the left, newer on the right
  const points = [...data].reverse().slice(-14);

  const maxMessages = Math.max(
    ...points.map((p) => Math.max(p.incomingCount, p.outgoingCount)),
    100
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            Operatör Trafik ve Hacim Dağılımı
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gelen ve giden mesaj hacmi ile operatör eşdeğer dakika trendi
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">Gelen Mesaj</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            <span className="text-muted-foreground">Giden Mesaj</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            <span className="text-muted-foreground">Dakika</span>
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Görüntülenecek trafik verisi bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {/* Bar Chart Representation */}
          <div className="flex items-end gap-2 h-44 w-full pt-4 pb-2 px-1 border-b border-border/60 overflow-x-auto">
            {points.map((item) => {
              const incomingPct = Math.round((item.incomingCount / maxMessages) * 100);
              const outgoingPct = Math.round((item.outgoingCount / maxMessages) * 100);

              return (
                <div
                  key={item.id}
                  className="flex-1 min-w-[28px] max-w-[50px] flex flex-col items-center gap-1 h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[10px] p-1.5 rounded-md shadow-lg border border-border whitespace-nowrap pointer-events-none">
                    <span>{item.date}</span>
                    <span>Gelen: {item.incomingCount} | Giden: {item.outgoingCount}</span>
                    <span className="text-amber-500 font-bold">{item.estimatedMinutes.toFixed(1)} dk</span>
                  </div>

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div
                      style={{ height: `${Math.max(incomingPct, 6)}%` }}
                      className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-sm transition-all"
                    />
                    <div
                      style={{ height: `${Math.max(outgoingPct, 6)}%` }}
                      className="w-1/2 bg-blue-500/80 hover:bg-blue-400 rounded-t-sm transition-all"
                    />
                  </div>

                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Son 14 günlük operatör iletişim aktivitesi</span>
            </span>
            <span>Tepe Hacim: {maxMessages} mesaj/gün</span>
          </div>
        </div>
      )}
    </div>
  );
}
