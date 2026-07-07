import { Schema } from "mongoose";

const SCOPED_QUERY_OPS = [
  "find",
  "findOne",
  "findOneAndUpdate",
  "findOneAndDelete",
  "findOneAndReplace",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "countDocuments",
] as const;

/**
 * Adds a required, indexed userId field and refuses to execute any query
 * that doesn't filter by it. Centralizes multi-tenant isolation at the
 * model layer instead of trusting every route handler to remember it (NFR-1).
 */
export function userScoped(schema: Schema) {
  schema.add({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  });

  const pre = schema.pre.bind(schema) as (
    op: string,
    fn: (
      this: { getFilter: () => Record<string, unknown>; model: { modelName: string } },
      next: (err?: Error) => void
    ) => void
  ) => void;

  for (const op of SCOPED_QUERY_OPS) {
    pre(op, function (next) {
      const filter = this.getFilter();
      if (!filter || typeof filter.userId === "undefined") {
        next(new Error(`Unscoped query blocked on ${this.model.modelName}.${op}: every query must filter by userId.`));
        return;
      }
      next();
    });
  }
}
