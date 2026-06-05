import {
  callClaude,
  errorResponse,
  jsonResponse,
  sanitizeMessages,
  sanitizeName,
  sanitizeTopic,
  type CFEnv,
  type Msg,
} from '../../_shared/claude';
import { buildArguePrompt } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const raw = (await ctx.request.json()) as {
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
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 1200);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI argue failed');
  }
};
