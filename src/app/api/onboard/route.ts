import { BusinessService } from "@/services/business-service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = await BusinessService.onboardBusiness(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Onboarding error:", error);
        return NextResponse.json({ error: error.message || "Onboarding failed" }, { status: 400 });
    }
}
