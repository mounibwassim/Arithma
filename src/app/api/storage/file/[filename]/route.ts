import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { serverFileStorage } from "lib/file-storage";
import path from "node:path";

// MIME type detection from file extension
const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".csv": "text/csv",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename } = await params;

    // Download file from storage
    const buffer = await serverFileStorage.download(filename);

    // Detect content type from file extension (more reliable than metadata)
    const contentType = getMimeType(filename);

    // Convert to base64
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUrl,
      contentType,
      size: buffer.length,
    });
  } catch (error) {
    console.error("Failed to get file as base64:", error);
    return NextResponse.json({ error: "Failed to get file" }, { status: 500 });
  }
}

