"use client";

import { useEffect, useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { BuddyChat } from "@/components/BuddyChat";
import { ButtonLink } from "@/components/ButtonLink";
import { InsightMessage } from "@/components/InsightMessage";
import { todayKey } from "@/lib/date";
import { getCheckInByDate } from "@/lib/storage";
import type { CheckIn } from "@/lib/types";

export default function ResultPage() {
  const [checkIn, setCheckIn] = useState<CheckIn | null | undefined>(undefined);
  const date = todayKey();

  useEffect(() => {
    setCheckIn(getCheckInByDate(date));
  }, [date]);

  return (
    <div className="space-y-5">
      {checkIn ? (
        <>
          <InsightMessage checkIn={checkIn} />
          {checkIn.note ? (
            <BalanceCard>
              <p className="text-sm font-semibold text-ink/50">Je notitie</p>
              <p className="mt-2 text-base leading-7 text-ink/75">{checkIn.note}</p>
            </BalanceCard>
          ) : null}
          <BuddyChat todayEntry={checkIn} />
          <div className="grid gap-3">
            <ButtonLink href="/week">Bekijk weekoverzicht</ButtonLink>
            <ButtonLink href="/check-in" variant="secondary">Aanpassen</ButtonLink>
          </div>
        </>
      ) : (
        <BalanceCard className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Nog geen analyse</h2>
          <p className="text-sm leading-6 text-ink/65">Vul eerst je check-in in voor vandaag.</p>
          <ButtonLink href="/check-in">Check-in invullen</ButtonLink>
        </BalanceCard>
      )}
    </div>
  );
}
