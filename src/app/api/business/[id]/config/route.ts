import { ConfigService } from "@/services/config-service";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const businessId = params.id;
        const config = await ConfigService.getEffectiveConfig(businessId);
        return NextResponse.json(config);
    } catch (error) {
        console.error("Failed to fetch config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
