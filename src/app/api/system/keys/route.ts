import { NextRequest, NextResponse } from "next/server";
import { SystemService } from "@/services/system-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { businessId, operation, userId } = body;

        if (!businessId || !operation || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const keyRecord = await SystemService.generateKey(businessId, operation, userId);
        return NextResponse.json(keyRecord);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
