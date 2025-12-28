import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Test database connectivity
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            status: "UP",
            database: "CONNECTED",
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "DOWN",
            database: "DISCONNECTED",
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
