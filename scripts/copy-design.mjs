import { cp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await cp(path.join(root, 'design'), path.join(root, 'dist', 'design'), {
  recursive: true,
})

console.log('Copied the static design reference to dist/design')
