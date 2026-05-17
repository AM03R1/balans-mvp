"use client";

import { useEffect, useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { BuddyChat } from "@/components/BuddyChat";
import { ButtonLink } from "@/components/ButtonLink";
import { todayKey } from "@/lib/date";
import { getCheckInByDate } from "@/lib/storage";
import type { CheckIn } from "@/lib/types";

export default function BuddyPage() {
  const [checkIn, setCheckIn] = useState<CheckIn | null | undefined>(undefined);
  const date = todayKey();

  useEffect(() => {
    setCheckIn(getCheckInByDate(date));
  }, [date]);

  return (
    <div className="space-y-5">
      {checkIn ? (
        <BuddyChat todayEntry={checkIn} defaultOpen />
      ) : (
        <BalanceCard className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Eerst even inchecken</h2>
          <p className="text-sm leading-6 text-ink/65">
            De buddy gebruikt je check-in van vandaag als context. Vul die eerst kort in.
          </p>
          <ButtonLink href="/check-in">Check-in invullen</ButtonLink>
        </BalanceCard>
      )}
    </div>
  );
}
