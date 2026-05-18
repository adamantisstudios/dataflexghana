import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adminApiRoot = path.join(__dirname, "..", "app", "api", "admin")

const AUTH_MARKERS = ["authenticateAdmin", "withAdminAuth", "requireAdminSession"]
const IMPORT_LINE = 'import { requireAdminSession } from "@/lib/api-auth"\n'
const GUARD_BLOCK = `  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

`

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name === "route.ts" || entry.name === "route.tsx") files.push(full)
  }
  return files
}

function hasAuth(content) {
  return AUTH_MARKERS.some((m) => content.includes(m))
}

function ensureNextRequestImport(content) {
  if (!/export async function \w+\([^)]*request/.test(content)) {
    return content
  }
  if (content.includes("NextRequest")) return content

  const re = /import\s+\{([^}]+)\}\s+from\s+"next\/server"/
  const match = content.match(re)
  if (match) {
    const names = match[1].trim()
    return content.replace(re, `import { type NextRequest, ${names} } from "next/server"`)
  }
  return `import { type NextRequest, NextResponse } from "next/server"\n${content}`
}

function addImports(content) {
  let updated = content
  if (!updated.includes("requireAdminSession")) {
    const firstImport = updated.match(/^import .+$/m)
    if (firstImport) {
      const idx = updated.indexOf(firstImport[0])
      updated = updated.slice(0, idx) + IMPORT_LINE + updated.slice(idx)
    } else {
      updated = IMPORT_LINE + updated
    }
  }
  return ensureNextRequestImport(updated)
}

function patchHandlers(content) {
  const handlerRe =
    /export async function (GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{\n?/g

  return content.replace(handlerRe, (full, method, params) => {
    const openBrace = full.endsWith("{") || full.endsWith("{\n")
    if (!openBrace) return full

    const nextChunk = content.slice(content.indexOf(full) + full.length, content.indexOf(full) + full.length + 80)
    if (nextChunk.includes("requireAdminSession")) return full

    let newParams = params.trim()
    if (!newParams) {
      newParams = "request: NextRequest"
    } else if (!/\brequest\b/.test(newParams)) {
      newParams = `request: NextRequest, ${newParams}`
    } else if (/^\s*request\s*,/.test(newParams) || /^\s*request\s*\)/.test(newParams)) {
      newParams = newParams.replace(/^\s*request\b/, "request: NextRequest")
    } else if (/,\s*request\s*,/.test(newParams) || /,\s*request\s*\)/.test(newParams)) {
      newParams = newParams.replace(/,\s*request\b/, ", request: NextRequest")
    }

    return `export async function ${method}(${newParams}) {\n${GUARD_BLOCK}`
  })
}

const files = walk(adminApiRoot)
const updated = []
const skipped = []

for (const file of files) {
  const content = fs.readFileSync(file, "utf8")
  if (hasAuth(content)) {
    skipped.push(path.relative(adminApiRoot, file))
    continue
  }
  const next = patchHandlers(addImports(content))
  if (next !== content) {
    fs.writeFileSync(file, next, "utf8")
    updated.push(path.relative(adminApiRoot, file))
  }
}

console.log("Updated:", updated.length)
updated.forEach((f) => console.log("  +", f))
console.log("Skipped (already protected):", skipped.length)
skipped.forEach((f) => console.log("  -", f))
