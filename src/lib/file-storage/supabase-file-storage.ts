import "server-only";
import type {
  FileStorage,
  UploadContent,
  UploadOptions,
  UploadResult,
  FileMetadata,
} from "./file-storage.interface";
import { generateUUID } from "lib/utils";
import { sanitizeFilename, resolveStoragePrefix } from "./storage-utils";
import { supabase } from "lib/db/supabase";

/**
 * Supabase Storage implementation.
 */
export function createSupabaseFileStorage(): FileStorage {
  const getProviderBucketName = () => {
    return resolveStoragePrefix();
  };

  const upload = async (
    content: UploadContent,
    options?: UploadOptions,
  ): Promise<UploadResult> => {
    const bucket = getProviderBucketName();
    const filename = options?.filename || "file";
    const contentType = options?.contentType || "application/octet-stream";

    // Generate unique key
    const sanitized = sanitizeFilename(filename);
    const uuid = generateUUID();
    const key = `${uuid}-${sanitized}`;

    console.log(`[SupabaseStorage] Uploading file: ${filename} -> ${key}`);

    // If it's a Buffer, we can pass it directly to Supabase storage. 
    // If it's ArrayBuffer/Blob, we also can pass it to Supabase.
    // However, ensure it's converted to a unit8Array / Buffer / Blob.
    let fileBody: File | Blob | Buffer | Uint8Array | ArrayBuffer | ReadableStream;
    
    // Convert ReadableStream to Buffer if needed, otherwise rely on node Fetch.
    // For simplicity, we just use the provided content if it's already a Buffer/ArrayBuffer/Blob.
    if (content instanceof ReadableStream ||
        (content && typeof (content as NodeJS.ReadableStream).pipe === "function")) {
      // In advanced cases, you'd collect the stream into a Buffer because Supabase Storage JS client expects ArrayBuffer/Blob/Buffer
      throw new Error("[SupabaseStorage] Please pass a Buffer, Blob, or ArrayBuffer. Streams are not natively supported by the supabase-js client yet without custom wrappers.");
    }
    
    fileBody = content as any;

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(key, fileBody, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("[SupabaseStorage] Failed to upload:", error);
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(key);

      const metadata: FileMetadata = {
        key,
        filename,
        contentType,
        // Since we didn't always read the full buffer directly, size might be imprecise, 
        // but `length`/`size` or `byteLength` covers most typical `content` instances.
        size: (content as any).length ?? (content as any).size ?? (content as any).byteLength ?? 0,
        uploadedAt: new Date(),
      };

      return {
        key: data.path, // which is roughly 'key'
        sourceUrl: publicUrlData.publicUrl,
        metadata,
      };
    } catch (error) {
      console.error(`[SupabaseStorage] Upload failed for ${filename}:`, error);
      throw error;
    }
  };

  const download = async (key: string): Promise<Buffer> => {
    const bucket = getProviderBucketName();
    const { data, error } = await supabase.storage.from(bucket).download(key);
    
    if (error) {
      throw new Error(`Failed to download from Supabase: ${error.message}`);
    }
    
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  };

  const deleteFile = async (key: string): Promise<void> => {
    const bucket = getProviderBucketName();
    const { error } = await supabase.storage.from(bucket).remove([key]);
    if (error) {
      throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
  };

  const exists = async (key: string): Promise<boolean> => {
    // There is no direct "exists", we list the specific file or check metadata
    const bucket = getProviderBucketName();
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 1,
      search: key,
    });
    
    if (error || !data || data.length === 0) {
      return false;
    }
    return data.some((file) => file.name === key);
  };

  const getMetadata = async (key: string): Promise<FileMetadata | null> => {
    const bucket = getProviderBucketName();
    // We can list with search constraint 
    // Real metadata fetching might be better via download (headers)
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 1,
      search: key,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data.find((f) => f.name === key);
    if (!file) return null;

    // Try to extract original filename from key (format: uuid-filename)
    const parts = key.split("-");
    const filename = parts.length > 1 ? parts.slice(1).join("-") : key;

    return {
      key,
      filename,
      contentType: file.metadata?.mimetype || "application/octet-stream",
      size: file.metadata?.size || 0,
      uploadedAt: file.updated_at ? new Date(file.updated_at) : new Date(),
    };
  };

  const getSourceUrl = async (key: string): Promise<string | null> => {
    const bucket = getProviderBucketName();
    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data?.publicUrl || null;
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
