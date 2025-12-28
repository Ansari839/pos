import { prisma } from '../lib/prisma';
import { Decimal } from 'decimal.js';
import { AccountingService } from './accounting-service';

export interface ReturnItemInput {
    itemId: string;
    quantity: number;
}

export interface ReturnInput {
    businessId: string;
    userId: string;
    saleId: string;
    reason?: string;
    items: ReturnItemInput[];
    refunds: { method: string; amount: number }[];
}

export class ReturnService {
    /**
     * Processes a sale return transactionally.
     * Restores inventory, reverses accounting, and creates return records.
     */
    static async processReturn(input: ReturnInput) {
        return await prisma.$transaction(async (tx: any) => {
            // 1. Fetch original Sale
            const sale = await tx.sale.findUnique({
                where: { id: input.saleId },
                include: {
                    items: true,
                    returns: {
                        include: { items: true }
                    }
                }
            });
            if (!sale) throw new Error('Sale not found');

            // 2. Validate return rules
            let subtotal = new Decimal(0);
            let taxTotal = new Decimal(0);

            for (const rItem of input.items) {
                const originalItem = sale.items.find((i: any) => i.itemId === rItem.itemId);
                if (!originalItem) throw new Error(`Item ${rItem.itemId} was not part of this sale`);

                // Calculate how many have already been returned
                const alreadyReturned = sale.returns.reduce((acc: any, ret: any) => {
                    const matched = ret.items.find((i: any) => i.itemId === rItem.itemId);
                    return acc.plus(matched?.quantity || 0);
                }, new Decimal(0));

                const remaining = new Decimal(originalItem.quantity).minus(alreadyReturned);
                if (new Decimal(rItem.quantity).gt(remaining)) {
                    throw new Error(`Cannot return more than remaining quantity for item ${rItem.itemId}. Remaining: ${remaining}`);
                }

                // Proportional tax and subtotal based on original sale
                const qtyRatio = new Decimal(rItem.quantity).div(originalItem.quantity);
                const iSub = new Decimal(originalItem.unitPrice).mul(rItem.quantity);
                const iTax = new Decimal(originalItem.taxAmount).mul(qtyRatio);

                subtotal = subtotal.plus(iSub);
                taxTotal = taxTotal.plus(iTax);
            }

            const total = subtotal.plus(taxTotal);
            const refundTotal = input.refunds.reduce((acc: any, r: any) => acc.plus(r.amount), new Decimal(0));

            // Allow small rounding differences if necessary, but here we enforce exact match
            if (!refundTotal.toDP(4).eq(total.toDP(4))) {
                throw new Error(`Refund total (${refundTotal.toFixed(2)}) must equal return total (${total.toFixed(2)})`);
            }

            // 3. Create SaleReturn
            const saleReturn = await tx.saleReturn.create({
                data: {
                    businessId: input.businessId,
                    saleId: input.saleId,
                    reason: input.reason,
                    createdBy: input.userId,
                    subtotal,
                    taxTotal,
                    total,
                    items: {
                        create: input.items.map((ri: any) => {
                            const original = sale.items.find((i: any) => i.itemId === ri.itemId)!;
                            const qtyRatio = new Decimal(ri.quantity).div(original.quantity);
                            const iTax = new Decimal(original.taxAmount).mul(qtyRatio);
                            const iSub = new Decimal(original.unitPrice).mul(ri.quantity);
                            return {
                                itemId: ri.itemId,
                                quantity: ri.quantity,
                                unitPrice: original.unitPrice,
                                taxAmount: iTax,
                                total: iSub.plus(iTax)
                            };
                        })
                    },
                    refunds: {
                        create: input.refunds
                    }
                }
            });

            // 4. Update Inventory (Restore stock)
            for (const ri of input.items) {
                const item = await tx.item.findUnique({ where: { id: ri.itemId } });
                if (item?.trackStock) {
                    await tx.stock.upsert({
                        where: {
                            warehouseId_itemId: {
                                warehouseId: sale.warehouseId,
                                itemId: ri.itemId
                            }
                        },
                        update: {
                            quantityBaseUnit: { increment: ri.quantity }
                        },
                        create: {
                            businessId: input.businessId,
                            warehouseId: sale.warehouseId,
                            itemId: ri.itemId,
                            quantityBaseUnit: ri.quantity
                        }
                    });

                    // Log movement
                    await tx.stockMovement.create({
                        data: {
                            businessId: input.businessId,
                            itemId: ri.itemId,
                            warehouseId: sale.warehouseId,
                            type: 'RETURN',
                            referenceType: 'RETURN',
                            referenceId: saleReturn.id,
                            quantityBaseUnit: ri.quantity,
                            createdBy: input.userId
                        }
                    });
                }
            }

            // 5. Accounting reversal
            await AccountingService.postReturnAccounting(saleReturn.id, tx);

            return saleReturn;
        });
    }
}
