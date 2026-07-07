import { Types } from "mongoose";
import Link from "next/link";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Business } from "@/lib/db/models";
import { AddBusinessForm } from "./AddBusinessForm";

export default async function BusinessesPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);

  await connectToDatabase();
  const businesses = await Business.find({ userId, archived: false }).sort({ createdAt: 1 }).lean();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Businesses</h1>

      {businesses.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No businesses yet — add your first one below.</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {businesses.map((business) => (
            <li key={String(business._id)} className="px-4 py-3">
              <Link href={`/businesses/${business._id}`} className="text-sm font-medium hover:underline">
                {business.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Add a business</h2>
        <AddBusinessForm />
      </section>
    </main>
  );
}
