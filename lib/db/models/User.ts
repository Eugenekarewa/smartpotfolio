import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // absent for OAuth-only users
    image: { type: String },
    consent: {
      privacyPolicyAcceptedAt: { type: Date },
      marketingEmails: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = models.User ?? model("User", userSchema);
