import {
  callClaude,
  errorResponse,
  formatMessages,
  jsonResponse,
  phaseLabel,
  type CFEnv,
  type Msg,
} from '../../_shared/claude';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { topic, side, phase, priorMessages, opponentName } = (await ctx.request.json()) as {
      topic: string;
      side: 'pro' | 'con';
      phase: 'pro_arg' | 'con_arg' | 'pro_rebut' | 'con_rebut';
      priorMessages: Msg[];
      opponentName: string;
    };
    const transcript = formatMessages(priorMessages);
    const sideLabel = side === 'pro' ? '찬성' : '반대';
    const isRebuttal = phase.endsWith('rebut');
    const burdenNote =
      side === 'pro'
        ? '당신은 찬성 측이며 입증책임(Burden of Proof)이 있습니다. 명제를 적극적으로 입증해야 합니다.'
        : '당신은 반대 측입니다. 찬성의 입증을 무너뜨리거나 자체 논거로 반박해야 합니다.';
    const prompt = `당신은 토론 "맞짱토론"의 AI 토론자입니다. 정식 토론 실무 원칙을 따릅니다.

주제: ${topic}
당신의 입장: ${sideLabel}
현재 단계: ${phaseLabel(phase)}
상대 토론자: ${opponentName}
${burdenNote}

지금까지 발언 기록:
${transcript || '(아직 발언 없음)'}

${
  isRebuttal
    ? `**반박 단계 규칙 (엄수)**:
- **새 논거 도입 절대 금지** — 입론에서 제시되지 않은 논점은 꺼내지 말 것
- 상대방의 구체적 발언을 직접 인용하거나 짚어 클래시(clash)
- 상대 논거의 약점/모순/근거 부족을 지적
- 동시에 자기 측 논거가 어떻게 여전히 유효한지 보강

작성 방법:
1. 상대방 핵심 논거 1-2개를 짚어 직접 반박
2. 각 반박마다 구체적 근거나 논리 제시
3. 마지막에 자기 입장의 핵심을 한 줄로 강조`
    : `**입론 단계 규칙**:
- 자기 입장의 핵심 논거 2-3개를 제시
- 각 논거마다 구체적 근거 (자료·사례·논리적 추론) 포함
- 입증책임을 충족하도록 명확하고 강하게 입증
${side === 'pro' ? '- 찬성 측: 명제가 왜 옳은지 적극적으로 입증' : '- 반대 측: 찬성 측이 입증해야 할 것을 미리 짚거나, 반대 입장 자체의 근거 제시'}

작성 방법:
1. 핵심 입장을 한 줄로 선언
2. 논거 2-3개를 각각 근거와 함께 전개
3. 마지막에 자기 입장의 의의를 한 줄로`
}

공통 조건:
- 한국어, 자연스럽고 논리적인 어조 (실제 토론자처럼)
- **350-450자** 범위 (너무 짧으면 빈약, 너무 길면 산만)
- **인신공격·감정적 호소·논리적 오류(허수아비·권위에 호소·미끄러운 비탈 등) 금지**
- **근거 기반** — "내 생각엔" "느낌상" 같은 주관적 표현 자제
- 마크다운 헤더(#) 금지, 굵은 글씨도 자제 (자연스러운 문장으로)
- 이모지 절대 금지
- "AI로서..." "저는 AI지만..." 같은 메타 발언 절대 금지 — 한 명의 토론자로서 발언
- 발언은 한 메시지에 모두 담기 (분할 금지)`;
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 1200);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI argue failed');
  }
};
