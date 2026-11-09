# OnLah — Claude Context

Read this file at the start of every session before touching any code.

## Key Documents

| Document | Purpose |
|---|---|
| `Docs/Claude/ONLAH_APP_GUIDE.md` | Authoritative app guide — features, architecture, API rules, design direction |
| `Docs/Claude/LTA_DATAMALL_API.md` | Full LTA DataMall API reference |

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + TypeScript (Expo managed workflow) |
| Navigation | React Navigation v6 |
| State | Zustand |
| Web | Vite + React + TypeScript (no UI component library) |
| Backend | .NET 10 C# Minimal API |
| Database | PostgreSQL |
| Auth | None in v1 |

## Monorepo Layout

```
apps/
  mobile/    → React Native app
  backend/   → C# .NET API
  web/       → Vite + React bus board website (design sample; reads the backend, never LTA)
Docs/        → Guides and API references
.claude/     → Claude skills and config
```

## Skills

| Skill | When to use |
|---|---|
| `/ui` | Before building any screen, component, or layout — loads the full design system and component rules |
| `/dotnet` | Before building any backend feature, endpoint, service, or test — loads .NET 10 architecture, TDD, security, and code style rules |

## Hard Rules (never violate without asking)

- Do not change the colour palette defined in `mobile/src/shared/theme/colors.ts`
- Do not add a third-party UI component library (Tamagui, NativeBase, etc.)
- Do not create a new screen without a matching feature folder under `mobile/src/features/`
- Do not expose the LTA AccountKey in mobile code — all LTA calls go through the C# backend
- Bus stop codes are always `String`, never `Number`
- All LTA Bus Arrival calls must use the v3 endpoint
- Do not add features outside the v1 scope defined in the app guide

## Rules and what enforces them

When the operator corrects you, fix the mistake and add its rule here. If the rule is already in this table and its Enforced by column says "nothing", that is a repeat: fix it at the highest level that works (architecture, then types, then a test, then docs) in the same change, and update the row. Drop a row once its mistake can no longer happen.

Run `npm run check` in `apps/mobile` or `apps/web` before pushing. CI runs the same command, plus `dotnet test` for the backend.

| Rule | Enforced by |
|---|---|
| Mobile: no inline style objects, no colour literals, no hardcoded spacing or `fontSize`, no `TouchableOpacity`, no `console.log`, no `any` | `apps/mobile/__tests__/designRules.test.ts`. The error names the token to use. An exception goes on the line as `// design-rule-exception: <rule> \| <reason> \| expires YYYY-MM-DD \| approved by <human>` and stops working at its expiry |
| Mobile typechecks and its tests pass | `npm run check` in `apps/mobile`, run by the `mobile` job in `.github/workflows/ci.yml` |
| Web builds and its tests pass | `npm run check` in `apps/web`, run by the `web` job in CI |
| Web release versions are unique, ordered by merge time, and match the changelog | `apps/web/src/features/release-notes/releases.test.ts` |
| The web version rises on every commit | `.githooks/pre-commit`. This is local only and is skipped in worktrees that never ran `npm install`, so CI does not check it |
| Palette in `colors.ts` unchanged, no third-party UI library, a new screen needs a feature folder | Nothing. Review only |
| No LTA AccountKey in mobile code, all LTA calls via the backend | Nothing. Review only |
| Bus stop codes are `String`, never `Number` | Nothing. Review only |
| Bus Arrival calls use the LTA v3 endpoint | Nothing. The path in `LtaBusClient.cs` has no test |
| Web CSS has no dead or duplicate rules | Nothing. Two checks were tried (unused class names, duplicate declarations) and neither catches the mistakes that were made, so this stays a review item |
