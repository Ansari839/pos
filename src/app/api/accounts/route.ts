import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    const accounts = await prisma.account.findMany({
        where: { businessId },
        orderBy: { type: 'asc' }
    });

    return NextResponse.json(accounts);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const account = await prisma.account.create({
            data: body
        });
        return NextResponse.json(account);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
