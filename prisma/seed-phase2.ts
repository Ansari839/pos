import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding Phase 2 features...');
    const features = [
        { key: 'POS_BASIC', description: 'Basic POS functionality', category: 'POS' },
        { key: 'INVENTORY', description: 'Inventory management', category: 'INVENTORY' },
        { key: 'ACCOUNTING', description: 'Accounting modules', category: 'ACCOUNTING' },
        { key: 'TABLE_MANAGEMENT', description: 'Table/Seat management for restaurants', category: 'POS' },
        { key: 'BATCH_TRACKING', description: 'Track items by batch', category: 'INVENTORY' },
        { key: 'EXPIRY_TRACKING', description: 'Track item expiry dates', category: 'INVENTORY' },
        { key: 'SERVICE_ITEMS', description: 'Non-stock service items', category: 'POS' },
        { key: 'QR_SCAN', description: 'customer QR scanning', category: 'POS' },
        { key: 'MULTI_WAREHOUSE', description: 'Support for multiple locations', category: 'INVENTORY' },
    ];

    for (const f of features) {
        await prisma.feature.upsert({
            where: { key: f.key },
            update: { category: f.category, description: f.description },
            create: f,
        });
    }

    console.log('Updating Industry default configs...');

    // Update Restaurant
    await prisma.industry.update({
        where: { name: 'Restaurant' },
        data: {
            defaultConfig: {
                features: {
                    TABLE_MANAGEMENT: true,
                    SERVICE_ITEMS: true,
                    EXPIRY_TRACKING: false,
                },
                rules: {
                    'discount.max_percent': 15,
                    'stock.allow_negative': true,
                },
            },
        },
    });

    // Update Grocery
    await prisma.industry.update({
        where: { name: 'Grocery' },
        data: {
            defaultConfig: {
                features: {
                    TABLE_MANAGEMENT: false,
                    EXPIRY_TRACKING: true,
                    BATCH_TRACKING: true,
                },
                rules: {
                    'discount.max_percent': 5,
                    'stock.allow_negative': false,
                },
            },
        },
    });

    console.log('Phase 2 seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
