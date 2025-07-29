# PRP: {{FEATURE_NAME}}

## Goal
[Describe what this feature should accomplish in 1-2 sentences]

## Business Value
[Explain why this feature is important and what value it provides]

## Context
### Current State
[Describe the current state of the system relevant to this feature]

### Target State
[Describe how the system should work after implementing this feature]

### Technical Constraints
- [List any technical limitations or requirements]
- [Framework/library constraints]
- [Performance requirements]

## Implementation Blueprint
### Components
1. **Component Name**
   - Purpose: [What it does]
   - Location: [Where in the codebase]
   - Dependencies: [What it depends on]

### Data Flow
```
[User Action] → [Component] → [Service] → [Database]
```

### Key Functions
```typescript
// Example function signatures
function featureName(params: Type): ReturnType {
  // Implementation notes
}
```

## Acceptance Criteria
- [ ] User can [specific action]
- [ ] System [specific behavior]
- [ ] Error handling for [edge case]
- [ ] Tests cover [specific scenarios]

## Testing Scenarios
1. **Happy Path**
   - Given: [Initial state]
   - When: [Action taken]
   - Then: [Expected result]

2. **Edge Case**
   - Given: [Edge condition]
   - When: [Action taken]
   - Then: [Expected handling]

## Dependencies
- External APIs: [List any]
- Libraries: [Required packages]
- Services: [Docker services needed]

## Notes
[Any additional context or considerations]