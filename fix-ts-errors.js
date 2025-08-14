const fs = require('fs');
const path = require('path');

// Fix docker-service.ts process variable conflict
const dockerServicePath = path.join('server', 'src', 'services', 'docker-service.ts');
let dockerServiceContent = fs.readFileSync(dockerServicePath, 'utf-8');

// Fix process variable name conflict
dockerServiceContent = dockerServiceContent.replace(
  /const process = spawn/g,
  'const childProc = spawn'
);
dockerServiceContent = dockerServiceContent.replace(
  /process\.stdout/g,
  'childProc.stdout'
);
dockerServiceContent = dockerServiceContent.replace(
  /process\.stderr/g,
  'childProc.stderr'
);
dockerServiceContent = dockerServiceContent.replace(
  /process\.on/g,
  'childProc.on'
);

// Also fix the env property issue
dockerServiceContent = dockerServiceContent.replace(
  'process.env',
  '(global as any).process.env'
);

fs.writeFileSync(dockerServicePath, dockerServiceContent);

// Fix template-engine.ts port assignment
const templateEnginePath = path.join('server', 'src', 'services', 'template-engine.ts');
let templateEngineContent = fs.readFileSync(templateEnginePath, 'utf-8');
templateEngineContent = templateEngineContent.replace(
  'ports[key] = allocation;',
  'ports[key] = allocation.port;'
);
fs.writeFileSync(templateEnginePath, templateEngineContent);

// Fix error-handler.ts Prisma error handling
const errorHandlerPath = path.join('server', 'src', 'middleware', 'error-handler.ts');
let errorHandlerContent = fs.readFileSync(errorHandlerPath, 'utf-8');
errorHandlerContent = errorHandlerContent.replace(
  'if (error instanceof Prisma.PrismaClientKnownRequestError)',
  'if ((error as any).code && typeof (error as any).code === \'string\')'
);
fs.writeFileSync(errorHandlerPath, errorHandlerContent);

// Fix request-logger.ts
const requestLoggerPath = path.join('server', 'src', 'middleware', 'request-logger.ts');
let requestLoggerContent = fs.readFileSync(requestLoggerPath, 'utf-8');

// Fix the id property
requestLoggerContent = requestLoggerContent.replace(
  'req.id',
  '(req as any).id'
);

// Fix the res.end assignment
requestLoggerContent = requestLoggerContent.replace(
  'res.end = function(chunk?: any, encoding?: any, cb?: any)',
  'const originalEnd = res.end;\n  res.end = function(chunk?: any, encoding?: any, cb?: any): Response'
);
requestLoggerContent = requestLoggerContent.replace(
  'originalEnd.call(res, chunk, encoding, cb);',
  'return originalEnd.call(res, chunk, encoding, cb) as Response;'
);

fs.writeFileSync(requestLoggerPath, requestLoggerContent);

console.log('TypeScript errors fixed!');