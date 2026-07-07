"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "mmf", label: "Money Market Fund" },
  { value: "stock", label: "NSE Stock" },
  { value: "sacco", label: "SACCO" },
  { value: "tbill_bond", label: "T-Bill / Bond" },
  { value: "crypto", label: "Crypto" },
  { value: "property", label: "Property" },
  { value: "vehicle", label: "Vehicle" },
  { value: "other_asset", label: "Other Asset" },
  { value: "loan", label: "Loan" },
] as const;

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent";

export function AddAccountForm({ businessId }: { businessId?: string } = {}) {
  const router = useRouter();
  const [type, setType] = useState<(typeof ACCOUNT_TYPES)[number]["value"]>("cash");
  const [name, setName] = useState("");
  const [valueKes, setValueKes] = useState("");
  const [ticker, setTicker] = useState("");
  const [units, setUnits] = useState("");
  const [faceValueKes, setFaceValueKes] = useState("");
  const [ratePct, setRatePct] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const initialValueCents = Math.round(Number(valueKes) * 100);

    const meta: Record<string, unknown> = {};
    if (type === "stock" || type === "crypto") {
      meta.ticker = ticker;
      meta.units = Number(units);
    }
    if (type === "tbill_bond") {
      meta.faceValueCents = Math.round(Number(faceValueKes) * 100);
      meta.rateBps = Math.round(Number(ratePct) * 100);
      meta.maturityDate = maturityDate;
    }
    if (type === "loan") {
      meta.interestRateBps = Math.round(Number(ratePct) * 100);
      meta.originalPrincipalCents = initialValueCents;
    }

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        initialValueCents,
        businessId,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not add account. Check the details and try again.");
      return;
    }

    setName("");
    setValueKes("");
    setTicker("");
    setUnits("");
    setFaceValueKes("");
    setRatePct("");
    setMaturityDate("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className={inputClass}
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Name (e.g. CIC MMF)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>

      {type === "loan" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            type="number"
            step="0.01"
            placeholder="Outstanding balance (KES)"
            value={valueKes}
            onChange={(e) => setValueKes(e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Interest rate (% p.a.)"
            value={ratePct}
            onChange={(e) => setRatePct(e.target.value)}
            className={inputClass}
          />
        </div>
      ) : (
        <input
          required
          type="number"
          step="0.01"
          placeholder="Current value (KES)"
          value={valueKes}
          onChange={(e) => setValueKes(e.target.value)}
          className={inputClass}
        />
      )}

      {(type === "stock" || type === "crypto") && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Ticker (e.g. SCOM, BTC)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className={inputClass}
          />
          <input
            required
            type="number"
            step="any"
            placeholder="Units held"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {type === "tbill_bond" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            required
            type="number"
            step="0.01"
            placeholder="Face value (KES)"
            value={faceValueKes}
            onChange={(e) => setFaceValueKes(e.target.value)}
            className={inputClass}
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Rate (% p.a.)"
            value={ratePct}
            onChange={(e) => setRatePct(e.target.value)}
            className={inputClass}
          />
          <input
            required
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Adding..." : "Add account"}
      </button>
    </form>
  );
}
