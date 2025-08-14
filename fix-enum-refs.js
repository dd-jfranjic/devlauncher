const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'server/src/api/projects.ts',
  'server/src/domain/validation.ts',
  'server/src/services/docker-service.ts',
  'server/src/services/template-engine.ts'
];

const replacements = [
  // Replace enum value access with Values object
  [/ProjectStatus\.STOPPED/g, 'ProjectStatusValues.STOPPED'],
  [/ProjectStatus\.RUNNING/g, 'ProjectStatusValues.RUNNING'],
  [/ProjectStatus\.ERROR/g, 'ProjectStatusValues.ERROR'],
  [/ProjectType\.BLANK/g, 'ProjectTypeValues.BLANK'],
  [/ProjectType\.NEXTJS/g, 'ProjectTypeValues.NEXTJS'],
  [/ProjectType\.WORDPRESS/g, 'ProjectTypeValues.WORDPRESS'],
  [/ProjectLocation\.WINDOWS/g, 'ProjectLocationValues.WINDOWS'],
  [/ProjectLocation\.WSL/g, 'ProjectLocationValues.WSL'],
  [/TaskType\.INSTALL_CLAUDE/g, 'TaskTypeValues.INSTALL_CLAUDE'],
  [/TaskType\.INSTALL_GEMINI/g, 'TaskTypeValues.INSTALL_GEMINI'],
  [/TaskType\.SMOKE_TEST/g, 'TaskTypeValues.SMOKE_TEST'],
  [/TaskStatus\.QUEUED/g, 'TaskStatusValues.QUEUED'],
  [/TaskStatus\.RUNNING/g, 'TaskStatusValues.RUNNING'],
  [/TaskStatus\.SUCCESS/g, 'TaskStatusValues.SUCCESS'],
  [/TaskStatus\.FAILED/g, 'TaskStatusValues.FAILED'],
  
  // Replace Object.values(enum) patterns
  [/Object\.values\(ProjectType\)/g, 'Object.values(ProjectTypeValues)'],
  [/Object\.values\(ProjectLocation\)/g, 'Object.values(ProjectLocationValues)'],
  [/Object\.values\(ProjectStatus\)/g, 'Object.values(ProjectStatusValues)'],
  [/Object\.values\(TaskType\)/g, 'Object.values(TaskTypeValues)'],
  [/Object\.values\(TaskStatus\)/g, 'Object.values(TaskStatusValues)']
];

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Apply all replacements
    replacements.forEach(([pattern, replacement]) => {
      content = content.replace(pattern, replacement);
    });
    
    // Check if we need to add Values imports
    if (content.includes('Values.') && !content.includes('Values,') && !content.includes('Values }')) {
      // Find the imports from domain/types
      const importMatch = content.match(/from ['"]\.\.\/domain\/types['"]/);
      if (importMatch) {
        // Add the Values imports
        const valuesToImport = [];
        if (content.includes('ProjectTypeValues')) valuesToImport.push('ProjectTypeValues');
        if (content.includes('ProjectLocationValues')) valuesToImport.push('ProjectLocationValues');
        if (content.includes('ProjectStatusValues')) valuesToImport.push('ProjectStatusValues');
        if (content.includes('TaskTypeValues')) valuesToImport.push('TaskTypeValues');
        if (content.includes('TaskStatusValues')) valuesToImport.push('TaskStatusValues');
        
        if (valuesToImport.length > 0) {
          // Find and update the import statement
          content = content.replace(
            /from ['"]\.\.\/domain\/types['"]/,
            `,\n  ${valuesToImport.join(',\n  ')}\n} from '../domain/types';\n\n// Additional import to fix type-only import issue\nimport type { _DummyType`
          );
          // Then remove the dummy type import
          content = content.replace(/\n\/\/ Additional import to fix type-only import issue\nimport type { _DummyType.*?from '\.\.\/domain\/types';/, '');
          
          // Better approach - add them to existing import
          const importRegex = /(import\s*{\s*[\s\S]*?)\s*}\s*from\s*['"]\.\.\/domain\/types['"]/;
          content = content.replace(importRegex, (match, p1) => {
            return `${p1},\n  ${valuesToImport.join(',\n  ')}\n} from '../domain/types'`;
          });
        }
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('Enum references fixed!');