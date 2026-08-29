import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, categoryCollaborators, users } from "@/db/schema";
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

    // Ensure the current user owns this category
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, user.id)),
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or you do not have permission to invite." },
        { status: 403 }
      );
    }

    // Ensure the target user exists
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

    // Ensure they aren't already a collaborator
    const existingCollaboration = await db.query.categoryCollaborators.findFirst({
      where: and(
        eq(categoryCollaborators.categoryId, id),
        eq(categoryCollaborators.userId, targetUser.id)
      ),
    });

    if (existingCollaboration) {
      return NextResponse.json(
        { error: "User is already a collaborator." },
        { status: 400 }
      );
    }

    // Insert the collaboration
    const [collaboration] = await db
      .insert(categoryCollaborators)
      .values({
        categoryId: id,
        userId: targetUser.id,
        invitedBy: user.id,
        role: assignedRole,
      })
      .returning();

    return NextResponse.json({ collaboration, targetUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/category/[id]/invite error:", error);
    return NextResponse.json(
      { error: "Failed to invite user." },
      { status: 500 }
    );
  }
}
