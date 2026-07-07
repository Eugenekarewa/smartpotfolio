"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function UpgradeForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not start payment. Check the number and try again.");
      return;
    }

    setStatus("sent");
    router.refresh();
  }

  if (status === "sent") {
    return (
      <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
        Check your phone for the M-Pesa prompt and enter your PIN to complete payment.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
      <input
        required
        placeholder="2547XXXXXXXX"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Sending..." : "Pay with M-Pesa"}
      </button>
      {error && <p className="self-center text-sm text-red-600">{error}</p>}
    </form>
  );
}
