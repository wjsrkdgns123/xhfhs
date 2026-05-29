import {
  callClaude,
  errorResponse,
  jsonResponse,
  type CFEnv,
  type Msg,
} from '../../_shared/claude';
import { buildClosingPrompt, parseClosingVerdict } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { topic, allMessages, proName, conName } = (await ctx.request.json()) as {
      topic: string;
      allMessages: Msg[];
      proName: string;
      conName: string;
    };
    const text = await callClaude(
      ctx.env.ANTHROPIC_API_KEY,
      buildClosingPrompt({ topic, allMessages, proName, conName }),
      1600,
    );
    const { aiPick, cleanText } = parseClosingVerdict(text);
    return jsonResponse({ text: cleanText, aiPick });
  } catch (e) {
    console.error(e);
    return errorResponse('AI closing failed');
  }
};
