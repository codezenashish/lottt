import {
  pgTable,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// USERS TABLE (Synced with Supabase Auth ID)
// ==========================================
export const users = pgTable("user", {
  id: text("id").primaryKey(), // Stores Supabase Auth UUID (e.g., auth.uid())
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  apiKey: text("apiKey").unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ==========================================
// CATEGORIES TABLE
// ==========================================
export const categories = pgTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    color: text("color").default("#6366F1").notNull(),
    icon: text("icon").default("RiFolder5Line").notNull(),
    isShared: boolean("isShared").default(false).notNull(),
    shareToken: text("shareToken").unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("category_user_id_idx").on(table.userId),
    index("category_user_id_name_idx").on(table.userId, table.name),
    index("category_share_token_idx").on(table.shareToken),
  ]
);

// ==========================================
// CATEGORY COLLABORATORS TABLE
// ==========================================
export const categoryCollaborators = pgTable(
  "category_collaborator",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    categoryId: text("categoryId")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedBy: text("invitedBy")
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("category_collaborator_unique_idx").on(table.categoryId, table.userId),
    index("category_collaborator_user_id_idx").on(table.userId),
  ]
);

// ==========================================
// BOOKMARKS TABLE
// ==========================================
export const bookmarks = pgTable(
  "bookmark",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    favicon: text("favicon"),
    isPinned: boolean("isPinned").default(false).notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("bookmark_user_id_idx").on(table.userId),
    index("bookmark_category_id_idx").on(table.categoryId),
  ]
);

// ==========================================
// TAGS TABLE
// ==========================================
export const tags = pgTable(
  "tag",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tag_name_user_id_key").on(table.name, table.userId),
    index("tag_user_id_idx").on(table.userId),
  ]
);

// ==========================================
// FOLDERS TABLE
// ==========================================
export const folders = pgTable(
  "folder",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    color: text("color").default("#6366F1").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("folder_user_id_idx").on(table.userId),
  ]
);

// ==========================================
// NOTES TABLE
// ==========================================
export const notes = pgTable(
  "note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").default("Untitled Note").notNull(),
    content: text("content").notNull(),
    language: text("language").default("plaintext"),
    isSnippet: boolean("isSnippet").default(false).notNull(),
    isBookmarked: boolean("isBookmarked").default(false).notNull(),
    isPinned: boolean("isPinned").default(false).notNull(),
    folderId: text("folderId").references(() => folders.id, { onDelete: "set null" }),
    tags: text("tags").array().default([]).notNull(),
    sourceUrl: text("sourceUrl"),
    sourceTitle: text("sourceTitle"),
    selectedText: text("selectedText"),
    sourceAnchor: text("sourceAnchor"),
    referenceId: text("referenceId"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("note_user_id_idx").on(table.userId),
    index("note_user_pinned_bookmark_folder_idx").on(table.userId, table.isPinned, table.isBookmarked, table.folderId)
  ]
);

// ==========================================
// NOTE VERSIONS TABLE
// ==========================================
export const noteVersions = pgTable(
  "note_version",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    noteId: text("noteId")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    language: text("language").default("plaintext"),
    isSnippet: boolean("isSnippet").default(false).notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("note_version_note_id_idx").on(table.noteId),
    index("note_version_user_id_idx").on(table.userId),
  ]
);

// ==========================================
// DRIZZLE RELATIONS
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
  categories: many(categories),
  categoryCollaborations: many(categoryCollaborators),
  tags: many(tags),
  notes: many(notes),
  folders: many(folders),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  bookmarks: many(bookmarks),
  collaborators: many(categoryCollaborators),
}));

export const categoryCollaboratorsRelations = relations(categoryCollaborators, ({ one }) => ({
  category: one(categories, {
    fields: [categoryCollaborators.categoryId],
    references: [categories.id],
  }),
  user: one(users, {
    fields: [categoryCollaborators.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [categoryCollaborators.invitedBy],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [bookmarks.categoryId],
    references: [categories.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [notes.folderId],
    references: [folders.id],
  }),
  versions: many(noteVersions),
}));

export const noteVersionsRelations = relations(noteVersions, ({ one }) => ({
  note: one(notes, {
    fields: [noteVersions.noteId],
    references: [notes.id],
  }),
  user: one(users, {
    fields: [noteVersions.userId],
    references: [users.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  notes: many(notes),
}));
