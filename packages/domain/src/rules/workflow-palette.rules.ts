export type StepCategoryId =
  | 'identification'
  | 'production'
  | 'quality_control'
  | 'logistics'
  | 'service'
  | 'safety'
  | 'documentation'

export type StepKindId =
  | 'manual'
  | 'automatic'
  | 'guided'
  | 'parallel'
  | 'sub_flow'

export interface StepCategoryDescriptor {
  readonly id: StepCategoryId
  readonly labelIt: string
  readonly descriptionIt: string
  readonly iconName: string
}

export interface StepKindDescriptor {
  readonly id: StepKindId
  readonly labelIt: string
  readonly descriptionIt: string
  readonly iconName: string
}

export const STEP_CATEGORIES: readonly StepCategoryDescriptor[] = [
  {
    id: 'identification',
    labelIt: 'Identificazione',
    descriptionIt: 'Scansione, etichetta, registrazione',
    iconName: 'ScanLine',
  },
  {
    id: 'production',
    labelIt: 'Produzione',
    descriptionIt: 'Assemblaggio, lavorazione',
    iconName: 'Cog',
  },
  {
    id: 'quality_control',
    labelIt: 'Controllo Qualità',
    descriptionIt: 'Ispezione, test',
    iconName: 'ClipboardCheck',
  },
  {
    id: 'logistics',
    labelIt: 'Logistica',
    descriptionIt: 'Movimentazione, imballaggio, spedizione',
    iconName: 'Truck',
  },
  {
    id: 'service',
    labelIt: 'Servizio',
    descriptionIt: 'Setup, manutenzione',
    iconName: 'Wrench',
  },
  {
    id: 'safety',
    labelIt: 'Sicurezza',
    descriptionIt: 'Lockout, DPI',
    iconName: 'Shield',
  },
  {
    id: 'documentation',
    labelIt: 'Documentazione',
    descriptionIt: 'Foto, firma',
    iconName: 'FileText',
  },
] as const

export const STEP_KINDS: readonly StepKindDescriptor[] = [
  {
    id: 'manual',
    labelIt: 'Manuale',
    descriptionIt: 'Azione operatore',
    iconName: 'Hand',
  },
  {
    id: 'automatic',
    labelIt: 'Automatico',
    descriptionIt: 'Guidato dal dispositivo',
    iconName: 'Cpu',
  },
  {
    id: 'guided',
    labelIt: 'Guidato',
    descriptionIt: 'Manuale con dispositivo',
    iconName: 'HelpCircle',
  },
  {
    id: 'parallel',
    labelIt: 'Parallelo',
    descriptionIt: 'Pausa / ripresa',
    iconName: 'Pause',
  },
  {
    id: 'sub_flow',
    labelIt: 'Sotto-flusso',
    descriptionIt: 'Recupero, ecc.',
    iconName: 'GitBranch',
  },
] as const

export function getStepCategoryDescriptor(
  id: string,
): StepCategoryDescriptor | undefined {
  return STEP_CATEGORIES.find((c) => c.id === id)
}

export function getStepKindDescriptor(
  id: string,
): StepKindDescriptor | undefined {
  return STEP_KINDS.find((k) => k.id === id)
}
