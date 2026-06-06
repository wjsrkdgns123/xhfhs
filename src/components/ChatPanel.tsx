import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type CollectionReference,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { ProfileAvatar, type AvatarId } from './common/Avatar';
import { roomStrings } from '../i18n/room';
import type { Lang } from '../i18n/landing';

export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt: number;
  avatarId?: AvatarId | string;
  avatarDataUrl?: string;
}

function formatChatTime(ms: number, amLabel: string, pmLabel: string): string {
  try {
    const d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h < 12 ? amLabel : pmLabel;
    h = h % 12;
    if (h === 0) h = 12;
    return `${ampm} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

interface ChatPanelProps {
  title: string;
  collectionRef: CollectionReference;
  user: User | null;
  myName: string;
  myAvatarId?: AvatarId | string;
  myAvatarDataUrl?: string | null;
  canPost: boolean;
  postDisabledHint?: string;
  emptyHint?: string;
  height?: number;
  pageSize?: number;
  highlightUid?: string | null;
  lang?: Lang;
}

export function ChatPanel({
  title,
  collectionRef,
  user,
  myName,
  myAvatarId,
  myAvatarDataUrl,
  canPost,
  postDisabledHint,
  emptyHint,
  height = 220,
  pageSize = 80,
  highlightUid,
  lang = 'ko',
}: ChatPanelProps) {
  const tChat = roomStrings[lang].chat;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collectionRef,
      orderBy('_ts', 'asc'),
      limitToLast(pageSize),
    );
    return onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) })),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionRef.path, pageSize]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length]);

  const send = async () => {
    if (!user || !canPost) return;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 480) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        name: myName,
        text: trimmed,
        avatarId: myAvatarId ?? 'char1',
        createdAt: Date.now(),
        _ts: serverTimestamp(),
      };
      if (myAvatarDataUrl) payload.avatarDataUrl = myAvatarDataUrl;
      await addDoc(collectionRef, payload);
      setText('');
    } catch (e) {
      console.error('[chat send]', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="card flex flex-col"
      style={{ background: 'var(--color-paper-light)' }}
    >
      <div
        className="px-3 py-2"
        style={{
          borderBottom: '1px solid var(--color-line)',
          fontFamily: 'var(--font-hand)',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--color-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{title}</span>
        <span
          className="text-[11px]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: 'var(--color-ink-fade)',
          }}
        >
          {messages.length}
        </span>
      </div>

      <div
        className="px-3 py-2 overflow-y-auto"
        style={{ height }}
      >
        {messages.length === 0 ? (
          <p
            className="text-sm text-center py-8"
            style={{ color: 'var(--color-ink-fade)' }}
          >
            {emptyHint ?? (lang === 'ko' ? '아직 메시지가 없습니다.' : 'No messages yet.')}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.uid === user?.uid;
            const highlight = highlightUid && m.uid === highlightUid;
            return (
              <div
                key={m.id}
                className="py-1 flex items-start gap-2"
                style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-ink)' }}
              >
                <ProfileAvatar
                  avatarId={m.avatarId as AvatarId | undefined}
                  avatarDataUrl={m.avatarDataUrl}
                  size={22}
                  style={{ marginTop: 1 }}
                />
                <div className="flex-1 min-w-0" style={{ wordBreak: 'keep-all' }}>
                  <span
                    className="font-bold mr-1.5"
                    style={{
                      /* 관전석은 찬/반이 아닌 중립 제3자 — 내 발언·주목 발언엔 진영색(vermillion/celadon)이
                         아니라 중립 강조색 gold를 쓴다. 그래야 찬/반 색 의미가 전 여정에서 흔들리지 않는다. */
                      color: highlight || mine
                        ? 'var(--color-gold)'
                        : 'var(--color-ink-soft)',
                    }}
                  >
                    {m.name}
                    {mine ? tChat.mine : ''}:
                  </span>
                  <span style={{ color: 'var(--color-ink)' }}>{m.text}</span>
                  {m.createdAt > 0 && (
                    <span
                      className="ml-2 text-[10px]"
                      style={{
                        color: 'var(--color-ink-fade)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatChatTime(m.createdAt, tChat.am, tChat.pm)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      <div
        className="px-3 py-2 flex gap-2"
        style={{ borderTop: '1px solid var(--color-line)' }}
      >
        {user && canPost ? (
          <>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              maxLength={480}
              placeholder={tChat.placeholder}
              className="input-paper flex-1"
              style={{ fontSize: 13, padding: '6px 10px' }}
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="btn"
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              {tChat.send}
            </button>
          </>
        ) : (
          <p
            className="text-xs flex-1 text-center py-1"
            style={{ color: 'var(--color-ink-fade)' }}
          >
            {!user ? tChat.loginHint : postDisabledHint ?? tChat.noPermission}
          </p>
        )}
      </div>
    </div>
  );
}
