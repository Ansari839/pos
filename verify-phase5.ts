import 'dotenv/config';
import { InventoryService } from './src/services/inventory-service';
import { prisma } from './src/lib/prisma';
import { Decimal } from 'decimal.js';

async function verifyPhase5() {
    console.log('--- STARTING PHASE 5 VERIFICATION (Inventory Engine) ---');

    try {
        // 1. Get Test business and User
        const business = await prisma.business.findFirst({ where: { name: 'Test Coffee Shop' } });
        const admin = await prisma.user.findFirst({ where: { businessId: business?.id } });
        if (!business || !admin) throw new Error('Test data missing');

        // Ensure BATCH_TRACKING is enabled
        const batchFeature = await prisma.feature.findUnique({ where: { key: 'BATCH_TRACKING' } });
        if (batchFeature) {
            await prisma.businessFeature.upsert({
                where: { businessId_featureId: { businessId: business.id, featureId: batchFeature.id } },
                update: { enabled: true },
                create: { businessId: business.id, featureId: batchFeature.id, enabled: true }
            });
        }

        const item = await prisma.item.findFirst({ where: { businessId: business.id, name: 'Latte' } });
        if (!item) throw new Error('Test item (Latte) missing');

        const warehouse = await prisma.warehouse.upsert({
            where: { businessId_name: { businessId: business.id, name: 'Main Warehouse' } },
            update: {},
            create: { businessId: business.id, name: 'Main Warehouse', isDefault: true }
        });

        // RESET: Clear existing stock for this item to ensure clean test
        await prisma.stockBatch.deleteMany({ where: { stock: { itemId: item.id, warehouseId: warehouse.id } } });
        await prisma.stock.deleteMany({ where: { itemId: item.id, warehouseId: warehouse.id } });

        // 2. Test Stock IN (Batch 1: 10 qty)
        console.log('Testing Stock IN (Batch 1)...');
        await InventoryService.adjustStock({
            businessId: business.id,
            itemId: item.id,
            warehouseId: warehouse.id,
            quantity: 10,
            unitId: item.unitId!,
            type: 'IN',
            referenceType: 'PURCHASE',
            batchNo: 'B001',
            userId: admin.id
        });

        // 3. Test Stock IN (Batch 2: 5 qty)
        console.log('Testing Stock IN (Batch 2)...');
        await InventoryService.adjustStock({
            businessId: business.id,
            itemId: item.id,
            warehouseId: warehouse.id,
            quantity: 5,
            unitId: item.unitId!,
            type: 'IN',
            referenceType: 'PURCHASE',
            batchNo: 'B002',
            userId: admin.id
        });

        const initialStock = await InventoryService.getWarehouseStock(warehouse.id);
        const latteStock = initialStock.find(s => s.itemId === item.id);
        const totalQty = new Decimal(latteStock?.quantityBaseUnit as any).toNumber();
        console.log('Total Stock after IN:', totalQty);
        if (totalQty !== 15) throw new Error(`Total stock mismatch after IN: expected 15, got ${totalQty}`);

        // 4. Test Stock OUT (12 qty - should consume B001 [10] and B002 [2])
        console.log('Testing Stock OUT (FIFO Deduction - 12 qty)...');
        await InventoryService.adjustStock({
            businessId: business.id,
            itemId: item.id,
            warehouseId: warehouse.id,
            quantity: 12,
            unitId: item.unitId!,
            type: 'OUT',
            referenceType: 'POS',
            userId: admin.id
        });

        const postOutStock = await InventoryService.getWarehouseStock(warehouse.id);
        const lattePostOut = postOutStock.find(s => s.itemId === item.id);
        const postOutQty = new Decimal(lattePostOut?.quantityBaseUnit as any).toNumber();
        console.log('Total Stock after OUT:', postOutQty);
        if (postOutQty !== 3) throw new Error(`Total stock mismatch after OUT: expected 3, got ${postOutQty}`);

        const b001 = lattePostOut?.batches.find(b => b.batchNo === 'B001');
        const b002 = lattePostOut?.batches.find(b => b.batchNo === 'B002');
        console.log('Batch B001 remaining (filtered):', b001 ? 'Found (Error)' : 'Not Found (Correct)');
        console.log('Batch B002 Qty:', b002?.quantityBaseUnit.toString() || '0');

        if (b001) throw new Error('FIFO failed: B001 should be empty and filtered out');
        if (new Decimal(b002?.quantityBaseUnit as any).toNumber() !== 3) throw new Error('FIFO failed: B002 should have 3 left');

        console.log('✓ FIFO & Batch logic verified.');

        // 5. Test Negative Stock Blockage
        console.log('Testing Negative Stock Blockage...');
        // Temporarily set rule to block negative
        await prisma.businessRule.upsert({
            where: { businessId_ruleKey: { businessId: business.id, ruleKey: 'stock.allow_negative' } },
            update: { ruleValue: false },
            create: { businessId: business.id, ruleKey: 'stock.allow_negative', ruleValue: false }
        });

        try {
            await InventoryService.adjustStock({
                businessId: business.id,
                itemId: item.id,
                warehouseId: warehouse.id,
                quantity: 10,
                unitId: item.unitId!,
                type: 'OUT',
                referenceType: 'POS',
                userId: admin.id
            });
            throw new Error('Should have blocked negative stock');
        } catch (e: any) {
            console.log('Caught expected error:', e.message);
            if (e.message !== 'Insufficient stock and negative stock is disallowed.') throw e;
        }
        console.log('✓ Negative stock rule verified.');

        console.log('--- PHASE 5 VERIFICATION COMPLETE ---');
    } catch (error) {
        console.error('PHASE 5 VERIFICATION FAILED:', error);
        process.exit(1);
    }
}

verifyPhase5();
