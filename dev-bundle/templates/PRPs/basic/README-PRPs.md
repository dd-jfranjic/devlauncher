# PRPs (Product Requirement Prompts) Guide

## What are PRPs?
PRPs are structured documents that provide comprehensive context for AI-assisted development. They combine:
- Product requirements (like a PRD)
- Technical implementation details
- Codebase intelligence
- Validation criteria

## Using PRPs in This Project

### 1. Generate a New PRP
```bash
node PRPs/scripts/generate-prp.js "User Authentication" "Implement secure login system"
```

### 2. Validate a PRP
```bash
node PRPs/scripts/validate-prp.js PRPs/user-authentication.md
```

### 3. With Claude Code
```bash
# Generate PRP through Claude
claude /prp "Implement user authentication with JWT"

# Execute a PRP
claude /execute PRPs/user-authentication.md
```

## PRP Structure
Every PRP should include:
- **Goal**: Clear objective
- **Business Value**: Why it matters
- **Context**: Current and target state
- **Implementation Blueprint**: Technical approach
- **Acceptance Criteria**: Definition of done
- **Testing Scenarios**: How to verify

## Best Practices
1. **One Feature Per PRP**: Keep PRPs focused
2. **Be Specific**: Include exact file paths and function names
3. **Include Examples**: Code snippets help AI understand intent
4. **Update as You Go**: PRPs are living documents

## Templates
- `feature-prp.md` - Standard feature implementation
- `bugfix-prp.md` - Bug fix documentation
- `refactor-prp.md` - Code refactoring plans

## Workflow
1. Create PRP before starting work
2. Review and refine with team
3. Use as reference during implementation
4. Update based on discoveries
5. Archive completed PRPs