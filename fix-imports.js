// fix-imports.js
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{app,components,hooks,lib}/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', 'lib/supabase-client.ts', 'app/api/db/**']
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern 1: import { ...stuff... } import { supabase } from "@/lib/supabase-client""
  // The first part may or may not have a 'from' clause.
  const regex1 = /import\s+\{([^}]+)\}\s+import\s+\{\s*supabase\s*\}\s+from\s+"@\/lib\/supabase-client""/g;
  content = content.replace(regex1, (match, origExports) => {
    const parts = origExports.split(',').map(s => s.trim()).filter(s => s !== 'supabase' && s !== '');
    const otherExports = parts.filter(p => !p.startsWith('type '));
    const typeExports = parts.filter(p => p.startsWith('type ')).map(p => p.replace('type ', '').trim());
    let newImports = `import { supabase } from "@/lib/supabase-client";\n`;
    if (otherExports.length > 0) {
      newImports += `import { ${otherExports.join(', ')} } from "@/lib/supabase";\n`;
    }
    if (typeExports.length > 0) {
      newImports += `import type { ${typeExports.join(', ')} } from "@/lib/supabase";\n`;
    }
    return newImports.trim();
  });

  // Pattern 2: import { supabase } from "@/lib/supabase-client" { supabase } from "@/lib/supabase-client""
  content = content.replace(
    /import\s+\{\s*supabase\s*\}\s+from\s+"@\/lib\/supabase-client"\s*\{\s*supabase\s*\}\s+from\s+"@\/lib\/supabase-client""/g,
    'import { supabase } from "@/lib/supabase-client";'
  );

  // Pattern 3: import { supabase } from "@/lib/supabase-client" { any garbage }
  content = content.replace(
    /import\s+\{\s*supabase\s*\}\s+from\s+"@\/lib\/supabase-client"\s+\{.*$/gm,
    'import { supabase } from "@/lib/supabase-client";'
  );

  if (content !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('All known broken imports repaired.');