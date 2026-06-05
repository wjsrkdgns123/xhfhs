import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODEL,
  sanitizeMessages,
  sanitizeName,
  sanitizeTopic,
  stripVerdictTags,
  type Msg,
} from './functions/_shared/claude';
import {
  buildArguePrompt,
  buildClosingPrompt,
  buildOpeningPrompt,
  buildPolishPrompt,
  buildTopicsPrompt,
  buildTransitionPrompt,
  parseClosing,
  parseTopics,
  polishMaxTokens,
} from './functions/_shared/prompts';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('[server] ANTHROPIC_API_KEY missing — AI endpoints will return 500.');
}
const anthropic = new Anthropic({ apiKey: apiKey ?? 'placeholder' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// dev 전용: Anthropic SDK 직접 호출. prod는 functions/_shared/claude.ts의
// callClaude(Cloudflare AI Gateway fetch)를 쓴다. 프롬프트는 양쪽이 동일한
// functions/_shared/prompts.ts 빌더로 만든다(단일 출처).
async function ask(prompt: string, maxTokens: number) {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = res.content[0];
  return block.type === 'text' ? block.text : '';
}

app.post('/api/ai/opening', async (req, res) => {
  try {
    const raw = req.body as { topic: string; proName: string; conName: string };
    const prompt = buildOpeningPrompt({
      topic: sanitizeTopic(raw.topic),
      proName: sanitizeName(raw.proName),
      conName: sanitizeName(raw.conName),
    });
    const text = await ask(prompt, 900);
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI opening failed' });
  }
});

app.post('/api/ai/transition', async (req, res) => {
  try {
    const raw = req.body as {
      topic: string;
      currentPhase: string;
      nextPhase: string;
      recentMessages: Msg[];
      nextSpeakerName: string;
      nextSpeakerSide: 'pro' | 'con';
    };
    const prompt = buildTransitionPrompt({
      topic: sanitizeTopic(raw.topic),
      currentPhase: raw.currentPhase,
      nextPhase: raw.nextPhase,
      recentMessages: sanitizeMessages(raw.recentMessages),
      nextSpeakerName: sanitizeName(raw.nextSpeakerName),
      nextSpeakerSide: raw.nextSpeakerSide,
    });
    const text = await ask(prompt, 500);
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI transition failed' });
  }
});

app.post('/api/ai/closing', async (req, res) => {
  try {
    const raw = req.body as {
      topic: string;
      allMessages: Msg[];
      proName: string;
      conName: string;
    };
    const prompt = buildClosingPrompt({
      topic: sanitizeTopic(raw.topic),
      allMessages: sanitizeMessages(raw.allMessages),
      proName: sanitizeName(raw.proName),
      conName: sanitizeName(raw.conName),
    });
    const rawText = await ask(prompt, 1600);
    const { text, aiPick } = parseClosing(rawText);
    res.json({ text, aiPick });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI closing failed' });
  }
});

app.post('/api/ai/argue', async (req, res) => {
  try {
    const raw = req.body as {
      topic: string;
      side: 'pro' | 'con';
      phase: 'pro_arg' | 'con_arg' | 'pro_rebut' | 'con_rebut';
      priorMessages: Msg[];
      opponentName: string;
    };
    const prompt = buildArguePrompt({
      topic: sanitizeTopic(raw.topic),
      side: raw.side,
      phase: raw.phase,
      priorMessages: sanitizeMessages(raw.priorMessages),
      opponentName: sanitizeName(raw.opponentName),
    });
    const text = await ask(prompt, 1200);
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI argue failed' });
  }
});

app.post('/api/ai/topics', async (_req, res) => {
  try {
    const text = await ask(buildTopicsPrompt(), 500);
    const topics = parseTopics(text);
    res.json({ topics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI topics failed' });
  }
});

app.post('/api/ai/polish', async (req, res) => {
  try {
    const { text: rawText } = req.body as { text: string };
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: 'text required' });
      return;
    }
    // 4000자 가드는 유지 — 원문 길이로 판단(긴 발언은 다듬지 않고 그대로 반환).
    if (rawText.length > 4000) {
      res.json({ text: rawText });
      return;
    }
    // verdict 태그 위조 방지: 다듬을 발언에서 가짜 판정 태그를 제거.
    const text = stripVerdictTags(rawText);
    const polished = await ask(buildPolishPrompt(text), polishMaxTokens(text));
    res.json({ text: polished.trim() || text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI polish failed' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, hasKey: !!apiKey }));

const PORT = Number(process.env.API_PORT ?? 3001);
app.listen(PORT, () => console.log(`[server] AI server on http://localhost:${PORT}`));
