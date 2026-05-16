"use client";

import { useEffect, useState } from "react";
import { calculateDisciplineScore, calculateWeeklyStats, compareWithPreviousWeek, createWeeklyConclusion } from "@/lib/analysis";
import { getCheckIns } from "@/lib/storage";
import type { DisciplineScore, WeekComparison, WeeklyStats } from "@/lib/types";
import { BalanceCard } from "./BalanceCard";
import { ButtonLink } from "./ButtonLink";

type ProgressState = {
  stats: WeeklyStats;
  discipline: DisciplineScore;
  comparison: WeekComparison;
};

export function WeeklyOverview() {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    const checkIns = getCheckIns();
    setProgress({
      stats: calculateWeeklyStats(checkIns),
      discipline: calculateDisciplineScore(checkIns),
      comparison: compareWithPreviousWeek(checkIns),
    });
  }, []);

  if (!progress) {
    return null;
  }

  const { stats, discipline, comparison } = progress;

  if (stats.daysFilled === 0) {
    return (
      <BalanceCard className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">Nog geen progressie</h2>
        <p className="text-sm leading-6 text-ink/65">
          Je hoeft niet perfect te zijn. Consistentie telt. Vul je eerste check-in in om je lijn te zien.
        </p>
        <ButtonLink href="/check-in">Eerste check-in invullen</ButtonLink>
      </BalanceCard>
    );
  }

  return (
    <div className="space-y-4">
      <BalanceCard className="space-y-4">
        <p className="text-sm font-extrabold uppercase text-leaf">Deze week</p>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Streak" value={`${discipline.streak} dagen`} />
          <Metric label="Check-ins" value={`${discipline.checkInsThisWeek}/7`} />
          <Metric label="Balans Score" value={String(stats.averageBalanceScore)} />
          <Metric label="Discipline" value={String(stats.averageDisciplineScore)} />
        </div>
      </BalanceCard>

      <BalanceCard className="space-y-3 bg-mist">
        <p className="text-sm font-extrabold uppercase text-leaf">Progressie</p>
        <p className="text-xl font-bold leading-8">{comparison.bestImprovement}</p>
        <p className="text-sm leading-6 text-ink/65">{discipline.explanation}</p>
      </BalanceCard>

      <BalanceCard>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Slaap" value={`${stats.averageSleep}u`} />
          <Metric label="Stress" value={`${stats.averageStress}/10`} />
          <Metric label="Energie" value={`${stats.averageEnergy}/10`} />
          <Metric label="Verschil" value={formatDelta(comparison.balanceDelta)} />
        </div>
      </BalanceCard>

      <BalanceCard className="bg-mist text-ink">
        <p className="text-sm font-extrabold uppercase text-leaf">Conclusie</p>
        <p className="mt-3 text-xl font-bold leading-8">{createWeeklyConclusion(stats)}</p>
      </BalanceCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-leaf/10 bg-mist p-4">
      <p className="text-sm font-semibold text-ink/50">{label}</p>
      <p className="mt-2 text-2xl font-black text-leaf">{value}</p>
    </div>
  );
}

function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
