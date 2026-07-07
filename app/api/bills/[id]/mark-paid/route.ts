import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { markBillPaid } from "@/lib/bills";
import { markPaidSchema } from "@/lib/bills/schemas";

export async function POST(req: Request, ctx: RouteContext<"/api/bills/[id]/mark-paid">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = markPaidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const userId = new Types.ObjectId(session.user.id);

  try {
    const bill = await markBillPaid(userId, new Types.ObjectId(id), {
      accountId: parsed.data.accountId ? new Types.ObjectId(parsed.data.accountId) : undefined,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
    });
    return NextResponse.json({ bill });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
