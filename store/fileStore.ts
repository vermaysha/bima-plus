import { promises as fs } from 'fs'

function isObject(value: any): boolean {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

function mapObject(value: any, fn: any) {
  if (!isObject(value)) {
    return []
  }
  return Object.keys(value).map(key => fn(value[key], key))
}

function urlencode(string: string): string {
  return string.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function getHashCode(key: string): string {
  return urlencode(Buffer.from(key).toString('base64')) + '.json'
}

export class FileStore {
  constructor() {
    ;(async () => {
      try {
        await fs.stat('cache')
      } catch (e) {
        const err = e as any
        if (err.code === 'ENOENT') {
          await fs.mkdir('cache')
        }
      }
    })()
  }
  async getItem(key: string) {
    const item = (await fs.readFile('cache/' + getHashCode(key))) || null

    return JSON.parse(item?.toString())
  }

  async setItem(key: string, value: any) {
    await fs.writeFile('cache/' + getHashCode(key), JSON.stringify(value))
    return value
  }

  async removeItem(key: string) {
    await fs.unlink('cache/' + getHashCode(key))
  }

  async clear() {
    await fs.rm('cache', { recursive: true, force: true })
  }

  async length(): Promise<number> {
    const files = await fs.readdir('cache')
    return files.length
  }

  async iterate(fn: any) {
    const files = await fs.readdir('cache')
    const mapOfFiles = files.reduce(
      async (map: { [key: string]: any }, file) => {
        map[file] = await fs.readFile(file)
        return map
      },
      {}
    )

    return Promise.all(mapObject(mapOfFiles, fn))
  }
}

export default FileStore
