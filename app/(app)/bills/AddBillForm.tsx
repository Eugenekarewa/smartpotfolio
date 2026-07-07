"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const RECURRENCES = [
  { value: "one_off", label: "One-off" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom_dom", label: "Custom day of month" },
  { value: "yearly", label: "Yearly" },
] as const;

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

export function AddBillForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amountKes, setAmountKes] = useState("");
  const [recurrence, setRecurrence] = useState<(typeof RECURRENCES)[number]["value"]>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [firstDueAt, setFirstDueAt] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsDayOfMonth = recurrence === "monthly" || recurrence === "custom_dom";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amountCents: Math.round(Number(amountKes) * 100),
        recurrence,
        dayOfMonth: needsDayOfMonth ? Number(dayOfMonth) : undefined,
        firstDueAt,
        accountId: accountId || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not add bill. Check the details and try again.");
      return;
    }

    setName("");
    setAmountKes("");
    setDayOfMonth("");
    setFirstDueAt("");
    setAccountId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Name (e.g. Rent, KPLC)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Amount (KES)"
          value={amountKes}
          onChange={(e) => setAmountKes(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)} className={inputClass}>
          {RECURRENCES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          required
          type="date"
          value={firstDueAt}
          onChange={(e) => setFirstDueAt(e.target.value)}
          className={inputClass}
        />
      </div>

      {needsDayOfMonth && (
        <input
          required
          type="number"
          min={1}
          max={31}
          placeholder="Day of month (1-31)"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          className={inputClass}
        />
      )}

      {accounts.length > 0 && (
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
          <option value="">No linked account (e.g. a loan repayment)</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Adding..." : "Add bill"}
      </button>
    </form>
  );
}
