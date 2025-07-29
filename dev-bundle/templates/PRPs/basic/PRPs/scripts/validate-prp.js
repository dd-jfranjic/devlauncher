#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const requiredSections = [
  '## Goal',
  '## Business Value',
  '## Context',
  '## Implementation Blueprint',
  '## Acceptance Criteria',
  '## Testing Scenarios'
];

function validatePRP(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];

  // Check for required sections
  requiredSections.forEach(section => {
    if (!content.includes(section)) {
      errors.push(`Missing required section: ${section}`);
    }
  });

  // Check for empty sections
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      if (i + 1 < lines.length && lines[i + 1].trim() === '' && 
          (i + 2 >= lines.length || lines[i + 2].startsWith('#'))) {
        errors.push(`Empty section: ${lines[i]}`);
      }
    }
  }

  // Check for acceptance criteria
  if (!content.includes('- [ ]')) {
    errors.push('No acceptance criteria checkboxes found');
  }

  // Report results
  if (errors.length === 0) {
    console.log(`✅ PRP validation passed: ${path.basename(filePath)}`);
    return true;
  } else {
    console.error(`❌ PRP validation failed: ${path.basename(filePath)}`);
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: validate-prp.js <prp-file.md>');
    process.exit(1);
  }

  const isValid = validatePRP(args[0]);
  process.exit(isValid ? 0 : 1);
}

module.exports = { validatePRP };