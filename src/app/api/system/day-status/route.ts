import { NextRequest, NextResponse } from "next/server";
import { SystemService } from "@/services/system-service";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
        return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    try {
        const isOpen = await SystemService.isDayOpen(businessId);
        return NextResponse.json({ isOpen });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
