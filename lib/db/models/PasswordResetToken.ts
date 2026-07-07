import { Schema, model, models, type InferSchemaType } from "mongoose";

const passwordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDoc = InferSchemaType<typeof passwordResetTokenSchema>;

export const PasswordResetToken = models.PasswordResetToken ?? model("PasswordResetToken", passwordResetTokenSchema);
