// fix-missing-imports.js
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// Folders to scan
const dirs = ['app', 'components', 'hooks', 'lib'];

// Collect all .ts and .tsx files
const files = dirs.flatMap(dir => globSync(`${dir}/**/*.{ts,tsx}`, {
  ignore: ['**/node_modules/**', 'lib/supabase-client.ts', 'app/api/db/**']
}));

let fixedCount = 0;

files.forEach(file => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Heuristic: a line that starts with a named export (capital letter or common icon names)
    // and the previous line ends with } from "..." or ; (end of previous import)
    // and the current line is not already an import statement.
    if (trimmed && !trimmed.startsWith('import ') && !trimmed.startsWith('export ') && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
      const prevLine = newLines.length > 0 ? newLines[newLines.length - 1].trim() : '';
      const isAfterImportBlock = prevLine.endsWith(';') || /}\s*from\s+['"]/.test(prevLine);

      // Check if this looks like a continuation of an import list (e.g., "  Users,")
      if (isAfterImportBlock && /^[A-Z]/.test(trimmed.charAt(0))) {
        // It's likely a missing import {
        // But also check that we aren't inside a function body or JSX (simple heuristic: indentation)
        if (line.startsWith('  ') || line.startsWith('\t')) {
          // Insert the missing import {
          newLines.push('import {');
          changed = true;
        }
      }
    }

    newLines.push(line);
  }

  if (changed) {
    fs.writeFileSync(file, newLines.join('\n'), 'utf8');
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\nDone. Fixed ${fixedCount} files.`);