import React from "react";
import { Badge } from "@/components/ui/badge";
import { Volume2, ShieldCheck, AlertCircle, BookmarkCheck } from "lucide-react";

export interface AuditRecord {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  userPhone: string;
  audioSent?: boolean;
  jevMetadata?: any;
  editorAudit?: {
    murakabe_applied?: boolean;
    ilahi_riza_checked?: boolean;
    tevekkul_and_talak_hope_included?: boolean;
    nafs_and_vesvese_addressed?: string;
    siyer_example_used?: string;
    riba_warning_included?: boolean;
  };
}

interface AuditTableProps {
  records: AuditRecord[];
  loading?: boolean;
}

export function AuditTable({ records, loading = false }: AuditTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
        <div className="h-5 w-5 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <span>Denetim kayıtları yükleniyor...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-muted-foreground/80 rounded-xl bg-emerald-950/20 border border-emerald-950/60 p-6">
        Henüz denetim kaydı bulunmuyor.
      </div>
    );
  }

  return (
    <div className="divide-y divide-emerald-950/60">
      {records.map((msg) => (
        <div
          key={msg.id}
          className="py-3.5 space-y-2 hover:bg-emerald-950/15 -mx-2 px-2 rounded-xl transition-colors duration-150"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-emerald-400/90 font-medium">
                {msg.userPhone}
              </span>
              <Badge
                variant={msg.role === "USER" ? "outline" : "default"}
                className={`text-[10px] px-2 py-0.5 ${
                  msg.role === "USER"
                    ? "border-emerald-900/60 text-muted-foreground"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                }`}
              >
                {msg.role === "USER" ? "Kullanıcı" : "Sırdaş AI"}
              </Badge>
              {msg.audioSent && (
                <Badge
                  variant="gold"
                  className="gap-1 text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30"
                >
                  <Volume2 className="h-3 w-3" />
                  Ses İletildi
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed font-sans">
            {msg.content}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {msg.editorAudit?.murakabe_applied && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-medium">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
                Murakabe ✓
              </span>
            )}
            {msg.editorAudit?.riba_warning_included && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-600/40 font-medium">
                <AlertCircle className="h-2.5 w-2.5 text-amber-400" />
                Riba Kalkanı ⚠
              </span>
            )}
            {msg.editorAudit?.siyer_example_used && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/60 text-sky-300 border border-sky-800/40 font-medium">
                <BookmarkCheck className="h-2.5 w-2.5 text-sky-400" />
                Siyer Mührü
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

