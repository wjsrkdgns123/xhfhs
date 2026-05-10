import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('[server] ANTHROPIC_API_KEY missing — AI endpoints will return 500.');
}
const anthropic = new Anthropic({ apiKey: apiKey ?? 'placeholder' });
const MODEL = 'claude-haiku-4-5-20251001';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

interface Msg { name: string; side: string; text: string }

const phaseLabel = (p: string) => ({
  opening: '개회',
  pro_arg: '찬성 입론',
  con_arg: '반대 입론',
  pro_rebut: '찬성 반박',
  con_rebut: '반대 반박',
  closing: '마무리',
}[p] ?? p);

const formatMessages = (messages: Msg[]) =>
  messages
    .filter((m) => m.side === 'pro' || m.side === 'con')
    .map((m) => `[${m.side === 'pro' ? '찬성' : '반대'} · ${m.name}] ${m.text}`)
    .join('\n');

async function ask(prompt: string, maxTokens: number) {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = res.content[0];
  return block.type === 'text' ? block.text : '';
}

app.post('/api/ai/opening', async (req, res) => {
  try {
    const { topic, proName, conName } = req.body as { topic: string; proName: string; conName: string };
    const text = await ask(
      `당신은 온라인 토론배틀 "토론배틀"의 AI 사회자입니다. 정식 토론 절차에 따라 새로운 토론을 엽니다.

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
- 절대적 중립 — 어느 측에도 암시적 우호 표현 금지`,
      1500,
    );
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI opening failed' });
  }
});

app.post('/api/ai/transition', async (req, res) => {
  try {
    const { topic, currentPhase, nextPhase, recentMessages, nextSpeakerName, nextSpeakerSide } =
      req.body as {
        topic: string;
        currentPhase: string;
        nextPhase: string;
        recentMessages: Msg[];
        nextSpeakerName: string;
        nextSpeakerSide: 'pro' | 'con';
      };
    const recent = formatMessages(recentMessages);
    const isNextRebuttal = nextPhase.endsWith('rebut');
    const text = await ask(
      `당신은 토론 "토론배틀"의 AI 사회자입니다. 정식 토론 절차에 따라 단계 전환을 진행합니다.

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
- 절대 중립 — 어느 측의 논거가 더 옳다고 평하지 말 것`,
      900,
    );
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI transition failed' });
  }
});

app.post('/api/ai/closing', async (req, res) => {
  try {
    const { topic, allMessages, proName, conName } = req.body as {
      topic: string;
      allMessages: Msg[];
      proName: string;
      conName: string;
    };
    const transcript = formatMessages(allMessages);
    const text = await ask(
      `당신은 토론 "토론배틀"의 AI 사회자 겸 심판입니다. 정식 토론 평가 기준에 따라 마무리 심사를 진행합니다.

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
- 절대 중립적 어조, 한쪽을 비하하지 않을 것`,
      2000,
    );
    const verdictMatch = text.match(/<verdict>\s*(pro|con|tie)\s*<\/verdict>/i);
    const aiPick = (verdictMatch?.[1]?.toLowerCase() ?? 'tie') as 'pro' | 'con' | 'tie';
    const cleanText = text.replace(/<verdict>.*?<\/verdict>/gi, '').trim();
    res.json({ text: cleanText, aiPick });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI closing failed' });
  }
});

app.post('/api/ai/argue', async (req, res) => {
  try {
    const { topic, side, phase, priorMessages, opponentName } = req.body as {
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
    const text = await ask(
      `당신은 토론 "토론배틀"의 AI 토론자입니다. 정식 토론 실무 원칙을 따릅니다.

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
- 발언은 한 메시지에 모두 담기 (분할 금지)`,
      1200,
    );
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI argue failed' });
  }
});

app.post('/api/ai/topics', async (_req, res) => {
  try {
    const text = await ask(
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
    res.json({ topics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI topics failed' });
  }
});

app.post('/api/ai/polish', async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text required' });
      return;
    }
    if (text.length > 4000) {
      res.json({ text });
      return;
    }
    const polished = await ask(
      `당신은 한국어 토론 발언을 다듬는 편집자입니다. 아래 사용자가 작성한 토론 발언을 가독성 좋게 정리해주세요.

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

정리된 발언:`,
      Math.min(2000, Math.max(400, Math.ceil(text.length * 1.5))),
    );
    res.json({ text: polished.trim() || text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI polish failed' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, hasKey: !!apiKey }));

const PORT = Number(process.env.API_PORT ?? 3001);
app.listen(PORT, () => console.log(`[server] AI server on http://localhost:${PORT}`));
