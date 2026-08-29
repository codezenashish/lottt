"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Bookmark,
  FileText,
  LayoutDashboard,
  Settings,
  Plus,
  Upload,
  Sun,
  Moon,
  Trophy,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { bookmarks, openAddModal, openImportModal } = useBookmarkStore();

  // Listen for ⌘K or Ctrl+K and custom trigger events
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        // Prevent default if not typing in an input
        const isInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);
        if (e.key === "/" && isInput) return;

        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleOpen = () => setOpen(true);

    window.addEventListener("keydown", down);
    window.addEventListener("open-command-menu", handleOpen);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("open-command-menu", handleOpen);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const toggleTheme = () => {
    const current = theme === "system" ? resolvedTheme : theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search bookmarks..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">

          <CommandItem onSelect={() => runCommand(() => router.push("/bookmarks"))}>
            <Bookmark className="h-4 w-4 mr-2 text-emerald-500" />
            <span>Bookmarks</span>
            <CommandShortcut>↵</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/notes"))}>
            <FileText className="h-4 w-4 mr-2 text-indigo-500" />
            <span>Notes & Documents</span>
            <CommandShortcut>↵</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/setting"))}>
            <Settings className="h-4 w-4 mr-2 text-purple-500" />
            <span>Settings</span>
            <CommandShortcut>↵</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/leaderboard"))}>
            <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
            <span>Leaderboard</span>
            <CommandShortcut>↵</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions Group */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => openAddModal(null))}>
            <Plus className="h-4 w-4 mr-2 text-primary" />
            <span>Add New Bookmark</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => openImportModal())}>
            <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Import Bookmarks</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/notes");
                setTimeout(() => window.dispatchEvent(new CustomEvent("open-new-note")), 100);
              })
            }
          >
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Create New Note</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(toggleTheme)}>
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 mr-2 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 mr-2 text-blue-400" />
            )}
            <span>Toggle Theme ({resolvedTheme === "dark" ? "Light" : "Dark"})</span>
          </CommandItem>
        </CommandGroup>

        {/* Bookmarks Search Group */}
        {bookmarks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Saved Bookmarks">
              {bookmarks.slice(0, 8).map((bm) => (
                <CommandItem
                  key={bm.id}
                  onSelect={() =>
                    runCommand(() => {
                      if (bm.url) window.open(bm.url, "_blank");
                    })
                  }
                >
                  <Sparkles className="h-4 w-4 mr-2 text-emerald-400 shrink-0" />
                  <span className="truncate flex-1">{bm.title}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-60 ml-2" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandMenu;
