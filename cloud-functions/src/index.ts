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
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
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
  args: { topic: string; transcript: string; proName: string; conName: string },
): Promise<{ text: string; aiPick: Verdict }> {
  const { topic, transcript, proName, conName } = args;
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

    // 2) AI 판정
    const { text: closingText, aiPick } = await runClosing(ANTHROPIC_API_KEY.value(), {
      topic: String(room.topic ?? ''),
      transcript,
      proName: String(room.proName ?? '찬성'),
      conName: String(room.conName ?? '반대'),
    });

    // 3) 관전자 투표를 서버가 직접 집계
    const votesSnap = await roomRef.collection('votes').get();
    let proCount = 0;
    let conCount = 0;
    votesSnap.forEach((d) => {
      const s = (d.data() as { side?: string }).side;
      if (s === 'pro') proCount++;
      else if (s === 'con') conCount++;
    });
    const totalVotes = proCount + conCount;
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
