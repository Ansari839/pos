import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BusinessService } from "@/services/business-service";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true }
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (user.status !== "ACTIVE") {
            return NextResponse.json({ error: "Account is not active" }, { status: 403 });
        }

        const business = await BusinessService.getBusinessWithFullContext(user.businessId);

        // Return sensitive user data without password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword,
            business
        });

    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
