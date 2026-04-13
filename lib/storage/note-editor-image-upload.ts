import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { getStorageBucket, getSupabaseAdmin } from "@/lib/supabase/admin";

export type UploadEditorImageInput = {
  ownerId: string;
  noteId: string;
  bytes: Buffer;
  mime: string;
  ext: string;
};

export type ImageStorageProvider = "supabase" | "cloudinary";

export function getConfiguredImageStorageProvider(): ImageStorageProvider {
  const raw = process.env.IMAGE_STORAGE?.trim().toLowerCase();
  if (raw === "cloudinary") return "cloudinary";
  return "supabase";
}

export function isSupabaseStorageConfigured(): boolean {
  try {
    getSupabaseAdmin();
    return true;
  } catch {
    return false;
  }
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinaryOnce() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadEditorImage(
  input: UploadEditorImageInput
): Promise<string> {
  const provider = getConfiguredImageStorageProvider();

  if (provider === "cloudinary") {
    if (!isCloudinaryConfigured()) {
      throw new Error("CLOUDINARY_NOT_CONFIGURED");
    }
    configureCloudinaryOnce();
    const folder = `note-images/${input.ownerId}/${input.noteId}`;
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          use_filename: false,
          unique_filename: true,
        },
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          if (result?.secure_url) {
            resolve(result.secure_url);
            return;
          }
          reject(new Error("Cloudinary returned no URL"));
        }
      );
      uploadStream.end(input.bytes);
    });
  }

  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const path = `${input.ownerId}/${input.noteId}/${randomUUID()}.${input.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, input.bytes, {
      contentType: input.mime,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export function storageConfigErrorMessage(
  provider: ImageStorageProvider
): string {
  if (provider === "cloudinary") {
    return "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.";
  }
  return "File storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or switch IMAGE_STORAGE to cloudinary with Cloudinary credentials.";
}
