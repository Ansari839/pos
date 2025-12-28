import { prisma } from './prisma';

interface AuditLogParams {
    userId: string;
    businessId: string;
    module: string;
    action: string;
    before?: any;
    after?: any;
}

/**
 * Log a critical action to the audit log table.
 * Should be called by Services after a successful operation.
 */
export async function logAudit(params: AuditLogParams) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                businessId: params.businessId,
                module: params.module,
                action: params.action,
                before: params.before ?? Prisma.JsonNull,
                after: params.after ?? Prisma.JsonNull,
            },
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Don't throw, so we don't block the user operation if logging fails
    }
}

import { Prisma } from '../generated/prisma';
