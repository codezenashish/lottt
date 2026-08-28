'use client'

import { useState, useEffect } from 'react'
import { Terminal } from 'lucide-react'
import { Copy, Check } from 'lucide'
import { MorphIcon } from 'morphicons/react'

const installCommands = {
  unix: 'curl -fsSL https://raw.githubusercontent.com/codezenashish/ryuk/main/install.sh | bash',
  windows: 'irm https://raw.githubusercontent.com/codezenashish/ryuk/main/install.ps1 | iex',
} as const

type OS = keyof typeof installCommands

const tabs: { id: OS; label: string }[] = [
  { id: 'unix', label: 'macOS / Linux' },
  { id: 'windows', label: 'Windows' },
]

export function InstallCopy() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<OS>('unix')

  useEffect(() => {
    if (window.navigator.userAgent.toLowerCase().includes('win')) {
      setActiveTab('windows')
    }
  }, [])

  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText(installCommands[activeTab])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      window.dispatchEvent(
        new CustomEvent('ryuk:toast', {
          detail: 'Copied command to clipboard',
        }),
      )
    } catch {
      return
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full sm:w-auto max-w-full">
      <div className="flex items-center gap-1 px-0.5" role="tablist" aria-label="Operating system selection">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={copyInstallCommand}
        title="Click to copy command"
        aria-label={`Copy install command for ${activeTab === 'unix' ? 'macOS and Linux' : 'Windows'}`}
        className="group relative inline-flex h-10 w-full sm:w-[410px] cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/60 hover:bg-muted px-3.5 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:border-foreground/25 active:translate-y-px overflow-hidden  text-left"
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <Terminal className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <code className="font-mono text-[12px] leading-none truncate block text-foreground/90 group-hover:text-foreground select-all">
            {installCommands[activeTab]}
          </code>
        </div>

        <div
          className={`flex items-center justify-center p-1 rounded-md transition-colors duration-200 shrink-0 ${
            copied
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-muted-foreground group-hover:text-foreground hover:bg-background/50'
          }`}
        >
          <MorphIcon
            icon={copied ? Check : Copy}
            size={14}
            strokeWidth={2}
            spring="snappy"
            className="shrink-0"
          />
        </div>
      </button>
    </div>
  )
}