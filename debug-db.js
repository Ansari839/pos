const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
    const accounts = await prisma.account.findMany();
    console.log("Accounts Found:", accounts.map(a => `${a.name} (${a.type})`));

    const keys = await prisma.operationKey.findMany();
    console.log("Operation Keys:", keys.map(k => `${k.key} - ${k.operation} - used: ${k.used}`));

    const dayControl = await prisma.dayControl.findMany({
        orderBy: { date: 'desc' },
        take: 5
    });
    console.log("Day Control Records:", dayControl.map(d => `${d.date.toISOString()} - ${d.status}`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
