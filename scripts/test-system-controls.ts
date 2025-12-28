import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("Database URL present:", !!process.env.DATABASE_URL);

import { prisma } from "../src/lib/prisma";
import { SystemService } from "../src/services/system-service";

async function runVerification() {
    console.log("🚀 Starting System Controls Verification...");

    const business = await prisma.business.findFirst();
    const user = await prisma.user.findFirst();

    if (!business || !user) {
        console.error("❌ No business or user found. Please run seed first.");
        return;
    }

    console.log(`Checking for business: ${business.name}`);

    try {
        // 1. Check Initial Status
        const initialStatus = await SystemService.isDayOpen(business.id);
        console.log(`Initial Day Status: ${initialStatus ? "OPEN" : "CLOSED"}`);

        // 2. Generate Approval Key
        console.log("Generating key for DAY_OPEN...");
        const keyRecord = await SystemService.generateKey(business.id, "DAY_OPEN", user.id);
        console.log(`Key Generated: ${keyRecord.key} for User: ${user.email}`);

        // 3. Open Day with Key
        console.log("Attempting to open day...");
        const openResult = await SystemService.openDay(business.id, user.id, [keyRecord.key]);
        console.log(`✅ Day Opened! ID: ${openResult.id}, Date: ${openResult.date}`);

        // 4. Verify status is OPEN
        const afterOpenStatus = await SystemService.isDayOpen(business.id);
        console.log(`Day Status after opening: ${afterOpenStatus ? "OPEN" : "CLOSED"}`);
        if (!afterOpenStatus) throw new Error("Day should be OPEN");

        // 5. Generate Key for Close
        console.log("Generating key for DAY_CLOSE...");
        const closeKeyRecord = await SystemService.generateKey(business.id, "DAY_CLOSE", user.id);

        // 6. Close Day
        console.log("Attempting to close day...");
        const closeResult = await SystemService.closeDay(business.id, user.id, [closeKeyRecord.key]);
        console.log(`✅ Day Closed! Date: ${closeResult.closedAt}`);

        // 7. Verify status is CLOSED
        const finalStatus = await SystemService.isDayOpen(business.id);
        console.log(`Final Day Status: ${finalStatus ? "OPEN" : "CLOSED"}`);
        if (finalStatus) throw new Error("Day should be CLOSED");

        console.log("\n✨ System Controls Verification PASSED successfully!");
    } catch (error: any) {
        console.error(`\n❌ Verification FAILED: ${error.message}`);
    }
}

runVerification();
