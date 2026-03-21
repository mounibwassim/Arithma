"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, FileType, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AcademicResource {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploaderName: string;
  createdAt: string;
}

interface AcademicResourcesTableProps {
  resources: AcademicResource[];
  isLoading: boolean;
  onDelete: () => void;
}

export function AcademicResourcesTable({
  resources,
  isLoading,
  onDelete,
}: AcademicResourcesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] =
    useState<AcademicResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (resource: AcademicResource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/academic-resources?id=${resourceToDelete.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed");
      }

      toast.success("Resource deleted successfully");
      onDelete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete resource",
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
    }
  };

  const formatFileSize = (sizeStr: string) => {
    const bytes = Number.parseInt(sizeStr, 10);
    if (Number.isNaN(bytes)) return sizeStr;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileType className="h-5 w-5 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No academic resources uploaded yet</p>
        <p className="text-sm mt-1">
          Upload your first resource using the form beside
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Title</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead className="text-center">Size</TableHead>
              <TableHead className="text-center">Uploaded By</TableHead>
              <TableHead className="w-24 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell>{getFileIcon(resource.fileType)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{resource.title}</p>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {resource.fileName}
                </TableCell>
                <TableCell className="text-sm text-center">
                  {formatFileSize(resource.fileSize)}
                </TableCell>
                <TableCell className="text-sm text-center">
                  {resource.uploaderName}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8 text-muted-foreground hover:text-green-500"
                    >
                      <a
                        href={`/api/academic-resources/download/${resource.id}`}
                        download
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(resource)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{resourceToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => {
                setDeleteDialogOpen(false);
                setResourceToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
