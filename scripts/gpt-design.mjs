#!/usr/bin/env node
/*
 * gpt-design.mjs — 토론배틀 "디자인 담당" GPT 브리지
 * 팀의 디자인 역할(판단 + 실행)을 OpenAI GPT 에 위임한다.
 *   judge : 디자인 판단(색·레이아웃·근거 + 권장 이미지 프롬프트)을 GPT 채팅 모델에게 받음
 *   image : gpt-image-2 으로 실제 이미지를 생성해 design-output/ 에 저장
 * 의존성 없음(Node 18+ 내장 fetch 사용).
 *
 * 사용법:
 *   node scripts/gpt-design.mjs --check
 *       키/모델/기본 화질만 확인 (있으면 exit 0, 없으면 exit 3)
 *   node scripts/gpt-design.mjs verify
 *       설정된 판단/이미지 모델명이 계정에서 실제 쓸 수 있는지 확인 (생성 비용 0, /v1/models 조회)
 *   node scripts/gpt-design.mjs judge <브리프파일|stdin>
 *       디자인 브리프를 GPT에 보내 "디자인 판단"을 받아 stdout 출력
 *   node scripts/gpt-design.mjs vision <이미지.png> "<질문>"
 *       실제 렌더 스크린샷을 GPT(비전)에 보내 디자인 완성도 평가·개선점을 받아 stdout 출력
 *   node scripts/gpt-design.mjs image "<프롬프트>" [옵션]
 *       이미지 생성 → design-output/ 에 PNG 저장, 저장 경로를 stdout 출력
 *       옵션: --quality low|medium|high  (기본 medium, high는 명시 요청 시에만)
 *             --size 1024x1024|1536x1024|1024x1536|auto  (기본 1024x1024)
 *             --out <경로>   (예: public/og-image.png — 확정본을 바로 public 으로)
 *             --n <개수>     (기본 1)
 *
 * 환경변수 (.env 에서도 자동으로 읽음):
 *   OPENAI_API_KEY        필수. platform.openai.com 에서 발급한 sk-... 키
 *   OPENAI_MODEL          선택. 디자인 "판단"용 채팅 모델. 기본 "gpt-5.5"
 *   OPENAI_IMAGE_MODEL    선택. 이미지 모델. 기본 "gpt-image-2"
 *   OPENAI_IMAGE_QUALITY  선택. 기본 화질 "medium". (low|medium|high — high는 명시 요청 시)
 *   OPENAI_IMAGE_SIZE     선택. 기본 크기 "1024x1024"
 *   OPENAI_BASE_URL       선택. 기본 "https://api.openai.com/v1"
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// process.env 우선, 없으면 .env 파일에서 직접 읽기 (node는 --env-file 없이 실행되므로)
function envVal(name) {
  if (process.env[name]) return process.env[name];
  try {
    const txt = readFileSync(resolve(repoRoot, '.env'), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[1] === name) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        return v;
      }
    }
  } catch { /* .env 없으면 무시 */ }
  return undefined;
}

const apiKey = envVal('OPENAI_API_KEY');
const chatModel = envVal('OPENAI_MODEL') || 'gpt-5.5';
const imageModel = envVal('OPENAI_IMAGE_MODEL') || 'gpt-image-2';
const defaultQuality = (envVal('OPENAI_IMAGE_QUALITY') || 'medium').toLowerCase();
const defaultSize = envVal('OPENAI_IMAGE_SIZE') || '1024x1024';
const baseUrl = (envVal('OPENAI_BASE_URL') || 'https://api.openai.com/v1').replace(/\/+$/, '');

const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(name);
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return fallback;
}

// --check: 키 존재만 확인 (명령이 자동/수동 모드를 가르는 데 사용)
if (args.includes('--check')) {
  if (apiKey) {
    console.log(`OPENAI_KEY_OK chat=${chatModel} image=${imageModel} quality=${defaultQuality}`);
    process.exit(0);
  }
  console.log('OPENAI_KEY_MISSING');
  process.exit(3);
}

if (!apiKey) {
  console.error('OPENAI_API_KEY 없음 — .env 에 OPENAI_API_KEY=sk-... 추가 후 다시 시도하세요. (판단은 수동 복붙 모드로 대체 가능하지만, 이미지 생성은 키가 반드시 필요합니다.)');
  process.exit(3);
}

// 디자이너 역할·행동지침은 scripts/gpt-designer.md 에서 읽는다(토론배틀 브랜드/디자인 시스템 포함).
const DEFAULT_SYSTEM = [
  '당신은 토론배틀(한국어 1:1 실시간 토론 사이트)의 전속 시니어 프로덕트 디자이너입니다.',
  '디자인 판단(색·여백·타이포·레이아웃·톤)과 실행(이미지 생성 프롬프트 작성)을 주도합니다.',
  '브랜드 톤은 newspaper/editorial(종이·잉크). 한국어로, 비개발자도 이해하게 보고하세요.',
  '항상: 1) 디자인 판단(무엇을 왜), 2) 구체 스펙(가능하면 CSS), 3) 이미지가 필요하면 영어 image 프롬프트 + 권장 quality(기본 medium)·size, 4) 적용할 파일 추천.',
].join('\n');

function loadSystem() {
  try {
    const txt = readFileSync(resolve(repoRoot, 'scripts/gpt-designer.md'), 'utf8').trim();
    if (txt) return txt;
  } catch { /* 파일 없으면 기본값 사용 */ }
  return DEFAULT_SYSTEM;
}

async function readStdinOrFile(rest) {
  const fileArg = rest.find((a) => !a.startsWith('--'));
  if (fileArg) {
    // 읽히는 파일이면 파일 내용, 아니면 인라인 브리프 문자열로 간주.
    // (judge "<한글 질문>" 처럼 질문을 직접 인자로 넘기는 사용을 지원 — 파일경로 오인 버그 수정)
    try { return readFileSync(resolve(fileArg), 'utf8'); }
    catch { return rest.filter((a) => !a.startsWith('--')).join(' '); }
  }
  if (process.stdin.isTTY) {
    console.error('내용이 없습니다. 파일 경로를 인자로 주거나 stdin으로 파이프하세요.');
    process.exit(1);
  }
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

async function handleHttpError(res) {
  const body = await res.text().catch(() => '');
  let hint = '';
  if (res.status === 401) hint = ' → API 키가 잘못됐거나 비활성입니다.';
  else if (res.status === 429) hint = ' → 사용량 한도 초과이거나 크레딧 부족(결제수단 미등록)일 수 있습니다.';
  else if (res.status === 404) hint = ' → 모델을 못 찾습니다. .env 의 OPENAI_MODEL / OPENAI_IMAGE_MODEL 을 계정에서 쓸 수 있는 모델명으로 바꾸세요.';
  else if (res.status === 400) hint = ' → 요청 파라미터(size·quality·model) 문제일 수 있습니다.';
  console.error(`OpenAI 오류 ${res.status}${hint}\n${body.slice(0, 700)}`);
  process.exit(1);
}

async function runJudge(rest) {
  const brief = (await readStdinOrFile(rest)).trim();
  if (!brief) { console.error('브리프가 비어 있습니다.'); process.exit(1); }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        { role: 'system', content: loadSystem() },
        { role: 'user', content: brief },
      ],
      // temperature 미지정 — gpt-5.x 등 일부 모델은 기본값(1)만 허용하므로 보내지 않는다.
    }),
  });
  if (!res.ok) return handleHttpError(res);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) { console.error('GPT 응답이 비어 있습니다.'); process.exit(1); }
  process.stdout.write(text);
}

// vision: 실제 렌더 스크린샷(PNG)을 비전 모델에 보내 디자인 완성도를 평가받는다.
async function runVision(rest) {
  const nonFlags = rest.filter((a) => !a.startsWith('--'));
  const imgPath = nonFlags[0];
  if (!imgPath) {
    console.error('이미지 경로가 없습니다. 예: node scripts/gpt-design.mjs vision design-output/shots/landing.desktop.png "이 화면의 디자인 완성도를 평가해줘"');
    process.exit(1);
  }
  const question = nonFlags.slice(1).join(' ').trim()
    || '이 화면을 토론배틀 정본(newspaper/editorial · 종이·잉크 톤)으로 평가하라. 시각 위계·여백 리듬·타이포 스케일·컴포넌트 일관성·신문 강조(진영색/도장/eyebrow) 절제를 기준으로, 구체적 개선점을 우선순위로 제시하라. 폐기 어휘(점선·먹색 하드오프셋·네온·글래스모피즘)가 보이면 지적하라.';
  let buf;
  try { buf = readFileSync(resolve(imgPath)); }
  catch { console.error('이미지를 읽을 수 없습니다: ' + imgPath); process.exit(1); }
  const ext = (imgPath.match(/\.([a-z0-9]+)$/i)?.[1] || 'png').toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        { role: 'system', content: loadSystem() },
        { role: 'user', content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${buf.toString('base64')}` } },
        ] },
      ],
    }),
  });
  if (!res.ok) return handleHttpError(res);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) { console.error('GPT 비전 응답이 비어 있습니다. (모델이 이미지 입력을 지원하는지 확인하세요.)'); process.exit(1); }
  process.stdout.write(text);
}

const VALID_QUALITY = new Set(['low', 'medium', 'high', 'auto']);

async function runImage(rest) {
  const prompt = rest.find((a) => !a.startsWith('--'));
  if (!prompt) {
    console.error('이미지 프롬프트가 없습니다. 예: node scripts/gpt-design.mjs image "editorial poster, paper & ink, vermillion accent"');
    process.exit(1);
  }
  let quality = (flag('--quality', defaultQuality) || 'medium').toLowerCase();
  if (!VALID_QUALITY.has(quality)) quality = 'medium';
  const size = flag('--size', defaultSize);
  const n = Math.max(1, parseInt(flag('--n', '1'), 10) || 1);
  const outArg = flag('--out', null);

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: imageModel, prompt, size, quality, n }),
  });
  if (!res.ok) return handleHttpError(res);
  const data = await res.json();
  const items = data?.data ?? [];
  if (!items.length) { console.error('이미지 응답이 비어 있습니다.'); process.exit(1); }

  const outDir = resolve(repoRoot, 'design-output');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const saved = [];
  items.forEach((it, idx) => {
    const b64 = it.b64_json;
    if (!b64) return;
    let outPath;
    if (outArg) {
      outPath = resolve(repoRoot, outArg);
      if (items.length > 1) outPath = outPath.replace(/(\.[^.]+)?$/, `-${idx + 1}$1`);
    } else {
      outPath = resolve(outDir, `gpt-${stamp}-${idx + 1}.png`);
    }
    const dir = dirname(outPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(outPath, Buffer.from(b64, 'base64'));
    saved.push(outPath);
  });

  if (!saved.length) { console.error('이미지 데이터(b64_json)가 비어 있습니다. (gpt-image 계열 모델인지 확인하세요.)'); process.exit(1); }
  console.log(`IMAGE_OK model=${imageModel} quality=${quality} size=${size} count=${saved.length}`);
  saved.forEach((p) => console.log(p));
}

// verify: 설정된 모델명이 계정에서 실제 존재/접근 가능한지 확인 (이미지 생성 비용 없음)
async function runVerify() {
  const targets = [['판단(chat)', chatModel], ['이미지(image)', imageModel]];
  let allOk = true;
  for (const [label, id] of targets) {
    const res = await fetch(`${baseUrl}/models/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      console.log(`OK    ${label}: "${id}" — 사용 가능`);
    } else {
      allOk = false;
      const body = await res.text().catch(() => '');
      const why = res.status === 404 ? '계정에서 찾을 수 없는 모델명(이름이 틀렸거나 권한 없음)' : `오류 ${res.status}`;
      console.log(`FAIL  ${label}: "${id}" — ${why}`);
      if (body) console.log('      ' + body.replace(/\s+/g, ' ').slice(0, 220));
    }
  }
  console.log(allOk ? '→ 두 모델 모두 OK. 이제 image/judge 를 써도 됩니다.' : '→ 실패한 모델명을 .env(OPENAI_MODEL / OPENAI_IMAGE_MODEL)에서 고치세요.');
  process.exit(allOk ? 0 : 4);
}

const mode = args[0];
const rest = args.slice(1);
try {
  if (mode === 'judge') await runJudge(rest);
  else if (mode === 'image') await runImage(rest);
  else if (mode === 'vision') await runVision(rest);
  else if (mode === 'verify') await runVerify();
  else {
    console.error('모드를 지정하세요: judge | vision | image | verify | --check\n예) node scripts/gpt-design.mjs verify\n    node scripts/gpt-design.mjs judge brief.txt\n    node scripts/gpt-design.mjs vision shot.png "평가해줘"\n    node scripts/gpt-design.mjs image "..." --quality medium');
    process.exit(1);
  }
} catch (e) {
  console.error('OpenAI 호출 실패: ' + (e?.message || String(e)));
  process.exit(1);
}
