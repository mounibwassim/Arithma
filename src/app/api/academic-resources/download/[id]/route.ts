import { type NextRequest, NextResponse } from "next/server";
import academicResourceRepository from "@/lib/db/pg/repositories/academic-resource-repository.pg";

// GET - Download academic resource file
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const resource = await academicResourceRepository.getById(id);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(resource.fileData, "base64");

    // Determine content type
    let contentType = "application/octet-stream";
    if (resource.fileType === "pdf") {
      contentType = "application/pdf";
    } else if (resource.fileType === "word") {
      contentType = resource.fileName.endsWith(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";
    }

    // Return file as download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(resource.fileName)}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to download academic resource:", error);
    return NextResponse.json(
      { error: "Failed to download resource" },
      { status: 500 }
    );
  }
}
