## Testing
- We write unit tests for our application code.
- We sparingly write integration tests for critical workflows.
- We only write tests for our code, and specifically avoid writing tests for third-party dependencies.

## Workflows
- We run npm run test after lots of code changes.
- We run npm run lint after lots of code changes.
- We run npm run type-check after lots of of code changes.

- Use restful routes
- When testing forms with both HTML5 and JavaScript validation, test HTML5 validation by checking element attributes 
  (like required, minLength) and test JavaScript validation by filling forms enough to pass HTML5 validation so your 
  custom validation logic can execute.