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
    const prompt = `당신은 토론 "토론배틀"의 AI 사회자 겸 심판입니다. 마무리 심사를 정돈된 흐름으로 진행합니다.

주제: ${topic}
찬성: ${proName} / 반대: ${conName}

전체 발언 기록:
${transcript || '(발언 없음)'}

아래 다섯 항목을 순서대로, 간결하고 공정하게 작성하세요. 각 항목 라벨은 **굵게**, 마크다운 헤더(#) 금지.

1. **양측 논거 정리** — 찬성·반대 각 1~2줄로 핵심 주장만. 인용 왜곡 없이.
2. **클래시(Clash)** — 양측이 직접 부딪힌 쟁점 1~2개. 어느 쪽이 더 설득력 있게 응답했는지 한 문장씩.
3. **입증책임 평가** — 찬성이 명제를 충분히 입증했는지 / 반대가 그 입증을 효과적으로 무너뜨렸는지. 합쳐서 2~3줄.
4. **AI 종합 판단** — 위 분석을 종합해 더 설득력 있던 쪽과 핵심 이유 2줄. 비등하면 솔직히 인정. 마지막에 "**최종 승자는 관전자 투표와 합산하여 결정됩니다**" 한 줄 필수.
5. **격려** — 양 토론자에게 잘한 점 한 가지씩 짚어 짧게.

**평가 태그 (필수)**:
- 응답 마지막 줄에 기계 파싱용 태그 한 줄을 정확히 출력:
  \`<verdict>pro</verdict>\` 또는 \`<verdict>con</verdict>\` 또는 \`<verdict>tie</verdict>\`
- 4번 종합 판단과 일치해야 함. 태그 줄 뒤에 다른 문자 금지.

조건:
- 전체 500~650자 (verdict 태그 제외)
- 평가 기준은 토론 수행의 질(근거·일관성·반박 정확도)에 한정
- 절대 중립 어조, 비하·조롱 금지`;
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 1600);
    const verdictMatch = text.match(/<verdict>\s*(pro|con|tie)\s*<\/verdict>/i);
    const aiPick = (verdictMatch?.[1]?.toLowerCase() ?? 'tie') as 'pro' | 'con' | 'tie';
    const cleanText = text.replace(/<verdict>.*?<\/verdict>/gi, '').trim();
    return jsonResponse({ text: cleanText, aiPick });
  } catch (e) {
    console.error(e);
    return errorResponse('AI closing failed');
  }
};
