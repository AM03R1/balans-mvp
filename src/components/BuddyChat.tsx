"use client";

import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { BUDDY_CRISIS_REPLY, generateBuddyOpening, generateBuddyReply } from "@/lib/buddy";
import type { CheckIn } from "@/lib/types";
import { BalanceCard } from "./BalanceCard";

type BuddyChatProps = {
  todayEntry: CheckIn;
  defaultOpen?: boolean;
};

type BuddyMessage = {
  id: number;
  role: "buddy" | "user";
  text: string;
};

const SAFETY_MESSAGE =
  "Balans Buddy is bedoeld om je te helpen reflecteren, maar is geen vervanging voor professionele hulp. Als je jezelf of iemand anders iets wilt aandoen, neem direct contact op met 112 of iemand die je vertrouwt.";

export function BuddyChat({ todayEntry, defaultOpen = false }: BuddyChatProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<BuddyMessage[]>([
    {
      id: 1,
      role: "buddy",
      text: generateBuddyOpening(todayEntry),
    },
  ]);

  function getOpeningMessage(): BuddyMessage {
    return {
      id: 1,
      role: "buddy",
      text: generateBuddyOpening(todayEntry),
    };
  }

  function resetChat() {
    setDraft("");
    setMessages([getOpeningMessage()]);
  }

  function openChat() {
    setIsOpen(true);
  }

  function closeChat() {
    resetChat();
    setIsOpen(false);
  }

  function sendDraft() {
    const text = draft.trim();
    if (!text) {
      return;
    }

    const reply = generateBuddyReply(text, todayEntry);
    const now = Date.now();

    setMessages((current) => [
      ...current,
      { id: now, role: "user", text },
      { id: now + 1, role: "buddy", text: reply },
    ]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendDraft();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendDraft();
    }
  }

  if (!isOpen) {
    return (
      <BalanceCard className="space-y-4">
        <div>
          <p className="text-sm font-extrabold uppercase text-leaf">Balans Buddy</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">Even napraten over je check-in?</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Een korte plek om je gedachten te ordenen. Geen diagnose, geen therapie, alleen rustig reflecteren.
          </p>
        </div>
        <button
          type="button"
          onClick={openChat}
          className="min-h-[42px] w-full rounded-lg bg-leaf px-5 text-base font-extrabold text-white shadow-soft"
        >
          Praat erover
        </button>
      </BalanceCard>
    );
  }

  return (
    <BalanceCard className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold uppercase text-leaf">Balans Buddy</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">Praat erover</h2>
        </div>
        <button
          type="button"
          onClick={closeChat}
          className="min-h-9 rounded-lg border border-[#dde3ea] bg-white px-3 text-sm font-extrabold text-ink"
        >
          Sluiten
        </button>
      </div>

      <p className="rounded-lg bg-blush px-4 py-3 text-sm leading-6 text-[#8a3f31]">{SAFETY_MESSAGE}</p>

      <div className="grid max-h-[360px] gap-3 overflow-y-auto rounded-lg border border-[#dde3ea] bg-white p-3" role="log" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[88%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-6 ${
              message.role === "user"
                ? "ml-auto bg-leaf text-white"
                : message.text === BUDDY_CRISIS_REPLY
                  ? "border border-[#efb4a8] bg-blush text-[#8a3f31]"
                  : "bg-mist text-ink/75"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="block">
          <span className="sr-only">Bericht aan Balans Buddy</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            maxLength={420}
            className="w-full resize-none rounded-lg border border-[#dde3ea] bg-white px-3 py-3 text-base text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            placeholder="Typ kort hoe je je voelt..."
          />
        </label>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="min-h-[42px] rounded-lg bg-leaf px-5 text-base font-extrabold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Verstuur
        </button>
      </form>
    </BalanceCard>
  );
}
