"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkItem, BookmarkCategory } from "../components/bookmark-card";
import { bookmarkSchema } from "@/lib/validations/bookmark";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { IconsPicker } from "../components/icons-picker";
import { getIconComponent } from "../utils/category-icon-registry";
import { HugeiconsIcon } from "@hugeicons/react";
import { X, Check, Globe, Sparkles, Loader2 } from "lucide-react";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    url: string;
    description?: string;
    categoryId?: string;
    categoryName?: string;
    tags: string[];
    favicon?: string;
  }) => void;
  categories: BookmarkCategory[];
  initialData?: BookmarkItem | null;
}

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function AddBookmarkModal({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData = null,
}: AddBookmarkModalProps) {
  const mounted = useIsMounted();

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <AddBookmarkForm
          key={initialData ? initialData.id : "new-bookmark"}
          onClose={onClose}
          onSave={onSave}
          categories={categories}
          initialData={initialData}
        />
      )}
    </AnimatePresence>
  );
}

function AddBookmarkForm({
  onClose,
  onSave,
  categories,
  initialData,
}: {
  onClose: () => void;
  onSave: AddBookmarkModalProps["onSave"];
  categories: BookmarkCategory[];
  initialData: BookmarkItem | null;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [favicon, setFavicon] = useState(initialData?.favicon || "");
  const [favError, setFavError] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialData?.category?.id || ""
  );
  const [categoryName, setCategoryName] = useState<string>(
    initialData?.category?.name || ""
  );
  const [categoryIcon, setCategoryIcon] = useState<string>(
    initialData?.category?.icon || "Folder01Icon"
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const addCategory = useBookmarkStore((state) => state.addCategory);

  const handleFetchMetadata = useCallback(
    async (urlToFetch?: string, signal?: AbortSignal) => {
      const targetUrl = urlToFetch || url;
      if (!targetUrl || targetUrl.trim().length < 4) return;

      let formattedUrl = targetUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      try {
        setIsFetchingMeta(true);
        const res = await fetch(
          `/api/bookmark/metadata?url=${encodeURIComponent(formattedUrl)}`,
          { signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.title && (!title || title.trim() === "")) {
            setTitle(data.title);
          }
          if (data.favicon) {
            setFavicon(data.favicon);
            setFavError(false);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error fetching metadata:", err);
      } finally {
        setIsFetchingMeta(false);
      }
    },
    [url, title]
  );

  useEffect(() => {
    if (!url || url.trim().length < 4) {
      if (!initialData?.favicon) {
        const timer = setTimeout(() => setFavicon(""), 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(() => {
      let formatted = url.trim();
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = `https://${formatted}`;
      }

      try {
        const parsed = new URL(formatted);
        const domain = parsed.hostname.replace(/^www\./, "");
        if (domain && domain.includes(".")) {
          setFavicon(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
          setFavError(false);
          handleFetchMetadata(formatted, abortController.signal);
        }
      } catch {}
    }, 550);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [url, initialData?.favicon, handleFetchMetadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    let formattedUrl = url.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const validationResult = bookmarkSchema.safeParse({
      title: title.trim(),
      url: formattedUrl,
      categoryId: selectedCategoryId,
      tags: [],
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    let finalCategoryId = selectedCategoryId;
    if (!finalCategoryId && categoryName.trim()) {
      const existing = categories.find(
        (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
      );
      if (existing) {
        finalCategoryId = existing.id;
      } else {
        const newCatId = `cat-${Date.now()}`;
        await addCategory({
          id: newCatId,
          name: categoryName.trim(),
          icon: categoryIcon,
        });
        finalCategoryId = newCatId;
      }
    }

    onSave({
      title: title.trim(),
      url: formattedUrl,
      categoryId: finalCategoryId || undefined,
      categoryName: categoryName.trim() || undefined,
      tags: [],
      favicon: favicon || undefined,
    });

    onClose();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-md p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="my-auto w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border p-6 shadow-2xl relative text-foreground scrollbar-none"
      >
        <button
          type="button"
          onClick={() => onClose()}
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer font-sans"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-sans font-semibold text-foreground mb-1">
          {initialData ? "Edit Bookmark" : "Add New Bookmark"}
        </h2>
        <p className="text-xs text-muted-foreground mb-6 font-sans">
          Save a web resource with custom title and category
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider font-mono">
              Website URL *
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex h-5 w-5 items-center justify-center">
                {favicon && !favError ? (
                  <Image
                    src={favicon}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4 object-contain rounded"
                    onError={() => setFavError(true)}
                  />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none transition ${
                  errors.url
                    ? "border-rose-500/80 focus:border-rose-500"
                    : "border-border focus:border-foreground"
                }`}
              />

              <div className="absolute right-3 flex items-center">
                {isFetchingMeta ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFetchMetadata()}
                    disabled={!url.trim()}
                    title="Auto-fetch Title"
                    className="text-muted-foreground hover:text-primary disabled:opacity-30 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {errors.url && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.url}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider font-mono">
              Bookmark Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js Documentation"
              className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none transition ${
                errors.title
                  ? "border-rose-500/80 focus:border-rose-500"
                  : "border-border focus:border-foreground"
              }`}
            />
            {errors.title && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
              Category
            </label>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("");
                    setCategoryName("");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    selectedCategoryId === "" && categoryName === ""
                      ? "bg-primary text-primary-foreground border-foreground"
                      : "bg-muted text-muted-foreground border-border hover:border-foreground"
                  }`}
                >
                  None
                </button>
                {categories.map((cat) => {
                  const CatIcon = getIconComponent(cat.icon);
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setCategoryName(cat.name);
                        if (cat.icon) setCategoryIcon(cat.icon);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-foreground"
                          : "bg-muted text-muted-foreground border-border hover:border-foreground"
                      }`}
                    >
                      <HugeiconsIcon icon={CatIcon} size={14} className="shrink-0" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setSelectedCategoryId("");
              }}
              placeholder="Category name (e.g. Design, Development, Tools)..."
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-foreground transition"
            />

            <div className="pt-1">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Category Icon
              </label>
              <IconsPicker
                selectedIcon={categoryIcon}
                onSelectIcon={(icon) => setCategoryIcon(icon)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/80 transition shadow-sm cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{initialData ? "Save Changes" : "Add Bookmark"}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default AddBookmarkModal;
