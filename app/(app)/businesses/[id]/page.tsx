import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Business, Transaction } from "@/lib/db/models";
import { listAccountsWithValues, getBusinessProfitAndLossTrend } from "@/lib/ledger";
import { formatKes } from "@/lib/money";
import { AddAccountForm } from "../../accounts/AddAccountForm";
import { AddBusinessTransactionForm } from "./AddBusinessTransactionForm";
import { OwnerDrawForm } from "./OwnerDrawForm";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);

  if (!Types.ObjectId.isValid(id)) notFound();
  const businessId = new Types.ObjectId(id);

  await connectToDatabase();
  const business = await Business.findOne({ userId, _id: businessId }).lean();
  if (!business) notFound();

  const [businessAccounts, personalAccounts, pnlTrend, recentTransactions] = await Promise.all([
    listAccountsWithValues(userId, businessId),
    listAccountsWithValues(userId),
    getBusinessProfitAndLossTrend(userId, businessId, 6),
    Transaction.find({ userId, businessId }).sort({ at: -1 }).limit(20).lean(),
  ]);

  const currentMonth = pnlTrend[pnlTrend.length - 1];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">{business.name}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Income (this month)</p>
          <p className="mt-2 text-xl font-semibold">{formatKes(currentMonth.incomeCents)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Expenses (this month)</p>
          <p className="mt-2 text-xl font-semibold">{formatKes(currentMonth.expenseCents)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Net profit</p>
          <p
            className={`mt-2 text-xl font-semibold ${currentMonth.netCents >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {formatKes(currentMonth.netCents)}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">6-month trend</h2>
        <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {pnlTrend.map((m) => (
            <li key={m.month} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-neutral-500">{m.month}</span>
              <span
                className={m.netCents >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
              >
                {formatKes(m.netCents)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Business accounts</h2>
        {businessAccounts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            Add a cash/MMF account for this business before logging income or expenses.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {businessAccounts.map((a) => (
              <li key={String(a._id)} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{a.name}</span>
                <span>{formatKes(a.currentValueCents)}</span>
              </li>
            ))}
          </ul>
        )}
        <AddAccountForm businessId={id} />
      </section>

      {businessAccounts.length > 0 && (
        <>
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Log income or expense</h2>
            <AddBusinessTransactionForm
              businessId={id}
              accounts={businessAccounts.map((a) => ({ id: String(a._id), name: a.name }))}
            />
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Owner draw</h2>
            <p className="mt-1 text-sm text-neutral-500">Move money from a business account to a personal one.</p>
            <OwnerDrawForm
              businessId={id}
              fromAccounts={businessAccounts.map((a) => ({ id: String(a._id), name: a.name }))}
              toAccounts={personalAccounts
                .filter((a) => !a.businessId)
                .map((a) => ({ id: String(a._id), name: a.name }))}
            />
          </section>
        </>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No transactions yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {recentTransactions.map((t) => (
              <li key={String(t._id)} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>
                  {t.category ?? t.type} · {new Date(t.at).toLocaleDateString("en-KE")}
                </span>
                <span className={t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}>
                  {t.type === "income" ? "+" : "-"}
                  {formatKes(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
