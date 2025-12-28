
import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function check() {
    const businesses: any[] = await (prisma.business as any).findMany({
        include: { accounts: true }
    });

    console.log("=== BUSINESSES AND ACCOUNTS ===");
    businesses.forEach(b => {
        console.log(`Business: ${b.name} (${b.id})`);
        console.log(`Accounts: ${b.accounts.map((a: any) => a.name).join(', ')}`);
        console.log('---');
    });

    const items: any[] = await (prisma.item as any).findMany();
    console.log("=== ITEMS ===");
    items.forEach(i => {
        console.log(`Item: ${i.name} (${i.id}) - BasePrice: ${i.basePrice}`);
    });
}

check().catch(console.error).finally(() => prisma.$disconnect());
