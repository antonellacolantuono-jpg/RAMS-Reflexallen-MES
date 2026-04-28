/* global React, MESData */
const { useState: useState3, useMemo: useMemo3 } = React;

// ============================================================
// WORKFLOW EDITOR — 4-pane: tree | palette | form | preview
// ============================================================
window.ScreenWorkflowEditor = function ScreenWorkflowEditor({ go }) {
  const wf = MESData.workflow;
  const [selected, setSelected] = useState3({ type: 'workflow' });
  const [showAutogen, setShowAutogen] = useState3(false);
  const [showValidation, setShowValidation] = useState3(false);
  const [showPublish, setShowPublish] = useState3(false);
  const [collapsed, setCollapsed] = useState3({});
  const toggle = id => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-2.5 hairline-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => go('workflows')} className="text-[var(--ink-3)] hover:text-[var(--ink)]"><Icon name="arrowL" size={14} /></button>
          <div>
            <div className="text-[11px] text-[var(--ink-3)] mono">WF-0042</div>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold tracking-tight">Brake Caliper Assembly v3</h1>
              <Badge tone="warn">Draft</Badge>
              <Badge tone="info">v3 → 4</Badge>
              <span className="text-[11px] text-[var(--ink-3)] mono">· 7 phases · 18 groups · 124 steps</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Btn variant="ghost" icon="undo" size="sm" />
          <Btn variant="ghost" icon="redo" size="sm" />
          <div className="w-px h-5 bg-[var(--line)] mx-1" />
          <Btn variant="ghost" icon="diff" onClick={() => setShowAutogen(true)}>Diff vs v3</Btn>
          <Btn variant="default" icon="check" onClick={() => setShowValidation(true)}>Validate</Btn>
          <Btn variant="default" icon="play">Simulate</Btn>
          <Btn variant="default" icon="download">Export</Btn>
          <div className="w-px h-5 bg-[var(--line)] mx-1" />
          <Btn variant="primary" icon="upload" onClick={() => setShowPublish(true)}>Publish v4</Btn>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[280px_220px_1fr_360px] min-h-0">
        {/* Tree */}
        <div className="hairline-r overflow-auto bg-[var(--paper-2)]">
          <div className="px-3 h-9 hairline-b flex items-center justify-between sticky top-0 bg-[var(--paper-2)] z-10">
            <span className="uppercase-label">Structure</span>
            <Btn variant="ghost" icon="plus" size="sm" />
          </div>
          <div className="py-1.5">
            <TreeNode
              label="Brake Caliper Assembly v3"
              icon="layers"
              code="WF-0042"
              selected={selected.type === 'workflow'}
              onClick={() => setSelected({ type: 'workflow' })}
              onToggle={() => toggle('wf')}
              expanded={!collapsed.wf}
              depth={0}
              hasChildren
            />
            {!collapsed.wf && wf.phases.map(p => (
              <React.Fragment key={p.id}>
                <TreeNode
                  label={p.name}
                  icon={p.icon}
                  code={p.code}
                  selected={selected.id === p.id}
                  onClick={() => setSelected({ type: 'phase', id: p.id })}
                  onToggle={() => toggle(p.id)}
                  expanded={!collapsed[p.id]}
                  depth={1}
                  hasChildren
                  badge={p.autogen && 'AUTO'}
                  tone={p.code}
                />
                {!collapsed[p.id] && p.groups.map(g => (
                  <React.Fragment key={g.id}>
                    <TreeNode
                      label={g.name}
                      icon="folder"
                      selected={selected.id === g.id}
                      onClick={() => setSelected({ type: 'group', id: g.id, parent: p.id })}
                      onToggle={() => toggle(g.id)}
                      expanded={!collapsed[g.id]}
                      depth={2}
                      hasChildren
                      badge={g.autogen && 'AUTO'}
                    />
                    {!collapsed[g.id] && g.steps.map((s, i) => (
                      <TreeNode
                        key={s.id}
                        label={s.title}
                        icon={catIcon(s.cat)}
                        selected={selected.id === s.id}
                        onClick={() => setSelected({ type: 'step', id: s.id, parent: g.id })}
                        depth={3}
                        ord={i + 1}
                        parallel={s.devCat === 'parallel'}
                        partRef={s.partRef}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Palette */}
        <div className="hairline-r overflow-auto bg-[var(--paper)]">
          <div className="px-3 h-9 hairline-b flex items-center sticky top-0 bg-[var(--paper)] z-10">
            <span className="uppercase-label">Palette</span>
          </div>
          <div className="p-2 space-y-3">
            <PaletteSection title="Step categories" items={[
              { ic: 'qr', l: 'Identification', c: 'Scan, label, register' },
              { ic: 'zap', l: 'Production', c: 'Assemble, machining' },
              { ic: 'target', l: 'Quality Control', c: 'Inspect, test' },
              { ic: 'truck', l: 'Logistics', c: 'Move, pack, ship' },
              { ic: 'tool', l: 'Service', c: 'Setup, maintain' },
              { ic: 'shield', l: 'Safety', c: 'Lockout, PPE' },
              { ic: 'doc', l: 'Documentation', c: 'Photo, sign-off' },
            ]} />
            <PaletteSection title="Step kinds" items={[
              { ic: 'manual', l: 'Manual', c: 'Operator action' },
              { ic: 'auto', l: 'Automatic', c: 'Device-driven' },
              { ic: 'guided', l: 'Guided', c: 'Manual w/ device' },
              { ic: 'parallel', l: 'Parallel', c: 'Pause/resume' },
              { ic: 'flow', l: 'Sub-flow', c: 'Embedded steps' },
              { ic: 'gate', l: 'Decision', c: 'Branch on result' },
            ]} />
            <PaletteSection title="Auto-gen triggers" items={[
              { ic: 'box', l: 'Box pack-out', c: 'Adds Logistics phase' },
              { ic: 'shield', l: 'Hazard tag', c: 'Adds Safety steps' },
              { ic: 'cert', l: 'Certified product', c: 'Adds Sign-off step' },
            ]} />
          </div>
        </div>

        {/* Canvas */}
        <div className="overflow-auto bg-[var(--paper-2)] relative" style={{ backgroundImage: 'radial-gradient(circle, var(--line) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div className="p-6 min-h-full">
            <div className="text-[11px] uppercase-label mb-3 flex items-center gap-2">
              <span>Canvas — Visual editor</span>
              <span className="ml-auto flex items-center gap-1.5">
                <Badge tone="accent">∥ Parallel</Badge>
                <Badge tone="info">Auto-gen</Badge>
                <Badge tone="neutral">Manual</Badge>
              </span>
            </div>
            <div className="space-y-3">
              {wf.phases.map((p, pi) => (
                <PhaseBlock key={p.id} phase={p} idx={pi} selected={selected.id === p.id} onSelect={(t, id, parent) => setSelected({ type: t, id, parent })} selectedId={selected.id} />
              ))}
              <button className="w-full hairline border-dashed rounded-[var(--r-2)] py-3 text-[12px] text-[var(--ink-3)] hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center justify-center gap-1.5">
                <Icon name="plus" size={13} /> Add Phase
              </button>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="hairline-l overflow-auto bg-[var(--paper)]">
          <Inspector selected={selected} wf={wf} />
        </div>
      </div>

      <Modal open={showAutogen} onClose={() => setShowAutogen(false)} title="Auto-gen Diff · v3 → v4 (preview)" width={920}
        actions={<><Btn variant="ghost" onClick={() => setShowAutogen(false)}>Close</Btn><Btn variant="primary">Accept all auto-gen changes</Btn></>}>
        <AutogenDiff />
      </Modal>

      <Modal open={showValidation} onClose={() => setShowValidation(false)} title="Workflow Validation" width={680}
        actions={<><Btn variant="ghost" onClick={() => setShowValidation(false)}>Close</Btn><Btn variant="primary">Run all checks</Btn></>}>
        <ValidationResults />
      </Modal>

      <Modal open={showPublish} onClose={() => setShowPublish(false)} title="Publish workflow v4" width={560}
        actions={<><Btn variant="ghost" onClick={() => setShowPublish(false)}>Cancel</Btn><Btn variant="primary" icon="upload">Publish</Btn></>}>
        <div className="space-y-3 text-[12.5px]">
          <Field label="Version label"><Input defaultValue="v4 — Add leak retest, parallel pressure check" /></Field>
          <Field label="Effective date"><Input type="datetime-local" defaultValue="2026-05-01T06:00" /></Field>
          <Field label="Migration policy">
            <div className="space-y-1.5">
              {[
                { l: 'Keep in-flight WOs on v3 (snapshot)', d: 'Default — frozen snapshots are immutable.' },
                { l: 'Migrate planned WOs to v4', d: 'Re-validate BOM/skill/device against new version.' },
                { l: 'Notify operators with active sessions', d: 'Push HMI notification.' },
              ].map((x, i) => (
                <label key={i} className="flex items-start gap-2 hairline rounded p-2 cursor-pointer hover:bg-[var(--paper-2)]">
                  <input type="checkbox" defaultChecked={i < 2} className="mt-0.5" />
                  <div><div className="font-medium">{x.l}</div><div className="text-[11px] text-[var(--ink-3)]">{x.d}</div></div>
                </label>
              ))}
            </div>
          </Field>
          <div className="hairline rounded p-2 bg-[var(--accent-soft)] text-[12px] flex items-center gap-2 text-[var(--accent-ink)]">
            <Icon name="info" size={13} /> 4 active WOs will continue on v3 until completion.
          </div>
        </div>
      </Modal>
    </div>
  );
};

function catIcon(c) {
  return ({ identification: 'qr', production: 'zap', quality_control: 'target', logistics: 'truck', service: 'tool', safety: 'shield', documentation: 'doc' })[c] || 'check';
}

const TreeNode = ({ label, icon, code, selected, onClick, onToggle, expanded, depth, hasChildren, ord, badge, tone, parallel, partRef }) => (
  <div
    className={cx('group flex items-center gap-1 px-2 py-1 cursor-pointer text-[12px]', selected ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'hover:bg-[var(--paper-3)]')}
    style={{ paddingLeft: 8 + depth * 14 }}
    onClick={onClick}
  >
    {hasChildren ? (
      <button onClick={e => { e.stopPropagation(); onToggle?.(); }} className="w-3 h-3 flex items-center justify-center flex-shrink-0">
        <Icon name={expanded ? 'chevronD' : 'chevronR'} size={10} />
      </button>
    ) : <span className="w-3 flex-shrink-0" />}
    {ord && <span className="mono text-[10px] text-[var(--ink-3)] w-5 text-right flex-shrink-0">{String(ord).padStart(2, '0')}</span>}
    {tone ? <span className="w-1 h-3 rounded-sm flex-shrink-0" style={{background:`var(--c-${tone})`}}/> : <Icon name={icon} size={11} className="flex-shrink-0 text-[var(--ink-3)]" />}
    <span className="flex-1 truncate">{label}</span>
    {parallel && <span className="text-[9px] mono px-1 rounded bg-[var(--info-soft)] text-[var(--info-ink)]">∥{partRef}</span>}
    {badge && <span className="text-[9px] mono px-1 rounded bg-[var(--accent-soft)] text-[var(--accent-ink)]">{badge}</span>}
    {code && <span className="text-[9.5px] mono text-[var(--ink-3)]">{code}</span>}
  </div>
);

const PaletteSection = ({ title, items }) => (
  <div>
    <div className="uppercase-label px-1 mb-1">{title}</div>
    <div className="space-y-1">
      {items.map((x, i) => (
        <div key={i} className="hairline rounded p-1.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] cursor-grab active:cursor-grabbing flex items-start gap-2">
          <div className="w-6 h-6 rounded bg-[var(--paper-2)] hairline flex items-center justify-center flex-shrink-0"><Icon name={x.ic} size={12} /></div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium leading-tight">{x.l}</div>
            <div className="text-[10.5px] text-[var(--ink-3)] leading-tight mt-0.5">{x.c}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PhaseBlock = ({ phase, idx, onSelect, selectedId }) => (
  <div className={cx('hairline rounded-[var(--r-2)] bg-[var(--paper)]', selectedId === phase.id && 'ring-2 ring-[var(--accent)]')}
    onClick={(e) => { e.stopPropagation(); onSelect('phase', phase.id); }}>
    <div className="h-9 px-3 flex items-center gap-2 hairline-b cursor-pointer" style={{ borderLeft: `4px solid var(--c-${phase.code})` }}>
      <span className="mono text-[10.5px] text-[var(--ink-3)]">PH-{String(idx+1).padStart(2,'0')}</span>
      <span className="text-[14px]">{phase.icon}</span>
      <span className="font-semibold text-[12.5px]">{phase.name}</span>
      {phase.autogen && <Badge tone="accent" className="!text-[9px]">AUTO-GEN</Badge>}
      <span className="ml-auto mono text-[10.5px] text-[var(--ink-3)]">{phase.groups.length} groups</span>
      <Btn variant="ghost" icon="dots" size="sm" />
    </div>
    <div className="p-2 grid grid-cols-2 gap-2">
      {phase.groups.map((g, gi) => (
        <GroupBlock key={g.id} group={g} parent={phase.id} idx={gi} onSelect={onSelect} selected={selectedId === g.id} selectedId={selectedId} />
      ))}
    </div>
  </div>
);

const GroupBlock = ({ group, parent, idx, onSelect, selected, selectedId }) => (
  <div
    onClick={(e) => { e.stopPropagation(); onSelect('group', group.id, parent); }}
    className={cx('hairline rounded p-2 bg-[var(--paper-2)] cursor-pointer hover:border-[var(--ink-3)]', selected && 'ring-2 ring-[var(--accent)] border-[var(--accent)]')}
  >
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="mono text-[10px] text-[var(--ink-3)]">G{String(idx+1).padStart(2,'0')}</span>
      <span className="text-[12px] font-medium">{group.name}</span>
      {group.autogen && <Badge tone="accent" className="!text-[9px]">AUTO</Badge>}
      <span className="ml-auto text-[10px] mono text-[var(--ink-3)]">{group.cat}</span>
    </div>
    <div className="space-y-0.5">
      {group.steps.map((s, i) => (
        <div
          key={s.id}
          onClick={(e) => { e.stopPropagation(); onSelect('step', s.id, group.id); }}
          className={cx('flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] cursor-pointer', selectedId === s.id ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--paper)]')}
        >
          <span className={cx('mono text-[9.5px] w-5 text-right', selectedId === s.id ? 'text-white/70' : 'text-[var(--ink-3)]')}>{String(i+1).padStart(2,'0')}</span>
          <Icon name={catIcon(s.cat)} size={10} />
          <span className="flex-1 truncate">{s.title}</span>
          {s.devCat === 'parallel' && (
            <span className={cx('text-[8.5px] mono px-1 rounded', selectedId === s.id ? 'bg-white/20' : 'bg-[var(--info-soft)] text-[var(--info-ink)]')}>∥{s.partRef}</span>
          )}
          {s.dur && <span className={cx('mono text-[9px]', selectedId === s.id ? 'text-white/70' : 'text-[var(--ink-3)]')}>{s.dur}s</span>}
        </div>
      ))}
    </div>
  </div>
);

// Inspector — context-aware form
const Inspector = ({ selected, wf }) => {
  if (selected.type === 'workflow') return <InspectorWorkflow wf={wf} />;
  if (selected.type === 'phase') {
    const p = wf.phases.find(x => x.id === selected.id);
    return p ? <InspectorPhase phase={p} /> : null;
  }
  if (selected.type === 'group') {
    const g = wf.phases.flatMap(p => p.groups).find(x => x.id === selected.id);
    return g ? <InspectorGroup group={g} /> : null;
  }
  if (selected.type === 'step') {
    const s = wf.phases.flatMap(p => p.groups).flatMap(g => g.steps).find(x => x.id === selected.id);
    return s ? <InspectorStep step={s} /> : null;
  }
  return null;
};

const InspectorShell = ({ title, code, children, tabs }) => {
  const [tab, setTab] = useState3(tabs?.[0]?.id);
  return (
    <div>
      <div className="px-3 h-9 hairline-b flex items-center sticky top-0 bg-[var(--paper)] z-10">
        <div className="flex-1">
          <div className="uppercase-label">Inspector</div>
        </div>
        <Btn variant="ghost" icon="dots" size="sm" />
      </div>
      <div className="p-3 hairline-b">
        <div className="text-[10.5px] mono text-[var(--ink-3)]">{code}</div>
        <div className="text-[14px] font-semibold mt-0.5">{title}</div>
      </div>
      {tabs && (
        <div className="px-3 hairline-b">
          <Tabs value={tab} onChange={setTab} tabs={tabs} compact />
        </div>
      )}
      <div className="p-3">{typeof children === 'function' ? children(tab) : children}</div>
    </div>
  );
};

const InspectorWorkflow = ({ wf }) => (
  <InspectorShell title="Brake Caliper Assembly v3" code="WF-0042"
    tabs={[{ id: 'props', label: 'Properties' }, { id: 'meta', label: 'Metadata' }, { id: 'audit', label: 'Audit' }]}>
    {tab => tab === 'props' ? (
      <div className="space-y-3">
        <Field label="Name"><Input defaultValue="Brake Caliper Assembly" /></Field>
        <Field label="Code"><Input defaultValue="WF-0042" mono /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Version"><Input defaultValue="3 (draft 4)" mono /></Field>
          <Field label="Status"><Select defaultValue="draft"><option value="draft">Draft</option><option>Published</option><option>Archived</option></Select></Field>
        </div>
        <Field label="Description"><textarea className="w-full hairline rounded-[var(--r-1)] px-2 py-1.5 text-[12px] bg-[var(--paper)] resize-none" rows={3} defaultValue="Standard front brake caliper assembly with dual-piston, including leak test and pressure verification." /></Field>
        <Field label="Tags"><div className="flex flex-wrap gap-1">{['caliper','brake','assembly','dual-piston'].map(t => <Badge key={t} tone="neutral">{t}</Badge>)}<button className="text-[11px] text-[var(--ink-3)] hover:text-[var(--ink)]">+ tag</button></div></Field>
        <Field label="Default work centers"><Select><option>WC-A2 (Brake assembly line)</option></Select></Field>
        <Field label="Auto-gen rules">
          <div className="space-y-1">
            <Toggle label="Generate Logistics phase if box pack-out" on />
            <Toggle label="Generate Safety steps for hazardous components" on />
            <Toggle label="Generate sign-off step for certified products" />
          </div>
        </Field>
      </div>
    ) : tab === 'meta' ? (
      <div className="space-y-2 text-[12px]">
        <Row k="Created" v="2025-11-12 by R. Bianchi" />
        <Row k="Last published" v="2026-02-04 (v3)" />
        <Row k="Active WOs on v3" v="4" />
        <Row k="Total runs" v="2,847 pieces" />
        <Row k="Avg cycle time" v="08:14 m:ss" mono />
      </div>
    ) : (
      <div className="space-y-1.5 text-[11.5px]">
        {['v3 published 2026-02-04 R. Bianchi','v2 published 2025-11-22 R. Bianchi','v1 published 2025-11-12 R. Bianchi'].map((x,i) => (
          <div key={i} className="hairline rounded p-2 bg-[var(--paper-2)]">{x}</div>
        ))}
      </div>
    )}
  </InspectorShell>
);

const InspectorPhase = ({ phase }) => (
  <InspectorShell title={phase.name} code={`Phase · ${phase.code.toUpperCase()}`}
    tabs={[{ id: 'props', label: 'Properties' }, { id: 'rules', label: 'Rules' }]}>
    {tab => tab === 'props' ? (
      <div className="space-y-3">
        <Field label="Name"><Input defaultValue={phase.name} /></Field>
        <Field label="Phase type"><Select defaultValue={phase.code}>
          {['identification','production','logistics','quality_control','service','safety','documentation'].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
        </Select></Field>
        <Field label="Color">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded hairline" style={{background:`var(--c-${phase.code})`}} />
            <Input defaultValue={`var(--c-${phase.code})`} mono />
          </div>
        </Field>
        {phase.autogen && (
          <div className="hairline rounded p-2 bg-[var(--accent-soft)] text-[12px]">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--accent-ink)] mb-1"><Icon name="zap" size={12}/>Auto-generated</div>
            <div className="text-[11px] text-[var(--accent-ink)]">Generated by trigger: <span className="mono">box_packout</span> when item is shipped in a box.</div>
          </div>
        )}
        <Field label="Optional"><Toggle label="Phase can be skipped" /></Field>
        <Field label="Parallel groups"><Toggle label="Groups in this phase can run concurrently" /></Field>
      </div>
    ) : (
      <div className="space-y-2 text-[12px]">
        <Field label="Pre-conditions"><Input placeholder="e.g. previous_phase.complete" mono /></Field>
        <Field label="Post-conditions"><Input placeholder="e.g. all_groups.complete" mono /></Field>
        <Field label="On entry"><Input placeholder="hook function" mono /></Field>
      </div>
    )}
  </InspectorShell>
);

const InspectorGroup = ({ group }) => (
  <InspectorShell title={group.name} code={`Group · ${group.id}`}>
    <div className="space-y-3">
      <Field label="Name"><Input defaultValue={group.name} /></Field>
      <Field label="Category"><Select defaultValue={group.cat}>
        {['identification','production','quality_control','logistics','service','safety','documentation'].map(c => <option key={c}>{c}</option>)}
      </Select></Field>
      <Field label="Order">
        <div className="flex items-center gap-2">
          <Input className="w-16" defaultValue="1" mono />
          <Toggle label="Lock order" />
        </div>
      </Field>
      <Field label="Required skills">
        <div className="space-y-1">
          {['SKL-ASSY','SKL-LEAK'].map(s => (
            <div key={s} className="flex items-center gap-2 hairline rounded p-1.5 bg-[var(--paper-2)]">
              <Icon name="badge" size={12} />
              <span className="text-[12px] mono flex-1">{s}</span>
              <Btn variant="ghost" icon="x" size="sm" />
            </div>
          ))}
          <button className="text-[11.5px] text-[var(--accent)] hover:underline">+ add skill</button>
        </div>
      </Field>
    </div>
  </InspectorShell>
);

const InspectorStep = ({ step }) => (
  <InspectorShell title={step.title} code={`Step · ${step.id}`}
    tabs={[
      { id: 'props', label: 'Properties' },
      { id: 'inputs', label: 'I/O' },
      { id: 'device', label: 'Device' },
      { id: 'rules', label: 'Rules' },
    ]}>
    {tab => tab === 'props' ? (
      <div className="space-y-3">
        <Field label="Title"><Input defaultValue={step.title} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Category"><Select defaultValue={step.cat}>{['identification','production','quality_control','logistics','service','safety','documentation'].map(c => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Kind"><Select defaultValue={step.devCat}>{['manual','automatic','guided','parallel','sub_flow','decision'].map(c => <option key={c}>{c}</option>)}</Select></Field>
        </div>
        <Field label="Instructions"><textarea rows={3} className="w-full hairline rounded-[var(--r-1)] px-2 py-1.5 text-[12px] bg-[var(--paper)] resize-none" defaultValue="Apply 25 ± 2 N·m on bleeder screw using torque wrench TW-014. Verify lock-tab engagement." /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Std. duration"><div className="relative"><Input defaultValue={step.dur || 30} mono /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--ink-3)]">sec</span></div></Field>
          <Field label="Max duration"><div className="relative"><Input defaultValue={(step.dur || 30) * 2} mono /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--ink-3)]">sec</span></div></Field>
        </div>
        {step.devCat === 'parallel' && (
          <div className="hairline rounded p-2 bg-[var(--info-soft)] text-[12px] space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--info-ink)]"><Icon name="parallel" size={12}/>Parallel step</div>
            <div className="text-[11px] text-[var(--info-ink)]">Operator can pause this step and run others. Resumes via QR scan.</div>
            <Field label="Part identifier"><Input defaultValue={step.partRef} mono /></Field>
            <Field label="Resume mode"><Select><option>QR scan part</option><option>Manual select from list</option><option>Auto on completion signal</option></Select></Field>
          </div>
        )}
        <Field label="On NOK"><Select defaultValue="recovery"><option value="recovery">Trigger recovery sub-flow</option><option>Halt and notify</option><option>Mark scrap and continue</option></Select></Field>
      </div>
    ) : tab === 'inputs' ? (
      <div className="space-y-3">
        <div>
          <div className="uppercase-label mb-1">Inputs · materials</div>
          <div className="space-y-1">
            {[
              { c: 'ITM-CMP-00211', n: 'Piston Seal NBR', q: '2 pc' },
              { c: 'ITM-CMP-00284', n: 'Brake Piston', q: '2 pc' },
            ].map(x => (
              <div key={x.c} className="hairline rounded p-1.5 bg-[var(--paper-2)] flex items-center gap-2">
                <Icon name="cube" size={12} className="text-[var(--ink-3)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate">{x.n}</div>
                  <div className="text-[10px] mono text-[var(--ink-3)]">{x.c}</div>
                </div>
                <span className="mono text-[11px] tabular">{x.q}</span>
              </div>
            ))}
            <button className="text-[11.5px] text-[var(--accent)] hover:underline">+ add input</button>
          </div>
        </div>
        <div>
          <div className="uppercase-label mb-1">Outputs · data</div>
          <div className="space-y-1">
            {[{ k: 'leak_pressure_drop', t: 'number (mbar)' }, { k: 'leak_passed', t: 'bool' }].map(x => (
              <div key={x.k} className="hairline rounded p-1.5 bg-[var(--paper-2)] flex items-center gap-2">
                <Icon name="output" size={12} className="text-[var(--ink-3)]" />
                <span className="mono text-[11px] flex-1">{x.k}</span>
                <span className="text-[10.5px] text-[var(--ink-3)]">{x.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : tab === 'device' ? (
      <div className="space-y-3">
        <Field label="Required device"><Select><option>DEV-LEAK-01 — Marposs leak tester</option><option>DEV-LEAK-02 — Marposs (backup)</option><option>Any compatible</option></Select></Field>
        <Field label="Recipe"><Select><option>RCP-LEAK-001 v3 — Caliper standard</option><option>RCP-LEAK-002 v1 — Caliper HD</option></Select></Field>
        <div className="hairline rounded p-2 bg-[var(--paper-2)]">
          <div className="uppercase-label mb-1.5">Recipe parameters (read-only)</div>
          <div className="space-y-1 text-[11px] mono">
            {[['target_pressure','3.50 bar'],['hold_time','15 s'],['max_drop','0.3 mbar'],['ramp','1.0 bar/s']].map(([k,v]) => (
              <div key={k} className="flex justify-between"><span className="text-[var(--ink-3)]">{k}</span><span className="tabular">{v}</span></div>
            ))}
          </div>
        </div>
        <Field label="Acceptance criteria"><Input defaultValue="leak_pressure_drop < 0.3 mbar" mono /></Field>
      </div>
    ) : (
      <div className="space-y-2 text-[12px]">
        <Field label="Pre-conditions"><Input placeholder="e.g. previous_step.complete" mono /></Field>
        <Field label="Skip conditions"><Input placeholder="e.g. item.variant == 'lite'" mono /></Field>
        <Field label="Required skills"><Input defaultValue="SKL-LEAK" mono /></Field>
        <Toggle label="Mandatory" on />
        <Toggle label="Skippable with override" />
        <Toggle label="Capture photo evidence" />
      </div>
    )}
  </InspectorShell>
);

const Toggle = ({ label, on }) => {
  const [v, setV] = useState3(!!on);
  return (
    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
      <button onClick={(e) => { e.preventDefault(); setV(!v); }} className={cx('w-7 h-4 rounded-full relative transition-colors flex-shrink-0', v ? 'bg-[var(--accent)]' : 'bg-[var(--line-strong)]')}>
        <span className={cx('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform', v ? 'translate-x-3.5' : 'translate-x-0.5')} />
      </button>
      <span>{label}</span>
    </label>
  );
};

const AutogenDiff = () => {
  const sections = [
    { type: 'add', t: 'New phase: Logistics', d: 'Auto-generated because item ITM-FG-00042 is shipped in returnable box BTYPE-CBX-014.', items: ['+ Group: Box pack-out (3 steps)','+ Group: Sealing & labeling (2 steps)'] },
    { type: 'mod', t: 'Step modified: Leak Test', d: 'Recipe RCP-LEAK-001 updated v2 → v3 (max_drop 0.4 → 0.3 mbar).', items: ['~ acceptance: leak_pressure_drop < 0.3 mbar','~ recipe: RCP-LEAK-001 v3'] },
    { type: 'add', t: 'New step: Pressure verification', d: 'Manually added · parallel kind, refs piston #1 and #2.', items: ['+ Pressure verify · piston #1 (∥ A)','+ Pressure verify · piston #2 (∥ B)'] },
    { type: 'rm', t: 'Step removed: Visual inspection (legacy)', d: 'Replaced by photo-evidence step under Documentation.', items: ['- visual_inspection_v2'] },
  ];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="hairline rounded p-2 bg-[var(--ok-soft)]"><div className="text-[18px] font-bold mono text-[var(--ok)]">+12</div><div className="text-[10.5px] uppercase-label">Added</div></div>
        <div className="hairline rounded p-2 bg-[var(--info-soft)]"><div className="text-[18px] font-bold mono text-[var(--info)]">~8</div><div className="text-[10.5px] uppercase-label">Modified</div></div>
        <div className="hairline rounded p-2 bg-[var(--bad-soft)]"><div className="text-[18px] font-bold mono text-[var(--bad)]">-3</div><div className="text-[10.5px] uppercase-label">Removed</div></div>
        <div className="hairline rounded p-2 bg-[var(--accent-soft)]"><div className="text-[18px] font-bold mono text-[var(--accent)]">5</div><div className="text-[10.5px] uppercase-label">Auto-gen</div></div>
      </div>
      <div className="space-y-1.5">
        {sections.map((s, i) => (
          <div key={i} className="hairline rounded">
            <div className={cx('px-2.5 py-1.5 flex items-center gap-2 hairline-b', s.type === 'add' ? 'bg-[var(--ok-soft)]' : s.type === 'mod' ? 'bg-[var(--info-soft)]' : 'bg-[var(--bad-soft)]')}>
              <Badge tone={s.type === 'add' ? 'ok' : s.type === 'mod' ? 'info' : 'bad'}>{s.type === 'add' ? 'ADDED' : s.type === 'mod' ? 'MODIFIED' : 'REMOVED'}</Badge>
              <span className="font-semibold text-[12.5px]">{s.t}</span>
            </div>
            <div className="p-2.5 text-[11.5px]">
              <div className="text-[var(--ink-3)] mb-1.5">{s.d}</div>
              <div className="space-y-0.5 mono text-[11px]">
                {s.items.map((it, j) => (
                  <div key={j} className={cx('px-2 py-0.5 rounded',
                    it.startsWith('+') ? 'bg-[var(--ok-soft)] text-[var(--ok)]' :
                    it.startsWith('-') ? 'bg-[var(--bad-soft)] text-[var(--bad)]' :
                    'bg-[var(--info-soft)] text-[var(--info-ink)]')}>{it}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ValidationResults = () => {
  const items = [
    { tone: 'ok', l: 'Structure', d: 'All phases reachable, no orphan steps.' },
    { tone: 'ok', l: 'Skill coverage', d: 'All required skills referenced are defined and have ≥1 qualified operator.' },
    { tone: 'ok', l: 'Device compatibility', d: 'All device types have ≥1 instance available.' },
    { tone: 'warn', l: 'Recipe drift', d: 'RCP-LEAK-001 has newer v4 (workflow points to v3). Consider updating.' },
    { tone: 'warn', l: 'Cycle time variance', d: 'Step "Visual inspect" has σ=42% across last 200 runs.' },
    { tone: 'ok', l: 'BOM linkage', d: 'All component refs resolve to active items.' },
    { tone: 'ok', l: 'Auto-gen rules', d: '5 auto-gen blocks · all triggers verified.' },
    { tone: 'bad', l: 'Box reservation', d: 'BTYPE-CBX-014 inventory below safety stock (8 / 20 required).' },
  ];
  return (
    <div className="space-y-1.5">
      {items.map((x, i) => (
        <div key={i} className={cx('hairline rounded p-2.5 flex items-start gap-2.5',
          x.tone === 'ok' ? 'bg-[var(--ok-soft)]' : x.tone === 'warn' ? 'bg-[var(--warn-soft)]' : 'bg-[var(--bad-soft)]')}>
          <Icon name={x.tone === 'ok' ? 'check' : 'alert'} className={`text-[var(--${x.tone})]`} />
          <div className="flex-1">
            <div className="font-semibold text-[12.5px]">{x.l}</div>
            <div className="text-[11.5px] text-[var(--ink-2)] mt-0.5">{x.d}</div>
          </div>
          <Badge tone={x.tone}>{x.tone === 'ok' ? 'PASS' : x.tone === 'warn' ? 'WARN' : 'FAIL'}</Badge>
        </div>
      ))}
    </div>
  );
};
