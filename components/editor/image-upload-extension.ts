import { Extension, type Editor } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { uploadNoteImage } from "@/lib/editor/upload-image-client";

export type ImageUploadExtensionOptions = {
  noteId: string;
  shareToken?: string | null;
  getOnProgress: () => (percent: number | null) => void;
};

async function insertImageFromFile(
  editor: Editor,
  file: File,
  noteId: string,
  shareToken: string | null | undefined,
  setProgress: (percent: number | null) => void,
  insertAtPos: number | null = null
) {
  setProgress(0);
  try {
    const { url } = await uploadNoteImage(
      file,
      noteId,
      (p) => setProgress(p),
      shareToken ? { shareToken } : undefined
    );
    if (insertAtPos != null) {
      editor
        .chain()
        .focus()
        .insertContentAt(insertAtPos, { type: "image", attrs: { src: url } })
        .run();
    } else {
      editor.chain().focus().setImage({ src: url }).run();
    }
  } catch (e) {
    console.error(e);
  } finally {
    setProgress(null);
  }
}

export const ImageUploadExtension = Extension.create<ImageUploadExtensionOptions>(
  {
    name: "imageUpload",

    addOptions() {
      return {
        noteId: "",
        shareToken: null as string | null,
        getOnProgress: () => () => {},
      };
    },

    addProseMirrorPlugins() {
      const editor = this.editor;
      const { noteId, shareToken, getOnProgress } = this.options;

      return [
        new Plugin({
          props: {
            handleDOMEvents: {
              dragover(view, event) {
                const e = event as DragEvent;
                if (!e.dataTransfer?.types?.length) return false;
                if (!Array.from(e.dataTransfer.types).includes("Files"))
                  return false;
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                (view.dom as HTMLElement).classList.add("note-editor-drag-over");
                return false;
              },
              dragleave(view, event) {
                const e = event as DragEvent;
                const rel = e.relatedTarget as Node | null;
                if (rel && view.dom.contains(rel)) return false;
                (view.dom as HTMLElement).classList.remove(
                  "note-editor-drag-over"
                );
                return false;
              },
            },
            handleDrop(view, event, _slice, moved) {
              if (moved) return false;
              const e = event as DragEvent;
              if (!e.dataTransfer?.files?.length) return false;

              const imageFile = Array.from(e.dataTransfer.files).find((f) =>
                f.type.startsWith("image/")
              );
              if (!imageFile) return false;

              e.preventDefault();
              (view.dom as HTMLElement).classList.remove("note-editor-drag-over");
              const coords = view.posAtCoords({
                left: e.clientX,
                top: e.clientY,
              });
              const insertAtPos = coords?.pos ?? null;
              void insertImageFromFile(
                editor,
                imageFile,
                noteId,
                shareToken ?? undefined,
                getOnProgress(),
                insertAtPos
              );
              return true;
            },
            handlePaste(_view, event) {
              const items = event.clipboardData?.items;
              if (!items?.length) return false;

              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file" && item.type.startsWith("image/")) {
                  const file = item.getAsFile();
                  if (file) {
                    event.preventDefault();
                    void insertImageFromFile(
                      editor,
                      file,
                      noteId,
                      shareToken ?? undefined,
                      getOnProgress()
                    );
                    return true;
                  }
                }
              }
              return false;
            },
          },
        }),
      ];
    },
  }
);
