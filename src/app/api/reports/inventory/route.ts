import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return NextResponse.json({ error: "Business ID required" }, { status: 400 });
        }

        const stocks = await prisma.stock.findMany({
            where: { businessId },
            include: {
                item: {
                    include: {
                        unit: true,
                        category: true
                    }
                },
                warehouse: true
            },
            orderBy: {
                item: { name: 'asc' }
            }
        });

        const report = stocks.map(s => ({
            id: s.id,
            itemName: s.item.name,
            itemCode: s.item.code,
            category: s.item.category?.name || 'Uncategorized',
            warehouse: s.warehouse.name,
            quantity: s.quantityBaseUnit,
            unit: s.item.unit?.name || 'Unit',
            costPrice: s.item.costPrice,
            valuation: Number(s.quantityBaseUnit) * Number(s.item.costPrice || 0)
        }));

        return NextResponse.json(report);
    } catch (error: any) {
        console.error("Inventory Report Error", error);
        return NextResponse.json({ error: "Failed to fetch inventory report" }, { status: 500 });
    }
}
