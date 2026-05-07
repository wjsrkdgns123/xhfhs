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

export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt: number;
}

interface ChatPanelProps {
  title: string;
  collectionRef: CollectionReference;
  user: User | null;
  myName: string;
  canPost: boolean;
  postDisabledHint?: string;
  emptyHint?: string;
  height?: number;
  pageSize?: number;
  highlightUid?: string | null;
}

export function ChatPanel({
  title,
  collectionRef,
  user,
  myName,
  canPost,
  postDisabledHint,
  emptyHint = '아직 메시지가 없습니다.',
  height = 220,
  pageSize = 80,
  highlightUid,
}: ChatPanelProps) {
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
      await addDoc(collectionRef, {
        uid: user.uid,
        name: myName,
        text: trimmed,
        createdAt: Date.now(),
        _ts: serverTimestamp(),
      });
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
          borderBottom: '1.5px solid var(--color-ink)',
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
          className="text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
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
            {emptyHint}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.uid === user?.uid;
            const highlight = highlightUid && m.uid === highlightUid;
            return (
              <div
                key={m.id}
                className="py-1"
                style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--color-ink)' }}
              >
                <span
                  className="font-bold mr-1.5"
                  style={{
                    color: highlight
                      ? 'var(--color-vermillion)'
                      : mine
                        ? 'var(--color-celadon)'
                        : 'var(--color-ink-soft)',
                  }}
                >
                  {m.name}
                  {mine ? ' (나)' : ''}:
                </span>
                <span style={{ color: 'var(--color-ink)' }}>{m.text}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      <div
        className="px-3 py-2 flex gap-2"
        style={{ borderTop: '1.5px solid var(--color-ink)' }}
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
              placeholder="채팅 입력… (Enter로 전송)"
              className="input-paper flex-1"
              style={{ fontSize: 13, padding: '6px 10px' }}
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="btn"
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              전송
            </button>
          </>
        ) : (
          <p
            className="text-xs flex-1 text-center py-1"
            style={{ color: 'var(--color-ink-fade)' }}
          >
            {!user ? 'Google 로그인 후 참여 가능' : postDisabledHint ?? '발언 권한 없음'}
          </p>
        )}
      </div>
    </div>
  );
}
