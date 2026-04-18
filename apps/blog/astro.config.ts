import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
// @ts-ignore -- JSON theme objects are compatible with Shiki BundledTheme shape
import illuDark from './src/shiki/illu-dark.json'
// @ts-ignore
import illuLight from './src/shiki/illu-light.json'

export default defineConfig({
  site: 'https://illulachy.me',
  base: '/blog',
  integrations: [sitemap()],
  vite: {
    plugins: [
      tailwindcss(),
      {
        // Stub /pagefind/pagefind.js during dev — file only exists after astro build
        name: 'pagefind-dev-stub',
        apply: 'serve',
        resolveId(id: string) {
          if (id === '/pagefind/pagefind.js') return '\0pagefind-stub'
        },
        load(id: string) {
          if (id === '\0pagefind-stub') return 'throw new Error("Pagefind not available in dev mode")'
        },
      },
    ],
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
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
