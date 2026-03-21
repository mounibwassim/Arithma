import { type NextRequest, NextResponse } from "next/server";
import academicResourceRepository from "@/lib/db/pg/repositories/academic-resource-repository.pg";

// GET - Search academic resources (for chatbot)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    let resources;
    if (query.trim()) {
      resources = await academicResourceRepository.search(query);
    } else {
      // Return all resources if no search query
      const allResources = await academicResourceRepository.getAll();
      resources = allResources.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        fileName: r.fileName,
        fileType: r.fileType,
      }));
    }

    // Format response with download URLs
    const results = resources.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      fileName: r.fileName,
      fileType: r.fileType,
      downloadUrl: `/api/academic-resources/download/${r.id}`,
    }));

    return NextResponse.json({ resources: results });
  } catch (error) {
    console.error("Failed to search academic resources:", error);
    return NextResponse.json(
      { error: "Failed to search resources" },
      { status: 500 }
    );
  }
}
