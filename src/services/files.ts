import { supabase } from "../lib/supabase";
import { ensureCurrentUserProfile } from "./access";

const DEFAULT_BUCKET = "project-files";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

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
  uploadedBy?: string;
  bucket?: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function createSignedFileUrl(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (error) {
    throw new Error(
      `Não foi possível gerar link assinado para o arquivo (${path}). Verifique bucket privado/policies.`,
    );
  }

  return data.signedUrl;
}

export async function listFilesByProjectId(projectId: string) {
  const { data, error } = await supabase
    .from("project_files")
    .select("id, project_id, name, type, size, storage_path, bucket, uploaded_by, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const files = (data ?? []) as ProjectFile[];

  const filesWithUrl = await Promise.all(
    files.map(async (file) => ({
      ...file,
      file_url: await createSignedFileUrl(file.bucket || DEFAULT_BUCKET, file.storage_path),
    })),
  );

  return filesWithUrl;
}

export async function uploadProjectFile(input: UploadProjectFileInput) {
  const bucket = input.bucket ?? DEFAULT_BUCKET;
  const sanitizedName = sanitizeFileName(input.file.name);
  const storagePath = `${input.projectId}/${Date.now()}-${sanitizedName}`;
  const profile = await ensureCurrentUserProfile();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, input.file, {
      upsert: false,
      contentType: input.file.type || "application/octet-stream",
    });

  if (uploadError) {
    throw new Error(
      `Falha no upload para o bucket ${bucket}. Verifique bucket privado e policies de storage. Detalhe: ${uploadError.message}`,
    );
  }

  const { data: metadata, error: metadataError } = await supabase
    .from("project_files")
    .insert({
      project_id: input.projectId,
      name: input.file.name,
      type: input.file.type || "application/octet-stream",
      size: input.file.size,
      storage_path: storagePath,
      bucket,
      uploaded_by: input.uploadedBy ?? profile.full_name ?? profile.email,
    })
    .select("id, project_id, name, type, size, storage_path, bucket, uploaded_by, created_at")
    .single();

  if (metadataError) throw metadataError;

  return {
    ...(metadata as ProjectFile),
    file_url: await createSignedFileUrl(bucket, storagePath),
  };
}
