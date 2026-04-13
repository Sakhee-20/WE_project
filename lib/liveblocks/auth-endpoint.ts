type Options = {
  shareToken?: string | null;
};

/**
 * Liveblocks client authEndpoint factory. Pass shareToken on public share pages.
 */
export function createLiveblocksAuthEndpoint(options?: Options) {
  return async (room?: string) => {
    const res = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        room,
        shareToken: options?.shareToken ?? undefined,
      }),
    });

    if (!res.ok) {
      let message = "Liveblocks authentication failed";
      try {
        const j = (await res.json()) as { error?: string };
        if (j.error) message = j.error;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    return (await res.json()) as { token: string };
  };
}
