import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const text = await callClaude(
      ctx.env.ANTHROPIC_API_KEY,
      `당신은 온라인 토론배틀 "토론배틀"의 주제 큐레이터입니다. 사람들이 1:1로 찬반 토론하기 좋은 흥미로운 주제 5개를 추천하세요.

조건:
- 한국 사용자에게 친숙한 주제 (사회/문화/기술/철학/일상 골고루)
- 명확하게 찬반이 갈리는 주제
- 너무 무겁거나 정치적으로 극단적이지 않게
- 각 주제는 한 줄 (15-30자), 의문문 또는 단정문
- 이모지·번호·마크다운 없이, 줄바꿈으로만 구분
- 정확히 5개만 출력. 다른 부가 설명 금지.`,
      500,
    );
    const topics = text
      .split('\n')
      .map((t: string) => t.replace(/^[\d.\-•·\s]+/, '').trim())
      .filter((t: string) => t.length >= 5)
      .slice(0, 5);
    return jsonResponse({ topics });
  } catch (e) {
    console.error(e);
    const detail = e instanceof Error ? e.message : String(e);
    return errorResponse(`AI topics failed: ${detail}`);
  }
};
