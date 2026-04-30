import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, createOtpRecord } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    const token = generateOtp();
    await createOtpRecord(email, token);

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: "Reset link sent successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
