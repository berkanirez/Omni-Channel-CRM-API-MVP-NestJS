export type AuditLogInput = {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
};
