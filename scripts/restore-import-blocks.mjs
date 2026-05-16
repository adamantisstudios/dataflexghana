import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipDirs = new Set(["node_modules", ".next", ".git", "scripts"]);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
  return files;
}

function isImportListLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (t.startsWith("import ") || t.startsWith("export ")) return false;
  if (t.startsWith("//") || t.startsWith("*")) return false;
  if (t.includes("=") || t.includes("return ") || t.startsWith("case ")) return false;
  // Named import items: Foo, type Foo, Foo as Bar, }
  return /^[\w\s,{}.*]+$/.test(t) && (t.endsWith(",") || t === "}" || /^type\s/.test(t) || /^[\w.]+\s+as\s+/.test(t));
}

function fixOrphanImportBlocks(content) {
  const lines = content.split("\n");
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isImportListLine(line)) {
      let j = i;
      let closeLine = -1;
      while (j < lines.length && j < i + 100) {
        if (/^\s*\}\s*from\s+["']/.test(lines[j])) {
          closeLine = j;
          break;
        }
        if (j > i && !isImportListLine(lines[j]) && !/^\s*\}\s*from\s+["']/.test(lines[j])) break;
        j++;
      }

      if (closeLine >= 0) {
        const prev = out.length ? out[out.length - 1].trim() : "";
        const needsImportOpen =
          !prev.endsWith(",") &&
          !prev.endsWith("{") &&
          (prev.includes('from "') || prev.includes("from '") || prev === "" || !prev.startsWith("import"));

        if (needsImportOpen && !line.trim().startsWith("import")) {
          const indent = line.match(/^(\s*)/)[1];
          out.push(`${indent}import {`);
        }
        for (let k = i; k <= closeLine; k++) out.push(lines[k]);
        i = closeLine;
        continue;
      }
    }

    out.push(line);
  }

  return out.join("\n");
}

function dedupeSupabaseImports(content) {
  const lines = content.split("\n");
  let seen = false;
  return lines
    .filter((line) => {
      if (/import \{ supabase \} from ["']@\/lib\/supabase-client["']/.test(line)) {
        if (seen) return false;
        seen = true;
      }
      return true;
    })
    .join("\n");
}

let changed = 0;
for (const f of walk(root)) {
  const orig = fs.readFileSync(f, "utf8");
  const fixed = dedupeSupabaseImports(fixOrphanImportBlocks(orig));
  if (fixed !== orig) {
    fs.writeFileSync(f, fixed, "utf8");
    changed++;
    console.log("fixed:", path.relative(root, f));
  }
}
console.log(`Total: ${changed}`);
