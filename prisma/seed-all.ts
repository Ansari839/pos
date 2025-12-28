import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Starting Master Seed...');

    // 1. Foundation: Features
    console.log('Seeding Features...');
    const features = [
        { key: 'POS_BASIC', description: 'Basic POS functionality', category: 'POS' },
        { key: 'INVENTORY', description: 'Inventory management', category: 'INVENTORY' },
        { key: 'ACCOUNTING', description: 'Accounting modules', category: 'ACCOUNTING' },
        { key: 'TABLE_MANAGEMENT', description: 'Table/Seat management', category: 'POS' },
        { key: 'BATCH_TRACKING', description: 'Track items by batch', category: 'INVENTORY' },
        { key: 'EXPIRY_TRACKING', description: 'Track item expiry dates', category: 'INVENTORY' },
        { key: 'SERVICE_ITEMS', description: 'Non-stock service items', category: 'POS' },
        { key: 'QR_SCAN', description: 'Customer QR scanning', category: 'POS' },
        { key: 'MULTI_WAREHOUSE', description: 'Support for multiple locations', category: 'INVENTORY' },
        { key: 'RETURNS', description: 'Sales returns and refunds', category: 'POS' },
        { key: 'STOCK_ADJUSTMENT', description: 'Physical stock corrections', category: 'INVENTORY' },
    ];

    for (const f of features) {
        await prisma.feature.upsert({
            where: { key: f.key },
            update: { category: f.category, description: f.description },
            create: f,
        });
    }

    // 2. Foundation: Industries
    console.log('Seeding Industries...');
    const industries = [
        {
            name: 'Restaurant',
            iconPack: 'utensils',
            defaultTheme: 'orange',
            defaultConfig: {
                features: { POS_BASIC: true, INVENTORY: true, ACCOUNTING: true, TABLE_MANAGEMENT: true, RETURNS: true },
                rules: { 'discount.max_percent': 15, 'stock.allow_negative': true }
            }
        },
        {
            name: 'Grocery',
            iconPack: 'shopping-cart',
            defaultTheme: 'emerald',
            defaultConfig: {
                features: { POS_BASIC: true, INVENTORY: true, ACCOUNTING: true, EXPIRY_TRACKING: true, BATCH_TRACKING: true, RETURNS: true },
                rules: { 'discount.max_percent': 10, 'stock.allow_negative': false }
            }
        },
        {
            name: 'Pharmacy',
            iconPack: 'pill',
            defaultTheme: 'blue',
            defaultConfig: {
                features: { POS_BASIC: true, INVENTORY: true, ACCOUNTING: true, EXPIRY_TRACKING: true, BATCH_TRACKING: true, RETURNS: true },
                rules: { 'discount.max_percent': 5, 'stock.allow_negative': false }
            }
        }
    ];

    for (const ind of industries) {
        await prisma.industry.upsert({
            where: { name: ind.name },
            update: {
                iconPack: ind.iconPack,
                defaultTheme: ind.defaultTheme,
                defaultConfig: ind.defaultConfig as any
            },
            create: ind as any,
        });
    }

    // 3. Foundation: Roles
    console.log('Seeding Roles...');
    const roles = ['Admin', 'Manager', 'Cashier'];
    for (const r of roles) {
        await prisma.role.upsert({
            where: { name: r },
            update: {},
            create: { name: r }
        });
    }

    // 4. Sample Business
    console.log('Creating Test Business...');
    const restaurantInd = await prisma.industry.findUnique({ where: { name: 'Restaurant' } });

    let business = await prisma.business.findFirst({
        where: { name: 'Test Coffee Shop' }
    });

    if (!business) {
        business = await prisma.business.create({
            data: {
                name: 'Test Coffee Shop',
                industryId: restaurantInd!.id,
                settings: restaurantInd!.defaultConfig as any
            }
        });
    }

    // 5. Sample User
    console.log('Creating Test Admin...');
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@poscore.com' },
        update: { businessId: business.id, roleId: adminRole!.id },
        create: {
            email: 'admin@poscore.com',
            name: 'System Admin',
            password: hashedPassword,
            businessId: business.id,
            roleId: adminRole!.id
        }
    });

    // 6. Sample Catalog
    console.log('Seeding Catalog (Items, Units, Categories)...');

    const unitPcs = await prisma.unit.upsert({
        where: { businessId_name: { businessId: business.id, name: 'Pieces' } },
        update: {},
        create: { businessId: business.id, name: 'Pieces', symbol: 'pcs' }
    });

    const catBev = await prisma.category.upsert({
        where: { businessId_name: { businessId: business.id, name: 'Beverages' } },
        update: {},
        create: { businessId: business.id, name: 'Beverages' }
    });

    const taxWat = await prisma.tax.upsert({
        where: { businessId_name: { businessId: business.id, name: 'VAT 10%' } },
        update: {},
        create: { businessId: business.id, name: 'VAT 10%', rate: 10, type: 'EXCLUSIVE' }
    });

    const items = [
        { name: 'Espresso', code: 'ESP001', type: 'PRODUCT', basePrice: 2.5, costPrice: 0.5, categoryId: catBev.id, unitId: unitPcs.id, taxId: taxWat.id },
        { name: 'Latte', code: 'LAT001', type: 'PRODUCT', basePrice: 4.0, costPrice: 1.0, categoryId: catBev.id, unitId: unitPcs.id, taxId: taxWat.id },
        { name: 'Cappuccino', code: 'CAP001', type: 'PRODUCT', basePrice: 3.5, costPrice: 0.8, categoryId: catBev.id, unitId: unitPcs.id, taxId: taxWat.id },
    ];

    for (const item of items) {
        await prisma.item.upsert({
            where: { businessId_code: { businessId: business.id, code: item.code } },
            update: { basePrice: item.basePrice as any, costPrice: item.costPrice as any },
            create: { ...item, businessId: business.id, basePrice: item.basePrice as any, costPrice: item.costPrice as any }
        });
    }

    // 7. Default Warehouse
    console.log('Creating Default Warehouse...');
    await prisma.warehouse.upsert({
        where: { businessId_name: { businessId: business.id, name: 'Main Store' } },
        update: {},
        create: {
            businessId: business.id,
            name: 'Main Store',
            isDefault: true
        }
    });

    console.log('✨ Master Seed Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
