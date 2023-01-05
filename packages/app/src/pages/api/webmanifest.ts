import { Request, Response } from 'express';
import getConfig from 'next/config';

const isProd = process.env.NODE_ENV === 'production';

export default async function handler(req: Request, res: Response): Promise<void> {
  const config = getConfig();
  const { publicRuntimeConfig } = config;
  const { apiPrefix, basePath } = publicRuntimeConfig;

  // res.set(
  //   'Cache-Control',
  //   'public, s-maxage=3600, max-age=3600, stale-while-revalidate=3600, stale-if-error=3600',
  // );
  // res.set('Content-Type', 'application/json');
  res.send({
    name: 'MicroApps Release',
    short_name: 'MicroApps',
    icons: [
      {
        src: `${isProd ? apiPrefix : basePath}/android-chrome-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${isProd ? apiPrefix : basePath}/android-chrome-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  });
}
