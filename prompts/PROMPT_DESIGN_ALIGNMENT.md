# PROMPT_DESIGN_ALIGNMENT — Allineamento full-app ai mockup Claude Design

> **Version**: v2 (post PROMPT_7 D1 merged)
> **Phase**: F1.7 (post hotfix seed cleanup, post PROMPT_7 D1, pre PROMPT_7_RESUME)
> **Effort target**: 6-12h Claude Code (variabile in base ai gap rivelati in D1)
> **Calendar**: 4-9 maggio 2026 (4-5 giorni)
> **Demo target**: Reflexallen S.p.A. — 18-22 maggio 2026
> **Baseline**: **770 tests cumulative** (post D1 merge `13b8dd9` on `origin/main`)
> **Test target**: floor 770 (no regressioni) / ideal +5-25 nuovi test visual + behavior + nuove route
> **Branch HEAD**: `13b8dd9 feat(prisma+workflow): persist Step.data JSON + recoveryConfig + photo + actionType (PROMPT_7 D1)`

---

## 1. Context

Il commitment originale del progetto era **design-first**: i mockup Claude Design sono la fonte di verità per layout, composition, screen behavior. Da loro è stato estratto il **DS_LIFT** (F1.1) — i tokens CSS + primitives React (Button, Card, Badge, StatusBadge, ViewSwitcher, RegistryTile, Tabs, Drawer, Modal, ecc.) — committato nel repo come `packages/ui` (`@mes/ui`) e fonte di verità per **primitives**.

Durante F1 abbiamo costruito 6 PROMPT (DS_LIFT + 3d + PNE 1-4) che hanno shippato funzionalità reali (workflow editor, mock device simulator, HMI WO journey, recovery flow, ecc.). Tutto funziona, **770 tests verdi** post-D1. **Ma**: l'allineamento layout/composition delle schermate implementate ai mockup originali non è mai stato verificato sistematicamente. Le schermate sono state costruite step-by-step usando i primitives DS, ma con composizioni inventate ad-hoc dove serviva andare avanti.

Inoltre, **PROMPT_7 D1 è stato mergiato** (commit `13b8dd9`) ma D2/D3/D4 di PROMPT_7 sono stati **deferred**:
- D2 (Registry detail/edit + ViewSwitcher universale) → **assorbito qui**
- D3 (Workstation Grid + WO BO 7-tab) → **assorbito qui**
- D4 (HMI runtime read recoveryConfig + pre-retry execution) → **deferred a PROMPT_7_RESUME** (1h CC futuro post-design alignment)

Questo PROMPT chiude i gap design + costruisce il rimanente UI in modo aligned dal primo colpo: **diff sistematico tra mockup e implementazione, refactor delle schermate, costruzione delle nuove schermate (assorbite da PROMPT_7 D2/D3) usando layout fedele al mockup**.

### Vincoli essenziali

1. **NESSUNA REGRESSIONE FUNZIONALE**. Tutto quello che funziona oggi deve continuare a funzionare. Il refactor è SOLO su layout/style/composition, NON su logica/state/API.
2. **USA SEMPRE il DS_LIFT esistente nel repo** (`packages/ui` → `@mes/ui`). Non inventare nuovi primitives. Se manca un primitive nel DS, ferma e chiedi.
3. **MOCKUP è fonte di verità per layout/composition**. DS_LIFT è fonte di verità per primitives/tokens.
4. **Gap funzionali = decisione utente**. Se mockup mostra una schermata o feature non implementata, NON implementarla automaticamente: report al utente per decisione scope-by-scope.
5. **D1 prerequisite is in place**: `Step.data` persistence pipeline è pronta (schema `Step.data String?` + `StepDataSchema` Zod + `parseStepData/buildSavePayload` helpers + `WorkOrderStepDto.data` projection). Quando refactori workflow editor o costruisci registry detail, usa questa pipeline esistente — non re-implementarla.

---

## 2. Goal

Dopo questo PROMPT:

### Allineamento layout

- Ogni schermata implementata (web back-office + HMI) ha layout/composition fedele al mockup corrispondente nei 4 link Claude Design
- Tutti i componenti usano DS_LIFT primitives
- Tutti i Tailwind classes hardcoded sono sostituiti da CSS variables o tokens DS dove appropriato
- Density spacious + 15px base font automatico in HMI (auto-flip via mode)
- Touch targets ≥44px in HMI

### Coerenza tipografica

- Avenir Next Cyr per UI text
- JetBrains Mono per codes (WO-2026-0142, ITM-FG-00042, BOX-PLT-001234)

### Status pattern

- Ogni status badge ha **dot + text** (color-blind safe)

### Schermate ex-PROMPT_7 D2/D3 nuove e aligned

- 11 registry detail/edit pages (assorbiti da PROMPT_7 D2):
  - Already CRUD complete: `items`, `workflows`, `auto-gen-rules` (3 — verify aligned to mockup)
  - List-only need detail/edit/new: `bom`, `equipment`, `recipes`, `skills`, `operators`, `cause-codes`, `attention-points`, `tools`, `box-types`, `boxes` (10)
- ViewSwitcher universale (List / Card / Flow) attivo dove applicabile per ogni registry
- Workstation Detail page (`/workstations/[id]`)
- WO Back-Office detail page (`/work-orders/[id]`) con 7 tab

### Gap funzionali tracciati

- Lista completa di feature/schermate mockup non implementate
- Per ognuna: decisione user-approved (implement now / PROMPT dedicato post / defer post-MVP)

### Tests

- Floor 770 mantenuto (nessuna regressione test esistenti)
- Target +5-25 nuovi test (visual regression + behavior + nuove route registry/WO/workstation)

---

## 3. Mockup sources — 4 link Claude Design

Claude Code deve fetchare i 4 link Claude Design via `web_fetch` tool durante D0:

| # | URL | Atteso (TBD da pre-flight) |
|---|---|---|
| 1 | `https://api.anthropic.com/v1/design/h/vAigZO4g7AuIKi_huYOzrw?open_file=index.html` | **MES Suite** — screens app intera |
| 2 | `https://api.anthropic.com/v1/design/h/y3-6VdbL4zXvtAtdjJK5Wg?open_file=Design+System.html` | **Design System** — primitives + tokens + design rules |
| 3 | `https://api.anthropic.com/v1/design/h/kUpvjL_wd4eu8vc_kikjlQ?open_file=index.html` | **TBD** — da scoprire in pre-flight |
| 4 | `https://api.anthropic.com/v1/design/h/gFrEOFdDB34KxtDHvcCANg?open_file=index.html` | **Handoff HMI dedicato** — operatore touch UI |

**Pre-flight responsibility (D0)**:

1. `web_fetch` ognuno dei 4 link
2. Leggi README / About / sidebar di ogni file per capire content
3. Identifica content-type, structure, screens contenuti
4. **Report**: 3-5 righe per ognuno descrivendo cosa contiene
5. **Stop** dopo questo report. Wait per user OK prima di procedere a D1.

Se `web_fetch` fallisce per uno dei link:
- Report subito quale link fallisce + errore esatto
- Wait per istruzioni utente (probabile fallback: utente scarica HTML manualmente e committa in repo `mockups/` directory)

---

## 4. Implementation plan — 5 D-increments

### D0 — Pre-flight + mockup discovery (15-30 min)

**Steps**:

1. Verify branch state: clean working tree on main, HEAD = `13b8dd9` (D1 PROMPT_7). If different, STOP.
2. Verify test baseline: `pnpm test` returns 770 passing. If lower, STOP.
3. Inventory DS_LIFT existing primitives in `packages/ui` (`@mes/ui`)
4. Inventory routes implementate (web + HMI)
5. Fetch i 4 link Claude Design + report 3-5 righe per ognuno
6. **STOP**: report sintetico (max 30 righe) → wait user OK

### D1 — Diff inventory + plan (1-1.5h)

Per ogni route + ogni schermata ex-PROMPT_7 D2/D3 da costruire, confronto con mockup. Categorizza in 5 buckets:

- **A. ALIGNED**: 1:1 col mockup, no work needed
- **B. REFACTOR UI**: logica OK, layout/style da allineare
- **C. AD-HOC**: implementata senza mockup di riferimento
- **D. MOCKUP-ONLY**: gap funzionale (non implementata)
- **E. BUILD ALIGNED** (ex-PROMPT_7 D2/D3): nuova schermata da costruire seguendo mockup

Output: report dettagliato markdown con effort per ogni schermata.

**STOP**: wait for user approval del piano.

### D2 — Refactor UI schermate B (3-5h)

Allinea schermate B preservando funzionalità:
- ❌ Non toccare logica state/handlers/API calls
- ✅ JSX/CSS/Tailwind only changes
- Run test esistenti: 100% pass (no regressioni)
- Commit per gruppo logico schermate

### D3 — Build aligned schermate E + gap D approvati (3-6h)

**E (ex-PROMPT_7)**:
- 10 registry detail/edit/new pages (bom, equipment, recipes, skills, operators, cause-codes, attention-points, tools, box-types, boxes)
- Workstation Detail Grid (`/workstations/[id]`)
- WO Back-Office 7-tab page (`/work-orders/[id]`)
- ViewSwitcher universale activation

**D (gap funzionali approvati)**:
- Solo schermate user-approved in D1
- Esempi possibili: Plant Overview dashboard, Andon wall view, Multi-Level Timer 3-level, Login keypad on-screen, Audio feedback, ecc.

### D4 — Closure (15-30 min)

- Run full gates
- STATUS.md / ROADMAP.md / TODO.md update
- Lesson 59 documentata
- Manual smoke gate
- Commit + push
- **STOP**: wait per user kickoff per PROMPT_7_RESUME

---

## 5. Pre-flight checks (STOP conditions)

1. **Branch state**: HEAD = `13b8dd9`. If different, STOP.
2. **Test baseline**: 770 passing. If lower, STOP.
3. **DS_LIFT package present**: `packages/ui` (`@mes/ui`). If missing or incomplete, STOP.
4. **Routes inventory**: list complete web + HMI routes.
5. **Mockup links fetchable**: verify all 4 URLs return content. If any fails, STOP and request fallback.
6. **D1 PROMPT_7 prerequisite verified**: `Step.data` field, migration applied, schemas + helpers + DTO projection in place.

If any STOP triggers, report state and wait.

---

## 6. Surprise budget

S1 — Mockup link non fetchable → user fallback (manual download + commit in repo)
S2 — Mockup ambiguo (es. schermate già deferred come Plant Map o Resource Mobility) → flag + default skip
S3 — DS_LIFT path non identificabile → STOP, chiedi
S4 — DS primitive mancante per refactor → STOP, chiedi (add to DS or skip?)
S5 — Refactor breaks test esistente → mantieni shape compatibile
S6 — Refactor schermata > 2x effort previsto → flag + chiedi
S7 — Backend endpoint mancante per gap D → ship con mock data + TODO o defer?
S8 — Gap D complessità imprevista → flag + chiedi se procedere o defer
S9 — Schermata E ex-PROMPT_7 ambigua nel mockup → flag + proponi approach

For each surprise: 1-3 line report + wait user decision. Don't auto-decide scope changes.

---

## 7. Lesson 59 (proposed) — Worktree corruption recovery via git plumbing

**Context**: Mid-session, Claude Code worktree's `.git` link file may disappear (Windows + pnpm install + worktree edge case). Files on disk intact, `git worktree list` no longer shows the worktree.

**Recovery (non-invasive)**:
1. Don't touch parent repo's checkout
2. Use `GIT_DIR=<parent>/.git` + worktree dir as `GIT_WORK_TREE`
3. Build commit via plumbing: `git add` to temp index → `git commit-tree` → `git update-ref`
4. Push the branch ref to origin
5. Parent repo's main, working tree, index = untouched

**Anti-pattern**: Don't `git worktree remove --force` if branch hasn't been pushed AND has unmerged commits. Verify push status first.

To document during D4 closure → update CLAUDE.md or relevant docs/lessons section.

---

## 8. Out of scope (explicitly NOT doing)

- ❌ Modifica logica funzionale (state, handlers, API calls)
- ❌ Rimozione di feature esistenti
- ❌ Aggiunta automatica di features mockup (sempre richiede user approval)
- ❌ Modifica DS_LIFT primitives (se manca primitive → chiedi user)
- ❌ Modifica schema DB (era scope PROMPT_7 D1, già completato)
- ❌ HMI runtime read recoveryConfig + pre-retry execution (questo è PROMPT_7_RESUME, ~1h CC futuro)
- ❌ Test E2E Playwright nuovi (solo unit + behavior tests)
- ❌ Internationalization EN bilingue (post-MVP)
- ❌ PWA + offline-first per HMI (post-MVP)
- ❌ TODO-045 Resource Mobility (post-demo)
- ❌ PROMPT_PNE_5 (auto-print + warning + conditional Packaging — post-demo)

---

## 9. Workflow rules (per Antonella)

- D0 pre-flight first → 30-line report → wait OK
- D1 diff inventory → categorized report (5 buckets A/B/C/D/E) → wait OK on plan
- D2 refactor: per gruppo schermate, brief report dopo ogni gruppo
- D3 gap E (ex-PROMPT_7) + gap D approvati: scope-by-scope, brief report dopo ognuna
- D4 closure → final commit + push + STOP
- Conventional commit: `refactor(ui): ...` per D2, `feat(<area>): ...` per D3
- Stop on surprise per § 6
- Manual smoke gate al D4 close
- Don't auto-merge

---

## 10. Closure deliverables

- D0 report (mockup discovery — 4 link)
- D1 report (diff categorized A/B/C/D/E + plan)
- N commits (D2 refactor) per gruppo schermate
- M commits (D3 build aligned + gap D)
- 1 closure commit (D4)
- Test cumulative target ≥770 / ideal +5-25
- STATUS.md PROMPT_DESIGN_ALIGNMENT entry
- ROADMAP.md F1.7 done
- TODO.md aggiornato con gap deferred + Lesson 59 documented
- Branch pushed, PR-ready

After D4 commit + push: STOP. Wait for explicit kickoff for PROMPT_7_RESUME.

---

## 11. Calendar context

```
─── F1 + Hotfix ✅ chiusi ──────────────────────────────────────
─── PROMPT_7 D1 ✅ schema + persistence (770 tests) ────────────
─── PROMPT_DESIGN_ALIGNMENT 🔵 NEXT (4-9 mag, 6-12h CC) ────────
   D0 fetch 4 mockup links + discovery (STOP)
   D1 diff inventory + plan (STOP)
   D2 refactor schermate B
   D3 build E (ex-PROMPT_7 D2/D3) + gap D approvati
   D4 closure
─── PROMPT_7_RESUME (1h, 9-10 mag) ──────────────────────────
   Solo D4 originale: HMI runtime read recoveryConfig + pre-retry execution
─── PROMPT_3c (10-11 mag, 1.5-2h) ───────────────────────────
─── PROMPT_9 (11-13 mag, 3-4h) ──────────────────────────────
─── DEMO PREP (14-17 mag) ───────────────────────────────────
🎯 DEMO REFLEX ALLEN — 18-22 maggio 2026
🚀 MVP SHIP — 13-15 giugno 2026 (target invariato)
```

---

End of PROMPT_DESIGN_ALIGNMENT v2 specification.
