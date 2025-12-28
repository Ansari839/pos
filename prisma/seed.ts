import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding industries...');
    const industries = [
        { name: 'Restaurant', iconPack: 'utensils', defaultTheme: 'orange' },
        { name: 'Grocery', iconPack: 'shopping-cart', defaultTheme: 'emerald' },
        { name: 'Pharmacy', iconPack: 'pill', defaultTheme: 'blue' },
        { name: 'Clothing', iconPack: 'shirt', defaultTheme: 'rose' },
        { name: 'Electronics', iconPack: 'smartphone', defaultTheme: 'slate' },
    ];

    console.log('Seeding features...');
    const featuresList = [
        { key: 'INVENTORY', description: 'Stock tracking and warehouse management' },
        { key: 'POS_BASIC', description: 'Point of Sale billing engine' },
        { key: 'TABLE_MANAGEMENT', description: 'Floor plans and table status' },
        { key: 'BATCH_TRACKING', description: 'FIFO batch and expiry tracking' },
        { key: 'EXPIRY_TRACKING', description: 'Track item expiry dates' },
    ];

    for (const f of featuresList) {
        await prisma.feature.upsert({
            where: { key: f.key },
            update: { description: f.description },
            create: f,
        });
    }

    for (const ind of industries) {
        await prisma.industry.upsert({
            where: { name: ind.name },
            update: {},
            create: ind,
        });
    }

    console.log('Seeding roles and permissions...');
    const roles = ['Admin', 'Manager', 'Cashier'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }

    const modules = ['POS', 'Inventory', 'Reports', 'Settings', 'Users'];
    const actions = ['create', 'read', 'update', 'delete', 'manage'];

    for (const module of modules) {
        for (const action of actions) {
            await prisma.permission.upsert({
                where: { module_action: { module, action } },
                update: {},
                create: { module, action },
            });
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
