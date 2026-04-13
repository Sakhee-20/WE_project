"use client";

import type { JSONContent } from "@tiptap/core";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { createLiveblocksAuthEndpoint } from "@/lib/liveblocks/auth-endpoint";
import { noteRoomId } from "@/lib/liveblocks/note-room";
import { NoteCollabSurface } from "@/components/editor/NoteCollabSurface";

type Props = {
  token: string;
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
  canEdit: boolean;
};

function CollabFallback() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
      Loading shared note…
    </div>
  );
}

export function ShareNoteLive({
  token,
  noteId,
  initialTitle,
  initialContent,
  canEdit,
}: Props) {
  return (
    <LiveblocksProvider
      authEndpoint={createLiveblocksAuthEndpoint({ shareToken: token })}
    >
      <RoomProvider id={noteRoomId(noteId)}>
        <ClientSideSuspense fallback={<CollabFallback />}>
          <NoteCollabSurface
            noteId={noteId}
            initialTitle={initialTitle}
            initialContent={initialContent}
            variant="share"
            shareToken={token}
            readOnly={!canEdit}
          />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
