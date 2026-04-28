# PATCH — Design System Integration

> **Type**: Patch to be appended to PROMPT_1_FOUNDATION (after the SQLite patch)
> **Purpose**: Integrate the Claude Design handoff bundle into the build from day 1
> **Pre-requisite**: `design-system/` folder exists in repo with handoff bundle
> **Last updated**: 2026-04-27

---

## 📋 PATCH TO PASTE (after PROMPT_1_FOUNDATION + LOCAL DEV PATCH)

Copy this section and paste it AT THE END of your PROMPT_1 message, AFTER the LOCAL DEV PATCH.

```
═══════════════════════════════════════════════════════════════════════════════
DESIGN SYSTEM INTEGRATION PATCH
═══════════════════════════════════════════════════════════════════════════════

OVERRIDE/ADDITION: This build must integrate a Claude Design handoff bundle.

The bundle is located at design-system/source/ in the repo. It contains:
- styles/tokens.css — All design tokens (OKLCH colors, fonts, spacing, density)
- styles/glass.css — Glass morphism effects for HMI floating elements
- assets/fonts/ — Avenir Next Cyr (5 weights as woff2)
- assets/brand/ — 10 SVG logos (Reflexallen + RAMS, light + dark)
- primitives.jsx — Base components (Button, Input, Card, etc.) — REFERENCE ONLY
- screens-*.jsx — Screen mockups for various features — VISUAL REFERENCE ONLY

Implementation guide: design-system/HOW_TO_IMPLEMENT.md
Handoff README: design-system/source/README.md

ADDITIONAL READING (do BEFORE starting Phase 2 BUILD):
→ design-system/HOW_TO_IMPLEMENT.md (full)
→ design-system/source/README.md (full)
→ design-system/source/Design System.html (full — primary design)
→ design-system/source/styles/tokens.css (full)
→ design-system/source/primitives.jsx (skim — understand the patterns)

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL TASKS (add to your plan)
═══════════════════════════════════════════════════════════════════════════════

After all the standard PROMPT_1 + LOCAL_DEV_PATCH steps, add these:

A. COPY DESIGN SYSTEM ASSETS

   A.1 Copy CSS to apps:
       - design-system/source/styles/tokens.css → apps/web/src/styles/tokens.css
       - design-system/source/styles/tokens.css → apps/hmi/src/styles/tokens.css
       - design-system/source/styles/glass.css → apps/web/src/styles/glass.css
       - design-system/source/styles/glass.css → apps/hmi/src/styles/glass.css
   
   A.2 Copy fonts to apps:
       - design-system/source/assets/fonts/* → apps/web/public/fonts/
       - design-system/source/assets/fonts/* → apps/hmi/public/fonts/
   
   A.3 Copy brand assets to apps:
       - design-system/source/assets/brand/* → apps/web/public/brand/
       - design-system/source/assets/brand/* → apps/hmi/public/brand/
   
   A.4 Adjust font paths in copied tokens.css:
       - Original: src: url('../assets/fonts/AvenirNextCyr-Regular.woff2')
       - After:    src: url('/fonts/AvenirNextCyr-Regular.woff2')
       - Apply this transformation to ALL @font-face declarations
       - Do this for both apps/web/src/styles/tokens.css and apps/hmi/src/styles/tokens.css

B. CONFIGURE TAILWIND WITH DESIGN TOKENS

   B.1 In apps/web/tailwind.config.ts and apps/hmi/tailwind.config.ts:
       - Add color mappings to all CSS variables (--paper, --ink, --accent, --ok, --warn, --bad, --info, --c-inbound, --c-setup, --c-production, --c-qc, --c-outbound, --c-teardown, etc.)
       - Add borderRadius mapping (--r-1, --r-2, --r-3, --r-pill)
       - Add spacing mapping (--gap-1 through --gap-6)
       - Add fontFamily mapping (Avenir Next Cyr as sans, JetBrains Mono as mono)
       - See design-system/HOW_TO_IMPLEMENT.md "Step 2 — Translate tokens to Tailwind config" for the EXACT config to use
   
   B.2 Import tokens.css and glass.css in globals.css:
       In apps/web/src/styles/globals.css and apps/hmi/src/styles/globals.css:
       
       @import './tokens.css';
       @import './glass.css';
       @tailwind base;
       @tailwind components;
       @tailwind utilities;

C. CONFIGURE LIGHT/DARK MODE

   C.1 Install next-themes in both apps:
       - cd apps/web && pnpm add next-themes
       - cd apps/hmi && pnpm add next-themes
   
   C.2 Wrap RootLayout with ThemeProvider:
       - attribute="data-theme" (matches selector in tokens.css)
       - defaultTheme="light"
       - enableSystem
   
   C.3 For HMI app: set data-mode="hmi" on the root html element
       (this triggers HMI-specific tokens: row-h 56px, font-size 15px, touch targets)

D. IMPLEMENT BASE PRIMITIVES IN packages/ui/

   D.1 Read design-system/source/primitives.jsx for reference patterns
   
   D.2 Create these typed React components in packages/ui/src/components/:
       - Button (variants: primary, secondary, ghost, danger; sizes: sm, md, lg, hmi)
       - Input (with label, error states)
       - Card (with header, body, footer slots)
       - Badge (StatusBadge with status colors, PhaseBadge with phase colors)
       - Skeleton (using .skel animation from tokens.css)
       - Dot (using .dot class from tokens.css for status indicators)
       - StatusBadge (combines Badge + Dot for ok/warn/bad/info status)
       - PhaseBadge (combines Badge with phase colors for production phases)
   
   D.3 Each component:
       - TypeScript with proper props typing
       - Use class-variance-authority (cva) for variants
       - Use Tailwind classes mapped to design tokens
       - Match visual output of corresponding primitive in primitives.jsx
       - Export from packages/ui/src/index.ts
       - Add 5+ unit tests per component

E. CREATE SAMPLE LANDING PAGE

   E.1 Replace the stub apps/web home page with a "design system showcase":
       - Display all primitive components (Button, Input, Card, Badge, etc.)
       - Show all status colors (ok, warn, bad, info)
       - Show all phase colors (inbound, setup, production, qc, outbound, teardown)
       - Show light/dark mode toggle
       - Show density modes if applicable
       - Use Reflexallen logo
   
   E.2 Replace the stub apps/hmi home page with HMI demo:
       - Show login screen with badge + PIN keypad (touch optimized)
       - Use HMI mode (data-mode="hmi")
       - Demonstrate large touch targets

F. UPDATE TESTING

   F.1 Add visual smoke test:
       - Render Button with each variant
       - Render Card with content
       - Render StatusBadge with each status
       - Render PhaseBadge with each phase
       - All should render without console errors
   
   F.2 Add accessibility test:
       - All interactive elements have focus-visible styling
       - All status colors have sufficient contrast
       - HMI touch targets are >= 48×48px

═══════════════════════════════════════════════════════════════════════════════
WHAT STAYS THE SAME
═══════════════════════════════════════════════════════════════════════════════

All other instructions from PROMPT_1_FOUNDATION + LOCAL DEV PATCH apply:
- SQLite database (not PostgreSQL)
- In-memory cache (not Redis)
- Local filesystem storage (not MinIO)
- Synchronous queue (not BullMQ)
- 3 apps (api, web, hmi) — no apps/worker
- All v1.2 entities in Prisma schema
- Plan Mode: present plan before executing
- All other tech stack: NestJS, Next.js 14, Prisma, TypeScript strict, Zod, etc.

═══════════════════════════════════════════════════════════════════════════════
EXPECTED OUTCOME (after all 3 patches applied)
═══════════════════════════════════════════════════════════════════════════════

After this build:

Functional:
- pnpm install (works)
- pnpm prisma migrate dev (creates dev.db with all v1.2 entities)
- pnpm build (all packages compile)
- pnpm dev (starts api on :3000, web on :3001, hmi on :3002)

Visual:
- apps/web home page shows design system showcase with Reflexallen branding
- apps/hmi home page shows HMI login screen optimized for touch
- Light/dark mode toggle works on both apps
- Avenir Next Cyr font loads correctly
- All Tailwind classes for design tokens work (bg-accent, text-ok-ink, border-line, etc.)
- Logo SVG displays correctly
- Phase colors and status colors visible in showcase

Quality:
- TypeScript strict mode, no any types
- Components in packages/ui have tests passing
- Visual smoke test passes
- Accessibility checks pass

═══════════════════════════════════════════════════════════════════════════════
PRIORITY NOTES
═══════════════════════════════════════════════════════════════════════════════

1. The design system is FOUNDATIONAL. Get it right at PROMPT_1 stage.
   All subsequent prompts (PROMPT_2 through PROMPT_6) will build on top of these primitives.
   If the design system is wrong, every screen built later will need rework.

2. DO NOT modify files in design-system/source/. They are read-only reference.

3. DO NOT skip the OKLCH colors. They provide better perceptual accuracy than RGB.

4. DO NOT use "fallback" fonts like Inter while waiting to load Avenir Next Cyr.
   The fonts are bundled — fix the path immediately if not loading.

5. The screens-*.jsx files are VISUAL REFERENCES for future PROMPTS, not to be implemented now.
   Just make them available in design-system/source/ for future Claude Code sessions to read.

═══════════════════════════════════════════════════════════════════════════════

Apply all the above modifications to your foundation plan, in addition to the
SQLite patch. Present the FULLY MODIFIED PLAN and wait for my approval before
building.

START WITH THE FULLY MODIFIED PLAN.
```

(End of patch to paste)

---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### How to use this patch

When you're ready to lance PROMPT_1, you'll paste in Claude Code Desktop in this order:

1. The standard PROMPT_1 prompt (from `prompts/PROMPT_1_FOUNDATION.md`, the "PROMPT TO PASTE" section)
2. THEN the LOCAL DEV PATCH (from `prompts/PROMPT_1_PATCH_LOCAL_DEV.md`, the "PATCH TO PASTE" section)
3. THEN this DESIGN SYSTEM PATCH (the "PATCH TO PASTE" section above)

So you'll have **3 sections concatenated** in a single message to Claude Code.

### What changes vs PROMPT_1 + SQLite patch alone

| Aspect | PROMPT_1 + SQLite only | + Design System patch |
|---|---|---|
| Tailwind config | Generic shadcn/ui defaults | Mapped to handoff design tokens |
| Fonts | System fonts | Avenir Next Cyr from handoff |
| Colors | Default Tailwind palette | Custom OKLCH from handoff |
| Logo | None | Reflexallen + RAMS SVG logos |
| Theme | Light only | Light + Dark + HMI mode |
| Components | Plain shadcn/ui | Customized to match handoff |
| Web home page | Empty placeholder | Design system showcase |
| HMI home page | Empty placeholder | Login screen (touch optimized) |

### Estimated additional time

- Phase 1 plan reading: +5 min (read HOW_TO_IMPLEMENT.md)
- Phase 1 plan generation: +5 min (additional steps)
- Phase 2 build: +30 min (copy assets, configure Tailwind, implement primitives)

**Total impact**: ~40 minutes added to PROMPT_1 build (vs 1.5-2h base = 2-2.5h with all 3 patches)

### Why this patch is worth it

Without the design system integration:
- ❌ All UI built in PROMPT_2-6 will look generic
- ❌ Stakeholder demos will look like "another React app"
- ❌ When you finally integrate the design later, you have to redo all UIs

With this patch:
- ✅ Every component built rispects the design from day 1
- ✅ Stakeholder demos look professional and Reflexallen-branded
- ✅ No rework needed later

### What if Claude Code skips parts

If Claude Code says "I'll skip the Avenir Next Cyr font for now and use Inter", say:

> "No. The font is bundled in design-system/source/assets/fonts/. Use it. Fix the path if needed."

If Claude Code says "I'll convert OKLCH colors to HSL for compatibility":

> "No. All modern browsers support OKLCH. Keep the OKLCH values as-is."

If Claude Code says "screens-*.jsx files are too complex, I'll skip the showcase":

> "Showcase is required for E.1 of the design system patch. Build a simplified version if needed, but include all primitives."

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial design system integration patch. |
