-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_step_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "operator_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
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
INSERT INTO "new_step_executions" ("completed_at", "created_at", "data", "duration_sec", "id", "notes", "operator_id", "result", "started_at", "step_id", "work_order_id") SELECT "completed_at", "created_at", "data", "duration_sec", "id", "notes", "operator_id", "result", "started_at", "step_id", "work_order_id" FROM "step_executions";
DROP TABLE "step_executions";
ALTER TABLE "new_step_executions" RENAME TO "step_executions";
CREATE INDEX "step_executions_work_order_id_step_id_idx" ON "step_executions"("work_order_id", "step_id");
CREATE INDEX "step_executions_operator_id_idx" ON "step_executions"("operator_id");
CREATE INDEX "step_executions_status_idx" ON "step_executions"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
