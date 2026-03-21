"use client";

import { useCallback } from "react";
import { appStore, type UploadedFile } from "@/app/store";
import { useFileUpload } from "@/hooks/use-presigned-upload";
import { generateUUID } from "@/lib/utils";
import { toast } from "sonner";

export function useThreadFileUploader(threadId?: string) {
  const appStoreMutate = appStore((s) => s.mutate);
  const { upload } = useFileUpload();

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      
      // Use 'temp' as threadId if none provided (for uploads before conversation starts)
      const storageKey = threadId || 'temp';
      const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file
      const MAX_SIZE_MB = 10;

      for (const file of files) {
        if (file.size > MAX_SIZE_BYTES) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          toast.error(`File "${file.name}" is too large (${fileSizeMB}MB). Maximum file size is ${MAX_SIZE_MB}MB.`);
          continue;
        }

        const previewUrl = file.type?.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;
        const fileId = generateUUID();
        const abortController = new AbortController();

        const uploadingFile: UploadedFile = {
          id: fileId,
          url: "",
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          isUploading: true,
          progress: 0,
          previewUrl,
          abortController,
        };

        appStoreMutate((prev) => ({
          threadFiles: {
            ...prev.threadFiles,
            [storageKey]: [...(prev.threadFiles[storageKey] ?? []), uploadingFile],
          },
        }));

        try {
          const uploaded = await upload(file, {
            signal: abortController.signal,
          });
          if (uploaded) {
            appStoreMutate((prev) => ({
              threadFiles: {
                ...prev.threadFiles,
                [storageKey]: (prev.threadFiles[storageKey] ?? []).map((f) =>
                  f.id === fileId
                    ? {
                        ...f,
                        url: uploaded.url,
                        isUploading: false,
                        progress: 100,
                      }
                    : f,
                ),
              },
            }));
          } else {
            appStoreMutate((prev) => ({
              threadFiles: {
                ...prev.threadFiles,
                [storageKey]: (prev.threadFiles[storageKey] ?? []).filter(
                  (f) => f.id !== fileId,
                ),
              },
            }));
          }
        } catch (_err) {
          appStoreMutate((prev) => ({
            threadFiles: {
              ...prev.threadFiles,
              [storageKey]: (prev.threadFiles[storageKey] ?? []).filter(
                (f) => f.id !== fileId,
              ),
            },
          }));
        } finally {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }
      }
    },
    [threadId, appStoreMutate, upload],
  );

  return { uploadFiles };
}
