// Academic Resource type definitions

export interface AcademicResource {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: "pdf" | "word";
  fileSize: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicResourceWithUploader extends AcademicResource {
  uploaderName?: string;
}

export interface CreateAcademicResourceInput {
  title: string;
  description?: string;
  fileName: string;
  fileType: "pdf" | "word";
  fileSize: number;
  fileData: Buffer;
  uploadedBy: string;
}

export interface AcademicResourceSearchResult {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: "pdf" | "word";
  downloadUrl: string;
}
