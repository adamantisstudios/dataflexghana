const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const OUTPUT_DIR = path.join(ROOT, "platform-analysis");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const IGNORE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "vendor",
  ".turbo",
  "tmp",
  "logs",
];

const EXTENSIONS = [
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".json",
  ".env",
  ".prisma",
  ".sql",
  ".md",
];

const analysis = {
  projectStructure: [],
  routes: [],
  components: [],
  apiEndpoints: [],
  databaseModels: [],
  authSystems: [],
  services: [],
  stateManagement: [],
  uiPatterns: [],
  envVars: [],
  roleSystems: [],
  files: [],
};

function shouldIgnore(name) {
  return IGNORE.includes(name);
}

function walk(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);

    if (shouldIgnore(item)) continue;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      analysis.projectStructure.push(fullPath.replace(ROOT, ""));
      walk(fullPath);
    } else {
      const ext = path.extname(item);

      if (!EXTENSIONS.includes(ext)) continue;

      const relative = fullPath.replace(ROOT, "");

      analysis.files.push(relative);

      analyzeFile(fullPath, relative);
    }
  }
}

function analyzeFile(fullPath, relative) {
  let content = "";

  try {
    content = fs.readFileSync(fullPath, "utf8");
  } catch {
    return;
  }

  // ROUTES
  if (
    relative.includes("/pages/") ||
    relative.includes("/app/") ||
    relative.includes("router")
  ) {
    analysis.routes.push(relative);
  }

  // COMPONENTS
  if (
    relative.includes("/components/") ||
    content.includes("function ") ||
    content.includes("export default")
  ) {
    analysis.components.push(relative);
  }

  // API ENDPOINTS
  if (
    content.includes("fetch(") ||
    content.includes("axios") ||
    relative.includes("/api/")
  ) {
    analysis.apiEndpoints.push(relative);
  }

  // DATABASE
  if (
    content.includes("prisma") ||
    content.includes("mongoose") ||
    content.includes("sequelize") ||
    content.includes("typeorm") ||
    extIs(relative, [".prisma", ".sql"])
  ) {
    analysis.databaseModels.push(relative);
  }

  // AUTH
  if (
    content.includes("auth") ||
    content.includes("jwt") ||
    content.includes("session") ||
    content.includes("next-auth")
  ) {
    analysis.authSystems.push(relative);
  }

  // STATE
  if (
    content.includes("redux") ||
    content.includes("zustand") ||
    content.includes("context") ||
    content.includes("mobx")
  ) {
    analysis.stateManagement.push(relative);
  }

  // UI
  if (
    content.includes("tailwind") ||
    content.includes("className") ||
    content.includes("styled-components")
  ) {
    analysis.uiPatterns.push(relative);
  }

  // ROLES
  if (
    content.includes("admin") ||
    content.includes("role") ||
    content.includes("permission")
  ) {
    analysis.roleSystems.push(relative);
  }

  // ENV
  const envMatches = content.match(/process\.env\.[A-Z0-9_]+/g);

  if (envMatches) {
    analysis.envVars.push(...envMatches);
  }
}

function extIs(file, exts) {
  return exts.includes(path.extname(file));
}

walk(ROOT);

function writeJson(name, data) {
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${name}.json`),
    JSON.stringify(data, null, 2)
  );
}

writeJson("project-structure", analysis.projectStructure);
writeJson("routes", analysis.routes);
writeJson("components", analysis.components);
writeJson("api-endpoints", analysis.apiEndpoints);
writeJson("database-models", analysis.databaseModels);
writeJson("auth-systems", analysis.authSystems);
writeJson("state-management", analysis.stateManagement);
writeJson("ui-patterns", analysis.uiPatterns);
writeJson("role-systems", analysis.roleSystems);

const markdown = `
# PLATFORM ANALYSIS REPORT

## Project Overview

- Total Files: ${analysis.files.length}
- Routes: ${analysis.routes.length}
- Components: ${analysis.components.length}
- APIs: ${analysis.apiEndpoints.length}

---

# Routes

${analysis.routes.map((r) => `- ${r}`).join("\n")}

---

# Components

${analysis.components.map((r) => `- ${r}`).join("\n")}

---

# API Endpoints

${analysis.apiEndpoints.map((r) => `- ${r}`).join("\n")}

---

# Database Models

${analysis.databaseModels.map((r) => `- ${r}`).join("\n")}

---

# Auth Systems

${analysis.authSystems.map((r) => `- ${r}`).join("\n")}

---

# State Management

${analysis.stateManagement.map((r) => `- ${r}`).join("\n")}

---

# UI Patterns

${analysis.uiPatterns.map((r) => `- ${r}`).join("\n")}

---

# Role Systems

${analysis.roleSystems.map((r) => `- ${r}`).join("\n")}
`;

fs.writeFileSync(
  path.join(OUTPUT_DIR, "platform-analysis.md"),
  markdown
);

const aiPrompt = `
Analyze the attached project analysis files and generate:

- Full platform documentation
- UI/UX architecture
- Theme system
- Navigation map
- Dashboard breakdown
- Admin panel analysis
- Agent workflows
- User flows
- Feature inventory
- Screen breakdowns
- Product architecture

Use the markdown and JSON files as source context.
`;

fs.writeFileSync(
  path.join(OUTPUT_DIR, "AI-ANALYSIS-PROMPT.txt"),
  aiPrompt
);

console.log("\\n✅ Platform analysis generated!");
console.log(`📁 Output: ${OUTPUT_DIR}`);