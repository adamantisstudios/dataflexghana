# DataFlex Ghana - Windows Installation Script
# Run this script to install dependencies without Visual Studio

Write-Host "🚀 DataFlex Ghana - Installing Dependencies..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean old installations
Write-Host "🧹 Cleaning old installations..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
if (Test-Path "pnpm-lock.yaml") {
    Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies (skip optional native bindings)
Write-Host "📦 Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm install --omit=optional --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Installation successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 You can now run:" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "   npm cache clean --force" -ForegroundColor White
    Write-Host "   npm install --omit=optional --legacy-peer-deps" -ForegroundColor White
    Write-Host ""
}
