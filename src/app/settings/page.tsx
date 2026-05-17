import { BalanceCard } from "@/components/BalanceCard";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <BalanceCard className="space-y-3">
        <h2 className="text-2xl font-bold">Lokale MVP</h2>
        <p className="text-sm leading-6 text-ink/65">
          Balans bewaart je check-ins alleen op dit apparaat. Er zijn nu nog geen accounts, meldingen of cloudinstellingen.
        </p>
      </BalanceCard>
    </div>
  );
}
