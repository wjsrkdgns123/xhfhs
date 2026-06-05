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
import { buildTransitionPrompt } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const raw = (await ctx.request.json()) as {
      topic: string;
      currentPhase: string;
      nextPhase: string;
      recentMessages: Msg[];
      nextSpeakerName: string;
      nextSpeakerSide: 'pro' | 'con';
    };
    const prompt = buildTransitionPrompt({
      topic: sanitizeTopic(raw.topic),
      currentPhase: raw.currentPhase,
      nextPhase: raw.nextPhase,
      recentMessages: sanitizeMessages(raw.recentMessages),
      nextSpeakerName: sanitizeName(raw.nextSpeakerName),
      nextSpeakerSide: raw.nextSpeakerSide,
    });
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 500);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI transition failed');
  }
};
