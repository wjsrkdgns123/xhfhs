import { callClaude, errorResponse, jsonResponse, type CFEnv } from '../../_shared/claude';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { topic, proName, conName } = (await ctx.request.json()) as {
      topic: string;
      proName: string;
      conName: string;
    };
    const prompt = `당신은 온라인 토론배틀 "맞짱토론"의 AI 사회자입니다. 정식 토론 절차에 따라 새로운 토론을 엽니다.

주제: ${topic}
찬성: ${proName}
반대: ${conName}

다음 6개 항목을 한국어로, 따뜻하지만 단호하고 중립적인 사회자 어조로 순서대로 작성하세요. **반드시 모든 항목 포함**:

1. **인사 및 주제 소개** (1-2줄)

2. **핵심 개념 정의** (가장 중요 · 충분한 분량)
   - 주제 속 모호하거나 해석이 갈릴 수 있는 핵심 용어 1-3개를 토론용으로 정의
   - 필요하면 토론 범위(시간·지역·대상)나 가정 상황 제시
   - "이번 토론에서 'X'는 ~로 정의합니다" 형식, 양측 어느 쪽에도 유리하지 않게 중립적으로
   - 주제가 이미 명확하면 "별도 정의 없이 일반적 의미로 진행"이라고만 한 줄

3. **입증책임 (Burden of Proof)**
   - "이 주제의 입증책임은 찬성 측에 있습니다. 찬성은 현 상태에서 자신의 명제가 더 타당함을 적극적으로 입증해야 하며, 반대는 찬성의 입증을 무너뜨리거나 자체 논거로 반박할 수 있습니다." 식으로 명확히 안내

4. **토론 규칙 (실무 원칙)**
   - 입론에서는 새 논거 자유, **반박 단계에서는 새 논거 도입 금지** (반박은 기존 논점에 대한 대응)
   - 모든 주장은 근거(자료·사례·논리)와 함께 제시
   - 상대 논거에 **직접 응답하는 클래시(clash)**가 핵심 — 옆길로 빠진 발언은 평가에서 감점
   - 인신공격·감정적 격앙·논리적 오류(허수아비·인신공격·권위에 호소 등) 회피
   - 한 메시지에 자기 입장의 한 라운드 발언을 모두 담을 것 (분할 발언 금지)

5. **진행 순서**
   - 찬성 입론 → 반대 입론 → 찬성 반박 → 반대 반박 → AI 마무리(심판)
   - 각 단계 발언이 끝나면 자동으로 다음 단계로 넘어갑니다

6. **첫 발언 호명**
   - ${proName}님께 찬성 입론 요청. 입증책임을 의식한 핵심 논거 제시를 정중히 부탁

조건:
- 전체 700자 내외 (모든 항목이 들어가야 하므로 간결하게)
- 이모지는 첫 인사에 1개만
- 마크다운 헤더(#) 금지, 섹션 라벨은 굵은 글씨(**)로
- 절대적 중립 — 어느 측에도 암시적 우호 표현 금지`;
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 1500);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI opening failed');
  }
};
