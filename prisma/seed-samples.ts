import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding samples for Test Business...');

    const business = await prisma.business.findFirst({
        where: { name: 'Test Coffee Shop' },
        include: { industry: true }
    });

    if (!business) {
        console.log('Test Coffee Shop not found. Please run initial foundations first.');
        return;
    }

    // Create Categories
    const catBeverage = await prisma.category.upsert({
        where: { businessId_name: { businessId: business.id, name: 'Beverages' } },
        update: {},
        create: { businessId: business.id, name: 'Beverages' }
    });

    const catFood = await prisma.category.upsert({
        where: { businessId_name: { businessId: business.id, name: 'Food' } },
        update: {},
        create: { businessId: business.id, name: 'Food' }
    });

    // Create Units
    const unitPiece = await prisma.unit.upsert({
        where: { businessId_name: { businessId: business.id, name: 'Piece' } },
        update: {},
        create: { businessId: business.id, name: 'Piece', symbol: 'pcs' }
    });

    // Create Tax
    const taxVAT = await prisma.tax.upsert({
        where: { businessId_name: { businessId: business.id, name: 'VAT 15%' } },
        update: {},
        create: { businessId: business.id, name: 'VAT 15%', rate: 15, type: 'EXCLUSIVE' }
    });

    // Create Items
    const items = [
        {
            name: 'Latte',
            code: 'LAT001',
            type: 'PRODUCT',
            basePrice: 4.50,
            categoryId: catBeverage.id,
            unitId: unitPiece.id,
            taxId: taxVAT.id,
            trackStock: true
        },
        {
            name: 'Cappuccino',
            code: 'CAP002',
            type: 'PRODUCT',
            basePrice: 4.25,
            categoryId: catBeverage.id,
            unitId: unitPiece.id,
            taxId: taxVAT.id,
            trackStock: true
        },
        {
            name: 'Croissant',
            code: 'CRO003',
            type: 'PRODUCT',
            basePrice: 3.50,
            categoryId: catFood.id,
            unitId: unitPiece.id,
            taxId: taxVAT.id,
            trackStock: true
        },
        {
            name: 'Barista Training',
            code: 'SRV001',
            type: 'SERVICE',
            basePrice: 50.00,
            categoryId: null,
            unitId: null,
            taxId: taxVAT.id,
            trackStock: false
        }
    ];

    for (const item of items) {
        await prisma.item.upsert({
            where: { businessId_code: { businessId: business.id, code: item.code } },
            update: { ...item, basePrice: item.basePrice as any },
            create: { ...item, businessId: business.id, basePrice: item.basePrice as any }
        });
    }

    console.log('Sample data seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
