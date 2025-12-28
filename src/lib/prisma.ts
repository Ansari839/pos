import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

const prismaClientSingleton = () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export let prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Detect stale client (missing models) and force reload in dev
if (process.env.NODE_ENV !== 'production') {
    if (prisma && !(prisma as any).purchase) {
        console.log("🔄 Stale Prisma Client detected. Forcing re-instantiation...");
        prisma = prismaClientSingleton();
    }
    globalForPrisma.prisma = prisma;
}

/* 
 * Audit Middleware / Extension Foundation
 * To be expanded with specific user context from request.
 * 
 * Example usage in service:
 * await prisma.$transaction(async (tx) => {
 *   // perform action
 *   // create audit log using tx.auditLog.create(...)
 * })
 */
