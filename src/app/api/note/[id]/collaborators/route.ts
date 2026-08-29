import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes, noteCollaborators } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/syncUser";

export const dynamic = "force-dynamic";

export async function GET(
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

    // Verify ownership
    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, user.id)),
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or access denied." },
        { status: 403 }
      );
    }

    const collaborators = await db.query.noteCollaborators.findMany({
      where: eq(noteCollaborators.noteId, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ collaborators }, { status: 200 });
  } catch (error) {
    console.error("GET /api/note/[id]/collaborators error:", error);
    return NextResponse.json(
      { error: "Failed to fetch note collaborators." },
      { status: 500 }
    );
  }
}
