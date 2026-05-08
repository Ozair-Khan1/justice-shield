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

    const { full_name, phone, emergency_contact_name, emergency_contact_phone, password, email, city, country } = await req.json();

    // Basic validation
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (full_name && full_name.length < 3) {
      return NextResponse.json({ error: "Name too short" }, { status: 400 });
    }

    let password_hash = password ? await bcrypt.hash(password, 12) : undefined;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id as string },
        data: {
          email: email || undefined,
          password_hash: password_hash,
          full_name,
          phone,
          emergency_contact_name,
          emergency_contact_phone,
          city,
          country,
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: "Email address is already in use." }, { status: 400 });
      }
      console.error("Account update error:", error);
      return NextResponse.json({ error: "Failed to update account information." }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}