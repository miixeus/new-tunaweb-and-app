import { supabase, toServiceError } from "../lib/supabase";
import type { ProjectFile } from "../types/domain";

const BUCKET = import.meta.env.VITE_SUPABASE_PROJECT_FILES_BUCKET || "project-files";

function mapFile(row: any): ProjectFile {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    filePath: row.file_path,
    fileType: row.file_type ?? "application/octet-stream",
    uploadedBy: row.uploaded_by ?? "",
    createdAt: row.created_at,
  };
}

export async function listFilesByProjectId(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw toServiceError(error, "Falha ao listar arquivos.");

  const files = (data ?? []).map(mapFile);

  return Promise.all(
    files.map(async (file) => ({
      ...file,
      previewUrl: await getFilePreviewUrl(file.filePath),
    })),
  );
}

export async function uploadProjectFile(input: {
  projectId: string;
  file: File;
  uploadedBy: string;
}): Promise<ProjectFile> {
  const ext = input.file.name.includes(".") ? input.file.name.split(".").pop() : "bin";
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${input.projectId}/${Date.now()}-${safeName}${ext ? "" : ".bin"}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw toServiceError(uploadError, "Falha no upload de arquivo.");

  const { data, error } = await supabase
    .from("project_files")
    .insert({
      project_id: input.projectId,
      name: input.file.name,
      file_path: storagePath,
      file_type: input.file.type || "application/octet-stream",
      uploaded_by: input.uploadedBy,
    })
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao registrar metadados de arquivo.");

  await supabase
    .from("projects")
    .update({ last_activity: new Date().toISOString() })
    .eq("id", input.projectId);

  const mapped = mapFile(data);
  return {
    ...mapped,
    previewUrl: await getFilePreviewUrl(mapped.filePath),
  };
}

async function getFilePreviewUrl(filePath: string): Promise<string> {
  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (publicData?.publicUrl) return publicData.publicUrl;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 60 * 60);
  if (error) return "";
  return data.signedUrl;
}
