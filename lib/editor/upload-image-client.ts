export type UploadImageResult = { url: string };

export type UploadNoteImageOptions = {
  shareToken?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * POST multipart to /api/upload/image with XMLHttpRequest so upload progress works.
 */
export function uploadNoteImage(
  file: File,
  noteId: string,
  onProgress: (percent: number) => void,
  options?: UploadNoteImageOptions
): Promise<UploadImageResult> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Only image files are allowed."));
  }
  if (file.size > MAX_BYTES) {
    return Promise.reject(new Error("Image must be 5 MB or smaller."));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("noteId", noteId);
    if (options?.shareToken) {
      formData.append("shareToken", options.shareToken);
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadImageResult;
          if (data?.url) {
            resolve(data);
            return;
          }
        } catch {
          /* fall through */
        }
        reject(new Error("Invalid response from server."));
        return;
      }

      let message = `Upload failed (${xhr.status})`;
      try {
        const err = JSON.parse(xhr.responseText) as { error?: string };
        if (err?.error) message = err.error;
      } catch {
        /* ignore */
      }
      reject(new Error(message));
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload."))
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Upload cancelled."))
    );

    xhr.open("POST", "/api/upload/image");
    xhr.send(formData);
  });
}
