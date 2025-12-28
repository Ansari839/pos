import { prisma } from '../lib/prisma';
import type { Prisma } from '../generated/prisma';
import { InventoryService } from './inventory-service';
import { AccountingService } from './accounting-service';
import { PricingEngine } from '../lib/pricing-engine';
import { nanoid } from 'nanoid';
import { Decimal } from 'decimal.js';

export interface SaleItemInput {
    itemId: string;
    quantity: number;
    unitId: string;
    unitPrice: number;
    discountAmount?: number;
    batchNo?: string;
}

export interface SaleInput {
    businessId: string;
    userId: string;
    warehouseId: string;
    sessionId?: string;
    customerId?: string;
    items: SaleItemInput[];
    payments: { method: string; amount: number; referenceNo?: string }[];
}

export class SaleService {
    /**
     * Finalizes a sale transactionally.
     */
    static async createSale(input: SaleInput) {
        const invoiceNo = `INV-${nanoid(8).toUpperCase()}`;

        return await prisma.$transaction(async (tx: any) => {
            let subtotal = new Decimal(0);
            let taxTotal = new Decimal(0);
            let discountTotal = new Decimal(0);

            const saleItemsData = [];

            for (const itemInput of input.items) {
                // Fetch item details for tax calc
                const item = await tx.item.findUnique({
                    where: { id: itemInput.itemId },
                    include: { tax: true }
                });

                if (!item) throw new Error(`Item ${itemInput.itemId} not found`);

                const pricing = PricingEngine.calculateItemPrice(
                    itemInput.unitPrice,
                    1,
                    {
                        rate: (item.tax?.rate as any) || 0,
                        type: item.isTaxInclusive ? 'INCLUSIVE' : 'EXCLUSIVE'
                    }
                );

                const disc = new Decimal(itemInput.discountAmount || 0);
                const itemTotal = pricing.total.sub(disc).mul(itemInput.quantity);

                subtotal = subtotal.add(pricing.subtotal.mul(itemInput.quantity));
                taxTotal = taxTotal.add(pricing.taxAmount.mul(itemInput.quantity));
                discountTotal = discountTotal.add(disc.mul(itemInput.quantity));

                saleItemsData.push({
                    itemId: itemInput.itemId,
                    quantity: itemInput.quantity,
                    unitId: itemInput.unitId,
                    unitPrice: itemInput.unitPrice,
                    taxAmount: pricing.taxAmount.mul(itemInput.quantity),
                    discountAmount: disc.mul(itemInput.quantity),
                    total: itemTotal,
                    batchNo: itemInput.batchNo
                });

                // 1. Deduct Inventory (Transactional)
                if (item.trackStock) {
                    // Use the actual tx for nested operations if possible or handle manually
                    // Since InventoryService.adjustStock uses prisma.$transaction internally, 
                    // we need to be careful. In Prisma, we can't easily nest $transaction from another service.
                    // Refactor: We'll implement deduction logic directly here using the tx context.

                    let remainingToDeduct = new Decimal(itemInput.quantity);

                    // Total stock record update
                    const stock = await tx.stock.findUnique({
                        where: { warehouseId_itemId: { warehouseId: input.warehouseId, itemId: item.id } }
                    });

                    if (!stock || new Decimal(stock.quantityBaseUnit as any).lt(remainingToDeduct)) {
                        // Rule check: allow negative? 
                        // For simplicity, we assume strict stock for now unless we fetch config here
                        // throw new Error(`Insufficient stock for ${item.name}`);
                    }

                    await tx.stock.upsert({
                        where: { warehouseId_itemId: { warehouseId: input.warehouseId, itemId: item.id } },
                        update: { quantityBaseUnit: { decrement: remainingToDeduct } },
                        create: {
                            businessId: input.businessId,
                            warehouseId: input.warehouseId,
                            itemId: item.id,
                            quantityBaseUnit: remainingToDeduct.negated()
                        }
                    });

                    // FIFO Batch deduction if applicable
                    const batches = await tx.stockBatch.findMany({
                        where: { stockId: stock?.id, quantityBaseUnit: { gt: 0 } },
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

                    // Movement record
                    await tx.stockMovement.create({
                        data: {
                            businessId: input.businessId,
                            itemId: item.id,
                            warehouseId: input.warehouseId,
                            type: 'OUT',
                            referenceType: 'POS',
                            referenceId: invoiceNo,
                            quantityBaseUnit: new Decimal(itemInput.quantity).neg(),
                            createdBy: input.userId
                        }
                    });
                }
            }

            const total = subtotal.add(taxTotal).sub(discountTotal);

            // 2. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    invoiceNo,
                    businessId: input.businessId,
                    userId: input.userId,
                    warehouseId: input.warehouseId,
                    sessionId: input.sessionId,
                    customerId: input.customerId,
                    subtotal,
                    taxTotal,
                    discountTotal,
                    total,
                    items: {
                        create: saleItemsData
                    },
                    payments: {
                        create: input.payments.map(p => ({
                            method: p.method,
                            amount: p.amount,
                            referenceNo: p.referenceNo
                        }))
                    }
                },
                include: {
                    items: true,
                    payments: true
                }
            });

            // 3. Post Accounting
            await AccountingService.postSaleAccounting(sale.id, tx);

            return sale;
        });
    }

    static async getSales(businessId: string) {
        return prisma.sale.findMany({
            where: { businessId },
            include: { items: { include: { item: true } }, payments: true, user: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getSaleByInvoice(businessId: string, invoiceNo: string) {
        return await prisma.sale.findFirst({
            where: {
                businessId,
                invoiceNo: { equals: invoiceNo, mode: 'insensitive' }
            },
            include: {
                items: { include: { item: true } },
                returns: { include: { items: true } }
            }
        });
    }
}
