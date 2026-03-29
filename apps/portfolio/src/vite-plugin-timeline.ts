import type { Plugin } from 'vite'
import { spawn } from 'child_process'
import chokidar from 'chokidar'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../..')
const CONTENT_GLOB = path.join(REPO_ROOT, 'packages', 'content', 'content', '**', '*.md')

export function timelinePlugin(): Plugin {
  return {
    name: 'timeline-generator',

    async buildStart() {
      console.log('[Timeline Plugin] Generating timeline.json...')
      await runGenerator()
    },

    configureServer(server) {
      const watcher = chokidar.watch(CONTENT_GLOB, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 100 }
      })

      const handleChange = async (filePath: string) => {
        console.log(`[Timeline Plugin] Content changed: ${filePath}`)
        try {
          await runGenerator()
          server.ws.send({ type: 'full-reload' })
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          server.ws.send({
            type: 'error',
            err: { message: err.message, stack: err.stack || '' }
          })
        }
      }

      watcher.on('add', handleChange)
      watcher.on('change', handleChange)
      watcher.on('unlink', handleChange)

      return () => watcher.close()
    }
  }
}

function runGenerator(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('pnpm', ['--filter', '@illu/content', 'run', 'generate-timeline'], {
      stdio: 'inherit',
      shell: true,
      cwd: REPO_ROOT
    })
    proc.on('exit', (code) => {
      code === 0 ? resolve() : reject(new Error(`Generator failed with code ${code}`))
    })
    proc.on('error', reject)
  })
}
