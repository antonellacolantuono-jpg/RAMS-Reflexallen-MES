/* global React */
const { useState } = React;

// ============================================================
// SHARED MICRO-COMPONENTS (glass)
// ============================================================
const G_KPI = ({ label, value, unit, sub, trend, big }) => (
  <div className="glass-card p-4 relative overflow-hidden">
    <div className="glass-uppercase mb-2">{label}</div>
    <div className="flex items-baseline gap-1.5">
      <span className={`glass-mono font-semibold ${big ? 'text-[44px]' : 'text-[30px]'} leading-none`}>{value}</span>
      {unit && <span className="text-[12px] text-[var(--g-text-3)]">{unit}</span>}
    </div>
    {(sub || trend) && (
      <div className="flex items-center justify-between mt-2 text-[11px]">
        {sub && <span className="text-[var(--g-text-3)]">{sub}</span>}
        {trend && <span className="text-[var(--g-ok)] glass-mono">{trend}</span>}
      </div>
    )}
  </div>
);

const G_Phase = ({ label, color, active, done }) => (
  <div className="phase-chip" style={{
    background: active ? `${color}30` : (done ? 'oklch(1 0 0 / 0.08)' : 'oklch(1 0 0 / 0.04)'),
    borderColor: active ? `${color}60` : 'oklch(1 0 0 / 0.10)',
    color: active ? color : 'var(--g-text-2)',
    opacity: done ? 0.5 : 1,
  }}>
    <span className="glass-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    {label}
    {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
  </div>
);

// ============================================================
// 1. PLANT OVERVIEW — Glass
// ============================================================
window.GlassPlantOverview = function GlassPlantOverview() {
  return (
    <div className="glass-stage min-h-screen p-8">
      <div className="relative z-10 max-w-[1400px] mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="glass-card-strong w-12 h-12 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 80 80" fill="currentColor"><circle cx="33" cy="24" r="5"/><circle cx="33" cy="40" r="5"/><circle cx="33" cy="56" r="5"/><circle cx="46" cy="27" r="4.5"/><circle cx="46" cy="40" r="4.5"/><circle cx="46" cy="53" r="4.5"/><circle cx="57" cy="29" r="3.5"/><circle cx="57" cy="40" r="3.5"/><circle cx="57" cy="51" r="3.5"/><circle cx="67" cy="31" r="2.8"/><circle cx="67" cy="40" r="2.8"/><circle cx="67" cy="49" r="2.8"/></svg>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--g-text-3)] font-semibold">RAMS · Plant Overview</div>
              <h1 className="text-[28px] font-semibold tracking-tight leading-none mt-1">Site Milano</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-pill"><span className="glass-dot ok" /> Shift A · 06:00–14:00</div>
            <div className="glass-pill glass-mono">14:32:08</div>
            <button className="glass-btn">Filter</button>
            <button className="glass-btn glass-btn-primary">+ New WO</button>
          </div>
        </div>

        {/* Hero KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-ring rounded-[18px]">
            <G_KPI big label="OEE" value="78.4" unit="%" sub="Target 82%" trend="↑ 2.1%" />
          </div>
          <G_KPI big label="Throughput" value="312" unit="pc/h" trend="↑ 4.2%" sub="vs. yesterday" />
          <G_KPI big label="Active WOs" value="8" sub="2 at risk" />
          <G_KPI big label="Scrap" value="2.3" unit="%" sub="↑ 0.4 vs target" />
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Active WOs */}
          <div className="glass-card-strong p-5 col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="glass-uppercase mb-0.5">Active work orders</div>
                <div className="text-[15px] font-semibold">8 in progress · 2 at risk</div>
              </div>
              <button className="glass-btn">View all →</button>
            </div>

            <div className="space-y-2">
              {[
                { code: 'WO-2026-0142', item: 'Brake Caliper Assembly', wc: 'WC-A2 · Line 2', q: '168 / 240', pct: 70, phase: 'production', priority: 'high', risk: false },
                { code: 'WO-2026-0143', item: 'Brake Caliper Assembly', wc: 'WC-A2 · Line 2', q: '0 / 120',  pct: 0,  phase: 'setup', priority: 'normal', risk: false },
                { code: 'WO-2026-0141', item: 'Caliper Body, Machined',  wc: 'WC-B1 · CNC Cell', q: '312 / 400', pct: 78, phase: 'production', priority: 'high', risk: true },
                { code: 'WO-2026-0144', item: 'Master Cylinder',         wc: 'WC-C1 · Assembly', q: '24 / 80',   pct: 30, phase: 'qc', priority: 'urgent', risk: true },
              ].map((wo) => (
                <div key={wo.code} className="glass-card p-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="glass-mono text-[12.5px] font-semibold">{wo.code}</span>
                      <G_Phase label={wo.phase} color={
                        wo.phase === 'production' ? 'oklch(0.78 0.16 145)' :
                        wo.phase === 'setup' ? 'oklch(0.80 0.14 75)' :
                        wo.phase === 'qc' ? 'oklch(0.78 0.14 220)' : 'oklch(0.78 0.18 290)'
                      } active />
                      {wo.risk && <span className="glass-pill" style={{background:'oklch(0.72 0.20 25 / 0.18)', borderColor:'oklch(0.72 0.20 25 / 0.4)', color:'oklch(0.85 0.18 25)'}}><span className="glass-dot bad"/>at risk</span>}
                    </div>
                    <div className="text-[12.5px] text-[var(--g-text-2)]">{wo.item}</div>
                    <div className="text-[10.5px] text-[var(--g-text-3)] glass-mono mt-0.5">{wo.wc}</div>
                  </div>
                  <div className="w-[140px]">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="glass-mono text-[12.5px] font-semibold">{wo.q}</span>
                      <span className="glass-mono text-[10.5px] text-[var(--g-text-3)]">{wo.pct}%</span>
                    </div>
                    <div className="glass-progress"><div className="glass-progress-fill" style={{ width: `${wo.pct}%` }}/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-4">
            <div className="glass-card-strong p-5">
              <div className="glass-uppercase mb-3">Phase mix · today</div>
              <div className="flex flex-col gap-2">
                {[
                  { l: 'Inbound', c: 'oklch(0.78 0.14 220)', v: 12 },
                  { l: 'Setup', c: 'oklch(0.80 0.14 75)', v: 22 },
                  { l: 'Production', c: 'oklch(0.78 0.16 145)', v: 48 },
                  { l: 'QC', c: 'oklch(0.78 0.14 260)', v: 11 },
                  { l: 'Outbound', c: 'oklch(0.78 0.18 290)', v: 7 },
                ].map(p => (
                  <div key={p.l} className="flex items-center gap-3">
                    <span className="text-[11.5px] w-20">{p.l}</span>
                    <div className="flex-1 glass-progress h-1.5">
                      <div className="absolute left-0 top-0 bottom-0 rounded-full" style={{ width: `${p.v*2}%`, background: p.c, boxShadow: `0 0 8px ${p.c}` }}/>
                    </div>
                    <span className="glass-mono text-[11.5px] w-8 text-right">{p.v}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="glass-uppercase mb-3 flex items-center justify-between">
                <span>Live alerts</span>
                <span className="glass-mono text-[10.5px] text-[var(--g-text-3)]">3</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { t: 'bad', m: 'Leak test failed · WO-0141', s: '2m ago' },
                  { t: 'warn', m: 'WC-A2 · cycle time +8%', s: '14m ago' },
                  { t: 'info', m: 'Box BOX-PLT-001234 sealed', s: '22m ago' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[12px]">
                    <span className={`glass-dot ${a.t} mt-1.5`} />
                    <div className="flex-1">
                      <div>{a.m}</div>
                      <div className="text-[10.5px] text-[var(--g-text-3)] glass-mono mt-0.5">{a.s}</div>
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
// 2. WORK ORDER DETAIL — Glass (drawer + tabs)
// ============================================================
window.GlassWODetail = function GlassWODetail() {
  const [tab, setTab] = useState('execution');
  return (
    <div className="glass-stage min-h-screen p-8">
      <div className="relative z-10 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 text-[12px] text-[var(--g-text-3)] mb-3">
          <span className="glass-mono">RAMS</span>
          <span>›</span>
          <span>Work Orders</span>
          <span>›</span>
          <span className="glass-mono text-[var(--g-text)]">WO-2026-0142</span>
        </div>

        <div className="glass-card-elev p-7 mb-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="glass-mono text-[13px] text-[var(--g-text-3)] font-semibold tracking-wide">WO-2026-0142</span>
                <G_Phase label="In progress" color="oklch(0.78 0.16 145)" active />
                <span className="glass-pill" style={{background:'oklch(0.82 0.16 75 / 0.18)', borderColor:'oklch(0.82 0.16 75 / 0.4)', color:'oklch(0.90 0.14 75)'}}>High priority</span>
              </div>
              <h1 className="text-[32px] font-semibold tracking-tight leading-none">Brake Caliper Assembly</h1>
              <div className="text-[13px] text-[var(--g-text-2)] mt-2">WC-A2 · Assembly Line 2 · Operator <span className="text-[var(--g-text)] font-medium">M. Conti</span></div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <div className="glass-uppercase mb-1">Progress</div>
                <div className="glass-mono text-[40px] font-semibold leading-none">168<span className="text-[var(--g-text-3)] text-[20px]"> / 240</span></div>
              </div>
              <div className="flex gap-2">
                <button className="glass-btn">Pause</button>
                <button className="glass-btn glass-btn-primary">Continue</button>
              </div>
            </div>
          </div>

          {/* Phase bar */}
          <div className="mt-6 flex items-center gap-2">
            {[
              { l: 'Inbound', c: 'oklch(0.78 0.14 220)', s: 'done' },
              { l: 'Setup', c: 'oklch(0.80 0.14 75)', s: 'done' },
              { l: 'Production', c: 'oklch(0.78 0.16 145)', s: 'active' },
              { l: 'QC', c: 'oklch(0.78 0.14 260)', s: 'pending' },
              { l: 'Outbound', c: 'oklch(0.78 0.18 290)', s: 'pending' },
              { l: 'Teardown', c: 'oklch(0.72 0.10 30)', s: 'pending' },
            ].map((p, i) => (
              <div key={i} className="flex-1">
                <G_Phase label={p.l} color={p.c} active={p.s==='active'} done={p.s==='done'} />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {[
            { id: 'overview', l: 'Overview' },
            { id: 'workflow', l: 'Workflow' },
            { id: 'materials', l: 'Materials', n: 6 },
            { id: 'execution', l: 'Execution', n: 168 },
            { id: 'quality', l: 'Quality', n: 4 },
            { id: 'genealogy', l: 'Genealogy' },
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 h-9 text-[12.5px] rounded-[10px] flex items-center gap-1.5 transition ${
              tab === t.id ? 'bg-[oklch(1_0_0_/_0.14)] border border-[var(--g-line)]' : 'text-[var(--g-text-2)] hover:bg-[oklch(1_0_0_/_0.06)]'
            }`} style={tab === t.id ? { backdropFilter: 'blur(20px)' } : null}>
              {t.l}{t.n != null && <span className="glass-mono text-[10.5px] text-[var(--g-text-3)]">{t.n}</span>}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card-strong p-5 col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="glass-uppercase mb-0.5">Execution log</div>
                <div className="text-[14px] font-semibold">Last 6 pieces</div>
              </div>
              <button className="glass-btn">Export</button>
            </div>
            <div className="space-y-1">
              {[
                { p: 168, t: '14:31:12', op: 'M. Conti', step: 'Torque bleeder', d: '24.8s', s: 'ok' },
                { p: 167, t: '14:30:42', op: 'M. Conti', step: 'Insert seal', d: '12.4s', s: 'ok' },
                { p: 166, t: '14:30:18', op: 'M. Conti', step: 'Leak test', d: '38.6s', s: 'ok' },
                { p: 165, t: '14:29:34', op: 'M. Conti', step: 'Leak test', d: '42.1s', s: 'warn' },
                { p: 164, t: '14:28:48', op: 'M. Conti', step: 'Leak test', d: 'FAIL', s: 'bad' },
                { p: 163, t: '14:28:02', op: 'M. Conti', step: 'Torque bleeder', d: '23.9s', s: 'ok' },
              ].map((r, i) => (
                <div key={i} className="glass-row flex items-center gap-3 py-2 text-[12px]">
                  <span className="glass-mono text-[var(--g-text-3)] w-10">#{r.p}</span>
                  <span className="glass-mono text-[var(--g-text-3)] w-20">{r.t}</span>
                  <span className="flex-1">{r.step}</span>
                  <span className="text-[var(--g-text-2)] w-24">{r.op}</span>
                  <span className="glass-mono w-16 text-right">{r.d}</span>
                  <span className={`glass-dot ${r.s}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="glass-uppercase mb-3">First-pass yield</div>
              <div className="glass-mono text-[40px] font-semibold leading-none">94.0<span className="text-[var(--g-text-3)] text-[18px]">%</span></div>
              <div className="glass-progress mt-3"><div className="glass-progress-fill" style={{ width: '94%' }}/></div>
              <div className="text-[10.5px] text-[var(--g-text-3)] mt-2">10 fails out of 168 pieces</div>
            </div>
            <div className="glass-card p-5">
              <div className="glass-uppercase mb-3">Avg cycle</div>
              <div className="glass-mono text-[28px] font-semibold leading-none">76.4<span className="text-[var(--g-text-3)] text-[14px]">s/pc</span></div>
              <div className="text-[11px] text-[var(--g-ok)] mt-1 glass-mono">↓ 3.2s vs. target</div>
            </div>
            <div className="glass-card p-5">
              <div className="glass-uppercase mb-3">ETA</div>
              <div className="glass-mono text-[24px] font-semibold leading-none">17:44</div>
              <div className="text-[11px] text-[var(--g-text-3)] mt-1">at current pace</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 3. ANDON DASHBOARD — Glass (fullscreen, distance-readable)
// ============================================================
window.GlassAndon = function GlassAndon() {
  return (
    <div className="glass-stage min-h-screen p-8">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[12px] tracking-[0.2em] uppercase text-[var(--g-text-3)] font-semibold">RAMS · Andon · Site Milano</div>
            <h1 className="text-[36px] font-semibold tracking-tight leading-none mt-1">Shift A · Live</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="glass-mono text-[44px] font-semibold leading-none">14:32:08</div>
              <div className="text-[11px] text-[var(--g-text-3)] mt-1">elapsed 8h 32m · target end 14:00</div>
            </div>
          </div>
        </div>

        {/* Hero strip */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="glass-ring rounded-[20px]">
            <div className="glass-card-elev p-6">
              <div className="glass-uppercase mb-2">Plant OEE</div>
              <div className="glass-mono text-[64px] font-semibold leading-none">78.4<span className="text-[28px] text-[var(--g-text-3)]">%</span></div>
              <div className="glass-progress mt-3"><div className="glass-progress-fill" style={{width:'78.4%'}}/></div>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-[var(--g-text-3)]">Target 82%</span>
                <span className="text-[var(--g-warn)] glass-mono">↓ 3.6 pts</span>
              </div>
            </div>
          </div>
          <div className="glass-card-elev p-6">
            <div className="glass-uppercase mb-2">Throughput</div>
            <div className="glass-mono text-[64px] font-semibold leading-none">312</div>
            <div className="text-[12px] text-[var(--g-text-3)] mt-1">pieces / hour</div>
            <div className="text-[12px] text-[var(--g-ok)] glass-mono mt-2">↑ 4.2% vs. yesterday</div>
          </div>
          <div className="glass-card-elev p-6">
            <div className="glass-uppercase mb-2">Active WOs</div>
            <div className="glass-mono text-[64px] font-semibold leading-none">8</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="glass-pill" style={{background:'oklch(0.72 0.20 25 / 0.18)', borderColor:'oklch(0.72 0.20 25 / 0.4)', color:'oklch(0.85 0.18 25)'}}><span className="glass-dot bad"/>2 at risk</span>
              <span className="glass-pill" style={{background:'oklch(0.82 0.16 75 / 0.18)', borderColor:'oklch(0.82 0.16 75 / 0.4)', color:'oklch(0.90 0.14 75)'}}><span className="glass-dot warn"/>1 hold</span>
            </div>
          </div>
          <div className="glass-card-elev p-6">
            <div className="glass-uppercase mb-2">FPY today</div>
            <div className="glass-mono text-[64px] font-semibold leading-none text-[var(--g-ok)]">94.0<span className="text-[28px]">%</span></div>
            <div className="glass-progress mt-3"><div className="absolute left-0 top-0 bottom-0 rounded-full" style={{width:'94%', background:'var(--g-ok)', boxShadow:'0 0 12px var(--g-ok)'}}/></div>
            <div className="text-[11px] text-[var(--g-text-3)] mt-2">target ≥ 92%</div>
          </div>
        </div>

        {/* Work centers grid */}
        <div className="glass-uppercase mb-3">Work centers · live</div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { code: 'WC-A2', n: 'Assembly Line 2', wo: 'WO-2026-0142', q: '168 / 240', pct: 70, oee: 81, s: 'running', op: 'M. Conti' },
            { code: 'WC-B1', n: 'CNC Cell 1', wo: 'WO-2026-0141', q: '312 / 400', pct: 78, oee: 76, s: 'warn', op: 'L. Bianchi' },
            { code: 'WC-C1', n: 'Assembly Line 1', wo: 'WO-2026-0144', q: '24 / 80', pct: 30, oee: 62, s: 'bad', op: 'A. Russo' },
            { code: 'WC-D1', n: 'Quality Lab', wo: '—', q: '— / —', pct: 0, oee: 0, s: 'idle', op: 'Ready' },
          ].map(w => (
            <div key={w.code} className={`glass-card-strong p-5 ${w.s === 'bad' ? 'glass-ring' : ''}`} style={
              w.s === 'bad' ? { '--ring-c': 'oklch(0.72 0.20 25)' } : null
            }>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="glass-mono text-[12px] text-[var(--g-text-3)]">{w.code}</div>
                  <div className="text-[16px] font-semibold leading-tight mt-0.5">{w.n}</div>
                </div>
                <span className={`glass-dot ${w.s === 'running' ? 'ok' : w.s === 'warn' ? 'warn' : w.s === 'bad' ? 'bad' : 'info'}`} style={{ width: 10, height: 10 }} />
              </div>
              <div className="glass-mono text-[13px] text-[var(--g-text-2)]">{w.wo}</div>
              <div className="glass-mono text-[26px] font-semibold mt-1">{w.q}</div>
              <div className="glass-progress mt-2"><div className="glass-progress-fill" style={{ width: `${w.pct}%` }}/></div>
              <div className="flex items-center justify-between mt-3 text-[11px]">
                <span className="text-[var(--g-text-3)]">{w.op}</span>
                {w.oee > 0 && <span className="glass-mono">OEE {w.oee}%</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Alerts strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card-elev p-5 col-span-2" style={{ borderColor: 'oklch(0.72 0.20 25 / 0.45)', boxShadow: '0 0 32px -4px oklch(0.72 0.20 25 / 0.35)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: 'oklch(0.72 0.20 25 / 0.20)', border: '1px solid oklch(0.72 0.20 25 / 0.4)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(0.85 0.18 25)" strokeWidth="2.2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              </div>
              <div className="flex-1">
                <div className="glass-uppercase mb-1" style={{ color: 'oklch(0.85 0.18 25)' }}>Critical · 2 minutes ago</div>
                <div className="text-[18px] font-semibold">Leak test failed on WC-C1 · WO-2026-0144</div>
                <div className="text-[12.5px] text-[var(--g-text-2)] mt-1">3 consecutive failures. Recovery flow auto-suggested. Operator A. Russo notified.</div>
              </div>
              <button className="glass-btn glass-btn-primary self-center">Open recovery →</button>
            </div>
          </div>
          <div className="glass-card-strong p-5">
            <div className="glass-uppercase mb-3">Phase mix · now</div>
            <div className="flex flex-wrap gap-1.5">
              <G_Phase label="Inbound · 1" color="oklch(0.78 0.14 220)" />
              <G_Phase label="Setup · 1" color="oklch(0.80 0.14 75)" />
              <G_Phase label="Production · 4" color="oklch(0.78 0.16 145)" active />
              <G_Phase label="QC · 1" color="oklch(0.78 0.14 260)" />
              <G_Phase label="Outbound · 1" color="oklch(0.78 0.18 290)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
