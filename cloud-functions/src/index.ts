/**
 * 토론배틀 — 서버 권위 Cloud Functions (STEP 2)
 *
 *  closeDebate         : 토론 종료를 서버가 권위적으로 처리.
 *                        - 발언 기록을 서버가 직접 조회 (가짜 transcript 차단, #5 #9)
 *                        - AI 판정 + 관전자 투표 집계 후 승부 확정
 *                        - 양측 전적을 Admin 권한으로 기록 (클라 위조 차단, #4 #12)
 *  recursiveDeleteRoom : 방 문서 삭제 시 하위 컬렉션 cascade 삭제 (고아 문서 방지, #19)
 *  cleanupExpiredRooms : 2시간 지난 방 스케줄 정리 (#20)
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

const REGION = 'us-central1';
const MODEL = 'claude-haiku-4-5-20251001';
const AI_OPPONENT_UID = '__AI_OPPONENT__';
const AI_NAME = '🤖 AI 사회자';
const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2시간

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

type Side = 'pro' | 'con';
type Verdict = Side | 'tie';

interface DebateMsg {
  side?: string;
  name?: string;
  text?: string;
}

function formatTranscript(msgs: DebateMsg[]): string {
  return msgs
    .filter((m) => m.side === 'pro' || m.side === 'con')
    .map((m) => `[${m.side === 'pro' ? '찬성' : '반대'} · ${m.name ?? ''}] ${m.text ?? ''}`)
    .join('\n');
}

/** 프로덕션 /api/ai/closing 와 동일한 프롬프트로 마무리 심사 + verdict 파싱 */
async function runClosing(
  apiKey: string,
  args: { topic: string; transcript: string; proName: string; conName: string; audienceCount?: number },
): Promise<{ text: string; aiPick: Verdict }> {
  const { topic, transcript, proName, conName } = args;
  const verdictLine =
    args.audienceCount === 0
      ? '관전자 투표가 없어 AI 평가를 중심으로 결정됩니다'
      : '관전자 투표와 합산하여 결정됩니다';
  const prompt = `당신은 토론 "토론배틀"의 AI 사회자 겸 심판입니다. 마무리 심사를 정돈된 흐름으로 진행합니다.

주제: ${topic}
찬성: ${proName} / 반대: ${conName}

전체 발언 기록:
${transcript || '(발언 없음)'}

아래 다섯 항목을 순서대로, 간결하고 공정하게 작성하세요. 각 항목 라벨은 **굵게**, 마크다운 헤더(#) 금지.

1. **양측 논거 정리** — 찬성·반대 각 1~2줄로 핵심 주장만. 인용 왜곡 없이.
2. **클래시(Clash)** — 양측이 직접 부딪힌 쟁점 1~2개. 어느 쪽이 더 설득력 있게 응답했는지 한 문장씩.
3. **입증책임 평가** — 찬성이 명제를 충분히 입증했는지 / 반대가 그 입증을 효과적으로 무너뜨렸는지. 합쳐서 2~3줄.
4. **AI 종합 판단** — 위 분석을 종합해 더 설득력 있던 쪽과 핵심 이유 2줄. 비등하면 솔직히 인정. 마지막에 "**최종 승자는 ${verdictLine}**" 한 줄 필수.
5. **격려** — 양 토론자에게 잘한 점 한 가지씩 짚어 짧게.

**평가 태그 (필수)**:
- 응답 마지막 줄에 기계 파싱용 태그 한 줄을 정확히 출력:
  \`<verdict>pro</verdict>\` 또는 \`<verdict>con</verdict>\` 또는 \`<verdict>tie</verdict>\`
- 4번 종합 판단과 일치해야 함. 태그 줄 뒤에 다른 문자 금지.

조건:
- 전체 500~650자 (verdict 태그 제외)
- 평가 기준은 토론 수행의 질(근거·일관성·반박 정확도)에 한정
- 절대 중립 어조, 비하·조롱 금지`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new HttpsError('internal', `Anthropic API ${r.status}: ${errText.slice(0, 300)}`);
  }
  const data = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
  const block = data.content?.[0];
  const text = block && block.type === 'text' ? block.text ?? '' : '';
  const match = text.match(/<verdict>\s*(pro|con|tie)\s*<\/verdict>/i);
  const aiPick = (match?.[1]?.toLowerCase() ?? 'tie') as Verdict;
  const clean = text.replace(/<verdict>.*?<\/verdict>/gi, '').trim();
  return { text: clean, aiPick };
}

export const closeDebate = onCall(
  { region: REGION, secrets: [ANTHROPIC_API_KEY] },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    const roomId = typeof req.data?.roomId === 'string' ? req.data.roomId : '';
    if (!roomId) throw new HttpsError('invalid-argument', 'roomId가 필요합니다.');

    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) throw new HttpsError('not-found', '방을 찾을 수 없습니다.');
    const room = roomSnap.data() as Record<string, unknown>;
    if (room.createdBy !== uid) {
      throw new HttpsError('permission-denied', '방장만 토론을 종료할 수 있습니다.');
    }
    if (room.status === 'ended') return { ok: true, alreadyEnded: true };

    // 1) 발언 기록을 서버가 직접 조회 (#5 #9 — 클라가 보낸 transcript 신뢰하지 않음)
    const msgsSnap = await roomRef.collection('messages').orderBy('_ts', 'asc').get();
    const transcript = formatTranscript(msgsSnap.docs.map((d) => d.data() as DebateMsg));

    // 2) 관전자 투표를 서버가 직접 집계 (판정 문구 분기 #33/#34 에도 사용)
    const votesSnap = await roomRef.collection('votes').get();
    let proCount = 0;
    let conCount = 0;
    votesSnap.forEach((d) => {
      const s = (d.data() as { side?: string }).side;
      if (s === 'pro') proCount++;
      else if (s === 'con') conCount++;
    });
    const totalVotes = proCount + conCount;

    // 3) AI 판정 (관전자 0명이면 'AI 평가 중심' 문구로 안내)
    const { text: closingText, aiPick } = await runClosing(ANTHROPIC_API_KEY.value(), {
      topic: String(room.topic ?? ''),
      transcript,
      proName: String(room.proName ?? '찬성'),
      conName: String(room.conName ?? '반대'),
      audienceCount: totalVotes,
    });
    const audienceProShare = totalVotes > 0 ? proCount / totalVotes : 0.5;
    const aiProShare = aiPick === 'pro' ? 1 : aiPick === 'con' ? 0 : 0.5;
    const proScore = audienceProShare * 0.5 + aiProShare * 0.5;
    const epsilon = 0.01;
    const winner: Verdict =
      proScore > 0.5 + epsilon ? 'pro' : proScore < 0.5 - epsilon ? 'con' : 'tie';
    const finalProScore = Math.round(proScore * 100);

    // 4) 승부 확정 + 양측 전적을 원자적으로 기록 (#4 #12)
    const proUid = room.proUid as string | null | undefined;
    const conUid = room.conUid as string | null | undefined;
    const opponentIsAi = proUid === AI_OPPONENT_UID || conUid === AI_OPPONENT_UID;
    const suffix = opponentIsAi ? 'VsAi' : 'VsHuman';

    let didClose = false;
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(roomRef);
      if (!fresh.exists) throw new HttpsError('not-found', '방이 삭제되었습니다.');
      if ((fresh.data() as { status?: string }).status === 'ended') return; // 멱등
      didClose = true;
      tx.update(roomRef, { status: 'ended', winner, aiPick, finalProScore, statsRecorded: true });

      const players: Array<{ uid: string | null | undefined; side: Side }> = [
        { uid: proUid, side: 'pro' },
        { uid: conUid, side: 'con' },
      ];
      for (const p of players) {
        if (!p.uid || p.uid === AI_OPPONENT_UID) continue;
        const result = winner === 'tie' ? 'ties' : winner === p.side ? 'wins' : 'losses';
        tx.set(
          db.collection('users').doc(p.uid),
          {
            [`${result}${suffix}`]: FieldValue.increment(1),
            totalDebates: FieldValue.increment(1),
          },
          { merge: true },
        );
      }
    });

    // 5) 마무리 사회자 메시지 게시 (이번 호출이 실제로 종료한 경우에만 — 중복 방지)
    if (didClose && closingText) {
      await roomRef.collection('messages').add({
        uid: room.createdBy,
        name: AI_NAME,
        side: 'moderator',
        text: closingText,
        createdAt: Date.now(),
        _ts: FieldValue.serverTimestamp(),
      });
    }

    return { ok: true, winner, aiPick, finalProScore };
  },
);

/** 방 문서가 삭제되면 하위 컬렉션(messages·votes·spectator_messages)을 cascade 삭제 (#19) */
export const recursiveDeleteRoom = onDocumentDeleted(
  { region: REGION, document: 'rooms/{roomId}' },
  async (event) => {
    const { roomId } = event.params;
    try {
      await db.recursiveDelete(db.collection('rooms').doc(roomId));
      logger.info(`recursiveDeleteRoom: cleaned subcollections for ${roomId}`);
    } catch (e) {
      logger.error(`recursiveDeleteRoom failed for ${roomId}`, e);
    }
  },
);

/** 2시간 지난 방을 매시간 정리 (소유자가 다시 안 와도 정리됨, #20) */
export const cleanupExpiredRooms = onSchedule(
  { region: REGION, schedule: 'every 60 minutes' },
  async () => {
    const cutoff = Date.now() - ROOM_TTL_MS;
    const snap = await db.collection('rooms').where('createdAt', '<', cutoff).get();
    let removed = 0;
    for (const docSnap of snap.docs) {
      try {
        await db.recursiveDelete(docSnap.ref);
        removed++;
      } catch (e) {
        logger.error(`cleanupExpiredRooms: failed to delete ${docSnap.id}`, e);
      }
    }
    logger.info(`cleanupExpiredRooms: removed ${removed} expired room(s)`);
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2-B (#6 #7 #8): server-authoritative debate progression — advanceDebate.
//
// ⚠️⚠️ UNTESTED DRAFT — NOT SAFE TO DEPLOY AS-IS. Deploying these triggers while
// the browser still drives progression (App.tsx openingTriggered/argueTriggeredFor
// effects + advancePhase) would DOUBLE-advance the debate. To actually enable:
//   1. Deploy + verify closeDebate first.
//   2. Gate/disable the client-side progression effects so only the server advances.
//   3. Deploy these; verify a full human-vs-human AND human-vs-AI debate end-to-end.
//   4. Add turn-timer/AFK handling (#7) — a scheduled function that, for live rooms
//      whose current speaker hasn't posted within N minutes, posts a nudge or skips.
//   5. Final-close path: refactor closeDebate's core into a shared finalize() and
//      call it from advanceDebate when the last round ends (see TODO below).
// Authored on the audit-followups branch so the design exists for review.
// ─────────────────────────────────────────────────────────────────────────────

const AI_OPPONENT_NAME = '🤖 AI 토론자';
const PHASE_SPEAKER: Record<string, Side | null> = {
  opening: null,
  pro_arg: 'pro',
  con_arg: 'con',
  pro_rebut: 'pro',
  con_rebut: 'con',
};
const NEXT_PHASE: Record<string, string> = {
  opening: 'pro_arg',
  pro_arg: 'con_arg',
  con_arg: 'pro_rebut',
  pro_rebut: 'con_rebut',
  con_rebut: 'closing',
};
const PHASE_LABEL: Record<string, string> = {
  opening: '개회',
  pro_arg: '찬성 입론',
  con_arg: '반대 입론',
  pro_rebut: '찬성 반박',
  con_rebut: '반대 반박',
  closing: '마무리',
};
const phaseLabel = (p: string) => PHASE_LABEL[p] ?? p;

async function callAnthropic(apiKey: string, prompt: string, maxTokens: number): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}`);
  const data = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
  const b = data.content?.[0];
  return b && b.type === 'text' ? b.text ?? '' : '';
}

function openingPrompt(topic: string, proName: string, conName: string): string {
  return `당신은 온라인 토론배틀 "토론배틀"의 AI 사회자입니다. 새 토론을 정돈된 어조로 엽니다.

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
}

function transitionPrompt(
  topic: string,
  currentPhase: string,
  nextPhase: string,
  recent: string,
  nextSpeakerName: string,
  nextSpeakerSide: Side,
): string {
  const nextRuleLine = nextPhase.endsWith('rebut')
    ? '반박 단계입니다. **새 논거 도입 금지**, 상대 발언에 직접 응답(clash)하며 자기 입장 보강.'
    : '입론 단계입니다. 자기 측 핵심 논거를 근거와 함께 명확히 제시.';
  return `당신은 토론 "토론배틀"의 AI 사회자입니다. 단계 전환을 짧고 매끄럽게 안내합니다.

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
}

function arguePrompt(topic: string, side: Side, phase: string, transcript: string, opponentName: string): string {
  const sideLabel = side === 'pro' ? '찬성' : '반대';
  const isRebuttal = phase.endsWith('rebut');
  const burdenNote =
    side === 'pro'
      ? '당신은 찬성 측이며 입증책임(Burden of Proof)이 있습니다. 명제를 적극적으로 입증해야 합니다.'
      : '당신은 반대 측입니다. 찬성의 입증을 무너뜨리거나 자체 논거로 반박해야 합니다.';
  return `당신은 토론 "토론배틀"의 AI 토론자입니다. 정식 토론 실무 원칙을 따릅니다.

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
- 동시에 자기 측 논거가 어떻게 여전히 유효한지 보강`
    : `**입론 단계 규칙**:
- 자기 입장의 핵심 논거 2-3개를 제시
- 각 논거마다 구체적 근거 (자료·사례·논리적 추론) 포함
- 입증책임을 충족하도록 명확하고 강하게 입증`
}

공통 조건:
- 한국어, 자연스럽고 논리적인 어조, **350-450자**
- 인신공격·감정적 호소·논리적 오류 금지, 근거 기반
- 마크다운 헤더(#)·이모지 금지, "AI로서" 같은 메타 발언 금지`;
}

async function addRoomMessage(roomId: string, fields: Record<string, unknown>): Promise<void> {
  await db.collection('rooms').doc(roomId).collection('messages').add({
    ...fields,
    createdAt: Date.now(),
    _ts: FieldValue.serverTimestamp(),
  });
}

/** If the room's current speaker is the AI opponent, generate + post its argument.
 *  Posting that message re-triggers advanceDebate, which advances to the next phase. */
async function maybeAiTurn(roomId: string): Promise<void> {
  const ref = db.collection('rooms').doc(roomId);
  const room = (await ref.get()).data() as Record<string, unknown> | undefined;
  if (!room || room.status !== 'live' || !room.phase) return;
  const phase = String(room.phase);
  const aiSide: Side | null =
    room.proUid === AI_OPPONENT_UID ? 'pro' : room.conUid === AI_OPPONENT_UID ? 'con' : null;
  if (!aiSide || PHASE_SPEAKER[phase] !== aiSide) return;
  const msgsSnap = await ref.collection('messages').orderBy('_ts', 'asc').get();
  const transcript = formatTranscript(msgsSnap.docs.map((d) => d.data() as DebateMsg));
  const opp = aiSide === 'pro' ? String(room.conName ?? '상대') : String(room.proName ?? '상대');
  const aiText = await callAnthropic(
    ANTHROPIC_API_KEY.value(),
    arguePrompt(String(room.topic ?? ''), aiSide, phase, transcript, opp),
    1200,
  );
  if (aiText) {
    await addRoomMessage(roomId, { uid: room.createdBy, name: AI_OPPONENT_NAME, side: aiSide, text: aiText });
  }
}

/** When both seats fill (status→live, both names set), post the opening once. (#6) */
export const postOpeningOnLive = onDocumentUpdated(
  { region: REGION, document: 'rooms/{roomId}', secrets: [ANTHROPIC_API_KEY] },
  async (event) => {
    const after = event.data?.after.data() as Record<string, unknown> | undefined;
    if (!after || after.status !== 'live' || after.openingPosted) return;
    if (!after.proName || !after.conName) return;
    const ref = db.collection('rooms').doc(event.params.roomId);
    let claimed = false;
    await db.runTransaction(async (tx) => {
      const f = (await tx.get(ref)).data() as Record<string, unknown> | undefined;
      if (!f || f.openingPosted || f.status !== 'live' || !f.proName || !f.conName) return;
      claimed = true;
      tx.update(ref, { openingPosted: true, phase: 'pro_arg' });
    });
    if (!claimed) return;
    const text = await callAnthropic(
      ANTHROPIC_API_KEY.value(),
      openingPrompt(String(after.topic ?? ''), String(after.proName), String(after.conName)),
      900,
    );
    if (text) await addRoomMessage(event.params.roomId, { uid: after.createdBy, name: AI_NAME, side: 'moderator', text });
    await maybeAiTurn(event.params.roomId);
  },
);

/** A debater (pro/con) message means their turn ended → advance the phase. (#6 #8) */
export const advanceDebate = onDocumentCreated(
  { region: REGION, document: 'rooms/{roomId}/messages/{messageId}', secrets: [ANTHROPIC_API_KEY] },
  async (event) => {
    const msg = event.data?.data() as DebateMsg | undefined;
    if (!msg || (msg.side !== 'pro' && msg.side !== 'con')) return;
    const roomId = event.params.roomId;
    const ref = db.collection('rooms').doc(roomId);
    const room = (await ref.get()).data() as Record<string, unknown> | undefined;
    if (!room || room.status !== 'live' || !room.phase) return;
    const phase = String(room.phase);
    if (PHASE_SPEAKER[phase] !== msg.side) return; // not the active speaker → ignore
    const next = NEXT_PHASE[phase];
    const topic = String(room.topic ?? '');
    const proName = room.proName as string | null;
    const conName = room.conName as string | null;

    if (next === 'closing') {
      // Auto-extend rounds (mirrors the client) until plannedRounds is reached.
      const planned = Math.max(1, Number(room.plannedRounds ?? 1));
      const round = Number(room.extendRound ?? 0) + 1;
      if (round < planned) {
        let claimed = false;
        await db.runTransaction(async (tx) => {
          const f = (await tx.get(ref)).data() as Record<string, unknown> | undefined;
          if (!f || f.phase !== phase || f.status !== 'live') return;
          claimed = true;
          tx.update(ref, { phase: 'pro_arg', extendRound: round, extendRequestPro: false, extendRequestCon: false });
        });
        if (claimed) {
          await addRoomMessage(roomId, {
            uid: room.createdBy,
            name: AI_NAME,
            side: 'moderator',
            text: `${round}라운드를 마칩니다. 곧이어 ${round + 1}라운드 — ${proName ?? '찬성 측'}님, 찬성 입론부터 부탁드립니다.`,
          });
          await maybeAiTurn(roomId);
        }
        return;
      }
      // TODO(#close): final round done → call a shared finalize() (refactored from
      // closeDebate's core) to set winner/stats. Until then the creator client's
      // closeDebate-fallback path handles the final close.
      return;
    }

    // Non-closing: claim the advance (idempotent), post AI transition, set next phase.
    let claimed = false;
    await db.runTransaction(async (tx) => {
      const f = (await tx.get(ref)).data() as Record<string, unknown> | undefined;
      if (!f || f.phase !== phase || f.status !== 'live') return;
      claimed = true;
      tx.update(ref, { phase: next });
    });
    if (!claimed) return;

    const nextSide = PHASE_SPEAKER[next];
    const nextName = (nextSide === 'pro' ? proName : nextSide === 'con' ? conName : '') ?? '';
    const recent = formatTranscript([{ side: msg.side, name: msg.name, text: msg.text }]);
    const tText = await callAnthropic(
      ANTHROPIC_API_KEY.value(),
      transitionPrompt(topic, phase, next, recent, String(nextName), (nextSide ?? 'pro') as Side),
      500,
    );
    if (tText) await addRoomMessage(roomId, { uid: room.createdBy, name: AI_NAME, side: 'moderator', text: tText });
    await maybeAiTurn(roomId);
  },
);

/** #7 (STEP2-B): turn-timer / AFK guard. Scheduled draft — for live rooms whose
 *  current (human) speaker has gone quiet, nudge after 5 min and auto-end after 15.
 *  ⚠️ UNTESTED DRAFT; tune thresholds + replace the tie-end with the shared finalize().
 *  `nudgedAt` should be cleared on each phase change (advanceDebate) before enabling. */
export const checkStalledRooms = onSchedule(
  { region: REGION, schedule: 'every 5 minutes' },
  async () => {
    const NUDGE_MS = 5 * 60 * 1000;
    const END_MS = 15 * 60 * 1000;
    const snap = await db.collection('rooms').where('status', '==', 'live').get();
    for (const docSnap of snap.docs) {
      const room = docSnap.data();
      if (!room.phase) continue;
      const speaker = PHASE_SPEAKER[String(room.phase)];
      if (!speaker) continue; // opening — no human speaker waiting
      const aiSide: Side | null =
        room.proUid === AI_OPPONENT_UID ? 'pro' : room.conUid === AI_OPPONENT_UID ? 'con' : null;
      if (speaker === aiSide) continue; // AI turns are generated server-side, not "stalled"

      const lastSnap = await docSnap.ref.collection('messages').orderBy('_ts', 'desc').limit(1).get();
      const last = lastSnap.docs[0]?.data();
      const lastMs = typeof last?.createdAt === 'number' ? last.createdAt : Number(room.createdAt ?? 0);
      const idle = Date.now() - lastMs;

      if (idle > END_MS) {
        await docSnap.ref.update({ status: 'ended', winner: 'tie', statsRecorded: true });
        await addRoomMessage(docSnap.id, {
          uid: room.createdBy,
          name: AI_NAME,
          side: 'moderator',
          text: '장시간 발언이 없어 토론을 종료합니다.',
        });
      } else if (idle > NUDGE_MS && !room.nudgedAt) {
        await docSnap.ref.update({ nudgedAt: Date.now() });
        const who = speaker === 'pro' ? room.proName ?? '찬성 측' : room.conName ?? '반대 측';
        await addRoomMessage(docSnap.id, {
          uid: room.createdBy,
          name: AI_NAME,
          side: 'moderator',
          text: `${who}님, 발언을 기다리고 있습니다. 곧 이어가 주세요.`,
        });
      }
    }
  },
);
