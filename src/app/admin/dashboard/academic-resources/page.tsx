"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcademicResourceUpload } from "@/components/admin/academic-resource-upload";
import { AcademicResourcesTable } from "@/components/admin/academic-resources-table";

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

export default function AcademicResourcesPage() {
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/academic-resources");
      const data = await response.json();
      if (response.ok) {
        setResources(data.resources);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Resources</h1>
          <p className="text-muted-foreground">
            Manage lecture notes and tutorials
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResources}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AcademicResourceUpload onUploadSuccess={fetchResources} />
        </div>
        <div className="lg:col-span-2">
          <div className="border rounded-lg bg-card p-4">
            <h3 className="text-lg font-semibold mb-4">
              Uploaded Resources ({resources.length})
            </h3>
            <AcademicResourcesTable
              resources={resources}
              isLoading={isLoading}
              onDelete={fetchResources}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
