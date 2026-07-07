import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteUserAccount } from "@/lib/auth/deleteAccount";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteUserAccount(session.user.id);

  return NextResponse.json({ ok: true });
}
