import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt, verifyJwt, getAuthToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const token = await getAuthToken(req);

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyJwt(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { full_name, phone, emergency_contact_name, emergency_contact_phone, password, email } = await req.json();

    let password_hash = password ? await bcrypt.hash(password, 12) : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: user.id as string },
      data: {
        email,
        password_hash: password_hash,
        full_name,
        phone,
        emergency_contact_name,
        emergency_contact_phone,
      },
    });

    const updated_token = await signJwt({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });

    const updated_cookieStore = await cookies();
    updated_cookieStore.set("auth_token", updated_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}