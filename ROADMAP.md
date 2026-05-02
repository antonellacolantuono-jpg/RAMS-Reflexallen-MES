# RAMS-Reflexallen-MES — Roadmap MVP completo

> **Versione**: 1.0 — **Creata**: 02/05/2026
> **Spec compliance**: v1.2
> **Repo HEAD ref**: `c8f2284` (PROMPT_3b_FULL Session B chiuso)
> **Strategia**: Scenario B con PROMPT_DS-LIFT in testa (vedi audit Pre-MVP del 02/05/2026)

---

## Stato corrente (chiuso)

| PROMPT | Stato | Tests | Data chiusura |
|---|---|---|---|
| PROMPT_1 Foundation | ✅ 100% | ~70 | 27/04 |
| PROMPT_2 Registries (lists) | ✅ 100% | ~160 cum | 28/04 |
| PROMPT_3a Workflow Designer canvas | ✅ 100% | ~216 cum | 29/04 |
| PROMPT_3b_REDUCED | ✅ 100% | — | 30/04 mattina |
| PROMPT_5_LITE | ✅ 100% | — | 30/04 pomeriggio |
| PROMPT_5_FULL D1-D6 (HMI) | ✅ 100% | ~370 | 01/05 sera |
| PROMPT_4 AutoGenEngine + 7 resolvers | ✅ 100% | ~431 | 01/05 tarda sera |
| PROMPT_3b_FULL Session A | ✅ 100% | 443 | 01/05 notte |
| PROMPT_3b_FULL Session B | ✅ 100% | **473** | 02/05 |

**Totale ore Claude Code consumate**: ~stima 80-100h (dato non tracciato esplicitamente).
**Foundation status**: solida — auth, schema, 13 list pages, workflow designer 4-pane, 9/9 step categories, auto-gen engine, HMI 8 step renderers + recovery + box ops, audit backend, genealogy backend, mock device simulator.

---

## Gap noti (input dell'audit)

**Asse funzionale** — extension `.md` non implementate:
- 🔴 SCHEDULING_ASSIGNMENT (8 entità: WOAssignment + Shift + ShiftAssignment + Handover)
- 🔴 INDUSTRIAL_OPERATIONS (Multi-output + Sample + FAI + Quality Hold + Continuous + WIP + Subassembly)
- 🔴 EQUIPMENT_MANAGEMENT rich (state machine 8-stati + MaintenanceOrder + ToolWear + Calendar + 7-tab detail)
- 🔴 CFRP_MODULE (Mold + Prepreg + CureCycleRun + telemetry + NDT + vacuum test)
- 🔴 SAFETY_DEVICES_MODULE (ReflectanceTest + Homologation + Aging + Lamination)
- 🟡 Audit/Genealogy UI (backend ok, UI mancante)

**Asse UI** — 19 schermate Suite mockup:
- 🔴 Plant Overview (Screen 01) — non esiste, home `/` è una DS Showcase di sviluppo
- 🔴 Work Orders List + Detail back-office (Screen 02-03) — non esistono `/work-orders/*` in `apps/web`
- 🔴 Andon Dashboard (Screen 19) — non esiste
- 🔴 Skills Matrix (Screen 08) — solo list flat
- 🔴 Devices registry (Screen 11) — non esiste in BO
- 🟡 8 list registry — scaffolding tabular base, manca Operational Table v0.7 pattern
- ❓ 11 registries `[id]/edit/new` = 404 (solo `items` e `workflows` hanno detail completo)
- ✅ 6 schermate allineate (Workflow Editor + 5 HMI core)

**Gap Design System** — 14 pattern documentati nel handoff DS, mancanti in `@mes/ui`:
- Drawer / Modal / ToastProvider / PriorityBadge
- TreeNode / EmptyState / ViewSwitcher / SplitView
- Operational Table v0.7 suite (8 sub-componenti)
- RegistryTile / KpiHero / WCCard / PhaseChip / AlertBanner / LiveAlert
- DetailHeader / DetailBody / AuditTrail UI / TabStates
- Plant Map / Canvas suite

**Gap stack** — `i18n` non implementato (next-intl assente, stringhe hardcoded IT).

---

## Roadmap residua — 3 fasi sequenziali

### FASE 1 — Foundation alignment (target: fine maggio 2026)

Obiettivo: chiudere il gap UI strutturale, allineare ogni list/detail al DS, dotare il MES di una shell demo coerente con il PDF Suite consegnato al cliente.

| # | PROMPT | Scope | Effort | Dipendenze | Cumul |
|---|---|---|---|---|---|
| **F1.1** | **PROMPT_DS_LIFT** | Porta 14+ pattern handoff in `@mes/ui` (vedi `prompts/PROMPT_DS_LIFT.md`) | 18-24h | — | 24h |
| F1.2 | PROMPT_6 Andon + Plant Overview | Andon Dashboard (KpiHero + WCCard + AlertBanner + LiveAlert) + Plant Overview homepage (PlantMap SVG + workstations grid + Active Issues feed via Socket.IO) | 12-16h | F1.1 | 40h |
| F1.3 | PROMPT_7 Registry detail + WO BO | (a) `/work-orders` list + `/work-orders/[id]` detail con 7 tab; (b) detail/edit/new per i 11 registry mancanti (EmptyState patterns, TreeNode per equipment); (c) refactor RegistryListPage → OperationalTable | 14-20h | F1.1 | 60h |
| F1.4 | PROMPT_3c Live Preview | Workflow Editor: state-driven preview 11 stati interattivi (vedi `screens-3-workflow.jsx:547` AutogenDiff) | 6-10h | F1.1 | 70h |
| F1.5 | i18n setup base | next-intl + estrazione stringhe IT/EN nelle pagine attuali | 6-10h | — | 80h |
| | | **F1 totale** | **56-80h** | | |

**Gate F1**: demo verticale "Brake Caliper Assembly" eseguibile end-to-end da Plant Overview → WO release → HMI execution → Andon. Test count target ≥ 540.

---

### FASE 2 — Operativo Tier 1 (target: fine giugno 2026)

Obiettivo: il MES diventa utilizzabile da planner, QA, manutenzione. Coverage spec v1.2 sui domini core.

| # | PROMPT | Scope | Effort | Dipendenze | Cumul |
|---|---|---|---|---|---|
| **F2.1** | PROMPT_8 Scheduling FULL | Implementa `extensions/SCHEDULING_ASSIGNMENT.md`: WorkOrderAssignment entity (5-stati lifecycle) + Shift + ShiftAssignment + ShiftHandover + Skills coverage check + override flow + Planner Board UI (3-col operators/today/unassigned) + Dispatch List HMI ordinata per priority/due | 24-32h | F1 | 104h |
| F2.2 | PROMPT_9 Equipment Mgmt + WO Detail rich | (a) `extensions/EQUIPMENT_MANAGEMENT.md`: Equipment state machine 8-stati XState + MaintenanceOrder lifecycle + ToolWear (3 threshold) + Maintenance calendar grid + 7-tab Equipment detail (Info/StateMachine/Maintenance/Tools/Performance/Calibration/Documents); (b) WO Detail rich: multi-level timer 3-livelli WO/Phase/Part + phase progress 6-fasi + reservations + Schedule sidebar + Assignment widget | 28-36h | F2.1 | 140h |
| F2.3 | PROMPT_10 Industrial Ops + Quality | `extensions/INDUSTRIAL_OPERATIONS.md`: Multi-output cycles (1:N) + Continuous production mode + Sample taking + First Article Inspection (FAI) workflow blocking + Quality Hold/Release dashboard + WIP container kanban + Subassembly nested BOM + backflush automatic | 24-32h | F2.2 | 172h |
| | | **F2 totale** | **76-100h** | | |

**Gate F2**: scenario "planner assegna 5 WO a 3 operatori in 2 turni con skills coverage check" funzionante. FAI + Quality Hold testabili. Test count target ≥ 700.

---

### FASE 3 — Line-specific Reflex Allen (target: fine luglio 2026)

Obiettivo: i moduli specifici delle linee Reflex Allen (CFRP Compositi + Safety Devices) rendono il MES line-aware.

| # | PROMPT | Scope | Effort | Dipendenze | Cumul |
|---|---|---|---|---|---|
| F3.1 | PROMPT_11 CFRP Module | `extensions/CFRP_MODULE.md`: Mold registry (cycle counter auto + lifecycle 5-stati) + PrepregRoll out-time tracker (cumulative, multi-state frozen/refrigerated/out/expired) + CureCycleRun long-running (4-8h autoclave) + telemetry archive (background job 30s) + NDTResult + vacuum bag tightness test + workflow CFRP specializzato | 26-32h | F2.2 | 204h |
| F3.2 | PROMPT_12 Safety Devices Module | `extensions/SAFETY_DEVICES_MODULE.md`: ReflectanceTest (ECE-R104 thresholds) + Colorimetry (CIE-Lab) + HomologationCertificate mgmt + ECE-R104 marking generation + AgingTestSpecimen long-running (QUV chamber + salt spray) + LaminationRecord + cross-cut adhesion ASTM D3359 | 22-28h | F2.3 | 232h |
| F3.3 | PROMPT_13 Audit/Genealogy/Skills | (a) Audit Trail UI viewer filtrabile per entity (gap §16.2); (b) Genealogy bidirezionale grafica forward+backward (gap §16.3); (c) Skills Matrix operatori×skills view (Screen 08 design) | 14-18h | F1 | 250h |
| | | **F3 totale** | **62-78h** | | |

**Gate F3**: linea CFRP simulabile end-to-end con Mold cycles + cure cycle telemetry recording + NDT pass/fail. Linea Safety Devices con ECE-R104 reflectance test + marking generation. Audit trail UI navigabile. Test count target ≥ 900.

---

## Calendario realistico

Assumendo **28-30h Claude Code/settimana**:

| Periodo | Fase | Output |
|---|---|---|
| 03-22 maggio 2026 (3 sett) | F1 | Shell demo allineata DS, registry rich, WO BO, Andon |
| 23 maggio - 22 giugno (4 sett) | F2 | Scheduling, Equipment rich, Industrial Ops |
| 23 giugno - 25 luglio (4-5 sett) | F3 | CFRP, Safety Devices, Audit UI |

**Demo Reflex Allen suggerita in 3 step**:
1. Fine F1 (~22 maggio): "questo è il MES come l'avete visto nei mockup"
2. Fine F2 (~22 giugno): "questo è il MES che il planner usa davvero"
3. Fine F3 (~25 luglio): "questo è il MES specifico per le tue linee CFRP + Safety"

---

## Convenzioni operative per ogni PROMPT

Mutuate dalle PROMPT chiuse:

1. **Format file**: `prompts/PROMPT_NN_NAME.md` con header version, change log
2. **Sessions / increments**: ogni PROMPT spezzato in D1-D6 (o Session A/B se molto grosso)
3. **Gates di accettazione obbligatori al chiusura**:
   - `pnpm install` clean
   - `pnpm build` 12/12 successful
   - `pnpm lint` clean (no nuovi warning)
   - `pnpm test` con delta target dichiarato (es. +25 tests)
   - Smoke runtime: `pnpm dev` e check route principali 200
4. **Verification commit message format**:
   ```
   PROMPT_NN_NAME: <one-line scope> (commit <sha>, +N tests, M total, PROMPT_NN_NAME XX% complete)
   ```
5. **TODO tracking**: numerazione continua TODO-NNN nel file `TODO.md` root
6. **Status update**: aggiornare `STATUS.md` post-merge
7. **Spec compliance check**: ogni nuova entità/state machine deve avere riferimento a sezione MASTER_SPEC o extension `.md`

---

## Variazioni accettabili al piano

- **Swap F3.1/F3.2**: CFRP e Safety Devices sono indipendenti, ordine swap-pabile in base a priorità Reflex Allen
- **Tagli i18n** (F1.5): se demo Reflex Allen è solo in italiano, taglia. Riprendi in V2
- **Demo intermedia anticipata**: se Reflex Allen vuole vedere prima del 22 maggio, fai una demo "shell" a metà F1 con solo PROMPT_DS_LIFT + PROMPT_6 chiusi (~40h, ~2 sett dal kick-off)
- **Spec drift v1.3**: se emergono nuovi requirement Reflex Allen, accodare in F3 o creare F4

## Variazioni NON accettabili

- DS-LIFT NON può saltare. Senza, il debito visivo si moltiplica.
- F1 → F2 → F3 sequenza: dipendenze tecniche reali, non swap-pabile.
- Nessun PROMPT può chiudere con build rotto, lint warning nuovi, o test count regressivo.

---

## Change log

| Versione | Data | Modifiche |
|---|---|---|
| 1.0 | 2026-05-02 | Roadmap iniziale post-audit Pre-MVP. 9 PROMPT residui pianificati. |
