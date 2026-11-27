# Progress

Session notes, newest last. The `handoff` skill appends entries; the harness shows the last 40 lines at session start.

## 2026-11-27 harness dogfood: gate config and stop search tests
- Done: gate config merged (PR #90, 3016a37; CI on main passed). 52 `StopSearchQuery` test cases in this change. Gate seen blocking a failing unit test and a compile error in an Api file
- In progress: nothing applied beyond that. A draft plan to run the Docker-free integration tests in the gate is local only (`.harness/plans/2026-11-27-skip-docker-tests-in-gate.md`, uncommitted, awaiting approval)
- Next: approve or drop that plan; if approved, start with its step 1 (`DockerTraitRuleTests.cs`)
- Open: the web test filter misses non-source files its tests read (`Docs/`, `CHANGELOG.md`, `.githooks/`, CSS, HTML); jest/vitest without `node_modules` untried; search quirks (accents split words, `Andrew's` becomes `andrew`, `s`)
- Gotchas: bare `dotnet test` fails without Docker (121 tests). The gate builds the solution but runs only UnitTests. `init --force-config` would restore bare `dotnet test`
