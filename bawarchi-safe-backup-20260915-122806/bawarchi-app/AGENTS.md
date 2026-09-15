<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Bawarchi reliability rules

- Keep existing routes and working Tables, Menu, and Orders behavior intact.
- Do not swallow errors or render empty fallback pages. Use the shared error/logging utilities and route error boundaries.
- Run `npm run typecheck`, `npm run lint`, `npm run build`, and relevant smoke tests after changes; verify live routes too.
- Never reset or delete database data. Prisma changes must be deliberate, migrated, and backward-compatible.
- Serialize Prisma Decimal, Date, and other database values before passing data to Client Components or API responses.
- API errors must use the shared `{ success: false, error: { code, message } }` contract without secrets or stack traces.
