import { ConfigService } from "@/services/config-service";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const businessId = params.id;
        const config = await ConfigService.getEffectiveConfig(businessId);
        return NextResponse.json(config);
    } catch (error) {
        console.error("Failed to fetch config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
