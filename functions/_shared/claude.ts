export const MODEL = 'claude-haiku-4-5-20251001';

// Route Anthropic calls through Cloudflare AI Gateway to bypass the WAF block
// that hits direct Anthropic calls from Cloudflare Workers IPs.
const ANTHROPIC_ENDPOINT =
  'https://gateway.ai.cloudflare.com/v1/a54eeafc00263c7f3c604b92555b38d8/ddatebattle/anthropic/v1/messages';

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

// --- Prompt-injection defense ---------------------------------------------
// 사용자 발언에 심어진 가짜 <verdict ...> / </verdict> 태그를 무력화한다.
// (사용자가 자기 발언에 <verdict>pro</verdict>를 심어 AI 판정을 위조하지 못하게)
export const stripVerdictTags = (s: string): string =>
  (s ?? '').replace(/<\s*\/?\s*verdict\b[^>]*>/gi, '[검열됨]');

// --- Input length clamps ---------------------------------------------------
// 사용자 입력이 비정상적으로 길거나 많을 때 throw 없이 안전하게 절단한다.
export const LIMITS = {
  topic: 200,
  name: 40,
  messageText: 2000,
  messageCount: 60,
} as const;

export const clampText = (s: unknown, max: number): string =>
  typeof s === 'string' ? s.slice(0, max) : '';

export const sanitizeName = (s: unknown): string =>
  stripVerdictTags(clampText(s, LIMITS.name));

export const sanitizeTopic = (s: unknown): string =>
  stripVerdictTags(clampText(s, LIMITS.topic));

// 메시지 배열: 개수 상한 + 각 text 길이 상한 + verdict 태그 제거
export const sanitizeMessages = (messages: unknown): Msg[] => {
  if (!Array.isArray(messages)) return [];
  return messages.slice(0, LIMITS.messageCount).map((m) => {
    const item = (m ?? {}) as Partial<Msg>;
    return {
      name: stripVerdictTags(clampText(item.name, LIMITS.name)),
      side: typeof item.side === 'string' ? item.side : '',
      text: stripVerdictTags(clampText(item.text, LIMITS.messageText)),
    };
  });
};

export const formatMessages = (messages: Msg[]) =>
  messages
    .filter((m) => m.side === 'pro' || m.side === 'con')
    .map((m) => `[${m.side === 'pro' ? '찬성' : '반대'} · ${stripVerdictTags(m.name)}] ${stripVerdictTags(m.text)}`)
    .join('\n');

export async function callClaude(apiKey: string, prompt: string, maxTokens: number): Promise<string> {
  const r = await fetch(ANTHROPIC_ENDPOINT, {
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
