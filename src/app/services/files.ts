import { supabase } from "../../lib/supabase";

const DEFAULT_BUCKET = "project-files";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 24;

export type ProjectFile = {
  id: string;
  project_id: string;
  name: string;
  type: string;
  size: number | null;
  storage_path: string;
  bucket: string;
  uploaded_by: string;
  created_at: string;
  file_url?: string;
};

export type UploadProjectFileInput = {
  projectId: string;
  file: File;
  uploadedBy: string;
  bucket?: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function buildFileUrl(bucket: string, path: string) {
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

  if (publicData?.publicUrl) {
    return publicData.publicUrl;
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (signedError) throw signedError;
  return signedData.signedUrl;
}

export async function listFilesByProjectId(projectId: string) {
  const { data, error } = await supabase
    .from("project_files")
    .select(
      "id, project_id, name, type, size, storage_path, bucket, uploaded_by, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const files = (data ?? []) as ProjectFile[];
  const filesWithUrl = await Promise.all(
    files.map(async (file) => ({
      ...file,
      file_url: await buildFileUrl(file.bucket || DEFAULT_BUCKET, file.storage_path),
    })),
  );

  return filesWithUrl;
}

export async function uploadProjectFile(input: UploadProjectFileInput) {
  const bucket = input.bucket ?? DEFAULT_BUCKET;
  const sanitizedName = sanitizeFileName(input.file.name);
  const storagePath = `${input.projectId}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, input.file, {
      upsert: false,
      contentType: input.file.type || "application/octet-stream",
    });

  if (uploadError) throw uploadError;

  const { data: metadata, error: metadataError } = await supabase
    .from("project_files")
    .insert({
      project_id: input.projectId,
      name: input.file.name,
      type: input.file.type || "application/octet-stream",
      size: input.file.size,
      storage_path: storagePath,
      bucket,
      uploaded_by: input.uploadedBy,
    })
    .select(
      "id, project_id, name, type, size, storage_path, bucket, uploaded_by, created_at",
    )
    .single();

  if (metadataError) throw metadataError;

  const fileUrl = await buildFileUrl(bucket, storagePath);

  return {
    ...(metadata as ProjectFile),
    file_url: fileUrl,
  };
}
