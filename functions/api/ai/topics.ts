import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';
import { buildTopicsPrompt, parseTopics } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, buildTopicsPrompt(), 500);
    const topics = parseTopics(text);
    return jsonResponse({ topics });
  } catch (e) {
    console.error(e);
    return errorResponse('AI topics failed');
  }
};
