
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const type = searchParams.get("type"); // Optional: SUPPLIER or CUSTOMER

    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    const where: any = { businessId };
    if (type) where.type = type;

    try {
        const parties = await prisma.party.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(parties);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const party = await prisma.party.create({
            data: body
        });
        return NextResponse.json(party);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
