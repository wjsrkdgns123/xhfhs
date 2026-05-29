import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';
import { buildOpeningPrompt } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { topic, proName, conName } = (await ctx.request.json()) as {
      topic: string;
      proName: string;
      conName: string;
    };
    const text = await callClaude(
      ctx.env.ANTHROPIC_API_KEY,
      buildOpeningPrompt({ topic, proName, conName }),
      900,
    );
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI opening failed');
  }
};
