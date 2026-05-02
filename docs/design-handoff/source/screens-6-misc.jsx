/* global React, MESData */
const { useState: useState6 } = React;

// ============================================================
// WORKFLOWS LIST
// ============================================================
window.ScreenWorkflows = function ScreenWorkflows({ go }) {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Workflows" subtitle="Production process definitions"
        actions={<><Btn icon="upload">Import</Btn><Btn variant="primary" icon="plus" onClick={() => go('workflow-editor')}>New workflow</Btn></>} />
      <div className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { c: 'WF-0042', n: 'Brake Caliper Assembly', v: 'v3', s: 'published', a: 4, p: 7, st: 124, drift: 8, draft: 'v4 draft' },
            { c: 'WF-0043', n: 'Brake Caliper HD Assembly', v: 'v2', s: 'published', a: 1, p: 7, st: 134, drift: 0 },
            { c: 'WF-0051', n: 'Disk Rotor Machining', v: 'v5', s: 'published', a: 2, p: 5, st: 67, drift: 2 },
            { c: 'WF-0052', n: 'Disk Rotor Balancing', v: 'v1', s: 'draft', a: 0, p: 4, st: 28 },
            { c: 'WF-0061', n: 'Master Cylinder Assembly', v: 'v3', s: 'published', a: 1, p: 6, st: 89, drift: 12 },
            { c: 'WF-0072', n: 'ABS Module Test', v: 'v2', s: 'published', a: 0, p: 4, st: 42, drift: 0 },
            { c: 'WF-0081', n: 'Brake Line Crimping', v: 'v1', s: 'archived', a: 0, p: 3, st: 18 },
          ].map(w => (
            <div key={w.c} className="hairline rounded-[var(--r-2)] bg-[var(--paper)] hover:border-[var(--accent)] cursor-pointer" onClick={() => go('workflow-editor')}>
              <div className="px-3 py-2.5 hairline-b flex items-center gap-2">
                <Icon name="layers" size={14} className="text-[var(--ink-3)]" />
                <span className="mono text-[11.5px] font-medium">{w.c}</span>
                <span className="ml-auto"><Badge tone={w.s === 'published' ? 'ok' : w.s === 'draft' ? 'warn' : 'neutral'}>{w.s}</Badge></span>
              </div>
              <div className="p-3">
                <div className="font-semibold text-[13px]">{w.n}</div>
                <div className="text-[11px] text-[var(--ink-3)] mt-0.5">{w.p} phases · {w.st} steps</div>
                {w.draft && (
                  <div className="mt-2 hairline rounded p-1.5 bg-[var(--warn-soft)] text-[var(--warn-ink)] text-[11px] flex items-center gap-1.5">
                    <Icon name="edit" size={11} /> {w.draft} · 2026-04-25
                  </div>
                )}
              </div>
              <div className="hairline-t px-3 py-2 grid grid-cols-3 gap-1 text-[11px]">
                <div><div className="text-[var(--ink-3)]">Version</div><div className="font-semibold mono">{w.v}</div></div>
                <div><div className="text-[var(--ink-3)]">Active WOs</div><div className="font-semibold mono">{w.a}</div></div>
                <div><div className="text-[var(--ink-3)]">Drift</div><div className={cx('font-semibold mono', w.drift > 5 ? 'text-[var(--warn)]' : w.drift > 0 ? 'text-[var(--info-ink)]' : 'text-[var(--ink-3)]')}>{w.drift > 0 ? `${w.drift}%` : '—'}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// RECIPES
// ============================================================
window.ScreenRecipes = function ScreenRecipes() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Device Recipes" subtitle="Parameterized programs for automated equipment"
        actions={<Btn variant="primary" icon="plus">New recipe</Btn>} />
      <div className="flex-1 overflow-auto p-5">
        <div className="space-y-3">
          {[
            { c: 'RCP-LEAK-001', n: 'Caliper standard leak test', d: 'DEV-LEAK Marposs', v: 'v3', s: 'active', use: 8, params: [['target_pressure','3.50 bar'],['hold_time','15 s'],['max_drop','0.3 mbar'],['ramp','1.0 bar/s']] },
            { c: 'RCP-LEAK-002', n: 'Caliper HD leak test', d: 'DEV-LEAK Marposs', v: 'v1', s: 'active', use: 1, params: [['target_pressure','5.00 bar'],['hold_time','20 s'],['max_drop','0.4 mbar'],['ramp','1.5 bar/s']] },
            { c: 'RCP-PRESS-007', n: 'Piston press standard', d: 'DEV-PRESS Schunk', v: 'v2', s: 'active', use: 6, params: [['target_force','15 kN'],['stroke','42 mm'],['speed','5 mm/s'],['hold','3 s']] },
            { c: 'RCP-TORQ-014', n: 'Bleeder torque', d: 'DEV-TORQ Atlas', v: 'v4', s: 'active', use: 12, params: [['target_torque','25 N·m'],['tolerance','±2 N·m'],['angle_check','180°'],['final_speed','12 rpm']] },
          ].map(r => (
            <Card key={r.c} padded={false}>
              <div className="hairline-b px-3 h-9 flex items-center gap-2">
                <Icon name="cog" size={13} className="text-[var(--ink-3)]" />
                <span className="mono text-[11.5px] font-semibold">{r.c}</span>
                <span className="text-[12.5px]">· {r.n}</span>
                <Badge tone="info" className="ml-2">{r.v}</Badge>
                <Badge tone={r.s === 'active' ? 'ok' : 'neutral'}>{r.s}</Badge>
                <span className="ml-auto text-[11px] text-[var(--ink-3)]">used in {r.use} workflows</span>
              </div>
              <div className="p-3 grid grid-cols-[1fr_auto] gap-4">
                <div className="grid grid-cols-4 gap-2">
                  {r.params.map(([k,v]) => (
                    <div key={k} className="hairline rounded p-2 bg-[var(--paper-2)]">
                      <div className="text-[10.5px] uppercase tracking-wider text-[var(--ink-3)]">{k.replace('_',' ')}</div>
                      <div className="font-bold mono tabular text-[13px] mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <Btn icon="upload" size="sm">Push to device</Btn>
                  <Btn icon="diff" size="sm">Compare</Btn>
                  <Btn icon="edit" size="sm">Edit</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS / GENERIC stubs
// ============================================================
window.ScreenSettings = function ScreenSettings() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Site, integrations, security" />
      <div className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-2 gap-3 max-w-[900px]">
          {[
            { ic: 'building', t: 'Site & shifts', d: 'Plant calendar, shift definitions, holidays' },
            { ic: 'plug', t: 'Integrations', d: 'ERP (SAP), MES, OPC-UA, MQTT, REST endpoints' },
            { ic: 'shield', t: 'Security & roles', d: 'Users, roles, permissions, audit retention' },
            { ic: 'badge', t: 'Operator policy', d: 'Login methods, session timeouts, skill expiry' },
            { ic: 'bell', t: 'Alerts & escalations', d: 'Andon rules, on-call, notification channels' },
            { ic: 'gear', t: 'Print & labels', d: 'Label templates, printers, ZPL profiles' },
          ].map(s => (
            <button key={s.t} className="hairline rounded-[var(--r-2)] p-4 bg-[var(--paper)] hover:border-[var(--accent)] text-left">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-[var(--paper-2)] hairline flex items-center justify-center"><Icon name={s.ic} size={16} /></div>
                <div>
                  <div className="font-semibold text-[13px]">{s.t}</div>
                  <div className="text-[11.5px] text-[var(--ink-3)] mt-0.5">{s.d}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

window.ScreenStub = function ScreenStub({ title, subtitle }) {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex-1 flex items-center justify-center text-[var(--ink-3)] text-[12.5px]">
        <div className="text-center">
          <Icon name="sketch" size={28} className="mx-auto mb-2" />
          <div>Section scaffolded — not part of demo focus.</div>
          <div className="text-[11px] mt-1">Use the global nav to explore other sections.</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DEVICES (lightweight)
// ============================================================
window.ScreenDevices = function ScreenDevices() {
  const devs = [
    { c: 'DEV-LEAK-01', n: 'Marposs leak tester #1', wc: 'WC-A2', s: 'in_use', cap: 'leak,pressure', conn: 'OPC-UA', cal: '2026-03-22' },
    { c: 'DEV-LEAK-02', n: 'Marposs leak tester #2', wc: 'WC-B1', s: 'broken', cap: 'leak,pressure', conn: 'OPC-UA', cal: '2026-03-22' },
    { c: 'DEV-PRESS-01', n: 'Schunk piston press #1', wc: 'WC-A2', s: 'in_use', cap: 'force,stroke', conn: 'EtherCAT', cal: '2026-02-14' },
    { c: 'DEV-PRESS-02', n: 'Schunk piston press #2', wc: 'WC-A2', s: 'available', cap: 'force,stroke', conn: 'EtherCAT', cal: '2026-02-14' },
    { c: 'DEV-TORQ-01', n: 'Atlas torque wrench #1', wc: 'WC-A2', s: 'in_use', cap: 'torque,angle', conn: 'BLE', cal: '2026-04-01' },
    { c: 'DEV-TORQ-02', n: 'Atlas torque wrench #2', wc: 'WC-A2', s: 'maintenance', cap: 'torque,angle', conn: 'BLE', cal: '2026-04-01' },
    { c: 'DEV-PRINT-01', n: 'Zebra ZT411 label printer', wc: 'WC-A2', s: 'available', cap: 'label,ZPL', conn: 'TCP/IP', cal: '—' },
    { c: 'DEV-VIS-01', n: 'Cognex VisionPro #1', wc: 'WC-A2', s: 'available', cap: 'vision,inspect', conn: 'OPC-UA', cal: '2026-01-12' },
  ];
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Devices" subtitle="Connected equipment with recipes & telemetry"
        actions={<Btn variant="primary" icon="plus">New device</Btn>} />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
            <th className="text-left px-4 py-2">Code</th>
            <th className="text-left px-2 py-2">Name</th>
            <th className="text-left px-2 py-2">Work center</th>
            <th className="text-left px-2 py-2">Capabilities</th>
            <th className="text-left px-2 py-2">Connection</th>
            <th className="text-left px-2 py-2">Last calibration</th>
            <th className="text-left px-2 py-2">Status</th>
          </tr></thead>
          <tbody>
            {devs.map(d => (
              <tr key={d.c} className="hairline-b hover:bg-[var(--paper-2)] cursor-pointer">
                <td className="px-4 py-2 mono text-[12px] font-medium">{d.c}</td>
                <td className="px-2 py-2">{d.n}</td>
                <td className="px-2 py-2 mono text-[11px]">{d.wc}</td>
                <td className="px-2 py-2"><div className="flex flex-wrap gap-1">{d.cap.split(',').map(c => <Badge key={c} tone="info">{c}</Badge>)}</div></td>
                <td className="px-2 py-2 mono text-[11px]">{d.conn}</td>
                <td className="px-2 py-2 mono text-[11px]">{d.cal}</td>
                <td className="px-2 py-2"><StatusBadge status={d.s} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
