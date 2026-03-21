import { tool as createTool } from "ai";
import type { JSONSchema7 } from "json-schema";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";
import { safe } from "ts-safe";

export const academicResourcesSearchSchema: JSONSchema7 = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description:
        "Search query to find relevant academic resources. Can be a topic, subject, or keyword like 'calculus', 'lecture notes', 'tutorial', etc.",
    },
  },
  required: ["query"],
};

export const academicResourcesSearchTool = createTool({
  description:
    "Search for academic resources such as lecture notes, tutorials, and study materials uploaded by teachers. Use this when a user asks for notes, lectures, tutorials, or any educational materials. Returns a list of available resources with download links.",
  inputSchema: jsonSchemaToZod(academicResourcesSearchSchema),
  execute: (params) => {
    return safe(async () => {
      // Dynamic import to avoid server-only issues
      const { default: academicResourceRepository } = await import(
        "@/lib/db/pg/repositories/academic-resource-repository.pg"
      );

      const query = params.query || "";
      let resources;

      // If query is empty or very generic, return all resources
      const genericTerms = ["notes", "materials", "resources", "tutorials", "lectures", "access", "the", ""];
      const isGenericQuery = !query.trim() || genericTerms.some(term => 
        query.toLowerCase().trim() === term || query.toLowerCase().trim() === "the notes"
      );

      if (isGenericQuery) {
        // Return all resources
        const allResources = await academicResourceRepository.getAll();
        resources = allResources.slice(0, 10).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          fileName: r.fileName,
          fileType: r.fileType,
        }));
      } else {
        resources = await academicResourceRepository.search(query);
      }

      if (resources.length === 0) {
        return {
          success: true,
          message: "No academic resources found matching your query.",
          resources: [],
          guide: "Let the user know that no resources were found matching their query. Suggest they try different keywords or ask the teacher to upload the needed materials.",
        };
      }

      return {
        success: true,
        message: `Found ${resources.length} academic resource(s).`,
        resources: resources.map((r) => ({
          title: r.title,
          fileType: r.fileType === "pdf" ? "PDF" : "Word",
          downloadUrl: `/api/academic-resources/download/${r.id}`,
        })),
        guide: `IMPORTANT: Format your response as a simple list with ONE file per line ONLY. Use this EXACT format for each file:
        
📄 [Title] ([FileType]) - [Download](downloadUrl)

Example: 📄 Math Notes (PDF) - [Download](/api/academic-resources/download/123)

Do NOT include descriptions, extra details, or bullet points. Keep it minimal and clean.`,
      };
    })
      .ifFail((e) => {
        return {
          isError: true,
          error: e.message,
          solution:
            "An error occurred while searching for academic resources. Apologize to the user and suggest they try again later or contact the administrator.",
        };
      })
      .unwrap();
  },
});

export const ACADEMIC_RESOURCES_TOOL_NAME = "search-academic-resources";
