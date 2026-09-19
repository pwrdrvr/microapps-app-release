import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import packageJson from '../../package.json';
import './globals.css';
import './release-console.css';

// PwrDrvr Design System type: Geist for UI, Geist Mono for versions and data.
const sans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

const appBasePath = '/release';
const appAssetPrefix = `${appBasePath}/${packageJson.version}`;
const manifestPath = `${appAssetPrefix}/static/manifest.webmanifest`;

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'MicroApps Release',
  description: 'Browse MicroApps versions and safely switch the default release.',
  manifest: manifestPath,
  icons: {
    icon: [
      { url: `${appAssetPrefix}/static/favicon.ico` },
      { url: `${appAssetPrefix}/static/favicon-16x16.png`, sizes: '16x16', type: 'image/png' },
      { url: `${appAssetPrefix}/static/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: `${appAssetPrefix}/static/apple-touch-icon.png`, sizes: '180x180' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
