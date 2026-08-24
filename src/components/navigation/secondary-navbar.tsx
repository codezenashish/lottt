"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { useCategoriesQuery } from "@/features/bookmarks/hooks/use-bookmark-queries";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  ChevronDown,
  Bookmark,
  FileText,
  LayoutDashboard,
  Settings,
  Plus,
  LayoutGrid,
  List,
  Upload,
  RotateCcw,
  Sparkles,
  Trophy,
  Folder,
  SlidersHorizontal,
} from "lucide-react";

const SECTIONS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Settings", href: "/setting", icon: Settings },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

export function SecondaryNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: queryCategories } = useCategoriesQuery();

  const {
    layoutMode,
    setLayoutMode,
    openAddModal,
    openImportModal,
    bookmarks,
    categories: storeCategories,
    selectedCategoryId,
    setSelectedCategory,
  } = useBookmarkStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSection =
    SECTIONS.find((s) => pathname.startsWith(s.href)) ||
    (pathname === "/" ? SECTIONS[0] : { name: "Workspace", href: pathname, icon: Sparkles });

  const SectionIcon = currentSection.icon;

  const isBookmarksRoute = pathname.startsWith("/bookmarks");
  const isNotesRoute = pathname.startsWith("/notes");
  const isDashboardRoute = pathname === "/dashboard" || pathname === "/";
  const isSettingsRoute = pathname.startsWith("/setting");

  const currentCategoryId =
    typeof selectedCategoryId === "string"
      ? selectedCategoryId
      : (selectedCategoryId as { id?: string } | null)?.id || null;

  const fetchedCategories = queryCategories || storeCategories;

  const realCategories = useMemo(() => {
    const dbCats = (fetchedCategories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || "#10b981",
      icon: cat.icon,
    }));

    const extraCatsFromBookmarks: Array<{ id: string; name: string; color: string; icon?: string }> = [];
    bookmarks.forEach((b) => {
      const catName = typeof b.category === "string" ? b.category : b.category?.name;
      const catId = b.categoryId || (typeof b.category === "object" ? b.category?.id : null) || catName;
      if (catName && !dbCats.some((c) => c.id === catId || c.name === catName)) {
        if (!extraCatsFromBookmarks.some((c) => c.name === catName)) {
          extraCatsFromBookmarks.push({
            id: catId || catName,
            name: catName,
            color: "#10b981",
          });
        }
      }
    });

    return [...dbCats, ...extraCatsFromBookmarks];
  }, [fetchedCategories, bookmarks]);

  const activeCategoryObj = realCategories.find((c) => c.id === currentCategoryId);

  return (
    <nav className="h-11 w-full flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b border-border bg-card/60 backdrop-blur-md shrink-0 text-xs select-none">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative" ref={dropdownRef}>
          <ButtonGroup>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="h-7 text-xs font-semibold gap-1.5 sm:gap-2 border-border bg-background"
            >
              <span className="flex items-center justify-center h-4 w-4 rounded bg-primary/10 text-primary">
                <SectionIcon className="h-3.5 w-3.5" />
              </span>
              <span>{currentSection.name}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </ButtonGroup>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 rounded-xl border border-border bg-card p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
                Switch Section
              </div>
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = pathname.startsWith(sec.href);
                return (
                  <button
                    key={sec.href}
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push(sec.href);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{sec.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        <div className="flex items-center gap-2">
          {isBookmarksRoute && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{bookmarks.length} Bookmarks</span>
            </span>
          )}
          {isNotesRoute && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span>Notes</span>
            </span>
          )}
          {isDashboardRoute && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Overview</span>
            </span>
          )}
          {isSettingsRoute && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span>Preferences</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:flex items-center gap-2">
          {isBookmarksRoute && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-border bg-background shadow-2xs gap-1.5 px-2.5 font-medium cursor-pointer"
                    >
                      <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-28">
                        {currentCategoryId ? activeCategoryObj?.name || currentCategoryId : "All Categories"}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-0.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={6}
                  className="w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Bookmark Categories
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setSelectedCategory(null)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        currentCategoryId === null
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>All Categories</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">{bookmarks.length}</span>
                    </DropdownMenuItem>

                    {realCategories.length > 0 && <DropdownMenuSeparator />}

                    <div className="max-h-48 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-0.5">
                      {realCategories.map((cat) => {
                        const isSelected = currentCategoryId === cat.id;
                        const count = bookmarks.filter((b) => {
                          const bCat = typeof b.category === "string" ? b.category : b.category?.name;
                          return bCat === cat.id || b.categoryId === cat.id || bCat === cat.name;
                        }).length;

                        return (
                          <DropdownMenuItem
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {cat.icon ? (
                                <span className="text-xs">{cat.icon}</span>
                              ) : (
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: cat.color || "var(--primary)" }}
                                />
                              )}
                              <span className="truncate">{cat.name}</span>
                            </div>
                            {count > 0 && (
                              <span className="font-mono text-[10px] text-muted-foreground ml-2">
                                {count}
                              </span>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <ButtonGroup>
                <Button
                  variant={layoutMode === "grid" ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setLayoutMode("grid")}
                  title="Grid View"
                  className="h-7 w-7"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={layoutMode === "list" ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setLayoutMode("list")}
                  title="List View"
                  className="h-7 w-7"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </ButtonGroup>

              <ButtonGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openImportModal}
                  className="h-7 text-xs gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openAddModal(null)}
                  className="h-7 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Bookmark</span>
                </Button>
              </ButtonGroup>
            </>
          )}

          {isNotesRoute && (
            <ButtonGroup>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-new-note"));
                }}
                className="h-7 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Note</span>
              </Button>
            </ButtonGroup>
          )}

          {isDashboardRoute && (
            <ButtonGroup>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.refresh()}
                className="h-7 text-xs gap-1.5"
                title="Refresh Dashboard"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Sync</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openAddModal(null)}
                className="h-7 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Quick Action</span>
              </Button>
            </ButtonGroup>
          )}

          {isSettingsRoute && (
            <ButtonGroup>
              <ButtonGroupText className="h-7 text-[11px] font-mono text-muted-foreground py-0">
                Account v1.0
              </ButtonGroupText>
            </ButtonGroup>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1.5">
          {isBookmarksRoute && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => openAddModal(null)}
                className="h-7 text-xs gap-1 px-2.5 font-medium cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>

              <Drawer showSwipeHandle>
                <DrawerTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-border bg-background shadow-2xs gap-1 px-2.5 font-medium cursor-pointer"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>More</span>
                    </Button>
                  }
                />
                <DrawerContent className="p-4 bg-card border-t border-border rounded-t-2xl max-h-[85vh] flex flex-col">
                  <DrawerHeader className="text-left px-0 pb-3">
                    <DrawerTitle className="text-sm font-semibold">Bookmark Tools & Categories</DrawerTitle>
                    <DrawerDescription className="text-xs text-muted-foreground">
                      Filter bookmarks by category or switch layout mode.
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className="flex-1 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden space-y-4 py-2">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        Filter Category
                      </div>
                      <div className="flex flex-col gap-1">
                        <DrawerClose
                          render={
                            <button
                              type="button"
                              onClick={() => setSelectedCategory(null)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                                currentCategoryId === null
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-muted-foreground" />
                                <span>All Categories</span>
                              </div>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {bookmarks.length}
                              </span>
                            </button>
                          }
                        />
                        {realCategories.map((cat) => {
                          const isSelected = currentCategoryId === cat.id;
                          const count = bookmarks.filter((b) => {
                            const bCat = typeof b.category === "string" ? b.category : b.category?.name;
                            return bCat === cat.id || b.categoryId === cat.id || bCat === cat.name;
                          }).length;

                          return (
                            <DrawerClose
                              key={cat.id}
                              render={
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategory(cat.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                                    isSelected
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {cat.icon ? (
                                      <span className="text-sm">{cat.icon}</span>
                                    ) : (
                                      <span
                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: cat.color || "var(--primary)" }}
                                      />
                                    )}
                                    <span className="truncate">{cat.name}</span>
                                  </div>
                                  {count > 0 && (
                                    <span className="font-mono text-[11px] text-muted-foreground ml-2">
                                      {count}
                                    </span>
                                  )}
                                </button>
                              }
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border space-y-3">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Tools & Actions
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-foreground">View Mode</span>
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setLayoutMode("grid")}
                            className={`p-1.5 rounded-md transition cursor-pointer ${
                              layoutMode === "grid"
                                ? "bg-background text-foreground shadow-2xs font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLayoutMode("list")}
                            className={`p-1.5 rounded-md transition cursor-pointer ${
                              layoutMode === "list"
                                ? "bg-background text-foreground shadow-2xs font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            <List className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <DrawerClose
                        render={
                          <button
                            type="button"
                            onClick={openImportModal}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border border-border bg-background hover:bg-muted transition cursor-pointer"
                          >
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span>Import Bookmarks</span>
                          </button>
                        }
                      />
                    </div>
                  </div>

                  <DrawerFooter className="px-0 pt-3 border-t border-border">
                    <DrawerClose
                      render={
                        <Button variant="outline" size="sm" className="w-full h-9 text-xs cursor-pointer">
                          Done
                        </Button>
                      }
                    />
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </>
          )}

          {isNotesRoute && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-new-note"));
              }}
              className="h-7 text-xs gap-1 px-2.5 font-medium cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Note</span>
            </Button>
          )}

          {isDashboardRoute && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => router.refresh()}
                className="h-7 w-7 border-border bg-background shadow-2xs cursor-pointer"
                title="Sync"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => openAddModal(null)}
                className="h-7 text-xs gap-1 px-2.5 font-medium cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Action</span>
              </Button>
            </div>
          )}

          {isSettingsRoute && (
            <ButtonGroupText className="h-7 text-[11px] font-mono text-muted-foreground py-0">
              v1.0
            </ButtonGroupText>
          )}
        </div>
      </div>
    </nav>
  );
}

export default SecondaryNavbar;
