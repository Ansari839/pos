import { prisma } from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

export class SystemService {
    /**
     * Generates a unique operation key for a user.
     */
    static async generateKey(businessId: string, operation: string, userId: string) {
        const key = uuidv4().split('-')[0].toUpperCase(); // Simple 8-char key
        return await prisma.operationKey.create({
            data: {
                businessId,
                operation,
                key,
                assignedToId: userId
            }
        });
    }

    /**
     * Validates a set of keys for a specific operation.
     */
    static async validateKeys(businessId: string, operation: string, keys: string[]) {
        const foundKeys = await prisma.operationKey.findMany({
            where: {
                businessId,
                operation,
                key: { in: keys },
                used: false
            }
        });

        if (foundKeys.length !== keys.length) {
            throw new Error("One or more keys are invalid or already used.");
        }

        return foundKeys;
    }

    /**
     * Opens the business day.
     */
    static async openDay(businessId: string, userId: string, keys: string[]) {
        // Verification logic (e.g. requires at least 1-2 keys based on business rules)
        // For simplicity, we assume if keys are provided, they must be valid.

        await this.validateKeys(businessId, "DAY_OPEN", keys);

        return await prisma.$transaction(async (tx: any) => {
            // Mark keys as used
            await tx.operationKey.updateMany({
                where: { key: { in: keys } },
                data: { used: true }
            });

            // Create DayControl record
            return await tx.dayControl.create({
                data: {
                    businessId,
                    openedById: userId,
                    status: "OPEN",
                    date: new Date()
                }
            });
        });
    }

    /**
     * Closes the business day.
     */
    static async closeDay(businessId: string, userId: string, keys: string[]) {
        await this.validateKeys(businessId, "DAY_CLOSE", keys);

        return await prisma.$transaction(async (tx: any) => {
            // Mark keys as used
            await tx.operationKey.updateMany({
                where: { key: { in: keys } },
                data: { used: true }
            });

            // Update DayControl record
            const dayRecord = await tx.dayControl.findFirst({
                where: {
                    businessId,
                    status: "OPEN"
                },
                orderBy: { date: 'desc' as const }
            });

            if (!dayRecord) throw new Error("No open day found to close.");

            return await tx.dayControl.update({
                where: { id: dayRecord.id },
                data: {
                    status: "CLOSED",
                    closedById: userId,
                    closedAt: new Date()
                }
            });
        });
    }

    /**
     * Checks if the business day is currently open.
     */
    static async isDayOpen(businessId: string) {
        const openDay = await prisma.dayControl.findFirst({
            where: {
                businessId,
                status: "OPEN"
            },
            orderBy: { date: 'desc' }
        });
        return !!openDay;
    }
}
