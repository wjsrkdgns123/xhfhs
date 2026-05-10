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
    const prompt = `당신은 토론 "토론배틀"의 AI 사회자입니다. 정식 토론 절차에 따라 단계 전환을 진행합니다.

주제: ${topic}
방금 끝난 단계: ${phaseLabel(currentPhase)}
다음 단계: ${phaseLabel(nextPhase)}
다음 발언자: ${nextSpeakerName} (${nextSpeakerSide === 'pro' ? '찬성' : '반대'})

방금 단계의 발언:
${recent || '(발언 없음)'}

다음 4개 항목을 한국어로 순서대로 작성하세요:

1. **직전 발언 요약** (2-3줄)
   - 발언자가 제시한 핵심 논거/근거를 공정·중립적으로 정리
   - 인용·왜곡 없이, 양측이 모두 동의할 수 있는 형태로

2. **간단 코멘트 (선택, 짧게)**
   - 직전 발언의 강점 또는 보완 필요점 한 가지 (예: 근거 부족, 논점 이탈, 모호한 정의 사용 등)
   - 한쪽 편들지 않고 절차적 관점에서만
   - 문제 없으면 생략

3. **다음 단계 ${phaseLabel(nextPhase)} 안내**
   ${
     isNextRebuttal
       ? `   - 반박 단계의 핵심 규칙 강조: **새 논거 도입 금지**, 상대 논거에 직접 클래시(clash), 자기 입장 보강\n   - 어떤 쟁점에 응답해야 하는지 짚어주면 좋음`
       : `   - 입론은 자기 측 핵심 논거를 근거와 함께 자유롭게 제시 가능\n   - 입증책임을 의식하며 핵심 논점을 명확히 해달라는 안내`
   }

4. **발언권 이양**
   - ${nextSpeakerName}님께 발언을 정중히 요청

조건:
- 전체 400자 내외
- 이모지 금지, 마크다운 헤더(#) 금지, 섹션 라벨만 굵은 글씨(**)
- 절대 중립 — 어느 측의 논거가 더 옳다고 평하지 말 것`;
    const text = await callClaude(ctx.env.ANTHROPIC_API_KEY, prompt, 900);
    return jsonResponse({ text });
  } catch (e) {
    console.error(e);
    return errorResponse('AI transition failed');
  }
};
