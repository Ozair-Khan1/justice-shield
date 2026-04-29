import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const record = await prisma.otp.findFirst({
    where: {
      email,
      expires_at: {
        gt: new Date(),
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  if (!record) return false;

  const isValid = await bcrypt.compare(otp, record.otp_hash);

  if (isValid) {
    // Delete the OTP after successful verification to prevent reuse
    await prisma.otp.delete({
      where: { id: record.id },
    });
  }

  return isValid;
}

export async function createOtpRecord(email: string, otp: string) {
  const otp_hash = await hashOtp(otp);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otp.deleteMany({
    where: { email },
  });

  return prisma.otp.create({
    data: {
      email,
      otp_hash,
      expires_at,
    },
  });
}
