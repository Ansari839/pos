import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    const warehouses = await prisma.warehouse.findMany({
        where: { businessId }
    });
    return NextResponse.json(warehouses);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { businessId, name, isDefault } = body;

        const warehouse = await prisma.warehouse.create({
            data: { businessId, name, isDefault: isDefault || false }
        });
        return NextResponse.json(warehouse);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
