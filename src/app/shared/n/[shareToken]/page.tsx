import { notFound } from "next/navigation";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { FileText, Copy, Code, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SharedNotePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  if (!shareToken) {
    notFound();
  }

  const sharedNote = await db.query.notes.findFirst({
    where: and(eq(notes.shareToken, shareToken), eq(notes.isShared, true)),
    with: {
      user: {
        columns: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!sharedNote) {
    notFound();
  }

  const authorName = sharedNote.user?.name || sharedNote.user?.email || "Someone";
  const formattedDate = sharedNote.createdAt
    ? new Date(sharedNote.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-sans text-lg font-bold tracking-tight text-foreground hover:text-muted-foreground transition">
            Ryuk
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-muted-foreground">Shared Note</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition shadow-sm"
        >
          Create your own
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Title & Metadata */}
          <div className="space-y-4 border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              {sharedNote.isSnippet && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono">
                  <Code className="w-3.5 h-3.5" />
                  Code Snippet ({sharedNote.language || "plaintext"})
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground font-mono">
                <FileText className="w-3.5 h-3.5" />
                Note
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {sharedNote.title || "Untitled Note"}
            </h1>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Shared by <strong className="text-foreground font-semibold">{authorName}</strong></span>
              {formattedDate && <span>• {formattedDate}</span>}
            </div>
          </div>

          {/* Note Content */}
          <div className="p-6 md:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-4 relative">
            {sharedNote.tags && sharedNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {sharedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono border border-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-invert max-w-none text-foreground font-sans text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {sharedNote.content}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
