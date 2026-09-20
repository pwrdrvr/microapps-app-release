import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { normalizeRules } from '@/lib/release-console/normalize-records';
import type { VersionsAndRulesRecord } from '@/lib/release-console/types';
import { RulesPanel } from './RulesPanel';
import { releaseVersions } from './test-data';

function rulesFor(
  ruleSet: Record<string, { SemVer: string; AttributeName?: string; AttributeValue?: string }>,
) {
  const record: VersionsAndRulesRecord = {
    Versions: releaseVersions().map((version) => ({
      AppName: 'release',
      SemVer: version.semVer,
      Type: version.type,
      StartupType: version.startupType,
      Status: version.status,
    })),
    Rules: { AppName: 'release', RuleSet: ruleSet },
  };

  return normalizeRules(record, ruleSet.default?.SemVer ?? null);
}

function renderPanel(
  ruleSet: Record<string, { SemVer: string; AttributeName?: string; AttributeValue?: string }> = {
    default: { SemVer: '0.5.2' },
    beta: { SemVer: '0.4.7', AttributeName: 'organization', AttributeValue: 'beta-org' },
  },
) {
  const onPickVersion = vi.fn();
  render(
    <RulesPanel
      rules={rulesFor(ruleSet)}
      versions={releaseVersions()}
      onPickVersion={onPickVersion}
    />,
  );
  return onPickVersion;
}

function ruleRow(key: string) {
  return screen.getByRole('rowheader', { name: key }).parentElement as HTMLElement;
}

describe('RulesPanel', () => {
  afterEach(() => {
    cleanup();
  });

  test('lists every rule without hunting through the version list', () => {
    renderPanel();

    expect(within(ruleRow('default')).getByText('all traffic')).toBeTruthy();
    expect(within(ruleRow('default')).getByRole('cell', { name: '0.5.2' })).toBeTruthy();
    expect(within(ruleRow('beta')).getByText('organization=beta-org')).toBeTruthy();
    expect(within(ruleRow('beta')).getByRole('cell', { name: '0.4.7' })).toBeTruthy();
  });

  test('says plainly that only the default rule is routed on', () => {
    renderPanel();

    expect(within(ruleRow('default')).getByText('live')).toBeTruthy();
    const unevaluated = within(ruleRow('beta')).getByText('not evaluated');
    expect(unevaluated.getAttribute('title')).toContain('default rule only');
  });

  test('changing the default rule version asks for confirmation instead of writing', () => {
    const onPickVersion = renderPanel();

    fireEvent.change(
      within(ruleRow('default')).getByRole('combobox', {
        name: 'Point the default rule at a version',
      }),
      { target: { value: '0.4.7' } },
    );

    expect(onPickVersion).toHaveBeenCalledWith(expect.objectContaining({ semVer: '0.4.7' }));
  });

  test('offers only versions that can serve traffic', () => {
    renderPanel();

    const options = within(ruleRow('default'))
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options).toContain('0.4.7');
    // 0.4.3 is still `integrated`, so it cannot be routed to.
    expect(options).not.toContain('0.4.3');
  });

  test('flags a rule pointing at a version that no longer exists', () => {
    renderPanel({ default: { SemVer: '0.5.2' }, beta: { SemVer: '9.9.9' } });

    expect(within(ruleRow('beta')).getByText('missing')).toBeTruthy();
  });

  test('explains an app with no rules yet', () => {
    renderPanel({});

    expect(screen.getByText(/Making a version the default creates the/)).toBeTruthy();
  });
});
