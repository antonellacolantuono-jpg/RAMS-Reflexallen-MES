'use client'
import * as React from 'react'
import {
  Button,
  Input,
  Card,
  Badge,
  StatusBadge,
  PhaseBadge,
  Skeleton,
  Dot,
  Progress,
  KPI,
  Tabs,
  Field,
  Select,
  Drawer,
  Modal,
  ToastProvider,
  useToast,
  PriorityBadge,
  ViewSwitcher,
  type ViewMode,
  TreeNode,
  EmptyState,
  SplitView,
  RegistryTile,
  OperationalTable,
  type OpTableColumn,
  DetailHeader,
  DetailBody,
  AuditTimeline,
  type AuditTimelineEntry,
  KpiHero,
  PhaseChip,
  WCCard,
  AlertBanner,
  LiveAlert,
  PlantMap,
  CanvasGrid,
  ZoomControls,
  Minimap,
  CanvasToolbar,
  CanvasStateBar,
  GenericNode,
  CanvasEdge,
  ArrowDefs,
} from '@mes/ui'
import { Eye, Factory, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle'

const TABS = ['Components', 'Patterns', 'Detail', 'Dashboard', 'Colors', 'Typography'] as const
type Tab = (typeof TABS)[number]

interface DemoRow {
  id: string
  code: string
  item: string
  qty: number
  status: 'ok' | 'warn' | 'bad' | 'info' | 'neutral'
}

const DEMO_ROWS: DemoRow[] = [
  { id: '1', code: 'WO-2026-0142', item: 'Brake Caliper Assembly', qty: 168, status: 'info' },
  { id: '2', code: 'WO-2026-0140', item: 'Caliper Body, Machined', qty: 500, status: 'ok' },
  { id: '3', code: 'WO-2026-0141', item: 'Caliper Body, Machined', qty: 312, status: 'warn' },
  { id: '4', code: 'WO-2026-0144', item: 'Master Cylinder', qty: 24, status: 'bad' },
]

const DEMO_COLS: OpTableColumn<DemoRow>[] = [
  { id: 'code', label: 'WO Code', sortable: true, width: 140 },
  { id: 'item', label: 'Item', sortable: true },
  { id: 'qty', label: 'Qty', num: true, sortable: true, width: 80 },
  {
    id: 'status',
    label: 'Status',
    width: 100,
    render: (r) => <StatusBadge tone={r.status}>{r.status}</StatusBadge>,
  },
]

const AUDIT_DEMO: AuditTimelineEntry[] = [
  {
    id: '1',
    at: new Date('2026-05-02T14:28:47'),
    actor: 'M. Conti',
    action: 'Pezzo #168 marcato OK',
    entity: 'WO-2026-0142',
    tone: 'ok',
  },
  {
    id: '2',
    at: new Date('2026-05-02T14:24:12'),
    actor: 'M. Conti',
    action: 'NCR aperto su pezzo #167',
    entity: 'NCR-2026-0019',
    tone: 'bad',
  },
  {
    id: '3',
    at: new Date('2026-05-02T11:02:09'),
    actor: 'L. Verdi',
    action: 'Revisione BOM applicata',
    tone: 'warn',
    diff: [
      { field: 'bleeder_valve', before: '1.000', after: '1.005' },
      { field: 'overage_pct', before: '0', after: '0.5' },
    ],
  },
  {
    id: '4',
    at: new Date('2026-05-02T13:08:00'),
    actor: 'system',
    action: 'Cambio turno A → B',
    tone: 'neutral',
  },
  {
    id: '5',
    at: new Date('2026-05-02T06:42:18'),
    actor: 'L. Verdi',
    action: 'WO rilasciato',
    entity: 'SO-2026-0089',
    tone: 'info',
  },
]

function ShowcaseInner() {
  const [activeTab, setActiveTab] = React.useState<Tab>('Components')
  const [inputVal, setInputVal] = React.useState('')
  const [selectVal, setSelectVal] = React.useState('')

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between px-6 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <picture>
            <source srcSet="/brand/logo-dark.svg" media="(prefers-color-scheme: dark)" />
            <img src="/brand/logo-light.svg" alt="Reflexallen" className="h-8" />
          </picture>
          <span className="text-ink-3 text-sm">Design System Showcase</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="px-6 pt-4">
        <Tabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          value={activeTab}
          onChange={(v) => setActiveTab(v as Tab)}
        />
      </div>

      <main className="px-6 py-6 space-y-10 max-w-5xl">
        {activeTab === 'Components' && (
          <ComponentsTab
            inputVal={inputVal}
            setInputVal={setInputVal}
            selectVal={selectVal}
            setSelectVal={setSelectVal}
          />
        )}
        {activeTab === 'Patterns' && <PatternsTab />}
        {activeTab === 'Detail' && <DetailTab />}
        {activeTab === 'Dashboard' && <DashboardTab />}
        {activeTab === 'Colors' && <ColorsTab />}
        {activeTab === 'Typography' && <TypographyTab />}
      </main>
    </div>
  )
}

export default function ShowcasePage() {
  return (
    <ToastProvider>
      <ShowcaseInner />
    </ToastProvider>
  )
}

function ComponentsTab({
  inputVal,
  setInputVal,
  selectVal,
  setSelectVal,
}: {
  inputVal: string
  setInputVal: (v: string) => void
  selectVal: string
  setSelectVal: (v: string) => void
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [modalOpen, setModalOpen] = React.useState(false)
  const { show } = useToast()

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-4">Button</h2>
        <div className="space-y-3">
          {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-ink-3 w-20">{variant}</span>
              {(['sm', 'md', 'lg', 'hmi'] as const).map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size}
                </Button>
              ))}
              <Button variant={variant} disabled>disabled</Button>
              <Button variant={variant} loading>loading</Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Badge</h2>
        <div className="flex flex-wrap gap-2">
          {(['neutral', 'ok', 'warn', 'bad', 'info', 'accent'] as const).map((tone) => (
            <Badge key={tone} tone={tone}>{tone}</Badge>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">StatusBadge</h2>
        <div className="flex flex-wrap gap-2">
          {(['ok', 'warn', 'bad', 'info'] as const).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">PriorityBadge</h2>
        <div className="flex flex-wrap gap-2">
          {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
            <PriorityBadge key={p} priority={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">PhaseBadge</h2>
        <div className="flex flex-wrap gap-2">
          {(['inbound', 'setup', 'production', 'quality_control', 'outbound', 'teardown'] as const).map((p) => (
            <PhaseBadge key={p} phase={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Dot</h2>
        <div className="flex flex-wrap gap-3 items-center">
          {(['ok', 'warn', 'bad', 'info', 'neutral', 'accent'] as const).map((tone) => (
            <div key={tone} className="flex items-center gap-1.5">
              <Dot tone={tone} />
              <span className="text-sm">{tone}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Drawer / Modal / Toast (PROMPT_DS_LIFT D1)</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDrawerOpen(true)}>Apri Drawer</Button>
          <Button onClick={() => setModalOpen(true)}>Apri Modal</Button>
          <Button variant="secondary" onClick={() => show('Salvataggio riuscito', 'ok')}>
            Toast OK
          </Button>
          <Button variant="secondary" onClick={() => show('Attenzione: prepreg out-time vicino al limite', 'warn')}>
            Toast Warn
          </Button>
          <Button variant="secondary" onClick={() => show('Errore di connessione', 'bad')}>
            Toast Bad
          </Button>
        </div>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Dettaglio articolo"
          subtitle="ITEM-CALIPER-001"
          actions={
            <>
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Annulla</Button>
              <Button onClick={() => setDrawerOpen(false)}>Salva</Button>
            </>
          }
        >
          <p className="text-sm text-ink-2">
            Drawer additivo: <code>subtitle</code>, <code>actions</code> alias di <code>footer</code>,
            focus trap, motion-safe per <code>prefers-reduced-motion</code>.
          </p>
        </Drawer>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Conferma azione"
          description="Modal con focus trap, body scroll lock, motion-safe."
          actions={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Annulla</Button>
              <Button onClick={() => setModalOpen(false)}>Conferma</Button>
            </>
          }
        >
          <p className="text-sm text-ink-2">
            Modal con <code>actions</code> alias additivo, body scroll bloccato mentre aperto.
          </p>
        </Modal>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Card</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <Card.Header>Card Header</Card.Header>
            <Card.Body>Card body content with some text to demonstrate the layout.</Card.Body>
            <Card.Footer>
              <Button size="sm" variant="secondary">Cancel</Button>
              <Button size="sm">Confirm</Button>
            </Card.Footer>
          </Card>
          <Card padded>
            <p className="text-sm text-ink-2">Padded card variant with no header/footer.</p>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Form Elements</h2>
        <div className="space-y-4 max-w-sm">
          <Field label="Normal input" hint="Enter a value" required>
            <Input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type here…"
            />
          </Field>
          <Field label="Error state">
            <Input value="bad value" error="This field is invalid" onChange={() => undefined} />
          </Field>
          <Field label="Select example">
            <Select value={selectVal} onChange={(e) => setSelectVal(e.target.value)}>
              <option value="">Choose…</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </Select>
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Progress</h2>
        <div className="space-y-2 max-w-sm">
          <Progress value={30} max={100} showLabel />
          <Progress value={65} max={100} tone="ok" showLabel />
          <Progress value={80} max={100} tone="warn" showLabel />
          <Progress value={20} max={100} tone="bad" showLabel />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">KPI</h2>
        <div className="flex flex-wrap gap-4">
          <KPI label="OEE" value="87.4" unit="%" trend="up" tone="ok" />
          <KPI label="Scrap Rate" value="2.1" unit="%" trend="down" tone="bad" />
          <KPI label="Cycle Time" value="48" unit="s" trend="flat" />
          <KPI label="Produced" value="1240" unit="pz" sub="target 1500" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Skeleton</h2>
        <div className="space-y-2 max-w-sm">
          <Skeleton h="1rem" className="w-3/4" />
          <Skeleton h="0.75rem" className="w-full" />
          <Skeleton h="0.75rem" className="w-5/6" />
        </div>
      </section>
    </>
  )
}

function PatternsTab() {
  const [view, setView] = React.useState<ViewMode>('list')
  const [opSearch, setOpSearch] = React.useState('')
  const [opSel, setOpSel] = React.useState(new Set<string>())
  const [opActiveView, setOpActiveView] = React.useState('all')

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-4">ViewSwitcher</h2>
        <ViewSwitcher
          value={view}
          onChange={setView}
          views={['list', 'card', 'flow', 'gantt', 'calendar']}
        />
        <div className="mt-2 text-xs text-ink-3 font-mono">selected: {view}</div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">TreeNode</h2>
        <div className="border border-line rounded-2 p-2 max-w-md space-y-0.5 bg-paper">
          <TreeNode icon={Factory} label="Stabilimento Modena" hasChildren expanded depth={0} status="ok" />
          <TreeNode icon={Package} label="Area Magazzino" hasChildren expanded depth={1} metric={{ value: 72, tone: 'ok' }} status="ok" />
          <TreeNode icon={Package} label="Materie Prime" hasChildren depth={2} metric={{ value: 58, tone: 'ok' }} status="ok" />
          <TreeNode icon={Package} label="Prodotti Finiti" hasChildren depth={2} metric={{ value: 41, tone: 'warn' }} status="warn" />
          <TreeNode icon={Factory} label="Area Produzione" hasChildren expanded depth={1} status="ok" />
          <TreeNode icon={Factory} label="Test & Collaudo" hasChildren depth={2} match="Test" status="warn" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">EmptyState</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-line rounded-2 bg-paper-2">
            <EmptyState kind="select" title="Seleziona un elemento dall'albero" body="oppure clicca un nodo per aprire il dettaglio" />
          </div>
          <div className="border border-line rounded-2 bg-paper-2">
            <EmptyState
              kind="no-results"
              title="Nessun risultato"
              body="Prova a rimuovere un filtro o modificare la ricerca."
              cta={{ label: 'Reset filtri', onClick: () => undefined }}
            />
          </div>
          <div className="border border-line rounded-2 bg-paper-2">
            <EmptyState
              kind="no-data"
              title="Nessun work order oggi"
              cta={{ label: 'Nuovo WO', onClick: () => undefined }}
            />
          </div>
          <div className="border border-line rounded-2 bg-paper-2">
            <EmptyState
              kind="error"
              title="Impossibile caricare"
              body="Connessione MES interrotta. Riprova tra qualche secondo."
              cta={{ label: 'Riprova', onClick: () => undefined }}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">SplitView</h2>
        <div className="border border-line rounded-2 overflow-hidden h-[300px]">
          <SplitView
            tree={
              <div className="p-2 space-y-0.5">
                <TreeNode icon={Factory} label="Stabilimento" hasChildren expanded depth={0} status="ok" />
                <TreeNode icon={Package} label="WC-A2 Assembly" depth={1} status="ok" selected />
                <TreeNode icon={Package} label="WC-B1 CNC" depth={1} status="warn" />
              </div>
            }
            detail={
              <div className="p-6">
                <EmptyState kind="select" title="Seleziona un work center" body="oppure usa la ricerca" compact />
              </div>
            }
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">RegistryTile (card grid)</h2>
        <div className="grid grid-cols-3 gap-3">
          <RegistryTile code="WC-A2" title="Assembly Line 2" sub="Asse Pneumatico" status="ok" statusLabel="OK" kpi="81%" kpiLabel="OEE" />
          <RegistryTile code="WC-B1" title="CNC Cell 1" sub="CFRP Composites" status="warn" statusLabel="Warn" kpi="76%" kpiLabel="OEE" />
          <RegistryTile code="WC-C1" title="Assembly Line 1" sub="Pneumatic Air" status="bad" statusLabel="Bad" kpi="62%" kpiLabel="OEE" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">OperationalTable</h2>
        <OperationalTable<DemoRow>
          rows={DEMO_ROWS}
          columns={DEMO_COLS}
          views={[
            { id: 'all', label: 'Tutti', count: 4 },
            { id: 'progress', label: 'In progress', count: 2, dot: 'info' },
            { id: 'risk', label: 'A rischio', count: 1, dot: 'warn' },
          ]}
          activeView={opActiveView}
          onViewChange={setOpActiveView}
          search={opSearch}
          onSearchChange={setOpSearch}
          searchPlaceholder="Cerca codice o item…"
          filters={[{ field: 'Status', op: 'is', value: 'In progress' }]}
          selection={opSel}
          onSelectionChange={setOpSel}
          bulkActions={[
            { id: 'delete', label: 'Elimina', icon: Trash2, tone: 'bad', onClick: () => undefined },
          ]}
          rowActions={() => [
            { id: 'view', label: 'Apri dettaglio', icon: Eye, onClick: () => undefined },
            { id: 'edit', label: 'Modifica', icon: Pencil, onClick: () => undefined },
            { id: 'del', label: 'Elimina', icon: Trash2, tone: 'bad', divider: true, onClick: () => undefined },
          ]}
        />
      </section>
    </>
  )
}

function DetailTab() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-4">DetailHeader</h2>
        <div className="border border-line rounded-2 overflow-hidden">
          <DetailHeader
            breadcrumb={
              <>
                <button className="hover:text-ink">Production</button>
                <span>/</span>
                <button className="hover:text-ink">Work Orders</button>
                <span>/</span>
                <span className="text-ink">WO-2026-0142</span>
              </>
            }
            title="WO-2026-0142"
            statusBadge={<StatusBadge tone="info">In progress</StatusBadge>}
            priorityBadge={<PriorityBadge priority="high" />}
            subtitle="Brake Caliper Assembly · 240 pcs · WC-A2 · Due 14:30 today"
            actions={
              <>
                <Button variant="secondary" size="sm">Pause</Button>
                <Button size="sm">Complete WO</Button>
              </>
            }
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">DetailBody</h2>
        <div className="border border-line rounded-2 overflow-hidden h-[300px]">
          <DetailBody
            main={
              <div className="p-5 space-y-3">
                <h3 className="font-semibold">Production progress</h3>
                <p className="text-sm text-ink-2">Main column — typically the active tab content.</p>
                <Progress value={70} max={100} tone="ok" showLabel />
              </div>
            }
            sidebar={
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-ink-3">Riferimenti</div>
                  <div className="text-sm font-mono text-ink mt-1">SO-2026-0089</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-ink-3">Operatore</div>
                  <div className="text-sm text-ink mt-1">M. Conti</div>
                </div>
              </div>
            }
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">AuditTimeline</h2>
        <div className="border border-line rounded-2 p-4 bg-paper">
          <AuditTimeline entries={AUDIT_DEMO} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Tabs (count + dot + kbd)</h2>
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'progress', label: 'Progress', count: 240 },
            { id: 'bom', label: 'BOM', count: 12 },
            { id: 'ncr', label: 'NCRs', count: 1, dot: 'warn' },
            { id: 'open', label: 'Apri', kbd: 'Ctrl+O' },
          ]}
          value="overview"
          onChange={() => undefined}
        />
      </section>
    </>
  )
}

function DashboardTab() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-4">KpiHero</h2>
        <div className="grid grid-cols-4 gap-3">
          <KpiHero big tone="accent" label="Plant OEE" value="78.4" unit="%" sub="Target 82%" trend="down" trendLabel="-3.6 pts" />
          <KpiHero big label="Throughput" value="312" sub="pieces / hour" trend="up" trendLabel="+4.2%" />
          <KpiHero big label="Active WOs" value="8" sub="2 at risk · 1 hold" />
          <KpiHero big ok label="FPY today" value="94.0" unit="%" sub="target ≥ 92%" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">PhaseChip</h2>
        <div className="flex gap-1.5 flex-wrap">
          <PhaseChip label="Inbound" phase="inbound" done />
          <PhaseChip label="Setup" phase="setup" done />
          <PhaseChip label="Production" phase="production" active />
          <PhaseChip label="QC" phase="qc" />
          <PhaseChip label="Outbound" phase="outbound" />
          <PhaseChip label="Teardown" phase="teardown" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">WCCard</h2>
        <div className="grid grid-cols-2 gap-3">
          <WCCard code="WC-A2" name="Assembly Line 2" wo="WO-2026-0142" q={{ current: 168, target: 240 }} pct={70} oee={81} status="ok" op="M. Conti" />
          <WCCard code="WC-B1" name="CNC Cell 1" wo="WO-2026-0141" q={{ current: 312, target: 400 }} pct={78} oee={76} status="warn" op="L. Bianchi" />
          <WCCard code="WC-C1" name="Assembly Line 1" wo="WO-2026-0144" q={{ current: 24, target: 80 }} pct={30} oee={62} status="bad" op="A. Russo" />
          <WCCard code="WC-D1" name="Quality Lab" status="idle" op="Idle · Ready" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">AlertBanner</h2>
        <div className="space-y-3">
          <AlertBanner tone="bad" kicker="Critico · 2 minuti fa" title="Leak test fallito su WC-C1 · WO-2026-0144" body="L'operatore richiede approvazione supervisore." cta={{ label: 'Apri NCR', onClick: () => undefined }} />
          <AlertBanner tone="warn" kicker="Attenzione" title="Out-time prepreg vicino al limite" />
          <AlertBanner tone="info" kicker="Info" title="Cambio turno tra 30 minuti" />
          <AlertBanner tone="ok" kicker="OK" title="WO-2026-0140 completato · FPY 96%" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">LiveAlert (feed)</h2>
        <div className="border border-line rounded-2 p-4 bg-paper max-w-sm space-y-2.5">
          <div className="text-[10px] uppercase font-semibold text-ink-3">Live alerts</div>
          <LiveAlert tone="bad" message="Leak test fallito · WO-0141" time="2m fa" isNew />
          <LiveAlert tone="warn" message="WC-A2 · cycle time +8%" time="14m fa" />
          <LiveAlert tone="info" message="Box BOX-PLT-001234 sigillato" time="22m fa" />
          <LiveAlert tone="ok" message="WO-0140 completato · FPY 96%" time="38m fa" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">PlantMap</h2>
        <div className="border border-line rounded-2 overflow-hidden">
          <PlantMap
            width={680}
            height={360}
            zones={[
              { id: 'p', x: 20, y: 20, width: 380, height: 160, label: 'Area Produzione', phase: 'production' },
              { id: 'q', x: 420, y: 20, width: 240, height: 160, label: 'Test & Collaudo', phase: 'qc' },
              { id: 'i', x: 20, y: 200, width: 640, height: 130, label: 'Magazzino', phase: 'inbound' },
            ]}
            nodes={[
              { id: 'a2', x: 50, y: 70, code: 'WC-A2', name: 'Assembly L2', status: 'ok', kpi: '168/240 · 70%' },
              { id: 'b1', x: 210, y: 70, code: 'WC-B1', name: 'CNC Cell 1', status: 'warn', kpi: '312/400 · 78%' },
              { id: 'c1', x: 370, y: 70, code: 'WC-C1', name: 'Assembly L1', status: 'bad', kpi: '24/80 · 30%' },
              { id: 'd1', x: 460, y: 70, code: 'WC-D1', name: 'QC Lab', status: 'idle', kpi: 'idle' },
              { id: 'mp', x: 50, y: 250, code: 'WH-MP', name: 'Materie Prime', status: 'ok', kpi: '58% fill' },
              { id: 'pf', x: 210, y: 250, code: 'WH-PF', name: 'Prodotti Finiti', status: 'ok', kpi: '41% fill' },
            ]}
            onNodeClick={(n) => console.log('plant node clicked', n)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Canvas suite (standalone, NOT React Flow)</h2>
        <div className="border border-line rounded-2 overflow-hidden relative">
          <CanvasGrid height={360}>
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              <ArrowDefs />
              <CanvasEdge from={{ x: 200, y: 90 }} to={{ x: 280, y: 90 }} />
              <CanvasEdge from={{ x: 460, y: 90 }} to={{ x: 540, y: 90 }} tone="accent" label="approved" />
              <CanvasEdge from={{ x: 460, y: 90 }} to={{ x: 540, y: 230 }} kind="orthogonal" tone="bad" label="rejected" />
            </svg>
            <GenericNode x={20} y={60} kicker="trigger" title="WO released" sub="auto" status="ok" ports={['out']} />
            <GenericNode x={280} y={60} kicker="form" title="Operator check-in" sub="3 fields" status="ok" selected />
            <GenericNode x={540} y={60} kicker="auto" title="Generate route" sub="based on item" status="ok" />
            <GenericNode x={540} y={200} kicker="hold" title="Notify supervisor" sub="missing approval" status="bad" invalid />
            <CanvasToolbar
              tools={[
                { id: 'pan', icon: Eye, label: 'Pan' },
                { id: 'select', icon: Plus, label: 'Select', active: true },
                { id: 'add', icon: Plus, label: 'Add' },
              ]}
            />
            <CanvasStateBar tone="warn" status="Modifiche non salvate" counts="12 nodi · 14 archi" />
            <Minimap
              nodes={[
                { x: 12, y: 10 },
                { x: 38, y: 22, highlighted: true },
                { x: 64, y: 14 },
                { x: 38, y: 48 },
              ]}
              viewport={{ x: 24, y: 8, width: 60, height: 36 }}
            />
            <ZoomControls zoomPercent={90} />
          </CanvasGrid>
        </div>
      </section>
    </>
  )
}

function ColorsTab() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-4">Surfaces</h2>
        <div className="flex gap-2">
          {[
            { name: 'paper', cls: 'bg-paper border border-line' },
            { name: 'paper-2', cls: 'bg-paper-2' },
            { name: 'paper-3', cls: 'bg-paper-3' },
          ].map(({ name, cls }) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className={`w-20 h-14 rounded-2 ${cls}`} />
              <span className="text-xs text-ink-3">{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Status Colors</h2>
        {(['ok', 'warn', 'bad', 'info'] as const).map((tone) => (
          <div key={tone} className="flex gap-2 mb-2 items-center">
            <span className="text-sm text-ink-3 w-12">{tone}</span>
            <div className={`w-14 h-10 rounded-2 bg-${tone}`} />
            <div className={`w-14 h-10 rounded-2 bg-${tone}-soft`} />
            <div className={`w-14 h-10 rounded-2 bg-${tone}-ink`} />
            <span className="text-xs text-ink-3">full / soft / ink</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Phase Colors</h2>
        <div className="flex flex-wrap gap-3">
          {(['inbound', 'setup', 'production', 'qc', 'outbound', 'teardown'] as const).map((p) => (
            <div key={p} className="flex flex-col items-center gap-1">
              <div className={`w-16 h-10 rounded-2 bg-c-${p}`} />
              <span className="text-xs text-ink-3">{p}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Accent</h2>
        <div className="flex gap-2">
          {[
            { name: 'accent', cls: 'bg-accent' },
            { name: 'accent-2', cls: 'bg-accent-2' },
            { name: 'accent-soft', cls: 'bg-accent-soft' },
          ].map(({ name, cls }) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className={`w-20 h-14 rounded-2 ${cls}`} />
              <span className="text-xs text-ink-3">{name}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function TypographyTab() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-4">Avenir Next Cyr — Font Weights</h2>
        <div className="space-y-3">
          {[
            { weight: 'font-light', label: 'Light (300)' },
            { weight: 'font-normal', label: 'Regular (400)' },
            { weight: 'font-medium', label: 'Medium (500)' },
            { weight: 'font-semibold', label: 'Demi Bold (600)' },
            { weight: 'font-bold', label: 'Bold (700)' },
          ].map(({ weight, label }) => (
            <div key={weight} className={`text-2xl ${weight}`}>
              {label} — The quick brown fox
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Type Scale</h2>
        <div className="space-y-2">
          {[
            { cls: 'text-2xl', label: '2xl — 22px' },
            { cls: 'text-xl', label: 'xl — 18px' },
            { cls: 'text-lg', label: 'lg — 15px' },
            { cls: 'text-base', label: 'base — 13px' },
            { cls: 'text-sm', label: 'sm — 12px' },
            { cls: 'text-xs', label: 'xs — 10.5px' },
          ].map(({ cls, label }) => (
            <p key={cls} className={`${cls} text-ink`}>{label} — Reflexallen MES</p>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Ink Scale</h2>
        <div className="space-y-1">
          {[
            { cls: 'text-ink', label: 'ink — Primary text' },
            { cls: 'text-ink-2', label: 'ink-2 — Secondary text' },
            { cls: 'text-ink-3', label: 'ink-3 — Tertiary / labels' },
            { cls: 'text-ink-4', label: 'ink-4 — Disabled / placeholders' },
          ].map(({ cls, label }) => (
            <p key={cls} className={`text-base ${cls}`}>{label}</p>
          ))}
        </div>
      </section>
    </>
  )
}
