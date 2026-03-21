import { pgDb as db } from "../db.pg";
import { AcademicResourceTable, AdminCredentialsTable } from "../schema.pg";
import { eq, ilike, or, desc } from "drizzle-orm";

export interface AcademicResourceRepository {
  create(input: {
    title: string;
    description?: string;
    fileName: string;
    fileType: "pdf" | "word";
    fileSize: number;
    fileData: string; // base64 encoded
    uploadedBy: string;
  }): Promise<{ id: string }>;
  
  getAll(): Promise<Array<{
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadedBy: string;
    uploaderName: string;
    createdAt: Date;
    updatedAt: Date;
  }>>;
  
  getById(id: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileType: string;
    fileSize: string;
    fileData: string;
    createdAt: Date;
  } | null>;
  
  search(query: string): Promise<Array<{
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileType: string;
  }>>;
  
  delete(id: string): Promise<void>;
}

const pgAcademicResourceRepository: AcademicResourceRepository = {
  async create(input) {
    const result = await db
      .insert(AcademicResourceTable)
      .values({
        title: input.title,
        description: input.description,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize.toString(),
        fileData: input.fileData,
        uploadedBy: input.uploadedBy,
      })
      .returning({ id: AcademicResourceTable.id });

    return { id: result[0].id };
  },

  async getAll() {
    const results = await db
      .select({
        id: AcademicResourceTable.id,
        title: AcademicResourceTable.title,
        description: AcademicResourceTable.description,
        fileName: AcademicResourceTable.fileName,
        fileType: AcademicResourceTable.fileType,
        fileSize: AcademicResourceTable.fileSize,
        uploadedBy: AcademicResourceTable.uploadedBy,
        uploaderName: AdminCredentialsTable.name,
        createdAt: AcademicResourceTable.createdAt,
        updatedAt: AcademicResourceTable.updatedAt,
      })
      .from(AcademicResourceTable)
      .leftJoin(
        AdminCredentialsTable,
        eq(AcademicResourceTable.uploadedBy, AdminCredentialsTable.id)
      )
      .orderBy(desc(AcademicResourceTable.createdAt));

    return results.map((r) => ({
      ...r,
      uploaderName: r.uploaderName || "Unknown",
    }));
  },

  async getById(id) {
    const results = await db
      .select({
        id: AcademicResourceTable.id,
        title: AcademicResourceTable.title,
        description: AcademicResourceTable.description,
        fileName: AcademicResourceTable.fileName,
        fileType: AcademicResourceTable.fileType,
        fileSize: AcademicResourceTable.fileSize,
        fileData: AcademicResourceTable.fileData,
        createdAt: AcademicResourceTable.createdAt,
      })
      .from(AcademicResourceTable)
      .where(eq(AcademicResourceTable.id, id))
      .limit(1);

    return results[0] || null;
  },

  async search(query) {
    const searchPattern = `%${query}%`;
    
    const results = await db
      .select({
        id: AcademicResourceTable.id,
        title: AcademicResourceTable.title,
        description: AcademicResourceTable.description,
        fileName: AcademicResourceTable.fileName,
        fileType: AcademicResourceTable.fileType,
      })
      .from(AcademicResourceTable)
      .where(
        or(
          ilike(AcademicResourceTable.title, searchPattern),
          ilike(AcademicResourceTable.description, searchPattern),
          ilike(AcademicResourceTable.fileName, searchPattern)
        )
      )
      .orderBy(desc(AcademicResourceTable.createdAt))
      .limit(10);

    return results;
  },

  async delete(id) {
    await db
      .delete(AcademicResourceTable)
      .where(eq(AcademicResourceTable.id, id));
  },
};

export default pgAcademicResourceRepository;
