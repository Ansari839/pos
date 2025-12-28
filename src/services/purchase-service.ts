
import { prisma } from '../lib/prisma';
import type { Prisma } from '../generated/prisma';
import { InventoryService } from './inventory-service';
import { AccountingService } from './accounting-service';
import { PricingEngine } from '../lib/pricing-engine';
import { nanoid } from 'nanoid';
import { Decimal } from 'decimal.js';

export interface PurchaseItemInput {
    itemId: string;
    quantity: number;
    unitId: string;
    unitPrice: number; // Cost price
    taxAmount?: number;
    discountAmount?: number;
    batchNo?: string;
    expiryDate?: string;
}

export interface PurchaseInput {
    businessId: string;
    userId: string;
    warehouseId: string;
    supplierId: string;
    invoiceNo: string; // Supplier's invoice number
    items: PurchaseItemInput[];
    payments: { method: string; amount: number; referenceNo?: string }[];
}

export class PurchaseService {
    /**
     * Records a purchase and updates inventory/accounting.
     */
    static async createPurchase(input: PurchaseInput) {
        const referenceNo = `PUR-${nanoid(8).toUpperCase()}`;

        return await prisma.$transaction(async (tx: any) => {
            let subtotal = new Decimal(0);
            let taxTotal = new Decimal(0);
            let discountTotal = new Decimal(0);

            const purchaseItemsData = [];

            for (const itemInput of input.items) {
                const item = await tx.item.findUnique({
                    where: { id: itemInput.itemId }
                });

                if (!item) throw new Error(`Item ${itemInput.itemId} not found`);

                const lineTax = new Decimal(itemInput.taxAmount || 0);
                const lineDisc = new Decimal(itemInput.discountAmount || 0);
                const lineSubtotal = new Decimal(itemInput.unitPrice).mul(itemInput.quantity);
                const lineTotal = lineSubtotal.add(lineTax).sub(lineDisc);

                subtotal = subtotal.add(lineSubtotal);
                taxTotal = taxTotal.add(lineTax);
                discountTotal = discountTotal.add(lineDisc);

                purchaseItemsData.push({
                    itemId: itemInput.itemId,
                    quantity: itemInput.quantity,
                    unitId: itemInput.unitId,
                    unitPrice: itemInput.unitPrice,
                    taxAmount: lineTax,
                    discountAmount: lineDisc,
                    total: lineTotal,
                    batchNo: itemInput.batchNo,
                    expiryDate: itemInput.expiryDate ? new Date(itemInput.expiryDate) : null
                });

                // 1. Update Inventory
                if (item.trackStock) {
                    const qty = new Decimal(itemInput.quantity);

                    // Update Stock record
                    const stock = await tx.stock.upsert({
                        where: { warehouseId_itemId: { warehouseId: input.warehouseId, itemId: item.id } },
                        update: { quantityBaseUnit: { increment: qty } },
                        create: {
                            businessId: input.businessId,
                            warehouseId: input.warehouseId,
                            itemId: item.id,
                            quantityBaseUnit: qty
                        }
                    });

                    // Create Stock Batch
                    await tx.stockBatch.create({
                        data: {
                            stockId: stock.id,
                            batchNo: itemInput.batchNo || referenceNo,
                            expiryDate: itemInput.expiryDate ? new Date(itemInput.expiryDate) : null,
                            quantityBaseUnit: qty
                        }
                    });

                    // Record Movement
                    await tx.stockMovement.create({
                        data: {
                            businessId: input.businessId,
                            itemId: item.id,
                            warehouseId: input.warehouseId,
                            type: 'IN',
                            referenceType: 'PURCHASE',
                            referenceId: referenceNo,
                            quantityBaseUnit: qty,
                            createdBy: input.userId
                        }
                    });

                    // Update item latest cost price
                    await tx.item.update({
                        where: { id: item.id },
                        data: { costPrice: itemInput.unitPrice }
                    });
                }
            }

            const total = subtotal.add(taxTotal).sub(discountTotal);

            // 2. Create Purchase Record
            const purchase = await tx.purchase.create({
                data: {
                    invoiceNo: input.invoiceNo,
                    referenceNo,
                    businessId: input.businessId,
                    userId: input.userId,
                    warehouseId: input.warehouseId,
                    supplierId: input.supplierId,
                    subtotal,
                    taxTotal,
                    discountTotal,
                    total,
                    items: {
                        create: purchaseItemsData
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
            await AccountingService.postPurchaseAccounting(purchase.id, tx);

            return purchase;
        });
    }

    static async getPurchases(businessId: string) {
        return prisma.purchase.findMany({
            where: { businessId },
            include: { items: { include: { item: true } }, payments: true, user: true, supplier: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
