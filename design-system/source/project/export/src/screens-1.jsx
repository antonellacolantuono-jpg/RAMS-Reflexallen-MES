/* global React, MESData */
const { useState: useState1, useMemo: useMemo1 } = React;

// ============================================================
// DASHBOARD
// ============================================================
window.ScreenDashboard = function ScreenDashboard({ go }) {
  const wos = MESData.workOrders;
  const inProg = wos.filter(w => w.status === 'in_progress');
  const onHold = wos.filter(w => w.status === 'on_hold');
  return (
    <div className="p-5 space-y-4">
      <PageHeader title="Plant Overview" subtitle="Site Milano · Shift A · 06:00–14:00" />
      <div className="grid grid-cols-6 gap-3">
        <KPI label="OEE" value="78.4" unit="%" sub="Target 82%" tone="warn" />
        <KPI label="Availability" value="91.2" unit="%" tone="ok" />
        <KPI label="Performance" value="88.0" unit="%" tone="ok" />
        <KPI label="Quality" value="97.8" unit="%" tone="ok" />
        <KPI label="Throughput" value="142" unit="pc/h" sub="vs 156 plan" />
        <KPI label="Scrap rate" value="2.2" unit="%" tone="warn" sub="+0.4 vs avg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 hairline rounded-[var(--r-2)] bg-[var(--paper)]">
          <div className="hairline-b px-3 h-9 flex items-center justify-between">
            <div className="font-semibold text-[12.5px]">Active Work Orders</div>
            <Btn size="sm" variant="ghost" onClick={() => go('workorders')} iconR="arrowR">All Work Orders</Btn>
          </div>
          <div className="divide-y divide-[var(--line-2)]">
            {[...inProg, ...onHold].map(wo => (
              <div key={wo.id} className="px-3 py-2.5 grid grid-cols-[140px_1fr_120px_140px_80px] items-center gap-3 hover:bg-[var(--paper-2)] cursor-pointer" onClick={() => go('wo-detail', wo.id)}>
                <div className="mono text-[12px]">{wo.code}</div>
                <div>
                  <div className="text-[12.5px] font-medium">{wo.itemName}</div>
                  <div className="text-[11px] text-[var(--ink-3)]">{wo.workCenter} · {wo.operator}</div>
                </div>
                <div>
                  <Progress value={wo.qtyProduced} max={wo.qtyTarget} tone={wo.status === 'on_hold' ? 'warn' : 'accent'} />
                  <div className="text-[11px] mono mt-1 text-[var(--ink-3)]">{wo.qtyProduced}/{wo.qtyTarget} pc</div>
                </div>
                <StatusBadge status={wo.status} />
                <PriorityBadge p={wo.priority} />
              </div>
            ))}
          </div>
        </div>
        <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)]">
          <div className="hairline-b px-3 h-9 flex items-center justify-between">
            <div className="font-semibold text-[12.5px]">Live Activity</div>
            <Badge tone="accent" dot>Live</Badge>
          </div>
          <div className="px-3 py-2 space-y-2 text-[12px]">
            {[
              { t: '14:23', e: 'Step completed', d: 'WO-2026-0142 · Leak Test piece #168', tone: 'ok' },
              { t: '14:22', e: 'Box sealed', d: 'BOX-PLT-001235 · 48/48 units · SEAL-2026-00742', tone: 'accent' },
              { t: '14:21', e: 'NOK detected', d: 'WO-2026-0142 · piece #167 — Recovery flow started', tone: 'warn' },
              { t: '14:18', e: 'WO on hold', d: 'WO-2026-0141 · No material ITM-MP-00903', tone: 'bad' },
              { t: '14:15', e: 'Skill verified', d: 'OP-0142 Marco Conti · SKL-LEAK', tone: 'info' },
              { t: '14:12', e: 'Recipe loaded', d: 'RCP-LEAK-001 v3 → DEV-LEAK-01', tone: 'info' },
              { t: '14:08', e: 'Operator login', d: 'OP-0142 Marco Conti · WS-A2-01', tone: 'info' },
              { t: '14:00', e: 'Shift started', d: 'Shift A · 18 operators clocked in', tone: 'info' },
            ].map((x, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="mono text-[10.5px] text-[var(--ink-3)] tabular w-9 flex-shrink-0 pt-0.5">{x.t}</span>
                <span className="dot mt-1.5 flex-shrink-0" style={{ background: `var(--${x.tone})` }} />
                <div className="flex-1">
                  <div className="font-medium text-[12px]">{x.e}</div>
                  <div className="text-[11px] text-[var(--ink-3)]">{x.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card padded={false}>
          <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">Equipment Status</div>
          <div className="p-3 space-y-2">
            {[
              { l: 'Available', n: 14, tone: 'ok' },
              { l: 'In Use', n: 8, tone: 'warn' },
              { l: 'Maintenance', n: 2, tone: 'warn' },
              { l: 'Broken', n: 1, tone: 'bad' },
              { l: 'Offline', n: 3, tone: 'neutral' },
            ].map(x => (
              <div key={x.l} className="flex items-center gap-2">
                <span className="dot" style={{ background: `var(--${x.tone})` }} />
                <span className="flex-1 text-[12px]">{x.l}</span>
                <span className="mono tabular text-[12.5px] font-semibold">{x.n}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card padded={false}>
          <div className="hairline-b px-3 h-9 flex items-center font-semibold text-[12.5px]">6 Big Losses (today)</div>
          <div className="p-3 space-y-1.5">
            {[
              { l: 'Breakdowns', m: 24, tone: 'bad' },
              { l: 'Setup/Adj.', m: 38, tone: 'warn' },
              { l: 'Minor stops', m: 12, tone: 'warn' },
              { l: 'Reduced speed', m: 18, tone: 'info' },
              { l: 'Defects', m: 9, tone: 'warn' },
              { l: 'Startup loss', m: 6, tone: 'info' },
            ].map(x => (
              <div key={x.l} className="grid grid-cols-[1fr_50px_40px] items-center gap-2 text-[12px]">
                <span>{x.l}</span>
                <Progress value={x.m} max={40} tone={x.tone} />
                <span className="mono tabular text-right">{x.m}m</span>
              </div>
            ))}
          </div>
        </Card>
        <Card padded={false}>
          <div className="hairline-b px-3 h-9 flex items-center justify-between">
            <span className="font-semibold text-[12.5px]">Box Inventory</span>
            <Btn size="sm" variant="ghost" onClick={() => go('boxes')}>Open</Btn>
          </div>
          <div className="p-3 space-y-1.5">
            {[
              { l: 'Empty', n: 142, tone: 'neutral' },
              { l: 'Partially filled', n: 38, tone: 'info' },
              { l: 'Full', n: 12, tone: 'info' },
              { l: 'Sealed', n: 24, tone: 'accent' },
              { l: 'Returnable cycles ⌀', n: '187', tone: 'ok', isText: true },
              { l: 'Damaged', n: 3, tone: 'bad' },
            ].map(x => (
              <div key={x.l} className="flex items-center gap-2 text-[12px]">
                <span className="dot" style={{ background: `var(--${x.tone})` }} />
                <span className="flex-1">{x.l}</span>
                <span className="mono tabular text-[12.5px] font-semibold">{x.n}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// WORK ORDERS LIST
// ============================================================
window.ScreenWorkOrders = function ScreenWorkOrders({ go }) {
  const [filter, setFilter] = useState1('all');
  const [search, setSearch] = useState1('');
  const [view, setView] = useState1('list');
  const wos = MESData.workOrders.filter(w => {
    if (filter !== 'all' && w.status !== filter) return false;
    if (search && !w.code.toLowerCase().includes(search.toLowerCase()) && !w.itemName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const counts = MESData.workOrders.reduce((a, w) => { a[w.status] = (a[w.status] || 0) + 1; return a; }, {});

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Work Orders" subtitle={`${MESData.workOrders.length} orders · Site Milano`}
        actions={<>
          <Btn variant="default" icon="download">Export</Btn>
          <Btn variant="primary" icon="plus" onClick={() => go('wo-create')}>New Work Order</Btn>
        </>}
      />
      <div className="px-5 hairline-b">
        <Tabs value={filter} onChange={setFilter} tabs={[
          { id: 'all', label: 'All', count: MESData.workOrders.length },
          { id: 'draft', label: 'Draft', count: counts.draft || 0 },
          { id: 'planned', label: 'Planned', count: counts.planned || 0 },
          { id: 'released', label: 'Released', count: counts.released || 0 },
          { id: 'in_progress', label: 'In Progress', count: counts.in_progress || 0 },
          { id: 'on_hold', label: 'On Hold', count: counts.on_hold || 0 },
          { id: 'completed', label: 'Completed', count: counts.completed || 0 },
          { id: 'cancelled', label: 'Cancelled', count: counts.cancelled || 0 },
        ]} />
      </div>
      <div className="px-5 py-3 hairline-b flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1 max-w-[320px]">
          <Icon name="search" size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <Input className="w-full pl-7" placeholder="Search code, item, work center…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Btn variant="default" icon="filter" size="sm">Filters</Btn>
        <Select className="text-[12px]"><option>All priorities</option><option>Urgent</option><option>High</option></Select>
        <Select className="text-[12px]"><option>All centers</option><option>WC-A2</option><option>WC-B1</option></Select>
        <div className="flex-1" />
        <div className="flex hairline rounded-[var(--r-1)] overflow-hidden">
          {[['list','list'],['grid','card'],['flow','flow']].map(([id, ic]) => (
            <button key={id} onClick={() => setView(id)} className={cx('w-7 h-7 flex items-center justify-center', view === id ? 'bg-[var(--paper-3)]' : 'hover:bg-[var(--paper-2)]')}>
              <Icon name={ic} size={13} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {view === 'list' && (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="hairline-b text-[var(--ink-3)] uppercase-label">
                <th className="text-left px-4 py-2 font-semibold">Code</th>
                <th className="text-left px-2 py-2 font-semibold">Item</th>
                <th className="text-left px-2 py-2 font-semibold">Type</th>
                <th className="text-left px-2 py-2 font-semibold">Qty Progress</th>
                <th className="text-left px-2 py-2 font-semibold">Work Center</th>
                <th className="text-left px-2 py-2 font-semibold">Operator</th>
                <th className="text-left px-2 py-2 font-semibold">Planned</th>
                <th className="text-left px-2 py-2 font-semibold">Priority</th>
                <th className="text-left px-2 py-2 font-semibold">Status</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {wos.map(wo => (
                <tr key={wo.id} className="hairline-b hover:bg-[var(--paper-2)] cursor-pointer" onClick={() => go('wo-detail', wo.id)}>
                  <td className="px-4 py-2 mono text-[12px] font-medium">{wo.code}</td>
                  <td className="px-2 py-2">
                    <div className="font-medium">{wo.itemName}</div>
                    <div className="text-[10.5px] text-[var(--ink-3)] mono">{wo.item}</div>
                  </td>
                  <td className="px-2 py-2 capitalize text-[var(--ink-2)]">{wo.type}</td>
                  <td className="px-2 py-2 w-[180px]">
                    <Progress value={wo.qtyProduced} max={wo.qtyTarget} tone={wo.status === 'on_hold' ? 'warn' : wo.status === 'completed' ? 'ok' : 'accent'} />
                    <div className="mono text-[10.5px] text-[var(--ink-3)] mt-1 tabular">{wo.qtyProduced}/{wo.qtyTarget} · scrap {wo.qtyScrap}</div>
                  </td>
                  <td className="px-2 py-2 text-[12px]">{wo.workCenter}</td>
                  <td className="px-2 py-2 text-[12px]">{wo.operator}</td>
                  <td className="px-2 py-2 mono text-[11px] tabular text-[var(--ink-3)]">{wo.plannedStart.slice(5)}</td>
                  <td className="px-2 py-2"><PriorityBadge p={wo.priority} /></td>
                  <td className="px-2 py-2"><StatusBadge status={wo.status} /></td>
                  <td className="px-2 py-2 text-[var(--ink-3)]"><Icon name="chevronR" size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {view === 'grid' && (
          <div className="p-5 grid grid-cols-3 gap-3">
            {wos.map(wo => (
              <div key={wo.id} onClick={() => go('wo-detail', wo.id)} className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-3 hover:border-[var(--accent)] cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="mono text-[12px] font-semibold">{wo.code}</div>
                    <div className="text-[11px] text-[var(--ink-3)] capitalize">{wo.type}</div>
                  </div>
                  <PriorityBadge p={wo.priority} />
                </div>
                <div className="font-medium text-[13px] mb-2">{wo.itemName}</div>
                <Progress value={wo.qtyProduced} max={wo.qtyTarget} tone={wo.status === 'on_hold' ? 'warn' : 'accent'} />
                <div className="flex items-center justify-between mt-2">
                  <div className="mono text-[11px] tabular">{wo.qtyProduced}/{wo.qtyTarget}</div>
                  <StatusBadge status={wo.status} />
                </div>
                <div className="hairline-t mt-2 pt-2 flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                  <span>{wo.workCenter}</span>
                  <span className="mono">{wo.workflow}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {view === 'flow' && (
          <div className="p-5">
            <Card className="h-[500px] relative overflow-hidden">
              <div className="grid grid-cols-5 gap-3 h-full">
                {['draft', 'planned', 'released', 'in_progress', 'completed'].map(s => (
                  <div key={s} className="flex flex-col">
                    <div className="hairline-b pb-1.5 mb-2 uppercase-label flex items-center justify-between">
                      <span>{s.replace('_', ' ')}</span>
                      <span className="mono text-[var(--ink-3)]">{wos.filter(w => w.status === s).length}</span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-auto">
                      {wos.filter(w => w.status === s).map(wo => (
                        <div key={wo.id} className="hairline rounded p-2 bg-[var(--paper-2)] cursor-pointer hover:border-[var(--accent)]" onClick={() => go('wo-detail', wo.id)}>
                          <div className="mono text-[11px] font-semibold">{wo.code}</div>
                          <div className="text-[11px] truncate">{wo.itemName}</div>
                          <div className="mt-1.5"><Progress value={wo.qtyProduced} max={wo.qtyTarget} tone="accent" /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

window.PageHeader = function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="px-5 py-3 hairline-b flex items-center justify-between flex-shrink-0">
      <div>
        {breadcrumb && <div className="text-[11px] text-[var(--ink-3)] mb-1">{breadcrumb}</div>}
        <h1 className="text-[18px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <div className="text-[11.5px] text-[var(--ink-3)] mt-0.5">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};
