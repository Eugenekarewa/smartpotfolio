import { Types } from "mongoose";
import { auth } from "@/auth";
import { listBills, deriveBillStatus } from "@/lib/bills";
import { listAccountsWithValues } from "@/lib/ledger";
import { formatKes } from "@/lib/money";
import { AddBillForm } from "./AddBillForm";
import { MarkPaidButton } from "./MarkPaidButton";

const STATUS_STYLES: Record<string, string> = {
  upcoming: "text-neutral-500",
  overdue: "text-red-600 dark:text-red-400",
  paid: "text-emerald-600 dark:text-emerald-400",
};

export default async function BillsPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);

  const [bills, accounts] = await Promise.all([listBills(userId), listAccountsWithValues(userId)]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Bills</h1>

      {bills.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No bills yet — add your first one below.</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {bills.map((bill) => {
            const status = deriveBillStatus(bill);
            return (
              <li key={String(bill._id)} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{bill.name}</p>
                  <p className={`text-xs ${STATUS_STYLES[status]}`}>
                    {formatKes(bill.amountCents)} · {bill.recurrence.replace("_", " ")} · due{" "}
                    {new Date(bill.nextDueAt).toLocaleDateString("en-KE")} · {status}
                  </p>
                </div>
                {status !== "paid" && (
                  <MarkPaidButton
                    billId={String(bill._id)}
                    accounts={accounts.map((a) => ({ id: String(a._id), name: a.name }))}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Add a bill</h2>
        <AddBillForm accounts={accounts.map((a) => ({ id: String(a._id), name: a.name }))} />
      </section>
    </main>
  );
}
