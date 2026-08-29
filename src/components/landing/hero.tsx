"use client"


import { ArrowRight } from "lucide-react";
import SVGComponent from "./svg";
import { InstallCopy } from "../client/install-copy";
import AuthModal from "../common/AuthModal";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

const stats = [
  { num: 5, label: "Themes" },
  { num: 7, label: "Frameworks" },
  { num: 0, label: "Dependencies" },
];

export function Hero() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("auth") === "required" && !isSignedIn) {
        setTimeout(() => setIsAuthOpen(true), 0);
      }
    }
  }, [isSignedIn]);

  const handleStartClick = () => {
    if (isSignedIn) {
      router.push("/bookmarks");
    } else {
      setIsAuthOpen(true);
    }
  };
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-8 pt-20 pb-30">
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <h1 className="mb-7 font-sans text-[clamp(56px,7.2vw,104px)] leading-[0.96] font-[380] tracking-[-0.035em] [&_.soft]:font-normal [&_.soft]:text-muted-foreground">
              Your ideas <span className="soft">deserve</span>
              <br />
              a unified home.
            </h1>

            <p className="mt-6 max-w-[56ch] font-sans text-[18px] leading-[1.55] text-muted-foreground">
              Ryuk is a powerful personal knowledge base built for developers. Capture bookmarks, structure your notes, and sync seamlessly across the Web, CLI, and your browser—without the chaos of switching context.
            </p>

            <div className="mt-9 flex flex-wrap items-end gap-4">
              <button
                onClick={handleStartClick}
                disabled={!isLoaded}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-foreground bg-primary px-4 py-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition hover:border-white hover:bg-white hover:text-primary-foreground active:translate-y-px cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
              <InstallCopy />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center lg:justify-end">
            <SVGComponent />
          </div>
        </div>

        <div className="mt-12 flex items-stretch gap-0 border-t border-border pt-6 max-w-xl">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`pr-8 ${index < stats.length - 1 ? "mr-8 border-r border-border" : ""}`}
            >
              <div className="font-sans text-[36px] leading-none font-normal tracking-[-0.02em]">
                {stat.num}
              </div>
              <div className="mt-2 font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
