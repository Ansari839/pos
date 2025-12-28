import { ItemService } from "@/services/item-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Items CRUD
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    const items = await ItemService.getItems(businessId);
    return NextResponse.json(items);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, ...input } = body;
        const item = await ItemService.createItem(input, userId || "SYSTEM");
        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// Helper routes for Categories, Units, Taxes (Simple finds)
// In a full app, these would be in separate files
export async function GET_CATEGORIES(businessId: string) {
    return prisma.category.findMany({ where: { businessId } });
}
