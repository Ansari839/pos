import { prisma } from '../lib/prisma';
import { ConfigService } from './config-service';
import slugify from 'slugify';
import { logAudit } from '../lib/audit';

export interface CreateItemInput {
    businessId: string;
    name: string;
    code?: string;
    type: 'PRODUCT' | 'SERVICE';
    categoryId?: string;
    unitId?: string;
    basePrice: number | string;
    taxId?: string;
    trackStock?: boolean;
    trackBatch?: boolean;
    trackExpiry?: boolean;
    allowNegativeStock?: boolean;
}

export class ItemService {
    /**
     * Universal item creation with business-rule and feature-based validation.
     */
    static async createItem(input: CreateItemInput, userId: string) {
        const { businessId, type, name, basePrice } = input;

        // 1. Feature-based validations
        const [batchEnabled, expiryEnabled] = await Promise.all([
            ConfigService.isFeatureEnabled(businessId, 'BATCH_TRACKING'),
            ConfigService.isFeatureEnabled(businessId, 'EXPIRY_TRACKING'),
        ]);

        let trackStock = input.trackStock ?? true;
        let trackBatch = input.trackBatch ?? false;
        let trackExpiry = input.trackExpiry ?? false;

        // Enforce SERVICE constraints
        if (type === 'SERVICE') {
            trackStock = false;
            trackBatch = false;
            trackExpiry = false;
        } else {
            // Enforce Feature constraints
            if (!batchEnabled) trackBatch = false;
            if (!expiryEnabled) trackExpiry = false;
        }

        // 2. Generate Code/SKU if missing
        const code = input.code || slugify(name, { lower: true, replacement: '' }).toUpperCase().substring(0, 10) + Math.floor(Math.random() * 1000);

        return await prisma.$transaction(async (tx) => {
            const item = await tx.item.create({
                data: {
                    businessId,
                    name,
                    code,
                    type,
                    categoryId: input.categoryId,
                    unitId: input.unitId,
                    basePrice: basePrice as any,
                    taxId: input.taxId,
                    trackStock,
                    trackBatch,
                    trackExpiry,
                    allowNegativeStock: input.allowNegativeStock,
                },
            });

            await tx.auditLog.create({
                data: {
                    businessId,
                    userId,
                    module: 'Item',
                    action: 'CREATE',
                    after: item as any,
                },
            });

            return item;
        });
    }

    static async getItems(businessId: string) {
        return prisma.item.findMany({
            where: { businessId, isActive: true },
            include: {
                category: true,
                unit: true,
                tax: true,
            }
        });
    }
}
