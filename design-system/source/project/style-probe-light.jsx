/* global React */
const { useState } = React;

/*
  RAMS — Style Probe · Light Industrial-Utilitarian
  Same 3 screens as the glass probe, redrawn with the existing token system:
  paper surfaces, hairline borders, tabular numerals, viola accent, phase colors.
  No blur, no glow, no shadow — utilitarian to the bone.
*/

// ============================================================
// SHARED MICRO-COMPONENTS (light)
// ============================================================
const L_KPI = ({ label, value, unit, sub, trend, big, accent }) => (
  <div className="hairline" style={{ background: 'var(--paper)', padding: 16, borderRadius: 'var(--r-3)' }}>
    <div className="uppercase-label" style={{ marginBottom: 8 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span className="tabular" style={{ fontSize: big ? 40 : 28, fontWeight: 600, lineHeight: 1, color: accent ? 'var(--accent)' : 'var(--ink)' }}>{value}</span>
      {unit && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{unit}</span>}
    </div>
    {(sub || trend) && (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
        {sub && <span style={{ color: 'var(--ink-3)' }}>{sub}</span>}
        {trend && <span className="tabular" style={{ color: trend.startsWith('↑') ? 'var(--ok-ink)' : 'var(--bad-ink)' }}>{trend}</span>}
      </div>
    )}
  </div>
);

const L_Phase = ({ label, phase, active, done }) => {
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

const L_Pill = ({ children, tone }) => {
  const tones = {
    ok: { bg: 'var(--ok-soft)', fg: 'var(--ok-ink)', dot: 'var(--ok)' },
    warn: { bg: 'var(--warn-soft)', fg: 'var(--warn-ink)', dot: 'var(--warn)' },
    bad: { bg: 'var(--bad-soft)', fg: 'var(--bad-ink)', dot: 'var(--bad)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info-ink)', dot: 'var(--info)' },
    neutral: { bg: 'var(--neutral-soft)', fg: 'var(--ink-2)', dot: 'var(--neutral)' },
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)', dot: 'var(--accent)' },
  }[tone || 'neutral'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 'var(--r-pill)',
      fontSize: 11, fontWeight: 500,
      background: tones.bg, color: tones.fg,
    }}>
      <span className="dot" style={{ background: tones.dot, width: 6, height: 6 }} />
      {children}
    </span>
  );
};

const L_Btn = ({ children, primary, ghost, onClick }) => (
  <button onClick={onClick} className={primary ? '' : 'hairline'} style={{
    height: 32, padding: '0 14px',
    fontSize: 12.5, fontWeight: 500,
    borderRadius: 'var(--r-2)',
    background: primary ? 'var(--ink)' : (ghost ? 'transparent' : 'var(--paper)'),
    color: primary ? 'var(--paper)' : 'var(--ink)',
    border: ghost ? 'none' : (primary ? '1px solid var(--ink)' : '1px solid var(--line)'),
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  }}>{children}</button>
);

const L_Progress = ({ pct, color }) => (
  <div style={{ height: 4, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color || 'var(--accent)' }} />
  </div>
);

// ============================================================
// 1. PLANT OVERVIEW — Light
// ============================================================
window.LightPlantOverview = function LightPlantOverview() {
  return (
    <div style={{ background: 'var(--paper-2)', minHeight: '100vh', fontFamily: "'Avenir Next Cyr', system-ui, sans-serif", color: 'var(--ink)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="hairline" style={{ width: 40, height: 40, borderRadius: 'var(--r-2)', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="18" height="18" viewBox="0 0 80 80" fill="currentColor"><circle cx="33" cy="24" r="5"/><circle cx="33" cy="40" r="5"/><circle cx="33" cy="56" r="5"/><circle cx="46" cy="27" r="4.5"/><circle cx="46" cy="40" r="4.5"/><circle cx="46" cy="53" r="4.5"/><circle cx="57" cy="29" r="3.5"/><circle cx="57" cy="40" r="3.5"/><circle cx="57" cy="51" r="3.5"/><circle cx="67" cy="31" r="2.8"/><circle cx="67" cy="40" r="2.8"/><circle cx="67" cy="49" r="2.8"/></svg>
            </div>
            <div>
              <div className="uppercase-label">RAMS · Plant Overview</div>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1, margin: '4px 0 0' }}>Site Milano</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <L_Pill tone="ok">Shift A · 06:00–14:00</L_Pill>
            <span className="hairline tabular" style={{ padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'var(--paper)', fontSize: 11 }}>14:32:08</span>
            <L_Btn>Filter</L_Btn>
            <L_Btn primary>+ New WO</L_Btn>
          </div>
        </div>

        {/* Hero KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <L_KPI big accent label="OEE" value="78.4" unit="%" sub="Target 82%" trend="↑ 2.1%" />
          <L_KPI big label="Throughput" value="312" unit="pc/h" trend="↑ 4.2%" sub="vs. yesterday" />
          <L_KPI big label="Active WOs" value="8" sub="2 at risk" />
          <L_KPI big label="Scrap" value="2.3" unit="%" sub="↑ 0.4 vs target" trend="↓ neg" />
        </div>

        {/* Body grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          {/* Active WOs */}
          <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)' }}>
            <div className="hairline-b" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <div className="uppercase-label" style={{ marginBottom: 2 }}>Active work orders</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>8 in progress · 2 at risk</div>
              </div>
              <L_Btn ghost>View all →</L_Btn>
            </div>

            <div>
              {[
                { code: 'WO-2026-0142', item: 'Brake Caliper Assembly', wc: 'WC-A2 · Line 2', q: '168 / 240', pct: 70, phase: 'production', priority: null, risk: false },
                { code: 'WO-2026-0143', item: 'Brake Caliper Assembly', wc: 'WC-A2 · Line 2', q: '0 / 120',  pct: 0,  phase: 'setup', priority: null, risk: false },
                { code: 'WO-2026-0141', item: 'Caliper Body, Machined',  wc: 'WC-B1 · CNC Cell', q: '312 / 400', pct: 78, phase: 'production', priority: 'high', risk: true },
                { code: 'WO-2026-0144', item: 'Master Cylinder',         wc: 'WC-C1 · Assembly', q: '24 / 80',   pct: 30, phase: 'qc', priority: 'urgent', risk: true },
              ].map((wo, i, arr) => (
                <div key={wo.code} className={i < arr.length - 1 ? 'hairline-b' : ''} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="mono tabular" style={{ fontSize: 12.5, fontWeight: 600 }}>{wo.code}</span>
                      <L_Phase label={wo.phase[0].toUpperCase() + wo.phase.slice(1)} phase={wo.phase} active />
                      {wo.priority === 'urgent' && <L_Pill tone="bad">Urgent</L_Pill>}
                      {wo.priority === 'high' && <L_Pill tone="warn">High priority</L_Pill>}
                      {wo.risk && <L_Pill tone="bad">at risk</L_Pill>}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{wo.item}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{wo.wc}</div>
                  </div>
                  <div style={{ width: 160 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span className="mono tabular" style={{ fontSize: 12.5, fontWeight: 600 }}>{wo.q}</span>
                      <span className="mono tabular" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{wo.pct}%</span>
                    </div>
                    <L_Progress pct={wo.pct} color={`var(--c-${wo.phase})`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 16 }}>
              <div className="uppercase-label" style={{ marginBottom: 12 }}>Phase mix · today</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Inbound', p: 'inbound', v: 12 },
                  { l: 'Setup', p: 'setup', v: 22 },
                  { l: 'Production', p: 'production', v: 48 },
                  { l: 'QC', p: 'qc', v: 11 },
                  { l: 'Outbound', p: 'outbound', v: 7 },
                ].map(p => (
                  <div key={p.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11.5, width: 80, color: 'var(--ink-2)' }}>{p.l}</span>
                    <div style={{ flex: 1, height: 4, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p.v*2}%`, background: `var(--c-${p.p})` }} />
                    </div>
                    <span className="mono tabular" style={{ fontSize: 11.5, width: 32, textAlign: 'right' }}>{p.v}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 16 }}>
              <div className="uppercase-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Live alerts</span>
                <span className="mono">3</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { t: 'bad', m: 'Leak test failed · WO-0141', s: '2m ago' },
                  { t: 'warn', m: 'WC-A2 · cycle time +8%', s: '14m ago' },
                  { t: 'info', m: 'Box BOX-PLT-001234 sealed', s: '22m ago' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
                    <span className="dot" style={{ background: `var(--${a.t})`, marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div>{a.m}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{a.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 2. WORK ORDER DETAIL — Light
// ============================================================
window.LightWODetail = function LightWODetail() {
  const [tab, setTab] = useState('execution');
  return (
    <div style={{ background: 'var(--paper-2)', minHeight: '100vh', fontFamily: "'Avenir Next Cyr', system-ui, sans-serif", color: 'var(--ink)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
          <span className="mono">RAMS</span>
          <span>›</span>
          <span>Work Orders</span>
          <span>›</span>
          <span className="mono" style={{ color: 'var(--ink)' }}>WO-2026-0142</span>
        </div>

        {/* Header card */}
        <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.04em' }}>WO-2026-0142</span>
                <L_Phase label="In progress" phase="production" active />
                <L_Pill tone="warn">High priority</L_Pill>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.1, margin: 0 }}>Brake Caliper Assembly</h1>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>WC-A2 · Assembly Line 2 · Operator <span style={{ color: 'var(--ink)', fontWeight: 500 }}>M. Conti</span></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div className="uppercase-label" style={{ marginBottom: 4 }}>Progress</div>
                <div className="mono tabular" style={{ fontSize: 36, fontWeight: 600, lineHeight: 1 }}>168<span style={{ color: 'var(--ink-3)', fontSize: 18 }}> / 240</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <L_Btn>Pause</L_Btn>
                <L_Btn primary>Continue</L_Btn>
              </div>
            </div>
          </div>

          {/* Phase bar */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { l: 'Inbound', p: 'inbound', s: 'done' },
              { l: 'Setup', p: 'setup', s: 'done' },
              { l: 'Production', p: 'production', s: 'active' },
              { l: 'QC', p: 'qc', s: 'pending' },
              { l: 'Outbound', p: 'outbound', s: 'pending' },
              { l: 'Teardown', p: 'teardown', s: 'pending' },
            ].map((p, i) => (
              <div key={i} style={{ flex: 1 }}>
                <L_Phase label={p.l} phase={p.p} active={p.s === 'active'} done={p.s === 'done'} />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="hairline-b" style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
          {[
            { id: 'overview', l: 'Overview' },
            { id: 'workflow', l: 'Workflow' },
            { id: 'materials', l: 'Materials', n: 6 },
            { id: 'execution', l: 'Execution', n: 168 },
            { id: 'quality', l: 'Quality', n: 4 },
            { id: 'genealogy', l: 'Genealogy' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 16px',
              fontSize: 12.5,
              fontWeight: tab === t.id ? 600 : 500,
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {t.l}{t.n != null && <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t.n}</span>}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)' }}>
            <div className="hairline-b" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <div className="uppercase-label" style={{ marginBottom: 2 }}>Execution log</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Last 6 pieces</div>
              </div>
              <L_Btn>Export</L_Btn>
            </div>
            <div>
              {[
                { p: 168, t: '14:31:12', op: 'M. Conti', step: 'Torque bleeder', d: '24.8s', s: 'ok' },
                { p: 167, t: '14:30:42', op: 'M. Conti', step: 'Insert seal', d: '12.4s', s: 'ok' },
                { p: 166, t: '14:30:18', op: 'M. Conti', step: 'Leak test', d: '38.6s', s: 'ok' },
                { p: 165, t: '14:29:34', op: 'M. Conti', step: 'Leak test', d: '42.1s', s: 'warn' },
                { p: 164, t: '14:28:48', op: 'M. Conti', step: 'Leak test', d: 'FAIL', s: 'bad' },
                { p: 163, t: '14:28:02', op: 'M. Conti', step: 'Torque bleeder', d: '23.9s', s: 'ok' },
              ].map((r, i, arr) => (
                <div key={i} className={i < arr.length - 1 ? 'hairline-b' : ''} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', fontSize: 12 }}>
                  <span className="mono tabular" style={{ color: 'var(--ink-3)', width: 40 }}>#{r.p}</span>
                  <span className="mono tabular" style={{ color: 'var(--ink-3)', width: 70 }}>{r.t}</span>
                  <span style={{ flex: 1 }}>{r.step}</span>
                  <span style={{ color: 'var(--ink-2)', width: 92 }}>{r.op}</span>
                  <span className="mono tabular" style={{ width: 60, textAlign: 'right', fontWeight: r.s === 'bad' ? 600 : 400, color: r.s === 'bad' ? 'var(--bad-ink)' : 'var(--ink)' }}>{r.d}</span>
                  <span className="dot" style={{ background: `var(--${r.s})` }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 16 }}>
              <div className="uppercase-label" style={{ marginBottom: 8 }}>First-pass yield</div>
              <div className="mono tabular" style={{ fontSize: 36, fontWeight: 600, lineHeight: 1, color: 'var(--ok-ink)' }}>94.0<span style={{ color: 'var(--ink-3)', fontSize: 16 }}>%</span></div>
              <div style={{ marginTop: 10 }}><L_Progress pct={94} color="var(--ok)" /></div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 8 }}>10 fails out of 168 pieces</div>
            </div>
            <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 16 }}>
              <div className="uppercase-label" style={{ marginBottom: 8 }}>Avg cycle</div>
              <div className="mono tabular" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}>76.4<span style={{ color: 'var(--ink-3)', fontSize: 13 }}>s/pc</span></div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ok-ink)', marginTop: 4 }}>↓ 3.2s vs. target</div>
            </div>
            <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 16 }}>
              <div className="uppercase-label" style={{ marginBottom: 8 }}>ETA</div>
              <div className="mono tabular" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>17:44</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>at current pace</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 3. ANDON DASHBOARD — Light (high contrast still, but on paper)
// ============================================================
window.LightAndon = function LightAndon() {
  return (
    <div style={{ background: 'var(--paper-2)', minHeight: '100vh', fontFamily: "'Avenir Next Cyr', system-ui, sans-serif", color: 'var(--ink)' }}>
      <div style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="uppercase-label">RAMS · Andon · Site Milano</div>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1, margin: '4px 0 0' }}>Shift A · Live</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono tabular" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1 }}>14:32:08</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>elapsed 8h 32m · target end 14:00</div>
          </div>
        </div>

        {/* Hero strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 20, borderColor: 'var(--accent)' }}>
            <div className="uppercase-label" style={{ marginBottom: 8 }}>Plant OEE</div>
            <div className="mono tabular" style={{ fontSize: 56, fontWeight: 600, lineHeight: 1, color: 'var(--accent)' }}>78.4<span style={{ fontSize: 24, color: 'var(--ink-3)' }}>%</span></div>
            <div style={{ marginTop: 12 }}><L_Progress pct={78.4} color="var(--accent)" /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
              <span style={{ color: 'var(--ink-3)' }}>Target 82%</span>
              <span className="mono tabular" style={{ color: 'var(--warn-ink)' }}>↓ 3.6 pts</span>
            </div>
          </div>
          <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 20 }}>
            <div className="uppercase-label" style={{ marginBottom: 8 }}>Throughput</div>
            <div className="mono tabular" style={{ fontSize: 56, fontWeight: 600, lineHeight: 1 }}>312</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>pieces / hour</div>
            <div className="mono tabular" style={{ fontSize: 12, color: 'var(--ok-ink)', marginTop: 8 }}>↑ 4.2% vs. yesterday</div>
          </div>
          <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 20 }}>
            <div className="uppercase-label" style={{ marginBottom: 8 }}>Active WOs</div>
            <div className="mono tabular" style={{ fontSize: 56, fontWeight: 600, lineHeight: 1 }}>8</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <L_Pill tone="bad">2 at risk</L_Pill>
              <L_Pill tone="warn">1 hold</L_Pill>
            </div>
          </div>
          <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 20 }}>
            <div className="uppercase-label" style={{ marginBottom: 8 }}>FPY today</div>
            <div className="mono tabular" style={{ fontSize: 56, fontWeight: 600, lineHeight: 1, color: 'var(--ok-ink)' }}>94.0<span style={{ fontSize: 24, color: 'var(--ink-3)' }}>%</span></div>
            <div style={{ marginTop: 12 }}><L_Progress pct={94} color="var(--ok)" /></div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>target ≥ 92%</div>
          </div>
        </div>

        {/* Work centers grid */}
        <div className="uppercase-label" style={{ marginBottom: 10 }}>Work centers · live</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { code: 'WC-A2', n: 'Assembly Line 2', wo: 'WO-2026-0142', q: '168 / 240', pct: 70, oee: 81, s: 'ok', op: 'M. Conti' },
            { code: 'WC-B1', n: 'CNC Cell 1', wo: 'WO-2026-0141', q: '312 / 400', pct: 78, oee: 76, s: 'warn', op: 'L. Bianchi' },
            { code: 'WC-C1', n: 'Assembly Line 1', wo: 'WO-2026-0144', q: '24 / 80', pct: 30, oee: 62, s: 'bad', op: 'A. Russo' },
            { code: 'WC-D1', n: 'Quality Lab', wo: '—', q: '— / —', pct: 0, oee: 0, s: 'neutral', op: 'Idle · Ready' },
          ].map(w => (
            <div key={w.code} className="hairline" style={{
              background: 'var(--paper)',
              borderRadius: 'var(--r-3)',
              padding: 16,
              borderColor: w.s === 'bad' ? 'var(--bad)' : 'var(--line)',
              borderWidth: w.s === 'bad' ? 1.5 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{w.code}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.15, marginTop: 2 }}>{w.n}</div>
                </div>
                <span className="dot" style={{ width: 10, height: 10, background: `var(--${w.s})`, marginTop: 4 }} />
              </div>
              <div className="mono tabular" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{w.wo}</div>
              <div className="mono tabular" style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{w.q}</div>
              <div style={{ marginTop: 8 }}><L_Progress pct={w.pct} color={`var(--${w.s === 'neutral' ? 'neutral' : w.s})`} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11 }}>
                <span style={{ color: 'var(--ink-3)' }}>{w.op}</span>
                {w.oee > 0 && <span className="mono tabular">OEE {w.oee}%</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Alerts strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div className="hairline" style={{ background: 'var(--bad-soft)', borderColor: 'var(--bad)', borderWidth: 1.5, borderRadius: 'var(--r-3)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-2)', background: 'var(--paper)', border: '1px solid var(--bad)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bad)" strokeWidth="2.2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="uppercase-label" style={{ color: 'var(--bad-ink)', marginBottom: 2 }}>Critical · 2 minutes ago</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Leak test failed on WC-C1 · WO-2026-0144</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>3 consecutive failures. Recovery flow auto-suggested. Operator A. Russo notified.</div>
              </div>
              <L_Btn primary>Open recovery →</L_Btn>
            </div>
          </div>
          <div className="hairline" style={{ background: 'var(--paper)', borderRadius: 'var(--r-3)', padding: 16 }}>
            <div className="uppercase-label" style={{ marginBottom: 10 }}>Phase mix · now</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <L_Phase label="Inbound · 1" phase="inbound" />
              <L_Phase label="Setup · 1" phase="setup" />
              <L_Phase label="Production · 4" phase="production" active />
              <L_Phase label="QC · 1" phase="qc" />
              <L_Phase label="Outbound · 1" phase="outbound" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
