import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/syncUser";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateDbUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { isShared } = body;

    const existingNote = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, user.id)),
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    const shareToken = isShared ? (existingNote.shareToken || crypto.randomUUID()) : null;

    const [updatedNote] = await db
      .update(notes)
      .set({
        isShared: Boolean(isShared),
        shareToken,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id))
      .returning();

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("PATCH /api/note/[id]/share error:", error);
    return NextResponse.json(
      { error: "Failed to update note share settings" },
      { status: 500 }
    );
  }
}
