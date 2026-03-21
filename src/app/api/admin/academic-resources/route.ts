import { type NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-auth";
import academicResourceRepository from "@/lib/db/pg/repositories/academic-resource-repository.pg";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// GET - List all academic resources
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resources = await academicResourceRepository.getAll();
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Failed to fetch academic resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST - Upload new academic resource
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and Word documents are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Determine file type
    const fileType: "pdf" | "word" = file.type === "application/pdf" ? "pdf" : "word";

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Save to database
    const result = await academicResourceRepository.create({
      title: title.trim(),
      description: description?.trim() || undefined,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      fileData: base64Data,
      uploadedBy: session.adminId,
    });

    return NextResponse.json({ 
      success: true, 
      id: result.id,
      message: "Resource uploaded successfully" 
    });
  } catch (error) {
    console.error("Failed to upload academic resource:", error);
    return NextResponse.json(
      { error: "Failed to upload resource" },
      { status: 500 }
    );
  }
}

// DELETE - Delete academic resource
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    await academicResourceRepository.delete(id);

    return NextResponse.json({ 
      success: true, 
      message: "Resource deleted successfully" 
    });
  } catch (error) {
    console.error("Failed to delete academic resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
