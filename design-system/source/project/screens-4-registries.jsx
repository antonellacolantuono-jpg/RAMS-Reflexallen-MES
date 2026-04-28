/* global React, MESData */
const { useState: useState4 } = React;

// ============================================================
// REGISTRIES — Items, Equipment, Skills, Boxes
// ============================================================
window.ScreenItems = function ScreenItems({ go }) {
  const [search, setSearch] = useState4('');
  const [type, setType] = useState4('all');
  const items = MESData.items.filter(i => {
    if (type !== 'all' && i.type !== type) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Items" subtitle="Master data · all SKUs"
        actions={<><Btn icon="download">Export</Btn><Btn icon="upload">Import</Btn><Btn variant="primary" icon="plus">New Item</Btn></>} />
      <div className="px-5 hairline-b">
        <Tabs value={type} onChange={setType} tabs={[
          { id: 'all', label: 'All', count: MESData.items.length },
          { id: 'finished_good', label: 'Finished goods', count: MESData.items.filter(i => i.type === 'finished_good').length },
          { id: 'semi_finished', label: 'Semi-finished', count: MESData.items.filter(i => i.type === 'semi_finished').length },
          { id: 'component', label: 'Components', count: MESData.items.filter(i => i.type === 'component').length },
          { id: 'consumable', label: 'Consumables', count: MESData.items.filter(i => i.type === 'consumable').length },
          { id: 'spare_part', label: 'Spare parts', count: MESData.items.filter(i => i.type === 'spare_part').length },
        ]} />
      </div>
      <div className="px-5 py-3 hairline-b flex items-center gap-2">
        <div className="relative flex-1 max-w-[320px]">
          <Icon name="search" size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <Input className="w-full pl-7" placeholder="Search code or name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Btn icon="filter" size="sm">Filters</Btn>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
            <th className="text-left px-4 py-2">Code</th>
            <th className="text-left px-2 py-2">Name</th>
            <th className="text-left px-2 py-2">Type</th>
            <th className="text-left px-2 py-2">UoM</th>
            <th className="text-left px-2 py-2">BOM</th>
            <th className="text-left px-2 py-2">Workflow</th>
            <th className="text-right px-2 py-2">On-hand</th>
            <th className="text-left px-2 py-2">Status</th>
            <th className="w-8"></th>
          </tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="hairline-b hover:bg-[var(--paper-2)] cursor-pointer" onClick={() => go('item-detail', i.id)}>
                <td className="px-4 py-2 mono text-[12px] font-medium">{i.code}</td>
                <td className="px-2 py-2">{i.name}</td>
                <td className="px-2 py-2 text-[var(--ink-2)] capitalize">{i.type.replace('_', ' ')}</td>
                <td className="px-2 py-2 mono text-[11px]">{i.uom}</td>
                <td className="px-2 py-2 mono text-[11px]">{i.bom || '—'}</td>
                <td className="px-2 py-2 mono text-[11px]">{i.workflow || '—'}</td>
                <td className="px-2 py-2 mono tabular text-right">{i.onHand}</td>
                <td className="px-2 py-2"><StatusBadge status={i.status} /></td>
                <td className="px-2 py-2 text-[var(--ink-3)]"><Icon name="chevronR" size={14} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.ScreenItemDetail = function ScreenItemDetail({ go, params }) {
  const item = MESData.items.find(i => i.id === params) || MESData.items[0];
  const [tab, setTab] = useState4('overview');
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumb={<><a className="hover:text-[var(--ink)]" onClick={() => go('items')}>Items</a> <span className="mx-1">/</span> {item.code}</>}
        title={<span className="flex items-center gap-2">{item.code} <StatusBadge status={item.status} /></span>}
        subtitle={`${item.name} · ${item.type.replace('_',' ')} · UoM ${item.uom}`}
        actions={<><Btn icon="copy">Duplicate</Btn><Btn variant="primary" icon="edit">Edit</Btn></>}
      />
      <div className="px-5 hairline-b">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'bom', label: 'BOM', count: 6 },
          { id: 'workflow', label: 'Workflow' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'genealogy', label: 'Genealogy' },
        ]} />
      </div>
      <div className="flex-1 overflow-auto p-5">
        {tab === 'overview' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-3">
              <Card>
                <div className="uppercase-label mb-2">Identification</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
                  <Row k="Code" v={item.code} mono />
                  <Row k="Name" v={item.name} />
                  <Row k="Type" v={item.type.replace('_',' ')} />
                  <Row k="UoM" v={item.uom} mono />
                  <Row k="Customer ref" v="ALPHA-AUTO-CALR-FR" />
                  <Row k="Drawing rev" v="C.04" mono />
                  <Row k="Hazard class" v="—" />
                  <Row k="Tracking" v="Serial-tracked" />
                </div>
              </Card>
              <Card padded={false}>
                <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Variants</div>
                <table className="w-full text-[12px]">
                  <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
                    <th className="text-left px-3 py-1.5">Code</th>
                    <th className="text-left px-2 py-1.5">Name</th>
                    <th className="text-left px-2 py-1.5">BOM</th>
                    <th className="text-left px-2 py-1.5">Workflow</th>
                    <th className="text-right px-2 py-1.5">On-hand</th>
                  </tr></thead>
                  <tbody>
                    {[{c:'ITM-FG-00042-LH',n:'Brake Caliper LH',q:128},{c:'ITM-FG-00042-RH',n:'Brake Caliper RH',q:142},{c:'ITM-FG-00042-HD',n:'Brake Caliper HD',q:32}].map(v => (
                      <tr key={v.c} className="hairline-b">
                        <td className="px-3 py-1.5 mono text-[11px]">{v.c}</td>
                        <td className="px-2 py-1.5">{v.n}</td>
                        <td className="px-2 py-1.5 mono text-[11px]">BOM-CALR-001</td>
                        <td className="px-2 py-1.5 mono text-[11px]">WF-0042</td>
                        <td className="px-2 py-1.5 mono text-right">{v.q}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
            <div className="space-y-3">
              <Card>
                <div className="uppercase-label mb-2">Inventory snapshot</div>
                <div className="space-y-2">
                  {[{l:'On-hand',v:item.onHand,t:'ok'},{l:'Reserved',v:240,t:'info'},{l:'Available',v:item.onHand-240,t:'ok'},{l:'Safety stock',v:50,t:'neutral'}].map(x => (
                    <div key={x.l} className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--ink-3)]">{x.l}</span>
                      <span className="mono tabular font-semibold">{x.v}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <div className="uppercase-label mb-2">Quality</div>
                <div className="space-y-1.5 text-[12px]">
                  <Row k="FPY (30d)" v="98.2%" />
                  <Row k="Scrap rate" v="1.4%" />
                  <Row k="NCR open" v="0" />
                </div>
              </Card>
            </div>
          </div>
        )}
        {tab === 'bom' && <BOMTab />}
        {tab === 'workflow' && <div className="text-[12px] text-[var(--ink-3)]">Linked workflow: <a className="text-[var(--accent)] hover:underline" onClick={() => go('workflow-editor')}>WF-0042 Brake Caliper Assembly v3 →</a></div>}
        {tab === 'inventory' && <InventoryTab />}
        {tab === 'genealogy' && <div className="text-[12px] text-[var(--ink-3)]">Last 30 days: 2,847 serials produced across 14 work orders.</div>}
      </div>
    </div>
  );
};

const BOMTab = () => (
  <Card padded={false}>
    <div className="hairline-b px-3 h-9 flex items-center justify-between">
      <div className="font-semibold text-[12.5px]">BOM-CALR-001 · v2.1 (active)</div>
      <div className="flex items-center gap-2">
        <Select className="text-[12px]"><option>v2.1 (active)</option><option>v2.0</option><option>v1.5</option></Select>
        <Btn icon="diff" size="sm">Compare</Btn>
        <Btn icon="edit" variant="primary" size="sm">Edit</Btn>
      </div>
    </div>
    <table className="w-full text-[12.5px]">
      <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
        <th className="text-left px-3 py-2">L</th>
        <th className="text-left px-2 py-2">Component</th>
        <th className="text-left px-2 py-2">Code</th>
        <th className="text-right px-2 py-2">Qty</th>
        <th className="text-left px-2 py-2">UoM</th>
        <th className="text-left px-2 py-2">Step ref</th>
        <th className="text-left px-2 py-2">Substitute</th>
      </tr></thead>
      <tbody>
        {[
          { l: 1, n: 'Caliper Body', c: 'ITM-SL-00118', q: 1, u: 'pc', s: 'STP-002', sub: '—' },
          { l: 1, n: 'Piston Seal NBR', c: 'ITM-CMP-00211', q: 2, u: 'pc', s: 'STP-005', sub: 'ITM-CMP-00212 (FKM)' },
          { l: 1, n: 'Brake Piston', c: 'ITM-CMP-00284', q: 2, u: 'pc', s: 'STP-006', sub: '—' },
          { l: 1, n: 'Bleeder Screw M10', c: 'ITM-CMP-00177', q: 1, u: 'pc', s: 'STP-008', sub: 'ITM-CMP-00178 (M8)' },
          { l: 1, n: 'Brake Fluid DOT-4', c: 'ITM-CSM-00012', q: 0.05, u: 'L', s: 'STP-011', sub: '—' },
          { l: 1, n: 'Lockwasher Pack', c: 'ITM-CMP-00098', q: 1, u: 'pc', s: 'STP-008', sub: '—' },
        ].map((r, i) => (
          <tr key={i} className="hairline-b">
            <td className="px-3 py-2 mono text-[11px] text-[var(--ink-3)]">L{r.l}</td>
            <td className="px-2 py-2 font-medium">{r.n}</td>
            <td className="px-2 py-2 mono text-[11px]">{r.c}</td>
            <td className="px-2 py-2 mono tabular text-right">{r.q}</td>
            <td className="px-2 py-2 mono text-[11px]">{r.u}</td>
            <td className="px-2 py-2 mono text-[11px]">{r.s}</td>
            <td className="px-2 py-2 text-[11px] text-[var(--ink-3)]">{r.sub}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

const InventoryTab = () => (
  <Card padded={false}>
    <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Lots & locations</div>
    <table className="w-full text-[12.5px]">
      <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
        <th className="text-left px-3 py-2">Lot</th>
        <th className="text-left px-2 py-2">Location</th>
        <th className="text-right px-2 py-2">Qty</th>
        <th className="text-left px-2 py-2">Quality</th>
        <th className="text-left px-2 py-2">Received</th>
        <th className="text-left px-2 py-2">Expires</th>
      </tr></thead>
      <tbody>
        {[
          { lot: 'LOT-260420-014', loc: 'WH-MAIN/A12', q: 240, qa: 'approved', r: '2026-04-20', e: '2027-04-20' },
          { lot: 'LOT-260418-007', loc: 'WH-MAIN/B04', q: 480, qa: 'approved', r: '2026-04-18', e: '2027-04-18' },
          { lot: 'LOT-260415-022', loc: 'WH-MAIN/B07', q: 480, qa: 'approved', r: '2026-04-15', e: '2027-04-15' },
          { lot: 'LOT-260410-001', loc: 'WH-CHEM/C2', q: 15, qa: 'quarantine', r: '2026-04-10', e: '2026-10-10' },
        ].map(l => (
          <tr key={l.lot} className="hairline-b">
            <td className="px-3 py-2 mono text-[11.5px]">{l.lot}</td>
            <td className="px-2 py-2 mono text-[11.5px]">{l.loc}</td>
            <td className="px-2 py-2 mono tabular text-right">{l.q}</td>
            <td className="px-2 py-2"><StatusBadge status={l.qa} /></td>
            <td className="px-2 py-2 mono text-[11px]">{l.r}</td>
            <td className="px-2 py-2 mono text-[11px]">{l.e}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

// ============================================================
// EQUIPMENT (ISA-95 hierarchy)
// ============================================================
window.ScreenEquipment = function ScreenEquipment({ go }) {
  const [selected, setSelected] = useState4('site-milano');
  const eq = MESData.equipment;
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Equipment" subtitle="ISA-95 hierarchy · Site Milano"
        actions={<><Btn icon="qr">Print labels</Btn><Btn variant="primary" icon="plus">New equipment</Btn></>} />
      <div className="flex-1 grid grid-cols-[300px_1fr] min-h-0">
        <div className="hairline-r overflow-auto bg-[var(--paper-2)] p-2">
          <EqTreeNode node={eq} selected={selected} onSelect={setSelected} depth={0} />
        </div>
        <div className="overflow-auto p-5">
          <EqDetail id={selected} />
        </div>
      </div>
    </div>
  );
};

const EqTreeNode = ({ node, selected, onSelect, depth }) => {
  const [open, setOpen] = useState4(depth < 3);
  const has = node.children && node.children.length > 0;
  const ic = ({ enterprise: 'building', site: 'factory', area: 'grid', work_center: 'cog', work_unit: 'tool', equipment: 'cube' })[node.kind] || 'cube';
  return (
    <div>
      <div onClick={() => onSelect(node.id)}
        className={cx('flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-[12px]', selected === node.id ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'hover:bg-[var(--paper)]')}
        style={{ paddingLeft: 8 + depth * 14 }}>
        {has ? (
          <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="w-3 h-3 flex items-center justify-center flex-shrink-0">
            <Icon name={open ? 'chevronD' : 'chevronR'} size={10} />
          </button>
        ) : <span className="w-3 flex-shrink-0" />}
        <Icon name={ic} size={11} className="flex-shrink-0 text-[var(--ink-3)]" />
        <span className="flex-1 truncate">{node.name}</span>
        {node.status && <span className="dot" style={{background: `var(--${{available:'ok',in_use:'warn',maintenance:'warn',broken:'bad',offline:'neutral'}[node.status]||'neutral'})`}} />}
        <span className="mono text-[10px] text-[var(--ink-3)]">{node.code}</span>
      </div>
      {has && open && node.children.map(c => <EqTreeNode key={c.id} node={c} selected={selected} onSelect={onSelect} depth={depth + 1} />)}
    </div>
  );
};

const findEq = (node, id) => {
  if (node.id === id) return node;
  for (const c of node.children || []) {
    const r = findEq(c, id);
    if (r) return r;
  }
};

const EqDetail = ({ id }) => {
  const node = findEq(MESData.equipment, id);
  if (!node) return null;
  return (
    <div className="space-y-3">
      <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] text-[var(--ink-3)] mono">{node.code} · {node.kind.replace('_',' ')}</div>
            <h2 className="text-[18px] font-semibold mt-0.5">{node.name}</h2>
            {node.status && <div className="mt-2"><StatusBadge status={node.status} /></div>}
          </div>
          <div className="flex gap-1.5">
            <Btn icon="qr" size="sm">Print label</Btn>
            <Btn icon="edit" size="sm">Edit</Btn>
          </div>
        </div>
      </div>
      {node.kind === 'work_center' && (
        <div className="grid grid-cols-4 gap-3">
          <KPI label="OEE today" value="78" unit="%" tone="warn" />
          <KPI label="Utilization" value="84" unit="%" tone="ok" />
          <KPI label="Active WOs" value="2" />
          <KPI label="Operators" value="3" sub="of 4 stations" />
        </div>
      )}
      {node.kind === 'equipment' && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="uppercase-label mb-2">Specification</div>
            <div className="space-y-1.5 text-[12px]">
              <Row k="Manufacturer" v="Marposs" />
              <Row k="Model" v="Maris ML-300" />
              <Row k="Serial" v="MAR-2024-08812" mono />
              <Row k="Installed" v="2024-09-14" mono />
              <Row k="Last calibration" v="2026-03-22" mono />
            </div>
          </Card>
          <Card>
            <div className="uppercase-label mb-2">Capabilities</div>
            <div className="flex flex-wrap gap-1">
              {['leak_test','pressure_test','recipe_RCP-LEAK','OPC-UA'].map(c => <Badge key={c} tone="info">{c}</Badge>)}
            </div>
            <div className="uppercase-label mt-3 mb-1.5">Connection</div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="dot" style={{background:'var(--ok)'}}/><span>OPC-UA · opc.tcp://10.42.1.118:4840</span>
            </div>
          </Card>
          <Card padded={false} className="col-span-2">
            <div className="hairline-b px-3 h-9 flex items-center justify-between font-semibold text-[12.5px]">
              <span>Loaded recipes</span>
              <Btn variant="ghost" icon="plus" size="sm">Push recipe</Btn>
            </div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="hairline-b text-[var(--ink-3)] uppercase-label">
                <th className="text-left px-3 py-2">Recipe</th><th className="text-left px-2 py-2">Version</th><th className="text-left px-2 py-2">Loaded</th><th className="text-left px-2 py-2">Status</th>
              </tr></thead>
              <tbody>
                {[{c:'RCP-LEAK-001',n:'Caliper standard',v:'v3',l:'2026-04-25 18:42',s:'active'},
                  {c:'RCP-LEAK-002',n:'Caliper HD',v:'v1',l:'2026-04-12 09:15',s:'cached'}].map(r => (
                  <tr key={r.c} className="hairline-b">
                    <td className="px-3 py-2"><div className="mono text-[11.5px] font-medium">{r.c}</div><div className="text-[11px] text-[var(--ink-3)]">{r.n}</div></td>
                    <td className="px-2 py-2 mono">{r.v}</td>
                    <td className="px-2 py-2 mono text-[11px]">{r.l}</td>
                    <td className="px-2 py-2"><Badge tone={r.s === 'active' ? 'ok' : 'neutral'}>{r.s}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SKILLS
// ============================================================
window.ScreenSkills = function ScreenSkills() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Skills & Certifications" subtitle="Operator qualifications · 18 active operators"
        actions={<><Btn icon="download">Export matrix</Btn><Btn variant="primary" icon="plus">New skill</Btn></>} />
      <div className="flex-1 overflow-auto p-5">
        <Card padded={false}>
          <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Skill matrix</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[800px]">
              <thead>
                <tr className="hairline-b text-[var(--ink-3)] uppercase-label">
                  <th className="text-left px-3 py-2 sticky left-0 bg-[var(--paper)]">Operator</th>
                  {MESData.skills.map(s => <th key={s.code} className="px-2 py-2 text-center">{s.code.replace('SKL-','')}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { n: 'M. Conti', id: 'OP-0142', sk: { ASSY: 'cert', LEAK: 'cert', PRESS: 'cert', QA: 'training', PACK: 'cert' } },
                  { n: 'A. Rossi', id: 'OP-0118', sk: { ASSY: 'cert', LEAK: 'cert', PRESS: 'cert', QA: 'cert', PACK: 'cert' } },
                  { n: 'G. Verdi', id: 'OP-0203', sk: { ASSY: 'cert', LEAK: 'training', PRESS: 'cert', QA: 'none', PACK: 'cert' } },
                  { n: 'L. Bianchi', id: 'OP-0091', sk: { ASSY: 'cert', LEAK: 'expired', PRESS: 'cert', QA: 'cert', PACK: 'cert' } },
                  { n: 'F. Russo', id: 'OP-0177', sk: { ASSY: 'training', LEAK: 'none', PRESS: 'training', QA: 'none', PACK: 'cert' } },
                  { n: 'S. Marini', id: 'OP-0211', sk: { ASSY: 'cert', LEAK: 'cert', PRESS: 'cert', QA: 'cert', PACK: 'cert' } },
                ].map(o => (
                  <tr key={o.id} className="hairline-b">
                    <td className="px-3 py-2 sticky left-0 bg-[var(--paper)]">
                      <div className="font-medium">{o.n}</div>
                      <div className="mono text-[10.5px] text-[var(--ink-3)]">{o.id}</div>
                    </td>
                    {MESData.skills.map(s => {
                      const k = s.code.replace('SKL-', '');
                      const v = o.sk[k] || 'none';
                      const ic = { cert: '✓', training: '◐', expired: '⚠', none: '·' }[v];
                      const t = { cert: 'ok', training: 'info', expired: 'bad', none: 'neutral' }[v];
                      return (
                        <td key={s.code} className="px-2 py-2 text-center">
                          <span className={cx('inline-flex w-6 h-6 rounded items-center justify-center mono text-[12px] font-bold',
                            t === 'ok' ? 'bg-[var(--ok-soft)] text-[var(--ok)]' :
                            t === 'info' ? 'bg-[var(--info-soft)] text-[var(--info-ink)]' :
                            t === 'bad' ? 'bg-[var(--bad-soft)] text-[var(--bad)]' :
                            'text-[var(--ink-3)]')}>{ic}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hairline-t p-3 flex items-center gap-3 text-[11px] text-[var(--ink-3)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--ok-soft)] text-[var(--ok)] flex items-center justify-center mono text-[10px] font-bold">✓</span> Certified</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--info-soft)] text-[var(--info-ink)] flex items-center justify-center mono text-[10px] font-bold">◐</span> In training</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--bad-soft)] text-[var(--bad)] flex items-center justify-center mono text-[10px] font-bold">⚠</span> Expired</span>
            <span>·  Not qualified</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
