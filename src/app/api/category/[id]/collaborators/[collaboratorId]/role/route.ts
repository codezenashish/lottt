import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, categoryCollaborators } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/syncUser";

export const dynamic = "force-dynamic";

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

    // Verify ownership of the category
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, user.id)),
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or access denied." },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(categoryCollaborators)
      .set({ role })
      .where(
        and(
          eq(categoryCollaborators.categoryId, id),
          eq(categoryCollaborators.userId, collaboratorId)
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
    console.error("PATCH /api/category/[id]/collaborators/[collaboratorId]/role error:", error);
    return NextResponse.json(
      { error: "Failed to update collaborator role." },
      { status: 500 }
    );
  }
}
