/* global React, cx, Icon, Btn, Badge, StatusBadge, PriorityBadge */
const { useState: useStateD, useMemo: useMemoD } = React;

/*
  DETAIL PAGE PATTERN — Pacchetto 2
  Anatomy of a record-detail screen used across WO, Item, Box, NCR, Equipment, Recipe.
  · Sticky header: breadcrumb · code · status · primary actions
  · Identity strip: 4-6 KPIs/facts at a glance
  · Tab bar with route-bound tabs and counts
  · 2-column body: main + sticky meta-panel
  · Audit trail entry (events list)
  · Empty-tab + permission-gated tab patterns
*/

const DSection = ({ id, label, title, sub, children }) => (
  <section id={id} className="py-10 hairline-b">
    <div className="max-w-[1200px] mx-auto px-8">
      <div className="uppercase-label mb-1.5">{label}</div>
      <h2 className="text-[18px] font-semibold tracking-tight scroll-mt-16">{title}</h2>
      {sub && <p className="text-[13px] text-[var(--ink-3)] mt-1.5 max-w-[680px]">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </section>
);

const DStage = ({ children }) => (
  <div className="hairline rounded-[var(--r-2)] overflow-hidden bg-[var(--paper)]">
    <div className="uppercase-label px-3 py-1.5 hairline-b bg-[var(--paper-2)] flex items-center gap-2">
      <span className="dot" style={{ background: 'var(--accent)' }} />
      <span>Live preview</span>
    </div>
    {children}
  </div>
);

// ============================================================
// HEADER + IDENTITY STRIP
// ============================================================
const DetailHeaderSection = () => (
  <DSection
    id="detail-header"
    label="Detail · 2.1"
    title="Sticky Header & Identity Strip"
    sub="Top of every detail page: breadcrumb back-link, record code, status, primary action set. Identity strip below shows the 4–6 numbers most commonly asked about this record. Both stick when scrolling."
  >
    <DStage>
      {/* Sticky header (preview) */}
      <div className="bg-[var(--paper)] hairline-b">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-3)] mb-1">
            <Icon name="chevronL" size={11} />
            <button className="hover:text-[var(--ink)]">Production</button>
            <span>/</span>
            <button className="hover:text-[var(--ink)]">Work Orders</button>
            <span>/</span>
            <span className="text-[var(--ink)]">WO-2026-0142</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[20px] font-semibold tracking-tight mono">WO-2026-0142</h1>
                <StatusBadge status="in_progress" />
                <PriorityBadge p="high" />
                <span className="hairline rounded-[var(--r-pill)] px-2 h-6 inline-flex items-center gap-1.5 text-[11.5px] text-[var(--ink-3)] bg-[var(--paper-2)]">
                  <Icon name="lock" size={10} /> Locked by M. Conti
                </span>
              </div>
              <div className="mt-1 text-[13px] text-[var(--ink-2)] flex items-center gap-3">
                <span>Brake Caliper Assembly · 240 pcs</span>
                <span className="text-[var(--line-2)]">·</span>
                <span>WC-A2 · Line 2</span>
                <span className="text-[var(--line-2)]">·</span>
                <span>Due 14:30 today</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Btn variant="default" size="sm" icon="pause">Pause</Btn>
              <Btn variant="default" size="sm" icon="user">Reassign</Btn>
              <Btn variant="default" size="sm" icon="download">Export</Btn>
              <Btn variant="primary" size="sm" icon="check">Complete WO</Btn>
              <button className="w-8 h-7 hairline rounded-[var(--r-1)] flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)]"><Icon name="dots" size={13} /></button>
            </div>
          </div>
        </div>
        {/* Identity strip */}
        <div className="grid grid-cols-6 hairline-t bg-[var(--paper-2)]">
          {[
            { l: 'Progress', v: '168 / 240', sub: '70%', accent: true },
            { l: 'Yield', v: '99.4%', sub: '1 NCR' },
            { l: 'Cycle time', v: '54s', sub: 'target 60s' },
            { l: 'Started', v: '06:42', sub: '7h 49m ago' },
            { l: 'ETA', v: '14:18', sub: '12 min early', tone: 'ok' },
            { l: 'Cost so far', v: '€ 2,940', sub: '70% of est.' },
          ].map((k, i) => (
            <div key={i} className={cx('px-3 py-2 hairline-r last:border-r-0', k.accent && 'bg-[var(--accent-soft)]/40')}>
              <div className="uppercase-label">{k.l}</div>
              <div className={cx('mono text-[16px] font-semibold tabular leading-tight mt-0.5', k.tone === 'ok' && 'text-[var(--ok-ink)]')}>{k.v}</div>
              <div className="mono text-[10.5px] text-[var(--ink-3)] tabular">{k.sub}</div>
            </div>
          ))}
        </div>
        {/* Tab bar */}
        <div className="hairline-t flex items-center px-3 bg-[var(--paper)]">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'progress', label: 'Progress', count: 240 },
            { id: 'bom', label: 'BOM', count: 12 },
            { id: 'ncr', label: 'NCRs', count: 1, dot: 'warn' },
            { id: 'qc', label: 'QC checks', count: 8 },
            { id: 'docs', label: 'Documents', count: 3 },
            { id: 'audit', label: 'Audit', count: 47 },
          ].map((t, i) => (
            <button key={t.id} className={cx(
              'h-9 px-3 text-[12.5px] flex items-center gap-1.5 -mb-px border-b-2 transition-colors',
              i === 0 ? 'border-[var(--accent)] text-[var(--ink)] font-semibold' : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'
            )}>
              {t.dot && <span className="dot" style={{ background: `var(--${t.dot})`, width: 6, height: 6 }} />}
              {t.label}
              {t.count != null && <span className="mono text-[10.5px] text-[var(--ink-3)] tabular">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Body shadow / spacer */}
      <div className="h-12 bg-[var(--paper-2)] flex items-center justify-center text-[10.5px] text-[var(--ink-3)] mono">scroll content below header ↓</div>
    </DStage>

    <div className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
      {[
        { l: 'Breadcrumb', d: 'Always visible. Two levels deep max + record code as terminal item. Acts as the back-link.' },
        { l: 'Status row', d: 'Code in mono, then status, priority, lock badge if applicable. Short factual subline beneath: item · qty · WC · due.' },
        { l: 'Action set', d: 'Max 4 visible. Order: state-changing (Pause/Resume) · admin (Reassign) · neutral (Export) · destructive in kebab. Primary at the right.' },
        { l: 'Identity strip', d: '6 cells max. Each: label · big number · sub. The cell most relevant to current state gets accent-soft background.' },
        { l: 'Tabs', d: 'Counts in mono next to label. Dots only for tabs with non-zero alerts (NCR with open issues).' },
        { l: 'Sticky', d: 'The whole block (breadcrumb + identity + tabs) sticks to the top on scroll. Don\'t collapse — operators rely on the numbers staying visible.' },
      ].map(it => (
        <div key={it.l} className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
          <div className="uppercase-label mb-1">{it.l}</div>
          <div className="text-[var(--ink-2)]">{it.d}</div>
        </div>
      ))}
    </div>
  </DSection>
);

// ============================================================
// 2-COLUMN BODY
// ============================================================
const DetailBodySection = () => (
  <DSection
    id="detail-body"
    label="Detail · 2.2"
    title="Two-column body: main + meta panel"
    sub="Below the header: 70/30 split. Main column holds the active tab content (here: Overview cards). Meta panel is sticky, narrow, and never tabbed — it shows references, links, and the audit trail summary."
  >
    <DStage>
      <div className="grid bg-[var(--paper-2)]" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* MAIN — Overview cards */}
        <div className="p-5 space-y-4 bg-[var(--paper)]">
          {/* Progress card */}
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-[14px] font-semibold">Production progress</h3>
              <span className="mono text-[11px] text-[var(--ink-3)] tabular">updated 14:31</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { l: 'Good', v: 167, tone: 'ok' },
                { l: 'NCR', v: 1, tone: 'warn' },
                { l: 'Remaining', v: 72, tone: null },
              ].map(c => (
                <div key={c.l} className="hairline rounded-[var(--r-1)] p-2.5 bg-[var(--paper-2)]">
                  <div className="uppercase-label">{c.l}</div>
                  <div className={cx('mono text-[20px] font-semibold tabular', c.tone === 'ok' && 'text-[var(--ok-ink)]', c.tone === 'warn' && 'text-[var(--warn-ink)]')}>{c.v}</div>
                </div>
              ))}
            </div>
            {/* segmented progress */}
            <div className="flex items-center gap-1.5 mb-2 text-[11px] mono tabular">
              <span className="text-[var(--ink-3)]">0</span>
              <div className="flex-1 h-2 bg-[var(--paper-3)] rounded-full overflow-hidden flex">
                <div style={{ width: '69.6%', background: 'var(--ok)' }} />
                <div style={{ width: '0.4%', background: 'var(--warn)' }} />
              </div>
              <span className="text-[var(--ink-3)]">240</span>
            </div>
            <div className="flex gap-3 text-[11px] text-[var(--ink-3)]">
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ background: 'var(--ok)' }} />Good</span>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ background: 'var(--warn)' }} />NCR</span>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ background: 'var(--paper-3)' }} />Remaining</span>
            </div>
          </div>

          {/* Workflow snapshot */}
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-[14px] font-semibold">Current step</h3>
              <button className="text-[11.5px] text-[var(--accent-ink)] hover:underline">Open workflow →</button>
            </div>
            <div className="hairline rounded-[var(--r-1)] p-3 bg-[var(--accent-soft)]/40 flex items-center gap-3">
              <div className="hairline w-9 h-9 rounded-[var(--r-1)] bg-[var(--paper)] flex items-center justify-center mono text-[12px] font-semibold">3/8</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">Leak test</div>
                <div className="text-[11.5px] text-[var(--ink-3)] mono">SKL-LEAK · Station T-3 · 47s avg cycle</div>
              </div>
              <div className="text-right">
                <div className="mono text-[15px] tabular font-semibold">00:43</div>
                <div className="uppercase-label">elapsed</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-8 gap-1">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="text-center">
                  <div className={cx(
                    'h-1.5 rounded-full mb-1',
                    i < 3 ? 'bg-[var(--ok)]' : i === 3 ? 'bg-[var(--accent)]' : 'bg-[var(--paper-3)]'
                  )} />
                  <div className="mono text-[10px] text-[var(--ink-3)]">{i}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BOM consumption */}
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-[14px] font-semibold">BOM consumption</h3>
              <button className="text-[11.5px] text-[var(--accent-ink)] hover:underline">View 12 lines →</button>
            </div>
            <table className="w-full text-[12px] tabular">
              <thead>
                <tr className="hairline-b">
                  <th className="text-left uppercase-label py-1.5 font-normal">Material</th>
                  <th className="text-right uppercase-label py-1.5 font-normal">Required</th>
                  <th className="text-right uppercase-label py-1.5 font-normal">Consumed</th>
                  <th className="text-right uppercase-label py-1.5 font-normal">Variance</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { m: 'Caliper Body, Machined', r: 240, c: 168, v: 0 },
                  { m: 'Brake Pad Set', r: 240, c: 168, v: 0 },
                  { m: 'Bleeder Valve', r: 240, c: 169, v: +1, tone: 'warn' },
                  { m: 'O-Ring 22mm', r: 480, c: 336, v: 0 },
                ].map(r => (
                  <tr key={r.m} className="hairline-b">
                    <td className="py-1.5">{r.m}</td>
                    <td className="text-right mono">{r.r}</td>
                    <td className="text-right mono">{r.c}</td>
                    <td className={cx('text-right mono', r.tone === 'warn' && 'text-[var(--warn-ink)] font-semibold')}>{r.v > 0 ? `+${r.v}` : r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* META PANEL */}
        <div className="bg-[var(--paper-2)] hairline-l p-4 space-y-4">
          <div>
            <div className="uppercase-label mb-2">References</div>
            <div className="space-y-1.5 text-[12px]">
              {[
                { l: 'Sales Order', v: 'SO-2026-0089', i: 'file' },
                { l: 'Recipe', v: 'RCP-CALIPER-v3', i: 'workflow' },
                { l: 'Box', v: 'BOX-A4-0142', i: 'box' },
                { l: 'Quality plan', v: 'QP-CALIPER-2026', i: 'shield' },
              ].map(r => (
                <button key={r.l} className="w-full flex items-center gap-2 hairline rounded-[var(--r-1)] px-2 py-1.5 bg-[var(--paper)] hover:bg-[var(--accent-soft)]/30 text-left">
                  <Icon name={r.i} size={12} className="text-[var(--ink-3)]" />
                  <div className="flex-1 min-w-0">
                    <div className="uppercase-label">{r.l}</div>
                    <div className="mono text-[11.5px]">{r.v}</div>
                  </div>
                  <Icon name="chevronR" size={11} className="text-[var(--ink-3)]" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="uppercase-label mb-2">Assigned</div>
            <div className="space-y-1.5">
              {[
                { n: 'M. Conti', r: 'Operator', s: 'on shift' },
                { n: 'L. Bianchi', r: 'Supervisor', s: 'on call' },
                { n: 'A. Russo', r: 'QC', s: 'available' },
              ].map(p => (
                <div key={p.n} className="flex items-center gap-2 text-[12px]">
                  <div className="w-7 h-7 rounded-full hairline bg-[var(--paper)] flex items-center justify-center mono text-[10px] font-semibold">{p.n.split(' ').map(x=>x[0]).join('')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{p.n}</div>
                    <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider">{p.r} · {p.s}</div>
                  </div>
                  <span className="dot" style={{ background: 'var(--ok)' }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="uppercase-label">Recent activity</div>
              <button className="text-[10.5px] text-[var(--accent-ink)] hover:underline">all 47</button>
            </div>
            <div className="space-y-2 text-[11.5px]">
              {[
                { t: '14:28', l: 'pcs#168 completed', who: 'M. Conti', tone: 'ok' },
                { t: '14:24', l: 'NCR opened on pcs#167', who: 'M. Conti', tone: 'warn' },
                { t: '14:21', l: 'pcs#166 completed', who: 'M. Conti', tone: 'ok' },
                { t: '13:08', l: 'shift handover', who: 'system', tone: null },
              ].map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mono text-[10.5px] text-[var(--ink-3)] tabular w-9 shrink-0 pt-0.5">{e.t}</span>
                  <span className={cx('dot mt-1.5 shrink-0', e.tone && `bg-[var(--${e.tone})]`)} style={!e.tone ? { background: 'var(--ink-3)' } : null} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--ink-2)]">{e.l}</div>
                    <div className="text-[10.5px] text-[var(--ink-3)]">{e.who}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hairline rounded-[var(--r-1)] p-2.5 bg-[var(--paper)]">
            <div className="uppercase-label mb-1">Created · Updated</div>
            <div className="text-[11.5px] mono tabular text-[var(--ink-2)] leading-relaxed">
              <div>13/02/2026 06:42 · L. Verdi</div>
              <div className="text-[var(--ink-3)]">↳ updated 14:28 · M. Conti</div>
            </div>
          </div>
        </div>
      </div>
    </DStage>

    <div className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">70/30 split</div>
        <div className="text-[var(--ink-2)]">Main column flexible, meta panel fixed at <span className="mono">320px</span>. On &lt; 1100px the meta panel stacks below.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Card hierarchy</div>
        <div className="text-[var(--ink-2)]">Main column = stack of independent cards. Each card is self-contained with its own header + "view all" link.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Meta is reference-only</div>
        <div className="text-[var(--ink-2)]">No edits in meta panel — only links to other records, the people involved, and a tail of recent events. Click anything to drill in.</div>
      </div>
    </div>
  </DSection>
);

// ============================================================
// AUDIT TRAIL (full)
// ============================================================
const AuditTrailSection = () => (
  <DSection
    id="audit-trail"
    label="Detail · 2.3"
    title="Audit trail"
    sub="The 'Audit' tab. Every state change, override, comment, and system event lives here. Filterable by event type, by actor, by timeframe. Each row is a triple — when · who · what — with optional payload diff."
  >
    <DStage>
      {/* Filter strip */}
      <div className="hairline-b bg-[var(--paper-2)] px-3 py-2 flex items-center gap-2 flex-wrap text-[12px]">
        <span className="uppercase-label">Filter</span>
        {['State', 'Override', 'Comment', 'BOM', 'NCR', 'Auth'].map((t, i) => (
          <button key={t} className={cx(
            'hairline rounded-[var(--r-pill)] h-6 px-2 inline-flex items-center gap-1 text-[11.5px]',
            i === 0 || i === 4 ? 'bg-[var(--accent)] text-[var(--paper)] border-[var(--accent)]' : 'bg-[var(--paper)] text-[var(--ink-3)]'
          )}>
            {t}
          </button>
        ))}
        <span className="hairline-r h-5 mx-1" />
        <button className="hairline rounded-[var(--r-pill)] h-6 px-2 inline-flex items-center gap-1 text-[11.5px] bg-[var(--paper)] text-[var(--ink-3)]">
          <Icon name="user" size={10} /> All actors
          <Icon name="chevronD" size={10} />
        </button>
        <button className="hairline rounded-[var(--r-pill)] h-6 px-2 inline-flex items-center gap-1 text-[11.5px] bg-[var(--paper)] text-[var(--ink-3)]">
          <Icon name="clock" size={10} /> Last 24h
          <Icon name="chevronD" size={10} />
        </button>
        <div className="flex-1" />
        <span className="mono text-[11px] text-[var(--ink-3)] tabular">12 of 47 events</span>
        <Btn variant="default" size="sm" icon="download">CSV</Btn>
      </div>

      {/* Audit list */}
      <div className="bg-[var(--paper)]">
        {[
          {
            t: '14:28:47', actor: 'M. Conti', kind: 'state',
            label: 'Piece #168 marked good',
            detail: 'Step 8 (Final inspection) → completed',
            extra: null,
          },
          {
            t: '14:24:12', actor: 'M. Conti', kind: 'ncr',
            label: 'NCR opened',
            detail: 'NCR-2026-0019 · O-ring seating defect on pcs#167',
            extra: <Btn variant="default" size="sm">Open NCR-2026-0019</Btn>,
          },
          {
            t: '14:21:08', actor: 'M. Conti', kind: 'state',
            label: 'Piece #166 marked good',
            detail: 'Step 8 (Final inspection) → completed',
            extra: null,
          },
          {
            t: '13:42:51', actor: 'L. Bianchi', kind: 'override',
            label: 'Skill check override',
            detail: 'Operator missing SKL-LEAK · supervisor approval recorded',
            payload: 'reason: "operator certified, training record pending sync"',
            extra: null,
          },
          {
            t: '13:08:00', actor: 'system', kind: 'state',
            label: 'Shift handover',
            detail: 'Shift A → Shift B · WO state preserved',
            extra: null,
          },
          {
            t: '12:14:33', actor: 'A. Russo', kind: 'comment',
            label: 'Comment added',
            detail: '"Torque calibration tomorrow morning before pcs#180."',
            extra: null,
          },
          {
            t: '11:02:09', actor: 'L. Verdi', kind: 'bom',
            label: 'BOM revision applied',
            detail: 'Bleeder Valve qty 1 → 1.005 (overage allowance)',
            payload: '- bleeder_valve: 1.000\n+ bleeder_valve: 1.005',
            extra: null,
          },
          {
            t: '06:42:18', actor: 'L. Verdi', kind: 'state',
            label: 'WO released',
            detail: 'Released to WC-A2 · Line 2 from SO-2026-0089',
            extra: null,
          },
        ].map((e, i) => {
          const tone = e.kind === 'override' ? 'warn' : e.kind === 'ncr' ? 'bad' : e.kind === 'comment' ? 'accent' : 'ok';
          return (
            <div key={i} className={cx('hairline-b px-3 py-2.5 grid items-start gap-3 hover:bg-[var(--paper-2)]')}
                 style={{ gridTemplateColumns: '92px 28px 1fr 110px' }}>
              {/* time */}
              <div className="mono text-[11.5px] tabular text-[var(--ink-3)] pt-0.5">{e.t}</div>
              {/* tone dot column */}
              <div className="flex justify-center pt-1">
                <span className="hairline w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `var(--${tone}-soft)`, borderColor: `var(--${tone}-ink, var(--line-2))` }}>
                  <Icon name={e.kind === 'state' ? 'check' : e.kind === 'override' ? 'shield' : e.kind === 'ncr' ? 'alert' : e.kind === 'comment' ? 'info' : 'edit'} size={11} className={`text-[var(--${tone}-ink)]`} />
                </span>
              </div>
              {/* body */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12.5px] font-semibold">{e.label}</span>
                  <span className="hairline rounded-[var(--r-pill)] h-4 px-1.5 inline-flex items-center text-[9.5px] uppercase tracking-wider mono text-[var(--ink-3)] bg-[var(--paper-2)]">{e.kind}</span>
                </div>
                <div className="text-[12px] text-[var(--ink-2)] mt-0.5">{e.detail}</div>
                {e.payload && (
                  <pre className="mono text-[10.5px] mt-1.5 hairline rounded-[var(--r-1)] p-2 bg-[var(--paper-2)] text-[var(--ink-2)] whitespace-pre">{e.payload}</pre>
                )}
                {e.extra && <div className="mt-2">{e.extra}</div>}
              </div>
              {/* actor */}
              <div className="flex items-center gap-1.5 justify-end pt-0.5">
                {e.actor === 'system'
                  ? <span className="hairline rounded-[var(--r-pill)] h-5 px-1.5 inline-flex items-center gap-1 text-[10.5px] mono text-[var(--ink-3)] bg-[var(--paper-2)]"><Icon name="zap" size={9} />system</span>
                  : <>
                      <span className="text-[11.5px] text-[var(--ink-2)]">{e.actor}</span>
                      <span className="w-5 h-5 rounded-full hairline bg-[var(--paper-2)] flex items-center justify-center mono text-[9px] font-semibold">{e.actor.split(' ').map(x=>x[0]).join('')}</span>
                    </>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="hairline-t px-3 py-2 bg-[var(--paper-2)] flex items-center text-[11px] text-[var(--ink-3)] mono">
        <span>Showing 8 of 47 · auto-refresh every 30s</span>
        <div className="flex-1" />
        <button className="text-[var(--accent-ink)] hover:underline">Load older →</button>
      </div>
    </DStage>

    <div className="mt-5 grid grid-cols-4 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Triple grid</div>
        <div className="text-[var(--ink-2)]">Every row is <span className="mono">when · who · what</span>. Time on the left, actor on the right, the event in the middle.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Event types</div>
        <div className="text-[var(--ink-2)]">state (✓ ok), override (⚠ warn), ncr (! bad), comment (i accent), bom/auth (edit ok). Filter chips at the top.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Payload diff</div>
        <div className="text-[var(--ink-2)]">When the event mutated data, show a unified diff in monospace below. Optional — never show empty diffs.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">System actor</div>
        <div className="text-[var(--ink-2)]">A "system" actor (shift change, scheduled job, sync) gets a flat pill — no avatar, mono label, ⚡ icon.</div>
      </div>
    </div>
  </DSection>
);

// ============================================================
// EMPTY TAB & LOCKED TAB
// ============================================================
const TabStatesSection = () => (
  <DSection
    id="detail-tab-states"
    label="Detail · 2.4"
    title="Empty tab · Permission-gated tab"
    sub="What a tab looks like when there's no data, vs. when the user lacks permission to see it. Both keep the chrome (header + tabs) so the user can still navigate."
  >
    <div className="grid grid-cols-2 gap-4">
      {/* EMPTY */}
      <DStage>
        <div className="hairline-b px-4 py-2 flex items-center gap-2">
          <span className="uppercase-label">Tab · Documents</span>
          <span className="mono text-[11px] text-[var(--ink-3)] tabular">0</span>
          <div className="flex-1" />
          <Btn variant="primary" size="sm" icon="plus">Upload</Btn>
        </div>
        <div className="p-12 text-center">
          <div className="hairline-2 inline-flex w-12 h-12 rounded-full items-center justify-center mb-3 bg-[var(--paper-2)]">
            <Icon name="file" size={20} className="text-[var(--ink-3)]" />
          </div>
          <div className="text-[14px] font-semibold mb-1">No documents attached</div>
          <div className="text-[12px] text-[var(--ink-3)] max-w-[280px] mx-auto mb-4">Drawings, MSDS sheets, work instructions — drop them here or pick from the document library.</div>
          <div className="flex items-center gap-2 justify-center">
            <Btn variant="default" size="sm" icon="search">Browse library</Btn>
            <Btn variant="primary" size="sm" icon="plus">Upload file</Btn>
          </div>
          <div className="hairline-t pt-3 mt-5 text-[11px] text-[var(--ink-3)]">
            <span className="mono">Tip:</span> drag files anywhere on this tab to upload
          </div>
        </div>
      </DStage>

      {/* LOCKED */}
      <DStage>
        <div className="hairline-b px-4 py-2 flex items-center gap-2 opacity-60">
          <span className="uppercase-label">Tab · Cost breakdown</span>
          <Icon name="lock" size={11} className="text-[var(--ink-3)]" />
          <div className="flex-1" />
        </div>
        <div className="p-12 text-center">
          <div className="hairline-2 inline-flex w-12 h-12 rounded-full items-center justify-center mb-3 bg-[var(--paper-2)]">
            <Icon name="lock" size={20} className="text-[var(--ink-3)]" />
          </div>
          <div className="text-[14px] font-semibold mb-1">Permission required</div>
          <div className="text-[12px] text-[var(--ink-3)] max-w-[300px] mx-auto mb-4">
            Cost data needs role <span className="mono hairline rounded px-1 py-0.5 bg-[var(--paper-2)]">FINANCE_VIEW</span> or <span className="mono hairline rounded px-1 py-0.5 bg-[var(--paper-2)]">SUPERVISOR</span>. You're signed in as <span className="font-semibold">M. Conti · Operator</span>.
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Btn variant="default" size="sm" icon="user">Request access</Btn>
            <Btn variant="default" size="sm">Sign in as supervisor</Btn>
          </div>
          <div className="hairline-t pt-3 mt-5 text-[11px] text-[var(--ink-3)]">
            <span className="mono">Audit:</span> denial logged · 14:31:08
          </div>
        </div>
      </DStage>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Empty tab</div>
        <div className="text-[var(--ink-2)]">Icon (matches tab purpose) → headline → 1-line explainer → primary action. Optional secondary action. Tip footer in mono.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Locked tab</div>
        <div className="text-[var(--ink-2)]">Show the tab dimmed with a 🔒 — never hide it (users need to know features exist). Lock state explains the missing role and offers a request-access path.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Audit-on-deny</div>
        <div className="text-[var(--ink-2)]">Every denied tab access logs an entry. The empty state shows the timestamp so the user knows it was registered.</div>
      </div>
    </div>
  </DSection>
);

// ============================================================
// EXPORT
// ============================================================
window.DetailPageSections = function DetailPageSections() {
  return (
    <>
      <DetailHeaderSection />
      <DetailBodySection />
      <AuditTrailSection />
      <TabStatesSection />
    </>
  );
};

window.DETAIL_SECTION_ITEMS = [
  { id: 'detail-header', label: 'Sticky Header & Identity' },
  { id: 'detail-body', label: 'Two-column body' },
  { id: 'audit-trail', label: 'Audit trail' },
  { id: 'detail-tab-states', label: 'Empty · Locked tabs' },
];
