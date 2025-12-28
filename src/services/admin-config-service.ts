import { prisma } from '../lib/prisma';
import { logAudit } from '../lib/audit';

export class AdminConfigService {
    /**
     * Toggles a feature for a business.
     */
    static async toggleFeature(businessId: string, featureKey: string, enabled: boolean, changedBy: string) {
        const feature = await prisma.feature.findUnique({
            where: { key: featureKey },
        });
        if (!feature) throw new Error(`Feature ${featureKey} not found`);

        return await prisma.$transaction(async (tx) => {
            const current = await tx.businessFeature.findUnique({
                where: { businessId_featureId: { businessId, featureId: feature.id } },
            });

            const updated = await tx.businessFeature.upsert({
                where: { businessId_featureId: { businessId, featureId: feature.id } },
                update: { enabled },
                create: { businessId, featureId: feature.id, enabled },
            });

            await tx.auditLog.create({
                data: {
                    businessId,
                    userId: changedBy,
                    module: 'Feature',
                    action: 'TOGGLE',
                    before: { key: featureKey, enabled: current?.enabled ?? false },
                    after: { key: featureKey, enabled },
                },
            });

            return updated;
        });
    }

    /**
     * Updates or creates a business-level rule override.
     */
    static async updateRule(businessId: string, ruleKey: string, ruleValue: any, scope: string, changedBy: string) {
        return await prisma.$transaction(async (tx) => {
            const current = await tx.businessRule.findUnique({
                where: { businessId_ruleKey: { businessId, ruleKey } },
            });

            const updated = await tx.businessRule.upsert({
                where: { businessId_ruleKey: { businessId, ruleKey } },
                update: { ruleValue, scope },
                create: { businessId, ruleKey, ruleValue, scope },
            });

            await tx.auditLog.create({
                data: {
                    businessId,
                    userId: changedBy,
                    module: 'Rule',
                    action: 'UPDATE',
                    before: { key: ruleKey, value: current?.ruleValue ?? null },
                    after: { key: ruleKey, value: ruleValue },
                },
            });

            return updated;
        });
    }
}
