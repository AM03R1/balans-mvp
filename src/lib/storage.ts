"use client";

import type { CheckIn, CheckInInput, Nutrition } from "./types";

const STORAGE_KEY = "balans-mvp-checkins";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCheckIns(): CheckIn[] {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.map(normalizeCheckIn).filter((checkIn): checkIn is CheckIn => Boolean(checkIn)) : [];
  } catch {
    return [];
  }
}

function normalizeCheckIn(value: unknown): CheckIn | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const checkIn = value as Record<string, unknown>;
  const date = typeof checkIn.date === "string" && checkIn.date ? checkIn.date : "";

  if (!date) {
    return null;
  }

  const sleepHours = normalizeNumber(checkIn.sleepHours, 0, 14, 0);
  const stress = normalizeScore(checkIn.stress, getStressFromLegacyFocus(checkIn.focus));
  const energy = normalizeScore(checkIn.energy, getEnergyFromLegacyMood(checkIn.mood));
  const createdAt = typeof checkIn.createdAt === "string" ? checkIn.createdAt : `${date}T00:00:00.000Z`;
  const updatedAt = typeof checkIn.updatedAt === "string" ? checkIn.updatedAt : createdAt;

  return {
    ...checkIn,
    date,
    sleepHours,
    stress,
    energy,
    nutrition: normalizeNutrition(checkIn.nutrition),
    note: typeof checkIn.note === "string" ? checkIn.note : "",
    createdAt,
    updatedAt,
  };
}

function normalizeNutrition(value: unknown): Nutrition {
  if (value === "goed" || value === "slecht") {
    return value;
  }

  return "oke";
}

function normalizeScore(value: unknown, fallback: number) {
  return Math.round(normalizeNumber(value, 1, 10, fallback));
}

function normalizeNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, numberValue));
}

function getStressFromLegacyFocus(value: unknown) {
  if (value === "slecht") {
    return 8;
  }

  if (value === "moeilijk") {
    return 7;
  }

  if (value === "scherp") {
    return 3;
  }

  return 5;
}

function getEnergyFromLegacyMood(value: unknown) {
  if (value === "slecht") {
    return 3;
  }

  if (value === "goed") {
    return 8;
  }

  if (value === "heel-goed") {
    return 9;
  }

  return 5;
}

export function getCheckInByDate(date: string) {
  return getCheckIns().find((checkIn) => checkIn.date === date) ?? null;
}

export function saveCheckIn(input: CheckInInput) {
  const current = getCheckIns();
  const existing = current.find((checkIn) => checkIn.date === input.date);
  const now = new Date().toISOString();

  const nextEntry: CheckIn = {
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const nextCheckIns = [
    nextEntry,
    ...current.filter((checkIn) => checkIn.date !== input.date),
  ].sort((a, b) => b.date.localeCompare(a.date));

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCheckIns));

  return nextEntry;
}
