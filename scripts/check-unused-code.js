#!/usr/bin/env node

/**
 * Unused Code Checker
 * Scans TypeScript/JavaScript files for unused imports, interfaces, functions, and variables
 * Run locally: node scripts/check-unused-code.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const IGNORE_PATTERNS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  ".vercel",
  "coverage",
  "out",
];

let totalIssues = 0;
let fileCount = 0;

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    if (shouldIgnore(fullPath)) continue;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (EXTENSIONS.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const issues = [];

    // Pattern 1: Unused imports (import X from 'Y' but X never used)
    const importMatches = content.matchAll(
      /import\s+(?:{([^}]+)}|(\w+))\s+from\s+["']([^"']+)["']/g
    );

    for (const match of importMatches) {
      const imports = match[1] || match[2];
      const importedItems = imports
        .split(",")
        .map((x) => x.trim())
        .map((x) => x.split(/\s+as\s+/)[1] || x.split(/\s+as\s+/)[0]) // Handle 'as' aliases
        .filter((x) => x);

      for (const item of importedItems) {
        if (!item || item === "*" || item === "type") continue;

        // Check if item is used anywhere in the file (not in import statement)
        const usageRegex = new RegExp(`\\b${item}\\b(?!\\s*from)(?!\\s*import)`, "g");
        const usages = content.match(usageRegex);

        // Filter out the import declaration itself
        const nonImportUsages = content
          .split("\n")
          .slice(1) // Skip potential import lines
          .join("\n")
          .match(usageRegex);

        if (!nonImportUsages || nonImportUsages.length === 0) {
          const lineNum = lines.findIndex((line) => line.includes(`import`) && line.includes(item));
          if (lineNum !== -1) {
            issues.push({
              type: "unused-import",
              name: item,
              line: lineNum + 1,
              message: `'${item}' is imported but never used`,
            });
          }
        }
      }
    }

    // Pattern 2: Unused interfaces (interface X but X never used)
    const interfaceMatches = content.matchAll(
      /interface\s+(\w+)\s*(?:<[^>]*>)?\s*{/g
    );

    for (const match of interfaceMatches) {
      const interfaceName = match[1];
      const usageRegex = new RegExp(`\\b${interfaceName}\\b`, "g");
      const usages = content.match(usageRegex) || [];

      // The first usage is the declaration itself
      if (usages.length === 1) {
        const lineNum = lines.findIndex(
          (line) => line.includes(`interface ${interfaceName}`)
        );
        if (lineNum !== -1) {
          issues.push({
            type: "unused-interface",
            name: interfaceName,
            line: lineNum + 1,
            message: `Interface '${interfaceName}' is declared but never used`,
          });
        }
      }
    }

    // Pattern 3: Unused type declarations
    const typeMatches = content.matchAll(/type\s+(\w+)\s*=\s*[^;]+;/g);

    for (const match of typeMatches) {
      const typeName = match[1];
      const usageRegex = new RegExp(`\\b${typeName}\\b`, "g");
      const usages = content.match(usageRegex) || [];

      if (usages.length === 1) {
        const lineNum = lines.findIndex((line) => line.includes(`type ${typeName}`));
        if (lineNum !== -1) {
          issues.push({
            type: "unused-type",
            name: typeName,
            line: lineNum + 1,
            message: `Type '${typeName}' is declared but never used`,
          });
        }
      }
    }

    // Pattern 4: Unused function declarations (const/function at top level)
    const funcMatches = content.matchAll(
      /(?:const|function)\s+(\w+)\s*(?:=|\(|:)/g
    );

    for (const match of funcMatches) {
      const funcName = match[1];

      // Skip common patterns that are exports or hooks
      if (
        funcName === "default" ||
        funcName.startsWith("use") ||
        content.includes(`export ${funcName}`) ||
        content.includes(`export const ${funcName}`) ||
        content.includes(`export function ${funcName}`)
      ) {
        continue;
      }

      const usageRegex = new RegExp(`\\b${funcName}\\b`, "g");
      const usages = content.match(usageRegex) || [];

      // Filter to only count usages outside the declaration
      const declarationLine = lines.findIndex((line) =>
        line.match(new RegExp(`(?:const|function)\\s+${funcName}\\b`))
      );

      if (declarationLine !== -1) {
        const beforeDeclaration = lines.slice(0, declarationLine).join("\n");
        const afterDeclaration = lines.slice(declarationLine + 1).join("\n");
        const usagesBefore = beforeDeclaration.match(usageRegex) || [];
        const usagesAfter = afterDeclaration.match(usageRegex) || [];

        if (usagesBefore.length === 0 && usagesAfter.length === 0) {
          issues.push({
            type: "unused-function",
            name: funcName,
            line: declarationLine + 1,
            message: `Function/variable '${funcName}' is declared but never used`,
          });
        }
      }
    }

    if (issues.length > 0) {
      fileCount++;
      console.log(`\n📄 ${filePath}`);
      issues.forEach((issue) => {
        console.log(
          `  ⚠️  Line ${issue.line}: [${issue.type}] ${issue.message}`
        );
        totalIssues++;
      });
    }
  } catch (error) {
    // Silently skip files with parse errors
  }
}

function main() {
  const projectRoot = process.cwd();
  console.log(
    "🔍 Scanning for unused code in TypeScript/JavaScript files...\n"
  );

  const files = getAllFiles(projectRoot);
  files.forEach(checkFile);

  console.log(
    `\n${"=".repeat(60)}`
  );
  console.log(
    `✅ Scan complete! Found ${totalIssues} issues in ${fileCount} files\n`
  );

  if (totalIssues > 0) {
    console.log("💡 Tip: Review and remove unused code to improve build performance");
    process.exit(1);
  } else {
    console.log("🎉 No unused code detected!");
    process.exit(0);
  }
}

main();
