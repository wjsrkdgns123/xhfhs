import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { text } = (await ctx.request.json()) as { text: string };
    if (!text || typeof text !== 'string') {
      return errorResponse('text required', 400);
    }
    if (text.length > 4000) {
      return jsonResponse({ text });
    }
    const prompt = `당신은 한국어 토론 발언을 다듬는 편집자입니다. 아래 사용자가 작성한 토론 발언을 가독성 좋게 정리해주세요.

작업 범위 (반드시 수행):
- 명백한 오타·맞춤법 오류 교정
- 띄어쓰기 정상화
- 한 문장이 너무 길면 자연스러운 곳에서 끊어 여러 문장으로 분리
- 논리적 흐름에 따라 적절히 문단 나누기 (관련 내용 묶기, 새 논점은 새 문단)
- 불필요한 공백·줄바꿈 정리

엄격히 금지 (절대 변경 금지):
- 발언자의 주장·논거·결론을 바꾸지 말 것
- 새로운 논거·예시·근거를 추가하지 말 것
- 어휘 선택을 큰 폭으로 바꾸지 말 것 (작성자 고유의 어조 보존)
- 누락된 내용을 채워넣지 말 것
- 의역하거나 요약하지 말 것 — 다듬기만

출력 규칙:
- 정리된 발언 본문만 출력 (설명·코멘트·메타 표현 금지)
- 마크다운 헤더(#) 금지, 굵은 글씨 등 서식 추가 금지
- 따옴표로 감싸거나 "정리 결과:" 같은 접두어 금지
- 원문이 이미 잘 정리되어 있으면 거의 그대로 반환

원문:
"""
${text}
"""

정리된 발언:`;
    const polished = await callClaude(
      ctx.env.ANTHROPIC_API_KEY,
      prompt,
      Math.min(2000, Math.max(400, Math.ceil(text.length * 1.5))),
    );
    return jsonResponse({ text: polished.trim() || text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI polish failed');
  }
};
