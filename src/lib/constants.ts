// #25 (incremental step 4): App-local constants extracted so the (soon-to-be
// extracted) RoomView/Lobby/Profile views can import them without circular deps.
// (AI_OPPONENT_UID/AI_OPPONENT_NAME and PHASE_* already live in ../types.)

/** Display name for AI moderator messages. */
export const AI_NAME = '🤖 AI 사회자';

/** localStorage key: roomIds whose stats the client already recorded. */
export const STATS_KEY = 'debateBattle:statsRecorded';

/** localStorage key: "auto-tidy" (polish-on-send) preference. */
export const TIDY_KEY = 'debateBattle:autoTidy';
