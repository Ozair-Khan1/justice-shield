import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isValidToken = await verifyOtp(email, token);
    if (!isValidToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // 2. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const vendorApplication = await prisma.vendorApplication.findUnique({
      where: { email },
    });

    // 3. Update password and clear vendor_pending status if applicable
    const password_hash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: {
        password_hash,
        // Only update vendor fields if the application exists
        ...(vendorApplication ? {
          firm_name: vendorApplication.firm_name,
          specialties: vendorApplication.specialties,
          bar_number: vendorApplication.bar_number,
          years_experience: vendorApplication.years_experience,
        } : {}),
      },
    });

    return NextResponse.json({ message: "Account setup successful" });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
