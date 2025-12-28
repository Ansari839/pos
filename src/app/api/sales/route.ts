import { SaleService } from "@/services/sale-service";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    const sales = await SaleService.getSales(businessId);
    return NextResponse.json(sales);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const sale = await SaleService.createSale(body);
        return NextResponse.json(sale);
    } catch (error: any) {
        console.error("Sale creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
