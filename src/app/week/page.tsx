import { WeeklyOverview } from "@/components/WeeklyOverview";

export default function WeekPage() {
  return (
    <div className="space-y-5">
      <header className="pt-3">
        <p className="text-sm font-extrabold uppercase text-leaf">Progressie</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Discipline door zichtbare progressie</h1>
      </header>
      <WeeklyOverview />
    </div>
  );
}
