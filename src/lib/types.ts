export type Nutrition = "slecht" | "oke" | "goed";

export type CheckIn = {
  date: string;
  sleepHours: number;
  stress: number;
  energy: number;
  nutrition: Nutrition;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type CheckInInput = Omit<CheckIn, "createdAt" | "updatedAt">;

export type WeeklyStats = {
  averageSleep: number;
  averageStress: number;
  averageEnergy: number;
  averageBalanceScore: number;
  averageDisciplineScore: number;
  daysFilled: number;
};

export type ScoreFactor = "slaap" | "stress" | "energie" | "voeding";

export type BalanceScore = {
  score: number;
  explanation: string;
  mainFactor: ScoreFactor;
  factorText: string;
};

export type DisciplineScore = {
  score: number;
  explanation: string;
  streak: number;
  checkInsThisWeek: number;
};

export type WeekComparison = {
  balanceDelta: number;
  disciplineDelta: number;
  sleepDeltaMinutes: number;
  stressDelta: number;
  energyDelta: number;
  bestImprovement: string;
};
