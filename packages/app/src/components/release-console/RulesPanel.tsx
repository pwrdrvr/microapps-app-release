'use client';

import type { ReleaseConsoleRule, ReleaseConsoleVersion } from '@/lib/release-console/types';
import { cn } from '@/lib/utils';

// The MicroApps router reads RuleSet.default.SemVer and nothing else: attribute rules are
// stored but never evaluated. Saying so here beats letting an operator assume otherwise.
const UNEVALUATED_TITLE =
  'Stored, but not evaluated: the MicroApps router routes on the default rule only.';

function matchLabel(rule: ReleaseConsoleRule) {
  if (rule.isDefault) {
    return 'all traffic';
  }

  return rule.attributeName ? `${rule.attributeName}=${rule.attributeValue}` : null;
}

export function RulesPanel({
  rules,
  versions,
  onPickVersion,
}: {
  rules: ReleaseConsoleRule[];
  versions: ReleaseConsoleVersion[];
  onPickVersion: (version: ReleaseConsoleVersion) => void;
}) {
  const hasUnevaluatedRules = rules.some((rule) => !rule.isDefault);
  const promotable = versions.filter((version) => version.promotable);

  return (
    <section className="rc-rules" aria-labelledby="rc-rules-heading">
      <div className="rc-bar">
        <div className="rc-bar-l">
          <span className="rc-eyebrow" id="rc-rules-heading">
            Rules
          </span>
          <span className="rc-count">
            {rules.length === 0
              ? 'none'
              : `${rules.length} ${rules.length === 1 ? 'rule' : 'rules'}`}
          </span>
        </div>
        {hasUnevaluatedRules ? (
          <span className="rc-count" title={UNEVALUATED_TITLE}>
            the router routes on the default rule only
          </span>
        ) : null}
      </div>

      <div className="rc-table rc-rules-table" role="table" aria-label="Routing rules">
        <div role="row" className="rc-rule-tr rc-th">
          <span role="columnheader">Key</span>
          <span role="columnheader">Match</span>
          <span role="columnheader">Version</span>
          <span role="columnheader">State</span>
          <span role="columnheader">
            <span className="sr-only">Actions</span>
          </span>
        </div>

        {rules.map((rule) => {
          const match = matchLabel(rule);

          return (
            <div
              role="row"
              key={rule.key}
              className={cn('rc-rule-tr', rule.isDefault && 'is-live')}
            >
              <span role="rowheader" className="rc-rule-key">
                {rule.key}
              </span>
              <span
                role="cell"
                className={cn('rc-rule-match', match === null && 'is-empty')}
                // The cell ellipsizes at narrow widths; the title keeps the full match readable.
                title={match ?? undefined}
              >
                {match ?? '—'}
              </span>
              <span role="cell" className={cn('rc-ver', rule.isDangling && 'is-dangling')}>
                {rule.semVer}
                {rule.isDangling ? (
                  <span
                    className="rc-rule-warn"
                    title={`No version record exists for ${rule.semVer}`}
                  >
                    {' '}
                    missing
                  </span>
                ) : null}
              </span>
              <span role="cell">
                {rule.isDefault ? (
                  <span className="rc-status rc-rule-live">
                    <span className="rc-dot" />
                    live
                  </span>
                ) : (
                  <span className="rc-rule-off" title={UNEVALUATED_TITLE}>
                    not evaluated
                  </span>
                )}
              </span>
              <span role="cell" className="rc-rule-act">
                {rule.isDefault ? (
                  <label className="rc-rule-pick">
                    <span className="sr-only">Point the default rule at a version</span>
                    <select
                      value={rule.semVer}
                      onChange={(event) => {
                        const next = promotable.find(
                          (version) => version.semVer === event.target.value,
                        );
                        if (next) {
                          onPickVersion(next);
                        }
                      }}
                    >
                      {promotable.some((version) => version.semVer === rule.semVer) ? null : (
                        <option value={rule.semVer}>{rule.semVer}</option>
                      )}
                      {promotable.map((version) => (
                        <option key={version.semVer} value={version.semVer}>
                          {version.semVer}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </span>
            </div>
          );
        })}

        {rules.length === 0 ? (
          <div role="row">
            <div role="cell" className="rc-none">
              No rules yet. Making a version the default creates the <code>default</code> rule.
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
