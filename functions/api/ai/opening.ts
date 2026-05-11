import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { topic, proName, conName } = (await ctx.request.json()) as {
      topic: string;
      proName: string;
      conName: string;
    };
    const prompt = `당신은 온라인 토론배틀 "토론배틀"의 AI 사회자입니다. 새 토론을 정돈된 어조로 엽니다.

주제: ${topic}
찬성: ${proName}
반대: ${conName}

아래 다섯 항목을 순서대로, 간결하고 단호하게 작성하세요. 각 항목은 1~2줄.

1. **개회** — 가벼운 인사 + 주제 한 문장 소개. 이모지 1개 허용.
2. **핵심 정의** — 주제에 모호한 용어가 있으면 1~2개만 중립적으로 정의("이 토론에서 'X'는 …"). 명확한 주제면 "별도 정의 없이 일반적 의미로 진행"이라고만 한 줄.
3. **입증책임** — 찬성 측에 있음. 찬성은 명제를 적극 입증, 반대는 그것을 무너뜨리거나 자체 논거로 대응.
4. **핵심 규칙** — 한 줄짜리 항목 3개 (• 표시):
   • 입론은 새 논거 자유 / 반박은 새 논거 금지·기존 논점에 직접 응답(clash)
   • 모든 주장은 근거(자료·사례·논리)와 함께
   • 인신공격·논리적 오류 금지, 한 메시지에 한 라운드 발언 전부 담기
5. **진행 + 첫 호명** — "찬성 입론 → 반대 입론 → 찬성 반박 → 반대 반박 → AI 마무리. 그럼 ${proName}님, 찬성 입론 부탁드립니다."

조건:
- 전체 350~450자
- 마크다운 헤더(#) 금지, 항목 라벨만 **굵게**
- 절대 중립 — 어느 쪽도 편들지 말 것`;
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 900);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI opening failed');
  }
};
