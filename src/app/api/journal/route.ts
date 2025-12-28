import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    const journalEntries = await prisma.journalEntry.findMany({
        where: { businessId },
        include: {
            lines: {
                include: {
                    account: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(journalEntries);
}
