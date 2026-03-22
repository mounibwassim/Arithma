import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { serverFileStorage, storageDriver } from "lib/file-storage";
import { checkStorageAction } from "../actions";

// Increase the maximum request body size for file uploads
// Next.js default is 1MB, we need 10MB for file uploads
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please log in to upload files" },
      { status: 401 }
    );
  }

  // Check storage configuration first
  const storageCheck = await checkStorageAction();
  if (!storageCheck.isValid) {
    return NextResponse.json(
      {
        error: storageCheck.error,
        solution: storageCheck.solution,
        storageDriver,
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use 'file' field in FormData." },
        { status: 400 },
      );
    }

    // Validate file size (10MB limit)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { 
          error: `File is too large (${fileSizeMB}MB). Maximum file size is ${MAX_SIZE_MB}MB.`,
          maxSizeMB: MAX_SIZE_MB,
          fileSizeMB: Number.parseFloat(fileSizeMB)
        },
        { status: 413 }, // 413 Payload Too Large
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage (works with any storage backend)
    const result = await serverFileStorage.upload(buffer, {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.sourceUrl,
      metadata: result.metadata,
    });
  } catch (error) {
    // Get file info for logging (formData might not be defined if error happened earlier)
    let fileInfo = {};
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (file) {
        fileInfo = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };
      }
    } catch {
      // Ignore if we can't get file info
    }

    console.error("Failed to upload file:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...fileInfo,
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? `Failed to upload: ${error.message}` : "Failed to upload file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    );
  }
}
