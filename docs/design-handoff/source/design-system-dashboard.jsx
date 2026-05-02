/* global React, cx, Icon, Btn, Badge */
const { useState: useStateD } = React;

/*
  Dashboard components — extension to the RAMS Design System.
  Adds: KPI Hero · Phase Chip (filled+done) · Execution Log Row ·
  Work Center Card · Alert Banner · Phase Mix Bar · Live Alert Item.
  Pure light/industrial-utilitarian — no glass, no shadow.
*/

// ----------------------------------------------------------------
// Section wrapper helpers (mirror the ones in design-system.jsx)
// ----------------------------------------------------------------
const DSection = ({ id, label, title, sub, children }) => (
  <section id={id} className="py-10 hairline-b">
    <div className="max-w-[1200px] mx-auto px-8">
      <div className="uppercase-label mb-1.5">{label}</div>
      <h2 id={id} className="text-[18px] font-semibold tracking-tight scroll-mt-16">{title}</h2>
      {sub && <p className="text-[13px] text-[var(--ink-3)] mt-1.5 max-w-[680px]">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </section>
);

const DStage = ({ children, padded = true, dark = false }) => (
  <div className="hairline rounded-[var(--r-2)] overflow-hidden bg-[var(--paper)]">
    <div className="uppercase-label px-3 py-1.5 hairline-b bg-[var(--paper-2)] flex items-center gap-2">
      <span className="dot" style={{ background: 'var(--accent)' }} />
      <span>Live preview</span>
    </div>
    <div className={cx(padded && 'p-5', dark && 'bg-[var(--ink)]')}>{children}</div>
  </div>
);

const DCode = ({ children }) => (
  <pre className="mono text-[11px] bg-[var(--paper-2)] hairline rounded-[var(--r-1)] p-2.5 leading-relaxed overflow-x-auto whitespace-pre">
    {children}
  </pre>
);

const TwoCol = ({ preview, code }) => (
  <div className="grid grid-cols-2 gap-4 items-start">
    <DStage>{preview}</DStage>
    <div>
      <div className="uppercase-label mb-2">JSX</div>
      <DCode>{code}</DCode>
    </div>
  </div>
);

// ============================================================
// 1. KPI HERO  (40–56px, distinct from KPI 26px)
// ============================================================
const KpiHero = ({ label, value, unit, sub, trend, accent, big, ok }) => (
  <div className="hairline rounded-[var(--r-3)] bg-[var(--paper)]" style={{ padding: 20, borderColor: accent ? 'var(--accent)' : 'var(--line)' }}>
    <div className="uppercase-label" style={{ marginBottom: 8 }}>{label}</div>
    <div className="mono tabular" style={{ fontSize: big ? 56 : 40, fontWeight: 600, lineHeight: 1, color: accent ? 'var(--accent)' : ok ? 'var(--ok-ink)' : 'var(--ink)' }}>
      {value}{unit && <span style={{ fontSize: big ? 24 : 18, color: 'var(--ink-3)' }}>{unit}</span>}
    </div>
    {(sub || trend) && (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5 }}>
        {sub && <span style={{ color: 'var(--ink-3)' }}>{sub}</span>}
        {trend && <span className="mono tabular" style={{ color: trend.startsWith('↑') ? 'var(--ok-ink)' : 'var(--bad-ink)' }}>{trend}</span>}
      </div>
    )}
  </div>
);

const KpiHeroSection = () => (
  <DSection id="kpi-hero" label="Dashboard" title="KPI Hero" sub="Oversized KPI card for Andon and executive dashboards. 40px tabular for back-office heroes, 56px for fullscreen Andon. Uses accent border + accent ink for the primary metric of the page.">
    <TwoCol
      preview={
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiHero big accent label="Plant OEE" value="78.4" unit="%" sub="Target 82%" trend="↓ 3.6 pts" />
          <KpiHero big label="Throughput" value="312" sub="pieces / hour" trend="↑ 4.2%" />
          <KpiHero big label="Active WOs" value="8" sub="2 at risk · 1 hold" />
          <KpiHero big ok label="FPY today" value="94.0" unit="%" sub="target ≥ 92%" />
        </div>
      }
      code={`<KpiHero
  big                       // 56px (Andon). Omit for 40px back-office hero.
  accent                    // primary metric on the page
  label="Plant OEE"
  value="78.4" unit="%"
  sub="Target 82%"
  trend="↓ 3.6 pts"        // ↑ green / ↓ red
/>`}
    />
    <div className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">When to use</div>
        <div className="text-[var(--ink-2)]">Plant Overview hero strip · Andon top row · Executive summary.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">When NOT</div>
        <div className="text-[var(--ink-2)]">Inside drawers, side-rails or tables — use <span className="mono">KPI</span> (26px) instead.</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
        <div className="uppercase-label mb-1">Pairing</div>
        <div className="text-[var(--ink-2)]">Always tabular numerals · ≤4 per row · only ONE accent per strip.</div>
      </div>
    </div>
  </DSection>
);

// ============================================================
// 2. PHASE CHIP  (filled + done with check)
// ============================================================
const PhaseChip = ({ label, phase, active, done }) => {
  const color = `var(--c-${phase})`;
  const bg = active ? `color-mix(in oklch, ${color} 14%, var(--paper))` : (done ? 'var(--paper-2)' : 'var(--paper)');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 'var(--r-pill)',
      fontSize: 11, fontWeight: 500,
      background: bg,
      border: `1px solid ${active ? `color-mix(in oklch, ${color} 50%, var(--line))` : 'var(--line)'}`,
      color: active ? color : (done ? 'var(--ink-3)' : 'var(--ink-2)'),
      opacity: done ? 0.7 : 1,
    }}>
      <span className="dot" style={{ background: color, width: 6, height: 6 }} />
      {label}
      {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
    </span>
  );
};

const PhaseChipSection = () => {
  const phases = [
    { l: 'Inbound', p: 'inbound', s: 'done' },
    { l: 'Setup', p: 'setup', s: 'done' },
    { l: 'Production', p: 'production', s: 'active' },
    { l: 'QC', p: 'qc', s: 'pending' },
    { l: 'Outbound', p: 'outbound', s: 'pending' },
    { l: 'Teardown', p: 'teardown', s: 'pending' },
  ];
  return (
    <DSection id="phase-chip" label="Dashboard" title="Phase Chip" sub="Inline pill that carries the workflow phase. Three states: pending · active (filled, colored ink) · done (greyed, with check). Use as a stand-alone status indicator or in a 6-step phase bar.">
      <TwoCol
        preview={
          <div className="space-y-4">
            <div>
              <div className="uppercase-label mb-2">States</div>
              <div className="flex gap-2 flex-wrap">
                <PhaseChip label="Pending" phase="production" />
                <PhaseChip label="Active" phase="production" active />
                <PhaseChip label="Done" phase="production" done />
              </div>
            </div>
            <div>
              <div className="uppercase-label mb-2">All six phases · active</div>
              <div className="flex gap-1.5 flex-wrap">
                <PhaseChip label="Inbound" phase="inbound" active />
                <PhaseChip label="Setup" phase="setup" active />
                <PhaseChip label="Production" phase="production" active />
                <PhaseChip label="QC" phase="qc" active />
                <PhaseChip label="Outbound" phase="outbound" active />
                <PhaseChip label="Teardown" phase="teardown" active />
              </div>
            </div>
            <div>
              <div className="uppercase-label mb-2">In-context — phase bar</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {phases.map((p, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <PhaseChip label={p.l} phase={p.p} active={p.s === 'active'} done={p.s === 'done'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        code={`<PhaseChip label="Production" phase="production" active />
<PhaseChip label="Setup"      phase="setup"      done />
<PhaseChip label="QC"         phase="qc" />          // pending`}
      />
    </DSection>
  );
};

// ============================================================
// 3. EXECUTION LOG ROW
// ============================================================
const ExecRow = ({ piece, time, step, op, dur, status, divider }) => (
  <div className={divider ? 'hairline-b' : ''} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', fontSize: 12 }}>
    <span className="mono tabular" style={{ color: 'var(--ink-3)', width: 40 }}>#{piece}</span>
    <span className="mono tabular" style={{ color: 'var(--ink-3)', width: 70 }}>{time}</span>
    <span style={{ flex: 1 }}>{step}</span>
    <span style={{ color: 'var(--ink-2)', width: 92 }}>{op}</span>
    <span className="mono tabular" style={{ width: 60, textAlign: 'right', fontWeight: status === 'bad' ? 600 : 400, color: status === 'bad' ? 'var(--bad-ink)' : 'var(--ink)' }}>{dur}</span>
    <span className="dot" style={{ background: `var(--${status})` }} />
  </div>
);

const ExecLogSection = () => {
  const rows = [
    { piece: 168, time: '14:31:12', op: 'M. Conti', step: 'Torque bleeder', dur: '24.8s', status: 'ok' },
    { piece: 167, time: '14:30:42', op: 'M. Conti', step: 'Insert seal', dur: '12.4s', status: 'ok' },
    { piece: 166, time: '14:30:18', op: 'M. Conti', step: 'Leak test', dur: '38.6s', status: 'ok' },
    { piece: 165, time: '14:29:34', op: 'M. Conti', step: 'Leak test', dur: '42.1s', status: 'warn' },
    { piece: 164, time: '14:28:48', op: 'M. Conti', step: 'Leak test', dur: 'FAIL', status: 'bad' },
    { piece: 163, time: '14:28:02', op: 'M. Conti', step: 'Torque bleeder', dur: '23.9s', status: 'ok' },
  ];
  return (
    <DSection id="exec-log-row" label="Dashboard" title="Execution Log Row" sub="Compact line for per-piece traceability. Fixed columns: piece# · timestamp · step · operator · duration · status dot. Used in WO Detail / Genealogy / Activity panels.">
      <TwoCol
        preview={
          <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] overflow-hidden">
            {rows.map((r, i) => <ExecRow key={r.piece} {...r} divider={i < rows.length - 1} />)}
          </div>
        }
        code={`<ExecRow
  piece={168}
  time="14:31:12"
  step="Torque bleeder"
  op="M. Conti"
  dur="24.8s"
  status="ok"   // ok · warn · bad
/>`}
      />
    </DSection>
  );
};

// ============================================================
// 4. WORK CENTER CARD
// ============================================================
const WCCard = ({ code, name, wo, q, pct, oee, status, op }) => (
  <div className="hairline" style={{
    background: 'var(--paper)',
    borderRadius: 'var(--r-3)',
    padding: 16,
    borderColor: status === 'bad' ? 'var(--bad)' : 'var(--line)',
    borderWidth: status === 'bad' ? 1.5 : 1,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{code}</div>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.15, marginTop: 2 }}>{name}</div>
      </div>
      <span className="dot" style={{ width: 10, height: 10, background: `var(--${status})`, marginTop: 4 }} />
    </div>
    <div className="mono tabular" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{wo}</div>
    <div className="mono tabular" style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{q}</div>
    <div style={{ marginTop: 8, height: 4, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `var(--${status === 'neutral' ? 'neutral' : status})` }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11 }}>
      <span style={{ color: 'var(--ink-3)' }}>{op}</span>
      {oee > 0 && <span className="mono tabular">OEE {oee}%</span>}
    </div>
  </div>
);

const WCCardSection = () => (
  <DSection id="wc-card" label="Dashboard" title="Work Center Card" sub="Live tile for a single work center on the Andon grid. Status border thickens to 1.5px when bad. q/q tabular numerals as the focal weight, OEE in mono on the bottom-right.">
    <TwoCol
      preview={
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <WCCard code="WC-A2" name="Assembly Line 2" wo="WO-2026-0142" q="168 / 240" pct={70} oee={81} status="ok" op="M. Conti" />
          <WCCard code="WC-B1" name="CNC Cell 1" wo="WO-2026-0141" q="312 / 400" pct={78} oee={76} status="warn" op="L. Bianchi" />
          <WCCard code="WC-C1" name="Assembly Line 1" wo="WO-2026-0144" q="24 / 80" pct={30} oee={62} status="bad" op="A. Russo" />
          <WCCard code="WC-D1" name="Quality Lab" wo="—" q="— / —" pct={0} oee={0} status="neutral" op="Idle · Ready" />
        </div>
      }
      code={`<WCCard
  code="WC-A2"
  name="Assembly Line 2"
  wo="WO-2026-0142"
  q="168 / 240" pct={70}
  oee={81}
  status="ok"           // ok · warn · bad · neutral
  op="M. Conti"
/>`}
    />
  </DSection>
);

// ============================================================
// 5. ALERT BANNER
// ============================================================
const AlertBanner = ({ tone = 'bad', kicker, title, body, cta }) => (
  <div className="hairline" style={{
    background: `var(--${tone}-soft)`,
    borderColor: `var(--${tone})`,
    borderWidth: 1.5,
    borderRadius: 'var(--r-3)',
    padding: 16,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-2)',
        background: 'var(--paper)', border: `1px solid var(--${tone})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={`var(--${tone})`} strokeWidth="2.2">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div className="uppercase-label" style={{ color: `var(--${tone}-ink)`, marginBottom: 2 }}>{kicker}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>{body}</div>
      </div>
      {cta}
    </div>
  </div>
);

const AlertBannerSection = () => (
  <DSection id="alert-banner" label="Dashboard" title="Alert Banner" sub="Full-width critical/warning banner with icon + kicker + title + body + CTA. 1.5px border, soft background. Reserved for events that require immediate operator action — Andon top strip, recovery prompts, hold notifications.">
    <TwoCol
      preview={
        <div className="space-y-3">
          <AlertBanner
            tone="bad"
            kicker="Critical · 2 minutes ago"
            title="Leak test failed on WC-C1 · WO-2026-0144"
            body="3 consecutive failures. Recovery flow auto-suggested. Operator A. Russo notified."
            cta={<Btn variant="primary" icon="arrowR">Open recovery</Btn>}
          />
          <AlertBanner
            tone="warn"
            kicker="Warning · 14 minutes ago"
            title="WC-A2 cycle time +8% over target"
            body="Trend on last 30 pieces. No action required yet. Will escalate to critical at +12%."
            cta={<Btn variant="default">Investigate</Btn>}
          />
        </div>
      }
      code={`<AlertBanner
  tone="bad"            // bad · warn · info
  kicker="Critical · 2 minutes ago"
  title="Leak test failed on WC-C1"
  body="3 consecutive failures…"
  cta={<Btn variant="primary">Open recovery</Btn>}
/>`}
    />
  </DSection>
);

// ============================================================
// 6. PHASE MIX BAR
// ============================================================
const PhaseMixRow = ({ label, phase, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: 11.5, width: 80, color: 'var(--ink-2)' }}>{label}</span>
    <div style={{ flex: 1, height: 4, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value*2}%`, background: `var(--c-${phase})` }} />
    </div>
    <span className="mono tabular" style={{ fontSize: 11.5, width: 32, textAlign: 'right' }}>{value}%</span>
  </div>
);

const PhaseMixSection = () => (
  <DSection id="phase-mix" label="Dashboard" title="Phase Mix Bar" sub="Stacked horizontal list showing how active workload distributes across phases. Each row uses the phase's --c-{phase} token for the fill. Width scales 0–50% input → 0–100% bar (max one phase ≈ 50% in practice).">
    <TwoCol
      preview={
        <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-4">
          <div className="uppercase-label mb-3">Phase mix · today</div>
          <div className="space-y-2">
            <PhaseMixRow label="Inbound" phase="inbound" value={12} />
            <PhaseMixRow label="Setup" phase="setup" value={22} />
            <PhaseMixRow label="Production" phase="production" value={48} />
            <PhaseMixRow label="QC" phase="qc" value={11} />
            <PhaseMixRow label="Outbound" phase="outbound" value={7} />
          </div>
        </div>
      }
      code={`<PhaseMixRow label="Production" phase="production" value={48} />
<PhaseMixRow label="Setup"      phase="setup"      value={22} />
<PhaseMixRow label="QC"         phase="qc"         value={11} />`}
    />
  </DSection>
);

// ============================================================
// 7. LIVE ALERT ITEM
// ============================================================
const LiveAlert = ({ tone, message, time }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
    <span className="dot" style={{ background: `var(--${tone})`, marginTop: 6, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div>{message}</div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{time}</div>
    </div>
  </div>
);

const LiveAlertSection = () => (
  <DSection id="live-alert" label="Dashboard" title="Live Alert Item" sub="Compact line for the side-rail alert feed. Status dot + message + relative time. Stack vertically with 10px gap. Use when alert volume is high — for single critical events use Alert Banner.">
    <TwoCol
      preview={
        <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-4 max-w-[360px]">
          <div className="uppercase-label mb-3" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Live alerts</span>
            <span className="mono">5</span>
          </div>
          <div className="space-y-2.5">
            <LiveAlert tone="bad" message="Leak test failed · WO-0141" time="2m ago" />
            <LiveAlert tone="warn" message="WC-A2 · cycle time +8%" time="14m ago" />
            <LiveAlert tone="info" message="Box BOX-PLT-001234 sealed" time="22m ago" />
            <LiveAlert tone="ok" message="WO-0140 completed · FPY 96%" time="38m ago" />
            <LiveAlert tone="info" message="Shift A handover scheduled" time="1h ago" />
          </div>
        </div>
      }
      code={`<LiveAlert
  tone="bad"           // bad · warn · info · ok
  message="Leak test failed · WO-0141"
  time="2m ago"
/>`}
    />
  </DSection>
);

// ============================================================
// EXPORT — section list for the parent app to compose
// ============================================================
window.DashboardComponentsSections = function DashboardComponentsSections() {
  return (
    <>
      <KpiHeroSection />
      <PhaseChipSection />
      <ExecLogSection />
      <WCCardSection />
      <AlertBannerSection />
      <PhaseMixSection />
      <LiveAlertSection />
    </>
  );
};

// Also export the nav items so the sidebar can link them
window.DASHBOARD_SECTION_ITEMS = [
  { id: 'kpi-hero', label: 'KPI Hero' },
  { id: 'phase-chip', label: 'Phase Chip' },
  { id: 'exec-log-row', label: 'Execution Log Row' },
  { id: 'wc-card', label: 'Work Center Card' },
  { id: 'alert-banner', label: 'Alert Banner' },
  { id: 'phase-mix', label: 'Phase Mix Bar' },
  { id: 'live-alert', label: 'Live Alert Item' },
];
