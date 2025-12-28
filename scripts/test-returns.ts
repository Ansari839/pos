import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { SaleService } from '../src/services/sale-service';
import { ReturnService } from '../src/services/return-service';
import { AdjustmentService } from '../src/services/adjustment-service';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('--- Phase 8: Returns & Adjustments Test ---');

    // 1. Setup Data
    const business = await prisma.business.findFirst();
    if (!business) {
        console.error('No business found. Run seed first.');
        return;
    }
    const user = await prisma.user.findFirst({ where: { businessId: business.id } });
    const item = await prisma.item.findFirst({ where: { businessId: business.id } });
    const warehouse = await prisma.warehouse.findFirst({ where: { businessId: business.id } });

    const unit = await prisma.unit.findFirst({ where: { businessId: business.id } });

    if (!user || !item || !warehouse || !unit) {
        console.error('Missing user, item, warehouse, or unit.');
        return;
    }

    console.log(`Using Business: ${business.name}, Item: ${item.name}`);

    // 2. Create a Sale
    console.log('Creating a sale...');
    const sale = await SaleService.createSale({
        businessId: business.id,
        userId: user.id,
        warehouseId: warehouse.id,
        items: [{
            itemId: item.id,
            quantity: 5,
            unitId: unit.id,
            unitPrice: 100
        }],
        payments: [{
            method: 'CASH',
            amount: 500
        }]
    });
    console.log(`Sale Created: ${sale.invoiceNo}, Total: ${sale.total}`);

    // Check inventory before return
    const stockBefore = await prisma.stock.findUnique({
        where: { warehouseId_itemId: { warehouseId: warehouse.id, itemId: item.id } }
    });
    console.log(`Stock before return: ${stockBefore?.quantityBaseUnit}`);

    // 3. Process a Return
    console.log('Processing a partial return (2 items)...');
    const saleReturn = await ReturnService.processReturn({
        businessId: business.id,
        userId: user.id,
        saleId: sale.id,
        reason: 'Customer change of mind',
        items: [{
            itemId: item.id,
            quantity: 2
        }],
        refunds: [{
            method: 'CASH',
            amount: 230 // Matching return total (200 subtotal + 30 tax)
        }]
    });
    console.log(`Return Processed: ${saleReturn.id}, Total Refunded: ${saleReturn.total}`);

    // Check inventory after return
    const stockAfter = await prisma.stock.findUnique({
        where: { warehouseId_itemId: { warehouseId: warehouse.id, itemId: item.id } }
    });
    console.log(`Stock after return: ${stockAfter?.quantityBaseUnit}`);

    // 4. Test Stock Adjustment
    console.log('Testing Stock Adjustment (Wastage)...');
    const adjustment = await AdjustmentService.adjustStock({
        businessId: business.id,
        userId: user.id,
        warehouseId: warehouse.id,
        itemId: item.id,
        quantity: 1,
        type: 'OUT',
        reason: 'Packaging Damaged'
    });
    console.log(`Adjustment Created: ${adjustment.id}`);

    const stockFinal = await prisma.stock.findUnique({
        where: { warehouseId_itemId: { warehouseId: warehouse.id, itemId: item.id } }
    });
    console.log(`Final Stock: ${stockFinal?.quantityBaseUnit}`);

    // 5. Check Accounting
    const journals = await prisma.journalEntry.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { lines: { include: { account: true } } }
    });
    console.log('\n--- Recent Journal Entries ---');
    journals.forEach((j: any) => {
        console.log(`\n${j.description} (${j.createdAt.toLocaleTimeString()})`);
        j.lines.forEach((l: any) => {
            console.log(`  ${l.account.name.padEnd(20)} | Dr: ${l.debit.toString().padStart(8)} | Cr: ${l.credit.toString().padStart(8)}`);
        });
    });

    console.log('\n--- Test Complete ---');
}

main().catch(console.error);
