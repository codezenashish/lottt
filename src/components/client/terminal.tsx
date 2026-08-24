'use client'

import { useState } from 'react'
import { Terminal, Copy, Check, Command } from 'lucide-react'

interface TerminalLine {
  text: string
  type: 'command' | 'info' | 'success' | 'highlight' | 'url' | 'muted' | 'empty'
}

interface CliTabEntry {
  id: string
  label: string
  category: string
  tagline: string
  description: string
  command: string
  highlights: string[]
  filePath: string
  terminalOutput: TerminalLine[]
}

const entries: CliTabEntry[] = [
  {
    id: 'bookmarks',
    label: 'ryuk add',
    category: 'Bookmarks & Web Clipper',
    tagline: 'Instant web clipping & metadata extraction',
    description:
      'Save links directly from your terminal. Ryuk automatically parses OpenGraph tags to extract titles, descriptions, and favicons with zero manual work.',
    command: 'ryuk add https://nextjs.org/docs',
    highlights: [
      'Automatic title, description & favicon parsing',
      'Instant cloud sync to your Ryuk workspace',
      'Custom category tagging & search indexing',
    ],
    filePath: 'ryuk add <url>',
    terminalOutput: [
      { text: '$ ryuk add https://nextjs.org/docs', type: 'command' },
      { text: 'Fetching metadata for https://nextjs.org/docs...', type: 'info' },
      { text: '✔ Fetched title: "Next.js Documentation"', type: 'success' },
      { text: '✔ Detected favicon: https://nextjs.org/favicon.ico', type: 'success' },
      { text: '✔ Bookmark saved successfully!', type: 'success' },
      { text: '  Title: Next.js Documentation', type: 'muted' },
      { text: '  URL:   https://nextjs.org/docs', type: 'url' },
      { text: '', type: 'empty' },
      { text: '$ ryuk bookmark list --limit 2', type: 'command' },
      { text: '1. Next.js Documentation [Documentation]', type: 'highlight' },
      { text: '   URL: https://nextjs.org/docs', type: 'muted' },
    ],
  },
  {
    id: 'notes',
    label: 'ryuk notes',
    category: 'Notes & Code Snippets',
    tagline: 'Terminal markdown & snippet manager',
    description:
      'Capture thoughts, architecture decisions, and code snippets straight from the shell with rich terminal markdown and code syntax formatting.',
    command: 'ryuk notes add "API Architecture"',
    highlights: [
      'Terminal-rendered markdown, task lists & tables',
      'Language-tagged code snippet management',
      'Quick interactive CLI editor integration',
    ],
    filePath: 'ryuk notes add',
    terminalOutput: [
      { text: '$ ryuk notes add "API Architecture" --snippet', type: 'command' },
      { text: 'Ryuk Add Note (alex@example.com)', type: 'info' },
      { text: '? Note Title: API Architecture & Auth Flow', type: 'muted' },
      { text: '? Language: typescript', type: 'muted' },
      { text: '✔ Note saved successfully!', type: 'success' },
      { text: '  ID:    nt_982a', type: 'muted' },
      { text: '  Title: API Architecture & Auth Flow', type: 'muted' },
      { text: '', type: 'empty' },
      { text: '$ ryuk notes list', type: 'command' },
      { text: '1. API Architecture & Auth Flow [typescript]', type: 'highlight' },
      { text: '   Content: export async function verifySession(token: string)...', type: 'muted' },
    ],
  },
  {
    id: 'search',
    label: 'ryuk search',
    category: 'Interactive Fuzzy Search',
    tagline: 'Realtime search across bookmarks & notes',
    description:
      'Search across all your resources simultaneously using fuzzy matching, autocomplete suggestions, and quick actions to open links in your default browser.',
    command: 'ryuk search',
    highlights: [
      'Interactive fuzzy autocomplete with arrow navigation',
      'One-key "Open in Browser" action',
      'Unified search across titles, URLs, and notes',
    ],
    filePath: 'ryuk search',
    terminalOutput: [
      { text: '$ ryuk search', type: 'command' },
      { text: '? Search Category: Bookmarks', type: 'muted' },
      { text: '? Search Bookmarks: ❯ Next.js Documentation (https://nextjs.org/docs)', type: 'info' },
      { text: '', type: 'empty' },
      { text: 'Title:       Next.js Documentation', type: 'highlight' },
      { text: 'URL:         https://nextjs.org/docs', type: 'url' },
      { text: 'Category:    Documentation', type: 'muted' },
      { text: '', type: 'empty' },
      { text: '? Action: ❯ Open in Browser', type: 'muted' },
      { text: '✔ Opening https://nextjs.org/docs in default browser...', type: 'success' },
    ],
  },
  {
    id: 'status',
    label: 'ryuk login',
    category: 'Auth & Offline Caching',
    tagline: 'One-time authentication with smart cache',
    description:
      'Connect your terminal to your Ryuk account with an API key. Local 60-second caching ensures lightning-fast queries and smooth offline workflow.',
    command: 'ryuk login',
    highlights: [
      'Secure credentials storage in ~/.ryukrc',
      'Switch between Cloud and Local Dev seamlessly',
      'Zero-latency responses via local disk cache',
    ],
    filePath: 'ryuk status',
    terminalOutput: [
      { text: '$ ryuk status', type: 'command' },
      { text: 'Ryuk Status (alex@example.com)', type: 'info' },
      { text: 'Authenticated User: alex@example.com', type: 'success' },
      { text: 'Display Name:       Alex Developer', type: 'muted' },
      { text: 'Server URL:         https://ryuk-vert.vercel.app', type: 'muted' },
      { text: 'Config File:        ~/.ryukrc', type: 'muted' },
      { text: '✔ All bookmarks & notes synced with cloud.', type: 'success' },
    ],
  },
]

export function TerminalShowcase() {
  const [activeId, setActiveId] = useState('bookmarks')
  const [copiedType, setCopiedType] = useState<'command' | 'install' | null>(null)

  const active = entries.find((entry) => entry.id === activeId) ?? entries[0]

  async function copyText(text: string, type: 'command' | 'install') {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
      window.dispatchEvent(
        new CustomEvent('ryuk:toast', {
          detail: type === 'command' ? 'Copied command to clipboard' : 'Copied install script',
        }),
      )
    } catch {
      return
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors">
      {/* Tabs Header */}
      <div className="flex items-center overflow-x-auto border-b border-border bg-muted/40 px-3 pt-3 gap-1.5 scrollbar-none">
        {entries.map((entry) => {
          const isActive = activeId === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setActiveId(entry.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-card text-foreground border-t border-x border-border shadow-xs relative -mb-px font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <Terminal className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{entry.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid min-h-[420px] grid-cols-1 lg:grid-cols-[1.05fr_1.35fr]">
        {/* Left Panel: Feature Highlights & Actions */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-9 border-b lg:border-b-0 lg:border-r border-border gap-6 bg-card">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{active.category}</span>
            </div>

            <h3 className="font-sans text-[24px] sm:text-[28px] font-normal leading-[1.2] tracking-[-0.02em] text-foreground">
              {active.tagline}
            </h3>

            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {active.description}
            </p>

            <div className="space-y-2.5 pt-2">
              {active.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>COMMAND</span>
                <span className="text-[10px] text-muted-foreground/80">Click to copy</span>
              </div>
              <button
                type="button"
                onClick={() => copyText(active.command, 'command')}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-border bg-muted/50 hover:bg-muted hover:border-foreground/20 transition-all font-mono text-xs text-foreground group text-left cursor-pointer active:translate-y-px"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-emerald-500 font-semibold select-none">$</span>
                  <span className="truncate">{active.command}</span>
                </div>
                {copiedType === 'command' ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
              <span>One-line installer:</span>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    'curl -fsSL https://raw.githubusercontent.com/codezenashish/devnest/main/install.sh | bash',
                    'install',
                  )
                }
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-primary underline underline-offset-4 cursor-pointer"
              >
                {copiedType === 'install' ? 'Copied script!' : 'curl | bash installer'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Terminal Output Display */}
        <div className="p-4 sm:p-6 lg:p-8 bg-muted/20 flex flex-col justify-center">
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] shadow-xl overflow-hidden font-mono text-xs">
            {/* Terminal Window Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 text-zinc-400 select-none">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Command className="h-3 w-3 text-zinc-500" />
                <span>{active.filePath}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>bash</span>
              </div>
            </div>

            {/* Terminal Window Content */}
            <div className="p-4 sm:p-5 font-mono text-[12px] sm:text-[12.5px] leading-relaxed overflow-x-auto text-zinc-300 space-y-1.5">
              {active.terminalOutput.map((line, idx) => {
                if (line.type === 'empty') {
                  return <div key={idx} className="h-2" />
                }
                return (
                  <div
                    key={idx}
                    className={
                      line.type === 'command'
                        ? 'text-zinc-100 font-medium'
                        : line.type === 'success'
                          ? 'text-emerald-400 font-medium'
                          : line.type === 'info'
                            ? 'text-cyan-400'
                            : line.type === 'highlight'
                              ? 'text-amber-300 font-medium'
                              : line.type === 'url'
                                ? 'text-sky-400 underline underline-offset-2'
                                : 'text-zinc-400'
                    }
                  >
                    {line.text}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const FrameworksTabs = TerminalShowcase