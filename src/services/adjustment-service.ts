import { prisma } from '../lib/prisma';
import { Decimal } from 'decimal.js';

export interface AdjustmentInput {
    businessId: string;
    userId: string;
    itemId: string;
    warehouseId: string;
    quantity: number;
    type: 'IN' | 'OUT';
    reason?: string;
}

export class AdjustmentService {
    /**
     * Registers a manual stock adjustment and updates inventory.
     */
    static async adjustStock(input: AdjustmentInput) {
        return await prisma.$transaction(async (tx: any) => {
            const item = await tx.item.findUnique({ where: { id: input.itemId } });
            if (!item) throw new Error('Item not found');
            if (!item.trackStock) throw new Error('Item does not track stock');

            // 1. Create StockAdjustment record
            const adjustment = await tx.stockAdjustment.create({
                data: {
                    businessId: input.businessId,
                    itemId: input.itemId,
                    warehouseId: input.warehouseId,
                    quantityBaseUnit: input.quantity,
                    type: input.type,
                    reason: input.reason,
                    createdBy: input.userId
                }
            });

            // 2. Update Stock
            const qtyChangeValue = input.type === 'IN' ? input.quantity : -input.quantity;
            const qtyChange = new Decimal(qtyChangeValue);

            await tx.stock.upsert({
                where: {
                    warehouseId_itemId: {
                        warehouseId: input.warehouseId,
                        itemId: input.itemId
                    }
                },
                update: {
                    quantityBaseUnit: { increment: qtyChange.toNumber() }
                },
                create: {
                    businessId: input.businessId,
                    warehouseId: input.warehouseId,
                    itemId: input.itemId,
                    quantityBaseUnit: qtyChange.toNumber()
                }
            });

            // 3. Log Movement
            await tx.stockMovement.create({
                data: {
                    businessId: input.businessId,
                    itemId: input.itemId,
                    warehouseId: input.warehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: adjustment.id,
                    quantityBaseUnit: qtyChange,
                    createdBy: input.userId
                }
            });

            return adjustment;
        });
    }
}
