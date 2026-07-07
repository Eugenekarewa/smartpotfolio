"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AddValuationForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [valueKes, setValueKes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/accounts/${accountId}/valuations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valueCents: Math.round(Number(valueKes) * 100) }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not save value. Try again.");
      return;
    }

    setValueKes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
      <input
        required
        type="number"
        step="0.01"
        placeholder="New value (KES)"
        value={valueKes}
        onChange={(e) => setValueKes(e.target.value)}
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {error && <p className="self-center text-sm text-red-600">{error}</p>}
    </form>
  );
}
