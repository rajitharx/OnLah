# OnLah UI Skill

> **Scope.** These rules cover `apps/mobile` (React Native, Expo). They do not apply to `apps/web` (Vite and React). The web app uses plain CSS in `apps/web/src/app/styles.css`, with palette tokens mirrored from `apps/mobile/src/shared/theme/colors.ts`. Its conventions are in `apps/web/README.md`.

You are building UI for the OnLah app. Apply every rule below without exception. If a rule conflicts with a user request, flag the conflict before proceeding.

---

## Stack

- React Native with TypeScript
- Expo managed workflow
- No third-party UI library — all components are hand-rolled
- `StyleSheet.create()` for all styles — no inline style objects
- `expo-font` for custom font loading
- `@expo/vector-icons` for icons (Feather set preferred)

---

## File Placement

| What | Where |
|---|---|
| Reusable primitive (used in 2+ features) | `apps/mobile/src/shared/components/` |
| Feature-specific component | `mobile/src/features/<feature>/` |
| Screen | `mobile/src/features/<feature>/<Name>Screen.tsx` |
| Data hook | `mobile/src/features/<feature>/use<Name>.ts` |
| Theme token | `apps/mobile/src/shared/theme/` |
| Utility / formatter | `apps/mobile/src/shared/utils/` |

Always import theme tokens — never hardcode colour hex values or pixel sizes in a component file.

---

## Design System

### Colours

Import from `apps/mobile/src/shared/theme/colors.ts`:

```ts
colors.background   // #0D0D0D  near-black app background
colors.surface      // #1A1A1A  card / tile background
colors.accent       // #F5ECD7  warm cream — primary interactive
colors.muted        // #666666  secondary / placeholder text
colors.border       // #2A2A2A  subtle dividers
colors.crowdGreen   // #4CAF50  SEA — seats available
colors.crowdAmber   // #FF9800  SDA — standing available
colors.crowdRed     // #F44336  LSD — limited standing
colors.white        // #FFFFFF  high-emphasis text only
```

### Typography

Import from `apps/mobile/src/shared/theme/typography.ts`:

```ts
typography.etaNumber     // JetBrains Mono Bold, 28
typography.stopName      // System semibold, 16
typography.serviceBadge  // JetBrains Mono Regular, 14
typography.body          // System regular, 14
typography.caption       // System regular, 12, muted colour
```

All `Text` components must include `allowFontScaling={true}`.

### Spacing

Import from `apps/mobile/src/shared/theme/spacing.ts`. Use the 4-point grid:

```ts
spacing.xs   // 4
spacing.sm   // 8
spacing.md   // 16
spacing.lg   // 24
spacing.xl   // 32
spacing.xxl  // 48
```

Never hardcode padding/margin numbers in a component.

---

## Aesthetic Rules

- **Dark-first.** Every screen uses `colors.background` as the root background. Never use white or light backgrounds.
- **Split-flap departure board vibe.** Bus timing tiles are dark (`colors.surface`), text is high-contrast white or warm cream.
- **Warm cream is the accent, not blue.** Use `colors.accent` (#F5ECD7) for interactive elements, selected states, and primary labels.
- **Cards breathe.** Tiles have at least `spacing.md` (16) padding on all sides.
- **No drop shadows on dark backgrounds.** Use a subtle `colors.border` border instead.
- **No modals for transient info.** Disruption banners, loading states, and advisories are inline — not modal sheets.

---

## Component Rules

### Touchables
- Always use `Pressable`, not `TouchableOpacity`
- Every `Pressable` must have a pressed state: `style={({ pressed }) => [styles.base, pressed && styles.pressed]}`
- Pressed style: `opacity: 0.7` minimum; prefer a subtle background shift

### Lists
- Use `FlatList` for any list longer than 5 items
- Always provide `keyExtractor`
- Always provide `ItemSeparatorComponent` using a thin `colors.border` line

### Loading States
- No full-screen spinners. Use skeleton tiles (grey `colors.surface` placeholder shapes)
- The freshness timestamp ("Updated 5s ago") replaces loading indicators on auto-refresh

### Error States
- Inline error message below the affected section, not a toast or modal
- Error text uses `colors.crowdRed`, caption size

### Empty States
- Always show a message when a list is empty — never a blank screen
- Empty state: icon (Feather) + single line of muted text, centred in the available space

---

## Naming Conventions

```
Screens:      <Feature>Screen.tsx         (ArrivalScreen, NearbyScreen)
Components:   <Noun><Role>.tsx            (BusArrivalRow, CrowdBadge, StopCard)
Hooks:        use<Resource>.ts            (useArrivals, useFavourites)
Stores:       <resource>Store.ts          (favouritesStore, disruptionStore)
Types:        camelCase interfaces         (BusArrival, BusStop, TrainAlert)
```

---

## What NOT to Do

- No inline style objects — `StyleSheet.create()` only
- No hardcoded hex values or pixel numbers in component files
- No `flex: 1` on every element — be deliberate about flex usage
- No `margin` on root `View` — use `padding` on the parent container
- No `console.log` left in committed component code
- No `any` TypeScript type — always type props and return values explicitly
- No navigation logic inside a component — pass callbacks as props or use a hook
