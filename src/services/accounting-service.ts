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
}
