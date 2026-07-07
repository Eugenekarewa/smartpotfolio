"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

export function OwnerDrawForm({
  businessId,
  fromAccounts,
  toAccounts,
}: {
  businessId: string;
  fromAccounts: { id: string; name: string }[];
  toAccounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [fromAccountId, setFromAccountId] = useState(fromAccounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(toAccounts[0]?.id ?? "");
  const [amountKes, setAmountKes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!toAccountId) {
      setError("Add a personal account first to receive the draw.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/businesses/${businessId}/owner-draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccountId,
        toAccountId,
        amountCents: Math.round(Number(amountKes) * 100),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not save. Check the details and try again.");
      return;
    }

    setAmountKes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className={inputClass}>
          {fromAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className={inputClass}>
          {toAccounts.length === 0 ? (
            <option value="">No personal accounts yet</option>
          ) : (
            toAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))
          )}
        </select>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Saving..." : "Draw"}
      </button>
    </form>
  );
}
