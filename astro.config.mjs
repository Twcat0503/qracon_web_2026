// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://2026-qracon.entangletech.tw',
  base: '/2026',
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Noto Sans TC',
      cssVariable: '--font-noto-sans-tc',
      weights: ['400 900'],
      styles: ['normal'],
      fallbacks: ['PingFang TC', 'Microsoft JhengHei', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow-condensed',
      weights: [600, 800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
  ],
});
