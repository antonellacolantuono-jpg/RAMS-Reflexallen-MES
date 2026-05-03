// PROMPT_PNE_4_FOCUSED D1 — Step action type catalog.
//
// Maps StepCategory → ActionType[] per MASTER_SPECIFICATION § 4.5.
// Used by the AddStepDialog Action Type selector to filter options to those
// valid for the resolved step category. Persisted as `Step.actionType` (string)
// in the DB; the catalog itself is authoritative for the editor.
//
// Adding/removing action types is documentation-only here: the DB stores the
// raw string and accepts any value (no enum constraint at the SQLite level).

export type StepCategory =
  | 'production'
  | 'logistics'
  | 'identification'
  | 'quality_control'
  | 'decision'
  | 'information'
  | 'setup'
  | 'teardown'
  | 'box'

export interface ActionTypeDescriptor {
  readonly id: string
  readonly labelIt: string
  readonly category: StepCategory
}

export const ACTION_TYPES_BY_CATEGORY: Readonly<
  Record<StepCategory, readonly ActionTypeDescriptor[]>
> = {
  production: [
    { id: 'assembly', labelIt: 'Assemblaggio', category: 'production' },
    { id: 'process', labelIt: 'Processo', category: 'production' },
    { id: 'device_run', labelIt: 'Esecuzione dispositivo', category: 'production' },
    { id: 'rework', labelIt: 'Rilavorazione', category: 'production' },
  ],
  logistics: [
    { id: 'move', labelIt: 'Sposta', category: 'logistics' },
    { id: 'transfer', labelIt: 'Trasferisci', category: 'logistics' },
    { id: 'load', labelIt: 'Carica', category: 'logistics' },
    { id: 'unload', labelIt: 'Scarica', category: 'logistics' },
  ],
  identification: [
    { id: 'scan_barcode', labelIt: 'Scansiona barcode', category: 'identification' },
    { id: 'scan_qr', labelIt: 'Scansiona QR', category: 'identification' },
    { id: 'scan_rfid', labelIt: 'Scansiona RFID', category: 'identification' },
    { id: 'scan_datamatrix', labelIt: 'Scansiona DataMatrix', category: 'identification' },
    { id: 'manual_id_entry', labelIt: 'Inserimento ID manuale', category: 'identification' },
    { id: 'print_label', labelIt: 'Stampa etichetta', category: 'identification' },
    { id: 'apply_label', labelIt: 'Applica etichetta', category: 'identification' },
    { id: 'verify_id', labelIt: 'Verifica identificativo', category: 'identification' },
  ],
  quality_control: [
    { id: 'visual_check', labelIt: 'Controllo visivo', category: 'quality_control' },
    { id: 'dimensional_check', labelIt: 'Controllo dimensionale', category: 'quality_control' },
    { id: 'functional_test', labelIt: 'Test funzionale', category: 'quality_control' },
    { id: 'sample_take', labelIt: 'Prelievo campione', category: 'quality_control' },
    { id: 'document_defect', labelIt: 'Documenta difetto', category: 'quality_control' },
  ],
  decision: [
    { id: 'auto_branch', labelIt: 'Ramo automatico', category: 'decision' },
    { id: 'manual_choice', labelIt: 'Scelta manuale', category: 'decision' },
    { id: 'condition_check', labelIt: 'Verifica condizione', category: 'decision' },
  ],
  information: [
    { id: 'read_sop', labelIt: 'Leggi SOP', category: 'information' },
    { id: 'safety_briefing', labelIt: 'Briefing sicurezza', category: 'information' },
    { id: 'view_video', labelIt: 'Visualizza video', category: 'information' },
    { id: 'view_drawing', labelIt: 'Visualizza disegno', category: 'information' },
  ],
  setup: [
    { id: 'verify_workstation', labelIt: 'Verifica postazione', category: 'setup' },
    { id: 'verify_skill', labelIt: 'Verifica competenza', category: 'setup' },
    { id: 'verify_tool', labelIt: 'Verifica utensile', category: 'setup' },
    { id: 'verify_material', labelIt: 'Verifica materiale', category: 'setup' },
    { id: 'load_recipe', labelIt: 'Carica ricetta', category: 'setup' },
    { id: 'first_piece', labelIt: 'Primo pezzo', category: 'setup' },
  ],
  teardown: [
    { id: 'unload_recipe', labelIt: 'Scarica ricetta', category: 'teardown' },
    { id: 'last_piece', labelIt: 'Ultimo pezzo', category: 'teardown' },
    { id: 'cleanup', labelIt: 'Pulizia', category: 'teardown' },
  ],
  box: [
    { id: 'pack_into_box', labelIt: 'Imballa in scatola', category: 'box' },
    { id: 'unpack_from_box', labelIt: 'Disimballa dalla scatola', category: 'box' },
    { id: 'seal_box', labelIt: 'Sigilla scatola', category: 'box' },
    { id: 'open_sealed_box', labelIt: 'Apri scatola sigillata', category: 'box' },
    { id: 'palletize_box', labelIt: 'Pallettizza scatola', category: 'box' },
    { id: 'depalletize_box', labelIt: 'Depallettizza scatola', category: 'box' },
    { id: 'inspect_box', labelIt: 'Ispeziona scatola', category: 'box' },
    { id: 'clean_box', labelIt: 'Pulisci scatola', category: 'box' },
    { id: 'select_empty_box', labelIt: 'Seleziona scatola vuota', category: 'box' },
    { id: 'validate_box_capacity', labelIt: 'Verifica capacità scatola', category: 'box' },
    { id: 'print_box_label', labelIt: 'Stampa etichetta scatola', category: 'box' },
  ],
}

export function getActionTypesForCategory(
  category: string,
): readonly ActionTypeDescriptor[] {
  if (category in ACTION_TYPES_BY_CATEGORY) {
    return ACTION_TYPES_BY_CATEGORY[category as StepCategory]
  }
  return []
}

export function getActionTypeDescriptor(
  actionType: string,
): ActionTypeDescriptor | undefined {
  for (const list of Object.values(ACTION_TYPES_BY_CATEGORY)) {
    const found = list.find((d) => d.id === actionType)
    if (found) return found
  }
  return undefined
}
