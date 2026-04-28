/* global React, MESData */
const { useState: useState2 } = React;

// ============================================================
// WORK ORDER DETAIL
// ============================================================
window.ScreenWODetail = function ScreenWODetail({ go, params }) {
  const wo = MESData.workOrders.find(w => w.id === params) || MESData.workOrders[0];
  const [tab, setTab] = useState2('overview');
  const [release, setRelease] = useState2(false);
  const wf = MESData.workflow;

  const validation = [
    { label: 'Workflow snapshot', ok: true, detail: 'WF-0042 v3 ready' },
    { label: 'BOM availability', ok: true, detail: '6/6 components reserved' },
    { label: 'Skills coverage', ok: true, detail: 'SKL-ASSY, SKL-LEAK · 3 ops qualified' },
    { label: 'Devices ready', ok: true, detail: 'DEV-LEAK-01, DEV-PRESS-01' },
    { label: 'Recipes approved', ok: true, detail: 'RCP-LEAK-001 v3, RCP-PRESS-007 v2' },
    { label: 'Box types reserved', ok: false, detail: 'BTYPE-CBX-014 inventory low (8 left)' },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumb={<><a className="hover:text-[var(--ink)]" onClick={() => go('workorders')}>Work Orders</a> <span className="mx-1">/</span> {wo.code}</>}
        title={<span className="flex items-center gap-2.5">{wo.code} <StatusBadge status={wo.status} /> <PriorityBadge p={wo.priority} /></span>}
        subtitle={`${wo.itemName} · ${wo.workCenter} · ${wo.workflow}`}
        actions={<>
          <Btn variant="ghost" icon="history">Audit log</Btn>
          <Btn variant="default" icon="edit">Edit</Btn>
          {wo.status === 'planned' && <Btn variant="primary" icon="play" onClick={() => setRelease(true)}>Release</Btn>}
          {wo.status === 'in_progress' && <Btn variant="default" icon="pause">Hold</Btn>}
          {wo.status === 'on_hold' && <Btn variant="primary" icon="play">Resume</Btn>}
        </>}
      />
      <div className="px-5 hairline-b">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'workflow', label: 'Workflow Snapshot' },
          { id: 'materials', label: 'Materials' },
          { id: 'execution', label: 'Execution', count: 168 },
          { id: 'quality', label: 'Quality' },
          { id: 'genealogy', label: 'Genealogy' },
          { id: 'activity', label: 'Activity' },
        ]} />
      </div>
      <div className="flex-1 overflow-auto p-5">
        {tab === 'overview' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <KPI label="Target" value={wo.qtyTarget} unit="pc" />
                <KPI label="Produced" value={wo.qtyProduced} unit="pc" tone="ok" />
                <KPI label="Scrap" value={wo.qtyScrap} unit="pc" tone={wo.qtyScrap > 0 ? 'bad' : 'neutral'} />
                <KPI label="Rework" value={wo.qtyRework} unit="pc" tone={wo.qtyRework > 0 ? 'warn' : 'neutral'} />
              </div>
              <Card padded={false}>
                <div className="hairline-b px-3 h-9 flex items-center justify-between font-semibold text-[12.5px]">
                  Phase progress
                  <span className="text-[11px] text-[var(--ink-3)] mono">snapshot frozen at release</span>
                </div>
                <div className="p-3 space-y-2">
                  {wf.phases.map((p, i) => {
                    const done = i < 2 ? 100 : i === 2 ? 70 : i === 3 ? 30 : 0;
                    return (
                      <div key={p.id} className="grid grid-cols-[24px_180px_1fr_60px_80px] items-center gap-3 text-[12px]">
                        <span className="text-[14px]">{p.icon}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{p.name}</span>
                          {p.autogen && <Badge tone="accent" className="!text-[9px] !h-[16px]">AUTO</Badge>}
                        </div>
                        <Progress value={done} max={100} tone={done === 100 ? 'ok' : done > 0 ? 'accent' : 'neutral'} />
                        <span className="mono tabular text-right text-[var(--ink-3)]">{done}%</span>
                        <span className="mono text-[10.5px] text-[var(--ink-3)] text-right">{p.groups.length} grp</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card padded={false}>
                <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Multi-level timer</div>
                <div className="grid grid-cols-3 divide-x divide-[var(--line)]">
                  {[
                    { l: 'Work Order', planned: '32h 00m', actual: '28h 14m', tone: 'ok', status: 'On track' },
                    { l: 'Phase: Production', planned: '24h 00m', actual: '20h 46m', tone: 'accent', status: 'In progress' },
                    { l: 'Current Part #168', planned: '08m 30s', actual: '07m 12s', tone: 'ok', status: 'Ahead' },
                  ].map(t => (
                    <div key={t.l} className="p-3">
                      <div className="uppercase-label">{t.l}</div>
                      <div className="text-[22px] font-semibold mono tabular mt-1" style={{ color: `var(--${t.tone})` }}>{t.actual}</div>
                      <div className="text-[11px] text-[var(--ink-3)] mono">/ {t.planned} planned</div>
                      <Badge tone={t.tone} className="mt-1.5">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <div className="space-y-3">
              <Card>
                <div className="uppercase-label mb-2">Schedule</div>
                <div className="space-y-1.5 text-[12px]">
                  <Row k="Planned start" v={wo.plannedStart} mono />
                  <Row k="Planned end" v={wo.plannedEnd} mono />
                  <Row k="Actual start" v="2026-04-26 06:14" mono />
                  <Row k="Released" v="2026-04-25 18:42 by L. Russo" mono />
                </div>
              </Card>
              <Card>
                <div className="uppercase-label mb-2">Assignment</div>
                <div className="space-y-1.5 text-[12px]">
                  <Row k="Operator" v={wo.operator} />
                  <Row k="Work center" v={wo.workCenter} />
                  <Row k="Workflow" v={wo.workflow} mono />
                  <Row k="Type" v={wo.type} />
                </div>
              </Card>
              <Card>
                <div className="uppercase-label mb-2">Reservations</div>
                <div className="space-y-1.5 text-[12px]">
                  <Row k="Serials allocated" v="240" mono />
                  <Row k="Material reserved" v="6 components" />
                  <Row k="Box reservations" v="20× CBX-014" mono />
                </div>
              </Card>
              {wo.holdReason && (
                <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--bad-soft)] text-[var(--bad-ink)]">
                  <div className="flex items-center gap-1.5 font-semibold text-[12px] mb-1"><Icon name="alert" size={13} />Hold reason</div>
                  <div className="text-[12px]">{wo.holdReason}</div>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'workflow' && <WorkflowSnapshot />}
        {tab === 'materials' && <MaterialsTab />}
        {tab === 'execution' && <ExecutionTab />}
        {tab === 'quality' && <QualityTab />}
        {tab === 'genealogy' && <GenealogyTab />}
        {tab === 'activity' && <ActivityTab />}
      </div>

      <Modal open={release} onClose={() => setRelease(false)} title="Release Work Order" width={560}
        actions={<>
          <Btn variant="ghost" onClick={() => setRelease(false)}>Cancel</Btn>
          <Btn variant="primary" icon="play" onClick={() => setRelease(false)}>Release with override</Btn>
        </>}>
        <div className="space-y-3">
          <div className="text-[12.5px] text-[var(--ink-2)]">Pre-release validation runtime — checks all prerequisites before freezing the workflow snapshot.</div>
          <div className="space-y-1.5">
            {validation.map((v, i) => (
              <div key={i} className="flex items-start gap-2 hairline rounded-[var(--r-1)] p-2 bg-[var(--paper-2)]">
                <Icon name={v.ok ? 'check' : 'alert'} className={v.ok ? 'text-[var(--ok)]' : 'text-[var(--warn)]'} />
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium">{v.label}</div>
                  <div className="text-[11px] text-[var(--ink-3)]">{v.detail}</div>
                </div>
                <Badge tone={v.ok ? 'ok' : 'warn'}>{v.ok ? 'OK' : 'WARN'}</Badge>
              </div>
            ))}
          </div>
          <Field label="Override reason (required if any warning)">
            <Input placeholder="Min 10 characters…" />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

const Row = ({ k, v, mono }) => (
  <div className="flex justify-between gap-3">
    <span className="text-[var(--ink-3)]">{k}</span>
    <span className={cx('text-right', mono && 'mono tabular text-[11.5px]')}>{v}</span>
  </div>
);

const WorkflowSnapshot = () => {
  const wf = MESData.workflow;
  return (
    <div className="space-y-2">
      <div className="hairline rounded-[var(--r-2)] p-2.5 bg-[var(--accent-soft)] text-[var(--accent-ink)] text-[12px] flex items-center gap-2">
        <Icon name="lock" size={14} /> Snapshot frozen at release · WF-0042 v3 · 2026-04-25 18:42
      </div>
      {wf.phases.map(p => (
        <div key={p.id} className="hairline rounded-[var(--r-2)] bg-[var(--paper)]">
          <div className="px-3 h-9 flex items-center gap-2 hairline-b" style={{ borderLeft: `3px solid var(--c-${p.code})` }}>
            <span>{p.icon}</span>
            <span className="font-semibold text-[12.5px]">{p.name}</span>
            {p.autogen && <Badge tone="accent" className="!text-[9px]">AUTO-GEN</Badge>}
            <span className="ml-auto mono text-[10.5px] text-[var(--ink-3)]">{p.groups.length} groups · {p.groups.reduce((a, g) => a + g.steps.length, 0)} steps</span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-2">
            {p.groups.map(g => (
              <div key={g.id} className="hairline rounded p-2 bg-[var(--paper-2)]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[12px] font-medium">{g.name}</span>
                  {g.autogen && <Badge tone="accent" className="!text-[9px]">AUTO</Badge>}
                  <span className="ml-auto mono text-[10px] text-[var(--ink-3)]">{g.cat}</span>
                </div>
                <div className="space-y-1">
                  {g.steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1.5 text-[11.5px]">
                      <span className="mono text-[var(--ink-3)] w-6 text-right">{String(i+1).padStart(2,'0')}</span>
                      <Icon name={s.cat === 'identification' ? 'qr' : s.cat === 'production' ? 'zap' : s.cat === 'quality_control' ? 'target' : s.cat === 'logistics' ? 'truck' : 'check'} size={11} className="text-[var(--ink-3)]" />
                      <span className="flex-1 truncate">{s.title}</span>
                      {s.devCat === 'parallel' && <Badge tone="info" className="!text-[9px]">∥ {s.partRef}</Badge>}
                      {s.dur && <span className="mono text-[10px] text-[var(--ink-3)]">{s.dur}s</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MaterialsTab = () => (
  <Card padded={false}>
    <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Reserved materials · BOM consumed</div>
    <table className="w-full text-[12.5px]">
      <thead>
        <tr className="hairline-b text-[var(--ink-3)] uppercase-label">
          <th className="text-left px-3 py-2">Component</th>
          <th className="text-left px-2 py-2">Lot</th>
          <th className="text-right px-2 py-2">Required</th>
          <th className="text-right px-2 py-2">Reserved</th>
          <th className="text-right px-2 py-2">Consumed</th>
          <th className="text-left px-2 py-2">Quality</th>
          <th className="text-right px-2 py-2 pr-4">Coverage</th>
        </tr>
      </thead>
      <tbody>
        {[
          { code: 'ITM-SL-00118', name: 'Caliper Body', lot: 'LOT-260420-014', req: 240, res: 240, cons: 168, q: 'approved' },
          { code: 'ITM-CMP-00211', name: 'Piston Seal NBR', lot: 'LOT-260418-007', req: 480, res: 480, cons: 336, q: 'approved' },
          { code: 'ITM-CMP-00284', name: 'Brake Piston', lot: 'LOT-260415-022', req: 480, res: 480, cons: 336, q: 'approved' },
          { code: 'ITM-CMP-00177', name: 'Bleeder Screw', lot: 'LOT-260412-103', req: 240, res: 240, cons: 168, q: 'approved' },
          { code: 'ITM-CSM-00012', name: 'Brake Fluid DOT-4', lot: 'LOT-260410-001', req: 12.0, res: 15.0, cons: 8.4, q: 'quarantine' },
        ].map((m, i) => (
          <tr key={i} className="hairline-b">
            <td className="px-3 py-2">
              <div className="font-medium">{m.name}</div>
              <div className="mono text-[10.5px] text-[var(--ink-3)]">{m.code}</div>
            </td>
            <td className="px-2 py-2 mono text-[11.5px]">{m.lot}</td>
            <td className="px-2 py-2 mono tabular text-right">{m.req}</td>
            <td className="px-2 py-2 mono tabular text-right">{m.res}</td>
            <td className="px-2 py-2 mono tabular text-right">{m.cons}</td>
            <td className="px-2 py-2"><StatusBadge status={m.q} /></td>
            <td className="px-2 py-2 pr-4 w-[140px]"><Progress value={m.cons} max={m.req} tone={m.q === 'quarantine' ? 'warn' : 'ok'} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

const ExecutionTab = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-4 gap-3">
      <KPI label="Cycle time avg" value="07:42" unit="m:ss" tone="ok" sub="planned 08:30" />
      <KPI label="FPY" value="98.2" unit="%" tone="ok" />
      <KPI label="Parallel utilization" value="64" unit="%" tone="warn" sub="target 75%" />
      <KPI label="Cycle deviation" value="-9.4" unit="%" tone="ok" sub="ahead of plan" />
    </div>
    <Card padded={false}>
      <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Recent cycles · pieces 160–168</div>
      <table className="w-full text-[12.5px]">
        <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
          <th className="text-left px-3 py-2">Serial</th>
          <th className="text-left px-2 py-2">Started</th>
          <th className="text-left px-2 py-2">Cycle time</th>
          <th className="text-left px-2 py-2">Operator</th>
          <th className="text-left px-2 py-2">Outcome</th>
          <th className="text-left px-2 py-2">Notes</th>
        </tr></thead>
        <tbody>
          {[
            { s: 'SN-2026-000168', t: '14:18:42', ct: '07:14', op: 'M. Conti', out: 'OK', tone: 'ok' },
            { s: 'SN-2026-000167', t: '14:11:08', ct: '08:51', op: 'M. Conti', out: 'NOK → Rework', tone: 'warn', n: 'Leak Δ=0.6 mbar · recovered' },
            { s: 'SN-2026-000166', t: '14:02:31', ct: '07:02', op: 'M. Conti', out: 'OK', tone: 'ok' },
            { s: 'SN-2026-000165', t: '13:54:18', ct: '07:38', op: 'M. Conti', out: 'OK', tone: 'ok' },
            { s: 'SN-2026-000164', t: '13:46:02', ct: '09:14', op: 'M. Conti', out: 'NOK → Scrap', tone: 'bad', n: 'Dimensional out of tol.' },
            { s: 'SN-2026-000163', t: '13:38:44', ct: '07:21', op: 'M. Conti', out: 'OK', tone: 'ok' },
          ].map((c, i) => (
            <tr key={i} className="hairline-b hover:bg-[var(--paper-2)]">
              <td className="px-3 py-2 mono text-[11.5px]">{c.s}</td>
              <td className="px-2 py-2 mono text-[11.5px] tabular">{c.t}</td>
              <td className="px-2 py-2 mono tabular">{c.ct}</td>
              <td className="px-2 py-2">{c.op}</td>
              <td className="px-2 py-2"><Badge tone={c.tone}>{c.out}</Badge></td>
              <td className="px-2 py-2 text-[11.5px] text-[var(--ink-3)]">{c.n || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const QualityTab = () => (
  <div className="grid grid-cols-2 gap-3">
    <Card padded={false}>
      <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Quality outcomes</div>
      <div className="p-3 grid grid-cols-3 gap-3">
        <KPI label="OK" value="162" tone="ok" sub="96.4%" />
        <KPI label="Rework" value="2" tone="warn" sub="1.2%" />
        <KPI label="Scrap" value="4" tone="bad" sub="2.4%" />
      </div>
    </Card>
    <Card padded={false}>
      <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Scrap by cause</div>
      <div className="p-3 space-y-1.5">
        {[
          { l: 'Dimensional', n: 2, tone: 'bad' },
          { l: 'Cosmetic', n: 1, tone: 'warn' },
          { l: 'Functional (leak)', n: 1, tone: 'bad' },
        ].map(x => (
          <div key={x.l} className="grid grid-cols-[1fr_120px_30px] items-center gap-2 text-[12px]">
            <span>{x.l}</span><Progress value={x.n} max={4} tone={x.tone} /><span className="mono tabular text-right">{x.n}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const GenealogyTab = () => (
  <Card padded={false}>
    <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Serial SN-2026-000168 — Full genealogy</div>
    <div className="p-4 space-y-2 text-[12px]">
      <div className="hairline rounded p-2 bg-[var(--paper-2)]">
        <div className="font-semibold mono">SN-2026-000168 · Brake Caliper Assembly</div>
        <div className="text-[11px] text-[var(--ink-3)] mt-0.5">WO-2026-0142 · Built 2026-04-26 14:18 · Operator M. Conti · Status: OK</div>
      </div>
      <div className="pl-4 space-y-1.5 border-l border-[var(--line)] ml-3">
        {[
          'Caliper Body · ITM-SL-00118 · LOT-260420-014',
          'Piston Seal × 2 · ITM-CMP-00211 · LOT-260418-007',
          'Brake Piston × 2 · ITM-CMP-00284 · LOT-260415-022',
          'Bleeder Screw · ITM-CMP-00177 · LOT-260412-103',
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-2"><span className="dot" style={{background:'var(--info)'}}/><span>{c}</span></div>
        ))}
      </div>
    </div>
  </Card>
);

const ActivityTab = () => (
  <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-3 space-y-2">
    {[
      { t: '14:23', a: 'Step completed', u: 'M. Conti', d: 'Leak test piece #168 → OK' },
      { t: '14:21', a: 'NOK detected', u: 'M. Conti', d: 'Piece #167 leak Δ=0.6mbar — Recovery flow started' },
      { t: '14:11', a: 'Recovery success', u: 'M. Conti', d: 'Piece #167 reworked — re-test OK' },
      { t: '06:14', a: 'Started', u: 'M. Conti', d: 'WO entered in_progress' },
      { t: '2026-04-25 18:42', a: 'Released', u: 'L. Russo', d: 'WF-0042 v3 snapshot frozen · 240 serials allocated' },
      { t: '2026-04-25 17:15', a: 'Planned', u: 'L. Russo', d: 'Scheduled 2026-04-26 06:00 → 2026-04-27 14:00' },
      { t: '2026-04-25 14:00', a: 'Created', u: 'L. Russo', d: 'Draft created from ERP order ERP-885431' },
    ].map((x, i) => (
      <div key={i} className="grid grid-cols-[120px_140px_1fr] gap-3 text-[12px] hairline-b last:border-0 pb-2 last:pb-0">
        <span className="mono text-[11px] text-[var(--ink-3)] tabular">{x.t}</span>
        <span className="font-medium">{x.a}</span>
        <div><span className="text-[var(--ink-3)]">{x.u}: </span>{x.d}</div>
      </div>
    ))}
  </div>
);
