/* global React */
// Catalog of every screen in the MES prototype, with positions, phases, and connections.
// Coordinates are on a ~5000×3600 canvas; phases group horizontally as swimlanes.

window.FlowMap = (() => {
  const PHASES = [
    { id: 'master',    label: 'Master Data',         color: 'oklch(0.95 0.04 235)', ink: 'oklch(0.4 0.13 235)',  y: [0, 540] },
    { id: 'planning',  label: 'Planning & Release',  color: 'oklch(0.96 0.04 285)', ink: 'oklch(0.38 0.16 285)', y: [540, 1080] },
    { id: 'setup',     label: 'Setup',               color: 'oklch(0.96 0.06 80)',  ink: 'oklch(0.45 0.13 60)',  y: [1080, 1640] },
    { id: 'execution', label: 'Production · HMI',    color: 'oklch(0.95 0.04 145)', ink: 'oklch(0.38 0.13 145)', y: [1640, 2380] },
    { id: 'qc',        label: 'Quality',             color: 'oklch(0.96 0.05 320)', ink: 'oklch(0.42 0.16 320)', y: [2380, 2820] },
    { id: 'outbound',  label: 'Outbound · Closure',  color: 'oklch(0.95 0.05 200)', ink: 'oklch(0.38 0.13 200)', y: [2820, 3360] },
  ];

  // Each node: id, route (deep-link in index.html), title, subtitle, x, y, w, h, phase, surface (back/hmi/andon), notes
  const NODES = [
    // ── MASTER DATA swim
    { id: 'items',       route: 'items',          title: 'Items & BOM',          sub: 'Catalog · BOM tree · Where-used', x: 60,   y: 60,   w: 360, h: 220, phase: 'master', surface: 'back', note: 'Source of truth for finished goods, semi-finished, raw, components, consumables. BOM is referenced by every Work Order and Workflow.' },
    { id: 'recipes',     route: 'recipes',        title: 'Recipes',              sub: 'Versioned device programs',       x: 460,  y: 60,   w: 280, h: 220, phase: 'master', surface: 'back', note: 'Each recipe is bound to a device type. Status: draft → approved. Approved recipes can be loaded by workflows.' },
    { id: 'skills',      route: 'skills',         title: 'Skills',               sub: 'Operator certifications',         x: 780,  y: 60,   w: 220, h: 220, phase: 'master', surface: 'back', note: 'Operators are assigned skills. Workflows require skill checks on release; HMI verifies on login.' },
    { id: 'equipment',   route: 'equipment',      title: 'Equipment Hierarchy',  sub: 'ISA-95: Site → Area → WC → WS → Module', x: 1040, y: 60, w: 360, h: 220, phase: 'master', surface: 'back', note: 'Defines the physical plant. Devices attach at module level. Status (available/in_use/maintenance/broken) flows to Andon and WO availability.' },
    { id: 'devices',     route: 'devices',        title: 'Devices',              sub: 'Leak testers, presses, scanners',  x: 1440, y: 60,   w: 280, h: 220, phase: 'master', surface: 'back', note: 'Connected equipment with capabilities + recipes. OPC-UA / serial. Calibration tracked.' },
    { id: 'boxes',       route: 'boxes',          title: 'Box Management',       sub: 'BoxTypes + Boxes lifecycle',       x: 1760, y: 60,   w: 320, h: 220, phase: 'master', surface: 'back', note: 'Pallets, crates, cardboard, kanban bins, metal containers. Tracks fill/seal/ship/return/clean/damage states and reuse cycles.' },
    { id: 'workflows',   route: 'workflows',      title: 'Workflows (list)',     sub: 'Versioned process definitions',    x: 2120, y: 60,   w: 280, h: 220, phase: 'master', surface: 'back', note: 'Library of workflow definitions per item. Status: draft → active → deprecated.' },
    { id: 'wf-editor',   route: 'workflow-editor', title: 'Workflow Editor',     sub: '4-pane · phases / groups / steps · auto-gen', x: 2440, y: 60, w: 420, h: 220, phase: 'master', surface: 'back', note: 'Define phases (inbound/setup/production/qc/outbound/teardown), groups, steps. Auto-generated groups (skills check, BOM check, packaging, teardown) inserted on save.' },

    // ── PLANNING swim
    { id: 'dashboard',   route: 'dashboard',      title: 'Plant Overview',       sub: 'OEE · KPIs · live status',         x: 60,   y: 600,  w: 380, h: 240, phase: 'planning', surface: 'back', note: 'Production Manager landing page. KPIs, live work orders, attention points.' },
    { id: 'wo-list',     route: 'workorders',     title: 'Work Orders (list)',   sub: 'Filter · table + cards · status',  x: 480,  y: 600,  w: 360, h: 240, phase: 'planning', surface: 'back', note: 'Search / filter by status, priority, work center. Bulk release.' },
    { id: 'wo-create',   route: 'wo-create',      title: 'Create Work Order',    sub: '3-step wizard',                    x: 880,  y: 600,  w: 280, h: 240, phase: 'planning', surface: 'back', note: 'Pick item → quantity & dates → work center & workflow. Drafts can be edited; planned WOs are scheduled.' },
    { id: 'wo-detail',   route: 'wo-detail',      title: 'WO Detail',            sub: 'Tabs · Overview · Workflow · Materials · Execution · QC', x: 1200, y: 600, w: 420, h: 240, phase: 'planning', surface: 'back', note: 'Full WO view. Phase progress, multi-level timer, BOM consumption, cycle log, scrap/rework, genealogy, activity audit.' },
    { id: 'wo-release',  route: 'wo-detail',      title: 'Release Modal',        sub: 'Pre-release validation runtime',   x: 1660, y: 600,  w: 320, h: 240, phase: 'planning', surface: 'back', note: 'Validates: workflow snapshot, BOM availability, skills coverage, devices ready, recipes approved, box reservations. Override requires reason.' },
    { id: 'andon',       route: 'andon',          title: 'Andon (fullscreen)',   sub: 'Live line dashboard',              x: 2020, y: 600,  w: 360, h: 240, phase: 'planning', surface: 'andon', note: 'Big-screen line status for the shop floor. Calls, breakdowns, OEE per cell.' },

    // ── SETUP / HMI ENTRY
    { id: 'hmi-login',   route: 'hmi',            title: 'HMI · Login',          sub: 'Badge / RFID / PIN',               x: 60,   y: 1140, w: 280, h: 220, phase: 'setup', surface: 'hmi', note: 'Operator authenticates at the workstation. Shift + skill profile loaded.' },
    { id: 'hmi-wo',      route: 'hmi',            title: 'HMI · WO Selection',   sub: 'Released WOs at this WC',          x: 380,  y: 1140, w: 280, h: 220, phase: 'setup', surface: 'hmi', note: 'Operator picks an assigned WO. Snapshot of frozen workflow loaded.' },
    { id: 'hmi-skills',  route: 'hmi',            title: 'HMI · Skills Check',   sub: 'Auto: verify required skills',     x: 700,  y: 1140, w: 240, h: 220, phase: 'setup', surface: 'hmi', note: 'Auto-generated group. Blocks if operator lacks SKL-LEAK / SKL-ASSY etc.' },
    { id: 'hmi-bom',     route: 'hmi',            title: 'HMI · BOM Check',      sub: 'Sequential scans (datamatrix)',    x: 980,  y: 1140, w: 320, h: 220, phase: 'setup', surface: 'hmi', note: 'Auto-generated. Each component scanned in order. Lot/serial validated against reservation.' },
    { id: 'hmi-tools',   route: 'hmi',            title: 'HMI · Tooling',        sub: 'Verify tool IDs',                  x: 1340, y: 1140, w: 240, h: 220, phase: 'setup', surface: 'hmi', note: 'Confirm correct tools at WS (e.g. torque wrench 30Nm).' },
    { id: 'hmi-recipe',  route: 'hmi',            title: 'HMI · Device Setup',   sub: 'Load recipe → device',             x: 1620, y: 1140, w: 280, h: 220, phase: 'setup', surface: 'hmi', note: 'Push approved recipe to device. Wait for device ACK.' },
    { id: 'hmi-first',   route: 'hmi',            title: 'HMI · First Piece',    sub: 'QC approval before run',           x: 1940, y: 1140, w: 280, h: 220, phase: 'setup', surface: 'hmi', note: 'First piece is held for QC sign-off. On approve → production loop unlocks.' },

    // ── EXECUTION swim
    { id: 'hmi-prod',    route: 'hmi',            title: 'HMI · Production Loop', sub: 'Step-by-step + multi-level timer', x: 60,   y: 1700, w: 360, h: 280, phase: 'execution', surface: 'hmi', note: 'Cycle: assemble → press-fit → torque. Per-piece, per-phase, per-WO timers always visible. Attention points surface inline.' },
    { id: 'hmi-parallel', route: 'hmi',           title: 'HMI · Parallel Steps', sub: 'Pre / Main / Parallel-NEXT / Parallel-PREV / Post', x: 460, y: 1700, w: 420, h: 280, phase: 'execution', surface: 'hmi', note: 'While device runs leak test on current piece, operator labels NEXT and visual-checks PREVIOUS. Maximizes utilization.' },
    { id: 'hmi-device',  route: 'hmi',            title: 'HMI · Device Run',     sub: 'Live OPC-UA telemetry',            x: 920,  y: 1700, w: 280, h: 280, phase: 'execution', surface: 'hmi', note: 'Live pressure/leak chart. Pass/fail signal returns from device. Outcome posted to genealogy.' },
    { id: 'hmi-nok',     route: 'hmi',            title: 'HMI · NOK Detected',   sub: 'Cause code + decision',            x: 1240, y: 1700, w: 280, h: 280, phase: 'execution', surface: 'hmi', note: 'On device NOK → operator picks cause (dimensional / cosmetic / functional). System routes: rework, scrap, or recovery.' },
    { id: 'hmi-recover', route: 'hmi',            title: 'HMI · Recovery Flow',  sub: 'Repair sub-workflow',              x: 1560, y: 1700, w: 280, h: 280, phase: 'execution', surface: 'hmi', note: 'Recovery steps tied to cause code. On success → re-test. On second failure → scrap.' },
    { id: 'hmi-pause',   route: 'hmi',            title: 'HMI · Hold / Pause',   sub: 'Reason code + Andon call',         x: 1880, y: 1700, w: 280, h: 280, phase: 'execution', surface: 'hmi', note: 'Operator pauses WO. Reason mandatory (no material, breakdown, changeover…). Triggers Andon escalation if > threshold.' },

    // ── QC swim
    { id: 'wo-quality',  route: 'wo-detail',      title: 'WO · Quality Tab',     sub: 'OK / Rework / Scrap dist.',        x: 60,   y: 2440, w: 320, h: 240, phase: 'qc', surface: 'back', note: 'Live quality stats per WO. Scrap by cause. FPY tracking against target.' },
    { id: 'hmi-qc',      route: 'hmi',            title: 'HMI · Final QC',       sub: 'Dimensional + visual check',       x: 420,  y: 2440, w: 280, h: 240, phase: 'qc', surface: 'hmi', note: 'Last gate before packaging. Sample plan or 100%. Quarantine path on fail.' },
    { id: 'wo-genealogy', route: 'wo-detail',     title: 'WO · Genealogy',       sub: 'Forward + backward trace',          x: 740,  y: 2440, w: 320, h: 240, phase: 'qc', surface: 'back', note: 'Per-serial: which lots consumed, which operator, which device, which recipe version. Audit-ready.' },
    { id: 'wo-execution', route: 'wo-detail',     title: 'WO · Execution Log',   sub: 'Per-cycle outcomes',               x: 1100, y: 2440, w: 360, h: 240, phase: 'qc', surface: 'back', note: 'Every piece, cycle time, operator, outcome (OK/NOK), notes. Drives FPY and cycle-time deviation.' },

    // ── OUTBOUND swim
    { id: 'hmi-pack',    route: 'hmi',            title: 'HMI · Packing',        sub: 'Auto-gen: select box → pack → seal → label', x: 60, y: 2880, w: 380, h: 240, phase: 'outbound', surface: 'hmi', note: 'Auto-generated group. Picks empty BTYPE-CBX-014, validates capacity, seals on full, prints label. Box reservations from Box Management.' },
    { id: 'hmi-teardown', route: 'hmi',           title: 'HMI · Teardown',       sub: 'Tool return + device reset',       x: 480,  y: 2880, w: 280, h: 240, phase: 'outbound', surface: 'hmi', note: 'Auto-generated. Return tools, unload recipes, cleanup. Closes the WO from operator side.' },
    { id: 'wo-complete', route: 'wo-detail',      title: 'WO · Completion',      sub: 'Closed / Partially completed',     x: 800,  y: 2880, w: 320, h: 240, phase: 'outbound', surface: 'back', note: 'Manager closes WO. Quantities reconciled (produced/scrap/rework). Triggers ERP confirmation.' },
    { id: 'box-ship',    route: 'boxes',          title: 'Box · Sealed → Shipped', sub: 'Outbound logistics',             x: 1160, y: 2880, w: 320, h: 240, phase: 'outbound', surface: 'back', note: 'Sealed box gets shipping doc. Status sealed → shipped. Customer receives. Returnable boxes scheduled for return.' },
    { id: 'box-cycle',   route: 'boxes',          title: 'Box · Return / Clean / Damage', sub: 'Reuse cycle',             x: 1500, y: 2880, w: 360, h: 240, phase: 'outbound', surface: 'back', note: 'Returnable: returned → cleaning → empty (cycle++). If condition < threshold → damaged / quarantine.' },
    { id: 'settings',    route: 'settings',       title: 'Settings',             sub: 'Site · Shifts · Integrations',     x: 1900, y: 2880, w: 280, h: 240, phase: 'outbound', surface: 'back', note: 'System-level: ERP sync, shift calendar, cause-code library, attention points library.' },
  ];

  // Edges: from, to, label, kind: 'flow' | 'auto' | 'recovery' | 'data' | 'event'
  const EDGES = [
    // Master → Planning
    { from: 'items', to: 'wf-editor', label: 'BOM ref', kind: 'data' },
    { from: 'recipes', to: 'wf-editor', label: 'recipe ref', kind: 'data' },
    { from: 'skills', to: 'wf-editor', label: 'skill ref', kind: 'data' },
    { from: 'equipment', to: 'devices', label: 'attaches', kind: 'data' },
    { from: 'devices', to: 'recipes', label: 'capabilities', kind: 'data' },
    { from: 'workflows', to: 'wf-editor', label: 'edit', kind: 'flow' },
    { from: 'wf-editor', to: 'wo-create', label: 'used by', kind: 'data' },
    { from: 'items', to: 'wo-create', label: 'item ref', kind: 'data' },
    { from: 'boxes', to: 'wo-release', label: 'reservations', kind: 'data' },

    // Planning lifecycle
    { from: 'dashboard', to: 'wo-list', label: 'open', kind: 'flow' },
    { from: 'wo-list', to: 'wo-create', label: '+ New', kind: 'flow' },
    { from: 'wo-list', to: 'wo-detail', label: 'click row', kind: 'flow' },
    { from: 'wo-create', to: 'wo-detail', label: 'Draft', kind: 'flow' },
    { from: 'wo-detail', to: 'wo-release', label: 'Release', kind: 'flow' },
    { from: 'wo-release', to: 'hmi-login', label: 'snapshot frozen', kind: 'event' },
    { from: 'wo-release', to: 'andon', label: 'visible to floor', kind: 'event' },

    // HMI setup chain (auto-generated groups marked AUTO)
    { from: 'hmi-login', to: 'hmi-wo', label: 'authenticated', kind: 'flow' },
    { from: 'hmi-wo', to: 'hmi-skills', label: 'WO selected', kind: 'flow' },
    { from: 'hmi-skills', to: 'hmi-bom', label: 'auto', kind: 'auto' },
    { from: 'hmi-bom', to: 'hmi-tools', label: 'auto', kind: 'auto' },
    { from: 'hmi-tools', to: 'hmi-recipe', label: 'auto', kind: 'auto' },
    { from: 'hmi-recipe', to: 'hmi-first', label: 'recipe loaded', kind: 'flow' },
    { from: 'hmi-first', to: 'hmi-prod', label: 'QC approved', kind: 'flow' },

    // Execution loop
    { from: 'hmi-prod', to: 'hmi-parallel', label: 'device step', kind: 'flow' },
    { from: 'hmi-parallel', to: 'hmi-device', label: 'main', kind: 'flow' },
    { from: 'hmi-device', to: 'hmi-prod', label: 'OK · next piece', kind: 'flow' },
    { from: 'hmi-device', to: 'hmi-nok', label: 'NOK', kind: 'recovery' },
    { from: 'hmi-nok', to: 'hmi-recover', label: 'recoverable', kind: 'recovery' },
    { from: 'hmi-recover', to: 'hmi-device', label: 'retry', kind: 'recovery' },
    { from: 'hmi-nok', to: 'hmi-qc', label: 'scrap', kind: 'recovery' },
    { from: 'hmi-prod', to: 'hmi-pause', label: 'hold', kind: 'event' },
    { from: 'hmi-pause', to: 'andon', label: 'escalate', kind: 'event' },
    { from: 'hmi-pause', to: 'hmi-prod', label: 'resume', kind: 'flow' },

    // Execution → QC
    { from: 'hmi-prod', to: 'wo-execution', label: 'cycle data', kind: 'data' },
    { from: 'hmi-device', to: 'wo-quality', label: 'OK/NOK', kind: 'data' },
    { from: 'hmi-prod', to: 'hmi-qc', label: 'final gate', kind: 'flow' },
    { from: 'hmi-qc', to: 'wo-quality', label: 'outcome', kind: 'data' },
    { from: 'hmi-qc', to: 'wo-genealogy', label: 'lot/serial trace', kind: 'data' },

    // QC → Outbound
    { from: 'hmi-qc', to: 'hmi-pack', label: 'OK', kind: 'flow' },
    { from: 'hmi-pack', to: 'hmi-teardown', label: 'box sealed', kind: 'flow' },
    { from: 'hmi-pack', to: 'box-ship', label: 'box → ship', kind: 'data' },
    { from: 'hmi-teardown', to: 'wo-complete', label: 'operator done', kind: 'flow' },
    { from: 'wo-complete', to: 'box-ship', label: 'shipping doc', kind: 'event' },
    { from: 'box-ship', to: 'box-cycle', label: 'returnable', kind: 'flow' },
    { from: 'box-cycle', to: 'boxes', label: 'cycle++', kind: 'data' },

    // Cross-cutting back to Andon / Dashboard
    { from: 'wo-complete', to: 'dashboard', label: 'KPIs', kind: 'data' },
    { from: 'andon', to: 'dashboard', label: 'live status', kind: 'data' },
  ];

  // Decision diamonds rendered as nodes too
  const DECISIONS = [
    { id: 'd-validate', x: 1990, y: 880, label: 'All checks OK?', phase: 'planning' },
    { id: 'd-device',   x: 1230, y: 1980, label: 'Device result?', phase: 'execution' },
    { id: 'd-recover',  x: 1550, y: 1980, label: 'Recoverable?', phase: 'execution' },
    { id: 'd-qc',       x: 410,  y: 2720, label: 'QC pass?', phase: 'qc' },
  ];

  return { PHASES, NODES, EDGES, DECISIONS, CANVAS: { w: 2900, h: 3360 } };
})();
