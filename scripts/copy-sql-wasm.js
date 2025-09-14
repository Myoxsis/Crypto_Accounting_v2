// Copies sql-wasm.wasm from node_modules to /public so sql.js can find it at runtime.
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function run() {
  const src = resolve(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm')
  const dest = resolve(__dirname, '../public/sql-wasm.wasm')
  try {
    await mkdir(resolve(__dirname, '../public'), { recursive: true })
    await copyFile(src, dest)
    console.log('[postinstall] Copied sql-wasm.wasm to public/.')
  } catch (e) {
    console.warn('[postinstall] Could not copy sql-wasm.wasm:', e.message)
  }
}
run()
