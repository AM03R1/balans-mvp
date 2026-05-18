"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getCheckInByDate, saveCheckIn } from "@/lib/storage";
import { todayKey } from "@/lib/date";
import type { CheckIn, Nutrition } from "@/lib/types";
import { BalanceCard } from "./BalanceCard";

const nutritionOptions: Nutrition[] = ["slecht", "oke", "goed"];

type FormState = {
  date: string;
  sleepHours: string;
  stress: number;
  energy: number;
  nutrition: Nutrition;
  note: string;
};

export function CheckInForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [existingCheckIn, setExistingCheckIn] = useState<CheckIn | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [form, setForm] = useState<FormState>({
    date: todayKey(),
    sleepHours: "",
    stress: 5,
    energy: 5,
    nutrition: "oke",
    note: "",
  });

  useEffect(() => {
    const existing = getCheckInByDate(todayKey());

    if (existing) {
      setExistingCheckIn(existing);
      setIsEditing(false);
      setForm({
        date: existing.date,
        sleepHours: String(existing.sleepHours),
        stress: existing.stress,
        energy: existing.energy,
        nutrition: existing.nutrition,
        note: existing.note,
      });
    } else {
      setIsEditing(true);
    }

    setIsLoaded(true);
  }, []);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const sleepHours = Number(form.sleepHours);

    if (!form.sleepHours || Number.isNaN(sleepHours) || sleepHours < 0 || sleepHours > 14) {
      setError("Vul je slaapuren in tussen 0 en 14.");
      return;
    }

    const savedCheckIn = saveCheckIn({
      date: form.date,
      sleepHours,
      stress: form.stress,
      energy: form.energy,
      nutrition: form.nutrition,
      note: form.note.trim(),
    });

    setExistingCheckIn(savedCheckIn);
    setIsEditing(false);
    router.push("/result");
  }

  if (!isLoaded) {
    return null;
  }

  if (existingCheckIn && !isEditing) {
    return (
      <div className="space-y-4">
        <BalanceCard className="space-y-4">
          <div>
            <p className="text-sm font-extrabold uppercase text-leaf">Vandaag ingevuld</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight">Je check-in van vandaag</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SummaryMetric label="Slaap" value={`${existingCheckIn.sleepHours}u`} />
            <SummaryMetric label="Stress" value={`${existingCheckIn.stress}/10`} />
            <SummaryMetric label="Energie" value={`${existingCheckIn.energy}/10`} />
            <SummaryMetric label="Voeding" value={getNutritionLabel(existingCheckIn.nutrition)} />
          </div>
          <div className="rounded-lg border border-leaf/10 bg-mist p-4">
            <p className="text-sm font-extrabold text-leaf">Notitie</p>
            <p className="mt-1 text-sm leading-6 text-ink/70">{existingCheckIn.note || "Geen notitie ingevuld."}</p>
          </div>
        </BalanceCard>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="min-h-[42px] w-full rounded-lg bg-leaf px-5 text-base font-extrabold text-white shadow-soft"
        >
          Wijzig
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BalanceCard className="space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-ink/65">Slaapuren</span>
          <input
            inputMode="decimal"
            type="text"
            value={form.sleepHours}
            onChange={(event) => updateField("sleepHours", event.target.value)}
            className="mt-2 min-h-[42px] w-full rounded-lg border border-[#dde3ea] bg-white px-3 text-base font-extrabold text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            placeholder="Bijv. 7.5"
          />
        </label>

        <ScoreSlider
          label="Stress"
          value={form.stress}
          onChange={(value) => updateField("stress", value)}
          lowLabel="rustig"
          highLabel="hoog"
        />

        <ScoreSlider
          label="Energie"
          value={form.energy}
          onChange={(value) => updateField("energy", value)}
          lowLabel="laag"
          highLabel="veel"
        />

        <div>
          <span className="text-sm font-semibold text-ink/65">Voeding</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {nutritionOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateField("nutrition", option)}
                className={`min-h-9 rounded-lg border text-sm font-extrabold capitalize ${
                  form.nutrition === option ? "border-leaf bg-leaf text-white" : "border-[#d8c9ff] bg-white text-leaf"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-ink/65">Korte notitie</span>
          <textarea
            value={form.note}
            onChange={(event) => updateField("note", event.target.value)}
            rows={4}
            maxLength={240}
            className="mt-2 w-full resize-none rounded-lg border border-[#dde3ea] bg-white px-3 py-3 text-base text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            placeholder="Wat viel vandaag op?"
          />
        </label>

        {error ? <p className="rounded-lg bg-blush px-4 py-3 text-sm font-extrabold text-[#a94735]">{error}</p> : null}
      </BalanceCard>

      <button
        type="submit"
        className="min-h-[42px] w-full rounded-lg bg-leaf px-5 text-base font-extrabold text-white shadow-soft"
      >
        Opslaan en analyse bekijken
      </button>
    </form>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-leaf/10 bg-mist p-4">
      <p className="text-sm font-semibold text-ink/50">{label}</p>
      <p className="mt-2 text-xl font-black text-leaf">{value}</p>
    </div>
  );
}

function getNutritionLabel(nutrition: Nutrition) {
  return {
    slecht: "Slecht",
    oke: "Oke",
    goed: "Goed",
  }[nutrition];
}

type ScoreSliderProps = {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
};

function ScoreSlider({ label, value, lowLabel, highLabel, onChange }: ScoreSliderProps) {
  return (
    <label className="block">
      <span className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink/65">{label}</span>
        <span className="rounded-full bg-mist px-3 py-1 text-sm font-extrabold text-leaf">{value}/10</span>
      </span>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-leaf"
      />
      <span className="mt-1 flex justify-between text-xs font-semibold text-ink/45">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </span>
    </label>
  );
}
