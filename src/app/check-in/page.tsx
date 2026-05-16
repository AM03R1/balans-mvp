import { CheckInForm } from "@/components/CheckInForm";

export default function CheckInPage() {
  return (
    <div className="space-y-5">
      <header className="pt-3">
        <p className="text-sm font-extrabold uppercase text-leaf">Check-in</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Hoe is je basis vandaag?</h1>
      </header>
      <CheckInForm />
    </div>
  );
}
