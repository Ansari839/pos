import { prisma } from '../lib/prisma';
import type { Prisma } from '../generated/prisma';
import { Decimal } from 'decimal.js';

export class AccountingService {
    /**
     * Posts accounting entries for a finalized sale.
     * This follows standard double-entry bookkeeping.
     */
    static async postSaleAccounting(saleId: string, tx?: any) {
        const db = tx || prisma;

        // 1. Fetch Sale with all needed details
        const sale = await db.sale.findUnique({
            where: { id: saleId },
            include: {
                items: true,
                payments: true,
                business: {
                    include: {
                        accounts: true
                    }
                }
            }
        });

        if (!sale) throw new Error(`Sale ${saleId} not found`);

        const accounts = sale.business.accounts;
        const findAccount = (name: string) => accounts.find((a: any) => a.name === name);

        const salesAcc = findAccount('Sales');
        const taxAcc = findAccount('Tax Payable');
        const cashAcc = findAccount('Cash');
        const bankAcc = findAccount('Bank');
        const arAcc = findAccount('Accounts Receivable');

        if (!salesAcc || !taxAcc) throw new Error('Essential accounting accounts missing');

        // 2. Prepare Journal Entry
        return await db.journalEntry.create({
            data: {
                businessId: sale.businessId,
                referenceType: 'POS',
                referenceId: sale.id,
                description: `POS Sale: ${sale.invoiceNo}`,
                lines: {
                    create: [
                        // Credit Sales (Income)
                        {
                            accountId: salesAcc.id,
                            debit: 0,
                            credit: sale.subtotal,
                        },
                        // Credit Tax Payable (Liability)
                        {
                            accountId: taxAcc.id,
                            debit: 0,
                            credit: sale.taxTotal,
                        },
                        // Debits for each payment
                        ...sale.payments.map((p: any) => {
                            let accId = cashAcc?.id;
                            if (p.method === 'CARD' || p.method === 'BANK') accId = bankAcc?.id;
                            if (p.method === 'CREDIT') accId = arAcc?.id;

                            if (!accId) throw new Error(`No account mapping for payment method ${p.method}`);

                            const lineData: any = {
                                accountId: accId,
                                debit: p.amount,
                                credit: 0,
                            };

                            // Link to PartyLedger if it's a CREDIT sale
                            if (p.method === 'CREDIT' && sale.customerId) {
                                lineData.partyLedger = {
                                    create: {
                                        partyId: sale.customerId
                                    }
                                };
                            }

                            return lineData;
                        })
                    ]
                }
            }
        });
    }

    /**
     * Posts accounting entries for a sale return.
     */
    static async postReturnAccounting(returnId: string, tx?: any) {
        const db = tx || prisma;

        const saleReturn = await db.saleReturn.findUnique({
            where: { id: returnId },
            include: {
                refunds: true,
                business: {
                    include: {
                        accounts: true
                    }
                },
                sale: true
            }
        });

        if (!saleReturn) throw new Error(`Sale Return ${returnId} not found`);

        const accounts = saleReturn.business.accounts;
        const findAccount = (name: string) => accounts.find((a: any) => a.name === name);

        const salesAcc = findAccount('Sales');
        const taxAcc = findAccount('Tax Payable');
        const cashAcc = findAccount('Cash');
        const bankAcc = findAccount('Bank');
        const arAcc = findAccount('Accounts Receivable');

        if (!salesAcc || !taxAcc) throw new Error('Essential accounting accounts missing');

        // Create Reversal Entry
        return await db.journalEntry.create({
            data: {
                businessId: saleReturn.businessId,
                referenceType: 'RETURN',
                referenceId: saleReturn.id,
                description: `Return for Sale: ${saleReturn.sale.invoiceNo}`,
                lines: {
                    create: [
                        // Debit Sales (Reverse Income)
                        {
                            accountId: salesAcc.id,
                            debit: saleReturn.subtotal,
                            credit: 0,
                        },
                        // Debit Tax Payable (Reverse Liability)
                        {
                            accountId: taxAcc.id,
                            debit: saleReturn.taxTotal,
                            credit: 0,
                        },
                        // Credits for each refund
                        ...saleReturn.refunds.map((r: any) => {
                            let accId = cashAcc?.id;
                            if (r.method === 'CARD' || r.method === 'BANK') accId = bankAcc?.id;
                            if (r.method === 'CREDIT') accId = arAcc?.id;

                            if (!accId) throw new Error(`No account mapping for refund method ${r.method}`);

                            const lineData: any = {
                                accountId: accId,
                                debit: 0,
                                credit: r.amount,
                            };

                            // Link to PartyLedger if it's reversal of a CREDIT sale
                            if (r.method === 'CREDIT' && saleReturn.sale.customerId) {
                                lineData.partyLedger = {
                                    create: {
                                        partyId: saleReturn.sale.customerId
                                    }
                                };
                            }

                            return lineData;
                        })
                    ]
                }
            }
        });
    }

    /**
     * Posts accounting entries for a stock adjustment.
     * Manual OUT (e.g. wastage) is usually an expense vs inventory deduction.
     * Manual IN (e.g. found stock) is inventory increase vs income.
     */
    static async postAdjustmentAccounting(adjustmentId: string, tx?: any) {
        const db = tx || prisma;
        const adj = await db.stockAdjustment.findUnique({
            where: { id: adjustmentId },
            include: {
                item: true,
                business: { include: { accounts: true } }
            }
        });

        if (!adj) throw new Error(`Stock Adjustment ${adjustmentId} not found`);

        const accounts = adj.business.accounts;
        const findAccount = (name: string) => accounts.find((a: any) => a.name === name);

        const inventoryAcc = findAccount('Inventory');
        const expenseAcc = findAccount('Cost of Goods Sold'); // Or a specific Wastage account
        const incomeAcc = findAccount('Sales'); // Or 'Miscellaneous Income'

        if (!inventoryAcc || !expenseAcc) throw new Error('Essential accounting accounts missing');

        const value = adj.value || new Decimal(adj.item.costPrice).mul(adj.quantityBaseUnit);

        return await db.journalEntry.create({
            data: {
                businessId: adj.businessId,
                referenceType: 'ADJUSTMENT',
                referenceId: adj.id,
                description: `Stock Adjustment: ${adj.reason || 'Manual correction'} (${adj.item.name})`,
                lines: {
                    create: adj.type === 'OUT' ? [
                        { accountId: expenseAcc.id, debit: value, credit: 0 },
                        { accountId: inventoryAcc.id, debit: 0, credit: value }
                    ] : [
                        { accountId: inventoryAcc.id, debit: value, credit: 0 },
                        { accountId: incomeAcc?.id || (findAccount('Sales')?.id), debit: 0, credit: value }
                    ]
                }
            }
        });
    }
}
