# Bawarchi development rules

- Preserve all existing working routes and business behavior. Do not redesign or replace the UI as part of reliability work.
- Never hide runtime errors with an empty page, silent fallback, or broad catch. Surface a safe, useful error state and log unexpected failures.
- After code changes, run `npm run typecheck`, `npm run lint`, `npm run build`, and the relevant tests. Exercise the actual browser routes, not only compilation.
- Never reset, truncate, delete, or replace production or development database data to make a change pass.
- Prisma schema changes must be deliberate, backward-compatible, and accompanied by the appropriate migration. Never change Prisma versions without explicit approval.
- Never pass Prisma `Decimal`, `Date`, or other database-specific objects directly into Client Components. Serialize Decimal values as strings and Date values as ISO strings before crossing Server/Client boundaries.
- API routes must return predictable success and error shapes. Do not expose stack traces, credentials, connection strings, tokens, or other secrets to clients.
- Preserve historical records and existing business data when changing models, queries, or workflows.
- Validate environment-dependent behavior with a live application route and report any remaining infrastructure prerequisites explicitly.
