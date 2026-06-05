import {
  callClaude,
  errorResponse,
  jsonResponse,
  stripVerdictTags,
  type CFEnv,
} from '../../_shared/claude';
import { buildPolishPrompt, polishMaxTokens } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { text: rawText } = (await ctx.request.json()) as { text: string };
    if (!rawText || typeof rawText !== 'string') {
      return errorResponse('text required', 400);
    }
    // 4000자 가드는 유지 — 원문 길이로 판단(긴 발언은 다듬지 않고 그대로 반환).
    if (rawText.length > 4000) {
      return jsonResponse({ text: rawText });
    }
    // verdict 태그 위조 방지: 다듬을 발언에서 가짜 판정 태그를 제거.
    const text = stripVerdictTags(rawText);
    const prompt = buildPolishPrompt(text);
    const polished = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, polishMaxTokens(text));
    return jsonResponse({ text: polished.trim() || text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI polish failed');
  }
};
