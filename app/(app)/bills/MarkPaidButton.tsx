"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkPaidButton({
  billId,
  accounts,
}: {
  billId: string;
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/bills/${billId}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: accountId || undefined }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {accounts.length > 0 && (
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-transparent"
        >
          <option value="">No account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Saving..." : "Mark paid"}
      </button>
    </div>
  );
}
