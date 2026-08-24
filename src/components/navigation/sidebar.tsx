"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { sidebar } from "./side-config";
import SidebarTag from "./sidebar-tag";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full font-sans flex flex-col py-2">
      <nav className="flex flex-col gap-1 px-3">

        {sidebar.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  strokeWidth={1.8}
                />
                <span>{item.label}</span>
              </div>

              {item.tag && (
                <SidebarTag tag={item.tag} variant={item.tagVariant} />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}