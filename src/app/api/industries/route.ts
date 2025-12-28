import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const industries = await prisma.industry.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(industries);
    } catch (error) {
        console.error("Failed to fetch industries:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
