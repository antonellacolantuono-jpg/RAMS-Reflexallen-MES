# PROMPT 6 — DASHBOARD & REPORTING v3

> **Type**: Build prompt for Claude Code (Step 6 of 6 — final MVP step)
> **Pre-requisite**: PROMPT_1-5 completed; CLAUDE.md at repo root
> **Estimated time**: 2-3 hours
> **Last updated**: 2026-04-27

---

## 📋 PROMPT TO PASTE (copy from here)

```
TASK: Build the DASHBOARD & REPORTING layer of the Reflexallen MES.

(Context already loaded from CLAUDE.md at session start.)

═══════════════════════════════════════════════════════════════════════════════
GOAL
═══════════════════════════════════════════════════════════════════════════════

Build dashboards and reporting tools for managers, planners, and engineers.
After this final step:

- Real-time production monitor (live status of all WOs)
- OEE calculation per equipment + line + plant
- First Pass Yield (FPY) tracking
- Scrap analysis by cause code
- 6 Big Losses analysis (downtime breakdown)
- Operator productivity dashboard
- Trends over time (daily/weekly/monthly)
- Export reports (PDF, Excel)
- Audit trail viewer (compliance)

This completes the MVP. After this, Reflexallen has a fully functional MES
ready for pilot in production.

═══════════════════════════════════════════════════════════════════════════════
PRE-REQUISITES
═══════════════════════════════════════════════════════════════════════════════

You should have already completed and committed PROMPT_5 (HMI).
Verify:
✓ Operators can complete WOs
✓ Counters track production accurately
✓ Audit log captures all events
✓ Real-time sync working
✓ All 13 registries populated

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL READING (do BEFORE planning)
═══════════════════════════════════════════════════════════════════════════════

Beyond CLAUDE.md context, also read:

→ docs/MASTER_SPECIFICATION.md sections 15-18 (KPIs, OEE, reporting)
→ docs/BEST_PRACTICES.md sections about reporting + analytics patterns
→ docs/extensions/EQUIPMENT_MANAGEMENT.md (per-equipment OEE)
→ docs/extensions/INDUSTRIAL_OPERATIONS.md (FPY, scrap categories)
→ docs/design-tokens.md (chart colors must respect tokens)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — PLAN (NO CODE YET)
═══════════════════════════════════════════════════════════════════════════════

Read the documents above, then propose a plan covering:

1. KPI DEFINITIONS (CALCULATION LOGIC)

   1.1 OEE (Overall Equipment Effectiveness)
       - OEE = Availability × Performance × Quality
       - Availability = (Planned production time - Downtime) / Planned production time
       - Performance = (Ideal cycle time × pieces produced) / Actual operating time
       - Quality = Good pieces / Total pieces produced
       - Computed at: equipment, work center, line, plant level
       - Time periods: shift, day, week, month
   
   1.2 First Pass Yield (FPY)
       - FPY = (Pieces passing without rework) / Total pieces produced
       - Distinct from quality (which includes rework that eventually passed)
       - Computed at: WO, item, line, plant level
   
   1.3 Scrap Rate
       - Scrap rate = Scrapped pieces / Total pieces attempted
       - Breakdown by cause code (top 10 causes)
       - Trends over time
   
   1.4 6 Big Losses (TPM standard)
       - Breakdowns (equipment failures)
       - Setup & Adjustments (changeover time)
       - Idling & Minor Stops (< 10 min stops)
       - Reduced Speed (running below ideal)
       - Defects in Process (rework + scrap during)
       - Reduced Yield (startup losses)
       
       Each tracked separately, sums to total losses.
   
   1.5 Throughput
       - Pieces per hour per equipment
       - Pieces per shift per line
       - Comparison: actual vs target
   
   1.6 Cycle Time
       - Average actual cycle time per step
       - Target vs actual
       - Trends per operator

2. REAL-TIME PRODUCTION MONITOR
   
   2.1 Layout
       - Wall-mounted display optimized (large fonts)
       - Or office screen (more density)
       - Two modes: "Wall" and "Desk"
   
   2.2 Content
       - All active WOs with progress bars
       - Equipment status (available/in_use/broken)
       - Operator status (logged in / on break / offline)
       - Current OEE (live)
       - Today's production summary
       - Recent events (last 10 alerts)
   
   2.3 Updates
       - Real-time via Socket.IO (push updates)
       - Polling fallback (every 30 sec) if socket disconnects
       - Auto-refresh on status change
   
   2.4 Filtering
       - By line, area, work center
       - By time range (today, this shift, custom)

3. DASHBOARD: OEE
   
   3.1 Main view
       - OEE gauge (0-100%) for selected scope
       - Breakdown: Availability / Performance / Quality bars
       - Trend chart (last 7/30/90 days)
       - Comparison with target
   
   3.2 Drill-down
       - Click OEE → see breakdown by equipment
       - Click equipment → see OEE history + breakdown by shift
       - Click shift → see specific WOs in that shift
   
   3.3 Heatmap
       - Equipment × Days matrix
       - Color: red (low OEE) to green (high OEE)
       - Click cell → drill-down

4. DASHBOARD: FPY (First Pass Yield)
   
   4.1 Main view
       - FPY gauge for selected scope
       - Trend chart over time
       - Top 10 items by lowest FPY (need attention)
   
   4.2 Per-item view
       - FPY trend for specific item
       - Breakdown by lot, by operator, by shift
       - Common defects (top causes)

5. DASHBOARD: SCRAP ANALYSIS
   
   5.1 Pareto chart
       - Top causes of scrap (cause codes)
       - 80/20 rule visible
       - Click cause → see specific WOs
   
   5.2 Trend chart
       - Scrap rate over time
       - By line, by item, by shift
   
   5.3 Drill-down
       - Click scrap event → see context
         (operator, equipment, lot, conditions)
       - Photo of scrap (if captured)
       - Recovery attempts log

6. DASHBOARD: 6 BIG LOSSES
   
   6.1 Stack chart
       - 100% stacked bar over time
       - Each color = one of 6 losses
       - Visual comparison week over week
   
   6.2 Drill-down
       - Click loss type → see specific events
       - Equipment breakdown
       - Most affected workflows

7. DASHBOARD: OPERATOR PRODUCTIVITY
   
   7.1 Per-operator view
       - Pieces produced per shift
       - Cycle time vs target
       - Recovery rate (how often they trigger recovery)
       - Skills coverage
   
   7.2 Team view
       - All operators ranked
       - Color coding (top performers, attention needed)
       - NOTE: Use carefully — not for performance reviews,
         only for training and coaching

8. WORK ORDER REPORTS
   
   8.1 WO summary
       - Status, progress, KPIs
       - Operator history
       - Materials consumed
       - Tools used
       - Test results
       - Audit timeline
   
   8.2 WO comparison
       - Compare similar WOs (same item)
       - See which had issues, why
       - Best practice identification

9. EXPORT FUNCTIONALITY
   
   9.1 PDF export
       - WO complete report (all data, signed)
       - OEE summary report
       - Scrap analysis report
       - Audit log report
   
   9.2 Excel export
       - Production data (all transactions)
       - KPIs over time
       - Custom date ranges
   
   9.3 Scheduled reports (V2 — placeholder for now)
       - Daily production summary
       - Weekly OEE report
       - Monthly compliance report

10. AUDIT TRAIL VIEWER
    
    10.1 Searchable interface
        - Filter by entity type, user, date, action
        - Free-text search
        - Date range picker
    
    10.2 Detailed view
        - Before/after JSON diff
        - Related events context
        - Print/export
    
    10.3 Compliance focus
        - Critical for IATF 16949
        - 15+ year retention enforced
        - Tamper-evident (cryptographic chain optional)

11. ALERTS & NOTIFICATIONS
    
    11.1 Alert configuration
        - OEE drop below threshold
        - Scrap rate spike
        - Equipment breakdown
        - FAI rejection
        - Skills expiring
        - Tool wear approaching limit
    
    11.2 Notification channels
        - In-app (toast + bell)
        - Email (placeholder)
        - SMS (V2)

12. PERFORMANCE
    
    Aggregations must be fast:
    - Pre-compute KPIs hourly (cron job)
    - Cache results in Redis (TTL 5-10 min)
    - Real-time data via WebSocket (no polling)
    - Charts render < 1 sec for 1000+ data points

13. CHART LIBRARY
    
    Use Recharts (already in stack) for:
    - Line charts (trends)
    - Bar charts (Pareto, comparisons)
    - Gauges (OEE, FPY)
    - Heatmaps (equipment × time)
    - Pie/donut charts (sparingly — only for clear proportions)
    
    Chart colors MUST come from design tokens.

14. PERMISSIONS
    
    Different views for different roles:
    - Operator: only own productivity (read-only)
    - Process Engineer: workflows + WO reports
    - Quality Manager: scrap + FPY + audit
    - Production Manager: OEE + 6 losses + monitor
    - Plant Manager: everything
    - Admin: everything + config

15. VERIFICATION STEPS
    
    - Real-time monitor updates as production runs
    - OEE calculations match manual verification
    - Trends visible over multiple days
    - Drill-downs work
    - Exports generate correct files
    - Audit trail searchable
    - Performance smooth with seed data scaled up

After presenting your plan, STOP and wait for my approval.

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — BUILD (ONLY AFTER MY APPROVAL)
═══════════════════════════════════════════════════════════════════════════════

When I say "go", proceed in this order:

STEP 2.1 — KPI calculation engine
  - packages/domain: KPI calculation logic (pure functions)
  - packages/domain: OEE, FPY, scrap rate, 6 losses
  - Tests: 30+ unit tests (verify with manual calculations)

STEP 2.2 — KPI service & cron jobs
  - apps/api: KPIsModule
  - Pre-compute KPIs every hour (BullMQ scheduled job)
  - Cache in Redis (5-10 min TTL)
  - On-demand recalculation endpoint
  - Verify: cron runs, cache works

STEP 2.3 — KPI API endpoints
  - GET /api/kpis/oee?scope=plant&from=...&to=...
  - GET /api/kpis/fpy?scope=line&...
  - GET /api/kpis/scrap?...
  - GET /api/kpis/six-losses?...
  - GET /api/kpis/operators/:id?...
  - All with caching headers
  - Verify: integration tests

STEP 2.4 — Real-time production monitor
  - apps/web: ProductionMonitorPage
  - Two modes: Wall + Desk
  - Live WO progress
  - Equipment status grid
  - Recent events feed
  - Auto-refresh + Socket.IO
  - Verify: 2+ active WOs visible

STEP 2.5 — OEE Dashboard
  - apps/web: OEEDashboardPage
  - Gauges + trend charts
  - Filters: scope, time range
  - Drill-down: plant → line → equipment
  - Heatmap
  - Verify: numbers match calculations

STEP 2.6 — FPY Dashboard
  - apps/web: FPYDashboardPage
  - Trends, top 10 items, drill-down
  - Verify: matches manual calculations

STEP 2.7 — Scrap Analysis Dashboard
  - apps/web: ScrapDashboardPage
  - Pareto chart of cause codes
  - Trends
  - Drill-down to events
  - Verify: data accurate

STEP 2.8 — 6 Big Losses Dashboard
  - apps/web: BigLossesDashboardPage
  - Stacked bar + breakdown
  - Verify: classifications correct

STEP 2.9 — Operator Productivity Dashboard
  - apps/web: OperatorProductivityPage
  - Per-operator + team views
  - Privacy-conscious (with note)
  - Verify: numbers accurate

STEP 2.10 — WO Reports
  - apps/web: WorkOrderReportPage
  - Summary + comparison
  - Print-friendly layout
  - Verify: complete WO data shown

STEP 2.11 — PDF Export
  - WO report → PDF (use react-pdf or similar)
  - OEE summary → PDF
  - Audit log → PDF
  - Verify: exports valid

STEP 2.12 — Excel Export
  - Production data → Excel
  - KPI history → Excel
  - Use exceljs or similar
  - Verify: opens in Excel correctly

STEP 2.13 — Audit Trail Viewer
  - apps/web: AuditTrailPage
  - Search + filters
  - Detailed view with diff
  - Compliance-focused
  - Verify: 15+ year retention metadata

STEP 2.14 — Alerts system
  - apps/api: AlertsModule
  - Configurable thresholds
  - In-app notifications
  - Email placeholder (V2)
  - Verify: alert triggers correctly

STEP 2.15 — Permissions integration
  - Role-based view filtering
  - Hide unauthorized data
  - Verify: each role sees correct subset

STEP 2.16 — Performance optimization
  - Profile dashboard load times
  - Optimize slow queries (add indexes)
  - Cache aggregations
  - Verify: < 1 sec dashboard load

STEP 2.17 — E2E tests
  - Operator completes WO → KPIs update
  - Manager opens dashboard → sees correct numbers
  - Export PDF → valid file
  - Audit search → finds event
  - Verify: all green

═══════════════════════════════════════════════════════════════════════════════
PHASE 3 — VERIFY & REPORT
═══════════════════════════════════════════════════════════════════════════════

Generate STATUS REPORT:
- All dashboards working
- KPIs accurate (verified manually)
- Real-time monitor live
- Drill-downs functional
- Exports work
- Audit trail searchable
- Performance < 1 sec
- Tests passing
- Suggested commit message

═══════════════════════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

[ ] Real-time production monitor displays live status
[ ] OEE dashboard with gauges + trends + heatmap
[ ] FPY dashboard with trends + drill-down
[ ] Scrap analysis dashboard (Pareto + trends)
[ ] 6 Big Losses dashboard
[ ] Operator productivity dashboard
[ ] WO reports (summary + comparison)
[ ] PDF export for WO + OEE + audit
[ ] Excel export for production + KPIs
[ ] Audit trail viewer (searchable)
[ ] Alerts system (in-app)
[ ] Permissions: role-based view filtering
[ ] All KPIs match manual calculations
[ ] Performance: < 1 sec dashboard load
[ ] Real-time updates via Socket.IO
[ ] Charts use design tokens
[ ] All E2E tests pass

═══════════════════════════════════════════════════════════════════════════════
GO STEP-BY-STEP
═══════════════════════════════════════════════════════════════════════════════

Now:
1. Read additional files
2. Verify PROMPT_5 (HMI working)
3. Present plan
4. Wait for approval
5. Build
6. Status report

START WITH THE PLAN.
```

(End of prompt to paste)

---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### Why this is the FINAL MVP step

After PROMPT_6, you have a complete MVP:
- Foundation (PROMPT_1)
- Master data (PROMPT_2)
- Workflow design (PROMPT_3)
- Auto-generation (PROMPT_4)
- Production execution (PROMPT_5)
- Reporting (PROMPT_6)

Your MES is ready for pilot in production at Reflexallen.

### Watch out for these issues

**Issue 1**: Claude Code might compute KPIs on every request.
- Push back. Pre-compute in cron + cache. Otherwise dashboards are slow.

**Issue 2**: Claude Code might hardcode chart colors.
- Reject. Must use design tokens. Otherwise UI looks inconsistent.

**Issue 3**: Audit trail might not have proper indexes.
- Verify. Audit table will grow large. Without indexes, search is slow.

**Issue 4**: Exports might be synchronous.
- Push back. PDF/Excel generation should be async (BullMQ job + email link).

### How long this should take

| Activity | Estimated time |
|---|---|
| Read additional specs | 15-20 min |
| Plan proposal | 20-25 min |
| Plan review | 10-15 min |
| Build (~17 steps) | 90-120 min |
| Verify | 20-30 min |
| Status report | 10 min |
| **Total** | **2.5-3.5 hours** |

### Post-MVP considerations

After PROMPT_6 completes, consider:

1. **User acceptance testing** with Reflexallen team
2. **Performance testing** with production-scale data (1000s of WOs)
3. **Security audit** (authentication, RBAC, data encryption)
4. **Backup & disaster recovery** plan
5. **Deployment** to production environment
6. **Training** for operators, engineers, managers
7. **Documentation** for end users (different from dev docs)

These are out of scope for the build prompts but essential for go-live.

### V2 features (post-MVP)

When ready for V2:
- Fluid Power line module
- Digital Electrical line module
- Multi-language EN
- Advanced scheduling (Gantt drag-drop)
- IIoT real telemetry
- Predictive maintenance
- Mobile app
- Customer portal

Each would be ~5-10 hours of additional build.

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial v3 prompt (created with CLAUDE.md auto-load pattern) |
