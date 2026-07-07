import { Types } from "mongoose";
import Link from "next/link";
import { auth } from "@/auth";
import { listAccountsWithValues } from "@/lib/ledger";
import { formatKes } from "@/lib/money";
import { AddAccountForm } from "./AddAccountForm";

const TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  mmf: "Money Market Fund",
  stock: "NSE Stock",
  sacco: "SACCO",
  tbill_bond: "T-Bill / Bond",
  crypto: "Crypto",
  property: "Property",
  vehicle: "Vehicle",
  other_asset: "Other Asset",
  loan: "Loan",
};

export default async function AccountsPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);
  const accounts = await listAccountsWithValues(userId);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
      </div>

      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No accounts yet — add your first one below.</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {accounts.map((account) => {
            const gainCents = account.currentValueCents - (account.costBasisCents ?? 0);
            return (
              <li key={String(account._id)} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link href={`/accounts/${account._id}`} className="text-sm font-medium hover:underline">
                    {account.name}
                  </Link>
                  <p className="text-xs text-neutral-500">{TYPE_LABELS[account.type] ?? account.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatKes(account.currentValueCents)}</p>
                  {account.type !== "loan" && account.costBasisCents ? (
                    <p className={`text-xs ${gainCents >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {gainCents >= 0 ? "+" : ""}
                      {formatKes(gainCents)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Add an account</h2>
        <AddAccountForm />
      </section>
    </main>
  );
}
