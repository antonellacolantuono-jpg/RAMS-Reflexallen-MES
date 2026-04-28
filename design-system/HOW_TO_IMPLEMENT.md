# Design System — How to Implement

> **Type**: Implementation guide for Claude Code
> **Source**: Claude Design handoff bundle (`design-system/source/`)
> **Target**: Next.js 14 + Tailwind CSS + shadcn/ui (per CLAUDE.md tech stack)
> **Last updated**: 2026-04-27

---

## 🎯 Purpose of this file

This file bridges the gap between:
- **Claude Design's handoff** (HTML/CSS/JSX prototypes in `source/`)
- **Our production stack** (Next.js 14 + Tailwind CSS + shadcn/ui)

The handoff README (`source/README.md`) tells coding agents to "recreate pixel-perfectly in 
whatever technology fits the target codebase". This file is **that translation guide**.

---

## 📋 What's in `source/`

The handoff contains a complete design system:

### Core design tokens
- `source/styles/tokens.css` — All design tokens (colors OKLCH, fonts, spacing, density)
- `source/styles/glass.css` — Glass morphism effects (used in HMI mode)

### Visual identity
- `source/assets/fonts/` — Avenir Next Cyr (5 weights: Regular 400, Medium 500, Demi 600, Bold 700, Heavy 800)
- `source/assets/brand/` — 10 SVG logos (Reflexallen + RAMS, light + dark variants)

### Components & screens (reference for implementation)
- `source/primitives.jsx` — Base components (Button, Input, Card, Badge, etc.)
- `source/design-system.jsx` — Full design system showcase
- `source/design-system-views.jsx` — Multiple views/states
- `source/design-system-dashboard.jsx` — Dashboard layout
- `source/screens-1.jsx` to `source/screens-6-misc.jsx` — Screen mockups

### Special features
- Light mode AND Dark mode
- Density modes (dense/normal/spacious)
- HMI mode (touch-optimized: row-h 56px, font 15px, touch targets 48×48px)
- Phase colors per production phase (Inbound, Setup, Production, QC, Outbound, Teardown)
- Status colors calibrated for shop floor visibility

---

## 🏗️ Implementation strategy

### Step 1 — Read the handoff first
Before writing any UI code:

1. Read `design-system/source/README.md` (Claude Design instructions)
2. Read `design-system/source/Design System.html` in full (THE primary file)
3. Read `design-system/source/styles/tokens.css` (all design tokens)
4. Skim `design-system/source/primitives.jsx` (base component patterns)
5. Skim relevant `screens-*.jsx` for the prompt you're working on

### Step 2 — Translate tokens to Tailwind config

The handoff uses CSS custom properties (`--paper`, `--ink`, `--accent`, etc.). Tailwind needs them mapped:

#### Approach A — Use CSS variables in Tailwind (recommended)

In `apps/web/tailwind.config.ts` (and `apps/hmi/`):

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind utility classes
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        'paper-3': 'var(--paper-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        'ink-4': 'var(--ink-4)',
        line: 'var(--line)',
        'line-2': 'var(--line-2)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        'accent-soft': 'var(--accent-soft)',
        'accent-ink': 'var(--accent-ink)',
        ok: 'var(--ok)',
        'ok-soft': 'var(--ok-soft)',
        'ok-ink': 'var(--ok-ink)',
        warn: 'var(--warn)',
        'warn-soft': 'var(--warn-soft)',
        'warn-ink': 'var(--warn-ink)',
        bad: 'var(--bad)',
        'bad-soft': 'var(--bad-soft)',
        'bad-ink': 'var(--bad-ink)',
        info: 'var(--info)',
        'info-soft': 'var(--info-soft)',
        'info-ink': 'var(--info-ink)',
        neutral: 'var(--neutral)',
        'neutral-soft': 'var(--neutral-soft)',
        // Phase colors
        'c-inbound': 'var(--c-inbound)',
        'c-setup': 'var(--c-setup)',
        'c-production': 'var(--c-production)',
        'c-qc': 'var(--c-qc)',
        'c-outbound': 'var(--c-outbound)',
        'c-teardown': 'var(--c-teardown)',
      },
      borderRadius: {
        '1': 'var(--r-1)',  // 3px
        '2': 'var(--r-2)',  // 5px
        '3': 'var(--r-3)',  // 8px
        'pill': 'var(--r-pill)',
      },
      spacing: {
        'gap-1': 'var(--gap-1)',  // 4px
        'gap-2': 'var(--gap-2)',  // 8px
        'gap-3': 'var(--gap-3)',  // 12px
        'gap-4': 'var(--gap-4)',  // 16px
        'gap-5': 'var(--gap-5)',  // 24px
        'gap-6': 'var(--gap-6)',  // 32px
      },
      fontFamily: {
        sans: ['Avenir Next Cyr', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Base size from tokens.css is 13px
        xs: ['10.5px', '1.4'],
        sm: ['12px', '1.45'],
        base: ['13px', '1.45'],
        lg: ['15px', '1.45'],
        xl: ['18px', '1.4'],
        '2xl': ['22px', '1.3'],
        '3xl': ['28px', '1.25'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

#### Approach B — Convert OKLCH to HSL (NOT recommended)

The handoff uses OKLCH which is more advanced. Converting loses precision. Stick with Approach A.

### Step 3 — Copy CSS files to apps

Copy the source CSS files to each frontend app:

```
design-system/source/styles/tokens.css  →  apps/web/src/styles/tokens.css
design-system/source/styles/tokens.css  →  apps/hmi/src/styles/tokens.css
design-system/source/styles/glass.css   →  apps/web/src/styles/glass.css
design-system/source/styles/glass.css   →  apps/hmi/src/styles/glass.css
```

Import them in the global stylesheet (`apps/web/src/styles/globals.css`):

```css
@import './tokens.css';
@import './glass.css';
@import 'tailwindcss';
```

### Step 4 — Copy fonts and brand assets

```
design-system/source/assets/fonts/   →  apps/web/public/fonts/
design-system/source/assets/fonts/   →  apps/hmi/public/fonts/
design-system/source/assets/brand/   →  apps/web/public/brand/
design-system/source/assets/brand/   →  apps/hmi/public/brand/
```

The font-face declarations in `tokens.css` already reference `../assets/fonts/`. Adjust paths after copy:

```css
/* Original in handoff */
src: url('../assets/fonts/AvenirNextCyr-Regular.woff2') format('woff2');

/* After copy to apps/web/src/styles/tokens.css */
src: url('/fonts/AvenirNextCyr-Regular.woff2') format('woff2');
```

### Step 5 — Implement primitives as React components

The handoff has `primitives.jsx` with base components. These should be implemented as React + TypeScript components in `packages/ui/src/components/`.

For each primitive in `source/primitives.jsx`:
1. Identify the component (Button, Input, Card, Badge, Dot, etc.)
2. Create a typed React version in `packages/ui/`
3. Use Tailwind classes mapped to design tokens
4. Match the visual output pixel-perfectly
5. Add proper TypeScript props
6. Add Storybook stories (optional, recommended)

Example — Button primitive:

```typescript
// packages/ui/src/components/Button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-2',
        secondary: 'border border-line bg-paper hover:bg-paper-2 text-ink',
        ghost: 'text-ink hover:bg-paper-2',
        danger: 'bg-bad text-white hover:bg-bad-ink',
      },
      size: {
        sm: 'h-7 px-2 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
        hmi: 'min-h-12 min-w-12 px-4 text-lg',  // touch target
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';
```

### Step 6 — Use screens as visual reference

`screens-*.jsx` files are NOT to be copied verbatim. They are **visual references** for what each
screen should look like. When implementing PROMPT_2, PROMPT_3, etc., refer to these for layout
and visual patterns.

Mapping:
- `screens-1.jsx` — Dashboard / Overview
- `screens-2.jsx` — Lists and detail views
- `screens-3-workflow.jsx` — Workflow Designer (use for PROMPT_3)
- `screens-4-registries.jsx` — Registries CRUD (use for PROMPT_2)
- `screens-5-hmi.jsx` — HMI shop floor (use for PROMPT_5)
- `screens-6-misc.jsx` — Miscellaneous views

When working on a specific PROMPT_X, **read the corresponding screens file first** to understand
the intended visual.

---

## 🌗 Light/Dark mode implementation

The handoff supports both modes via `[data-theme="dark"]` selector.

### Implementation in Next.js

Use `next-themes` package:

```bash
pnpm add next-themes
```

```typescript
// apps/web/src/app/layout.tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <ThemeProvider 
          attribute="data-theme"  // matches tokens.css selector
          defaultTheme="light"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 📐 Density modes implementation

The handoff supports `[data-density="dense|normal|spacious"]`. For our app:

### Default
- `apps/web/` → `data-density="normal"` (default)
- `apps/hmi/` → `data-mode="hmi"` (forces row-h 56px, font 15px)

### User toggle (V2 feature)
Add a toggle in user preferences (post-MVP).

---

## 🎨 Phase colors usage

The 6 phase colors map to MASTER_SPECIFICATION § 4 phase categories:

| Phase Category | Token | Use case |
|---|---|---|
| inbound_logistics | `--c-inbound` | Material reception, lot scanning |
| setup | `--c-setup` | Pre-production preparation |
| production | `--c-production` | Active manufacturing |
| quality_control | `--c-qc` | QC checks, FAI, lot quality |
| outbound_logistics | `--c-outbound` | Shipping, packaging completion |
| teardown | `--c-teardown` | Cleanup, reset, archival |

Example usage:

```typescript
function PhaseBadge({ category }: { category: PhaseCategory }) {
  const colorMap: Record<PhaseCategory, string> = {
    inbound_logistics: 'bg-c-inbound text-white',
    setup: 'bg-c-setup text-white',
    production: 'bg-c-production text-white',
    quality_control: 'bg-c-qc text-white',
    outbound_logistics: 'bg-c-outbound text-white',
    teardown: 'bg-c-teardown text-white',
  };
  
  return (
    <span className={cn('px-2 py-1 rounded-2 text-xs font-medium', colorMap[category])}>
      {category}
    </span>
  );
}
```

---

## 🔍 Status colors usage (shop floor calibrated)

Use these for status indicators across the app:

| Status | Tokens | Use case |
|---|---|---|
| OK / Success | `--ok`, `--ok-soft`, `--ok-ink` | Approved lots, passed tests, completed steps |
| Warning | `--warn`, `--warn-soft`, `--warn-ink` | Skills expiring soon, marginal results |
| Bad / Error | `--bad`, `--bad-soft`, `--bad-ink` | Failed tests, scrapped pieces, rejected lots |
| Info | `--info`, `--info-soft`, `--info-ink` | Informational messages, neutral status |

Soft variants (`--ok-soft`, `--bad-soft`, etc.) are for backgrounds.
Ink variants are for text on soft backgrounds.

Example:

```tsx
function StatusBadge({ status }: { status: 'ok' | 'warn' | 'bad' | 'info' }) {
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-2 text-xs font-medium',
      status === 'ok' && 'bg-ok-soft text-ok-ink',
      status === 'warn' && 'bg-warn-soft text-warn-ink',
      status === 'bad' && 'bg-bad-soft text-bad-ink',
      status === 'info' && 'bg-info-soft text-info-ink',
    )}>
      <span className={cn('dot mr-1', `bg-${status}`)} />
      {status}
    </span>
  );
}
```

---

## 🔤 Typography usage

The handoff defines clear typography hierarchy:

```css
/* From tokens.css base */
font-family: 'Avenir Next Cyr', ...
font-size: 13px;  /* base */
line-height: 1.45;
```

### Font weights available
- 400 Regular (body text)
- 500 Medium (slight emphasis)
- 600 Demi (subheadings, buttons)
- 700 Bold (headings)
- 800 Heavy (hero headings, rare)

### Special classes
- `.uppercase-label` — small uppercase tracking labels (10.5px, 600 weight, 0.06em letter-spacing)
- `.tabular` — tabular numerals (for tables, KPIs, counters)
- `.mono` — JetBrains Mono (for codes, IDs, monospace data)

---

## ✅ Implementation checklist for PROMPT_1

When executing PROMPT_1 (Foundation), ensure:

- [ ] All design system files copied from `design-system/source/` to appropriate locations
- [ ] `tokens.css` and `glass.css` imported in `apps/web/src/styles/globals.css`
- [ ] `tokens.css` and `glass.css` imported in `apps/hmi/src/styles/globals.css`
- [ ] Tailwind config in both apps maps CSS variables to utility classes
- [ ] Fonts in `apps/web/public/fonts/` and `apps/hmi/public/fonts/`
- [ ] Brand SVG logos in `apps/web/public/brand/` and `apps/hmi/public/brand/`
- [ ] `next-themes` installed in both apps for dark mode support
- [ ] HMI app sets `data-mode="hmi"` on root element
- [ ] At least 5 primitive components implemented in `packages/ui/`:
  - [ ] Button (variants: primary, secondary, ghost, danger)
  - [ ] Input
  - [ ] Card
  - [ ] Badge / StatusBadge / PhaseBadge
  - [ ] Skeleton (using `.skel` animation from tokens.css)
- [ ] All status and phase colors usable as Tailwind classes
- [ ] Verify visual: render a sample page with Button + Card + Badge using all variants

---

## ✅ Implementation checklist for PROMPT_2 (Registries)

When implementing CRUD UIs for the 13 registries:

- [ ] Read `design-system/source/screens-4-registries.jsx` for visual reference
- [ ] Use the layout patterns from screens-4 (list view, detail view, form view)
- [ ] Use phase colors where appropriate (e.g., for Cause Codes by category)
- [ ] DataTable component matches the dense table style from the handoff
- [ ] Forms use the input styling from primitives

---

## ✅ Implementation checklist for PROMPT_3 (Workflow Designer)

- [ ] Read `design-system/source/screens-3-workflow.jsx` for visual reference
- [ ] React Flow canvas styled to match the handoff aesthetic
- [ ] Phase nodes use `--c-*` colors per category
- [ ] 4-pane layout matches the wizard/palette/canvas/configurator structure
- [ ] Live preview component uses HMI mode styling (`data-mode="hmi"`)

---

## ✅ Implementation checklist for PROMPT_5 (HMI)

- [ ] Read `design-system/source/screens-5-hmi.jsx` for visual reference
- [ ] HMI app uses `data-mode="hmi"` always (no toggle)
- [ ] Touch targets minimum 48×48px (per `.hmi-touch` class)
- [ ] Larger font sizes (15px base, larger for primary actions)
- [ ] Glass effect optional for floating elements (use `glass.css`)

---

## 🚫 What NOT to do

- ❌ DO NOT modify the files in `design-system/source/` — they are read-only reference
- ❌ DO NOT copy `screens-*.jsx` verbatim — they are mockups, not production code
- ❌ DO NOT skip the OKLCH colors in favor of "easier" RGB — preserves perceptual accuracy
- ❌ DO NOT render `.html` files in browser unless explicitly asked
- ❌ DO NOT implement Avenir Next Cyr from a different source — use the woff2 files in handoff
- ❌ DO NOT use Inter or other "default" fonts as fallback for testing — fix the font path

---

## 🆘 Troubleshooting

### Font not loading
- Check the path in `tokens.css` `@font-face` declarations
- After copying to `public/fonts/`, the path should be `/fonts/AvenirNextCyr-Regular.woff2`
- Network tab should show 200 OK on font requests

### OKLCH not supported
- All modern browsers support OKLCH (Chrome 111+, Firefox 113+, Safari 15.4+)
- If targeting older browsers, add fallbacks via PostCSS

### Tailwind classes not working
- Ensure `content` array includes all `.tsx` files
- Restart dev server after changes to `tailwind.config.ts`
- Check that CSS variables are defined in `:root` and accessible

### Dark mode not toggling
- Verify `next-themes` is wrapped around root layout
- Check that `attribute="data-theme"` matches the selector in `tokens.css`
- Browser localStorage may have stale theme — clear and retry

---

## 📚 References

- [Claude Design](https://claude.ai/design) — where the handoff was generated
- [Tailwind CSS — Customizing Theme](https://tailwindcss.com/docs/theme)
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode for Next.js
- [OKLCH color picker](https://oklch.com/) — for understanding OKLCH values
- [class-variance-authority](https://cva.style/docs) — for typed variants in components

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial implementation guide for handoff bundle. |
