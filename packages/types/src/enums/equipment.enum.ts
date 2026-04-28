export enum EquipmentHierarchyLevel {
  ENTERPRISE = 'enterprise',
  SITE = 'site',
  AREA = 'area',
  WORK_CENTER = 'work_center',
  WORK_UNIT = 'work_unit',
  EQUIPMENT_MODULE = 'equipment_module',
}

export enum EquipmentClass {
  PRODUCTION = 'production',
  STORAGE = 'storage',
  TRANSPORT = 'transport',
  TEST = 'test',
  MAINTENANCE = 'maintenance',
  ADMINISTRATIVE = 'administrative',
}

export enum EquipmentStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  IN_USE = 'in_use',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken',
  OFFLINE = 'offline',
  DECOMMISSIONED = 'decommissioned',
}

export enum DeviceType {
  SCANNER = 'scanner',
  PRINTER = 'printer',
  LEAK_TESTER = 'leak_tester',
  PRESS = 'press',
  WELDER = 'welder',
  ROBOT = 'robot',
  OVEN = 'oven',
  WASHER = 'washer',
  CONVEYOR = 'conveyor',
  AGV = 'agv',
  FORKLIFT = 'forklift',
  MEASUREMENT = 'measurement',
  AUTOCLAVE = 'autoclave',
  CUSTOM = 'custom',
}

export enum ToolWearStatus {
  NEW = 'new',
  GOOD = 'good',
  WORN = 'worn',
  AT_LIMIT = 'at_limit',
  REPLACED = 'replaced',
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
  DEFERRED = 'deferred',
}
