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

function fixContent(content, filePath) {
  let s = content;

  // Merged import lines (missing newline/semicolon)
  s = s.replace(
    /from ["']@\/lib\/supabase-client["'];?import /g,
    'from "@/lib/supabase-client";\nimport '
  );
  s = s.replace(
    /from ["']@\/lib\/supabase-client["']import /g,
    'from "@/lib/supabase-client";\nimport '
  );
  s = s.replace(
    /from ["']@\/lib\/supabase-client["']export /g,
    'from "@/lib/supabase-client";\n\nexport '
  );
  s = s.replace(
    /from ["']@\/lib\/supabase-client["']interface /g,
    'from "@/lib/supabase-client";\n\ninterface '
  );
  s = s.replace(
    /from ["']@\/lib\/supabase-client["']\/\*\*/g,
    'from "@/lib/supabase-client";\n\n/**'
  );

  // Duplicate supabase-client on same logical line
  s = s.replace(
    /import \{ supabase \} from ["']@\/lib\/supabase-client["'];?\s*import \{ supabase \} from ["']@\/lib\/supabase-client["'];?/g,
    'import { supabase } from "@/lib/supabase-client";'
  );

  // Double semicolon
  s = s.replace(
    /from ["']@\/lib\/supabase-client["'];;/g,
    'from "@/lib/supabase-client";'
  );

  // Erroneous import { inside template literals / JSX text
  s = s.replace(/\nimport \{\n/g, "\n");

  // Empty broken lucide import block: Icon,\nimport {\n} from "lucide-react"
  s = s.replace(/,?\s*\nimport \{\s*\n\} from ["']lucide-react["'];?/g, "\n} from \"lucide-react\";");

  // import type {\nimport {  -> import type {
  s = s.replace(/import type \{\s*\nimport \{\s*\n/g, "import type {\n");

  // apple-devices-data: interface broken by import {
  if (filePath.endsWith("apple-devices-data.ts")) {
    s = s.replace(
      /export interface AppleDevice \{\s*Device: string;\s*import \{\s*Issues: string\[\];\s*\}/,
      "export interface AppleDevice {\n  Device: string;\n  Issues: string[];\n}"
    );
  }

  // admin-maintenance-control: missing opening import {
  if (filePath.endsWith("admin-maintenance-control.tsx")) {
    if (!s.includes("from '@/lib/maintenance-mode'") || s.includes("import {\n  updateMaintenanceMode")) {
      // already fixed
    } else {
      s = s.replace(
        /import \{ useToast \} from '@\/hooks\/use-toast'\s+updateMaintenanceMode,/,
        `import { useToast } from '@/hooks/use-toast'\nimport {\n  updateMaintenanceMode,`
      );
    }
  }

  // wallet API route: missing import {
  if (filePath.endsWith("app\\api\\admin\\wallet\\route.ts") || filePath.endsWith("app/api/admin/wallet/route.ts")) {
    s = s.replace(
      /from '@\/lib\/earnings-calculator'\s+processSecureWithdrawalPayout,/,
      `from '@/lib/earnings-calculator'\nimport {\n  processSecureWithdrawalPayout,`
    );
    s = s.replace(
      /from '@\/lib\/withdrawal-security-fix'\s+syncAgentWalletBalance,/,
      `from '@/lib/withdrawal-security-fix'\nimport {\n  syncAgentWalletBalance,`
    );
  }

  // link-preview route: duplicate supabase const
  if (filePath.includes("link-preview") && filePath.endsWith("route.ts")) {
    s = s.replace(
      /import \{ supabase \} from ["']@\/lib\/supabase-client["'];\s*\nimport \{ supabaseAdmin \} from ["']@\/lib\/supabase-admin["'];\s*\n\s*\/\/ Use singleton.*\nconst supabase = supabaseAdmin/,
      `import { supabaseAdmin as supabase } from "@/lib/supabase-admin";`
    );
  }

  // ProductBrowser wholesale import
  if (filePath.endsWith("ProductBrowser.tsx") && s.includes("from \"@/lib/wholesale\"")) {
    s = s.replace(
      /from ["']lucide-react["']\s*\n\s*type WholesaleProduct,/,
      'from "lucide-react"\nimport {\n  type WholesaleProduct,'
    );
  }

  // Broken lucide: ends with comma then import { } from lucide
  s = s.replace(
    /([\w]+),\s*\nimport \{\s*\n\} from ["']lucide-react["'];?/g,
    "$1,\n} from \"lucide-react\";"
  );

  // Orphan import { before } from lucide (mid-list)
  s = s.replace(
    /(\n\s+[\w]+),\s*\nimport \{\s*\n\} from ["']lucide-react["']/g,
    "$1,\n} from \"lucide-react\""
  );

  return s;
}

const files = walk(root);
let changed = 0;
for (const f of files) {
  const orig = fs.readFileSync(f, "utf8");
  const fixed = fixContent(orig, f);
  if (fixed !== orig) {
    fs.writeFileSync(f, fixed, "utf8");
    changed++;
    console.log("fixed:", path.relative(root, f));
  }
}
console.log(`\nTotal files changed: ${changed}`);
