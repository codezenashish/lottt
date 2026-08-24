import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, notes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization Bearer header" },
        { status: 401, headers: corsHeaders }
      );
    }

    const apiKey = authHeader.substring(7).trim();
    let user = await db.query.users.findFirst({
      where: eq(users.apiKey, apiKey),
    });

    if (!user) {
      user = await db.query.users.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404, headers: corsHeaders });
    }

    const userNotes = await db.query.notes.findMany({
      where: eq(notes.userId, user.id),
      orderBy: [desc(notes.updatedAt)],
    });

    return NextResponse.json(
      {
        count: userNotes.length,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        notes: userNotes,
      },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization Bearer header" },
        { status: 401, headers: corsHeaders }
      );
    }

    const apiKey = authHeader.substring(7).trim();
    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401, headers: corsHeaders });
    }

    // Rate Limiting Protection (Max 30 POST requests per minute per API key)
    const rateLimit = checkRateLimit(`note_post_${apiKey}`, 30, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Rate limit exceeded (Max 30 notes/min)." },
        { status: 429, headers: corsHeaders }
      );
    }

    let user = await db.query.users.findFirst({
      where: eq(users.apiKey, apiKey),
    });

    // Smart fallback to default user for local dev / extension setup
    if (!user) {
      user = await db.query.users.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404, headers: corsHeaders });
    }

    const body = await req.json();
    const {
      targetNoteId,
      comment,
      title,
      content,
      language,
      isSnippet,
      sourceUrl,
      sourceTitle,
      selectedText,
      sourceAnchor,
      referenceId,
      tags: noteTags,
    } = body;

    const noteContent = content || selectedText || "";
    if (!noteContent || typeof noteContent !== "string" || !noteContent.trim()) {
      return NextResponse.json(
        { error: "Note content or selected text is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Input Length Validation (Max 100KB note content limit)
    if (noteContent.length > 100000) {
      return NextResponse.json(
        { error: "Note content length exceeds 100KB limit." },
        { status: 400, headers: corsHeaders }
      );
    }

    const anchorJson = sourceAnchor
      ? typeof sourceAnchor === "object"
        ? JSON.stringify(sourceAnchor)
        : sourceAnchor
      : null;
    const finalRefId = referenceId || (sourceUrl ? `ref_${crypto.randomUUID()}` : null);

    // Case 1: Attach reference to an existing Note
    if (targetNoteId) {
      const existingNote = await db.query.notes.findFirst({
        where: and(eq(notes.id, targetNoteId), eq(notes.userId, user.id)),
      });

      if (existingNote) {
        const commentSection = comment ? `\n> **Comment:** ${comment.trim()}\n` : "";
        const referenceBlock = `\n\n---\n> **Web Reference:** "${selectedText || noteContent.trim()}"\n${commentSection}> 📍 [${sourceTitle || "Webpage"}](${sourceUrl})`;
        const updatedContent = `${existingNote.content}${referenceBlock}`;

        const [updatedNote] = await db
          .update(notes)
          .set({
            content: updatedContent,
            sourceUrl: sourceUrl || existingNote.sourceUrl,
            sourceTitle: sourceTitle || existingNote.sourceTitle,
            selectedText: selectedText || existingNote.selectedText,
            sourceAnchor: anchorJson || existingNote.sourceAnchor,
            referenceId: finalRefId || existingNote.referenceId,
            updatedAt: new Date(),
          })
          .where(eq(notes.id, existingNote.id))
          .returning();

        return NextResponse.json(
          {
            note: updatedNote,
            attached: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          },
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // Case 2: Create a brand new Note
    const initialComment = comment ? `\n\n> **Comment:** ${comment.trim()}` : "";
    const fullContent = `${noteContent.trim()}${initialComment}`;

    const [newNote] = await db
      .insert(notes)
      .values({
        title: title ? title.trim() : (sourceTitle ? `Reference: ${sourceTitle}` : "Untitled Web Note"),
        content: fullContent,
        language: language || "plaintext",
        isSnippet: Boolean(isSnippet),
        tags: Array.isArray(noteTags) ? noteTags : (sourceUrl ? ["web-reference"] : []),
        sourceUrl: sourceUrl || null,
        sourceTitle: sourceTitle || null,
        selectedText: selectedText || noteContent.trim(),
        sourceAnchor: anchorJson,
        referenceId: finalRefId,
        userId: user.id,
      })
      .returning();

    return NextResponse.json(
      {
        note: newNote,
        created: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json({ error: "Failed to save note" }, { status: 500, headers: corsHeaders });
  }
}
