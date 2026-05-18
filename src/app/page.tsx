"use client";

import { useEffect, useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { ButtonLink } from "@/components/ButtonLink";
import { calculateBalanceScore, getStartDayInsight } from "@/lib/analysis";
import { todayKey } from "@/lib/date";
import { getCheckInByDate } from "@/lib/storage";
import type { CheckIn } from "@/lib/types";

export default function HomePage() {
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null | undefined>(undefined);
  const date = todayKey();
  const startDayInsight = getStartDayInsight(todayCheckIn ?? null, date);

  useEffect(() => {
    setTodayCheckIn(getCheckInByDate(date));
  }, [date]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {todayCheckIn ? (
        <>
          <BalanceCard>
            <p className="mb-3 text-sm font-extrabold uppercase text-leaf">Vandaag ingevuld</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <TodayMetric label="Score" value={String(calculateBalanceScore(todayCheckIn).score)} />
              <TodayMetric label="Slaap" value={`${todayCheckIn.sleepHours}u`} />
              <TodayMetric label="Stress" value={String(todayCheckIn.stress)} />
            </div>
          </BalanceCard>
          <StartDayInsightCard insight={startDayInsight} />
          <div className="grid gap-3">
            <ButtonLink href="/buddy">Praat erover</ButtonLink>
            <ButtonLink href="/result" variant="secondary">Bekijk analyse</ButtonLink>
          </div>
        </>
      ) : (
        <>
          <StartDayInsightCard insight={startDayInsight} />
          <BalanceCard className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">Nog geen check-in vandaag</h2>
              <p className="mt-2 text-base leading-7 text-ink/65">
                Vul vijf korte vragen in en krijg meteen een menselijke analyse van je balans.
              </p>
            </div>
            <ButtonLink href="/check-in">Start check-in</ButtonLink>
          </BalanceCard>
        </>
      )}
    </div>
  );
}

function StartDayInsightCard({ insight }: { insight: { lesson: string; action: string } }) {
  return (
    <BalanceCard className="space-y-4">
      <div>
        <p className="text-sm font-extrabold uppercase text-leaf">Start de dag met één inzicht</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{insight.lesson}</h2>
      </div>
      <div className="rounded-lg bg-mist px-4 py-3">
        <strong className="text-sm text-ink">Vandaag toepassen</strong>
        <p className="mt-1 text-sm leading-6 text-ink/70">{insight.action}</p>
      </div>
    </BalanceCard>
  );
}

function TodayMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-leaf/10 bg-mist px-3 py-4">
      <p className="text-xs font-semibold text-ink/50">{label}</p>
      <p className="mt-1 text-xl font-black text-leaf">{value}</p>
    </div>
  );
}
