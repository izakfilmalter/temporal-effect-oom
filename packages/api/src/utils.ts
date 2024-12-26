// utils/dirname.ts
import path from 'path'
import { fileURLToPath } from 'url'

export const getDirname = (metaUrl: string) => {
  const __filename = fileURLToPath(metaUrl)
  return path.dirname(__filename)
}
