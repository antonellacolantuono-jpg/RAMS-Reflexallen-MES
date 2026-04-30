export enum StepCategory {
  PRODUCTION = 'production',
  LOGISTICS = 'logistics',
  IDENTIFICATION = 'identification',
  QUALITY_CONTROL = 'quality_control',
  DECISION = 'decision',
  INFORMATION = 'information',
  SETUP = 'setup',
  TEARDOWN = 'teardown',
  RECOVERY = 'recovery',
}

export enum StepActionType {
  // Production
  ASSEMBLY = 'assembly',
  PROCESS = 'process',
  DEVICE_RUN = 'device_run',
  REWORK = 'rework',
  // Logistics
  MOVE = 'move',
  TRANSFER = 'transfer',
  LOAD = 'load',
  UNLOAD = 'unload',
  // Identification
  SCAN_BARCODE = 'scan_barcode',
  SCAN_QR = 'scan_qr',
  SCAN_RFID = 'scan_rfid',
  SCAN_DATAMATRIX = 'scan_datamatrix',
  MANUAL_ID_ENTRY = 'manual_id_entry',
  PRINT_LABEL = 'print_label',
  APPLY_LABEL = 'apply_label',
  VERIFY_ID = 'verify_id',
  // Quality Control
  VISUAL_CHECK = 'visual_check',
  DIMENSIONAL_CHECK = 'dimensional_check',
  FUNCTIONAL_TEST = 'functional_test',
  SAMPLE_TAKE = 'sample_take',
  DOCUMENT_DEFECT = 'document_defect',
  // Decision
  AUTO_BRANCH = 'auto_branch',
  MANUAL_CHOICE = 'manual_choice',
  CONDITION_CHECK = 'condition_check',
  // Information
  READ_SOP = 'read_sop',
  SAFETY_BRIEFING = 'safety_briefing',
  VIEW_VIDEO = 'view_video',
  VIEW_DRAWING = 'view_drawing',
  // Setup / Teardown
  VERIFY_WORKSTATION = 'verify_workstation',
  VERIFY_SKILL = 'verify_skill',
  VERIFY_TOOL = 'verify_tool',
  VERIFY_MATERIAL = 'verify_material',
  LOAD_RECIPE = 'load_recipe',
  UNLOAD_RECIPE = 'unload_recipe',
  FIRST_PIECE = 'first_piece',
  LAST_PIECE = 'last_piece',
  CLEANUP = 'cleanup',
  // Box operations
  PACK_INTO_BOX = 'pack_into_box',
  UNPACK_FROM_BOX = 'unpack_from_box',
  SEAL_BOX = 'seal_box',
  OPEN_SEALED_BOX = 'open_sealed_box',
  PALLETIZE_BOX = 'palletize_box',
  DEPALLETIZE_BOX = 'depalletize_box',
  INSPECT_BOX = 'inspect_box',
  CLEAN_BOX = 'clean_box',
  SELECT_EMPTY_BOX = 'select_empty_box',
  VALIDATE_BOX_CAPACITY = 'validate_box_capacity',
  PRINT_BOX_LABEL = 'print_box_label',
}

export enum StepType {
  NORMAL = 'normal',
  WARNING = 'warning',
  INFORMATIVE = 'informative',
}

export enum StepSource {
  MANUAL = 'manual',
  AUTO_GENERATED = 'auto_generated',
  OVERRIDDEN = 'overridden',
}

export enum StepDeviceCategory {
  PRE = 'pre',
  DEVICE_MAIN = 'device_main',
  PARALLEL = 'parallel',
  POST = 'post',
}

export enum TimeMode {
  MANUAL_STANDARD_TIME = 'manual-standard-time',
  DEVICE_CYCLE_TIME = 'device-cycle-time',
  WHILE_DEVICE_RUNNING = 'while-device-running',
}

export enum PartReference {
  CURRENT = 'current',
  PREVIOUS = 'previous',
  NEXT = 'next',
  PREVIOUS_N = 'previous_n',
  BATCH = 'batch',
  NONE = 'none',
}

export enum NoTargetPolicy {
  SKIP = 'skip',
  DEFER = 'defer',
  BLOCK_OPERATOR_CHOICE = 'block_operator_choice',
}
