/* global React, cx, Icon, Btn, Badge, StatusBadge, PriorityBadge */
const { useState: useStateT, useMemo: useMemoT, useRef: useRefT, useEffect: useEffectT } = React;

/*
  OPERATIONAL TABLE — Pacchetto 1
  Adds the patterns to turn read-only DS tables into operational ones:
  · multi-select (header + per-row, indeterminate)
  · sortable columns (single + multi via shift)
  · filter bar (chips with logic, quick search, clear-all)
  · bulk actions strip (sticky on selection)
  · row actions menu (kebab → popover)
  · saved views (tabs of preset filters/sort/columns)
  · footer aggregates (sum / avg / count, sticky)
*/

// ============================================================
// Section helpers
// ============================================================
const TSection = ({ id, label, title, sub, children }) => (
  <section id={id} className="py-10 hairline-b">
    <div className="max-w-[1200px] mx-auto px-8">
      <div className="uppercase-label mb-1.5">{label}</div>
      <h2 className="text-[18px] font-semibold tracking-tight scroll-mt-16">{title}</h2>
      {sub && <p className="text-[13px] text-[var(--ink-3)] mt-1.5 max-w-[680px]">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </section>
);

const TStage = ({ children, padded = false }) => (
  <div className="hairline rounded-[var(--r-2)] overflow-hidden bg-[var(--paper)]">
    <div className="uppercase-label px-3 py-1.5 hairline-b bg-[var(--paper-2)] flex items-center gap-2">
      <span className="dot" style={{ background: 'var(--accent)' }} />
      <span>Live preview</span>
    </div>
    <div className={padded ? 'p-5' : ''}>{children}</div>
  </div>
);

const TCode = ({ children }) => (
  <pre className="mono text-[11px] bg-[var(--paper-2)] hairline rounded-[var(--r-1)] p-2.5 leading-relaxed overflow-x-auto whitespace-pre">{children}</pre>
);

// ============================================================
// CHECKBOX
// ============================================================
const Check = ({ state = 'off', onClick }) => (
  <button onClick={onClick} className="hairline flex items-center justify-center"
    style={{
      width: 14, height: 14, borderRadius: 3,
      background: state === 'off' ? 'var(--paper)' : 'var(--accent)',
      borderColor: state === 'off' ? 'var(--line-2)' : 'var(--accent)',
    }}>
    {state === 'on' && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round"><polyline points="2.5 6.5 5 9 9.5 3.5"/></svg>}
    {state === 'mixed' && <span style={{ width: 7, height: 1.5, background: 'var(--paper)', borderRadius: 1 }} />}
  </button>
);

// ============================================================
// SORT INDICATOR
// ============================================================
const SortIcon = ({ dir, idx }) => (
  <span className="inline-flex items-center gap-0.5 ml-1">
    <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
      <path d="M4.5 1L8 4.5H1z" fill={dir === 'asc' ? 'var(--accent)' : 'var(--ink-3)'} opacity={dir === 'asc' ? 1 : 0.35} />
      <path d="M4.5 10L1 6.5H8z" fill={dir === 'desc' ? 'var(--accent)' : 'var(--ink-3)'} opacity={dir === 'desc' ? 1 : 0.35} />
    </svg>
    {idx != null && <span className="mono text-[9px] text-[var(--accent-ink)]">{idx}</span>}
  </span>
);

// ============================================================
// FILTER CHIP
// ============================================================
const FilterChip = ({ field, op, value, onRemove }) => (
  <span className="hairline inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-[var(--r-pill)] bg-[var(--paper)] text-[11.5px]">
    <span className="text-[var(--ink-3)]">{field}</span>
    <span className="mono text-[10.5px] text-[var(--ink-3)]">{op}</span>
    <span className="font-semibold">{value}</span>
    <button onClick={onRemove} className="w-4 h-4 flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded">
      <Icon name="x" size={10} />
    </button>
  </span>
);

// ============================================================
// SAVED VIEWS TABS
// ============================================================
const SavedViews = ({ value, onChange }) => {
  const views = [
    { id: 'all', label: 'All orders', count: 142 },
    { id: 'today', label: 'Released today', count: 8 },
    { id: 'risk', label: 'At risk', count: 3, dot: 'warn' },
    { id: 'mine', label: 'My WC', count: 12 },
    { id: 'hold', label: 'On hold', count: 2, dot: 'bad' },
  ];
  return (
    <div className="hairline-b bg-[var(--paper)] flex items-center px-3">
      {views.map(v => (
        <button key={v.id} onClick={() => onChange(v.id)}
          className={cx(
            'h-9 px-3 text-[12.5px] flex items-center gap-1.5 -mb-px border-b-2 transition-colors',
            value === v.id ? 'border-[var(--accent)] text-[var(--ink)] font-semibold' : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'
          )}>
          {v.dot && <span className="dot" style={{ background: `var(--${v.dot})`, width: 6, height: 6 }} />}
          {v.label}
          <span className="mono text-[10.5px] text-[var(--ink-3)] tabular">{v.count}</span>
        </button>
      ))}
      <div className="flex-1" />
      <button className="h-9 px-2 text-[12px] text-[var(--ink-3)] hover:text-[var(--accent-ink)] flex items-center gap-1">
        <Icon name="plus" size={11} /> Save view…
      </button>
    </div>
  );
};

// ============================================================
// FILTER BAR
// ============================================================
const FilterBar = ({ filters, setFilters, q, setQ }) => (
  <div className="hairline-b bg-[var(--paper-2)] px-3 py-2 flex items-center gap-2 flex-wrap">
    <div className="hairline rounded-[var(--r-1)] bg-[var(--paper)] px-2 h-7 flex items-center gap-1.5 text-[12px] min-w-[200px]">
      <Icon name="search" size={12} className="text-[var(--ink-3)]" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca codice, item, WC…" className="flex-1 outline-none bg-transparent text-[12px] tabular" />
      {q && <button onClick={() => setQ('')} className="text-[var(--ink-3)] hover:text-[var(--ink)]"><Icon name="x" size={11} /></button>}
    </div>
    <span className="hairline-r h-5" />
    {filters.map((f, i) => (
      <FilterChip key={i} {...f} onRemove={() => setFilters(filters.filter((_, j) => j !== i))} />
    ))}
    <button className="hairline rounded-[var(--r-pill)] inline-flex items-center gap-1 h-7 px-2 text-[11.5px] text-[var(--ink-3)] hover:text-[var(--accent-ink)] bg-[var(--paper)] border-dashed">
      <Icon name="plus" size={11} /> Add filter
    </button>
    {filters.length > 0 && (
      <button onClick={() => setFilters([])} className="text-[11.5px] text-[var(--ink-3)] hover:text-[var(--bad-ink)] ml-1">Clear all</button>
    )}
    <div className="flex-1" />
    <span className="mono text-[11px] text-[var(--ink-3)] tabular">142 di 280 · 3 filtri</span>
  </div>
);

// ============================================================
// BULK ACTIONS STRIP
// ============================================================
const BulkBar = ({ count, onClear }) => (
  <div className="hairline-b bg-[var(--accent-soft)] px-3 py-2 flex items-center gap-2 text-[12.5px]">
    <Check state="mixed" />
    <span className="font-semibold text-[var(--accent-ink)]"><span className="mono tabular">{count}</span> selezionati</span>
    <span className="text-[var(--accent-ink)]/60">·</span>
    <button className="text-[12px] text-[var(--accent-ink)] hover:underline">Seleziona tutti i 142 risultati</button>
    <div className="flex-1" />
    <Btn variant="default" size="sm" icon="play">Release</Btn>
    <Btn variant="default" size="sm" icon="pause">Hold</Btn>
    <Btn variant="default" size="sm" icon="user">Assign…</Btn>
    <Btn variant="default" size="sm" icon="download">Export</Btn>
    <Btn variant="ghost" size="sm" icon="trash" tone="bad">Cancel</Btn>
    <span className="hairline-r h-5 mx-1" />
    <button onClick={onClear} className="text-[11.5px] text-[var(--accent-ink)] hover:underline">Clear selection</button>
  </div>
);

// ============================================================
// ROW MENU (kebab)
// ============================================================
const RowMenu = ({ open, onToggle }) => (
  <div className="relative">
    <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded">
      <Icon name="dots" size={13} />
    </button>
    {open && (
      <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] absolute right-0 top-7 z-20 py-1" style={{ width: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        {[
          { i: 'eye', l: 'Open detail', kbd: '↵' },
          { i: 'edit', l: 'Edit fields' },
          { i: 'copy', l: 'Duplicate' },
          { i: 'play', l: 'Release', divider: true },
          { i: 'pause', l: 'Place on hold' },
          { i: 'user', l: 'Reassign…' },
          { i: 'download', l: 'Export row', divider: true },
          { i: 'trash', l: 'Cancel WO', tone: 'bad' },
        ].map((it, i) => (
          <React.Fragment key={i}>
            {it.divider && <div className="hairline-b my-1" />}
            <button className={cx('w-full text-left px-2.5 h-7 flex items-center gap-2 text-[12px] hover:bg-[var(--paper-2)]', it.tone === 'bad' && 'text-[var(--bad-ink)]')}>
              <Icon name={it.i} size={12} className={it.tone === 'bad' ? 'text-[var(--bad-ink)]' : 'text-[var(--ink-3)]'} />
              <span className="flex-1">{it.l}</span>
              {it.kbd && <span className="mono text-[10px] text-[var(--ink-3)]">{it.kbd}</span>}
            </button>
          </React.Fragment>
        ))}
      </div>
    )}
  </div>
);

// ============================================================
// THE FULL TABLE
// ============================================================
const SAMPLE_ROWS = [
  { id: 'WO-2026-0142', item: 'Brake Caliper Assembly', qty: 168, total: 240, wc: 'WC-A2 · Line 2', op: 'M. Conti', priority: 'high', status: 'in_progress', due: '14:30 today', value: 4200 },
  { id: 'WO-2026-0143', item: 'Brake Caliper Assembly', qty: 0, total: 120, wc: 'WC-A2 · Line 2', op: '—', priority: 'normal', status: 'released', due: '16:00 today', value: 3000 },
  { id: 'WO-2026-0140', item: 'Caliper Body, Machined', qty: 500, total: 500, wc: 'WC-B1 · CNC Cell', op: 'L. Bianchi', priority: 'normal', status: 'completed', due: '09:00 today', value: 12500 },
  { id: 'WO-2026-0141', item: 'Caliper Body, Machined', qty: 312, total: 400, wc: 'WC-B1 · CNC Cell', op: 'L. Bianchi', priority: 'high', status: 'on_hold', due: '12:00 today', value: 10000 },
  { id: 'WO-2026-0144', item: 'Master Cylinder', qty: 24, total: 80, wc: 'WC-C1 · Line 1', op: 'A. Russo', priority: 'critical', status: 'in_progress', due: '11:30 today', value: 2800 },
  { id: 'WO-2026-0145', item: 'Bleeder Valve', qty: 0, total: 600, wc: 'WC-D1 · Lab', op: '—', priority: 'low', status: 'released', due: 'tomorrow', value: 1800 },
];

const OperationalTableSection = () => {
  const [view, setView] = useStateT('all');
  const [sel, setSel] = useStateT(new Set(['WO-2026-0142', 'WO-2026-0144']));
  const [sort, setSort] = useStateT([{ col: 'priority', dir: 'desc', idx: 1 }, { col: 'due', dir: 'asc', idx: 2 }]);
  const [filters, setFilters] = useStateT([
    { field: 'Status', op: 'is', value: 'In progress · Released' },
    { field: 'Priority', op: '≥', value: 'High' },
    { field: 'WC', op: 'in', value: 'WC-A2, WC-B1' },
  ]);
  const [q, setQ] = useStateT('');
  const [menuOpen, setMenuOpen] = useStateT(null);

  const allOn = sel.size === SAMPLE_ROWS.length;
  const headerState = allOn ? 'on' : sel.size > 0 ? 'mixed' : 'off';
  const toggleAll = () => setSel(allOn ? new Set() : new Set(SAMPLE_ROWS.map(r => r.id)));
  const toggleRow = (id) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSel(n);
  };
  const cycleSort = (col) => {
    const existing = sort.find(s => s.col === col);
    if (!existing) return setSort([...sort, { col, dir: 'asc', idx: sort.length + 1 }]);
    if (existing.dir === 'asc') return setSort(sort.map(s => s.col === col ? { ...s, dir: 'desc' } : s));
    return setSort(sort.filter(s => s.col !== col).map((s, i) => ({ ...s, idx: i + 1 })));
  };
  const sortFor = (col) => sort.find(s => s.col === col);

  // Column definitions
  const cols = [
    { id: 'id', label: 'WO Code', w: 130 },
    { id: 'item', label: 'Item', w: null },
    { id: 'qty', label: 'Qty', w: 110, num: true },
    { id: 'wc', label: 'Work center', w: 160 },
    { id: 'op', label: 'Operator', w: 110 },
    { id: 'priority', label: 'Priority', w: 90 },
    { id: 'status', label: 'Status', w: 110 },
    { id: 'due', label: 'Due', w: 100 },
    { id: 'value', label: 'Value €', w: 90, num: true },
  ];

  const totalValue = SAMPLE_ROWS.reduce((s, r) => s + r.value, 0);
  const avgValue = Math.round(totalValue / SAMPLE_ROWS.length);
  const totalQty = SAMPLE_ROWS.reduce((s, r) => s + r.qty, 0);

  return (
    <TSection
      id="op-table"
      label="Patterns · v0.7"
      title="Operational Table"
      sub="The full operational pattern: saved views, filter bar with chips and quick search, multi-select with bulk actions strip, sortable columns (single + multi via shift), per-row kebab menu and a sticky aggregate footer. Apply this pattern to any registry where the user takes action on records (Work Orders, Items, NCRs, Boxes, Boms)."
    >
      <TStage>
        {/* Saved views */}
        <SavedViews value={view} onChange={setView} />
        {/* Filter bar */}
        <FilterBar filters={filters} setFilters={setFilters} q={q} setQ={setQ} />
        {/* Bulk actions strip — sticky when selection > 0 */}
        {sel.size > 0 && <BulkBar count={sel.size} onClear={() => setSel(new Set())} />}
        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-[12.5px] tabular" style={{ borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: 36 }} />
              {cols.map(c => <col key={c.id} style={c.w ? { width: c.w } : null} />)}
              <col style={{ width: 36 }} />
            </colgroup>
            <thead>
              <tr className="bg-[var(--paper-2)] hairline-b">
                <th className="px-2 py-2"><Check state={headerState} onClick={toggleAll} /></th>
                {cols.map(c => {
                  const s = sortFor(c.id);
                  return (
                    <th key={c.id}
                      onClick={(e) => cycleSort(c.id)}
                      className={cx('px-3 py-2 uppercase-label cursor-pointer select-none hover:text-[var(--ink)]', c.num && 'text-right')}>
                      <span className={cx('inline-flex items-center', c.num && 'flex-row-reverse')}>
                        {c.label}
                        {s && <SortIcon dir={s.dir} idx={sort.length > 1 ? s.idx : null} />}
                      </span>
                    </th>
                  );
                })}
                <th />
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((r) => {
                const isSel = sel.has(r.id);
                return (
                  <tr key={r.id} className={cx('hairline-b group', isSel ? 'bg-[var(--accent-soft)]/40' : 'hover:bg-[var(--paper-2)]')}>
                    <td className="px-2 py-2"><Check state={isSel ? 'on' : 'off'} onClick={() => toggleRow(r.id)} /></td>
                    <td className="px-3 py-2 mono text-[12px]">{r.id}</td>
                    <td className="px-3 py-2">{r.item}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="mono">{r.qty}</span>
                      <span className="text-[var(--ink-3)] mono"> / {r.total}</span>
                      <div className="mt-1 h-[3px] bg-[var(--paper-3)] rounded-full overflow-hidden ml-auto" style={{ width: 80 }}>
                        <div style={{ width: `${(r.qty / r.total) * 100}%`, height: '100%', background: r.qty === r.total ? 'var(--ok)' : r.qty === 0 ? 'var(--paper-3)' : 'var(--accent)' }} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[var(--ink-3)]">{r.wc}</td>
                    <td className="px-3 py-2">{r.op}</td>
                    <td className="px-3 py-2"><PriorityBadge p={r.priority} /></td>
                    <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-2 text-[var(--ink-3)]">{r.due}</td>
                    <td className="px-3 py-2 text-right mono">{r.value.toLocaleString('it-IT')}</td>
                    <td className="px-1 py-1"><RowMenu open={menuOpen === r.id} onToggle={() => setMenuOpen(menuOpen === r.id ? null : r.id)} /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--paper-2)] hairline-t">
                <td />
                <td className="px-3 py-2 uppercase-label" colSpan={2}>{SAMPLE_ROWS.length} ordini</td>
                <td className="px-3 py-2 text-right">
                  <span className="uppercase-label mr-1">Σ</span>
                  <span className="mono font-semibold">{totalQty.toLocaleString('it-IT')}</span>
                </td>
                <td className="px-3 py-2" colSpan={4}>
                  <span className="uppercase-label">Avg value</span>
                  <span className="mono ml-2">€ {avgValue.toLocaleString('it-IT')}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="uppercase-label mr-1">Σ €</span>
                  <span className="mono font-semibold">{totalValue.toLocaleString('it-IT')}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Status bar */}
        <div className="hairline-t px-3 py-1.5 bg-[var(--paper)] flex items-center text-[11px] text-[var(--ink-3)] mono">
          <span>Page 1 of 24 · 6 of 142 shown</span>
          <div className="flex-1" />
          <span>Sorted by Priority↓ · Due↑</span>
          <span className="mx-2">·</span>
          <span>Last refresh 14:31:08</span>
        </div>
      </TStage>

      {/* Anatomy notes */}
      <div className="mt-5 grid grid-cols-4 gap-3 text-[12px]">
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Saved views</div>
          <div className="text-[var(--ink-2)]">Tabs at the top. Each persists filters + sort + columns + density. "+ Save view" snapshots the current state.</div>
        </div>
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Filter chips</div>
          <div className="text-[var(--ink-2)]">All filters as chips. <span className="mono">field op value</span>. × removes one, "Clear all" wipes. Always show count of filtered rows.</div>
        </div>
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Multi-select</div>
          <div className="text-[var(--ink-2)]">Header checkbox: off / mixed / on. Bulk strip appears on first selection — sticky on scroll. Shift-click for range.</div>
        </div>
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Sort</div>
          <div className="text-[var(--ink-2)]">Click cycles asc → desc → off. Shift-click adds a secondary sort, indexed 1, 2, 3 next to arrow.</div>
        </div>
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Row kebab</div>
          <div className="text-[var(--ink-2)]">⋯ on the right. Opens contextual actions: open · edit · duplicate · release · hold · assign · export · cancel.</div>
        </div>
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Footer aggregates</div>
          <div className="text-[var(--ink-2)]">Sticky tfoot with sum (Σ), avg, count. Numeric columns get summed; categorical get count of distinct values.</div>
        </div>
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Inline progress</div>
          <div className="text-[var(--ink-2)]">Quantity columns show qty / total + a 3px bar. Green when complete, accent when in progress, paper-3 when 0.</div>
        </div>
        <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">Status bar</div>
          <div className="text-[var(--ink-2)]">Bottom-strip with pagination, current sort summary, last refresh. Always 24px tall — never grow.</div>
        </div>
      </div>

      {/* JSX */}
      <div className="mt-5">
        <div className="uppercase-label mb-2">Composition</div>
        <TCode>{`<OpTable
  rows={rows}
  columns={[
    { id: 'id',       label: 'WO Code', w: 130 },
    { id: 'item',     label: 'Item' },
    { id: 'qty',      label: 'Qty', num: true, render: QtyCell },
    { id: 'priority', label: 'Priority',       render: r => <PriorityBadge p={r.priority} /> },
    { id: 'status',   label: 'Status',         render: r => <StatusBadge status={r.status} /> },
  ]}
  views={[
    { id: 'all',   label: 'All orders',     count: 142 },
    { id: 'risk',  label: 'At risk',  dot: 'warn', count: 3 },
  ]}
  rowActions={[
    { id: 'open',   label: 'Open detail', icon: 'eye', kbd: '↵' },
    { id: 'edit',   label: 'Edit fields', icon: 'edit' },
    '---',
    { id: 'cancel', label: 'Cancel WO',   icon: 'trash', tone: 'bad' },
  ]}
  bulkActions={['release','hold','assign','export','cancel']}
  aggregates={{ qty: 'sum', value: ['sum','avg'] }}
  defaultSort={[{ col: 'priority', dir: 'desc' }, { col: 'due', dir: 'asc' }]}
/>`}</TCode>
      </div>
    </TSection>
  );
};

// ============================================================
// EXPORT
// ============================================================
window.OperationalTableSections = function OperationalTableSections() {
  return <OperationalTableSection />;
};

window.OPTABLE_SECTION_ITEMS = [
  { id: 'op-table', label: 'Operational Table' },
];
