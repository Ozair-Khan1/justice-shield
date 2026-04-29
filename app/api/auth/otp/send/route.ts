import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, createOtpRecord } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const otp = generateOtp();
    await createOtpRecord(email, otp);

    try {
      await sendOtpEmail(email, otp);
    } catch (mailError) {
      console.error("Failed to send OTP email:", mailError);
      return NextResponse.json({ error: "Failed to send email. Please check your SMTP settings." }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
