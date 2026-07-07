import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Account, Valuation } from "@/lib/db/models";
import { getAccountValueCents } from "@/lib/ledger";
import { formatKes } from "@/lib/money";
import { AddValuationForm } from "./AddValuationForm";
import { ValueSparkline } from "./ValueSparkline";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);

  if (!Types.ObjectId.isValid(id)) notFound();
  const accountId = new Types.ObjectId(id);

  await connectToDatabase();
  const account = await Account.findOne({ userId, _id: accountId }).lean();
  if (!account) notFound();

  const [currentValueCents, valuations] = await Promise.all([
    getAccountValueCents(userId, accountId),
    Valuation.find({ userId, accountId }).sort({ at: 1 }).lean(),
  ]);

  const gainCents = currentValueCents - (account.costBasisCents ?? 0);
  const gainPct = account.costBasisCents ? (gainCents / account.costBasisCents) * 100 : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">{account.name}</h1>
      <p className="text-sm text-neutral-500">{account.type}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Current value</p>
          <p className="mt-2 text-xl font-semibold">{formatKes(currentValueCents)}</p>
        </div>
        {account.type !== "loan" && account.costBasisCents ? (
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Gain / loss</p>
            <p
              className={`mt-2 text-xl font-semibold ${gainCents >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {gainCents >= 0 ? "+" : ""}
              {formatKes(gainCents)} {gainPct !== null && `(${gainPct.toFixed(1)}%)`}
            </p>
          </div>
        ) : null}
        {account.type === "tbill_bond" && account.meta?.maturityDate ? (
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Maturity</p>
            <p className="mt-2 text-xl font-semibold">
              {new Date(account.meta.maturityDate).toLocaleDateString("en-KE")}
            </p>
          </div>
        ) : null}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Value history</h2>
        {valuations.length > 0 && (
          <div className="mt-3">
            <ValueSparkline points={valuations.map((v) => ({ at: String(v.at), valueCents: v.valueCents }))} />
          </div>
        )}
        <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {[...valuations].reverse().map((v) => (
            <li key={String(v._id)} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{new Date(v.at).toLocaleDateString("en-KE")}</span>
              <span>{formatKes(v.valueCents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Update value</h2>
        <AddValuationForm accountId={id} />
      </section>
    </main>
  );
}
