import React from "react";
import { Badge } from "@/components/ui/badge";
import { Volume2 } from "lucide-react";

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
      <div className="py-8 text-center text-xs text-muted-foreground">
        Denetim kayıtları yükleniyor...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Denetim kaydı bulunamadı.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {records.map((msg) => (
        <div key={msg.id} className="py-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">
                {msg.userPhone}
              </span>
              <Badge variant={msg.role === "USER" ? "outline" : "default"}>
                {msg.role === "USER" ? "Kullanıcı" : "Sırdaş AI"}
              </Badge>
              {msg.audioSent && (
                <Badge variant="gold" className="gap-1">
                  <Volume2 className="h-3 w-3" />
                  Ses İletildi
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
            {msg.content}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {msg.editorAudit?.murakabe_applied && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                Murakabe ✓
              </span>
            )}
            {msg.editorAudit?.riba_warning_included && (
              <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
                Riba Kalkanı ⚠
              </span>
            )}
            {msg.editorAudit?.siyer_example_used && (
              <span className="px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40">
                Siyer Mührü
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
