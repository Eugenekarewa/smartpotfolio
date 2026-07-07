"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-3 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
    >
      {loading ? "Canceling..." : "Cancel subscription"}
    </button>
  );
}
