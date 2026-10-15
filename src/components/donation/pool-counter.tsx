import React from "react";
import { Sparkles, Coins, HeartHandshake } from "lucide-react";

interface PoolCounterProps {
  sponsoredMessages?: number | string;
  poolBalance?: number | string;
  donorCount?: number | string;
}

export function PoolCounter({
  sponsoredMessages = "142.850 adet",
  poolBalance = "24.300 ₺",
  donorCount = "1.280 hayırsever",
}: PoolCounterProps) {
  const formattedMessages =
    typeof sponsoredMessages === "number"
      ? `${sponsoredMessages.toLocaleString("tr-TR")} adet`
      : sponsoredMessages;

  const formattedBalance =
    typeof poolBalance === "number"
      ? `${poolBalance.toLocaleString("tr-TR")} ₺`
      : poolBalance;

  const formattedDonors =
    typeof donorCount === "number"
      ? `${donorCount.toLocaleString("tr-TR")} hayırsever`
      : donorCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-emerald-400">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Bu Ay Karşılanan
          </span>
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-3xl font-extrabold font-serif text-foreground">
          {formattedMessages}
        </div>
        <p className="text-xs text-muted-foreground">
          Gönül ferahlatan dertleşme ve manevi teskin mesajı
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-amber-500">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Askıdaki Güncel Bakiye
          </span>
          <Coins className="h-4 w-4" />
        </div>
        <div className="text-3xl font-extrabold font-serif text-foreground">
          {formattedBalance}
        </div>
        <p className="text-xs text-muted-foreground">
          Hazır bekleyen infak fonu havuzu
        </p>
      </div>

      <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-card to-card p-6 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-blue-400">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Gönüllü Destekçi
          </span>
          <HeartHandshake className="h-4 w-4" />
        </div>
        <div className="text-3xl font-extrabold font-serif text-foreground">
          {formattedDonors}
        </div>
        <p className="text-xs text-muted-foreground">
          Kardeşinin derdine ortak olan infak ehli
        </p>
      </div>
    </div>
  );
}
