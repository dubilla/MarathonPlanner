## Code Organization

### Service Naming Convention
- Services should use verb-oriented naming that clearly describes their primary action
- Use singular nouns with action verbs: `PlanCreator`, `PlanAnalyzer`, `DataValidator`, etc.
- Avoid generic suffixes like "Service" - the verb should make the purpose clear
- Examples:
  - ✅ `PlanCreator` - creates training plans
  - ✅ `PlanAnalyzer` - analyzes existing plans
  - ❌ `PlanCreationService` - redundant "Service" suffix
  - ❌ `PlanService` - too generic, unclear purpose

## Testing
- We write unit tests for our application code.
- We sparingly write integration tests for critical workflows.
- We only write tests for our code, and specifically avoid writing tests for third-party dependencies.

## Workflows
- We practice test driven development. Before writing any application code, we should write the tests. We should then run the tests and see them failing. Then we should write the application code to get the tests passing. We should work hard at writing the application code before revisiting the tests and considering rewriting them.
- We run npm run test after lots of code changes.
- We run npm run lint after lots of code changes.
- We run npm run type-check after lots of of code changes.

- Use restful routes
- When testing forms with both HTML5 and JavaScript validation, test HTML5 validation by checking element attributes
  (like required, minLength) and test JavaScript validation by filling forms enough to pass HTML5 validation so your
  custom validation logic can execute.
- Use npm run fix-all to run prettier after making changes
- The todo list is at TODO.md