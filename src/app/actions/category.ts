"use server";

import { db } from "@/db";
import { categories, bookmarks, categoryCollaborators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateDbUser } from "@/lib/syncUser";

export async function deleteCategoryAction(
  categoryId: string,
  deleteBookmarks: boolean = false
) {
  const user = await getOrCreateDbUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Verify the user owns the category
  const existingCat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!existingCat) throw new Error("Category not found");
  if (existingCat.userId !== user.id) throw new Error("Unauthorized to delete this category");

  // 2. Either delete all bookmarks or uncategorize them
  if (deleteBookmarks) {
    await db.delete(bookmarks).where(eq(bookmarks.categoryId, categoryId));
  } else {
    await db
      .update(bookmarks)
      .set({ categoryId: null })
      .where(eq(bookmarks.categoryId, categoryId));
  }

  // 3. Delete all collaborators for this category
  await db.delete(categoryCollaborators).where(eq(categoryCollaborators.categoryId, categoryId));

  // 4. Delete the category itself
  await db.delete(categories).where(eq(categories.id, categoryId));

  return true;
}

export async function updateCategoryAction(categoryId: string, name: string) {
  const user = await getOrCreateDbUser();
  if (!user) throw new Error("Unauthorized");

  const existingCat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!existingCat) throw new Error("Category not found");
  if (existingCat.userId !== user.id) throw new Error("Unauthorized to edit this category");

  const [updated] = await db
    .update(categories)
    .set({ name: name.trim() })
    .where(eq(categories.id, categoryId))
    .returning();

  return updated;
}
