import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename || filename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Local cache directory
    const localDir = path.join(process.cwd(), "recordings");
    const localPath = path.join(localDir, filename);

    // Check if already cached locally
    if (existsSync(localPath)) {
      const fileBuffer = readFileSync(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `inline; filename="${filename}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    }

    // Ensure local recordings dir exists
    if (!existsSync(localDir)) {
      mkdirSync(localDir, { recursive: true });
    }

    // Convert Windows path to WSL path for docker cp destination
    // e.g. D:\Ozair work\... -> /mnt/d/Ozair work/...
    const wslLocalPath = localDir
      .replace(/\\/g, "/")
      .replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);

    const containerName = "guardian-ally-app-main-egress-1";
    const containerPath = `/home/egress/recordings/${filename}`;

    try {
      execSync(
        `wsl -u root -e docker cp "${containerName}:${containerPath}" "${wslLocalPath}/${filename}"`,
        { timeout: 30000 }
      );
    } catch (cpErr: any) {
      console.error("[Recording Serve] docker cp failed:", cpErr.message);
      return NextResponse.json(
        { error: "Recording file not found" },
        { status: 404 }
      );
    }

    if (!existsSync(localPath)) {
      return NextResponse.json({ error: "Copy failed" }, { status: 500 });
    }

    const fileBuffer = readFileSync(localPath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("[Recording Serve] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
