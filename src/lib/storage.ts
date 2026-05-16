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
    return Array.isArray(parsed) ? parsed.map(normalizeCheckIn) : [];
  } catch {
    return [];
  }
}

function normalizeCheckIn(checkIn: CheckIn): CheckIn {
  return {
    ...checkIn,
    nutrition: normalizeNutrition(checkIn.nutrition),
  };
}

function normalizeNutrition(value: string): Nutrition {
  if (value === "goed" || value === "slecht") {
    return value;
  }

  return "oke";
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
