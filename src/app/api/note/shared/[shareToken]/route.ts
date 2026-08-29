import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    if (!shareToken) {
      return NextResponse.json(
        { error: "Share token is required." },
        { status: 400 }
      );
    }

    const note = await db.query.notes.findFirst({
      where: and(eq(notes.shareToken, shareToken), eq(notes.isShared, true)),
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

    if (!note) {
      return NextResponse.json(
        { error: "Shared note not found or access has been revoked." },
        { status: 404 }
      );
    }

    return NextResponse.json({ note }, { status: 200 });
  } catch (error) {
    console.error("GET /api/note/shared/[shareToken] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared note." },
      { status: 500 }
    );
  }
}
