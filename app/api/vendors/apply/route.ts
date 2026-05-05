import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vendor_type,
      full_name,
      firm_name,
      email,
      phone,
      location,
      website,
      specialties,
      bar_number,
      years_experience,
      message,
      city,
      country,
    } = body;

    // Basic validation
    if (!vendor_type || !full_name || !email) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    // Create vendor application and user in a transaction
    const [application] = await prisma.$transaction([
      prisma.vendorApplication.create({
        data: {
          vendor_type: vendor_type.toUpperCase(),
          full_name,
          firm_name: firm_name || null,
          email,
          phone: phone || null,
          location: location || null,
          city: city || null,
          country: country || null,
          website: website || null,
          specialties: specialties || null,
          bar_number: bar_number || null,
          years_experience: years_experience ? parseInt(String(years_experience)) : 0,
          message: message || null,
          status: "pending",
        },
      }),
      prisma.user.create({
        data: {
          email,
          password_hash: `${'LOCKED' + process.env.LOCKED_PASS}`,
          full_name,
          phone: phone || null,
          role: "USER",
          membership_tier: "vendor_pending",
          city: city || null,
          country: country || null,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Application submitted successfully",
      id: application.id,
    }, { status: 201 });

  } catch (error) {
    console.error("Vendor application error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
