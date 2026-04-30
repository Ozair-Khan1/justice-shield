import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { sendVendorWelcomeEmail, sendRejectionEmail, sendMarketingWelcomeEmail } from "@/lib/mail";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { status } = await req.json();
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update application and user in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.vendorApplication.update({
        where: { id: id },
        data: { status },
      });

      if (status === "approved") {
        await tx.user.update({
          where: { email: application.email },
          data: {
            role: application.vendor_type === "ATTORNEY" ? "ATTORNEY" : "USER",
            membership_tier: "vendor_active",
          },
        });
      } else {
        await tx.user.update({
          where: { email: application.email },
          data: { membership_tier: "vendor_rejected" },
        });

        await tx.user.delete({
          where: { email: application.email },
        });

        await tx.vendorApplication.delete({
          where: { id: id },
        });
      }
    });

    // Trigger emails outside of the database transaction
    try {
      if (status === "approved") {
        if (application.vendor_type === "ATTORNEY") {
          await sendVendorWelcomeEmail(application.email, application.full_name);
        } else {
          await sendMarketingWelcomeEmail(application.email, application.full_name);
        }
      } else {
        await sendRejectionEmail(application.email, application.full_name);
      }
    } catch (emailError) {
      console.error("Post-transaction email error:", emailError);
    }

    return NextResponse.json({ message: `Application ${status}` });
  } catch (error) {
    console.error("Vendor status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
