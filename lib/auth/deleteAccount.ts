import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  User,
  Account,
  Valuation,
  Transaction,
  Bill,
  Business,
  Subscription,
  PasswordResetToken,
} from "@/lib/db/models";

/**
 * Full data erasure for DPA compliance (FR-1.3, FR-9.2). Deletes every
 * user-scoped collection, then the user document itself. Global collections
 * (market_data, news_items) are untouched — they carry no user data.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await connectToDatabase();
  const id = new Types.ObjectId(userId);

  await Promise.all([
    Valuation.deleteMany({ userId: id }),
    Transaction.deleteMany({ userId: id }),
    Bill.deleteMany({ userId: id }),
    Account.deleteMany({ userId: id }),
    Business.deleteMany({ userId: id }),
    Subscription.deleteMany({ userId: id }),
    PasswordResetToken.deleteMany({ userId: id }),
  ]);

  await User.findByIdAndDelete(id);
}
