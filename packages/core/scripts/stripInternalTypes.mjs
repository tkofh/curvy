#!/usr/bin/env node
// Inlines `import type { ... } from './xxx.internal[.circular]'` references
// across the emitted public `.d.ts` files, then deletes the internal
// declaration files from `dist/`. The internal `*.ts` source files exist only
// to keep the public surface clean; their declarations don't belong in the
// shipped tarball.
//
// Why this exists: tsc emits one `.d.ts` per source file (which is what we
// need for the namespace+type declaration-merging trick at the index level —
// see the index `.d.ts` files for the `import * as Ns + export { Ns as X }`
// pattern). But that per-file emit also produces `*.internal.d.ts` siblings
// that have nothing the consumer needs. They're typically tiny TypeId brand
// symbols referenced by the public file. We inline those references and drop
// the files.
//
// The script assumes each `import type` from an internal file pulls only
// `unique symbol` brand declarations (the established convention) and
// rewrites them as ambient `declare const X: unique symbol; type X = typeof X`
// blocks in the importing file.

import { readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const INTERNAL_FILE_RE = /\.internal(\.circular)?\.d\.ts$/

/** Walk a directory tree, collecting `.d.ts` files. */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const results = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        return walk(full)
      }
      if (e.isFile() && e.name.endsWith('.d.ts')) {
        return [full]
      }
      return []
    }),
  )
  return results.flat()
}

/**
 * Extract the `export declare const X: unique symbol;` + `export type X = typeof X;`
 * pairs from an internal `.d.ts` file. Returns a map keyed by symbol name.
 */
function extractBrandSymbols(content) {
  const symbols = new Map()
  const constRe = /export\s+declare\s+const\s+(\w+):\s+unique\s+symbol;?/g
  const typeRe = /export\s+(?:declare\s+)?type\s+(\w+)\s+=\s+typeof\s+\1;?/g
  for (const m of content.matchAll(constRe)) {
    symbols.set(m[1], { value: true, type: false })
  }
  for (const m of content.matchAll(typeRe)) {
    const existing = symbols.get(m[1])
    if (existing) {
      existing.type = true
    }
  }
  return symbols
}

/** Rewrite a single public `.d.ts` file in place, inlining internal imports. */
async function rewritePublicFile(file, internalSymbols) {
  const original = await readFile(file, 'utf8')
  const importRe =
    /^import\s+type\s+\{\s*([^}]+)\s*\}\s+from\s+['"](\.\/[^'"]+\.internal(?:\.circular)?)['"];?\s*$/gm
  const inlinedBlocks = []
  const rewritten = original.replace(importRe, (full, names, relative) => {
    const resolved = path.resolve(path.dirname(file), `${relative}.d.ts`)
    const knownSymbols = internalSymbols.get(resolved)
    if (!knownSymbols) {
      // Unrecognized internal — leave the import alone so we don't break
      // declarations we don't understand.
      return full
    }
    const importedNames = names
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const blocks = []
    for (const n of importedNames) {
      const info = knownSymbols.get(n)
      if (!info || !info.value) {
        // Not a brand symbol — bail on this whole import to be safe.
        return full
      }
      blocks.push(`declare const ${n}: unique symbol;`)
      if (info.type) {
        blocks.push(`type ${n} = typeof ${n};`)
      }
    }
    inlinedBlocks.push(blocks.join('\n'))
    return ''
  })

  if (inlinedBlocks.length === 0) {
    return
  }

  // Prepend the inlined ambient declarations after any surviving imports.
  const lines = rewritten.split('\n')
  let lastImportIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^import\b/.test(lines[i])) {
      lastImportIdx = i
    }
  }
  const insertion = ['', ...inlinedBlocks, '']
  lines.splice(lastImportIdx + 1, 0, ...insertion)
  await writeFile(file, lines.join('\n'))
}

const files = await walk(DIST)
const internalFiles = files.filter((f) => INTERNAL_FILE_RE.test(f))
const publicFiles = files.filter((f) => !INTERNAL_FILE_RE.test(f))

const internalSymbols = new Map(
  await Promise.all(
    internalFiles.map(async (f) => [f, extractBrandSymbols(await readFile(f, 'utf8'))]),
  ),
)

await Promise.all(publicFiles.map((f) => rewritePublicFile(f, internalSymbols)))

// Drop the internal declaration files now that their relevant exports have
// been inlined into their public counterparts.
await Promise.all(internalFiles.map((f) => unlink(f)))
