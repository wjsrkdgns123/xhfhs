export type Side = 'pro' | 'con';
export const AI_OPPONENT_UID = '__AI_OPPONENT__';
export const AI_OPPONENT_NAME = '🤖 AI 토론자';
export type Phase = 'opening' | 'pro_arg' | 'con_arg' | 'pro_rebut' | 'con_rebut';

export interface Room {
  id: string;
  topic: string;
  createdAt: number;
  createdBy: string;
  isPrivate?: boolean;
  proUid: string | null;
  proName: string | null;
  conUid: string | null;
  conName: string | null;
  status: 'open' | 'live' | 'ended';
  phase?: Phase;
  openingPosted?: boolean;
  winner?: Side | 'tie';
  aiPick?: Side | 'tie';
  finalProScore?: number;
  extendRequestPro?: boolean;
  extendRequestCon?: boolean;
  extendRound?: number;
}

export interface Message {
  id: string;
  uid: string;
  name: string;
  side: Side | 'spectator' | 'moderator';
  text: string;
  createdAt: number;
}

export interface Vote {
  uid: string;
  side: Side;
}

export interface UserProfile {
  uid: string;
  nickname: string;
  avatarId?: string;
  avatarDataUrl?: string;
  // Legacy (kept for back-compat, no longer displayed)
  winsAsPro?: number;
  winsAsCon?: number;
  lossesAsPro?: number;
  lossesAsCon?: number;
  ties?: number;
  // New unified stats split by opponent type
  winsVsHuman?: number;
  lossesVsHuman?: number;
  tiesVsHuman?: number;
  winsVsAi?: number;
  lossesVsAi?: number;
  tiesVsAi?: number;
  totalDebates: number;
}

export const EMPTY_PROFILE: Omit<UserProfile, 'uid' | 'nickname'> = {
  winsVsHuman: 0,
  lossesVsHuman: 0,
  tiesVsHuman: 0,
  winsVsAi: 0,
  lossesVsAi: 0,
  tiesVsAi: 0,
  totalDebates: 0,
};

export const PHASE_LABEL: Record<Phase, string> = {
  opening: '개회',
  pro_arg: '찬성 입론',
  con_arg: '반대 입론',
  pro_rebut: '찬성 반박',
  con_rebut: '반대 반박',
};

export const PHASE_SPEAKER: Record<Phase, Side | null> = {
  opening: null,
  pro_arg: 'pro',
  con_arg: 'con',
  pro_rebut: 'pro',
  con_rebut: 'con',
};

export const NEXT_PHASE: Record<Phase, Phase | 'closing'> = {
  opening: 'pro_arg',
  pro_arg: 'con_arg',
  con_arg: 'pro_rebut',
  pro_rebut: 'con_rebut',
  con_rebut: 'closing',
};
