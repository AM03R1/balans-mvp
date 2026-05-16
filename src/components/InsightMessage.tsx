import { createInsight } from "@/lib/analysis";
import type { CheckIn } from "@/lib/types";
import { BalanceCard } from "./BalanceCard";

type InsightMessageProps = {
  checkIn: CheckIn;
};

export function InsightMessage({ checkIn }: InsightMessageProps) {
  const insight = createInsight(checkIn);

  return (
    <BalanceCard className="space-y-4 bg-mist text-ink">
      <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-leaf/10 bg-white p-4">
        <div>
          <p className="text-xs font-extrabold uppercase text-ink/50">Balans Score</p>
          <p className="mt-1 text-4xl font-black text-leaf">{insight.balance.score}</p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#e9edf3]">
          <span className="block h-full rounded-full bg-leaf" style={{ width: `${insight.balance.score}%` }} />
        </div>
      </div>
      <div>
        <p className="text-sm font-extrabold uppercase text-leaf">Analyse</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{insight.title}</h2>
      </div>
      <p className="text-base leading-7 text-ink/65">{insight.cause}</p>
      {insight.context ? <p className="text-sm leading-6 text-ink/65">{insight.context}</p> : null}
      <div className="rounded-lg border border-leaf/10 bg-white p-4">
        <p className="text-sm font-extrabold text-leaf">Coachactie vandaag</p>
        <p className="mt-1 text-base leading-6">{insight.tip}</p>
      </div>
    </BalanceCard>
  );
}
