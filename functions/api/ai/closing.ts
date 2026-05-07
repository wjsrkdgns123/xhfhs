import {
  callClaude,
  errorResponse,
  formatMessages,
  jsonResponse,
  type CFEnv,
  type Msg,
} from '../../_shared/claude';

export const onRequestPost: PagesFunction<CFEnv> = async (ctx) => {
  try {
    const { topic, allMessages, proName, conName } = (await ctx.request.json()) as {
      topic: string;
      allMessages: Msg[];
      proName: string;
      conName: string;
    };
    const transcript = formatMessages(allMessages);
    const prompt = `당신은 토론 "맞짱토론"의 AI 사회자 겸 심판입니다. 정식 토론 평가 기준에 따라 마무리 심사를 진행합니다.

주제: ${topic}
찬성: ${proName} / 반대: ${conName}

전체 발언 기록:
${transcript || '(발언 없음)'}

다음 5개 항목을 한국어로 순서대로 작성하세요. **반드시 모든 항목 포함**:

1. **양측 핵심 논거 정리** (각 2-3줄)
   - 찬성 측이 내세운 주요 논거와 핵심 근거
   - 반대 측이 내세운 주요 논거와 핵심 근거
   - 공정·중립적으로, 인용 왜곡 없이

2. **클래시(Clash) 분석**
   - 양측이 직접 충돌한 핵심 쟁점 1-2개
   - 각 쟁점에서 어느 측이 더 설득력 있게 대응했는지 (근거의 강도·논리 일관성·반박의 정확도 기준)

3. **입증책임(Burden of Proof) 평가**
   - 찬성 측이 자신의 명제를 입증하는 데 충분한 근거를 제시했는지
   - 반대 측이 그 입증을 효과적으로 무너뜨렸는지

4. **AI 종합 판단**
   - 위 분석을 종합해 AI 관점에서 더 설득력 있었던 측과 핵심 이유 (2-3줄)
   - 단, "**최종 승자는 관전자 투표로 결정됩니다**"를 반드시 명시
   - 한쪽이 명백히 우세하지 않다면 그 사실을 솔직히 인정

5. **양측 격려**
   - 두 토론자에게 각각 잘한 점 한 가지씩 짚어 짧은 감사·격려

**평가 태그 (필수)**:
- 응답의 가장 마지막 줄에, 위 4번 종합 판단을 기계 파싱용 태그로 다시 한번 출력하세요.
- 형식: \`<verdict>pro</verdict>\` 또는 \`<verdict>con</verdict>\` 또는 \`<verdict>tie</verdict>\`
- 이 태그 외 다른 줄/문자 없이 정확히 그 한 줄로 마무리

조건:
- 전체 800자 내외 (verdict 태그 제외)
- 마크다운 헤더(#) 금지, 섹션 라벨은 굵은 글씨(**)로
- 평가 기준은 일관되게 적용 — 인기 있는 입장이 아니라 토론 수행의 질로 평가
- 절대 중립적 어조, 한쪽을 비하하지 않을 것`;
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 2000);
    const verdictMatch = text.match(/<verdict>\s*(pro|con|tie)\s*<\/verdict>/i);
    const aiPick = (verdictMatch?.[1]?.toLowerCase() ?? 'tie') as 'pro' | 'con' | 'tie';
    const cleanText = text.replace(/<verdict>.*?<\/verdict>/gi, '').trim();
    return jsonResponse({ text: cleanText, aiPick });
  } catch (e) {
    console.error(e);
    return errorResponse('AI closing failed');
  }
};
