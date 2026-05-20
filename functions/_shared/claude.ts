// DIAG: temporarily swapped to known-stable model to isolate 403 cause (key vs model)
export const MODEL = 'claude-3-5-haiku-latest';

export interface Msg {
  name: string;
  side: string;
  text: string;
}

export const phaseLabel = (p: string) =>
  ({
    opening: '개회',
    pro_arg: '찬성 입론',
    con_arg: '반대 입론',
    pro_rebut: '찬성 반박',
    con_rebut: '반대 반박',
    closing: '마무리',
  } as Record<string, string>)[p] ?? p;

export const formatMessages = (messages: Msg[]) =>
  messages
    .filter((m) => m.side === 'pro' || m.side === 'con')
    .map((m) => `[${m.side === 'pro' ? '찬성' : '반대'} · ${m.name}] ${m.text}`)
    .join('\n');

export async function callClaude(apiKey: string, prompt: string, maxTokens: number): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Anthropic API ${r.status}: ${errText.slice(0, 500)}`);
  }
  const data = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
  const block = data.content?.[0];
  return block && block.type === 'text' ? block.text ?? '' : '';
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

export interface CFEnv {
  ANTHROPIC_API_KEY: string;
}
