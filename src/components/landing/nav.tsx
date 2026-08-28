import Link from "next/link";

import { HugeiconsIcon } from "@hugeicons/react";
import { Github } from "@hugeicons/core-free-icons";
import { ModeToggle } from "../ui/theme-toggle";


const navLinks: { href: string; label: string }[] = [
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-md [-webkit-backdrop-filter:blur(10px)_saturate(140%)] [backdrop-filter:blur(10px)_saturate(140%)]">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-3 text-foreground text-2xl font-bold">
          Ryuk
          
          
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-2">
          
          <a
          href="https://github.com/codezenashish/ryuk"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-card transition"
          title="GitHub Repository"
        >
          <HugeiconsIcon size={14} icon={Github} />
          <span className="font-medium text-foreground">GitHub</span>
          <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border">
            v1.0
          </span>
        </a>
        <ModeToggle />
        </div>
      </div>
    </header>
  );
}
