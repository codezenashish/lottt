import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes, noteCollaborators } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/syncUser";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const user = await getOrCreateDbUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id, collaboratorId } = await params;

    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, user.id)),
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or access denied." },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(noteCollaborators)
      .where(
        and(
          eq(noteCollaborators.noteId, id),
          eq(noteCollaborators.userId, collaboratorId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Collaborator not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/note/[id]/collaborators/[collaboratorId] error:", error);
    return NextResponse.json(
      { error: "Failed to remove collaborator." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const user = await getOrCreateDbUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id, collaboratorId } = await params;
    const body = await req.json();
    const { role } = body;

    if (!role || (role !== "VIEWER" && role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, user.id)),
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or access denied." },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(noteCollaborators)
      .set({ role })
      .where(
        and(
          eq(noteCollaborators.noteId, id),
          eq(noteCollaborators.userId, collaboratorId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Collaborator not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, collaborator: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/note/[id]/collaborators/[collaboratorId] error:", error);
    return NextResponse.json(
      { error: "Failed to update collaborator role." },
      { status: 500 }
    );
  }
}
