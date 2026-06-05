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
import { buildClosingPrompt, parseClosing } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const raw = (await ctx.request.json()) as {
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
    const raw_text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 1600);
    const { text, aiPick } = parseClosing(raw_text);
    return jsonResponse({ text, aiPick });
  } catch (e) {
    console.error(e);
    return errorResponse('AI closing failed');
  }
};
