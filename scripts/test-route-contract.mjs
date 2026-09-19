import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:)/, '$1'))
const srcRoot = join(root, 'src')

const walk = async (directory) => {
  const entries = await readdir(directory)
  const paths = []
  for (const entry of entries) {
    const path = join(directory, entry)
    if ((await stat(path)).isDirectory()) paths.push(...await walk(path))
    else if (/\.(?:js|jsx)$/.test(entry)) paths.push(path)
  }
  return paths
}

const appSource = await readFile(join(srcRoot, 'App.jsx'), 'utf8')
const routePatterns = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1])

const matchesRoute = (path, pattern) => {
  if (pattern === '*') return true
  const pathParts = path.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)
  if (patternParts.at(-1) === '*') {
    return patternParts.slice(0, -1).every((part, index) => part.startsWith(':') || part === pathParts[index])
  }
  return pathParts.length === patternParts.length
    && patternParts.every((part, index) => part.startsWith(':') || part === pathParts[index])
}

const missing = []
for (const file of await walk(srcRoot)) {
  const source = await readFile(file, 'utf8')
  const references = [
    ...source.matchAll(/navigate\(\s*['"](\/[^'"?#]*)/g),
    ...source.matchAll(/\bto=['"](\/[^'"?#]*)/g),
    ...source.matchAll(/\bhref=['"](\/[^'"?#]*)/g),
  ].map((match) => match[1]).filter((path) => !path.includes('${'))

  for (const path of references) {
    if (!routePatterns.some((pattern) => matchesRoute(path, pattern))) {
      missing.push(`${relative(root, file)} -> ${path}`)
    }
  }
}

if (missing.length) {
  console.error(`Static links without a matching app route:\n${missing.join('\n')}`)
  process.exit(1)
}

console.log(`Route contract passed (${routePatterns.length} registered routes).`)
