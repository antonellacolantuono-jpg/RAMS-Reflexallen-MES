import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { LocalStorage } from './index'

describe('LocalStorage', () => {
  let tmpDir: string
  let store: LocalStorage

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mes-storage-test-'))
    store = new LocalStorage(tmpDir)
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('puts and gets a file', async () => {
    const data = Buffer.from('hello storage')
    await store.put('test.txt', data)
    const retrieved = await store.get('test.txt')
    expect(retrieved.toString()).toBe('hello storage')
  })

  it('creates nested directories automatically', async () => {
    await store.put('a/b/c/file.bin', Buffer.from('nested'))
    const result = await store.get('a/b/c/file.bin')
    expect(result.toString()).toBe('nested')
  })

  it('deletes a file', async () => {
    await store.put('del.txt', Buffer.from('bye'))
    await store.delete('del.txt')
    await expect(store.get('del.txt')).rejects.toThrow()
  })

  it('lists files under a prefix', async () => {
    await store.put('uploads/img1.png', Buffer.from('a'))
    await store.put('uploads/img2.png', Buffer.from('b'))
    await store.put('uploads/sub/img3.png', Buffer.from('c'))
    const files = await store.list('uploads')
    expect(files).toHaveLength(3)
    expect(files.some((f) => f.includes('img1.png'))).toBe(true)
    expect(files.some((f) => f.includes('img2.png'))).toBe(true)
    expect(files.some((f) => f.includes('img3.png'))).toBe(true)
  })

  it('checks existence of a file', async () => {
    expect(await store.exists('missing.txt')).toBe(false)
    await store.put('present.txt', Buffer.from('x'))
    expect(await store.exists('present.txt')).toBe(true)
  })

  it('rejects path traversal attempts', async () => {
    await expect(store.put('../escape.txt', Buffer.from('bad'))).rejects.toThrow('Path traversal')
  })
})
