import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark01Icon,
  Note01Icon,
  Settings02Icon
} from "@hugeicons/core-free-icons";
import { TagVariant } from "./sidebar-tag";

export interface SidebarItem {
  label: string;
  href: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  tag?: string;
  tagVariant?: TagVariant;
}

export const sidebar: SidebarItem[] = [
  {
    label: "Bookmarks",
    href: "/bookmarks",
    icon: Bookmark01Icon,
  },
  {
    label: "Notes",
    href: "/notes",
    icon: Note01Icon,
  },
  {
    label: "Setting",
    href: "/setting",
    icon: Settings02Icon,
  }
];
