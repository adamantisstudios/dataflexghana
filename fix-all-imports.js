// fix-all-imports.js
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{app,components,hooks,lib}/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', 'lib/supabase-client.ts', 'app/api/db/**']
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // This regex captures:
  // group1: all exports before the broken part
  // group2: any trailing suffix like "-enhanced" after the new client path
  const brokenImportRegex = /^import\s+\{([^}]+)\}\s+import\s+\{\s*supabase\s*\s*\}\s+from\s+"@\/lib\/supabase-client"([^"]*)"/gm;

  content = content.replace(brokenImportRegex, (match, origExports, suffix) => {
    // Determine the old module path based on the suffix
    const oldModule = suffix ? `@/lib/supabase${suffix}` : '@/lib/supabase';
    // Parse original exports, remove 'supabase'
    const parts = origExports.split(',').map(s => s.trim()).filter(s => s !== 'supabase' && s !== '');
    const otherExports = parts.filter(p => !p.startsWith('type '));
    const typeExports = parts.filter(p => p.startsWith('type ')).map(p => p.replace('type ', '').trim());
    // Build replacement imports
    let newImports = `import { supabase } from "@/lib/supabase-client";`;
    if (otherExports.length) newImports += `\nimport { ${otherExports.join(', ')} } from "${oldModule}";`;
    if (typeExports.length) newImports += `\nimport type { ${typeExports.join(', ')} } from "${oldModule}";`;
    return newImports.trim();
  });

  // Also fix any simple double import without extra exports: import { supabase } from "...client" { supabase } from "...client""
  content = content.replace(
    /^import\s+\{\s*supabase\s*\}\s+from\s+"@\/lib\/supabase-client"\s*\{.*$/gm,
    'import { supabase } from "@/lib/supabase-client";'
  );

  // Remove duplicate lines
  const lines = content.split('\n');
  const seen = new Set();
  const deduped = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('import ')) return true;
    if (seen.has(trimmed)) {
      changed = true;
      return false;
    }
    seen.add(trimmed);
    return true;
  });
  content = deduped.join('\n');

  if (content !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('All mangled imports repaired successfully.');