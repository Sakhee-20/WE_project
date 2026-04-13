"use client";

import type { JSONContent } from "@tiptap/core";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { createLiveblocksAuthEndpoint } from "@/lib/liveblocks/auth-endpoint";
import { noteRoomId } from "@/lib/liveblocks/note-room";
import { NoteCollabSurface } from "./NoteCollabSurface";

type Props = {
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
  autoFocusTitle?: boolean;
};

function CollabFallback() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
      Connecting to collaboration…
    </div>
  );
}

export function NoteEditorCollaborative({
  noteId,
  initialTitle,
  initialContent,
  autoFocusTitle,
}: Props) {
  return (
    <LiveblocksProvider authEndpoint={createLiveblocksAuthEndpoint()}>
      <RoomProvider id={noteRoomId(noteId)}>
        <ClientSideSuspense fallback={<CollabFallback />}>
          <NoteCollabSurface
            noteId={noteId}
            initialTitle={initialTitle}
            initialContent={initialContent}
            variant="owner"
            autoFocusTitle={autoFocusTitle}
          />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
