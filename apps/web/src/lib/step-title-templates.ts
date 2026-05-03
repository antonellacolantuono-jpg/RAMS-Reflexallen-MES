// PROMPT_PNE_4_FOCUSED D1 — Title + description templates per action type.
//
// When the operator picks an action type in AddStepDialog, the title and
// description fields autofill with a sensible Italian template. The operator
// can edit freely afterwards — autofill never locks the field.
//
// Resource code (when provided) is appended to the title via
// `buildAutofilledTitle`. Description templates are static prefixes that hint
// at the operator content but don't include resource codes (kept short to
// avoid noise during configuration).

export interface ActionTypeTemplate {
  readonly title: string
  readonly description: string
}

const TEMPLATES_IT: Readonly<Record<string, ActionTypeTemplate>> = {
  // production
  assembly: {
    title: 'Assembla',
    description: 'Eseguire l’operazione di assemblaggio secondo distinta base.',
  },
  process: {
    title: 'Processo',
    description: 'Eseguire la lavorazione di processo come specificato.',
  },
  device_run: {
    title: 'Avvia ciclo dispositivo',
    description: 'Avviare il ciclo del dispositivo e attendere l’esito.',
  },
  rework: {
    title: 'Rilavora',
    description: 'Eseguire l’operazione di rilavorazione sul pezzo.',
  },
  // logistics
  move: { title: 'Sposta', description: 'Spostare il materiale tra postazioni.' },
  transfer: { title: 'Trasferisci', description: 'Trasferire il materiale al destinatario.' },
  load: { title: 'Carica', description: 'Caricare il materiale nel contenitore.' },
  unload: { title: 'Scarica', description: 'Scaricare il materiale dal contenitore.' },
  // identification
  scan_barcode: { title: 'Scansiona barcode', description: 'Scansionare il barcode con il lettore.' },
  scan_qr: { title: 'Scansiona QR', description: 'Scansionare il codice QR con il lettore.' },
  scan_rfid: { title: 'Scansiona RFID', description: 'Avvicinare il tag RFID al lettore.' },
  scan_datamatrix: { title: 'Scansiona DataMatrix', description: 'Scansionare il codice DataMatrix.' },
  manual_id_entry: { title: 'Inserisci identificativo', description: 'Inserire manualmente l’identificativo.' },
  print_label: { title: 'Stampa etichetta', description: 'Stampare l’etichetta dalla stampante.' },
  apply_label: { title: 'Applica etichetta', description: 'Applicare l’etichetta sul pezzo.' },
  verify_id: { title: 'Verifica identificativo', description: 'Verificare la corrispondenza dell’identificativo.' },
  // quality_control
  visual_check: { title: 'Controllo visivo', description: 'Eseguire il controllo visivo per difetti.' },
  dimensional_check: { title: 'Controllo dimensionale', description: 'Verificare le quote dimensionali.' },
  functional_test: { title: 'Test funzionale', description: 'Eseguire il test funzionale.' },
  sample_take: { title: 'Prelievo campione', description: 'Prelevare un campione per analisi.' },
  document_defect: { title: 'Documenta difetto', description: 'Documentare il difetto rilevato con foto.' },
  // decision
  auto_branch: { title: 'Ramo automatico', description: 'Ramo automatico in base alla condizione.' },
  manual_choice: { title: 'Scelta manuale', description: 'Selezionare manualmente il ramo successivo.' },
  condition_check: { title: 'Verifica condizione', description: 'Verificare che la condizione sia soddisfatta.' },
  // information
  read_sop: { title: 'Leggi SOP', description: 'Leggere la procedura operativa standard.' },
  safety_briefing: { title: 'Briefing sicurezza', description: 'Eseguire il briefing di sicurezza.' },
  view_video: { title: 'Visualizza video', description: 'Visualizzare il video formativo.' },
  view_drawing: { title: 'Visualizza disegno', description: 'Consultare il disegno tecnico.' },
  // setup
  verify_workstation: { title: 'Verifica postazione', description: 'Verificare la corretta predisposizione della postazione.' },
  verify_skill: { title: 'Verifica competenza', description: 'Verificare il possesso della competenza richiesta.' },
  verify_tool: { title: 'Verifica utensile', description: 'Verificare la disponibilità dell’utensile.' },
  verify_material: { title: 'Verifica materiale', description: 'Verificare la disponibilità del materiale.' },
  load_recipe: { title: 'Carica ricetta', description: 'Caricare la ricetta sul dispositivo.' },
  first_piece: { title: 'Primo pezzo', description: 'Eseguire e validare il primo pezzo.' },
  // teardown
  unload_recipe: { title: 'Scarica ricetta', description: 'Scaricare la ricetta dal dispositivo.' },
  last_piece: { title: 'Ultimo pezzo', description: 'Eseguire e validare l’ultimo pezzo.' },
  cleanup: { title: 'Pulizia', description: 'Eseguire la pulizia della postazione.' },
  // box
  pack_into_box: { title: 'Imballa in scatola', description: 'Inserire i pezzi nella scatola.' },
  unpack_from_box: { title: 'Disimballa dalla scatola', description: 'Estrarre i pezzi dalla scatola.' },
  seal_box: { title: 'Sigilla scatola', description: 'Sigillare la scatola al completamento.' },
  open_sealed_box: { title: 'Apri scatola sigillata', description: 'Aprire la scatola sigillata documentando il motivo.' },
  palletize_box: { title: 'Pallettizza scatola', description: 'Posizionare la scatola sul pallet.' },
  depalletize_box: { title: 'Depallettizza scatola', description: 'Rimuovere la scatola dal pallet.' },
  inspect_box: { title: 'Ispeziona scatola', description: 'Eseguire l’ispezione della scatola.' },
  clean_box: { title: 'Pulisci scatola', description: 'Pulire la scatola riutilizzabile.' },
  select_empty_box: { title: 'Seleziona scatola vuota', description: 'Selezionare una scatola vuota dal kanban.' },
  validate_box_capacity: { title: 'Verifica capacità scatola', description: 'Verificare la capacità residua della scatola.' },
  print_box_label: { title: 'Stampa etichetta scatola', description: 'Stampare l’etichetta della scatola.' },
}

export function getTemplate(actionType: string): ActionTypeTemplate | undefined {
  return TEMPLATES_IT[actionType]
}

/**
 * Builds an autofilled title prefix for the given action type, optionally
 * appending a resource code (e.g. 'LBL-PNE-001'). Returns an empty string when
 * the action type is unknown.
 */
export function buildAutofilledTitle(
  actionType: string,
  resourceCode: string | null | undefined,
): string {
  const template = TEMPLATES_IT[actionType]
  if (!template) return ''
  const code = resourceCode?.trim()
  return code ? `${template.title} ${code}` : template.title
}

export function buildAutofilledDescription(actionType: string): string {
  const template = TEMPLATES_IT[actionType]
  return template?.description ?? ''
}
