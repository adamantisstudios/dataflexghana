#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Known Next.js framework exports and patterns that are used by the framework
const FRAMEWORK_EXPORTS = [
  // Page components - automatically used by Next.js
  'Page',
  'PageWrapper',
  'HomePage',
  'AdminDashboard',
  'AgentDashboard',
  'Dashboard',
  // Loading components - used by Next.js Suspense
  'Loading',
  // Metadata functions - used by Next.js
  'generateMetadata',
  'generateStaticParams',
  // Layout components
  'RootLayout',
  'Layout',
  // Error boundary
  'Error',
  'ErrorBoundary',
  'NotFound',
];

// Check if an export name is a Next.js framework export
function isFrameworkExport(name) {
  // Exact matches
  if (FRAMEWORK_EXPORTS.includes(name)) return true;
  
  // Pattern matches for common Next.js exports
  if (name.endsWith('Page')) return true;                      // *Page
  if (name.endsWith('Dashboard')) return true;                 // *Dashboard
  if (name.endsWith('Layout')) return true;                    // *Layout
  if (name === 'Loading') return true;                         // Loading
  if (name === 'Error') return true;                           // Error
  if (name === 'NotFound') return true;                        // NotFound
  if (name === 'generateMetadata') return true;                // generateMetadata
  if (name === 'generateStaticParams') return true;            // generateStaticParams
  if (name === 'generateStaticMetadata') return true;          // generateStaticMetadata
  if (name === 'router') return true;                          // Commonly used from next/router
  
  return false;
}

// Check if a file is a Next.js special file
function isNextJsSpecialFile(filePath) {
  const filename = path.basename(filePath);
  return (
    filename === 'layout.tsx' ||
    filename === 'layout.ts' ||
    filename === 'page.tsx' ||
    filename === 'page.ts' ||
    filename === 'loading.tsx' ||
    filename === 'loading.ts' ||
    filename === 'error.tsx' ||
    filename === 'error.ts' ||
    filename === 'not-found.tsx' ||
    filename === 'not-found.ts'
  );
}

function getAllTypeScriptFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
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

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  // Check for unused imports
  const unusedImportRegex = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"][^'"]+['"]/g;
  let importMatch;

  const imports = {};
  while ((importMatch = unusedImportRegex.exec(content)) !== 0) {
    if (importMatch === null) break;
    const importStatement = importMatch[0];
    const importedNamesMatch = importStatement.match(
      /import\s+(?:{([^}]+)}|(\w+)|(\*)\s+as\s+(\w+))/
    );

    if (importedNamesMatch) {
      let names = [];
      if (importedNamesMatch[1]) {
        // Named imports: { A, B, C }
        names = importedNamesMatch[1]
          .split(',')
          .map((n) => n.trim().split(' as ')[1] || n.trim().split(' as ')[0])
          .filter((n) => n);
      } else if (importedNamesMatch[2]) {
        // Default import
        names = [importedNamesMatch[2]];
      } else if (importedNamesMatch[4]) {
        // Namespace import: * as Name
        names = [importedNamesMatch[4]];
      }

      for (const name of names) {
        if (name && name.trim()) {
          const regex = new RegExp(`\\b${name}\\b`, 'g');
          const matches = content.match(regex) || [];
          // If import appears only once (the import statement itself), it's unused
          if (matches.length === 1) {
            imports[name] = {
              line: content.substring(0, importMatch.index).split('\n').length,
              statement: importStatement.trim(),
            };
          }
        }
      }
    }
  }

  // Check for unused type/interface declarations
  const typeDeclarationRegex =
    /(?:interface|type)\s+(\w+)\s*(?:{|=|\<)/gm;
  let typeMatch;

  while ((typeMatch = typeDeclarationRegex.exec(content)) !== null) {
    const typeName = typeMatch[1];
    if (typeName && !isFrameworkExport(typeName)) {
      const regex = new RegExp(`\\b${typeName}\\b`, 'g');
      const matches = content.match(regex) || [];
      // If type appears only once (the declaration), it's unused
      if (matches.length === 1) {
        const lineNumber =
          content.substring(0, typeMatch.index).split('\n').length;
        issues.push({
          type: 'unused-type',
          name: typeName,
          line: lineNumber,
        });
      }
    }
  }

  // Check for unused function/const declarations
  // Pattern: const/function NAME = / function NAME(
  const funcConstRegex =
    /(?:const|function)\s+(\w+)\s*(?:=|:|\()/gm;
  let funcMatch;

  while ((funcMatch = funcConstRegex.exec(content)) !== null) {
    const funcName = funcMatch[1];
    if (funcName && !isFrameworkExport(funcName)) {
      const regex = new RegExp(`\\b${funcName}\\b`, 'g');
      const matches = content.match(regex) || [];
      // If function/const appears only once (the declaration), it's unused
      if (matches.length === 1) {
        const lineNumber =
          content.substring(0, funcMatch.index).split('\n').length;
        issues.push({
          type: 'unused-function',
          name: funcName,
          line: lineNumber,
        });
      }
    }
  }

  // Add unused imports to issues
  for (const [name, data] of Object.entries(imports)) {
    issues.push({
      type: 'unused-import',
      name,
      line: data.line,
      statement: data.statement,
    });
  }

  return issues;
}

function main() {
  const projectRoot = process.cwd();
  console.log(`${colors.blue}🔍 Scanning for real unused code...${colors.reset}\n`);

  const tsFiles = getAllTypeScriptFiles(projectRoot).filter((file) => {
    // Skip node_modules
    if (file.includes('node_modules')) return false;
    // Skip .next build directory
    if (file.includes('.next')) return false;
    return true;
  });

  let totalIssues = 0;
  let groupedIssues = {};

  for (const file of tsFiles) {
    const issues = analyzeFile(file);

    // Filter out false positives for Next.js special files
    let filteredIssues = issues;
    
    // All files: filter out framework-managed exports
    filteredIssues = issues.filter((issue) => {
      // Always report unused imports (except for 'router' which is framework-ish)
      if (issue.type === 'unused-import') {
        // Router is commonly imported but not used in some contexts
        if (issue.name === 'router') return false;
        return true;
      }
      
      // For functions/types: filter out framework exports and common patterns
      if (issue.type === 'unused-function' || issue.type === 'unused-type') {
        // Skip if it's a framework export
        if (isFrameworkExport(issue.name)) return false;
        // Skip if it looks like a React ref or hook
        if (issue.name.startsWith('use') && issue.name[3].toUpperCase() === issue.name[3]) return false;
        // Skip refs that end with Ref
        if (issue.name.endsWith('Ref')) return false;
        return true;
      }
      
      return true;
    });

    if (filteredIssues.length > 0) {
      const relativePath = path.relative(projectRoot, file);
      groupedIssues[relativePath] = filteredIssues;
      totalIssues += filteredIssues.length;
    }
  }

  // Print results
  if (totalIssues === 0) {
    console.log(
      `${colors.green}✓ No unused code found!${colors.reset}\n`
    );
  } else {
    console.log(
      `${colors.yellow}Found ${totalIssues} real unused code issue(s)${colors.reset}\n`
    );

    for (const [file, issues] of Object.entries(groupedIssues)) {
      console.log(`${colors.blue}📄 ${file}${colors.reset}`);

      for (const issue of issues) {
        const icon = issue.type === 'unused-import' ? '📦' : '⚠️ ';
        console.log(
          `  ${icon} Line ${issue.line}: [${issue.type}] "${issue.name}" is declared but never used`
        );
        if (issue.statement) {
          console.log(
            `     ${colors.gray}${issue.statement}${colors.reset}`
          );
        }
      }
      console.log();
    }

    console.log(
      `${colors.yellow}💡 Tip: Next.js page components, loading components, and generateMetadata are not reported as these are framework-managed exports.${colors.reset}`
    );
  }

  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
