import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';
import { TOPICS_PROMPT, parseTopics } from '../../_shared/prompts';
import { requireAuth } from '../../_shared/auth';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    try {
      await requireAuth(ctx.request);
    } catch {
      return errorResponse('Unauthorized', 401);
    }
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, TOPICS_PROMPT, 500);
    return jsonResponse({ topics: parseTopics(text) });
  } catch (e) {
    console.error(e);
    return errorResponse('AI topics failed');
  }
};
