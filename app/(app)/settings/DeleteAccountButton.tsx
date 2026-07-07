"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DeleteAccountButton() {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setLoading(false);
      setError("Could not delete account. Try again.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="rounded-md border border-red-300 p-4 dark:border-red-900">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete account</p>
      <p className="mt-1 text-sm text-neutral-500">
        Permanently deletes your account and every record — accounts, valuations, transactions, bills, businesses,
        and subscription. This cannot be undone.
      </p>
      <input
        placeholder='Type "DELETE" to confirm'
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={handleDelete}
        disabled={confirmText !== "DELETE" || loading}
        className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete my account"}
      </button>
    </div>
  );
}
