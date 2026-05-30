/**
 * Removes console.log / console.debug / console.info statements from TS/TSX source files.
 * Preserves console.error and console.warn. Skips sanitize-logs.ts.
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const DIRS = ["lib", "app", "components", "hooks"]
const SKIP_FILES = new Set(["sanitize-logs.ts", "dev-console-detector.tsx"])

function shouldProcess(filePath) {
  if (!/\.(ts|tsx)$/.test(filePath)) return false
  const base = path.basename(filePath)
  if (SKIP_FILES.has(base)) return false
  return true
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue
      walk(full, files)
    } else if (shouldProcess(full)) {
      files.push(full)
    }
  }
  return files
}

function removeConsoleStatements(content) {
  const lines = content.split("\n")
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^\s*console\.(log|debug|info)\s*\(/.test(line)) {
      let depth = 0
      let started = false
      let j = i
      for (; j < lines.length; j++) {
        const chunk = lines[j]
        for (let k = 0; k < chunk.length; k++) {
          const ch = chunk[k]
          if (ch === "(") {
            depth++
            started = true
          } else if (ch === ")") {
            depth--
          }
        }
        if (started && depth <= 0) {
          j++
          break
        }
      }
      i = j
      continue
    }
    out.push(line)
    i++
  }
  return out.join("\n")
}

let changed = 0
for (const dir of DIRS) {
  const files = walk(path.join(ROOT, dir))
  for (const file of files) {
    const before = fs.readFileSync(file, "utf8")
    const after = removeConsoleStatements(before)
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8")
      changed++
      console.error(`Cleaned: ${path.relative(ROOT, file)}`)
    }
  }
}
console.error(`Done. ${changed} files updated.`)
