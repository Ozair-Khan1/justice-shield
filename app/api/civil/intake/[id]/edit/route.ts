import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

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

        const body = await req.json();
        const { description, subject, opposingParty, opposingPartyLocation, metadata } = body;

        if (!description || !subject) {
            return NextResponse.json({ error: "Subject and Description are required" }, { status: 400 });
        }

        const dataToUpdate: any = { description, subject };
        if (opposingParty !== undefined) dataToUpdate.opposing_party = opposingParty;
        if (opposingPartyLocation !== undefined) dataToUpdate.opposing_party_location = opposingPartyLocation;
        if (metadata !== undefined) dataToUpdate.metadata = metadata;

        const intake = await prisma.civilIntake.update({
            where: {
                id,
                user_id: payload.id as string,
                status: { in: ["assigned", "pending", "active"] }
            },
            data: dataToUpdate
        });

        return NextResponse.json({ intake });
    } catch (error) {
        console.error("Update intake error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
