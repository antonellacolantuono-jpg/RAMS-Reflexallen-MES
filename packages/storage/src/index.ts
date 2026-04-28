import fs from 'node:fs/promises'
import path from 'node:path'

export class LocalStorage {
  private basePath: string

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath)
  }

  private resolvePath(key: string): string {
    const resolved = path.resolve(this.basePath, key)
    if (!resolved.startsWith(this.basePath)) {
      throw new Error('Path traversal detected')
    }
    return resolved
  }

  async put(key: string, data: Buffer | Uint8Array): Promise<void> {
    const filePath = this.resolvePath(key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, data)
  }

  async get(key: string): Promise<Buffer> {
    const filePath = this.resolvePath(key)
    return fs.readFile(filePath)
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key)
    await fs.unlink(filePath)
  }

  async list(prefix = ''): Promise<string[]> {
    const dirPath = this.resolvePath(prefix || '.')
    const entries = await fs.readdir(dirPath, { recursive: true, withFileTypes: true })
    return entries
      .filter((e) => e.isFile())
      .map((e) => {
        const fullPath = path.join(e.parentPath ?? e.path, e.name)
        return path.relative(this.basePath, fullPath).replace(/\\/g, '/')
      })
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(key))
      return true
    } catch {
      return false
    }
  }
}

const storagePath = process.env['STORAGE_LOCAL_PATH'] ?? './uploads'

export const storage = new LocalStorage(storagePath)
export default storage
