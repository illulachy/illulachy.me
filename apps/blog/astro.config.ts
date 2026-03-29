import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore -- JSON theme objects are compatible with Shiki BundledTheme shape
import illuDark from './src/shiki/illu-dark.json'
// @ts-ignore
import illuLight from './src/shiki/illu-light.json'

export default defineConfig({
  site: 'https://writing.illulachy.me',
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: illuLight,
        dark: illuDark,
      },
    },
  },
})
