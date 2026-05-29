import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';
import { buildPolishPrompt, polishMaxTokens } from '../../_shared/prompts';
import { requireAuth } from '../../_shared/auth';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    try {
      await requireAuth(ctx.request);
    } catch {
      return errorResponse('Unauthorized', 401);
    }
    const { text } = (await ctx.request.json()) as { text: string };
    if (!text || typeof text !== 'string') {
      return errorResponse('text required', 400);
    }
    if (text.length > 4000) {
      return jsonResponse({ text });
    }
    const polished = await callClaude(
      ctx.env.ANTHROPIC_API_KEY,
      buildPolishPrompt(text),
      polishMaxTokens(text),
    );
    return jsonResponse({ text: polished.trim() || text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI polish failed');
  }
};
