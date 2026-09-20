import assert from 'node:assert/strict';
import test from 'node:test';

import { formatAdvisoryReport } from './report-advisories.mjs';

test('severities are ordered worst first, not in registry reply order', () => {
  const summary = formatAdvisoryReport({
    metadata: { vulnerabilities: { low: 26, critical: 13, info: 0, high: 98, moderate: 65 } },
  });

  const order = summary
    .split('\n')
    .filter((line) => line.startsWith('| ') && !line.startsWith('| severity') && !line.startsWith('| ---'))
    .map((line) => line.split('|')[1].trim());

  assert.deepEqual(order, ['critical', 'high', 'moderate', 'low', 'info']);
  assert.match(summary, /202 known advisories/);
});

test('an unknown severity is reported rather than silently dropped', () => {
  const summary = formatAdvisoryReport({
    metadata: { vulnerabilities: { critical: 1, apocalyptic: 2 } },
  });

  assert.match(summary, /\| apocalyptic \| 2 \|/);
  assert.match(summary, /3 known advisories/);
});

test('a clean tree reads as clean, and a single advisory is singular', () => {
  assert.match(
    formatAdvisoryReport({ metadata: { vulnerabilities: { critical: 0, low: 0 } } }),
    /No known advisories/,
  );
  assert.match(
    formatAdvisoryReport({ metadata: { vulnerabilities: { high: 1 } } }),
    /1 known advisory against/,
  );
});

test('a report with no metadata does not throw', () => {
  assert.match(formatAdvisoryReport({}), /No known advisories/);
  assert.match(formatAdvisoryReport(undefined), /No known advisories/);
});
