/* global React, cx, Icon, Btn, Badge, StatusBadge */
const { useState: useStateV, useRef: useRefV, useEffect: useEffectV } = React;

/*
  VIEWS & CANVAS — extension to the RAMS Design System.
  Adds the patterns needed for registries (tree/grid/table switcher, empty state,
  tree node with metric, registry card tile) and the spatial canvas family
  (viewport chrome, generic node, edge styles, toolbar, inspector + 3 recipes:
   workflow designer, plant map, process routing).
  Vocabulary aligns with React Flow: nodes, edges, handles, viewport, minimap.
*/

// ============================================================
// SECTION HELPERS (mirror dashboard file)
// ============================================================
const VSection = ({ id, label, title, sub, children }) => (
  <section id={id} className="py-10 hairline-b">
    <div className="max-w-[1200px] mx-auto px-8">
      <div className="uppercase-label mb-1.5">{label}</div>
      <h2 id={id} className="text-[18px] font-semibold tracking-tight scroll-mt-16">{title}</h2>
      {sub && <p className="text-[13px] text-[var(--ink-3)] mt-1.5 max-w-[680px]">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </section>
);

const VStage = ({ children, padded = true, className }) => (
  <div className={cx('hairline rounded-[var(--r-2)] overflow-hidden bg-[var(--paper)]', className)}>
    <div className="uppercase-label px-3 py-1.5 hairline-b bg-[var(--paper-2)] flex items-center gap-2">
      <span className="dot" style={{ background: 'var(--accent)' }} />
      <span>Live preview</span>
    </div>
    <div className={cx(padded && 'p-5')}>{children}</div>
  </div>
);

const VCode = ({ children }) => (
  <pre className="mono text-[11px] bg-[var(--paper-2)] hairline rounded-[var(--r-1)] p-2.5 leading-relaxed overflow-x-auto whitespace-pre">
    {children}
  </pre>
);

const VTwoCol = ({ preview, code, codeRatio = '1fr 1fr' }) => (
  <div className="grid gap-4 items-start" style={{ gridTemplateColumns: codeRatio }}>
    <VStage>{preview}</VStage>
    <div>
      <div className="uppercase-label mb-2">JSX</div>
      <VCode>{code}</VCode>
    </div>
  </div>
);

// ============================================================
// 1. VIEW SWITCHER  (segmented icon control)
// ============================================================
const VIEW_ICONS = {
  tree:    { d: 'M3 5h6M3 10h4M3 15h4M3 20h6M9 5v15M9 10h4M9 15h4M13 10v5M13 5h6M13 20h6', label: 'Tree' },
  grid:    { d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', label: 'Grid' },
  table:   { d: 'M3 6h18M3 12h18M3 18h18M8 3v18M16 3v18', label: 'Table' },
  kanban:  { d: 'M3 3h5v18H3zM10 3h5v12h-5zM17 3h5v15h-5z', label: 'Kanban' },
  timeline:{ d: 'M3 6h6M11 6h4M17 6h4M3 12h3M8 12h8M18 12h3M3 18h10M15 18h6', label: 'Timeline' },
  map:     { d: 'M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14', label: 'Map' },
  canvas:  { d: 'M3 3h18v18H3zM3 9h18M9 3v18M15 9v12', label: 'Canvas' },
};

const VIcon = ({ name, size = 16 }) => {
  const def = VIEW_ICONS[name];
  if (!def) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={def.d} />
    </svg>
  );
};

const ViewSwitcher = ({ value, onChange, views }) => (
  <div className="hairline rounded-[var(--r-1)] inline-flex bg-[var(--paper)] overflow-hidden" role="group">
    {views.map((v, i) => (
      <button key={v}
        onClick={() => onChange(v)}
        title={VIEW_ICONS[v]?.label}
        className={cx(
          'h-8 w-9 flex items-center justify-center transition-colors',
          i > 0 && 'border-l border-[var(--line)]',
          value === v
            ? 'bg-[var(--ink)] text-[var(--paper)]'
            : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
        )}>
        <VIcon name={v} size={14} />
      </button>
    ))}
  </div>
);

const ViewSwitcherSection = () => {
  const [v1, setV1] = useStateV('tree');
  const [v2, setV2] = useStateV('grid');
  return (
    <VSection id="view-switcher" label="Views" title="View Switcher" sub="Segmented icon control to flip between visualisations of the same dataset. Each registry persists its own choice; saved views include the view-mode. The active view is dark-filled — high contrast so it never gets lost in a dense filter bar.">
      <VTwoCol
        preview={
          <div className="space-y-5">
            <div>
              <div className="uppercase-label mb-2">3 views — Equipment registry</div>
              <ViewSwitcher value={v1} onChange={setV1} views={['tree','grid','table']} />
              <div className="mt-2 text-[11.5px] text-[var(--ink-3)] mono">selected: {v1}</div>
            </div>
            <div>
              <div className="uppercase-label mb-2">5 views — Work Orders</div>
              <ViewSwitcher value={v2} onChange={setV2} views={['table','kanban','timeline','grid','canvas']} />
              <div className="mt-2 text-[11.5px] text-[var(--ink-3)] mono">selected: {v2}</div>
            </div>
            <div>
              <div className="uppercase-label mb-2">In context — filter bar</div>
              <div className="hairline rounded-[var(--r-2)] bg-[var(--paper-2)] px-3 py-2 flex items-center gap-2">
                <div className="hairline rounded-[var(--r-1)] bg-[var(--paper)] px-2 h-8 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)] flex-1 max-w-[260px]">
                  <Icon name="search" size={12} /> Cerca nome o codice…
                </div>
                <select className="h-8 px-2 text-[12px] bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-1)]"><option>Tutte le classi</option></select>
                <select className="h-8 px-2 text-[12px] bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-1)]"><option>Tutti gli stati</option></select>
                <ViewSwitcher value={v1} onChange={setV1} views={['tree','grid','table']} />
                <Btn variant="primary" icon="plus" size="sm">Nuovo</Btn>
              </div>
            </div>
          </div>
        }
        code={`<ViewSwitcher
  value={view}
  onChange={setView}
  views={['tree','grid','table']}   // any of:
  // tree · grid · table · kanban · timeline · map · canvas
/>

// Persist per-registry, not globally:
localStorage.setItem(\`rams.view.\${registryId}\`, view);`}
      />
    </VSection>
  );
};

// ============================================================
// 2. TREE NODE  (with optional inline metric)
// ============================================================
const TreeNode = ({ icon = 'factory', label, sub, expanded, hasChildren, depth = 0, selected, metric, status, match }) => (
  <div className={cx(
    'flex items-center gap-2 h-8 pr-2 cursor-pointer text-[13px] rounded',
    selected ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'hover:bg-[var(--paper-2)]'
  )} style={{ paddingLeft: 8 + depth * 16 }}>
    <span className="w-3 flex-shrink-0 text-[var(--ink-3)]">
      {hasChildren ? (
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }}>
          <path d="M3 2l4 3-4 3z" fill="currentColor" />
        </svg>
      ) : null}
    </span>
    <Icon name={icon} size={13} className={cx('flex-shrink-0', selected ? 'text-[var(--accent)]' : 'text-[var(--ink-3)]')} />
    <span className="flex-1 min-w-0 truncate">
      {match ? (
        <>
          {label.split(new RegExp(`(${match})`, 'i')).map((part, i) =>
            part.toLowerCase() === match.toLowerCase()
              ? <mark key={i} style={{ background: 'var(--warn-soft)', color: 'var(--ink)', padding: '0 2px', borderRadius: 2 }}>{part}</mark>
              : <span key={i}>{part}</span>
          )}
        </>
      ) : label}
      {sub && <span className="text-[11px] text-[var(--ink-3)] mono ml-2">{sub}</span>}
    </span>
    {metric && (
      <div className="flex items-center gap-1.5">
        <div style={{ width: 36, height: 4, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${metric.value}%`, height: '100%', background: `var(--${metric.tone || 'ok'})` }} />
        </div>
        {status && <span className="dot" style={{ background: `var(--${status})`, width: 6, height: 6 }} />}
      </div>
    )}
    {!metric && status && <span className="dot" style={{ background: `var(--${status})`, width: 6, height: 6 }} />}
  </div>
);

const TreeNodeSection = () => (
  <VSection id="tree-node" label="Views" title="Tree Node" sub="Single row in a hierarchical tree. Optional expand caret, leading icon, label with sub-code, inline metric (mini progress bar) and status dot. Search match highlights matching substring with --warn-soft. Indent step 16px per depth.">
    <VTwoCol
      preview={
        <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-2 max-w-[420px] space-y-0.5">
          <div className="uppercase-label px-2 mb-1.5">Gerarchia</div>
          <TreeNode icon="factory" label="Stabilimento Bologna" hasChildren expanded depth={0} status="ok" />
          <TreeNode icon="cube" label="Area Magazzino" hasChildren expanded depth={1} metric={{ value: 72, tone: 'ok' }} status="ok" />
          <TreeNode icon="package" label="Magazzino Materie Prime" hasChildren depth={2} metric={{ value: 58, tone: 'ok' }} status="ok" />
          <TreeNode icon="package" label="Magazzino Prodotti Finiti" hasChildren depth={2} metric={{ value: 41, tone: 'warn' }} status="ok" />
          <TreeNode icon="wrench" label="Area Manutenzione" depth={1} status="ok" />
          <TreeNode icon="cog" label="Area Produzione" hasChildren expanded depth={1} status="ok" />
          <TreeNode icon="cog" label="Work Center Assemblaggio" hasChildren depth={2} selected status="ok" />
          <TreeNode icon="cog" label="Work Center Packaging" depth={2} status="ok" />
          <TreeNode icon="flask" label="Area Test & Collaudo" hasChildren expanded depth={1} status="ok" />
          <TreeNode icon="flask" label="Work Center Test Funzionale" hasChildren depth={2} match="Test" status="warn" />
        </div>
      }
      code={`<TreeNode
  icon="factory"
  label="Stabilimento Bologna"
  depth={0}
  hasChildren expanded
  status="ok"                  // optional dot at far right
  metric={{ value: 72, tone: 'ok' }}  // optional mini bar
  selected                     // accent-soft fill
  match="Test"                 // highlight substring
/>`}
    />
  </VSection>
);

// ============================================================
// 3. EMPTY STATE
// ============================================================
const EmptyIllust = ({ kind = 'select' }) => {
  const factory = (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="32" width="52" height="22" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M6 32l10-7v7M16 32l10-7v7M26 32l10-7v7M36 32l10-7v7" stroke="var(--ink-3)" strokeWidth="1.5" />
      <rect x="46" y="14" width="6" height="18" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M48 14l-2-4 4-2-2-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="12" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
      <rect x="22" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
      <rect x="32" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
      <rect x="42" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
    </svg>
  );
  const search = (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="26" cy="26" r="14" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M37 37l12 12" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 26h8M26 22v8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
  const data = (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="14" width="48" height="36" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M8 22h48M20 14v36M32 14v36M44 14v36" stroke="var(--ink-3)" strokeWidth="1" />
      <path d="M14 32l4-3 4 3M26 36l4-3 4 3M38 30l4-3 4 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </svg>
  );
  const error = (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M32 8L4 56h56L32 8z" stroke="var(--bad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M32 28v12M32 48v.5" stroke="var(--bad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  return { select: factory, search, data, error }[kind] || factory;
};

const EmptyState = ({ kind = 'select', title, body, cta, compact }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', padding: compact ? 24 : 48, gap: 12,
  }}>
    <EmptyIllust kind={kind} />
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
      {body && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, maxWidth: 340 }}>{body}</div>}
    </div>
    {cta}
  </div>
);

const EmptyStateSection = () => (
  <VSection id="empty-state" label="Views" title="Empty State" sub="Four canonical kinds: select (no selection in a split view) · search (no results) · data (no records yet) · error (load failure). Illustrations are line-only, accent for the focal moment, never colored fills.">
    <VTwoCol
      preview={
        <div className="grid grid-cols-2 gap-3">
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper-2)]">
            <EmptyState kind="select" title="Seleziona un equipment dall'albero" body="oppure clicca su un nodo per aprire il dettaglio" />
          </div>
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper-2)]">
            <EmptyState kind="search" title="Nessun risultato" body="Prova a rimuovere uno dei filtri attivi o a cercare con un altro termine." cta={<Btn variant="default" size="sm" icon="x">Reset filtri</Btn>} />
          </div>
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper-2)]">
            <EmptyState kind="data" title="Nessun work order oggi" body="Il primo turno parte alle 06:00. Crea un WO manualmente per anticipare." cta={<Btn variant="primary" size="sm" icon="plus">Nuovo WO</Btn>} />
          </div>
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper-2)]">
            <EmptyState kind="error" title="Impossibile caricare" body="Connessione al MES interrotta. Riprova tra qualche secondo." cta={<Btn variant="default" size="sm" icon="refresh">Riprova</Btn>} />
          </div>
        </div>
      }
      code={`<EmptyState
  kind="select"        // select · search · data · error
  title="Seleziona un equipment dall'albero"
  body="oppure clicca su un nodo per aprire il dettaglio"
  cta={<Btn variant="primary">Nuovo</Btn>}   // optional
  compact                                    // 24px padding instead of 48
/>`}
    />
  </VSection>
);

// ============================================================
// 4. SPLIT VIEW BROWSER (recipe — tree + detail)
// ============================================================
const SplitViewSection = () => (
  <VSection id="split-view" label="Recipes" title="Split View Browser" sub="Tree on the left (240–280px), detail on the right. The detail panel renders one of: empty state (no selection), loading skeleton, the selected entity's detail. Equipment / BOM / Org structure all use this shell.">
    <VStage padded={false}>
      <div className="grid" style={{ gridTemplateColumns: '260px 1fr', height: 360 }}>
        <div className="hairline-r p-2 overflow-auto">
          <div className="uppercase-label px-2 mb-1.5">Gerarchia</div>
          <div className="space-y-0.5">
            <TreeNode icon="factory" label="Stabilimento Bologna" hasChildren expanded depth={0} status="ok" />
            <TreeNode icon="cube" label="Area Magazzino" hasChildren expanded depth={1} metric={{ value: 72, tone: 'ok' }} status="ok" />
            <TreeNode icon="package" label="Magazzino MP" hasChildren depth={2} metric={{ value: 58, tone: 'ok' }} status="ok" />
            <TreeNode icon="package" label="Magazzino PF" hasChildren depth={2} metric={{ value: 41, tone: 'warn' }} status="ok" />
            <TreeNode icon="wrench" label="Area Manutenzione" depth={1} status="ok" />
            <TreeNode icon="cog" label="Area Produzione" hasChildren expanded depth={1} status="ok" />
            <TreeNode icon="cog" label="WC Assemblaggio" hasChildren depth={2} status="ok" />
            <TreeNode icon="cog" label="WC Packaging" depth={2} status="ok" />
          </div>
        </div>
        <div className="bg-[var(--paper-2)] flex items-center justify-center">
          <EmptyState kind="select" title="Seleziona un equipment dall'albero" body="oppure clicca su un nodo per aprire il dettaglio" />
        </div>
      </div>
    </VStage>
    <div className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Tree width</div>
        <div className="text-[var(--ink-2)]">240–280px · resizable handle on hover · min 200 / max 420.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Selection sync</div>
        <div className="text-[var(--ink-2)]">URL hash carries the selected id so deep-linking works (<span className="mono">/equipment#wc-assembly</span>).</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Mobile</div>
        <div className="text-[var(--ink-2)]">Below 800px the tree collapses behind a back button; selection pushes a route.</div>
      </div>
    </div>
  </VSection>
);

// ============================================================
// 5. CARD GRID + REGISTRY TILE
// ============================================================
const RegistryTile = ({ code, title, sub, status, kpi, kpiLabel, photo }) => (
  <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] overflow-hidden cursor-pointer hover:border-[var(--accent)] transition-colors">
    <div className="h-24 bg-[var(--paper-2)] relative striped flex items-center justify-center">
      <span className="mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">{photo}</span>
      {status && <span className="absolute top-2 right-2"><StatusBadge status={status} /></span>}
    </div>
    <div className="p-3">
      <div className="mono text-[10.5px] text-[var(--ink-3)]">{code}</div>
      <div className="text-[13px] font-semibold leading-tight mt-0.5 line-clamp-2">{title}</div>
      {sub && <div className="text-[11px] text-[var(--ink-3)] mt-1">{sub}</div>}
      {kpi && (
        <div className="mt-2 pt-2 hairline-t flex items-baseline justify-between">
          <span className="uppercase-label">{kpiLabel}</span>
          <span className="mono tabular text-[14px] font-semibold">{kpi}</span>
        </div>
      )}
    </div>
  </div>
);

const CardGridSection = () => {
  const [density, setDensity] = useStateV('balanced');
  const cols = density === 'compact' ? 6 : density === 'balanced' ? 4 : 3;
  return (
    <VSection id="card-grid" label="Recipes" title="Card Grid" sub="Visual-first listing. Use when identity (photo, status at-a-glance) matters more than density. Three densities: compact 6 col · balanced 4 col · spacious 3 col. Each tile = registry tile component.">
      <VStage padded={false}>
        <div className="px-3 py-2 hairline-b bg-[var(--paper-2)] flex items-center gap-2">
          <span className="uppercase-label">Density</span>
          <div className="hairline rounded-[var(--r-1)] inline-flex bg-[var(--paper)] overflow-hidden">
            {['compact','balanced','spacious'].map((d, i) => (
              <button key={d} onClick={() => setDensity(d)}
                className={cx('h-7 px-2.5 text-[11px]', i > 0 && 'border-l border-[var(--line)]',
                  density === d ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]')}>
                {d}
              </button>
            ))}
          </div>
          <span className="ml-auto mono text-[11px] text-[var(--ink-3)]">{cols} col</span>
        </div>
        <div className="p-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {[
            { code: 'EQ-WC-A2', title: 'Assembly Line 2', sub: 'Area Produzione', status: 'in_use', kpi: '81%', kpiLabel: 'OEE', photo: 'wc photo' },
            { code: 'EQ-WC-B1', title: 'CNC Cell 1', sub: 'Area Produzione', status: 'in_use', kpi: '76%', kpiLabel: 'OEE', photo: 'wc photo' },
            { code: 'EQ-WC-C1', title: 'Assembly Line 1', sub: 'Area Produzione', status: 'maintenance', kpi: '62%', kpiLabel: 'OEE', photo: 'wc photo' },
            { code: 'EQ-WC-D1', title: 'Quality Lab', sub: 'Area Test & Collaudo', status: 'available', kpi: '—', kpiLabel: 'OEE', photo: 'wc photo' },
            { code: 'EQ-MM-01', title: 'Magazzino MP — Sezione A', sub: 'Area Magazzino', status: 'in_use', kpi: '58%', kpiLabel: 'Fill', photo: 'wh photo' },
            { code: 'EQ-MP-02', title: 'Magazzino PF — Sezione B', sub: 'Area Magazzino', status: 'in_use', kpi: '41%', kpiLabel: 'Fill', photo: 'wh photo' },
          ].map(t => <RegistryTile key={t.code} {...t} />)}
        </div>
      </VStage>
      <div className="mt-3">
        <div className="uppercase-label mb-2">JSX</div>
        <VCode>{`<RegistryTile
  code="EQ-WC-A2"
  title="Assembly Line 2"
  sub="Area Produzione"
  status="in_use"          // any StatusBadge value
  kpi="81%"  kpiLabel="OEE"
  photo="wc photo"         // placeholder label until real image
/>`}</VCode>
      </div>
    </VSection>
  );
};

// ============================================================
// 6. CANVAS — VIEWPORT + CHROME
// ============================================================
const CanvasGrid = ({ children, h = 320 }) => (
  <div style={{
    position: 'relative', height: h, overflow: 'hidden',
    background: 'var(--paper-2)',
    backgroundImage: 'radial-gradient(circle, var(--ink-3) 0.6px, transparent 0.6px)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0',
    opacity: 1,
  }}>
    {children}
  </div>
);

const ZoomControls = () => (
  <div className="hairline rounded-[var(--r-1)] bg-[var(--paper)] inline-flex flex-col overflow-hidden" style={{ position: 'absolute', bottom: 12, right: 12 }}>
    <button className="w-8 h-8 flex items-center justify-center hover:bg-[var(--paper-2)]"><Icon name="plus" size={14} /></button>
    <button className="w-8 h-8 flex items-center justify-center hover:bg-[var(--paper-2)] hairline-t"><Icon name="minus" size={14} /></button>
    <button className="w-8 h-8 flex items-center justify-center hover:bg-[var(--paper-2)] hairline-t" title="Fit"><Icon name="expand" size={13} /></button>
    <div className="hairline-t h-7 px-1 flex items-center justify-center mono text-[10px] tabular text-[var(--ink-3)]">90%</div>
  </div>
);

const Minimap = () => (
  <div className="hairline rounded-[var(--r-1)] bg-[var(--paper)]" style={{ position: 'absolute', bottom: 12, left: 12, width: 120, height: 80, padding: 4 }}>
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--paper-2)', borderRadius: 2 }}>
      {/* miniature node dots */}
      <div style={{ position: 'absolute', left: 12, top: 10, width: 14, height: 8, background: 'var(--ink-3)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', left: 38, top: 22, width: 14, height: 8, background: 'var(--accent)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', left: 64, top: 14, width: 14, height: 8, background: 'var(--ink-3)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', left: 38, top: 48, width: 14, height: 8, background: 'var(--ink-3)', borderRadius: 1 }} />
      {/* viewport indicator */}
      <div className="hairline" style={{ position: 'absolute', left: 24, top: 8, width: 60, height: 36, borderColor: 'var(--accent)', borderWidth: 1.5, borderRadius: 2, background: 'color-mix(in oklch, var(--accent) 12%, transparent)' }} />
    </div>
  </div>
);

const CanvasToolbar = () => (
  <div className="hairline rounded-[var(--r-1)] bg-[var(--paper)] inline-flex overflow-hidden" style={{ position: 'absolute', top: 12, left: 12 }}>
    {[
      { i: 'arrowR', t: 'Pan' },
      { i: 'target', t: 'Select' },
      { i: 'plus', t: 'Add node' },
      { i: 'flow', t: 'Connect' },
      { i: 'edit', t: 'Annotate' },
    ].map((b, i) => (
      <button key={b.i} title={b.t} className={cx('w-8 h-8 flex items-center justify-center hover:bg-[var(--paper-2)]', i > 0 && 'hairline-l', i === 1 && 'bg-[var(--paper-2)] text-[var(--accent-ink)]')}>
        <Icon name={b.i} size={13} />
      </button>
    ))}
  </div>
);

const CanvasStateBar = () => (
  <div className="inline-flex items-center gap-2 hairline rounded-[var(--r-1)] bg-[var(--paper)] px-2 h-8 text-[11px]" style={{ position: 'absolute', top: 12, right: 12 }}>
    <span className="dot" style={{ background: 'var(--warn)' }} />
    <span className="text-[var(--ink-2)]">Unsaved changes</span>
    <span className="text-[var(--ink-3)]">·</span>
    <span className="mono tabular text-[var(--ink-3)]">12 nodes · 14 edges</span>
    <span className="text-[var(--ink-3)]">·</span>
    <Btn variant="ghost" size="sm">Undo</Btn>
    <Btn variant="primary" size="sm" icon="save">Save</Btn>
  </div>
);

// ============================================================
// 7. CANVAS — GENERIC NODE  (workflow-style with handles)
// ============================================================
const GenericNode = ({ x, y, w = 180, icon = 'workflow', kicker, title, sub, status = 'neutral', selected, invalid, ports = ['in','out'] }) => (
  <div className="hairline" style={{
    position: 'absolute', left: x, top: y, width: w,
    background: 'var(--paper)',
    borderRadius: 'var(--r-2)',
    borderColor: invalid ? 'var(--bad)' : selected ? 'var(--accent)' : 'var(--line)',
    borderWidth: selected || invalid ? 1.5 : 1,
    boxShadow: selected ? '0 0 0 4px color-mix(in oklch, var(--accent) 14%, transparent)' : 'none',
    fontSize: 12,
  }}>
    {/* input handle */}
    {ports.includes('in') && (
      <span style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 9, height: 9, background: 'var(--paper)', border: '1.5px solid var(--ink-2)', borderRadius: 999 }} />
    )}
    {/* output handle */}
    {ports.includes('out') && (
      <span style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 9, height: 9, background: 'var(--paper)', border: '1.5px solid var(--ink-2)', borderRadius: 999 }} />
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
      <Icon name={icon} size={13} className="text-[var(--accent)]" />
      <span className="uppercase-label flex-1 truncate">{kicker}</span>
      <span className="dot" style={{ background: `var(--${status})` }} />
    </div>
    <div style={{ padding: '8px 10px' }}>
      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{title}</div>
      {sub && <div style={{ color: 'var(--ink-3)', fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

// SVG edge between two coords; orthogonal (right-angle) or bezier
const Edge = ({ from, to, kind = 'bezier', label, animated, tone = 'ink' }) => {
  const stroke = tone === 'accent' ? 'var(--accent)' : tone === 'bad' ? 'var(--bad)' : 'var(--ink-3)';
  let d = '';
  if (kind === 'bezier') {
    const dx = Math.abs(to.x - from.x) * 0.5;
    d = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
  } else if (kind === 'orthogonal') {
    const midX = (from.x + to.x) / 2;
    d = `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  } else {
    d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const labelX = (from.x + to.x) / 2;
  const labelY = (from.y + to.y) / 2 - 6;
  return (
    <g>
      <path d={d} stroke={stroke} strokeWidth={1.5} fill="none" markerEnd={`url(#arrow-${tone})`}
        strokeDasharray={animated ? '4 3' : '0'}>
        {animated && <animate attributeName="stroke-dashoffset" from="0" to="-7" dur="0.6s" repeatCount="indefinite" />}
      </path>
      {label && (
        <g>
          <rect x={labelX - 28} y={labelY - 8} width={56} height={16} rx={3} fill="var(--paper)" stroke={stroke} strokeWidth={0.8} />
          <text x={labelX} y={labelY + 3} textAnchor="middle" fontSize={10} fill="var(--ink-2)" fontFamily="JetBrains Mono">{label}</text>
        </g>
      )}
    </g>
  );
};

const ArrowDefs = () => (
  <defs>
    {['ink','accent','bad'].map(t => (
      <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 0 L10 5 L0 10 z" fill={t === 'accent' ? 'var(--accent)' : t === 'bad' ? 'var(--bad)' : 'var(--ink-3)'} />
      </marker>
    ))}
  </defs>
);

const CanvasFoundationSection = () => (
  <VSection id="canvas-foundation" label="Canvas" title="Canvas Foundation" sub="The shared chrome under every spatial canvas (Workflow Designer, Plant Map, Routing). Vocabulary follows React Flow: nodes, edges, handles, viewport, minimap. Dotted grid background = always; solid lines = optional, only for plant map.">
    <VStage padded={false}>
      <div style={{ position: 'relative' }}>
        <CanvasGrid h={380}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <ArrowDefs />
            <Edge from={{ x: 200, y: 90 }} to={{ x: 280, y: 90 }} />
            <Edge from={{ x: 460, y: 90 }} to={{ x: 540, y: 90 }} tone="accent" label="approved" />
            <Edge from={{ x: 460, y: 90 }} to={{ x: 540, y: 230 }} kind="orthogonal" tone="bad" label="rejected" />
          </svg>
          <GenericNode x={20}  y={60}  icon="play"     kicker="trigger"  title="WO released" sub="auto" status="ok" ports={['out']} />
          <GenericNode x={280} y={60}  icon="clipboard" kicker="form"     title="Operator check-in" sub="3 fields" status="ok" selected />
          <GenericNode x={540} y={60}  icon="cog"      kicker="auto"     title="Generate route" sub="based on item" status="ok" />
          <GenericNode x={540} y={200} icon="alert"    kicker="hold"     title="Notify supervisor" sub="missing approval" status="bad" invalid />
          <CanvasToolbar />
          <CanvasStateBar />
          <Minimap />
          <ZoomControls />
        </CanvasGrid>
      </div>
    </VStage>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div>
        <div className="uppercase-label mb-2">Generic Node</div>
        <VCode>{`<GenericNode
  x={280} y={60}
  icon="clipboard"
  kicker="form"
  title="Operator check-in"
  sub="3 fields"
  status="ok"          // ok · warn · bad · neutral
  selected             // accent border + soft ring
  invalid              // bad border (validation)
  ports={['in','out']} // which handles to render
/>`}</VCode>
      </div>
      <div>
        <div className="uppercase-label mb-2">Edge</div>
        <VCode>{`<Edge
  from={{ x: 200, y: 90 }}
  to={{   x: 280, y: 90 }}
  kind="bezier"        // bezier · orthogonal · straight
  tone="accent"        // ink · accent · bad
  label="approved"     // optional pill on the line
  animated             // marching ants for data-flow viz
/>`}</VCode>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-4 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Toolbar</div>
        <div className="text-[var(--ink-2)]">Top-left · Pan · Select · Add · Connect · Annotate.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">State bar</div>
        <div className="text-[var(--ink-2)]">Top-right · dirty flag, count, undo, save.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Minimap</div>
        <div className="text-[var(--ink-2)]">Bottom-left · 120×80px · viewport box draggable.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Zoom</div>
        <div className="text-[var(--ink-2)]">Bottom-right · in/out/fit + % display.</div>
      </div>
    </div>
  </VSection>
);

// ============================================================
// 8. PROPERTIES INSPECTOR
// ============================================================
const InspectorSection = () => (
  <VSection id="canvas-inspector" label="Canvas" title="Properties Inspector" sub="Right-side drawer that mirrors selection: 0 selected = empty hint, 1 selected = property form, 2+ selected = bulk edit. Width 320–360px, hairline-l, sticky to canvas. Closes via × or click on canvas background.">
    <VStage padded={false}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 320px', height: 360 }}>
        <CanvasGrid h={360}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <ArrowDefs />
            <Edge from={{ x: 180, y: 100 }} to={{ x: 260, y: 100 }} />
          </svg>
          <GenericNode x={20} y={70} icon="play" kicker="trigger" title="WO released" status="ok" ports={['out']} />
          <GenericNode x={260} y={70} icon="clipboard" kicker="form" title="Operator check-in" sub="3 fields" status="ok" selected />
        </CanvasGrid>
        <div className="hairline-l bg-[var(--paper)] flex flex-col">
          <div className="px-3 h-10 flex items-center justify-between hairline-b">
            <div className="flex items-center gap-2">
              <Icon name="clipboard" size={13} className="text-[var(--accent)]" />
              <span className="font-semibold text-[12.5px]">Operator check-in</span>
            </div>
            <Icon name="x" size={13} className="text-[var(--ink-3)] cursor-pointer" />
          </div>
          <div className="p-3 space-y-3 overflow-auto flex-1 text-[12px]">
            <div>
              <div className="uppercase-label mb-1">Node id</div>
              <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2 h-7 flex items-center mono text-[11.5px]">node-cfg-checkin-01</div>
            </div>
            <div>
              <div className="uppercase-label mb-1">Type</div>
              <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2 h-7 flex items-center text-[12px]">Form (input)</div>
            </div>
            <div>
              <div className="uppercase-label mb-1">Title</div>
              <input className="hairline rounded-[var(--r-1)] bg-[var(--paper)] px-2 h-7 w-full text-[12px] outline-none focus:border-[var(--accent)]" defaultValue="Operator check-in" />
            </div>
            <div>
              <div className="uppercase-label mb-1">Fields (3)</div>
              <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] divide-y divide-[var(--line)]">
                {['Operator badge', 'Shift', 'Notes'].map(f => (
                  <div key={f} className="px-2 h-7 flex items-center justify-between text-[11.5px]">
                    <span>{f}</span>
                    <Icon name="dots" size={12} className="text-[var(--ink-3)]" />
                  </div>
                ))}
              </div>
              <button className="text-[11.5px] text-[var(--accent-ink)] mt-1.5 flex items-center gap-1"><Icon name="plus" size={11} /> Add field</button>
            </div>
            <div>
              <div className="uppercase-label mb-1">Required</div>
              <div className="flex items-center gap-2 text-[12px]"><input type="checkbox" defaultChecked /> Operator must complete</div>
            </div>
          </div>
          <div className="hairline-t px-3 h-10 flex items-center justify-between bg-[var(--paper-2)]">
            <Btn variant="ghost" size="sm" icon="trash">Delete</Btn>
            <span className="mono text-[10.5px] text-[var(--ink-3)]">edited 2m ago</span>
          </div>
        </div>
      </div>
    </VStage>
    <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Empty state</div>
        <div className="text-[var(--ink-2)]">"Select a node to edit" — same EmptyState component, kind=select.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Multi-select</div>
        <div className="text-[var(--ink-2)]">"3 nodes selected · bulk edit" header, then only common props.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Validation</div>
        <div className="text-[var(--ink-2)]">Bad border on canvas + red field outline + error toast on save.</div>
      </div>
    </div>
  </VSection>
);

// ============================================================
// 9. RECIPE — WORKFLOW DESIGNER
// ============================================================
const WorkflowRecipe = () => (
  <VSection id="recipe-workflow" label="Recipes" title="Workflow Designer" sub="The visual builder for RAMS workflows. Left palette of node types, center canvas with auto-layout (top-down or left-right), right inspector. Node types are pinned to the 6 phases via --c-{phase} accent.">
    <VStage padded={false}>
      <div className="grid" style={{ gridTemplateColumns: '180px 1fr 280px', height: 420 }}>
        {/* Palette */}
        <div className="hairline-r bg-[var(--paper-2)] p-2 overflow-auto">
          <div className="uppercase-label px-1.5 mb-1.5">Node palette</div>
          {[
            { i: 'play', l: 'Trigger', s: 'WO released' },
            { i: 'clipboard', l: 'Form', s: 'Operator input' },
            { i: 'check', l: 'Approval', s: 'Supervisor' },
            { i: 'cog', l: 'Auto', s: 'Server-side' },
            { i: 'flow', l: 'Branch', s: 'Conditional' },
            { i: 'clock', l: 'Wait', s: 'Timer' },
            { i: 'alert', l: 'Notify', s: 'Email/SMS' },
            { i: 'target', l: 'End', s: 'Terminate' },
          ].map(n => (
            <div key={n.l} className="hairline rounded-[var(--r-1)] bg-[var(--paper)] px-2 py-1.5 mb-1.5 cursor-grab flex items-center gap-2 text-[11.5px] hover:border-[var(--accent)]">
              <Icon name={n.i} size={12} className="text-[var(--accent)]" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{n.l}</div>
                <div className="text-[10px] text-[var(--ink-3)] truncate">{n.s}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Canvas */}
        <div style={{ position: 'relative' }}>
          <CanvasGrid h={420}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <ArrowDefs />
              <Edge from={{ x: 170, y: 80 }} to={{ x: 240, y: 80 }} />
              <Edge from={{ x: 410, y: 80 }} to={{ x: 480, y: 80 }} />
              <Edge from={{ x: 650, y: 80 }} to={{ x: 720, y: 80 }} tone="accent" label="approved" />
              <Edge from={{ x: 650, y: 80 }} to={{ x: 720, y: 220 }} kind="orthogonal" tone="bad" label="rejected" />
              <Edge from={{ x: 720, y: 260 }} to={{ x: 530, y: 100 }} kind="orthogonal" />
            </svg>
            <GenericNode x={10}  y={50}  w={160} icon="play"      kicker="inbound"    title="WO released"        status="ok"   ports={['out']} />
            <GenericNode x={240} y={50}  w={170} icon="clipboard" kicker="setup"      title="Operator check-in"  sub="3 fields" status="ok" />
            <GenericNode x={480} y={50}  w={170} icon="check"     kicker="setup"      title="Supervisor approve" sub="role: SV"  status="warn" />
            <GenericNode x={720} y={50}  w={170} icon="cog"       kicker="production" title="Generate route"     sub="auto"      status="ok"   selected />
            <GenericNode x={720} y={200} w={170} icon="alert"     kicker="qc"         title="Notify supervisor"  sub="hold"      status="bad" />
            <CanvasToolbar />
            <ZoomControls />
          </CanvasGrid>
        </div>
        {/* Inspector */}
        <div className="hairline-l bg-[var(--paper)] flex flex-col">
          <div className="px-3 h-10 flex items-center justify-between hairline-b">
            <div className="flex items-center gap-2">
              <Icon name="cog" size={13} className="text-[var(--accent)]" />
              <span className="font-semibold text-[12.5px]">Generate route</span>
            </div>
          </div>
          <div className="p-3 space-y-3 overflow-auto flex-1 text-[12px]">
            <div><div className="uppercase-label mb-1">Phase</div><div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2 h-7 flex items-center"><span className="dot mr-1.5" style={{ background: 'var(--c-production)' }} /> Production</div></div>
            <div><div className="uppercase-label mb-1">Run on</div><div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2 h-7 flex items-center mono text-[11.5px]">server-side</div></div>
            <div><div className="uppercase-label mb-1">Inputs</div><div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2 py-1.5 mono text-[10.5px] leading-relaxed">item_code, qty, work_center</div></div>
            <div><div className="uppercase-label mb-1">Outputs</div><div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2 py-1.5 mono text-[10.5px] leading-relaxed">route_id, est_time</div></div>
            <div><div className="uppercase-label mb-1">Timeout</div><div className="flex gap-1.5"><input className="hairline rounded-[var(--r-1)] bg-[var(--paper)] px-2 h-7 w-20 text-[12px] tabular mono" defaultValue="30" /><span className="text-[var(--ink-3)] self-center">s</span></div></div>
          </div>
          <div className="hairline-t px-3 h-10 flex items-center justify-between bg-[var(--paper-2)]">
            <Btn variant="ghost" size="sm" icon="trash">Delete</Btn>
            <Btn variant="default" size="sm">Test run</Btn>
          </div>
        </div>
      </div>
    </VStage>
  </VSection>
);

// ============================================================
// 10. RECIPE — PLANT MAP
// ============================================================
const PlantNode = ({ x, y, code, name, status = 'ok', kpi }) => (
  <div className="hairline" style={{
    position: 'absolute', left: x, top: y, width: 130,
    background: 'var(--paper)', borderRadius: 'var(--r-2)', padding: 8,
    borderColor: status === 'bad' ? 'var(--bad)' : status === 'warn' ? 'var(--warn)' : 'var(--line)',
    borderWidth: status === 'bad' ? 1.5 : 1,
  }}>
    <div className="flex items-center justify-between">
      <span className="mono text-[10px] text-[var(--ink-3)]">{code}</span>
      <span className="dot" style={{ background: `var(--${status})`, width: 7, height: 7 }} />
    </div>
    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, marginTop: 2 }}>{name}</div>
    {kpi && <div className="mono tabular text-[11px] mt-1.5" style={{ color: status === 'bad' ? 'var(--bad-ink)' : 'var(--ink-2)' }}>{kpi}</div>}
  </div>
);

const PlantMapRecipe = () => (
  <VSection id="recipe-plant" label="Recipes" title="Plant Map" sub="Floor-plan canvas: SVG/PNG of the actual plant layout as background, work-center nodes pinned at real coordinates with live status. Layer toggles (zones / pipes / electrical) on the right. Click a node → drawer with WO + telemetry.">
    <VStage padded={false}>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'relative', height: 380, overflow: 'hidden',
          background: 'var(--paper-2)',
          backgroundImage: `
            linear-gradient(var(--ink-3) 1px, transparent 1px),
            linear-gradient(90deg, var(--ink-3) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          backgroundPosition: '0 0',
        }}>
          {/* zone overlays */}
          <div style={{ position: 'absolute', left: 20, top: 20, width: 380, height: 160, background: 'color-mix(in oklch, var(--c-production) 8%, transparent)', border: '1px dashed color-mix(in oklch, var(--c-production) 50%, var(--line))', borderRadius: 6 }}>
            <span className="uppercase-label" style={{ position: 'absolute', top: 6, left: 8, color: 'var(--c-production)' }}>Area Produzione</span>
          </div>
          <div style={{ position: 'absolute', left: 420, top: 20, width: 240, height: 160, background: 'color-mix(in oklch, var(--c-qc) 8%, transparent)', border: '1px dashed color-mix(in oklch, var(--c-qc) 50%, var(--line))', borderRadius: 6 }}>
            <span className="uppercase-label" style={{ position: 'absolute', top: 6, left: 8, color: 'var(--c-qc)' }}>Test & Collaudo</span>
          </div>
          <div style={{ position: 'absolute', left: 20, top: 200, width: 640, height: 130, background: 'color-mix(in oklch, var(--c-inbound) 8%, transparent)', border: '1px dashed color-mix(in oklch, var(--c-inbound) 50%, var(--line))', borderRadius: 6 }}>
            <span className="uppercase-label" style={{ position: 'absolute', top: 6, left: 8, color: 'var(--c-inbound)' }}>Magazzino</span>
          </div>

          {/* nodes */}
          <PlantNode x={50}  y={70}  code="WC-A2" name="Assembly L2" status="ok"   kpi="168/240 · 70%" />
          <PlantNode x={210} y={70}  code="WC-B1" name="CNC Cell 1" status="warn" kpi="312/400 · 78%" />
          <PlantNode x={50}  y={250} code="WH-MP" name="Mat. Prime" status="ok"   kpi="58% fill" />
          <PlantNode x={210} y={250} code="WH-PF" name="Prod. Finiti" status="ok"   kpi="41% fill" />
          <PlantNode x={370} y={70}  code="WC-C1" name="Assembly L1" status="bad"  kpi="24/80 · 30%" />
          <PlantNode x={460} y={70}  code="WC-D1" name="QC Lab" status="ok" kpi="idle" />
          <PlantNode x={460} y={250} code="WH-QR" name="Quarantena" status="ok"   kpi="3 lots" />

          <CanvasToolbar />
          <ZoomControls />
          <Minimap />
        </div>
      </div>
    </VStage>
    <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Background</div>
        <div className="text-[var(--ink-2)]">Solid grid (64px), or import an SVG/PNG plant drawing as a viewport-locked layer.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Zone overlay</div>
        <div className="text-[var(--ink-2)]">Dashed rect with phase color soft fill — toggleable from a layer panel.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Live updates</div>
        <div className="text-[var(--ink-2)]">Node KPI/status update via WS — pulse animation on status flip.</div>
      </div>
    </div>
  </VSection>
);

// ============================================================
// 11. RECIPE — PROCESS ROUTING
// ============================================================
const RoutingRecipe = () => (
  <VSection id="recipe-routing" label="Recipes" title="Process Routing" sub="Sequential flow of work centers a part travels through. Simpler than workflow: nodes in a single chain (with optional branches), edges carry cycle-time + qty. Auto-layout left-to-right.">
    <VStage padded={false}>
      <div style={{ position: 'relative' }}>
        <CanvasGrid h={300}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <ArrowDefs />
            <Edge from={{ x: 160, y: 130 }} to={{ x: 240, y: 130 }} label="240 pc" />
            <Edge from={{ x: 400, y: 130 }} to={{ x: 480, y: 130 }} label="240 pc" />
            <Edge from={{ x: 640, y: 130 }} to={{ x: 720, y: 130 }} label="232 pc" />
            <Edge from={{ x: 640, y: 130 }} to={{ x: 720, y: 230 }} kind="orthogonal" tone="bad" label="8 NCR" />
          </svg>
          <GenericNode x={10}  y={100} w={150} icon="cube"   kicker="WC-B1"  title="Machining"   sub="cycle 84s" status="ok" ports={['out']} />
          <GenericNode x={240} y={100} w={160} icon="cog"    kicker="WC-A2"  title="Assembly"    sub="cycle 142s" status="ok" />
          <GenericNode x={480} y={100} w={160} icon="flask"  kicker="WC-D1"  title="Leak test"   sub="cycle 38s" status="warn" selected />
          <GenericNode x={720} y={100} w={150} icon="package" kicker="WC-PK" title="Packaging"   sub="cycle 22s" status="ok" />
          <GenericNode x={720} y={210} w={150} icon="alert"  kicker="QR-01" title="Quarantena"  sub="rework"   status="bad" ports={['in']} />
          <CanvasToolbar />
          <ZoomControls />
        </CanvasGrid>
      </div>
    </VStage>
    <div className="mt-3">
      <div className="uppercase-label mb-2">JSX</div>
      <VCode>{`// Routing nodes are GenericNodes with kicker = WC code
<GenericNode kicker="WC-B1" title="Machining" sub="cycle 84s" status="ok" />

// Edges carry quantities/time as labels:
<Edge from={a} to={b} label="240 pc" />
<Edge from={b} to={ncr} kind="orthogonal" tone="bad" label="8 NCR" />`}</VCode>
    </div>
  </VSection>
);

// ============================================================
// EXPORT
// ============================================================
window.ViewsAndCanvasSections = function ViewsAndCanvasSections() {
  return (
    <>
      <ViewSwitcherSection />
      <TreeNodeSection />
      <EmptyStateSection />
      <SplitViewSection />
      <CardGridSection />
      <CanvasFoundationSection />
      <InspectorSection />
      <WorkflowRecipe />
      <PlantMapRecipe />
      <RoutingRecipe />
    </>
  );
};

window.VIEWS_SECTION_ITEMS = [
  { id: 'view-switcher', label: 'View Switcher' },
  { id: 'tree-node', label: 'Tree Node' },
  { id: 'empty-state', label: 'Empty State' },
  { id: 'split-view', label: 'Split View Browser' },
  { id: 'card-grid', label: 'Card Grid' },
];

window.CANVAS_SECTION_ITEMS = [
  { id: 'canvas-foundation', label: 'Canvas Foundation' },
  { id: 'canvas-inspector', label: 'Properties Inspector' },
  { id: 'recipe-workflow', label: 'Workflow Designer' },
  { id: 'recipe-plant', label: 'Plant Map' },
  { id: 'recipe-routing', label: 'Process Routing' },
];
