import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { VersionTable } from './VersionTable';

vi.mock('./ConfirmDefaultChange', () => ({
  ConfirmDefaultChange: () => <div>Confirm change</div>,
}));

describe('VersionTable', () => {
  test('renders preview and Lambda Console links for a version row', () => {
    render(
      <VersionTable
        appName="release"
        currentDefaultVersion="0.4.7"
        versions={[
          {
            appName: 'release',
            semVer: '0.5.2',
            type: 'lambda-url',
            startupType: 'direct',
            status: 'routed',
            defaultFile: '',
            integrationId: '',
            url: 'https://example.com/version/0.5.2',
            lambdaArn: 'arn:aws:lambda:us-east-2:123456789012:function:release-prod-pr-106',
            isDefault: false,
          },
        ]}
      />,
    );

    const previewLink = screen.getByRole('link', { name: 'Preview' });
    const lambdaConsoleLink = screen.getByRole('link', { name: 'Lambda Console' });

    expect(previewLink.getAttribute('href')).toBe('/release?appver=0.5.2');
    expect(lambdaConsoleLink.getAttribute('href')).toBe(
      'https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/functions/release-prod-pr-106?tab=monitoring',
    );
  });
});
