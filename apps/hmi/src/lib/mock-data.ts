/**
 * Hardcoded mock data for HMI step-execution demo.
 * MOCK_OPERATORS removed in PROMPT_5_FULL D2 (auth is now real, see /api/auth).
 * MOCK_WORK_ORDERS + step templates kept until PROMPT_5_FULL D3 wires real
 * step execution via XState + persisted StepExecution records.
 */

export type StepStatus = 'pending' | 'running' | 'done' | 'blocked'

export type StepCategory =
  | 'production'
  | 'identification'
  | 'quality_control'
  | 'logistics'

export interface MockWorkOrder {
  id: string
  code: string
  itemCode: string
  itemName: string
  quantity: number
  completed: number
  assignedTo: string
  priority: 'low' | 'normal' | 'high'
  status: 'ready' | 'in_progress'
  startedAt: string | null
}

export interface MockStep {
  id: string
  woId: string
  order: number
  name: string
  category: StepCategory
  instructions: string
  standardTimeSec: number
  status: StepStatus
  skillCode?: string
  deviceCode?: string
}

export const MOCK_WORK_ORDERS: MockWorkOrder[] = [
  // ── OP-001 Marco Rossi (4 WOs) ───────────────────────────────────────────
  {
    id: 'wo-2026-0001',
    code: 'WO-2026-0001',
    itemCode: 'FG-PNEU-5M-8MM',
    itemName: 'Tubo pneumatico PA12 5m ⌀8mm',
    quantity: 50,
    completed: 12,
    assignedTo: 'OP-001',
    priority: 'high',
    status: 'in_progress',
    startedAt: '2026-04-30T08:00:00Z',
  },
  {
    id: 'wo-2026-0002',
    code: 'WO-2026-0002',
    itemCode: 'FG-PNEU-10M-8MM',
    itemName: 'Tubo pneumatico PA12 10m ⌀8mm',
    quantity: 30,
    completed: 0,
    assignedTo: 'OP-001',
    priority: 'normal',
    status: 'ready',
    startedAt: null,
  },
  {
    id: 'wo-2026-0003',
    code: 'WO-2026-0003',
    itemCode: 'FG-PNEU-5M-10MM',
    itemName: 'Tubo pneumatico PA12 5m ⌀10mm',
    quantity: 100,
    completed: 45,
    assignedTo: 'OP-001',
    priority: 'high',
    status: 'in_progress',
    startedAt: '2026-04-30T07:30:00Z',
  },
  {
    id: 'wo-2026-0004',
    code: 'WO-2026-0004',
    itemCode: 'FG-PNEU-5M-8MM',
    itemName: 'Tubo pneumatico PA12 5m ⌀8mm',
    quantity: 20,
    completed: 0,
    assignedTo: 'OP-001',
    priority: 'low',
    status: 'ready',
    startedAt: null,
  },
  // ── OP-002 Laura Ferrari (2 WOs, QC/TEST/PACK) ───────────────────────────
  {
    id: 'wo-2026-0005',
    code: 'WO-2026-0005',
    itemCode: 'FG-PNEU-10M-8MM',
    itemName: 'Tubo pneumatico PA12 10m ⌀8mm',
    quantity: 40,
    completed: 25,
    assignedTo: 'OP-002',
    priority: 'normal',
    status: 'in_progress',
    startedAt: '2026-04-30T08:15:00Z',
  },
  {
    id: 'wo-2026-0006',
    code: 'WO-2026-0006',
    itemCode: 'FG-PNEU-5M-8MM',
    itemName: 'Tubo pneumatico PA12 5m ⌀8mm',
    quantity: 60,
    completed: 0,
    assignedTo: 'OP-002',
    priority: 'high',
    status: 'ready',
    startedAt: null,
  },
  // ── OP-003 Giovanni Bianchi (2 WOs, FORKLIFT/WAREHOUSE/PACK) ─────────────
  {
    id: 'wo-2026-0007',
    code: 'WO-2026-0007',
    itemCode: 'FG-PNEU-5M-10MM',
    itemName: 'Tubo pneumatico PA12 5m ⌀10mm',
    quantity: 80,
    completed: 35,
    assignedTo: 'OP-003',
    priority: 'normal',
    status: 'in_progress',
    startedAt: '2026-04-30T07:00:00Z',
  },
  {
    id: 'wo-2026-0008',
    code: 'WO-2026-0008',
    itemCode: 'FG-PNEU-5M-8MM',
    itemName: 'Tubo pneumatico PA12 5m ⌀8mm',
    quantity: 25,
    completed: 0,
    assignedTo: 'OP-003',
    priority: 'low',
    status: 'ready',
    startedAt: null,
  },
  // ── OP-004 Sara Conti (2 WOs, EXT/TEST) ──────────────────────────────────
  {
    id: 'wo-2026-0009',
    code: 'WO-2026-0009',
    itemCode: 'FG-PNEU-10M-8MM',
    itemName: 'Tubo pneumatico PA12 10m ⌀8mm',
    quantity: 50,
    completed: 18,
    assignedTo: 'OP-004',
    priority: 'normal',
    status: 'in_progress',
    startedAt: '2026-04-30T08:45:00Z',
  },
  {
    id: 'wo-2026-0010',
    code: 'WO-2026-0010',
    itemCode: 'FG-PNEU-5M-10MM',
    itemName: 'Tubo pneumatico PA12 5m ⌀10mm',
    quantity: 30,
    completed: 0,
    assignedTo: 'OP-004',
    priority: 'normal',
    status: 'ready',
    startedAt: null,
  },
]

type Template = 'extrusion' | 'assembly' | 'logistics' | 'test'

const WO_TEMPLATES: Record<string, Template> = {
  'wo-2026-0001': 'extrusion',
  'wo-2026-0002': 'extrusion',
  'wo-2026-0003': 'assembly',
  'wo-2026-0004': 'extrusion',
  'wo-2026-0005': 'test',
  'wo-2026-0006': 'assembly',
  'wo-2026-0007': 'logistics',
  'wo-2026-0008': 'logistics',
  'wo-2026-0009': 'test',
  'wo-2026-0010': 'extrusion',
}

type StepSeed = Omit<MockStep, 'id' | 'woId' | 'order' | 'status'>

const TEMPLATE_STEPS: Record<Template, StepSeed[]> = {
  // Full extrusion + crimp + leak test (7 steps)
  extrusion: [
    {
      name: 'Scansiona QR ordine di lavoro',
      category: 'identification',
      instructions: 'Scansiona il QR code stampato sull’ordine di lavoro per confermare la presa in carico.',
      standardTimeSec: 30,
    },
    {
      name: 'Preleva granulo PA12',
      category: 'logistics',
      instructions: 'Preleva il sacco di granulo PA12 dal magazzino materie prime e portalo all’estrusore.',
      standardTimeSec: 120,
      skillCode: 'FORKLIFT',
    },
    {
      name: 'Avvia estrusore EXT-001',
      category: 'production',
      instructions: 'Carica la ricetta selezionata e avvia il ciclo di estrusione. Verifica temperatura e pressione.',
      standardTimeSec: 1800,
      skillCode: 'EXT',
      deviceCode: 'EXT-001',
    },
    {
      name: 'Identifica primo pezzo',
      category: 'identification',
      instructions: 'Identifica il primo pezzo prodotto e applica l’etichetta seriale.',
      standardTimeSec: 60,
    },
    {
      name: 'Misura diametro',
      category: 'quality_control',
      instructions: 'Esegui misurazione dimensionale con calibro digitale. Tolleranza ±0.05 mm.',
      standardTimeSec: 90,
      skillCode: 'QC',
    },
    {
      name: 'Crimpaggio raccordi',
      category: 'production',
      instructions: 'Esegui il crimpaggio dei raccordi alle estremità del tubo.',
      standardTimeSec: 240,
      skillCode: 'ASSY',
      deviceCode: 'CRIMP-002',
    },
    {
      name: 'Test di tenuta',
      category: 'quality_control',
      instructions: 'Esegui il leak test a 6 bar per 30 secondi. Registra esito.',
      standardTimeSec: 180,
      skillCode: 'TEST',
      deviceCode: 'LEAK-TEST-001',
    },
  ],
  // Assembly + pack (5 steps)
  assembly: [
    {
      name: 'Scansiona badge stazione',
      category: 'identification',
      instructions: 'Scansiona il QR della stazione di assemblaggio per registrare l’avvio.',
      standardTimeSec: 20,
    },
    {
      name: 'Trasferisci semilavorato',
      category: 'logistics',
      instructions: 'Trasferisci il contenitore di semilavorati dalla zona buffer alla stazione.',
      standardTimeSec: 90,
    },
    {
      name: 'Ispezione visiva',
      category: 'quality_control',
      instructions: 'Verifica assenza di difetti superficiali, bave o anomalie cromatiche.',
      standardTimeSec: 60,
      skillCode: 'QC',
    },
    {
      name: 'Imballaggio',
      category: 'production',
      instructions: 'Confeziona i pezzi in sacchetto barriera + scatola.',
      standardTimeSec: 180,
      skillCode: 'PACK',
    },
    {
      name: 'Stampa etichetta',
      category: 'identification',
      instructions: 'Stampa e applica etichetta lotto sulla scatola.',
      standardTimeSec: 30,
    },
  ],
  // Logistics heavy (6 steps)
  logistics: [
    {
      name: 'Scansiona ubicazione',
      category: 'identification',
      instructions: 'Scansiona il QR dell’ubicazione di partenza in magazzino.',
      standardTimeSec: 20,
    },
    {
      name: 'Carica pallet',
      category: 'logistics',
      instructions: 'Carica il pallet sul muletto e verifica stabilità del carico.',
      standardTimeSec: 180,
      skillCode: 'FORKLIFT',
    },
    {
      name: 'Trasferisci a magazzino PF',
      category: 'logistics',
      instructions: 'Trasferisci il pallet dalla zona produzione al magazzino prodotti finiti.',
      standardTimeSec: 240,
      skillCode: 'FORKLIFT',
    },
    {
      name: 'Verifica integrità imballo',
      category: 'quality_control',
      instructions: 'Verifica che imballo e reggette siano integri e che le etichette siano leggibili.',
      standardTimeSec: 60,
      skillCode: 'QC',
    },
    {
      name: 'Etichetta pallet',
      category: 'identification',
      instructions: 'Applica etichetta pallet con codice ubicazione di destinazione.',
      standardTimeSec: 45,
    },
    {
      name: 'Stoccaggio finale',
      category: 'logistics',
      instructions: 'Posiziona il pallet nell’ubicazione assegnata e conferma a sistema.',
      standardTimeSec: 120,
      skillCode: 'WAREHOUSE',
    },
  ],
  // Test + QC (8 steps)
  test: [
    {
      name: 'Scansiona lotto',
      category: 'identification',
      instructions: 'Scansiona il QR del lotto da sottoporre a test.',
      standardTimeSec: 20,
    },
    {
      name: 'Carica ricetta test',
      category: 'production',
      instructions: 'Seleziona e carica la ricetta di test sulla macchina di prova.',
      standardTimeSec: 60,
      skillCode: 'TEST',
      deviceCode: 'LEAK-TEST-001',
    },
    {
      name: 'Test pressione 1 bar',
      category: 'quality_control',
      instructions: 'Esegui prova di tenuta a 1 bar per 60 secondi.',
      standardTimeSec: 120,
      skillCode: 'TEST',
    },
    {
      name: 'Test pressione 6 bar',
      category: 'quality_control',
      instructions: 'Esegui prova di tenuta a 6 bar per 90 secondi.',
      standardTimeSec: 180,
      skillCode: 'TEST',
    },
    {
      name: 'Test perdite',
      category: 'quality_control',
      instructions: 'Esegui test perdite con sensore differenziale. Soglia massima 0.05 mbar/s.',
      standardTimeSec: 120,
      skillCode: 'TEST',
    },
    {
      name: 'Documenta difetti',
      category: 'quality_control',
      instructions: 'Annota eventuali difetti riscontrati e classifica per gravità.',
      standardTimeSec: 60,
      skillCode: 'QC',
    },
    {
      name: 'Stampa report',
      category: 'identification',
      instructions: 'Stampa il report di test e applica al lotto.',
      standardTimeSec: 30,
    },
    {
      name: 'Spostamento a buffer OK',
      category: 'logistics',
      instructions: 'Sposta il lotto al buffer dei pezzi conformi.',
      standardTimeSec: 60,
    },
  ],
}

export function getMockSteps(woId: string): MockStep[] {
  const template = WO_TEMPLATES[woId]
  if (!template) return []
  return TEMPLATE_STEPS[template].map((seed, i) => ({
    ...seed,
    id: `${woId}-step-${i + 1}`,
    woId,
    order: i + 1,
    status: i === 0 ? 'running' : 'pending',
  }))
}

export function getWorkOrder(id: string): MockWorkOrder | null {
  return MOCK_WORK_ORDERS.find((wo) => wo.id === id) ?? null
}
