const fs = require('fs');
const path = require('path');
const glob = require('glob'); // you may need to install glob: npm install glob

// ---------- Configuration ----------
const targetFiles = [
  'app/no-registration/page.tsx', // adjust if your page is elsewhere
  ...glob.sync('components/no-registration/**/*.tsx'), // all sub-components
];

// ---------- Helper ----------
function processClassName(originalClassValue) {
  const classes = originalClassValue.split(/\s+/).filter(Boolean);
  const hasMaxWidth = classes.some(c => c.startsWith('max-w-'));

  if (!hasMaxWidth) return originalClassValue; // nothing to change

  // Remove all max-w-* and mx-auto
  const cleaned = classes.filter(c => !c.startsWith('max-w-') && c !== 'mx-auto');

  // Add w-full if not already present
  if (!cleaned.includes('w-full')) {
    cleaned.unshift('w-full');
  }

  return cleaned.join(' ');
}

// ---------- Main ----------
function fixFile(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Match className="..." and className='...'
  const regex = /className="([^"]*)"|className='([^']*)'/g;
  content = content.replace(regex, (match, doubleQuoted, singleQuoted) => {
    const original = doubleQuoted ?? singleQuoted;
    const newClasses = processClassName(original);
    if (newClasses !== original) {
      modified = true;
      const quote = doubleQuoted !== undefined ? '"' : "'";
      return `className=${quote}${newClasses}${quote}`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Fixed`);
  } else {
    console.log(`  ⏭️  No max-w classes found`);
  }
}

// ---------- Run ----------
targetFiles.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  } else {
    console.warn(`⚠️  File not found: ${fullPath}`);
  }
});

console.log('\nDone! All width constraints removed and replaced with w-full.');