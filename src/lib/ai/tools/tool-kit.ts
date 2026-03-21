import { AppDefaultToolkit, DefaultToolName } from ".";
import type { Tool } from "ai";
import { academicResourcesSearchTool } from "./academic-resources";

export const APP_DEFAULT_TOOL_KIT: Record<
  AppDefaultToolkit,
  Record<string, Tool>
> = {
  [AppDefaultToolkit.AcademicResources]: {
    [DefaultToolName.AcademicResourcesSearch]: academicResourcesSearchTool,
  },
};
