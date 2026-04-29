import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    // 2. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Update password and clear vendor_pending status if applicable
    const password_hash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: {
        password_hash,
      },
    });

    return NextResponse.json({ message: "Account setup successful" });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
