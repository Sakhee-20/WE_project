"use client";

import type { TrashItemDto } from "@/lib/trash-types";

export const TRASH_QUERY_KEY = ["trash", "items"] as const;

export type TrashListResponse = { items: TrashItemDto[] };

export async function fetchTrash(): Promise<TrashListResponse> {
  const res = await fetch("/api/trash");
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Unauthorized" : "Failed to load trash");
  }
  return res.json();
}
