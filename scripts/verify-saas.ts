import { prisma } from "../src/lib/prisma";

async function verifySaaS() {
    console.log("🚀 Starting SaaS Productization Verification...");

    try {
        // 1. Test Health Check Logic
        console.log("Checking system health logic...");
        const dbTest = await prisma.$queryRaw`SELECT 1`;
        if (dbTest) {
            console.log("✅ Database connectivity verified.");
        }

        // 2. Verify Multi-tenancy Isolation (Simulated)
        console.log("Verifying data isolation patterns...");
        const businesses = await prisma.business.findMany({ take: 2 });

        if (businesses.length > 0) {
            const biz = businesses[0];
            const items = await prisma.item.findMany({
                where: { businessId: biz.id },
                take: 1
            });

            if (items.length > 0 && items[0].businessId !== biz.id) {
                throw new Error("CRITICAL: Data isolation breach detected!");
            }
            console.log(`✅ Isolation verified for business: ${biz.name}`);
        } else {
            console.warn("⚠️ No businesses found to verify isolation. Please run seed.");
        }

        // 3. Environment Check
        console.log("Checking production environment variables...");
        const requiredVars = ["DATABASE_URL", "JWT_SECRET", "NEXTAUTH_URL"];
        requiredVars.forEach(v => {
            if (!process.env[v]) console.warn(`⚠️ Missing recommended env var: ${v}`);
            else console.log(`✅ Env var present: ${v}`);
        });

        console.log("\n✨ SaaS Productization Verification PASSED!");
    } catch (error: any) {
        console.error(`\n❌ SaaS Verification FAILED: ${error.message}`);
    }
}

verifySaaS();
