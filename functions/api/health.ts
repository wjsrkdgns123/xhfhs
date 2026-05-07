import { jsonResponse, type CFEnv } from '../_shared/claude';

export const onRequestGet: PagesFunction<CFEnv> = async (ctx) => {
  return jsonResponse({ ok: true, hasKey: !!ctx.env.ANTHROPIC_API_KEY });
};
