import type { ReleaseConsoleRule } from '@/lib/release-console/types';
import { Badge } from '@/components/ui/badge';

export function RulePanel({ rules }: { rules: ReleaseConsoleRule[] }) {
  return (
    <div className="panel-surface h-full p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="panel-label">Rules</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Routing decisions</h2>
        </div>
        <div className="data-chip">{rules.length} rules</div>
      </div>

      <div className="mt-5 grid gap-3">
        {rules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-panelAlt/55 px-4 py-6 text-sm text-muted">
            No rules exist for this app yet.
          </div>
        ) : null}

        {rules.map((rule) => (
          <div key={rule.key} className="rounded-2xl border border-border/80 bg-panelAlt/65 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm uppercase tracking-[0.24em] text-foreground">
                  {rule.key}
                </p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {rule.attributeName || 'no attribute'} {rule.attributeValue || ''}
                </p>
              </div>
              {rule.isDefault ? <Badge variant="accent">Default</Badge> : null}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="panel-label">Version</p>
              <p className="font-mono text-sm text-accent">{rule.semVer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
