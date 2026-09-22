import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { VersionList } from './VersionList';
import { releaseVersions } from './test-data';

function renderList(onAction = vi.fn(), versions = releaseVersions()) {
  render(
    <VersionList
      appName="release"
      versions={versions}
      flashLive={false}
      targetSemVer={null}
      onAction={onAction}
    />,
  );
  return onAction;
}

function row(semVer: string) {
  return screen.getByRole('rowheader', { name: new RegExp(`^${semVer.replaceAll('.', '\\.')}`) })
    .parentElement as HTMLElement;
}

describe('VersionList', () => {
  afterEach(() => {
    cleanup();
  });

  test('hides PR builds behind the Releases lens until asked', () => {
    renderList();

    expect(screen.getByText('6 releases · 2 PR builds')).toBeTruthy();
    expect(screen.queryByText('0.0.0-pr.106')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /2 PR builds hidden/ }));

    expect(screen.getByText('0.0.0-pr.106')).toBeTruthy();
    expect(screen.getByRole('button', { name: /All/ }).getAttribute('aria-pressed')).toBe('true');
  });

  test('names each action by the direction it moves the app', () => {
    renderList();

    expect(within(row('0.5.3')).getByRole('button', { name: 'Promote 0.5.3' })).toBeTruthy();
    expect(within(row('0.5.3')).getByText('+1 newer')).toBeTruthy();
    expect(within(row('0.4.5')).getByRole('button', { name: 'Roll back 0.4.5' })).toBeTruthy();
    expect(within(row('0.4.5')).getByText('−2 back')).toBeTruthy();
    expect(
      within(row('0.5.2')).queryByRole('button', { name: /^(Promote|Roll back|Make default)/ }),
    ).toBeNull();
    expect(within(row('0.5.2')).getByText('LIVE')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /All/ }));
    expect(
      within(row('0.0.0-pr.106')).getByRole('button', { name: 'Make default 0.0.0-pr.106' }),
    ).toBeTruthy();
  });

  test('opens the confirm step for a routed version', () => {
    const onAction = renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Roll back 0.4.7' }));

    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ semVer: '0.4.7' }));
  });

  test('will not offer a version that cannot serve traffic yet', () => {
    const onAction = renderList();
    const button = screen.getByRole('button', { name: 'Roll back 0.4.3' });

    fireEvent.click(button);

    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('title')).toBe('0.4.3 is integrated and cannot serve traffic yet');
    expect(onAction).not.toHaveBeenCalled();
  });

  test('links each row to its ?appver preview and Lambda console', () => {
    renderList();

    expect(screen.getByRole('link', { name: 'Preview 0.4.7' }).getAttribute('href')).toBe(
      '/release?appver=0.4.7',
    );
    expect(
      screen.getByRole('link', { name: 'Open 0.4.7 in the Lambda console' }).getAttribute('href'),
    ).toBe(
      'https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/functions/release:v0_4_7?tab=monitoring',
    );
  });

  test('marks a route change against the live version', () => {
    renderList();

    expect(within(row('0.2.4')).getByText('lambda-url · iframe').tagName).toBe('EM');
    expect(within(row('0.4.7')).getByText('lambda-url · direct').tagName).toBe('SPAN');
  });

  test('keeps a live prerelease visible under the Releases lens', () => {
    renderList(vi.fn(), releaseVersions('0.0.0-pr.106'));

    expect(screen.getByText('0.0.0-pr.106')).toBeTruthy();
    expect(screen.getByRole('button', { name: /1 PR build hidden/ })).toBeTruthy();
  });
});
