import type { SubjectSidebarTreeNode } from "./types";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";

/** Static demo tree; hrefs use fake ids (404 unless you align with real data). */
export const PLACEHOLDER_NOTEBOOK_TREE: SubjectSidebarTreeNode[] = [
  {
    id: "subject:demo-calculus",
    kind: "subject",
    type: "folder",
    name: "Calculus I",
    subjectId: "demo-s",
    children: [
      {
        id: "chapter:demo-limits",
        kind: "chapter",
        type: "folder",
        title: "Limits & continuity",
        subjectId: "demo-s",
        chapterId: "demo-ch",
        children: [
          {
            id: "note:demo-epsilon",
            kind: "note",
            type: "page",
            title: "Epsilon-delta intuition",
            subjectId: "demo-s",
            chapterId: "demo-ch",
            href: buildNotebookNoteHref("demo-s", "demo-ch", "demo-n1"),
          },
          {
            id: "note:demo-continuity",
            kind: "note",
            type: "page",
            title: "Continuity checklist",
            subjectId: "demo-s",
            chapterId: "demo-ch",
            href: buildNotebookNoteHref("demo-s", "demo-ch", "demo-n2"),
          },
        ],
      },
      {
        id: "chapter:demo-exams",
        kind: "chapter",
        type: "folder",
        title: "Exams",
        subjectId: "demo-s",
        chapterId: "demo-ex",
        children: [
          {
            id: "note:demo-midterm",
            kind: "note",
            type: "page",
            title: "Midterm cheat sheet",
            subjectId: "demo-s",
            chapterId: "demo-ex",
            href: buildNotebookNoteHref("demo-s", "demo-ex", "demo-n3"),
          },
        ],
      },
    ],
  },
  {
    id: "subject:demo-physics",
    kind: "subject",
    type: "folder",
    name: "Physics",
    subjectId: "demo-p",
    children: [
      {
        id: "chapter:demo-mechanics",
        kind: "chapter",
        type: "folder",
        title: "Mechanics",
        subjectId: "demo-p",
        chapterId: "demo-m",
        children: [
          {
            id: "note:demo-kinematics",
            kind: "note",
            type: "page",
            title: "1D kinematics",
            subjectId: "demo-p",
            chapterId: "demo-m",
            href: buildNotebookNoteHref("demo-p", "demo-m", "demo-n4"),
          },
          {
            id: "note:demo-forces",
            kind: "note",
            type: "page",
            title: "Free-body diagrams",
            subjectId: "demo-p",
            chapterId: "demo-m",
            href: buildNotebookNoteHref("demo-p", "demo-m", "demo-n5"),
          },
        ],
      },
    ],
  },
  {
    id: "subject:demo-reading",
    kind: "subject",
    type: "folder",
    name: "Reading list",
    subjectId: "demo-read",
    children: [
      {
        id: "chapter:demo-papers",
        kind: "chapter",
        type: "folder",
        title: "Papers",
        subjectId: "demo-read",
        chapterId: "demo-papers",
        children: [
          {
            id: "note:demo-unlinked",
            kind: "note",
            type: "page",
            title: "Papers to skim",
            subjectId: "demo-read",
            chapterId: "demo-papers",
            href: null,
          },
        ],
      },
    ],
  },
];
