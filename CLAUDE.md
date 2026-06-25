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
| Backend | .NET 8 C# Minimal API |
| Database | PostgreSQL |
| Auth | None in v1 |

## Monorepo Layout

```
apps/
  mobile/    → React Native app
  backend/   → C# .NET API
Docs/        → Guides and API references
.claude/     → Claude skills and config
```

## Skills

| Skill | When to use |
|---|---|
| `/ui` | Before building any screen, component, or layout — loads the full design system and component rules |

## Hard Rules (never violate without asking)

- Do not change the colour palette defined in `mobile/src/shared/theme/colors.ts`
- Do not add a third-party UI component library (Tamagui, NativeBase, etc.)
- Do not create a new screen without a matching feature folder under `mobile/src/features/`
- Do not expose the LTA AccountKey in mobile code — all LTA calls go through the C# backend
- Bus stop codes are always `String`, never `Number`
- All LTA Bus Arrival calls must use the v3 endpoint
- Do not add features outside the v1 scope defined in the app guide
