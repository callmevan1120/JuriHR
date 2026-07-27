// ============================================================
// JURI HR — Audit Service
// Helper untuk mencatat perubahan penting ke audit log.
// ============================================================
import { getStore } from "@/lib/data/store";
import type { AuditLog } from "@/lib/types";
import { uid } from "@/lib/utils";

const ACTOR = "HRD Admin";

export function logAudit(input: {
  module: string;
  action: string;
  description: string;
  before?: unknown;
  after?: unknown;
  actor?: string;
}): void {
  const store = getStore();
  const entry: AuditLog = {
    id: uid("log"),
    actor: input.actor ?? ACTOR,
    module: input.module,
    action: input.action,
    description: input.description,
    before: input.before,
    after: input.after,
    createdAt: new Date().toISOString(),
  };
  store.setCollection("auditLogs", [entry, ...store.getState().auditLogs]);
}

/** Catat perubahan histori entitas. */
export function logChangeHistory(input: {
  entityType:
    | "EMPLOYEE"
    | "POSITION"
    | "DIVISION"
    | "OUTLET"
    | "DOMICILE"
    | "CONTRACT"
    | "SALARY"
    | "SHIFT_GROUP"
    | "HOLIDAY_GROUP"
    | "STATUS";
  entityId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  actor?: string;
}): void {
  const store = getStore();
  const entry = {
    id: uid("hist"),
    entityType: input.entityType,
    entityId: input.entityId,
    field: input.field,
    oldValue: input.oldValue,
    newValue: input.newValue,
    changedBy: input.actor ?? ACTOR,
    changedAt: new Date().toISOString(),
    reason: input.reason,
  };
  store.setCollection("changeHistories", [
    entry,
    ...store.getState().changeHistories,
  ]);
}
