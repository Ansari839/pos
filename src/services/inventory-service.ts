import { prisma } from '../lib/prisma';
import { ConfigService } from './config-service';
import { UnitService } from './unit-service';
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs';

export interface StockAdjustmentInput {
    businessId: string;
    itemId: string;
    warehouseId: string;
    quantity: number | string | Decimal;
    unitId: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
    referenceType: 'POS' | 'PURCHASE' | 'ADJUSTMENT';
    referenceId?: string;
    batchNo?: string;
    expiryDate?: Date;
    userId: string;
}

export class InventoryService {
    /**
     * Universal stock adjustment with rule enforcement and unit conversion.
     */
    static async adjustStock(input: StockAdjustmentInput) {
        const { businessId, itemId, warehouseId, type, userId } = input;

        // 1. Get Item and check if it tracks stock
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            include: { unit: true }
        });

        if (!item || !item.trackStock) {
            throw new Error('Item not found or does not track stock.');
        }

        // 2. Convert quantity to base unit
        let quantityBaseUnit = new Decimal(input.quantity);
        if (input.unitId !== item.unitId && item.unitId) {
            quantityBaseUnit = await UnitService.convert(input.quantity, input.unitId, item.unitId);
        }

        // Adjust quantity based on type
        const multiplier = (type === 'OUT' || (type === 'ADJUSTMENT' && quantityBaseUnit.isNegative())) ? new Decimal(-1) : new Decimal(1);
        const amountToAdjust = quantityBaseUnit.abs().mul(multiplier);

        // 3. Rule Enforcement
        const [batchEnabled, expiryEnabled, allowNegative] = await Promise.all([
            ConfigService.isFeatureEnabled(businessId, 'BATCH_TRACKING'),
            ConfigService.isFeatureEnabled(businessId, 'EXPIRY_TRACKING'),
            ConfigService.getRuleValue(businessId, 'stock.allow_negative', false),
        ]);

        return await prisma.$transaction(async (tx) => {
            // 4. Find or create Stock record
            let stock = await tx.stock.findUnique({
                where: { warehouseId_itemId: { warehouseId, itemId } }
            });

            if (!stock) {
                stock = await tx.stock.create({
                    data: {
                        businessId,
                        warehouseId,
                        itemId,
                        quantityBaseUnit: 0,
                    }
                });
            }

            // Check for negative stock if disallowed
            const newTotal = new Decimal(stock.quantityBaseUnit as any).add(amountToAdjust);
            if (!allowNegative && newTotal.isNegative()) {
                throw new Error('Insufficient stock and negative stock is disallowed.');
            }

            // 5. Handle Batch/Expiry logic
            if (batchEnabled && (input.batchNo || input.expiryDate || amountToAdjust.isNegative())) {
                if (amountToAdjust.isPositive()) {
                    // Stock IN with batch
                    await tx.stockBatch.create({
                        data: {
                            stockId: stock.id,
                            batchNo: input.batchNo,
                            expiryDate: input.expiryDate,
                            quantityBaseUnit: amountToAdjust,
                        }
                    });
                } else {
                    // Stock OUT - Apply FIFO
                    let remainingToDeduct = amountToAdjust.abs();

                    // Get all available batches ordered by expiry or created date
                    const batches = await tx.stockBatch.findMany({
                        where: { stockId: stock.id, quantityBaseUnit: { gt: 0 } },
                        orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }]
                    });

                    for (const batch of batches) {
                        if (remainingToDeduct.isZero()) break;

                        const batchQty = new Decimal(batch.quantityBaseUnit as any);
                        const deduct = Decimal.min(batchQty, remainingToDeduct);

                        await tx.stockBatch.update({
                            where: { id: batch.id },
                            data: { quantityBaseUnit: batchQty.sub(deduct) }
                        });

                        remainingToDeduct = remainingToDeduct.sub(deduct);
                    }

                    if (remainingToDeduct.gt(0) && !allowNegative) {
                        throw new Error('Insufficient batch stock for FIFO deduction.');
                    }
                }
            }

            // 6. Update main stock record
            const updatedStock = await tx.stock.update({
                where: { id: stock.id },
                data: { quantityBaseUnit: newTotal }
            });

            // 7. Create Movement Record
            await tx.stockMovement.create({
                data: {
                    businessId,
                    itemId,
                    warehouseId,
                    type,
                    referenceType: input.referenceType,
                    referenceId: input.referenceId,
                    quantityBaseUnit: amountToAdjust,
                    createdBy: userId,
                }
            });

            return updatedStock;
        });
    }

    static async getWarehouseStock(warehouseId: string) {
        return prisma.stock.findMany({
            where: { warehouseId },
            include: {
                item: true,
                batches: {
                    where: { quantityBaseUnit: { gt: 0 } },
                    orderBy: { expiryDate: 'asc' }
                }
            }
        });
    }
}
