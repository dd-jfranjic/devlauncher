#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generatePRP(featureName, description) {
  const template = fs.readFileSync(
    path.join(__dirname, '../templates/feature-prp.md'),
    'utf8'
  );

  const prp = template
    .replace(/{{FEATURE_NAME}}/g, featureName)
    .replace('[Describe what this feature should accomplish in 1-2 sentences]', description || '[TODO: Add description]');

  const fileName = featureName.toLowerCase().replace(/\s+/g, '-') + '.md';
  const filePath = path.join(process.cwd(), 'PRPs', fileName);

  // Ensure PRPs directory exists
  if (!fs.existsSync(path.join(process.cwd(), 'PRPs'))) {
    fs.mkdirSync(path.join(process.cwd(), 'PRPs'), { recursive: true });
  }

  fs.writeFileSync(filePath, prp);
  console.log(`✅ Generated PRP: ${filePath}`);
  return filePath;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: generate-prp.js "Feature Name" ["Optional description"]');
    process.exit(1);
  }

  generatePRP(args[0], args[1]);
}

module.exports = { generatePRP };