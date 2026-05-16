// fix-all-imports-final.js
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// All source folders
const dirs = ['app', 'components', 'hooks', 'lib'];

// Collect all .ts and .tsx files except the wrapper and the generic API route
const files = dirs.flatMap(dir => globSync(`${dir}/**/*.{ts,tsx}`, {
  ignore: ['**/node_modules/**', 'lib/supabase-client.ts', 'app/api/db/**']
}));

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex: match a line that starts with one or more spaces, then a capital letter word, optionally followed by a comma,
  // and the previous line ends with '};' or '} from "..."' or ';' (the end of a previous import statement).
  // We'll rebuild the file line by line for safety.
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // If the current line looks like a dangling named export (starts with capital letter, no 'import' or 'export')
    if (
      trimmed &&
      /^[A-Z]/.test(trimmed) &&
      !trimmed.startsWith('import ') &&
      !trimmed.startsWith('export ') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*')
    ) {
      // Check the previous line (after any blank lines)
      let prevIndex = newLines.length - 1;
      while (prevIndex >= 0 && newLines[prevIndex].trim() === '') {
        prevIndex--;
      }
      const prevLine = prevIndex >= 0 ? newLines[prevIndex].trim() : '';

      // If the previous line is the end of a previous import (ends with } from "..." or }; or just }),
      // or a closing brace with semicolon, we need to insert `import {`.
      if (
        prevLine.endsWith(';') ||
        prevLine.endsWith('}') ||
        /}\s*from\s+['"][^'"]+['"]/.test(prevLine)
      ) {
        // Insert the missing import {
        newLines.push('import {');
        changed = true;
      }
    }

    newLines.push(line);
  }

  if (changed) {
    // Post-process: also fix any duplicate supabase imports (the script might have added one)
    const finalLines = [];
    const supabaseImportSeen = false;
    // We'll just remove exact duplicate lines as a simple cleanup.
    const seen = new Set();
    for (const line of newLines) {
      const t = line.trim();
      if (t.startsWith('import ') && seen.has(t)) {
        continue; // skip duplicate
      }
      if (t.startsWith('import ')) seen.add(t);
      finalLines.push(line);
    }

    fs.writeFileSync(file, finalLines.join('\n'), 'utf8');
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\nDone. Fixed ${fixedCount} files.`);