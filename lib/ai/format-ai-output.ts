/** Strip markdown code fences so JSON can be parsed. */
export function stripJsonFences(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;
  const m = s.match(fence);
  if (m) return m[1].trim();
  return s;
}

export function tryFormatJson(text: string): string {
  const cleaned = stripJsonFences(text);
  try {
    return JSON.stringify(JSON.parse(cleaned), null, 2);
  } catch {
    return text;
  }
}
