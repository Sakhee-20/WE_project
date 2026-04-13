import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";
import type { WorkspaceLayoutInput } from "@/lib/validations/workspace-layout";

/** Build API payload from the in-memory subject tree (orders = array indices). */
export function subjectsToWorkspaceLayout(
  subjects: SubjectWithChaptersAndNotes[]
): WorkspaceLayoutInput {
  return {
    subjects: subjects.map((s, si) => ({
      id: s.id,
      order: si,
      chapters: s.chapters.map((ch, ci) => ({
        id: ch.id,
        order: ci,
        notes: ch.notes
          .filter((n) => !n.id.startsWith("optimistic:"))
          .map((n, ni) => ({
            id: n.id,
            order: ni,
          })),
      })),
    })),
  };
}
