import { InventoryService } from "@/services/inventory-service";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    if (!warehouseId) return NextResponse.json({ error: "Missing warehouseId" }, { status: 400 });

    const stock = await InventoryService.getWarehouseStock(warehouseId);
    return NextResponse.json(stock);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, ...input } = body;
        const result = await InventoryService.adjustStock({ ...input, userId: userId || "SYSTEM" });
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
