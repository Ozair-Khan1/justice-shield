import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/jwt";
import { cookies } from "next/headers";

import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, password, full_name, phone, otp } = await req.json();

    if (!email || !password || !otp) {
      return NextResponse.json({ error: "Email, password, and OTP are required" }, { status: 400 });
    }

    // Verify OTP
    const isOtpValid = await verifyOtp(email, otp);
    if (!isOtpValid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        full_name,
        phone,
      },
    });

    const token = await signJwt({ id: user.id, email: user.email, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      token,
    }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
