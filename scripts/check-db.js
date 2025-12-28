const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function check() {
    const businesses = await prisma.business.findMany({
        include: { accounts: true }
    });

    console.log("=== BUSINESSES AND ACCOUNTS ===");
    businesses.forEach(b => {
        console.log(`Business: ${b.name} (${b.id})`);
        console.log(`Accounts: ${b.accounts.map(a => a.name).join(', ')}`);
        console.log('---');
    });

    const items = await prisma.item.findMany();
    console.log("=== ITEMS ===");
    items.forEach(i => {
        console.log(`Item: ${i.name} (${i.id}) - BasePrice: ${i.basePrice}`);
    });
}

check().catch(console.error).finally(() => prisma.$disconnect());
