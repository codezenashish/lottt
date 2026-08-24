import { TerminalShowcase } from '../client/terminal'

export function CliSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-8 py-24">
        <div className="mb-16 grid grid-cols-1 items-end gap-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(25,179,133,0.18)]" />
              Ryuk CLI
            </div>
            <h2 className="mt-4.5 font-sans text-[clamp(38px,4.6vw,64px)] leading-[1.02] font-[380] tracking-[-0.028em] [&_.soft]:text-muted-foreground">
              Manage everything,
              <br />
              from your <span className="soft">terminal.</span>
            </h2>
          </div>
          <p className="max-w-[56ch] font-sans text-[18px] leading-[1.55] text-muted-foreground">
            Instant note taking, bookmarking, and code snippet management directly from your command line. Ultra-fast, scriptable, and synced everywhere.
          </p>
        </div>

        <TerminalShowcase />
      </div>
    </section>
  )
}

export const Frameworks = CliSection