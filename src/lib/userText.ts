// #25 (incremental step 2): pure helpers extracted from App.tsx.
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';

/** Display name: nickname > Google display name > '익명'. */
export function displayNameOf(profile: UserProfile | null, user: User | null): string {
  return profile?.nickname?.trim() || user?.displayName || '익명';
}

/** Resize an image File to a JPEG data URL (cream background), capped at maxSize px. */
export function resizeImageToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 디코드 실패'));
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const scale = Math.min(1, maxSize / Math.max(w, h));
        const tw = Math.max(1, Math.round(w * scale));
        const th = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 사용 불가'));
          return;
        }
        ctx.fillStyle = '#fcf6e8';
        ctx.fillRect(0, 0, tw, th);
        ctx.drawImage(img, 0, 0, tw, th);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
