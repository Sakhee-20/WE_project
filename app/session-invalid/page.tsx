"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

/**
 * Shown when the JWT user id no longer exists in the database (e.g. after a DB reset).
 * Clears the cookie so the user can sign in again and get a fresh user row.
 */
export default function SessionInvalidPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center">
      <p className="text-sm text-zinc-400">
        Your session does not match this app anymore. Signing you out...
      </p>
    </div>
  );
}
