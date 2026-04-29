import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { sendRejectionEmail, sendVendorWelcomeEmail } from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vendors = await prisma.vendorApplication.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ vendors });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status } = await req.json();

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update application and user in transaction
    await prisma.$transaction(async (tx) => {
      await tx.vendorApplication.update({
        where: { id },
        data: { status },
      });

      if (status === "approved") {
        await tx.user.update({
          where: { email: application.email },
          data: {
            role: "ATTORNEY",
            membership_tier: 'basic',
          },
        });
      }
    });

    if (status === "approved") {
      try {
        await sendVendorWelcomeEmail(application.email, application.full_name);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // We don't fail the whole request since the DB is updated, but we log it
      }
    } else if (status == "rejected") {
      try {
        await sendRejectionEmail(application.email, application.full_name);

        await prisma.user.delete({
          where: { email: application.email },
        });

        await prisma.vendorApplication.delete({
          where: { id: application.id },
        });

      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // We don't fail the whole request since the DB is updated, but we log it
      }
    }

    return NextResponse.json({ message: `Application ${status}` });
  } catch (error) {
    console.error("Vendor PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
