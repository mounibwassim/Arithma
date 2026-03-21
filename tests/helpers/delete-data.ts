import type { Browser, BrowserContext, Page } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";

export const deleteMcpServer = async (
  access: {
    browser?: Browser;
    context?: BrowserContext;
    page?: Page;
  },
  serverId: string,
) => {
  try {
    let page: Page;
    if (access.page) {
      page = access.page;
    } else if (access.context) {
      page = await access.context.newPage();
    } else if (access.browser) {
      const browserContext = await access.browser.newContext({
        storageState: TEST_USERS.admin.authFile,
      });
      page = await browserContext.newPage();
    } else {
      throw new Error("Browser, context, or page is required");
    }
    const response = await page?.request.delete(`/api/mcp/${serverId}`);
    await access.browser?.close();
    await access.page?.close();
    await access.context?.close();
    if (!response.ok) {
      const responseText = await response.text();
      // If server is already deleted (404), that's OK during cleanup
      if (response.status() === 404 || responseText.includes("not found")) {
        console.log(`MCP server ${serverId} already deleted or not found`);
        return;
      }
      console.error(
        "Failed to delete MCP server",
        response.status(),
        responseText,
      );
      await access.browser?.close();
      await access.page?.close();
      await access.context?.close();
      throw new Error("Failed to delete MCP server");
    }
  } catch (error) {
    console.error("Failed to delete MCP server", error);
    throw error;
  }
};
