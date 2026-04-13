import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key?.trim()) {
    throw new Error("ANTHROPIC_API_KEY_MISSING");
  }
  return new Anthropic({ apiKey: key });
}

function modelId(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export async function completeClaude(
  system: string,
  user: string
): Promise<string> {
  const client = getClient();
  const msg = await client.messages.create({
    model: modelId(),
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: user }],
  });

  const parts: string[] = [];
  for (const block of msg.content) {
    if (block.type === "text") {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}
