import { Schema, model, models, type InferSchemaType } from "mongoose";
import { userScoped } from "../userScoped";

const businessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

businessSchema.plugin(userScoped);

export type BusinessDoc = InferSchemaType<typeof businessSchema>;

export const Business = models.Business ?? model("Business", businessSchema);
