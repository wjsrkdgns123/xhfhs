// 토론 승부 계산 — 순수 함수로 분리해 테스트로 고정한다. (#23 #26)
// ⚠️ 서버 권위 계산(cloud-functions/src/index.ts closeDebate)에 동일 로직이 있다.
//    둘 중 하나를 바꾸면 반드시 함께 맞출 것 (클라 폴백 결과 == 서버 결과).

export type Side = 'pro' | 'con';
export type Verdict = Side | 'tie';

const VERDICT_RE = /<verdict>\s*(pro|con|tie)\s*<\/verdict>/i;

/**
 * AI 마무리 텍스트에서 <verdict> 태그 파싱. (#26)
 * matched=false 면 태그가 없어 기본값('tie')으로 폴백한 것 — "진짜 무승부"와 구분 가능.
 */
export function parseAiPick(text: string): { pick: Verdict; matched: boolean } {
  const m = text.match(VERDICT_RE);
  if (!m) return { pick: 'tie', matched: false };
  return { pick: m[1].toLowerCase() as Verdict, matched: true };
}

/** AI 텍스트에서 verdict 태그를 제거한 본문 */
export function stripVerdictTag(text: string): string {
  return text.replace(/<verdict>.*?<\/verdict>/gi, '').trim();
}

/**
 * 관전자 투표 50% + AI 판정 50% 합산 → 승부.
 * 관전자가 없으면 audience 0.5(중립)로 폴백 → 사실상 AI 단독 판정 (#33).
 * epsilon(0.01) 안쪽이면 무승부.
 */
export function computeOutcome(
  proCount: number,
  conCount: number,
  aiPick: Verdict,
): { winner: Verdict; finalProScore: number; proScore: number } {
  const total = proCount + conCount;
  const audienceProShare = total > 0 ? proCount / total : 0.5;
  const aiProShare = aiPick === 'pro' ? 1 : aiPick === 'con' ? 0 : 0.5;
  const proScore = audienceProShare * 0.5 + aiProShare * 0.5;
  const epsilon = 0.01;
  const winner: Verdict =
    proScore > 0.5 + epsilon ? 'pro' : proScore < 0.5 - epsilon ? 'con' : 'tie';
  return { winner, finalProScore: Math.round(proScore * 100), proScore };
}
