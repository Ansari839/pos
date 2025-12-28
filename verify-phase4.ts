import 'dotenv/config';
import { PricingEngine } from './src/lib/pricing-engine';
import { UnitService } from './src/services/unit-service';
import { ItemService } from './src/services/item-service';
import { prisma } from './src/lib/prisma';
import { Decimal } from 'decimal.js';

async function verifyPhase4() {
    console.log('--- STARTING PHASE 4 VERIFICATION (Master Data) ---');

    try {
        // 1. Get Test business and User
        const business = await prisma.business.findFirst({ where: { name: 'Test Coffee Shop' } });
        const admin = await prisma.user.findFirst({ where: { businessId: business?.id } });
        if (!business || !admin) throw new Error('Test data missing');

        // 2. Verify Pricing Math (decimal.js)
        console.log('Testing Pricing Engine (Inclusive/Exclusive Tax)...');

        // Exclusive: $100 + 15% Tax = $115 total, $15 tax
        const excl = PricingEngine.calculateItemPrice(100, 1, { rate: 15, type: 'EXCLUSIVE' });
        console.log('Exclusive Tax Result:', excl.total.toString(), 'Tax:', excl.taxAmount.toString());
        if (excl.total.toNumber() !== 115) throw new Error('Exclusive pricing failed');

        // Inclusive: $115 total includes 15% Tax -> $100 base, $15 tax
        const incl = PricingEngine.calculateItemPrice(115, 1, { rate: 15, type: 'INCLUSIVE' });
        console.log('Inclusive Tax Result:', incl.total.toString(), 'Tax:', incl.taxAmount.toString());
        if (incl.taxAmount.toNumber() !== 15) throw new Error('Inclusive pricing failed');
        console.log('✓ Pricing math verified.');

        // 3. Verify Item Creation Constraints
        console.log('Testing Item Service Constraints...');

        // Create a SERVICE (should auto-disable stock tracking)
        const service = await ItemService.createItem({
            businessId: business.id,
            name: 'Express Delivery Service',
            type: 'SERVICE',
            basePrice: 50,
            trackStock: true, // Should be overridden to false
        }, admin.id);

        console.log('Service trackStock:', service.trackStock);
        if (service.trackStock) throw new Error('Service should not track stock.');

        // Create a product with Batch Tracking (when feature is OFF - Restaurant default is off)
        const product = await ItemService.createItem({
            businessId: business.id,
            name: 'Whole Milk',
            type: 'PRODUCT',
            basePrice: 5,
            trackBatch: true, // Should be overridden to false because feature is off
        }, admin.id);

        console.log('Product trackBatch (Feature OFF):', product.trackBatch);
        if (product.trackBatch) throw new Error('Batch tracking should be disabled by feature flag.');
        console.log('✓ Item constraints verified.');

        console.log('--- PHASE 4 VERIFICATION COMPLETE ---');
    } catch (error) {
        console.error('PHASE 4 VERIFICATION FAILED:', error);
        process.exit(1);
    }
}

verifyPhase4();
