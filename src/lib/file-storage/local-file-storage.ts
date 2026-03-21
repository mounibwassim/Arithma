import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  FileStorage,
  UploadContent,
  UploadOptions,
  UploadResult,
  FileMetadata,
} from "./file-storage.interface";
import { generateUUID } from "lib/utils";
import { sanitizeFilename } from "./storage-utils";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Local filesystem storage implementation.
 * Stores files in public/uploads/ directory.
 */
export function createLocalFileStorage(): FileStorage {
  // Ensure upload directory exists
  const ensureUploadDir = async () => {
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
  };

  const upload = async (
    content: UploadContent,
    options?: UploadOptions,
  ): Promise<UploadResult> => {
    try {
      await ensureUploadDir();

      const filename = options?.filename || "file";
      const contentType = options?.contentType || "application/octet-stream";

      // Generate unique filename: uuid-sanitized-original-name
      const sanitized = sanitizeFilename(filename);
      const uuid = generateUUID();
      const key = `${uuid}-${sanitized}`;
      const filePath = path.join(UPLOAD_DIR, key);

      console.log(`[LocalStorage] Uploading file: ${filename} -> ${key}`);

      // Convert content to Buffer
      let buffer: Buffer;
      try {
        if (Buffer.isBuffer(content)) {
          buffer = content;
        } else if (content instanceof Blob || content instanceof File) {
          const arrayBuffer = await content.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } else if (content instanceof ArrayBuffer) {
          buffer = Buffer.from(content);
        } else if (ArrayBuffer.isView(content)) {
          buffer = Buffer.from(content.buffer);
        } else if (content instanceof ReadableStream) {
          // Handle ReadableStream
          const reader = content.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          buffer = Buffer.concat(chunks);
        } else {
          // NodeJS.ReadableStream
          const chunks: Buffer[] = [];
          for await (const chunk of content as NodeJS.ReadableStream) {
            chunks.push(Buffer.from(chunk));
          }
          buffer = Buffer.concat(chunks);
        }
      } catch (bufferError) {
        console.error("[LocalStorage] Failed to convert content to buffer:", bufferError);
        throw new Error(`Failed to process file content: ${bufferError instanceof Error ? bufferError.message : String(bufferError)}`);
      }

      // Write file to disk
      try {
        await fs.writeFile(filePath, buffer);
        console.log(`[LocalStorage] File written successfully: ${key} (${buffer.length} bytes)`);
      } catch (writeError) {
        console.error("[LocalStorage] Failed to write file to disk:", writeError);
        throw new Error(`Failed to save file: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
      }

      const metadata: FileMetadata = {
        key,
        filename,
        contentType,
        size: buffer.length,
        uploadedAt: new Date(),
      };

      return {
        key,
        sourceUrl: `/uploads/${key}`,
        metadata,
      };
    } catch (error) {
      console.error(`[LocalStorage] Upload failed for ${options?.filename}:`, error);
      throw error;
    }
  };

  const download = async (key: string): Promise<Buffer> => {
    const filePath = path.join(UPLOAD_DIR, key);
    return await fs.readFile(filePath);
  };

  const deleteFile = async (key: string): Promise<void> => {
    const filePath = path.join(UPLOAD_DIR, key);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist, ignore
    }
  };

  const exists = async (key: string): Promise<boolean> => {
    const filePath = path.join(UPLOAD_DIR, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  };

  const getMetadata = async (key: string): Promise<FileMetadata | null> => {
    const filePath = path.join(UPLOAD_DIR, key);
    try {
      const stats = await fs.stat(filePath);
      
      // Try to extract original filename from key (format: uuid-filename)
      const parts = key.split("-");
      const filename = parts.length > 1 ? parts.slice(1).join("-") : key;

      // Detect content type from file extension
      const ext = path.extname(key).toLowerCase();
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
      const contentType = mimeTypes[ext] || "application/octet-stream";

      return {
        key,
        filename,
        contentType,
        size: stats.size,
        uploadedAt: stats.mtime,
      };
    } catch {
      return null;
    }
  };

  const getSourceUrl = async (key: string): Promise<string | null> => {
    const fileExists = await exists(key);
    return fileExists ? `/uploads/${key}` : null;
  };

  return {
    upload,
    download,
    delete: deleteFile,
    exists,
    getMetadata,
    getSourceUrl,
  };
}
