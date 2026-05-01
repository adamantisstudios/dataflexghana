#!/bin/bash

# Build Error Checker
# Runs Next.js build and extracts all TypeScript errors
# Run locally: bash scripts/check-build-errors.sh

echo "🔍 Running Next.js build to check for TypeScript errors...\n"

# Run next build and capture output
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    BUILD_CMD="pnpm exec next build"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    BUILD_CMD="npm run build"
elif command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    BUILD_CMD="yarn build"
else
    echo "❌ No package manager found. Please install pnpm, npm, or yarn."
    exit 1
fi

echo "📦 Using package manager: $PKG_MANAGER\n"

# Run build and pipe output
BUILD_OUTPUT=$($BUILD_CMD 2>&1)
BUILD_EXIT_CODE=$?

# Extract type errors
echo "📋 Type Errors Found:"
echo "===================="

TYPE_ERRORS=$(echo "$BUILD_OUTPUT" | grep -E "Type error:|error TS" | sort | uniq)

if [ -z "$TYPE_ERRORS" ]; then
    echo "✅ No type errors detected!"
else
    echo "$TYPE_ERRORS" | while IFS= read -r error; do
        echo "  ⚠️  $error"
    done
fi

# Extract the file and line information
echo "\n📍 Detailed Errors:"
echo "===================="

DETAILED_ERRORS=$(echo "$BUILD_OUTPUT" | grep -B 2 "Type error:" | grep -E "\.tsx?:|Type error:" | sort | uniq)

if [ ! -z "$DETAILED_ERRORS" ]; then
    echo "$DETAILED_ERRORS"
else
    # If no detailed errors, show the full build output related to errors
    echo "$BUILD_OUTPUT" | grep -E "error|Error" | head -20
fi

echo "\n🔧 Common Issues to Fix:"
echo "========================"
echo "  1. Remove unused imports: import X from 'Y' (but X is never used)"
echo "  2. Remove unused interfaces: interface X { ... } (but X is never used)"
echo "  3. Remove unused types: type X = ... (but X is never used)"
echo "  4. Fix prop typing issues in React.createElement()"
echo "  5. Ensure all props are properly typed in component interfaces"

echo "\n💡 Next Steps:"
echo "=============="
echo "  1. Review the errors above"
echo "  2. Remove unused declarations"
echo "  3. Fix type mismatches"
echo "  4. Run this script again to verify"

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "\n✅ Build succeeded!"
    exit 0
else
    echo "\n❌ Build failed. Fix the errors above and try again."
    exit 1
fi
