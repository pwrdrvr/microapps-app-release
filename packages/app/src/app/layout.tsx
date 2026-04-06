import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import packageJson from '../../package.json';
import './globals.css';

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

const sans = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '700'],
});

const appBasePath = '/release';
const appAssetPrefix = `${appBasePath}/${packageJson.version}`;
const manifestPath = `${appAssetPrefix}/static/manifest.webmanifest`;

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
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
