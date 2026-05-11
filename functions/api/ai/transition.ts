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
    const { topic, currentPhase, nextPhase, recentMessages, nextSpeakerName, nextSpeakerSide } =
      (await ctx.request.json()) as {
        topic: string;
        currentPhase: string;
        nextPhase: string;
        recentMessages: Msg[];
        nextSpeakerName: string;
        nextSpeakerSide: 'pro' | 'con';
      };
    const recent = formatMessages(recentMessages);
    const isNextRebuttal = nextPhase.endsWith('rebut');
    const nextRuleLine = isNextRebuttal
      ? '반박 단계입니다. **새 논거 도입 금지**, 상대 발언에 직접 응답(clash)하며 자기 입장 보강.'
      : '입론 단계입니다. 자기 측 핵심 논거를 근거와 함께 명확히 제시.';
    const prompt = `당신은 토론 "토론배틀"의 AI 사회자입니다. 단계 전환을 짧고 매끄럽게 안내합니다.

주제: ${topic}
방금 끝난 단계: ${phaseLabel(currentPhase)}
다음 단계: ${phaseLabel(nextPhase)}
다음 발언자: ${nextSpeakerName} (${nextSpeakerSide === 'pro' ? '찬성' : '반대'})

방금 단계의 발언:
${recent || '(발언 없음)'}

다음 세 줄을 차례대로 작성하세요. **각 줄 한 문장씩, 마크다운 헤더·이모지·항목 번호 없이 줄바꿈으로만 구분**:

1줄. **직전 요약** — 방금 발언자의 핵심 주장 1줄 (중립·왜곡 없이)
2줄. **다음 단계 안내** — ${nextRuleLine}
3줄. **호명** — "${nextSpeakerName}님, ${phaseLabel(nextPhase)} 부탁드립니다." (자연스럽게)

조건:
- 전체 150~220자
- 한쪽 편들기 금지, 평가성 발언 금지(절차 안내만)`;
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 500);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI transition failed');
  }
};
