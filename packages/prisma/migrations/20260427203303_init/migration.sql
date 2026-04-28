-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Rome',
    "locale" TEXT NOT NULL DEFAULT 'it-IT',
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" DATETIME,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "users_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "badge" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "plant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "photo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "operators_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "operators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "skills_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operator_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "certified_at" DATETIME NOT NULL,
    "expires_at" DATETIME,
    "level" TEXT NOT NULL DEFAULT 'certified',
    "certified_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operator_skills_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "operator_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "tracking_mode" TEXT NOT NULL DEFAULT 'lot',
    "uom" TEXT NOT NULL DEFAULT 'pc',
    "description" TEXT,
    "plant_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "items_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "boms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effective_from" DATETIME,
    "effective_to" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "boms_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bom_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bom_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'pc',
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bom_lines_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipment_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "class" TEXT NOT NULL DEFAULT 'production',
    "status" TEXT NOT NULL DEFAULT 'available',
    "parent_id" TEXT,
    "plant_id" TEXT NOT NULL,
    "description" TEXT,
    "last_maintenance_at" DATETIME,
    "next_maintenance_due_at" DATETIME,
    "total_cycles_count" INTEGER NOT NULL DEFAULT 0,
    "total_run_hours_min" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "equipment_nodes_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "equipment_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "equipment_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipment_node_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "ip_address" TEXT,
    "serial_number" TEXT,
    "firmware_version" TEXT,
    "last_connected_at" DATETIME,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "devices_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipment_node_id" TEXT,
    "current_cycles_count" INTEGER NOT NULL DEFAULT 0,
    "max_cycles" INTEGER,
    "wear_status" TEXT NOT NULL DEFAULT 'new',
    "last_used_at" DATETIME,
    "replaced_at" DATETIME,
    "replacement_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "tools_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "device_id" TEXT,
    "item_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "recipes_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recipes_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "recipes_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recipe_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipe_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "parameters" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "recipe_versions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "box_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_weight_g" REAL,
    "max_volume_l" REAL,
    "max_units_count" INTEGER,
    "is_returnable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "box_types_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "boxes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "box_type_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'empty',
    "current_weight_g" REAL NOT NULL DEFAULT 0,
    "current_volume_l" REAL NOT NULL DEFAULT 0,
    "current_units_count" INTEGER NOT NULL DEFAULT 0,
    "lot_id" TEXT,
    "sealed_at" DATETIME,
    "sealed_by" TEXT,
    "cycles_count" INTEGER NOT NULL DEFAULT 0,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "boxes_box_type_id_fkey" FOREIGN KEY ("box_type_id") REFERENCES "box_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "boxes_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attention_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "resolved_at" DATETIME,
    "resolved_by" TEXT,
    "resolve_note" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "attention_points_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cause_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phase" TEXT,
    "description" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "cause_codes_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotNumber" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "quality_status" TEXT NOT NULL DEFAULT 'quarantine',
    "supplier_ref" TEXT,
    "expires_at" DATETIME,
    "notes" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "lots_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lots_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lot_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "from_location" TEXT,
    "to_location" TEXT,
    "qty" REAL NOT NULL,
    "moved_by" TEXT NOT NULL,
    "reason" TEXT,
    "moved_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lot_movements_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "item_id" TEXT,
    "current_version_id" TEXT,
    "description" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "workflows_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workflows_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflow_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "workflow_versions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflow_version_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_cycle_based" BOOLEAN NOT NULL DEFAULT false,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "phases_workflow_version_id_fkey" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phase_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supports_parallel" BOOLEAN NOT NULL DEFAULT false,
    "supports_recovery" BOOLEAN NOT NULL DEFAULT false,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "groups_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "name" TEXT NOT NULL,
    "instructions" TEXT,
    "skill_id" TEXT,
    "device_id" TEXT,
    "recipe_id" TEXT,
    "tool_id" TEXT,
    "standard_time_sec" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "part_reference" TEXT,
    "no_target_policy" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "steps_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "steps_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "steps_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "steps_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflow_version_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "snapshot_data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "workflow_snapshots_workflow_version_id_fkey" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workflow_snapshots_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "bom_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "type" TEXT NOT NULL DEFAULT 'production',
    "qty_target" INTEGER NOT NULL,
    "qty_produced" INTEGER NOT NULL DEFAULT 0,
    "qty_scrap" INTEGER NOT NULL DEFAULT 0,
    "qty_rework" INTEGER NOT NULL DEFAULT 0,
    "scheduled_start" DATETIME,
    "scheduled_end" DATETIME,
    "actual_start" DATETIME,
    "actual_end" DATETIME,
    "released_at" DATETIME,
    "released_by" TEXT,
    "closed_at" DATETIME,
    "closed_by" TEXT,
    "notes" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "work_orders_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "serial_number" TEXT,
    "cycle_number" INTEGER NOT NULL,
    "step_id" TEXT,
    "result" TEXT NOT NULL,
    "operator_id" TEXT,
    "notes" TEXT,
    "started_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_records_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "step_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "operator_id" TEXT,
    "result" TEXT,
    "duration_sec" INTEGER,
    "notes" TEXT,
    "data" TEXT,
    "started_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "step_executions_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "step_executions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "steps" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "downtime_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "equipment_node_id" TEXT,
    "cause_code_id" TEXT,
    "description" TEXT,
    "duration_min" INTEGER,
    "impact" TEXT NOT NULL DEFAULT 'minor',
    "reported_by" TEXT NOT NULL,
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "downtime_events_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "downtime_events_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "downtime_events_cause_code_id_fkey" FOREIGN KEY ("cause_code_id") REFERENCES "cause_codes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "equipment_node_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "description" TEXT NOT NULL,
    "planned_start" DATETIME NOT NULL,
    "planned_end" DATETIME NOT NULL,
    "actual_start" DATETIME,
    "actual_end" DATETIME,
    "assigned_to_id" TEXT,
    "started_by" TEXT,
    "completed_by" TEXT,
    "cancelled_by" TEXT,
    "cancel_reason" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "maintenance_orders_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_orders_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maintenance_order_id" TEXT NOT NULL,
    "equipment_node_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actions_performed" TEXT NOT NULL,
    "parts_replaced" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "performed_by" TEXT NOT NULL,
    "performed_at" DATETIME NOT NULL,
    "duration_minutes" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_logs_maintenance_order_id_fkey" FOREIGN KEY ("maintenance_order_id") REFERENCES "maintenance_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_logs_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipment_state_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipment_node_id" TEXT NOT NULL,
    "from_state" TEXT,
    "to_state" TEXT NOT NULL,
    "transitioned_by" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "reason" TEXT,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "transitioned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "equipment_state_log_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tool_wear_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tool_id" TEXT NOT NULL,
    "previous_cycles_count" INTEGER NOT NULL,
    "replaced_by" TEXT NOT NULL,
    "reason" TEXT,
    "replaced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tool_wear_history_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_order_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" DATETIME,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "decline_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "work_order_assignments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_order_assignments_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skills_coverage_overrides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "missing_skill_id" TEXT NOT NULL,
    "overridden_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approved_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "skills_coverage_overrides_missing_skill_id_fkey" FOREIGN KEY ("missing_skill_id") REFERENCES "skills" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "shifts_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shift_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "work_order_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "shift_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "shift_assignments_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "continuous_production_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "equipment_node_id" TEXT NOT NULL,
    "mode_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "total_meters" REAL NOT NULL DEFAULT 0,
    "telemetry_interval_min" INTEGER NOT NULL DEFAULT 5,
    "started_by" TEXT NOT NULL,
    "completed_by" TEXT,
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "continuous_production_runs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "continuous_production_runs_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "samples" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "sample_number" INTEGER NOT NULL,
    "is_ppap" BOOLEAN NOT NULL DEFAULT false,
    "taken_by" TEXT NOT NULL,
    "notes" TEXT,
    "taken_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "samples_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "samples_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sample_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sample_id" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "uom" TEXT,
    "in_spec" BOOLEAN NOT NULL,
    "test_method" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "sample_results_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fai_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "sample_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejected_by" TEXT,
    "rejected_at" DATETIME,
    "qc_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "fai_reports_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fai_reports_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wip_containers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "from_phase_id" TEXT,
    "to_phase_id" TEXT,
    "qty" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME,
    "consumed_at" DATETIME,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "wip_containers_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wip_containers_from_phase_id_fkey" FOREIGN KEY ("from_phase_id") REFERENCES "phases" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "wip_containers_to_phase_id_fkey" FOREIGN KEY ("to_phase_id") REFERENCES "phases" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lot_holds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "held_by" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "affects_qty" REAL,
    "notes" TEXT,
    "held_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "lot_holds_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lot_hold_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_hold_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "notes" TEXT,
    "performed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lot_hold_actions_lot_hold_id_fkey" FOREIGN KEY ("lot_hold_id") REFERENCES "lot_holds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "molds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipment_node_id" TEXT,
    "current_cycles_count" INTEGER NOT NULL DEFAULT 0,
    "max_cycles" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'available',
    "material" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "molds_equipment_node_id_fkey" FOREIGN KEY ("equipment_node_id") REFERENCES "equipment_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mold_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mold_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mold_cycles_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "molds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mold_cycles_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prepreg_rolls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "roll_number" TEXT NOT NULL,
    "material_code" TEXT NOT NULL,
    "out_time_budget_hours" REAL NOT NULL DEFAULT 720,
    "out_time_used_hours" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "width_mm" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "prepreg_rolls_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prepreg_out_time_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prepreg_roll_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "hours_added" REAL NOT NULL,
    "reason" TEXT,
    "exposed_from" DATETIME NOT NULL,
    "exposed_to" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "prepreg_out_time_records_prepreg_roll_id_fkey" FOREIGN KEY ("prepreg_roll_id") REFERENCES "prepreg_rolls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cure_cycle_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "autoclave_id" TEXT,
    "mold_id" TEXT,
    "program_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "target_temp_c" REAL,
    "target_press_bar" REAL,
    "notes" TEXT,
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "cure_cycle_runs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cure_cycle_runs_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "molds" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cure_cycle_telemetry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cure_cycle_run_id" TEXT NOT NULL,
    "temp_c" REAL,
    "pressure_bar" REAL,
    "vacuum_mbar" REAL,
    "sensor_id" TEXT,
    "recorded_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cure_cycle_telemetry_cure_cycle_run_id_fkey" FOREIGN KEY ("cure_cycle_run_id") REFERENCES "cure_cycle_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "layup_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "mold_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "layer_count" INTEGER NOT NULL,
    "total_thickness_mm" REAL,
    "notes" TEXT,
    "completed_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "layup_logs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "layup_logs_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "molds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vacuum_bag_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "layup_log_id" TEXT,
    "passed_vacuum_mbar" REAL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "tested_by" TEXT NOT NULL,
    "tested_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vacuum_bag_tests_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vacuum_bag_tests_layup_log_id_fkey" FOREIGN KEY ("layup_log_id") REFERENCES "layup_logs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ndt_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "serial_number" TEXT,
    "method" TEXT NOT NULL,
    "defects_found" TEXT,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "tested_by" TEXT NOT NULL,
    "tested_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ndt_results_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reflective_film_rolls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "roll_number" TEXT NOT NULL,
    "material_grade" TEXT NOT NULL,
    "width_mm" REAL NOT NULL,
    "length_m" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "reflective_film_rolls_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "homologation_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "authority_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "issued_at" DATETIME NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "notes" TEXT,
    "plant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "homologation_certificates_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "homologation_certificates_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reflectance_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "sample_id" TEXT,
    "ra" REAL,
    "rb" REAL,
    "pass_threshold" REAL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "tested_by" TEXT NOT NULL,
    "tested_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reflectance_tests_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reflectance_tests_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reflectance_tests_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "colorimetry_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "sample_id" TEXT,
    "cie_l" REAL NOT NULL,
    "cie_a" REAL NOT NULL,
    "cie_b" REAL NOT NULL,
    "color_class" TEXT,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "tested_by" TEXT NOT NULL,
    "tested_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "colorimetry_tests_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "colorimetry_tests_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lamination_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "film_roll_id" TEXT NOT NULL,
    "substrate_ref" TEXT,
    "pressure_bar" REAL,
    "temp_c" REAL,
    "speed_m_min" REAL,
    "operator_id" TEXT NOT NULL,
    "notes" TEXT,
    "laminated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "lamination_records_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lamination_records_film_roll_id_fkey" FOREIGN KEY ("film_roll_id") REFERENCES "reflective_film_rolls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cross_cut_adhesion_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "sample_id" TEXT,
    "rating" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "tested_by" TEXT NOT NULL,
    "tested_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cross_cut_adhesion_tests_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cross_cut_adhesion_tests_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "samples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aging_test_specimens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "specimen_number" INTEGER NOT NULL,
    "aging_condition" TEXT NOT NULL,
    "scheduled_end_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "notes" TEXT,
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "aging_test_specimens_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "aging_test_specimens_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aging_test_measurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aging_test_specimen_id" TEXT NOT NULL,
    "reflectance_ra" REAL,
    "color_cie_l" REAL,
    "color_cie_a" REAL,
    "color_cie_b" REAL,
    "result" TEXT,
    "notes" TEXT,
    "measured_by" TEXT NOT NULL,
    "measured_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aging_test_measurements_aging_test_specimen_id_fkey" FOREIGN KEY ("aging_test_specimen_id") REFERENCES "aging_test_specimens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "plant_id" TEXT NOT NULL,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" DATETIME,
    "plant_id" TEXT NOT NULL,
    CONSTRAINT "domain_events_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "plants_code_key" ON "plants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_plant_id_role_idx" ON "users"("plant_id", "role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "operators_badge_key" ON "operators"("badge");

-- CreateIndex
CREATE UNIQUE INDEX "operators_user_id_key" ON "operators"("user_id");

-- CreateIndex
CREATE INDEX "operators_plant_id_status_idx" ON "operators"("plant_id", "status");

-- CreateIndex
CREATE INDEX "operators_badge_idx" ON "operators"("badge");

-- CreateIndex
CREATE INDEX "skills_plant_id_idx" ON "skills"("plant_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_plant_id_code_key" ON "skills"("plant_id", "code");

-- CreateIndex
CREATE INDEX "operator_skills_skill_id_idx" ON "operator_skills"("skill_id");

-- CreateIndex
CREATE INDEX "operator_skills_expires_at_idx" ON "operator_skills"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "operator_skills_operator_id_skill_id_key" ON "operator_skills"("operator_id", "skill_id");

-- CreateIndex
CREATE INDEX "items_plant_id_item_type_idx" ON "items"("plant_id", "item_type");

-- CreateIndex
CREATE UNIQUE INDEX "items_plant_id_code_key" ON "items"("plant_id", "code");

-- CreateIndex
CREATE INDEX "boms_item_id_status_idx" ON "boms"("item_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "boms_item_id_version_key" ON "boms"("item_id", "version");

-- CreateIndex
CREATE INDEX "bom_lines_bom_id_position_idx" ON "bom_lines"("bom_id", "position");

-- CreateIndex
CREATE INDEX "equipment_nodes_plant_id_level_idx" ON "equipment_nodes"("plant_id", "level");

-- CreateIndex
CREATE INDEX "equipment_nodes_parent_id_idx" ON "equipment_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "equipment_nodes_status_idx" ON "equipment_nodes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_nodes_plant_id_code_key" ON "equipment_nodes"("plant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "devices_serial_number_key" ON "devices"("serial_number");

-- CreateIndex
CREATE INDEX "devices_equipment_node_id_idx" ON "devices"("equipment_node_id");

-- CreateIndex
CREATE INDEX "tools_equipment_node_id_idx" ON "tools"("equipment_node_id");

-- CreateIndex
CREATE INDEX "tools_wear_status_idx" ON "tools"("wear_status");

-- CreateIndex
CREATE INDEX "recipes_plant_id_status_idx" ON "recipes"("plant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_plant_id_code_key" ON "recipes"("plant_id", "code");

-- CreateIndex
CREATE INDEX "recipe_versions_recipe_id_status_idx" ON "recipe_versions"("recipe_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_versions_recipe_id_version_key" ON "recipe_versions"("recipe_id", "version");

-- CreateIndex
CREATE INDEX "box_types_plant_id_idx" ON "box_types"("plant_id");

-- CreateIndex
CREATE UNIQUE INDEX "box_types_plant_id_code_key" ON "box_types"("plant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "boxes_code_key" ON "boxes"("code");

-- CreateIndex
CREATE INDEX "boxes_plant_id_status_idx" ON "boxes"("plant_id", "status");

-- CreateIndex
CREATE INDEX "boxes_lot_id_idx" ON "boxes"("lot_id");

-- CreateIndex
CREATE INDEX "attention_points_plant_id_entity_type_entity_id_idx" ON "attention_points"("plant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "attention_points_resolved_at_idx" ON "attention_points"("resolved_at");

-- CreateIndex
CREATE INDEX "cause_codes_plant_id_category_idx" ON "cause_codes"("plant_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "cause_codes_plant_id_code_key" ON "cause_codes"("plant_id", "code");

-- CreateIndex
CREATE INDEX "lots_plant_id_quality_status_idx" ON "lots"("plant_id", "quality_status");

-- CreateIndex
CREATE INDEX "lots_item_id_idx" ON "lots"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "lots_plant_id_lotNumber_key" ON "lots"("plant_id", "lotNumber");

-- CreateIndex
CREATE INDEX "lot_movements_lot_id_moved_at_idx" ON "lot_movements"("lot_id", "moved_at");

-- CreateIndex
CREATE INDEX "workflows_plant_id_idx" ON "workflows"("plant_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflows_plant_id_code_key" ON "workflows"("plant_id", "code");

-- CreateIndex
CREATE INDEX "workflow_versions_workflow_id_status_idx" ON "workflow_versions"("workflow_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_versions_workflow_id_version_key" ON "workflow_versions"("workflow_id", "version");

-- CreateIndex
CREATE INDEX "phases_workflow_version_id_order_idx" ON "phases"("workflow_version_id", "order");

-- CreateIndex
CREATE INDEX "groups_phase_id_order_idx" ON "groups"("phase_id", "order");

-- CreateIndex
CREATE INDEX "steps_group_id_order_idx" ON "steps"("group_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_snapshots_work_order_id_key" ON "workflow_snapshots"("work_order_id");

-- CreateIndex
CREATE INDEX "workflow_snapshots_workflow_version_id_idx" ON "workflow_snapshots"("workflow_version_id");

-- CreateIndex
CREATE INDEX "work_orders_plant_id_status_idx" ON "work_orders"("plant_id", "status");

-- CreateIndex
CREATE INDEX "work_orders_item_id_idx" ON "work_orders"("item_id");

-- CreateIndex
CREATE INDEX "work_orders_scheduled_start_idx" ON "work_orders"("scheduled_start");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_plant_id_code_key" ON "work_orders"("plant_id", "code");

-- CreateIndex
CREATE INDEX "production_records_work_order_id_cycle_number_idx" ON "production_records"("work_order_id", "cycle_number");

-- CreateIndex
CREATE INDEX "production_records_serial_number_idx" ON "production_records"("serial_number");

-- CreateIndex
CREATE INDEX "step_executions_work_order_id_step_id_idx" ON "step_executions"("work_order_id", "step_id");

-- CreateIndex
CREATE INDEX "step_executions_operator_id_idx" ON "step_executions"("operator_id");

-- CreateIndex
CREATE INDEX "downtime_events_work_order_id_idx" ON "downtime_events"("work_order_id");

-- CreateIndex
CREATE INDEX "downtime_events_equipment_node_id_idx" ON "downtime_events"("equipment_node_id");

-- CreateIndex
CREATE INDEX "maintenance_orders_equipment_node_id_status_idx" ON "maintenance_orders"("equipment_node_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_orders_planned_start_idx" ON "maintenance_orders"("planned_start");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_orders_plant_id_code_key" ON "maintenance_orders"("plant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_logs_maintenance_order_id_key" ON "maintenance_logs"("maintenance_order_id");

-- CreateIndex
CREATE INDEX "maintenance_logs_equipment_node_id_performed_at_idx" ON "maintenance_logs"("equipment_node_id", "performed_at");

-- CreateIndex
CREATE INDEX "equipment_state_log_equipment_node_id_transitioned_at_idx" ON "equipment_state_log"("equipment_node_id", "transitioned_at");

-- CreateIndex
CREATE INDEX "tool_wear_history_tool_id_replaced_at_idx" ON "tool_wear_history"("tool_id", "replaced_at");

-- CreateIndex
CREATE INDEX "work_order_assignments_work_order_id_status_idx" ON "work_order_assignments"("work_order_id", "status");

-- CreateIndex
CREATE INDEX "work_order_assignments_operator_id_status_idx" ON "work_order_assignments"("operator_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_assignments_work_order_id_operator_id_key" ON "work_order_assignments"("work_order_id", "operator_id");

-- CreateIndex
CREATE INDEX "skills_coverage_overrides_work_order_id_idx" ON "skills_coverage_overrides"("work_order_id");

-- CreateIndex
CREATE INDEX "shifts_plant_id_idx" ON "shifts"("plant_id");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_plant_id_code_key" ON "shifts"("plant_id", "code");

-- CreateIndex
CREATE INDEX "shift_assignments_date_idx" ON "shift_assignments"("date");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignments_shift_id_operator_id_date_key" ON "shift_assignments"("shift_id", "operator_id", "date");

-- CreateIndex
CREATE INDEX "continuous_production_runs_work_order_id_idx" ON "continuous_production_runs"("work_order_id");

-- CreateIndex
CREATE INDEX "continuous_production_runs_equipment_node_id_status_idx" ON "continuous_production_runs"("equipment_node_id", "status");

-- CreateIndex
CREATE INDEX "samples_work_order_id_idx" ON "samples"("work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "samples_work_order_id_sample_number_key" ON "samples"("work_order_id", "sample_number");

-- CreateIndex
CREATE INDEX "sample_results_sample_id_idx" ON "sample_results"("sample_id");

-- CreateIndex
CREATE UNIQUE INDEX "fai_reports_sample_id_key" ON "fai_reports"("sample_id");

-- CreateIndex
CREATE INDEX "fai_reports_work_order_id_status_idx" ON "fai_reports"("work_order_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wip_containers_code_key" ON "wip_containers"("code");

-- CreateIndex
CREATE INDEX "wip_containers_work_order_id_status_idx" ON "wip_containers"("work_order_id", "status");

-- CreateIndex
CREATE INDEX "lot_holds_lot_id_status_idx" ON "lot_holds"("lot_id", "status");

-- CreateIndex
CREATE INDEX "lot_hold_actions_lot_hold_id_idx" ON "lot_hold_actions"("lot_hold_id");

-- CreateIndex
CREATE INDEX "molds_status_idx" ON "molds"("status");

-- CreateIndex
CREATE INDEX "mold_cycles_mold_id_used_at_idx" ON "mold_cycles"("mold_id", "used_at");

-- CreateIndex
CREATE INDEX "mold_cycles_work_order_id_idx" ON "mold_cycles"("work_order_id");

-- CreateIndex
CREATE INDEX "prepreg_rolls_status_idx" ON "prepreg_rolls"("status");

-- CreateIndex
CREATE UNIQUE INDEX "prepreg_rolls_lot_id_roll_number_key" ON "prepreg_rolls"("lot_id", "roll_number");

-- CreateIndex
CREATE INDEX "prepreg_out_time_records_prepreg_roll_id_idx" ON "prepreg_out_time_records"("prepreg_roll_id");

-- CreateIndex
CREATE INDEX "prepreg_out_time_records_work_order_id_idx" ON "prepreg_out_time_records"("work_order_id");

-- CreateIndex
CREATE INDEX "cure_cycle_runs_work_order_id_idx" ON "cure_cycle_runs"("work_order_id");

-- CreateIndex
CREATE INDEX "cure_cycle_runs_status_idx" ON "cure_cycle_runs"("status");

-- CreateIndex
CREATE INDEX "cure_cycle_telemetry_cure_cycle_run_id_recorded_at_idx" ON "cure_cycle_telemetry"("cure_cycle_run_id", "recorded_at");

-- CreateIndex
CREATE INDEX "layup_logs_work_order_id_idx" ON "layup_logs"("work_order_id");

-- CreateIndex
CREATE INDEX "vacuum_bag_tests_work_order_id_idx" ON "vacuum_bag_tests"("work_order_id");

-- CreateIndex
CREATE INDEX "ndt_results_work_order_id_idx" ON "ndt_results"("work_order_id");

-- CreateIndex
CREATE INDEX "reflective_film_rolls_status_idx" ON "reflective_film_rolls"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reflective_film_rolls_lot_id_roll_number_key" ON "reflective_film_rolls"("lot_id", "roll_number");

-- CreateIndex
CREATE UNIQUE INDEX "homologation_certificates_code_key" ON "homologation_certificates"("code");

-- CreateIndex
CREATE INDEX "homologation_certificates_plant_id_status_idx" ON "homologation_certificates"("plant_id", "status");

-- CreateIndex
CREATE INDEX "homologation_certificates_item_id_idx" ON "homologation_certificates"("item_id");

-- CreateIndex
CREATE INDEX "reflectance_tests_work_order_id_idx" ON "reflectance_tests"("work_order_id");

-- CreateIndex
CREATE INDEX "colorimetry_tests_work_order_id_idx" ON "colorimetry_tests"("work_order_id");

-- CreateIndex
CREATE INDEX "lamination_records_work_order_id_idx" ON "lamination_records"("work_order_id");

-- CreateIndex
CREATE INDEX "cross_cut_adhesion_tests_work_order_id_idx" ON "cross_cut_adhesion_tests"("work_order_id");

-- CreateIndex
CREATE INDEX "aging_test_specimens_status_idx" ON "aging_test_specimens"("status");

-- CreateIndex
CREATE UNIQUE INDEX "aging_test_specimens_work_order_id_specimen_number_key" ON "aging_test_specimens"("work_order_id", "specimen_number");

-- CreateIndex
CREATE INDEX "aging_test_measurements_aging_test_specimen_id_measured_at_idx" ON "aging_test_measurements"("aging_test_specimen_id", "measured_at");

-- CreateIndex
CREATE INDEX "audit_logs_plant_id_entity_type_entity_id_idx" ON "audit_logs"("plant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_changed_by_idx" ON "audit_logs"("changed_by");

-- CreateIndex
CREATE INDEX "audit_logs_changed_at_idx" ON "audit_logs"("changed_at");

-- CreateIndex
CREATE INDEX "domain_events_plant_id_aggregate_type_aggregate_id_idx" ON "domain_events"("plant_id", "aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "domain_events_occurred_at_idx" ON "domain_events"("occurred_at");

-- CreateIndex
CREATE INDEX "domain_events_event_type_idx" ON "domain_events"("event_type");
