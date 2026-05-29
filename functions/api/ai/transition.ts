import {
  callClaude,
  errorResponse,
  jsonResponse,
  type CFEnv,
  type Msg,
} from '../../_shared/claude';
import { buildTransitionPrompt } from '../../_shared/prompts';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { topic, currentPhase, nextPhase, recentMessages, nextSpeakerName, nextSpeakerSide } =
      (await ctx.request.json()) as {
        topic: string;
        currentPhase: string;
        nextPhase: string;
        recentMessages: Msg[];
        nextSpeakerName: string;
        nextSpeakerSide: 'pro' | 'con';
      };
    const text = await callClaude(
      ctx.env.ANTHROPIC_API_KEY,
      buildTransitionPrompt({
        topic,
        currentPhase,
        nextPhase,
        recentMessages,
        nextSpeakerName,
        nextSpeakerSide,
      }),
      500,
    );
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI transition failed');
  }
};
