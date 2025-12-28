import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    const business = await prisma.business.findFirst();
    if (!business) return;

    const defaultAccounts = [
        { name: 'Cash', type: 'ASSET' },
        { name: 'Bank', type: 'ASSET' },
        { name: 'Accounts Receivable', type: 'ASSET' },
        { name: 'Sales', type: 'INCOME' },
        { name: 'Tax Payable', type: 'LIABILITY' },
        { name: 'Cost of Goods Sold', type: 'EXPENSE' },
        { name: 'Inventory', type: 'ASSET' },
    ];

    for (const acc of defaultAccounts) {
        await prisma.account.upsert({
            where: {
                businessId_name: {
                    businessId: business.id,
                    name: acc.name
                }
            },
            update: {},
            create: {
                businessId: business.id,
                ...acc
            }
        });
    }
    console.log('Default accounts initialized.');
}

main().catch(console.error);
