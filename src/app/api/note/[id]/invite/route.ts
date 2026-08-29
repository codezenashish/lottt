import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes, noteCollaborators, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/syncUser";

export const dynamic = "force-dynamic";

export async function POST(
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
    const { email, role } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const assignedRole = role === "EDITOR" ? "EDITOR" : "VIEWER";

    // Verify note ownership
    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, user.id)),
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or access denied." },
        { status: 403 }
      );
    }

    // Verify target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, email.trim().toLowerCase()),
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "No registered user found with that email address." },
        { status: 404 }
      );
    }

    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: "You cannot invite yourself." },
        { status: 400 }
      );
    }

    // Check existing collaboration
    const existing = await db.query.noteCollaborators.findFirst({
      where: and(
        eq(noteCollaborators.noteId, id),
        eq(noteCollaborators.userId, targetUser.id)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a collaborator." },
        { status: 400 }
      );
    }

    const [collaboration] = await db
      .insert(noteCollaborators)
      .values({
        noteId: id,
        userId: targetUser.id,
        invitedBy: user.id,
        role: assignedRole,
      })
      .returning();

    return NextResponse.json({ collaboration, targetUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/note/[id]/invite error:", error);
    return NextResponse.json(
      { error: "Failed to invite collaborator." },
      { status: 500 }
    );
  }
}
