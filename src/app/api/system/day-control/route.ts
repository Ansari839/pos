import { NextRequest, NextResponse } from "next/server";
import { SystemService } from "@/services/system-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { businessId, userId, action, keys } = body;

        if (!businessId || !userId || !action || !keys) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (action === "OPEN") {
            const dayRecord = await SystemService.openDay(businessId, userId, keys);
            return NextResponse.json(dayRecord);
        } else if (action === "CLOSE") {
            const dayRecord = await SystemService.closeDay(businessId, userId, keys);
            return NextResponse.json(dayRecord);
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
