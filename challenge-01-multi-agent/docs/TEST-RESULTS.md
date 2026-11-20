# Test results

Recorded on 2026-11-20.

- Node.js v22.23.5
- npm 10.9.9
- Working directory: `challenge-01-multi-agent`
- No model key was loaded

## `npm test`

Command: `node --experimental-strip-types --test tests/*.test.ts`

```
# tests 19
# suites 0
# pass 19
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 149.2866
```

Passed cases:

1. snapshot roundtrip preserves the graph and isolates mutations
2. invalid edges, duplicate IDs and invalid positions are rejected
3. import rejects unsupported versions, self-links and duplicate edge IDs
4. bundled sample image survives JSON roundtrip but remote images are rejected
5. single-agent mock is deterministic and does not mutate its input
6. invalid requests stop before any tool call
7. tool failure is explicit and produces no successful result
8. roles hand off in parallel and stop before an unapproved export
9. retrieval failure stops downstream roles and bounds retries
10. timeout budget blocks a role without exporting
11. conflict and hostile canvas text do not authorize a side effect
12. scoped approval is required and recovery does not repeat a committed export
13. an uncertain export survives restart without a second effect
14. requirement changes invalidate old approvals
15. cancellation prevents later tools and recovery keeps it cancelled
16. memory is revisable and stays separate from retrieved documents
17. invalid input and secrets do not become tool authority
18. a reloaded file store does not repeat the export
19. retrieval stays inside the requested project

## `npm run typecheck`

Command: `tsc --noEmit`

Exit code 0. No type errors.
