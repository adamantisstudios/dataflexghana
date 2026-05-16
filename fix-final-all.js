// fix-final-all.js
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const files = globSync('{app,components,hooks,lib}/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', 'lib/supabase-client.ts', 'app/api/db/**']
});

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Remove duplicate supabase imports from lib/ files
  // If the file already imports supabase from somewhere else, remove the wrapper import.
  const lines = content.split('\n');
  const wrapperImport = `import { supabase } from "@/lib/supabase-client";`;
  const hasWrapper = lines.some(line => line.trim() === wrapperImport);
  const hasOtherSupabaseImport = lines.some(line =>
    line.includes('import { supabase }') && !line.includes('@/lib/supabase-client')
  );

  if (hasWrapper && hasOtherSupabaseImport) {
    // Remove the wrapper import line
    const newLines = lines.filter(line => line.trim() !== wrapperImport);
    content = newLines.join('\n');
    changed = true;
  }

  // 2. Fix missing 'import {' before named export blocks
  // Pattern: a line that starts with spaces, then a capital letter word (possibly with a comma),
  // and the line above it ends with ';' or '} from "..."'
  const lines2 = content.split('\n');
  const newLines = [];
  for (let i = 0; i < lines2.length; i++) {
    const line = lines2[i];
    const trimmed = line.trim();

    // Check if this line looks like a dangling named export
    if (
      trimmed &&
      /^[A-Z]/.test(trimmed) &&
      !trimmed.startsWith('import ') &&
      !trimmed.startsWith('export ') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*')
    ) {
      // Look back for the previous non-empty line
      let prevIdx = newLines.length - 1;
      while (prevIdx >= 0 && newLines[prevIdx].trim() === '') {
        prevIdx--;
      }
      const prevLine = prevIdx >= 0 ? newLines[prevIdx].trim() : '';

      // If previous line ends with ';' or '}' or a '} from "..."' pattern
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
  content = newLines.join('\n');

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\nDone. Fixed ${fixedCount} files.`);