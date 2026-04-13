import { randomBytes } from "crypto";

/**
 * URL-safe opaque token for share links.
 */
export function createShareToken(): string {
  return randomBytes(24).toString("base64url");
}
