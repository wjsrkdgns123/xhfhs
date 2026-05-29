import {
  callClaude,
  errorResponse,
  jsonResponse,
  type CFEnv,
  type Msg,
} from '../../_shared/claude';
import { buildArguePrompt } from '../../_shared/prompts';
import { requireAuth } from '../../_shared/auth';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    try {
      await requireAuth(ctx.request);
    } catch {
      return errorResponse('Unauthorized', 401);
    }
    const { topic, side, phase, priorMessages, opponentName } = (await ctx.request.json()) as {
      topic: string;
      side: 'pro' | 'con';
      phase: 'pro_arg' | 'con_arg' | 'pro_rebut' | 'con_rebut';
      priorMessages: Msg[];
      opponentName: string;
    };
    const text = await callClaude(
      ctx.env.ANTHROPIC_API_KEY,
      buildArguePrompt({ topic, side, phase, priorMessages, opponentName }),
      1200,
    );
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI argue failed');
  }
};
