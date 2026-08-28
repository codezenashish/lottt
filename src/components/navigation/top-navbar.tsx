"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/auth-provider";
import { UserAvatar } from "@/components/common/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/common/search-bar";
import { ModeToggle } from "@/components/ui/theme-toggle";

import { useSearchStore } from "@/store/useSearchStore";
import { useEffect } from "react";


export function TopNavbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { query, setQuery, clearQuery } = useSearchStore();

 
  useEffect(() => {
    clearQuery();
  }, [pathname, clearQuery]);

  const userSeed =
    user?.imageUrl ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.fullName ||
    "guest@ryuk.dev";

  return (
    <nav className="h-14 w-full flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background/95 backdrop-blur-md shrink-0">
      
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
        >
          Ryuk
        </Link>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 flex justify-center">
        <SearchBar onSearch={setQuery} value={query} />
      </div>

      {/* Right: Global Actions & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        

        

        

        {!isLoaded ? (
          <Skeleton className="h-8 w-8 rounded-full bg-muted border border-border" />
        ) : (
          <div
           
            className="flex items-center gap-2 rounded-full p-0.5 border border-border bg-muted hover:bg-card transition cursor-pointer pr-2.5"
            title="Account Settings"
          >
            <UserAvatar seed={userSeed} size={28} />
            <span className="text-xs font-medium text-foreground max-w-24 truncate hidden sm:inline">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User"}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default TopNavbar;
