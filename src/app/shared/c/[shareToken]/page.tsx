import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BookmarkCard, BookmarkItem } from "@/features/bookmarks/components/bookmark-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SharedCategoryPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  if (!shareToken) {
    notFound();
  }

  // Find the category by shareToken
  const sharedCategory = await db.query.categories.findFirst({
    where: and(eq(categories.shareToken, shareToken), eq(categories.isShared, true)),
    with: {
      user: {
        columns: {
          name: true,
          email: true,
          image: true,
        },
      },
      bookmarks: {
        with: {
          category: true,
        }
      },
    },
  });

  if (!sharedCategory) {
    notFound();
  }

  const ownerName = sharedCategory.user?.name || sharedCategory.user?.email || "Someone";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-24">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-sans text-lg font-bold tracking-tight text-foreground hover:text-muted-foreground transition">
            Ryuk
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-muted-foreground">Shared Category</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition shadow-xs"
        >
          Create your own
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        {/* Category Info */}
        <div className="flex flex-col items-center text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-foreground">
              {sharedCategory.name}
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              A curated collection by <span className="font-semibold text-foreground">{ownerName}</span>
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm text-muted-foreground font-mono">
            {sharedCategory.bookmarks.length} Bookmarks
          </div>
        </div>

        {/* Bookmarks Grid */}
        {sharedCategory.bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-150">
            {sharedCategory.bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="pointer-events-auto">
                <BookmarkCard
                  bookmark={bookmark as unknown as BookmarkItem}
                  layoutMode="grid"
                  // We omit edit/delete actions so they are read-only
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-border rounded-3xl bg-card">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">It&apos;s empty here!</h3>
            <p className="text-muted-foreground">There are no bookmarks in this category yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
