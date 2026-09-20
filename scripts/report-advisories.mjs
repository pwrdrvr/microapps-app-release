#!/usr/bin/env node
// Turns `pnpm audit --json` into a readable severity table, on stdout and in
// the GitHub Actions job summary.
//
// Reporting only, and deliberately so. The dependency tree carries a large
// backlog of known advisories that predates any of this work; gating merges on
// it would fail every PR for debt none of them introduced, and the first thing
// that happens to a check like that is someone turns it off. The number is here
// to be watched and driven down. What actually gates a PR is
// `actions/dependency-review-action`, which looks only at what the PR adds.
//
// Usage: pnpm audit --json > audit.json; node scripts/report-advisories.mjs audit.json

import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info'];

/** A markdown severity table for one `pnpm audit --json` report. */
export function formatAdvisoryReport(report) {
  const counts = report?.metadata?.vulnerabilities ?? {};
  const total = Object.values(counts).reduce((sum, count) => sum + (Number(count) || 0), 0);

  // Order by severity rather than by whatever order the registry replied in,
  // and keep any severity pnpm adds later rather than dropping it silently.
  const ordered = [
    ...SEVERITIES.filter((severity) => severity in counts),
    ...Object.keys(counts).filter((severity) => !SEVERITIES.includes(severity)),
  ];

  return [
    '## pnpm audit',
    '',
    total === 0
      ? 'No known advisories against the locked dependency versions.'
      : `${total} known ${total === 1 ? 'advisory' : 'advisories'} against the locked dependency versions.`,
    '',
    '| severity | advisories |',
    '| --- | --- |',
    ...ordered.map((severity) => `| ${severity} | ${counts[severity]} |`),
    '',
    'Informational. This does not gate merges — see scripts/report-advisories.mjs.',
    '',
  ].join('\n');
}

function runCli() {
  const [path = 'audit.json'] = process.argv.slice(2);

  let report;
  try {
    report = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    // A report we cannot read is a missing number, not a broken build: this
    // check is informational and must never be the reason a job fails.
    console.error(`[report-advisories] could not read ${path}: ${error.message}`);
    return;
  }

  const summary = formatAdvisoryReport(report);
  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

const isCliEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntrypoint) {
  runCli();
}
