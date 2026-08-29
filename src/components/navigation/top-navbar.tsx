"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Plus,
  Upload,
  Download,
  LayoutGrid,
  List,
  Pin,
  Check,
  FileCode,
  FileText,
  Calendar,
  Search,
} from "lucide-react";
import { useBookmarkStore } from "@/store/useBookmarkStore";

export function TopNavbar() {
  const pathname = usePathname();
  const [showSearchIcon, setShowSearchIcon] = useState(false);

  const {
    bookmarks,
    filterStatus,
    setFilterStatus,
    dateRange,
    setDateRange,
    openAddModal,
    openImportModal,
    layoutMode,
    setLayoutMode,
  } = useBookmarkStore();

  useEffect(() => {
    const handleVisibility = (e: Event) => {
      const customEvent = e as CustomEvent<{ isVisible: boolean }>;
      setShowSearchIcon(!customEvent.detail.isVisible);
    };

    window.addEventListener("search-bar-visibility", handleVisibility);
    return () => {
      window.removeEventListener("search-bar-visibility", handleVisibility);
    };
  }, []);

  const getRouteTitle = (path: string) => {
    if (path.startsWith("/bookmarks")) return "Bookmarks";
    if (path.startsWith("/notes")) return "Notes";
    if (path.startsWith("/setting") || path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/leaderboard")) return "Leaderboard";
    if (path === "/dashboard" || path === "/") return "Dashboard";
    return "Workspace";
  };

  const handleQuickAdd = () => {
    if (pathname.startsWith("/notes")) {
      window.dispatchEvent(new CustomEvent("open-new-note"));
    } else {
      openAddModal(null);
    }
  };

  const handleSearchIconClick = () => {
    const el = document.getElementById("in-page-search-bar");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = el.querySelector("input");
      if (input) input.focus();
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handleExportHtml = () => {
    if (!bookmarks || bookmarks.length === 0) {
      toast.error("No bookmarks to export");
      return;
    }

    const dateNum = Math.floor(Date.now() / 1000);
    const itemsHtml = bookmarks
      .map((bm) => {
        const addDate = bm.createdAt
          ? Math.floor(new Date(bm.createdAt).getTime() / 1000)
          : dateNum;
        const faviconAttr = bm.favicon ? ` ICON="${bm.favicon}"` : "";
        return `        <DT><A HREF="${escapeHtml(bm.url)}" ADD_DATE="${addDate}"${faviconAttr}>${escapeHtml(
          bm.title || bm.url
        )}</A>${bm.description ? `\n        <DD>${escapeHtml(bm.description)}` : ""}`;
      })
      .join("\n");

    const htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Ryuk Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${dateNum}" LAST_MODIFIED="${dateNum}">Ryuk Bookmarks</H3>
    <DL><p>
${itemsHtml}
    </DL><p>
</DL><p>`;

    downloadFile(
      htmlContent,
      `ryuk-bookmarks-${new Date().toISOString().slice(0, 10)}.html`,
      "text/html"
    );
    toast.success(`Exported ${bookmarks.length} bookmarks as HTML`);
  };

  const handleExportJson = () => {
    if (!bookmarks || bookmarks.length === 0) {
      toast.error("No bookmarks to export");
      return;
    }

    const jsonContent = JSON.stringify(bookmarks, null, 2);
    downloadFile(
      jsonContent,
      `ryuk-bookmarks-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
    toast.success(`Exported ${bookmarks.length} bookmarks as JSON`);
  };

  const handleToggleLayout = (mode: "grid" | "list") => {
    setLayoutMode(mode);
    toast.info(`Layout switched to ${mode === "grid" ? "Grid" : "List"} view`);
  };

  const handleTogglePinned = () => {
    const nextStatus = filterStatus === "pinned" ? "all" : "pinned";
    setFilterStatus(nextStatus);
    toast.info(nextStatus === "pinned" ? "Filtered by Pinned bookmarks" : "Showing all bookmarks");
  };

  const handleSelectDateRange = (range: "all" | "today" | "week" | "month") => {
    setDateRange(range);
    toast.info(`Filtered bookmarks by: ${dateRangeLabels[range]}`);
  };

  const isBookmarksRoute = pathname.startsWith("/bookmarks");
  const isNotesRoute = pathname.startsWith("/notes");

  const dateRangeLabels = {
    all: "All Time",
    today: "Today",
    week: "Past Week",
    month: "Past Month",
  };

  return (
    <nav className="h-15 w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border bg-background/70 backdrop-blur-md [-webkit-backdrop-filter:blur(10px)_saturate(140%)] [backdrop-filter:blur(10px)_saturate(140%)] shrink-0 z-50">
      <div className="flex items-center gap-2">
        <span className="font-sans text-sm font-medium text-foreground tracking-tight">
          {getRouteTitle(pathname)}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <AnimatePresence mode="wait">
          {isBookmarksRoute && showSearchIcon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSearchIconClick}
                className="h-8 w-8 rounded-lg cursor-pointer transition-all duration-200"
                title="Search Bookmarks"
              >
                <Search className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-lg cursor-pointer transition-all duration-200"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={6}
            className="w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {getRouteTitle(pathname)} Actions
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {isBookmarksRoute && (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => openAddModal(null)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>Add Bookmark</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={openImportModal}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Import Bookmarks</span>
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer">
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Export Bookmarks</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48 rounded-xl border border-border bg-card p-1 shadow-xl z-50 backdrop-blur-md">
                    <DropdownMenuItem
                      onClick={handleExportHtml}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <div className="flex flex-col">
                        <span>HTML File</span>
                        <span className="text-[10px] text-muted-foreground">Browser format</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportJson}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      <FileCode className="h-3.5 w-3.5 text-primary" />
                      <div className="flex flex-col">
                        <span>JSON Backup</span>
                        <span className="text-[10px] text-muted-foreground">Raw data format</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer">
                    {layoutMode === "grid" ? (
                      <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <List className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>Layout: {layoutMode === "grid" ? "Grid" : "List"}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-40 rounded-xl border border-border bg-card p-1 shadow-xl z-50 backdrop-blur-md">
                    <DropdownMenuItem
                      onClick={() => handleToggleLayout("grid")}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        layoutMode === "grid" ? "bg-primary/10 text-primary font-semibold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span>Grid View</span>
                      </div>
                      {layoutMode === "grid" && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleLayout("list")}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        layoutMode === "list" ? "bg-primary/10 text-primary font-semibold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <List className="h-3.5 w-3.5" />
                        <span>List View</span>
                      </div>
                      {layoutMode === "list" && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleTogglePinned}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    filterStatus === "pinned" ? "bg-primary/10 text-primary font-semibold" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Pin className="h-3.5 w-3.5 text-primary" />
                    <span>Show Pinned Only</span>
                  </div>
                  {filterStatus === "pinned" && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Date: {dateRangeLabels[dateRange]}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44 rounded-xl border border-border bg-card p-1 shadow-xl z-50">
                    {(["all", "today", "week", "month"] as const).map((range) => {
                      const isSelected = dateRange === range;
                      return (
                        <DropdownMenuItem
                          key={range}
                          onClick={() => handleSelectDateRange(range)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            isSelected ? "bg-primary/10 text-primary font-semibold" : ""
                          }`}
                        >
                          <span>{dateRangeLabels[range]}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            )}

            {isNotesRoute && (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => window.dispatchEvent(new CustomEvent("open-new-note"))}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>New Note</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}

            {!isBookmarksRoute && !isNotesRoute && (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={handleQuickAdd}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>Quick Add</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

export default TopNavbar;
