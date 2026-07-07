"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

export function AddBusinessTransactionForm({
  businessId,
  accounts,
}: {
  businessId: string;
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [type, setType] = useState<"income" | "expense">("income");
  const [amountKes, setAmountKes] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/businesses/${businessId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        type,
        amountCents: Math.round(Number(amountKes) * 100),
        category: category || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not save. Check the details and try again.");
      return;
    }

    setAmountKes("");
    setCategory("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={type} onChange={(e) => setType(e.target.value as "income" | "expense")} className={inputClass}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
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
      <input
        placeholder="Category (optional)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={inputClass}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
