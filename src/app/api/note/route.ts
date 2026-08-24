import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, desc, asc, and, isNull } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/syncUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getOrCreateDbUser();
    if (!user) {
      return NextResponse.json({ notes: [], isGuest: true });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const isPinned = searchParams.get("isPinned");
    const isBookmarked = searchParams.get("isBookmarked");
    const sort = searchParams.get("sort") || "newest";

    const conditions = [eq(notes.userId, user.id)];
    
    if (folderId !== null) {
      if (folderId === "none") {
        conditions.push(isNull(notes.folderId));
      } else if (folderId !== "") {
        conditions.push(eq(notes.folderId, folderId));
      }
    }
    
    if (isPinned === "true") conditions.push(eq(notes.isPinned, true));
    if (isBookmarked === "true") conditions.push(eq(notes.isBookmarked, true));

    let orderClause: import("drizzle-orm").SQL[] = [desc(notes.updatedAt)];
    switch (sort) {
      case "oldest": orderClause = [asc(notes.updatedAt)]; break;
      case "title_asc": orderClause = [asc(notes.title)]; break;
      case "title_desc": orderClause = [desc(notes.title)]; break;
    }

    const userNotes = await db.query.notes.findMany({
      where: and(...conditions),
      orderBy: orderClause,
    });

    return NextResponse.json({ notes: userNotes, isGuest: false });
  } catch (error) {
    console.error("GET /api/note error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateDbUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

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

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Note content is required." },
        { status: 400 }
      );
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        title: title ? title.trim() : "Untitled Note",
        content: content.trim(),
        language: language || "plaintext",
        isSnippet: Boolean(isSnippet),
        isBookmarked: Boolean(isBookmarked),
        isPinned: Boolean(isPinned),
        folderId: folderId || null,
        tags: Array.isArray(noteTags) ? noteTags : [],
        sourceUrl: sourceUrl || null,
        sourceTitle: sourceTitle || null,
        selectedText: selectedText || null,
        sourceAnchor: sourceAnchor ? (typeof sourceAnchor === "object" ? JSON.stringify(sourceAnchor) : sourceAnchor) : null,
        referenceId: referenceId || (sourceUrl ? `ref_${crypto.randomUUID()}` : null),
        userId: user.id,
      })
      .returning();

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("POST /api/note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
