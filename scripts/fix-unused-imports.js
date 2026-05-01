#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
};

function getAllTypeScriptFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (item === 'node_modules' || item.startsWith('.')) {
        continue;
      }
      files = files.concat(getAllTypeScriptFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function removeUnusedImports(content) {
  const lines = content.split('\n');
  const unusedImportRegex = /^import\s+(?:{([^}]+)}|(\w+)|(\*)\s+as\s+(\w+))\s+from\s+['"][^'"]+['"]/;
  let modified = false;

  const newLines = lines.filter((line) => {
    if (!line.match(unusedImportRegex)) {
      return true;
    }

    const importMatch = line.match(
      /import\s+(?:{([^}]+)}|(\w+)|(\*)\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/
    );

    if (!importMatch) {
      return true;
    }

    let names = [];
    if (importMatch[1]) {
      // Named imports
      names = importMatch[1]
        .split(',')
        .map((n) => n.trim().split(' as ').pop())
        .filter((n) => n);
    } else if (importMatch[2]) {
      names = [importMatch[2]];
    } else if (importMatch[4]) {
      names = [importMatch[4]];
    }

    const fullContent = content;
    let allUnused = true;

    for (const name of names) {
      if (!name) continue;
      // Check if the name is used outside of the import statement
      const regex = new RegExp(`\\b${name}\\b(?!\\s*from)`, 'g');
      const matches = fullContent.match(regex) || [];
      // More than 1 match means it's used (first match is the import)
      if (matches.length > 1) {
        allUnused = false;
        break;
      }
    }

    if (allUnused && names.length > 0) {
      modified = true;
      return false; // Remove this import
    }

    return true;
  });

  // Remove consecutive empty lines
  const filtered = [];
  let lastWasEmpty = false;
  for (const line of newLines) {
    if (line.trim() === '') {
      if (!lastWasEmpty) {
        filtered.push(line);
        lastWasEmpty = true;
      }
    } else {
      filtered.push(line);
      lastWasEmpty = false;
    }
  }

  return { content: filtered.join('\n'), modified };
}

function main() {
  const projectRoot = process.cwd();
  console.log(
    `${colors.blue}🔧 Removing unused imports from all TypeScript files...${colors.reset}\n`
  );

  const tsFiles = getAllTypeScriptFiles(projectRoot).filter((file) => {
    if (file.includes('node_modules')) return false;
    if (file.includes('.next')) return false;
    return true;
  });

  let filesModified = 0;
  let importsRemoved = 0;

  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const { content: newContent, modified } = removeUnusedImports(content);

    if (modified) {
      fs.writeFileSync(file, newContent, 'utf-8');
      const relativePath = path.relative(projectRoot, file);
      console.log(`${colors.green}✓${colors.reset} ${relativePath}`);

      const removedCount = (content.match(/^import\s+/gm) || []).length - (newContent.match(/^import\s+/gm) || []).length;
      if (removedCount > 0) {
        importsRemoved += removedCount;
        console.log(`  ${colors.cyan}Removed ${removedCount} unused import(s)${colors.reset}`);
      }
      filesModified++;
    }
  }

  console.log();
  if (filesModified === 0) {
    console.log(`${colors.yellow}No unused imports found.${colors.reset}`);
  } else {
    console.log(
      `${colors.green}✓ Fixed ${filesModified} file(s), removed ${importsRemoved} unused import(s)${colors.reset}`
    );
  }
}

main();
