import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes, noteVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    const {
      title,
      content,
      language,
      isSnippet,
      tags: noteTags,
      isBookmarked,
      isPinned,
      folderId,
      sourceUrl,
      sourceTitle,
      selectedText,
      sourceAnchor,
      referenceId,
    } = body;

    const existing = await db.query.notes.findFirst({
      where: eq(notes.id, id),
    });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    const isContentChanged = content !== undefined && content.trim() !== existing.content;
    const isTitleChanged = title !== undefined && title.trim() !== existing.title;
    const isLanguageChanged = language !== undefined && language !== existing.language;
    const isSnippetChanged = isSnippet !== undefined && Boolean(isSnippet) !== existing.isSnippet;

    if (isContentChanged || isTitleChanged || isLanguageChanged || isSnippetChanged) {
      await db.insert(noteVersions).values({
        noteId: existing.id,
        title: existing.title,
        content: existing.content,
        language: existing.language || "plaintext",
        isSnippet: existing.isSnippet,
        userId: user.id,
      });
    }

    const [updatedNote] = await db
      .update(notes)
      .set({
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(language !== undefined && { language }),
        ...(isSnippet !== undefined && { isSnippet: Boolean(isSnippet) }),
        ...(isBookmarked !== undefined && { isBookmarked: Boolean(isBookmarked) }),
        ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(noteTags !== undefined && { tags: Array.isArray(noteTags) ? noteTags : [] }),
        ...(sourceUrl !== undefined && { sourceUrl: sourceUrl || null }),
        ...(sourceTitle !== undefined && { sourceTitle: sourceTitle || null }),
        ...(selectedText !== undefined && { selectedText: selectedText || null }),
        ...(sourceAnchor !== undefined && {
          sourceAnchor: sourceAnchor ? (typeof sourceAnchor === "object" ? JSON.stringify(sourceAnchor) : sourceAnchor) : null,
        }),
        ...(referenceId !== undefined && { referenceId: referenceId || null }),
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id))
      .returning();

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("PATCH /api/note/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existing = await db.query.notes.findFirst({
      where: eq(notes.id, id),
    });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    await db.delete(notes).where(eq(notes.id, id));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/note/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
