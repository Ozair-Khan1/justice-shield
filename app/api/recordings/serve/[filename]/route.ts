import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  return new S3Client({
    endpoint: process.env.B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com",
    region: process.env.B2_REGION || "us-east-005",
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    let filename = resolvedParams?.filename;

    if (!filename || filename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    filename = decodeURIComponent(filename);
    const bucket = process.env.B2_BUCKET_NAME || "Justice-Shield";
    const s3 = getS3Client();

    // Check if filename has spaces or hyphens
    let targetKey = filename;
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: targetKey }));
    } catch {
      const withHyphens = filename.replace(/\s+/g, "-");
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: withHyphens }));
        targetKey = withHyphens;
      } catch {
        // Fallback to targetKey
      }
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: targetKey,
    });

    // Generate presigned URL valid for 2 hours (7200 seconds)
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 7200,
    });

    // Redirect browser directly to Backblaze B2 video stream
    return NextResponse.redirect(presignedUrl);
  } catch (err: any) {
    console.error("[Recording Serve] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
