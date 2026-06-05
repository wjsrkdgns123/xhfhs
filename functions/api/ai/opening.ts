import {
  callClaude,
  errorResponse,
  jsonResponse,
  sanitizeName,
  sanitizeTopic,
  type CFEnv,
} from '../../_shared/claude';
import { buildOpeningPrompt } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const raw = (await ctx.request.json()) as {
      topic: string;
      proName: string;
      conName: string;
    };
    const topic = sanitizeTopic(raw.topic);
    const proName = sanitizeName(raw.proName);
    const conName = sanitizeName(raw.conName);
    const prompt = buildOpeningPrompt({ topic, proName, conName });
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 900);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI opening failed');
  }
};
