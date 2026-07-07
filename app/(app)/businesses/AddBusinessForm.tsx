"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AddBusinessForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not add business. Try again.");
      return;
    }

    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
      <input
        required
        placeholder="Business name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Adding..." : "Add"}
      </button>
      {error && <p className="self-center text-sm text-red-600">{error}</p>}
    </form>
  );
}
