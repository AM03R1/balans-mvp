import { getLastSevenDateKeys } from "./date";
import type { BalanceScore, CheckIn, DisciplineScore, ScoreFactor, WeekComparison, WeeklyStats } from "./types";

export function createInsight(checkIn: CheckIn) {
  const balance = calculateBalanceScore(checkIn);
  const action = getDailyCoachAction(checkIn);

  return {
    title: checkIn.energy <= 5 ? "Je lichaam vraagt om herstel" : "Je balans ziet er werkbaar uit",
    cause: balance.explanation,
    context: balance.factorText,
    tip: action,
    balance,
  };
}

export function calculateBalanceScore(checkIn: CheckIn): BalanceScore {
  const sleep = calculateSleepScore(checkIn.sleepHours);
  const stress = clampScore((10 - checkIn.stress) * 10 + 10);
  const energy = clampScore(checkIn.energy * 10);
  const nutrition = getNutritionScore(checkIn.nutrition);
  const score = clampScore(Math.round(sleep * 0.3 + stress * 0.3 + energy * 0.25 + nutrition * 0.15));
  const mainFactor = getMainInfluencingFactor(checkIn);

  return {
    score,
    mainFactor,
    factorText: createFactorText(mainFactor),
    explanation: createBalanceExplanation(score, mainFactor),
  };
}

export function calculateDisciplineScore(checkIns: CheckIn[], referenceDate = new Date()): DisciplineScore {
  const currentEntries = getEntriesForKeys(checkIns, getLastSevenDateKeys(referenceDate));
  const previousEntries = getEntriesForKeys(checkIns, getPreviousSevenDateKeys(referenceDate));
  const comparison = compareWithPreviousWeek(checkIns, referenceDate);
  const streak = calculateStreak(checkIns, referenceDate);

  const consistencyScore = (currentEntries.length / 7) * 45;
  const streakScore = Math.min(streak, 7) * 5;
  const improvementScore = comparison.balanceDelta > 0 ? Math.min(comparison.balanceDelta, 15) : 0;
  const stabilityScore = calculateStabilityScore(currentEntries, previousEntries);
  const score = clampScore(Math.round(consistencyScore + streakScore + improvementScore + stabilityScore));

  return {
    score,
    streak,
    checkInsThisWeek: currentEntries.length,
    explanation:
      currentEntries.length >= 5
        ? "Je bouwt discipline door terug te komen, niet door perfecte dagen."
        : "Je hoeft niet perfect te zijn. Consistentie telt.",
  };
}

export function getMainInfluencingFactor(checkIn: CheckIn): ScoreFactor {
  const factors: Array<{ factor: ScoreFactor; gap: number }> = [
    { factor: "slaap", gap: 100 - calculateSleepScore(checkIn.sleepHours) },
    { factor: "stress", gap: 100 - clampScore((10 - checkIn.stress) * 10 + 10) },
    { factor: "energie", gap: 100 - clampScore(checkIn.energy * 10) },
    { factor: "voeding", gap: 100 - getNutritionScore(checkIn.nutrition) },
  ];

  return factors.sort((a, b) => b.gap - a.gap)[0].factor;
}

export function getDailyCoachAction(checkIn: CheckIn) {
  const factor = getMainInfluencingFactor(checkIn);

  if (factor === "slaap" && checkIn.sleepHours < 7) {
    return "Ga vanavond 30 minuten eerder naar bed.";
  }

  if (factor === "stress" && checkIn.stress > 6) {
    return "Plan vandaag 10 minuten zonder scherm.";
  }

  if (factor === "energie" && checkIn.energy < 7) {
    return "Kies een belangrijke taak en laat de rest even liggen.";
  }

  if (factor === "voeding" && checkIn.nutrition !== "goed") {
    return "Eet vandaag een normale maaltijd met genoeg eiwitten.";
  }

  return "Houd hetzelfde ritme morgen vast.";
}

export function compareWithPreviousWeek(checkIns: CheckIn[], referenceDate = new Date()): WeekComparison {
  const currentEntries = getEntriesForKeys(checkIns, getLastSevenDateKeys(referenceDate));
  const previousEntries = getEntriesForKeys(checkIns, getPreviousSevenDateKeys(referenceDate));
  const current = calculateAverages(currentEntries);
  const previous = calculateAverages(previousEntries);
  const hasPreviousWeek = previousEntries.length > 0;
  const sleepDeltaMinutes = Math.round((current.sleep - previous.sleep) * 60);
  const stressDelta = roundOneDecimal(previous.stress - current.stress);
  const energyDelta = roundOneDecimal(current.energy - previous.energy);
  const balanceDelta = Math.round(current.balance - previous.balance);
  const disciplineDelta = calculateDisciplineScoreBase(currentEntries) - calculateDisciplineScoreBase(previousEntries);

  return {
    balanceDelta,
    disciplineDelta,
    sleepDeltaMinutes,
    stressDelta,
    energyDelta,
    bestImprovement: hasPreviousWeek
      ? getBestImprovement(sleepDeltaMinutes, stressDelta, energyDelta, balanceDelta)
      : `Je hebt ${currentEntries.length} ${currentEntries.length === 1 ? "dag" : "dagen"} ingecheckt deze week.`,
  };
}

export function calculateWeeklyStats(checkIns: CheckIn[], referenceDate = new Date()): WeeklyStats {
  const weekEntries = getEntriesForKeys(checkIns, getLastSevenDateKeys(referenceDate));
  const discipline = calculateDisciplineScore(checkIns, referenceDate);

  if (weekEntries.length === 0) {
    return {
      averageSleep: 0,
      averageStress: 0,
      averageEnergy: 0,
      averageBalanceScore: 0,
      averageDisciplineScore: discipline.score,
      daysFilled: 0,
    };
  }

  const averages = calculateAverages(weekEntries);

  return {
    averageSleep: roundOneDecimal(averages.sleep),
    averageStress: roundOneDecimal(averages.stress),
    averageEnergy: roundOneDecimal(averages.energy),
    averageBalanceScore: Math.round(averages.balance),
    averageDisciplineScore: discipline.score,
    daysFilled: weekEntries.length,
  };
}

export function createWeeklyConclusion(stats: WeeklyStats) {
  if (stats.daysFilled === 0) {
    return "Vul je eerste check-in in om je progressie te zien.";
  }

  if (stats.daysFilled >= 5) {
    return "Je bouwt discipline door terug te komen, niet door perfecte dagen.";
  }

  if (stats.averageSleep < 6.5) {
    return "Slaap lijkt deze week je belangrijkste herstelpunt.";
  }

  if (stats.averageStress > 7) {
    return "Je stressgemiddelde is hoog. Plan bewust lichtere momenten in.";
  }

  return "Kleine verbetering is ook progressie.";
}

export function calculateStreak(checkIns: CheckIn[], referenceDate = new Date()) {
  const dates = new Set(checkIns.map((checkIn) => checkIn.date));
  let streak = 0;
  const cursor = new Date(referenceDate);

  while (dates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateSleepScore(hours: number) {
  if (hours >= 7 && hours <= 9) {
    return 100;
  }

  if (hours < 6) {
    return clampScore(hours * 12);
  }

  if (hours < 7) {
    return 78 + (hours - 6) * 18;
  }

  return clampScore(100 - (hours - 9) * 15);
}

function getNutritionScore(nutrition: CheckIn["nutrition"]) {
  if (nutrition === "goed") {
    return 100;
  }

  if (nutrition === "oke") {
    return 72;
  }

  return 38;
}

function createBalanceExplanation(score: number, factor: ScoreFactor) {
  if (score >= 80) {
    return `Je Balans Score is sterk. ${createFactorText(factor)}`;
  }

  if (score >= 60) {
    return `Je basis is redelijk, maar ${factor} trekt je score vandaag omlaag.`;
  }

  return `Je lichaam vraagt om herstel. Vandaag lijkt ${factor} je balans het meest te beinvloeden.`;
}

function createFactorText(factor: ScoreFactor) {
  const text: Record<ScoreFactor, string> = {
    slaap: "Slaap heeft vandaag de meeste invloed op je score.",
    stress: "Vandaag lijkt je stress je energie het meest te beinvloeden.",
    energie: "Je energieniveau drukt vandaag het sterkst op je balans.",
    voeding: "Voeding is vandaag de factor met de meeste ruimte voor verbetering.",
  };

  return text[factor];
}

function calculateStabilityScore(currentEntries: CheckIn[], previousEntries: CheckIn[]) {
  if (currentEntries.length < 3) {
    return 4;
  }

  const current = calculateVarianceScore(currentEntries);
  const previous = previousEntries.length >= 3 ? calculateVarianceScore(previousEntries) : current;

  return current >= previous ? 15 : 9;
}

function calculateVarianceScore(entries: CheckIn[]) {
  const averages = calculateAverages(entries);
  const drift = entries.reduce((sum, entry) => {
    return sum + Math.abs(entry.sleepHours - averages.sleep) + Math.abs(entry.stress - averages.stress) + Math.abs(entry.energy - averages.energy);
  }, 0);

  return Math.max(0, 30 - drift);
}

function calculateDisciplineScoreBase(entries: CheckIn[]) {
  return Math.round((entries.length / 7) * 45);
}

function calculateAverages(entries: CheckIn[]) {
  if (entries.length === 0) {
    return { sleep: 0, stress: 0, energy: 0, balance: 0 };
  }

  const totals = entries.reduce(
    (sum, entry) => ({
      sleep: sum.sleep + entry.sleepHours,
      stress: sum.stress + entry.stress,
      energy: sum.energy + entry.energy,
      balance: sum.balance + calculateBalanceScore(entry).score,
    }),
    { sleep: 0, stress: 0, energy: 0, balance: 0 },
  );

  return {
    sleep: totals.sleep / entries.length,
    stress: totals.stress / entries.length,
    energy: totals.energy / entries.length,
    balance: totals.balance / entries.length,
  };
}

function getEntriesForKeys(checkIns: CheckIn[], keys: string[]) {
  const keySet = new Set(keys);
  return checkIns.filter((checkIn) => keySet.has(checkIn.date));
}

function getPreviousSevenDateKeys(referenceDate = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - index - 7);
    return toDateKey(date);
  }).reverse();
}

function getBestImprovement(sleepDeltaMinutes: number, stressDelta: number, energyDelta: number, balanceDelta: number) {
  const improvements = [
    {
      value: sleepDeltaMinutes,
      text: sleepDeltaMinutes > 0 ? `Je slaap is gemiddeld ${sleepDeltaMinutes} minuten beter dan vorige week.` : "",
    },
    {
      value: stressDelta * 30,
      text: stressDelta > 0 ? `Je stress is ${stressDelta} punten lager dan vorige week.` : "",
    },
    {
      value: energyDelta * 30,
      text: energyDelta > 0 ? `Je energie is ${energyDelta} punten hoger dan vorige week.` : "",
    },
    {
      value: balanceDelta,
      text: balanceDelta > 0 ? "Je bent consistenter dan vorige week." : "",
    },
  ].filter((item) => item.text);

  if (improvements.length === 0) {
    return "Kleine verbetering is ook progressie. Blijf terugkomen.";
  }

  return improvements.sort((a, b) => b.value - a.value)[0].text;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
