// fix-all-remaining.js
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const dirs = ['app', 'components', 'hooks', 'lib'];

const files = dirs.flatMap(dir => globSync(`${dir}/**/*.{ts,tsx}`, {
  ignore: ['**/node_modules/**', 'lib/supabase-client.ts', 'app/api/db/**']
}));

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Fix missing 'import {' for lucide-react or other UI libraries
  // Pattern: line after a closing } from a previous import that starts with a capital letter.
  content = content.replace(
    /(}\s*from\s+['"][^'"]+['"]\s*;?\s*\n)(\s*)([A-Z])/g,
    (match, p1, p2, p3) => {
      // Only if the next line is not already 'import' or 'export'
      const nextLine = p2 + p3;
      if (!/^\s*(import|export)/.test(nextLine)) {
        changed = true;
        return `${p1}import {\n${p2}${p3}`;
      }
      return match;
    }
  );

  // 2. Replace any line that imports createClient from '@supabase/supabase-js' (except API routes)
  // If the file is not inside app/api/, we'll replace the import and any usage.
  if (!file.startsWith('app' + path.sep + 'api' + path.sep)) {
    // Remove the createClient import
    content = content.replace(
      /import\s+\{\s*createClient\s*\}\s+from\s+['"]@supabase\/supabase-js['"];?\s*/g,
      ''
    );
    // Remove any line that initializes supabase with createClient (service_role key)
    content = content.replace(
      /const\s+supabase\s*=\s*createClient\s*\([^)]+\);?\s*/g,
      ''
    );
    // Replace any occurrence of enhancedSupabase with supabase
    content = content.replace(/\benhancedSupabase\b/g, 'supabase');
    // If supabase is not imported yet, add the import at the top (after "use client" if present)
    if (/\bsupabase\b/.test(content) && !content.includes('@/lib/supabase-client')) {
      const importLine = `import { supabase } from "@/lib/supabase-client";\n`;
      if (content.startsWith('"use client"')) {
        const lines = content.split('\n');
        // Insert after the first line (use client)
        lines.splice(1, 0, importLine);
        content = lines.join('\n');
      } else {
        content = importLine + content;
      }
      changed = true;
    }
  }

  // 3. Remove duplicate imports (exact same import statement)
  const lines = content.split('\n');
  const importSet = new Set();
  const newLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') && importSet.has(trimmed)) {
      changed = true;
      continue; // skip duplicate
    }
    if (trimmed.startsWith('import ')) {
      importSet.add(trimmed);
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