
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return NextResponse.json({ error: "Business ID required" }, { status: 400 });
        }

        const users = await prisma.user.findMany({
            where: { businessId },
            include: { role: true },
            orderBy: { createdAt: 'desc' }
        });

        // Hide passwords
        const safeUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role.name,
            createdAt: u.createdAt
        }));

        return NextResponse.json(safeUsers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { businessId, name, email, password, roleName } = body;

        if (!businessId || !email || !password || !roleName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check active email
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                businessId,
                name,
                email,
                password: hashedPassword,
                roleId: role.id
            },
            include: { role: true }
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name
        });

    } catch (error) {
        console.error("Create User Error", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
