/* global React, MESData */
const { useState: useState5 } = React;

// ============================================================
// BOX TYPES & BOXES
// ============================================================
window.ScreenBoxes = function ScreenBoxes({ go }) {
  const [tab, setTab] = useState5('boxes');
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Box Management" subtitle="Returnable + disposable packaging · 219 boxes tracked"
        actions={<><Btn icon="qr">Print labels</Btn><Btn variant="primary" icon="plus">New box</Btn></>} />
      <div className="px-5 hairline-b">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'boxes', label: 'Boxes', count: 219 },
          { id: 'types', label: 'Box Types', count: 8 },
          { id: 'flow', label: 'Pack-out flow' },
        ]} />
      </div>
      <div className="flex-1 overflow-auto">
        {tab === 'boxes' && <BoxesList />}
        {tab === 'types' && <BoxTypes />}
        {tab === 'flow' && <PackoutFlow />}
      </div>
    </div>
  );
};

const BoxesList = () => {
  const counts = MESData.boxes.reduce((a, b) => { a[b.status] = (a[b.status] || 0) + 1; return a; }, {});
  return (
    <div className="p-5 space-y-3">
      <div className="grid grid-cols-6 gap-2">
        {[
          ['empty', 'Empty', counts.empty || 142, 'neutral'],
          ['partially_filled', 'Partial', counts.partially_filled || 38, 'info'],
          ['full', 'Full', counts.full || 12, 'info'],
          ['sealed', 'Sealed', counts.sealed || 24, 'accent'],
          ['in_transit', 'Transit', 0, 'warn'],
          ['returned', 'Returned', counts.returned || 0, 'ok'],
        ].map(([k,l,n,t]) => (
          <Card key={k} className="text-center">
            <div className="uppercase-label">{l}</div>
            <div className="text-[24px] font-bold mono mt-1" style={{ color: `var(--${t})` }}>{n}</div>
          </Card>
        ))}
      </div>
      <Card padded={false}>
        <div className="hairline-b px-3 h-9 flex items-center justify-between">
          <span className="font-semibold text-[12.5px]">Active boxes</span>
          <div className="flex gap-2">
            <Select className="text-[12px]"><option>All types</option><option>BTYPE-CBX-014</option></Select>
            <Select className="text-[12px]"><option>All statuses</option></Select>
          </div>
        </div>
        <table className="w-full text-[12.5px]">
          <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
            <th className="text-left px-3 py-2">Box ID</th>
            <th className="text-left px-2 py-2">Type</th>
            <th className="text-left px-2 py-2">Contents</th>
            <th className="text-left px-2 py-2">Fill</th>
            <th className="text-left px-2 py-2">Location</th>
            <th className="text-left px-2 py-2">WO</th>
            <th className="text-left px-2 py-2">Cycles</th>
            <th className="text-left px-2 py-2">Status</th>
          </tr></thead>
          <tbody>
            {MESData.boxes.slice(0, 12).map(b => (
              <tr key={b.id} className="hairline-b hover:bg-[var(--paper-2)] cursor-pointer">
                <td className="px-3 py-2 mono text-[11.5px] font-medium">{b.code}</td>
                <td className="px-2 py-2 mono text-[11px]">{b.type}</td>
                <td className="px-2 py-2 text-[11.5px]">{b.contents || <span className="text-[var(--ink-3)]">—</span>}</td>
                <td className="px-2 py-2 w-[140px]">
                  <div className="flex items-center gap-2">
                    <Progress value={b.fill} max={b.capacity} tone={b.fill === b.capacity ? 'accent' : b.fill > 0 ? 'info' : 'neutral'} />
                    <span className="mono text-[10.5px] tabular text-[var(--ink-3)] flex-shrink-0">{b.fill}/{b.capacity}</span>
                  </div>
                </td>
                <td className="px-2 py-2 mono text-[11px]">{b.location}</td>
                <td className="px-2 py-2 mono text-[11px]">{b.wo || '—'}</td>
                <td className="px-2 py-2 mono tabular text-right">{b.cycles}</td>
                <td className="px-2 py-2"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const BoxTypes = () => (
  <div className="p-5 grid grid-cols-3 gap-3">
    {MESData.boxTypes.map(bt => (
      <Card key={bt.id}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="mono text-[11px] text-[var(--ink-3)]">{bt.code}</div>
            <div className="font-semibold text-[13px]">{bt.name}</div>
          </div>
          <Badge tone={bt.returnable ? 'accent' : 'neutral'}>{bt.returnable ? 'Returnable' : 'Disposable'}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11.5px] mb-2">
          <Row k="Capacity" v={`${bt.capacity} pc`} />
          <Row k="Dimensions" v={bt.dimensions} mono />
          <Row k="Tare weight" v={`${bt.tare} kg`} mono />
          <Row k="Max cycles" v={bt.maxCycles || '—'} />
        </div>
        <div className="hairline-t pt-2 flex items-center justify-between">
          <span className="text-[11px] text-[var(--ink-3)]">{bt.inventoryActive} active</span>
          <Btn variant="ghost" size="sm" iconR="arrowR">View boxes</Btn>
        </div>
      </Card>
    ))}
  </div>
);

const PackoutFlow = () => (
  <div className="p-5 space-y-3">
    <div className="text-[12px] text-[var(--ink-3)]">Auto-generated Logistics phase for items shipped in boxes. Read-only — edit the parent workflow to modify.</div>
    <Card padded={false}>
      <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px] gap-2">
        <span>📦</span> Logistics phase · auto-generated
        <Badge tone="accent" className="!text-[9px]">AUTO-GEN</Badge>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { i: 1, t: 'Reserve box', d: 'Pick BTYPE-CBX-014 from inventory · scan QR', ic: 'qr' },
            { i: 2, t: 'Add unit', d: 'Scan finished serial → register box content', ic: 'cube' },
            { i: 3, t: 'Fill check', d: 'Loop until box.fill === box.capacity', ic: 'check' },
            { i: 4, t: 'Seal & label', d: 'Generate seal SEAL-XXXXX · print label', ic: 'lock' },
          ].map(s => (
            <div key={s.i} className="hairline rounded p-3 bg-[var(--paper-2)] relative">
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center mono text-[11px] font-bold">{s.i}</div>
              <Icon name={s.ic} size={16} className="mb-2 text-[var(--accent)]" />
              <div className="font-semibold text-[12px]">{s.t}</div>
              <div className="text-[11px] text-[var(--ink-3)] mt-1">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <div className="uppercase-label mb-2">Auto-gen rules</div>
        <div className="space-y-2 text-[12px]">
          <div className="hairline rounded p-2 bg-[var(--paper-2)]">
            <div className="font-medium">When item is shipped in box</div>
            <div className="text-[11px] text-[var(--ink-3)] mt-1 mono">item.shipping_box != null</div>
          </div>
          <div className="hairline rounded p-2 bg-[var(--paper-2)]">
            <div className="font-medium">Generate Logistics phase if missing</div>
            <div className="text-[11px] text-[var(--ink-3)] mt-1">Inserted after Quality Control phase</div>
          </div>
        </div>
      </Card>
      <Card>
        <div className="uppercase-label mb-2">Box reservation strategy</div>
        <div className="space-y-2 text-[12px]">
          <Row k="Strategy" v="FIFO returnable cycles" />
          <Row k="Min reserve" v="WO target / capacity + 10%" />
          <Row k="Damaged routing" v="Quarantine + NCR" />
          <Row k="Returnable check" v="On entry of phase" />
        </div>
      </Card>
    </div>
  </div>
);

// ============================================================
// HMI — Operator Shop Floor
// ============================================================
window.ScreenHMI = function ScreenHMI({ go, params }) {
  const [step, setStep] = useState5(params?.step || 'login');
  const screens = {
    login: HMILogin,
    workorders: HMIWorkOrders,
    bom: HMIBOMCheck,
    work: HMIWorkScreen,
    parallel: HMIParallel,
    recovery: HMIRecovery,
    pack: HMIPacking,
  };
  const Cur = screens[step] || HMILogin;
  return (
    <div className="flex flex-col h-full bg-black">
      <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 text-zinc-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">HMI Demo · WS-A2-01</span>
          <span className="text-[10px] mono text-zinc-600">14:23:08</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-zinc-500 mr-2">Walkthrough:</span>
          {[['login','1.Login'],['workorders','2.WOs'],['bom','3.BOM'],['work','4.Work'],['parallel','5.∥'],['recovery','6.NOK'],['pack','7.Pack']].map(([k,l]) => (
            <button key={k} onClick={() => setStep(k)} className={cx('px-2 py-1 rounded mono text-[11px]', step === k ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-100')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-zinc-100 text-zinc-900">
        <Cur go={go} setStep={setStep} />
      </div>
    </div>
  );
};

const HMIShell = ({ title, sub, badge, children, footer, status }) => (
  <div className="h-full flex flex-col">
    <div className="bg-zinc-900 text-zinc-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-zinc-400">{sub}</div>
        <div className="text-[18px] font-bold tracking-tight">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        {status && <Badge tone={status.t}>{status.l}</Badge>}
        {badge && <div className="text-right"><div className="text-[10px] uppercase text-zinc-400">{badge.l}</div><div className="font-bold mono text-[15px]">{badge.v}</div></div>}
      </div>
    </div>
    <div className="flex-1 overflow-auto p-5">{children}</div>
    {footer && <div className="border-t border-zinc-300 bg-white px-5 py-3 flex items-center justify-end gap-2 flex-shrink-0">{footer}</div>}
  </div>
);

const HMIBigBtn = ({ children, onClick, variant = 'default', icon, big, className }) => (
  <button onClick={onClick}
    className={cx('font-semibold tracking-tight transition-all flex items-center justify-center gap-2',
      big ? 'h-16 px-6 text-[16px] rounded-lg' : 'h-12 px-5 text-[14px] rounded',
      variant === 'primary' ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-md' :
      variant === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md' :
      variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-500 shadow-md' :
      'bg-white border-2 border-zinc-300 hover:border-zinc-500',
      className)}>
    {icon && <Icon name={icon} size={big ? 18 : 14} />}{children}
  </button>
);

const HMILogin = ({ setStep }) => (
  <HMIShell title="Operator Sign-in" sub="Workstation WS-A2-01 · Brake Assembly Line">
    <div className="max-w-[600px] mx-auto pt-12 space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setStep('workorders')} className="hairline rounded-lg p-6 bg-white hover:border-amber-500 hover:bg-amber-50 text-left flex items-start gap-4 transition-all">
          <div className="w-14 h-14 rounded-lg bg-zinc-900 text-amber-400 flex items-center justify-center"><Icon name="badge" size={26} /></div>
          <div>
            <div className="text-[15px] font-bold">Badge / RFID</div>
            <div className="text-[12px] text-zinc-500 mt-1">Tap your badge on the reader</div>
            <div className="text-[10.5px] mono text-zinc-400 mt-3">Reader: RDR-A2-01 · Ready</div>
          </div>
        </button>
        <button onClick={() => setStep('workorders')} className="hairline rounded-lg p-6 bg-white hover:border-amber-500 hover:bg-amber-50 text-left flex items-start gap-4 transition-all">
          <div className="w-14 h-14 rounded-lg bg-zinc-900 text-amber-400 flex items-center justify-center"><Icon name="qr" size={26} /></div>
          <div>
            <div className="text-[15px] font-bold">QR Code</div>
            <div className="text-[12px] text-zinc-500 mt-1">Scan your operator QR</div>
            <div className="text-[10.5px] mono text-zinc-400 mt-3">Scanner: SCN-A2-01 · Ready</div>
          </div>
        </button>
      </div>
      <div className="hairline rounded-lg bg-white p-5">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Or enter credentials</div>
        <div className="space-y-2">
          <input className="w-full hairline rounded h-12 px-3 text-[14px]" placeholder="Operator ID (OP-XXXX)" />
          <input className="w-full hairline rounded h-12 px-3 text-[14px]" placeholder="PIN" type="password" />
          <HMIBigBtn variant="primary" big icon="login" onClick={() => setStep('workorders')} className="w-full">Sign in</HMIBigBtn>
        </div>
      </div>
    </div>
  </HMIShell>
);

const HMIWorkOrders = ({ setStep }) => {
  const wos = MESData.workOrders.filter(w => ['released', 'in_progress', 'on_hold'].includes(w.status));
  return (
    <HMIShell title="Available Work Orders" sub="OP-0142 Marco Conti · Shift A · WS-A2-01"
      status={{ t: 'ok', l: '3 skills · 5 qualified' }}
      footer={<><HMIBigBtn icon="x">Sign out</HMIBigBtn></>}>
      <div className="space-y-3">
        {wos.map(wo => (
          <button key={wo.id} onClick={() => setStep('bom')}
            className={cx('w-full text-left hairline rounded-lg p-4 bg-white hover:border-amber-500 transition-all', wo.priority === 'urgent' && 'border-red-500 border-l-4 border-l-red-500')}>
            <div className="grid grid-cols-[160px_1fr_180px_140px] gap-4 items-center">
              <div>
                <div className="mono text-[12px] text-zinc-500">{wo.code}</div>
                <div className="font-bold text-[16px] mt-0.5">{wo.itemName}</div>
                <div className="text-[11.5px] text-zinc-500 mt-0.5 mono">{wo.item}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <PriorityBadge p={wo.priority} />
                  <StatusBadge status={wo.status} />
                  <span className="text-[11px] text-zinc-500">{wo.workflow}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1"><Progress value={wo.qtyProduced} max={wo.qtyTarget} tone={wo.status === 'on_hold' ? 'warn' : 'accent'} /></div>
                  <span className="mono text-[12px] tabular text-zinc-700">{wo.qtyProduced}/{wo.qtyTarget}</span>
                </div>
              </div>
              <div className="text-[11.5px] text-zinc-600">
                <div className="flex items-center gap-1.5"><Icon name="cog" size={11}/>{wo.workCenter}</div>
                <div className="flex items-center gap-1.5 mt-1"><Icon name="clock" size={11}/>Plan: {wo.plannedStart.slice(11,16)}</div>
              </div>
              <div className="text-right">
                <HMIBigBtn variant="primary" icon="play">Start</HMIBigBtn>
              </div>
            </div>
          </button>
        ))}
      </div>
    </HMIShell>
  );
};

const HMIBOMCheck = ({ setStep }) => (
  <HMIShell title="BOM & Material Check" sub="WO-2026-0142 · Brake Caliper Assembly · Piece #169 of 240"
    badge={{ l: 'Cycle target', v: '08:30' }}
    footer={<><HMIBigBtn icon="arrowL" onClick={() => setStep('workorders')}>Back</HMIBigBtn><div className="flex-1"/><HMIBigBtn variant="primary" big icon="check" onClick={() => setStep('work')}>All confirmed → Start cycle</HMIBigBtn></>}>
    <div className="space-y-3">
      <div className="hairline rounded-lg bg-amber-50 border-amber-300 p-3 flex items-center gap-3">
        <Icon name="info" size={16} className="text-amber-700" />
        <div className="text-[13px] text-amber-900">Scan each component's lot label. The system verifies lot validity, quality status, and quantity.</div>
      </div>
      <div className="space-y-2">
        {[
          { c: 'ITM-SL-00118', n: 'Caliper Body', q: 1, lot: 'LOT-260420-014', ok: true },
          { c: 'ITM-CMP-00211', n: 'Piston Seal NBR', q: 2, lot: 'LOT-260418-007', ok: true },
          { c: 'ITM-CMP-00284', n: 'Brake Piston', q: 2, lot: 'LOT-260415-022', ok: true },
          { c: 'ITM-CMP-00177', n: 'Bleeder Screw M10', q: 1, lot: 'LOT-260412-103', ok: true },
          { c: 'ITM-CSM-00012', n: 'Brake Fluid DOT-4', q: 0.05, lot: null, ok: false },
        ].map(m => (
          <div key={m.c} className={cx('hairline rounded-lg p-3 flex items-center gap-3', m.ok ? 'bg-white border-emerald-300' : 'bg-amber-50 border-amber-400')}>
            <div className={cx('w-10 h-10 rounded-lg flex items-center justify-center text-[18px] font-bold', m.ok ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black')}>
              {m.ok ? '✓' : '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[14px]">{m.n}</span>
                <span className="mono text-[11px] text-zinc-500">{m.c}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-zinc-200 mono text-[11px]">×{m.q}</span>
              </div>
              <div className="text-[12px] text-zinc-600 mt-0.5">{m.ok ? <>Lot <span className="mono">{m.lot}</span> · Approved · 240 pc available</> : 'Awaiting lot scan…'}</div>
            </div>
            {!m.ok && <HMIBigBtn icon="qr">Scan lot</HMIBigBtn>}
          </div>
        ))}
      </div>
    </div>
  </HMIShell>
);

const HMIWorkScreen = ({ setStep }) => {
  const [running, setRunning] = useState5(true);
  return (
    <HMIShell title="Step 6 of 12 · Install pistons" sub="WO-2026-0142 · Piece #169 · Production phase"
      status={{ t: 'accent', l: 'Group 2/5: Assembly' }}
      footer={<>
        <HMIBigBtn icon="alert" variant="danger" onClick={() => setStep('recovery')}>Mark NOK</HMIBigBtn>
        <HMIBigBtn icon="parallel" onClick={() => setStep('parallel')}>Pause for parallel</HMIBigBtn>
        <div className="flex-1" />
        <HMIBigBtn variant="success" big icon="check" onClick={() => setStep('parallel')}>Confirm OK · Next →</HMIBigBtn>
      </>}>
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="space-y-3">
          <div className="hairline rounded-lg bg-white overflow-hidden">
            <div className="aspect-[16/9] bg-zinc-200 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-zinc-300 flex items-center justify-center mb-2"><Icon name="image" size={28} /></div>
                <div className="text-[11px] uppercase tracking-wider">Work instruction · 3D animated</div>
                <div className="text-[10px] mono mt-1">3D-CALR-002.glb · 12s loop</div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-[15px] font-bold mb-2">Install pistons #1 and #2</div>
              <ol className="space-y-1.5 text-[13px]">
                <li className="flex gap-2"><span className="mono text-zinc-500">1.</span> Apply silicone grease (DOT-4 compatible) to piston seals.</li>
                <li className="flex gap-2"><span className="mono text-zinc-500">2.</span> Insert piston into bore, smooth side first.</li>
                <li className="flex gap-2"><span className="mono text-zinc-500">3.</span> Press until flush ±0.2 mm from caliper face.</li>
                <li className="flex gap-2"><span className="mono text-zinc-500">4.</span> Verify free rotation by hand. No catches.</li>
              </ol>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="hairline rounded-lg bg-zinc-900 text-zinc-100 p-4">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Step timer</div>
            <div className="text-[42px] font-bold mono tabular leading-none mt-1 text-amber-400">02:14</div>
            <div className="text-[11px] mono text-zinc-400 mt-1">/ 04:00 standard · 06:00 max</div>
            <div className="mt-3 h-2 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: '36%' }} /></div>
          </div>
          <div className="hairline rounded-lg bg-white p-3">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Multi-level timers</div>
            <div className="space-y-2 text-[12px]">
              {[['Cycle (piece)','03:42','08:30','accent'],['Phase: Production','22:14','01:30:00','info'],['Work order','28h 14m','32h','ok']].map(([l,a,p,t]) => (
                <div key={l}>
                  <div className="flex items-center justify-between"><span className="text-zinc-600">{l}</span><span className="mono tabular font-semibold" style={{color:`var(--${t})`}}>{a}</span></div>
                  <div className="text-[10.5px] mono text-zinc-400">/ {p}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hairline rounded-lg bg-white p-3">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Required tools</div>
            <div className="space-y-1 text-[12px]">
              <div className="flex items-center gap-2"><span className="dot" style={{background:'var(--ok)'}}/>Torque wrench TW-014</div>
              <div className="flex items-center gap-2"><span className="dot" style={{background:'var(--ok)'}}/>Piston press jig PJ-002</div>
              <div className="flex items-center gap-2"><span className="dot" style={{background:'var(--ok)'}}/>Silicone grease G-DOT4</div>
            </div>
          </div>
        </div>
      </div>
    </HMIShell>
  );
};

const HMIParallel = ({ setStep }) => (
  <HMIShell title="Parallel work — Pressure verification" sub="WO-2026-0142 · Piece #169 · Step 9 of 12"
    badge={{ l: 'Active parts', v: '2 / 2' }}
    footer={<><HMIBigBtn icon="arrowL" onClick={() => setStep('work')}>Back</HMIBigBtn><div className="flex-1"/><HMIBigBtn variant="success" big icon="check" onClick={() => setStep('pack')}>Both verified · Continue →</HMIBigBtn></>}>
    <div className="space-y-4">
      <div className="hairline rounded-lg bg-blue-50 border-blue-300 p-3 flex items-start gap-3">
        <Icon name="parallel" size={18} className="text-blue-700 mt-0.5" />
        <div className="text-[13px] text-blue-900">
          <strong>Parallel step.</strong> Verify pressure on each piston independently. You can pause one part and run the other, then resume by scanning the part QR.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'A', label: 'Piston #1', sn: 'PSN-2026-A-00337', state: 'running', pressure: '3.42', target: '3.50', t: 'accent', elapsed: '11s' },
          { id: 'B', label: 'Piston #2', sn: 'PSN-2026-A-00338', state: 'paused', pressure: '—', target: '3.50', t: 'warn', elapsed: '06s (paused)' },
        ].map(p => (
          <div key={p.id} className={cx('hairline rounded-lg bg-white overflow-hidden', p.state === 'running' && 'ring-2 ring-amber-400')}>
            <div className="px-4 py-2.5 bg-zinc-900 text-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-amber-500 text-black flex items-center justify-center font-bold">{p.id}</span>
                <span className="font-bold">{p.label}</span>
              </div>
              <Badge tone={p.state === 'running' ? 'ok' : 'warn'} dot>{p.state.toUpperCase()}</Badge>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-[10.5px] mono text-zinc-500">{p.sn}</div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Pressure (bar)</div>
                <div className="text-[36px] font-bold mono tabular" style={{ color: p.state === 'running' ? 'var(--accent)' : 'var(--ink-3)' }}>{p.pressure}</div>
                <div className="text-[11px] mono text-zinc-500">target {p.target} ± 0.10</div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1"><span className="text-zinc-500">Progress</span><span className="mono">{p.elapsed}</span></div>
                <Progress value={p.state === 'running' ? 65 : 30} max={100} tone={p.t} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {p.state === 'running' ? (
                  <><HMIBigBtn icon="pause">Pause</HMIBigBtn><HMIBigBtn variant="success" icon="check">Done</HMIBigBtn></>
                ) : (
                  <><HMIBigBtn variant="primary" icon="qr" className="col-span-2">Resume · Scan part QR</HMIBigBtn></>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </HMIShell>
);

const HMIRecovery = ({ setStep }) => (
  <HMIShell title="NOK detected — Recovery flow" sub="WO-2026-0142 · Piece #167 · Leak Test"
    status={{ t: 'bad', l: 'Recovery active' }}
    footer={<><HMIBigBtn icon="arrowL" onClick={() => setStep('work')}>Back</HMIBigBtn><div className="flex-1"/><HMIBigBtn icon="x" variant="danger">Mark Scrap</HMIBigBtn><HMIBigBtn variant="primary" big icon="redo" onClick={() => setStep('work')}>Start rework flow</HMIBigBtn></>}>
    <div className="space-y-3">
      <div className="hairline rounded-lg bg-red-50 border-red-400 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-[20px] font-bold flex-shrink-0">!</div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-red-900">Leak test failed</div>
            <div className="text-[12.5px] text-red-800 mt-1">Pressure drop Δ = 0.6 mbar (limit 0.3 mbar) over 15s hold @ 3.5 bar</div>
            <div className="mt-2 grid grid-cols-3 gap-3 text-[11.5px]">
              <div><div className="text-red-700">Serial</div><div className="mono font-semibold">SN-2026-000167</div></div>
              <div><div className="text-red-700">Device</div><div className="mono font-semibold">DEV-LEAK-01</div></div>
              <div><div className="text-red-700">Recipe</div><div className="mono font-semibold">RCP-LEAK-001 v3</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="hairline rounded-lg bg-white p-4">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Likely causes (knowledge base)</div>
          <div className="space-y-1.5">
            {[
              { c: 'Piston seal mis-seated', p: 62, ic: '🔧' },
              { c: 'Bleeder screw loose', p: 24, ic: '🔩' },
              { c: 'Body porosity (rare)', p: 11, ic: '🛑' },
              { c: 'Test fixture drift', p: 3, ic: '⚙' },
            ].map((c, i) => (
              <div key={i} className="hairline rounded p-2 bg-zinc-50 flex items-center gap-2">
                <span className="text-[18px]">{c.ic}</span>
                <span className="flex-1 text-[12.5px]">{c.c}</span>
                <span className="mono text-[11px] tabular text-zinc-500">{c.p}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hairline rounded-lg bg-white p-4">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Recovery options</div>
          <div className="space-y-2">
            <button className="w-full hairline rounded p-3 bg-white hover:border-amber-500 text-left">
              <div className="flex items-center gap-2 mb-1"><Icon name="redo" size={14} className="text-amber-600" /><span className="font-bold text-[13px]">Rework — Re-seat seals</span><Badge tone="info" className="ml-auto">≈4 min</Badge></div>
              <div className="text-[11.5px] text-zinc-600">Disassemble pistons, inspect & re-grease seals, reassemble, re-test.</div>
            </button>
            <button className="w-full hairline rounded p-3 bg-white hover:border-amber-500 text-left">
              <div className="flex items-center gap-2 mb-1"><Icon name="tool" size={14} className="text-amber-600" /><span className="font-bold text-[13px]">Rework — Tighten bleeder</span><Badge tone="info" className="ml-auto">≈1 min</Badge></div>
              <div className="text-[11.5px] text-zinc-600">Re-torque to 25 N·m and re-test only.</div>
            </button>
            <button className="w-full hairline rounded p-3 bg-white hover:border-amber-500 text-left">
              <div className="flex items-center gap-2 mb-1"><Icon name="alert" size={14} className="text-red-600" /><span className="font-bold text-[13px]">Scrap — Body suspected</span></div>
              <div className="text-[11.5px] text-zinc-600">Open NCR, isolate piece, escalate to Quality.</div>
            </button>
          </div>
        </div>
      </div>
      <div className="hairline rounded-lg bg-white p-3">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Required notes (mandatory)</div>
        <textarea rows={2} className="w-full hairline rounded p-2 text-[13px]" placeholder="Describe observation, suspected cause, action taken (min 20 chars)…" />
      </div>
    </div>
  </HMIShell>
);

const HMIPacking = ({ setStep }) => (
  <HMIShell title="Pack-out · Logistics phase" sub="WO-2026-0142 · BOX-PLT-001236"
    status={{ t: 'accent', l: 'AUTO-GEN phase' }}
    badge={{ l: 'Box fill', v: '47/48' }}
    footer={<><HMIBigBtn icon="arrowL" onClick={() => setStep('parallel')}>Back</HMIBigBtn><div className="flex-1"/><HMIBigBtn variant="primary" big icon="lock" onClick={() => setStep('workorders')}>Add last unit & seal box</HMIBigBtn></>}>
    <div className="grid grid-cols-[1fr_360px] gap-4">
      <div className="hairline rounded-lg bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="mono text-[12px] text-zinc-500">BOX-PLT-001236</div>
            <div className="text-[16px] font-bold">Returnable carton CBX-014</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="accent" dot>Filling</Badge>
            <span className="mono text-[11px] text-zinc-500">cycle #187</span>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 48 }).map((_, i) => {
            const filled = i < 47;
            return (
              <div key={i} className={cx('aspect-square rounded flex items-center justify-center mono text-[10px]',
                filled ? 'bg-emerald-600 text-white' : 'border-2 border-dashed border-zinc-300 text-zinc-400')}>
                {filled ? (i + 1) : ''}
              </div>
            );
          })}
        </div>
        <div className="mt-3 hairline-t pt-3 grid grid-cols-3 gap-3 text-[12px]">
          <div><div className="text-zinc-500">Capacity</div><div className="font-bold mono">48 pc</div></div>
          <div><div className="text-zinc-500">Tare</div><div className="font-bold mono">3.2 kg</div></div>
          <div><div className="text-zinc-500">Gross (current)</div><div className="font-bold mono">87.6 kg</div></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="hairline rounded-lg bg-zinc-900 text-zinc-100 p-4 text-center">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">Next action</div>
          <Icon name="qr" size={56} className="mx-auto my-3" />
          <div className="text-[15px] font-bold">Scan unit serial #48</div>
          <div className="text-[11px] mono text-zinc-400 mt-1">SN-2026-000xxx</div>
        </div>
        <div className="hairline rounded-lg bg-white p-3">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Last 5 added</div>
          <div className="space-y-1 text-[11.5px] mono">
            {['SN-2026-000165','SN-2026-000164','SN-2026-000163','SN-2026-000162','SN-2026-000161'].map((s,i) => (
              <div key={s} className="flex justify-between"><span>{s}</span><span className="text-zinc-500">14:0{8-i}</span></div>
            ))}
          </div>
        </div>
        <div className="hairline rounded-lg bg-amber-50 border-amber-300 p-3 text-[12px] text-amber-900 flex items-start gap-2">
          <Icon name="info" size={14} className="mt-0.5"/><div>On 48/48: box auto-seals · seal SEAL-2026-XXXXX generated · label printed.</div>
        </div>
      </div>
    </div>
  </HMIShell>
);

// ============================================================
// ANDON
// ============================================================
window.ScreenAndon = function ScreenAndon() {
  return (
    <div className="h-full bg-black text-zinc-100 overflow-auto">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Site Milano · Brake Assembly</div>
          <div className="text-[28px] font-bold tracking-tight">ANDON · LIVE</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Shift A · 06:00–14:00</div>
          <div className="text-[36px] font-bold mono tabular text-amber-400 leading-none mt-1">14:23:08</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 p-6">
        {[
          { l: 'OEE', v: '78.4', u: '%', t: 'amber-400', sub: 'target 82%' },
          { l: 'Throughput', v: '142', u: 'pc/h', t: 'emerald-400', sub: 'plan 156' },
          { l: 'FPY', v: '97.8', u: '%', t: 'emerald-400', sub: '24h' },
          { l: 'Open issues', v: '3', u: '', t: 'red-400', sub: '1 critical' },
        ].map(k => (
          <div key={k.l} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
            <div className="text-[12px] uppercase tracking-wider text-zinc-500">{k.l}</div>
            <div className={cx('text-[60px] font-bold mono tabular leading-none mt-2', `text-${k.t}`)}>{k.v}<span className="text-[24px] text-zinc-500 ml-1">{k.u}</span></div>
            <div className="text-[12px] text-zinc-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 pb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-800 text-[14px] font-bold uppercase tracking-wider">Workstations</div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { ws: 'WS-A2-01', op: 'M. Conti', wo: 'WO-2026-0142', s: 'running', tone: 'emerald' },
              { ws: 'WS-A2-02', op: 'A. Rossi', wo: 'WO-2026-0144', s: 'running', tone: 'emerald' },
              { ws: 'WS-A2-03', op: 'G. Verdi', wo: 'WO-2026-0141', s: 'on_hold', tone: 'amber', det: 'Material shortage' },
              { ws: 'WS-A2-04', op: '—', wo: '—', s: 'idle', tone: 'zinc' },
              { ws: 'WS-B1-01', op: 'L. Bianchi', wo: 'WO-2026-0148', s: 'running', tone: 'emerald' },
              { ws: 'WS-B1-02', op: 'S. Marini', wo: 'WO-2026-0151', s: 'running', tone: 'emerald' },
              { ws: 'WS-B1-03', op: 'F. Russo', wo: 'WO-2026-0143', s: 'fault', tone: 'red', det: 'Device DEV-LEAK-02 fault' },
              { ws: 'WS-B1-04', op: '—', wo: '—', s: 'idle', tone: 'zinc' },
            ].map(w => (
              <div key={w.ws} className={cx('rounded p-3 border', `border-${w.tone}-500/40 bg-${w.tone}-500/10`)}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold mono text-[14px]">{w.ws}</span>
                  <span className={cx('w-2.5 h-2.5 rounded-full animate-pulse', w.s === 'fault' ? 'bg-red-500' : w.s === 'on_hold' ? 'bg-amber-500' : w.s === 'idle' ? 'bg-zinc-500' : 'bg-emerald-500')} />
                </div>
                <div className="text-[12px]">{w.op}</div>
                <div className="text-[11px] mono text-zinc-400">{w.wo}</div>
                {w.det && <div className="text-[11px] text-amber-400 mt-1">{w.det}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-800 text-[14px] font-bold uppercase tracking-wider">Active Issues</div>
          <div className="p-4 space-y-2">
            {[
              { sev: 'critical', t: 'WS-B1-03 · Device fault', d: 'DEV-LEAK-02 connection lost — 8m 14s', col: 'red' },
              { sev: 'warning', t: 'WS-A2-03 · Material shortage', d: 'ITM-MP-00903 below safety stock', col: 'amber' },
              { sev: 'info', t: 'WO-2026-0142 · Recovery success', d: 'Piece #167 reworked OK', col: 'blue' },
            ].map((x, i) => (
              <div key={i} className={cx('rounded p-3 border-l-4', `border-${x.col}-500 bg-${x.col}-500/10`)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cx('text-[10px] uppercase font-bold tracking-wider', `text-${x.col}-400`)}>{x.sev}</span>
                  <span className="font-bold text-[13px]">{x.t}</span>
                </div>
                <div className="text-[12px] text-zinc-400">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
