import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db, firebaseConfigured } from '../firebase';

export interface LivePresence {
  liveCount: number;
  openCount: number;
  ready: boolean;
}

/**
 * Lightweight presence read for the landing page.
 * Subscribes to /rooms with status in ('live','open') and bounds the read at 100
 * so unauthenticated visitors don't pay for huge result sets. The cleanup runs
 * on unmount so navigating away from landing tears down the listener.
 */
export function useLivePresence(): LivePresence {
  const [liveCount, setLiveCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured || !db) {
      setReady(true);
      return;
    }
    const q = query(
      collection(db, 'rooms'),
      where('status', 'in', ['live', 'open']),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        let live = 0;
        let open = 0;
        snap.forEach((d) => {
          const status = d.get('status') as string | undefined;
          if (status === 'live') live += 1;
          else if (status === 'open') open += 1;
        });
        setLiveCount(live);
        setOpenCount(open);
        setReady(true);
      },
      () => {
        setReady(true);
      },
    );
    return () => unsub();
  }, []);

  return { liveCount, openCount, ready };
}
