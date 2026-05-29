import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { type Msg } from './functions/_shared/claude';
import {
  buildOpeningPrompt,
  buildTransitionPrompt,
  buildClosingPrompt,
  buildArguePrompt,
  buildPolishPrompt,
  parseClosingVerdict,
  parseTopics,
  polishMaxTokens,
  TOPICS_PROMPT,
} from './functions/_shared/prompts';

// 개발용 AI 서버 (로컬 `npm run dev`). 프로덕션은 functions/api/ai/* (Cloudflare).
// 프롬프트는 functions/_shared/prompts.ts 단일 소스에서 가져온다 (#24) — 이 파일과
// Cloudflare 함수가 항상 동일한 프롬프트를 쓰도록 보장.
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('[server] ANTHROPIC_API_KEY missing — AI endpoints will return 500.');
}
const anthropic = new Anthropic({ apiKey: apiKey ?? 'placeholder' });
const MODEL = 'claude-haiku-4-5-20251001';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

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
    const { topic, proName, conName } = req.body as { topic: string; proName: string; conName: string };
    const text = await ask(buildOpeningPrompt({ topic, proName, conName }), 900);
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI opening failed' });
  }
});

app.post('/api/ai/transition', async (req, res) => {
  try {
    const { topic, currentPhase, nextPhase, recentMessages, nextSpeakerName, nextSpeakerSide } =
      req.body as {
        topic: string;
        currentPhase: string;
        nextPhase: string;
        recentMessages: Msg[];
        nextSpeakerName: string;
        nextSpeakerSide: 'pro' | 'con';
      };
    const text = await ask(
      buildTransitionPrompt({
        topic,
        currentPhase,
        nextPhase,
        recentMessages,
        nextSpeakerName,
        nextSpeakerSide,
      }),
      500,
    );
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI transition failed' });
  }
});

app.post('/api/ai/closing', async (req, res) => {
  try {
    const { topic, allMessages, proName, conName, audienceCount } = req.body as {
      topic: string;
      allMessages: Msg[];
      proName: string;
      conName: string;
      audienceCount?: number;
    };
    const text = await ask(buildClosingPrompt({ topic, allMessages, proName, conName, audienceCount }), 1600);
    const { aiPick, cleanText } = parseClosingVerdict(text);
    res.json({ text: cleanText, aiPick });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI closing failed' });
  }
});

app.post('/api/ai/argue', async (req, res) => {
  try {
    const { topic, side, phase, priorMessages, opponentName } = req.body as {
      topic: string;
      side: 'pro' | 'con';
      phase: 'pro_arg' | 'con_arg' | 'pro_rebut' | 'con_rebut';
      priorMessages: Msg[];
      opponentName: string;
    };
    const text = await ask(buildArguePrompt({ topic, side, phase, priorMessages, opponentName }), 1200);
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI argue failed' });
  }
});

app.post('/api/ai/topics', async (_req, res) => {
  try {
    const text = await ask(TOPICS_PROMPT, 500);
    res.json({ topics: parseTopics(text) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI topics failed' });
  }
});

app.post('/api/ai/polish', async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text required' });
      return;
    }
    if (text.length > 4000) {
      res.json({ text });
      return;
    }
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
