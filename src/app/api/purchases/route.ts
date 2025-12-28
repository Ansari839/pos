
import { PurchaseService } from "@/services/purchase-service";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    try {
        const purchases = await PurchaseService.getPurchases(businessId);
        return NextResponse.json(purchases);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const purchase = await PurchaseService.createPurchase(body);
        return NextResponse.json(purchase);
    } catch (error: any) {
        console.error("Purchase creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
