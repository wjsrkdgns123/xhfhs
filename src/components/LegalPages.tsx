import '../landing.css';
import { useEffect } from 'react';

/**
 * Shared layout for static legal/info pages.
 * Reuses landing.css typography (wrap, section-eyebrow, section-title).
 */
function LegalLayout({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  updated: string;
  children: React.ReactNode;
}) {
  // Push to top on mount
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="landing-page">
      <section style={{ padding: '60px 0 90px' }}>
        <div className="wrap-narrow" style={{ maxWidth: 760 }}>
          <div className="section-eyebrow">{eyebrow}</div>
          <h1
            className="section-title"
            style={{ fontSize: 'clamp(36px, 6vw, 56px)', marginBottom: 12 }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.12em',
              color: 'var(--color-ink-fade)',
              marginBottom: 32,
            }}
          >
            최종 업데이트: {updated}
          </p>
          <div className="legal-body">{children}</div>
        </div>
      </section>
    </div>
  );
}

const CONTACT_EMAIL = 'wjsrkdgns123a@gmail.com';

export function PrivacyView() {
  return (
    <LegalLayout
      eyebrow="PRIVACY · 개인정보처리방침"
      title="개인정보처리방침"
      updated="2026-05-13"
    >
      <p>
        토론배틀(이하 "서비스")은 이용자의 개인정보를 소중하게 다루며, 관련
        법령("개인정보 보호법" 등)을 준수합니다. 본 방침은 서비스를 이용하면서
        제공하시는 정보가 어떻게 수집·이용·보관·파기되는지를 안내합니다.
      </p>

      <h2>1. 수집하는 개인정보 항목 및 수집 방법</h2>
      <p>
        서비스는 Google 계정을 통한 소셜 로그인만 지원하며, 다음 항목을
        수집합니다.
      </p>
      <ul>
        <li>
          <b>필수</b>: Google 계정의 고유 식별자(uid), 표시 이름, 이메일 주소,
          프로필 이미지 URL
        </li>
        <li>
          <b>이용 중 생성</b>: 닉네임, 아바타 이미지, 토론·발언·투표·관전 기록
        </li>
        <li>
          <b>자동 수집</b>: 접속 로그, IP, 브라우저 정보, 쿠키·로컬 스토리지에
          저장되는 화면 설정값
        </li>
      </ul>

      <h2>2. 개인정보의 이용 목적</h2>
      <ul>
        <li>회원 식별, 로그인 유지, 닉네임·전적 표시</li>
        <li>토론방·관전석·로비 채팅 기능 제공</li>
        <li>AI 사회자/토론자 응답 생성 (Anthropic Claude API 호출 시 발언
          텍스트가 전달됩니다)</li>
        <li>서비스 운영 통계, 부정 이용 방지</li>
      </ul>

      <h2>3. 개인정보의 보관 및 파기</h2>
      <ul>
        <li>회원 탈퇴 즉시 이용자 식별 정보는 파기됩니다.</li>
        <li>법령상 보존 의무가 있는 정보는 해당 기간 동안 별도 보관됩니다.</li>
        <li>토론방 데이터는 생성 후 2시간 경과 시 자동 삭제됩니다.</li>
      </ul>

      <h2>4. 개인정보 제3자 제공</h2>
      <p>
        서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않으며, 다음
        예외에만 제공합니다.
      </p>
      <ul>
        <li>이용자가 사전에 동의한 경우</li>
        <li>법령에 따라 수사·재판 목적으로 적법한 요구가 있는 경우</li>
      </ul>

      <h2>5. 처리위탁 (외부 서비스)</h2>
      <p>서비스 운영을 위해 다음 외부 처리자가 일부 정보를 처리합니다.</p>
      <ul>
        <li>
          <b>Google LLC</b> — Firebase Authentication, Firestore, Hosting
          (Cloudflare Pages 경유)
        </li>
        <li>
          <b>Anthropic, PBC</b> — Claude API 호출 (사회자/토론자/마무리 평가
          생성을 위해 토론 발언 내용이 전송됩니다)
        </li>
        <li>
          <b>Cloudflare, Inc.</b> — 호스팅·CDN
        </li>
      </ul>

      <h2>6. 쿠키 및 로컬 스토리지</h2>
      <p>
        서비스는 로그인 상태 유지, 화면 설정 저장 목적으로 쿠키와
        브라우저 로컬 스토리지를 사용합니다. 브라우저 설정으로 이를 거부할 수
        있으나 일부 기능이 제한될 수 있습니다.
      </p>

      <h2>7. 광고 서비스</h2>
      <p>
        서비스는 향후 Google AdSense 광고를 표시할 수 있습니다. Google 및
        파트너는 쿠키를 사용해 이용자의 사이트 방문 정보를 바탕으로 맞춤형
        광고를 제공할 수 있습니다. Google 광고 쿠키 사용 거부는{' '}
        <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
          광고 설정
        </a>{' '}
        페이지에서, 제3자 쿠키 거부는{' '}
        <a href="https://www.aboutads.info" target="_blank" rel="noreferrer">
          www.aboutads.info
        </a>
        에서 가능합니다.
      </p>

      <h2>8. 이용자의 권리</h2>
      <p>
        이용자는 언제든지 본인의 개인정보 열람·수정·삭제·처리 정지를 요구할 수
        있으며, 프로필 페이지에서 닉네임·아바타 수정과 계정 삭제가 가능합니다.
      </p>

      <h2>9. 개인정보 보호 책임자</h2>
      <p>
        문의: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalLayout>
  );
}

export function TermsView() {
  return (
    <LegalLayout
      eyebrow="TERMS · 이용약관"
      title="이용약관"
      updated="2026-05-13"
    >
      <p>
        본 약관은 토론배틀(이하 "서비스")이 제공하는 모든 기능의 이용 조건과
        절차, 회원과 운영자의 권리·의무에 관한 사항을 규정합니다.
      </p>

      <h2>제1조 (목적)</h2>
      <p>
        서비스는 한국어 사용자를 위한 1:1 실시간 토론 플랫폼으로, AI 사회자의
        진행과 관전자 투표를 통해 토론을 운영합니다.
      </p>

      <h2>제2조 (회원가입과 이용 자격)</h2>
      <ul>
        <li>회원가입은 Google 계정 로그인으로 이루어집니다.</li>
        <li>만 14세 미만은 보호자 동의가 필요합니다.</li>
        <li>타인의 정보를 도용해 가입할 수 없습니다.</li>
      </ul>

      <h2>제3조 (서비스 제공 및 변경)</h2>
      <ul>
        <li>서비스는 24시간 제공을 원칙으로 하되, 점검·장애·운영상 필요에
          따라 일부 또는 전체가 중단될 수 있습니다.</li>
        <li>운영자는 서비스의 기능을 사전 고지 없이 추가·변경·중단할 수
          있습니다.</li>
      </ul>

      <h2>제4조 (회원의 의무 — 금지 행위)</h2>
      <p>회원은 다음 행위를 해서는 안 됩니다.</p>
      <ul>
        <li>타인에 대한 인신공격, 혐오 표현, 차별·괴롭힘</li>
        <li>음란물, 폭력적 표현, 자해·자살 조장 콘텐츠</li>
        <li>저작권·초상권 등 타인의 권리를 침해하는 콘텐츠</li>
        <li>광고, 도배, 스팸, 사기·피싱 시도</li>
        <li>서비스의 정상 운영을 방해하는 자동화 행위 (크롤링, DDoS 등)</li>
        <li>법령 위반 행위, 또는 그를 조장하는 콘텐츠</li>
      </ul>

      <h2>제5조 (게시물의 관리)</h2>
      <ul>
        <li>회원이 작성한 발언·채팅의 책임은 작성자 본인에게 있습니다.</li>
        <li>운영자는 제4조 위반 게시물을 사전 고지 없이 삭제하거나 해당 회원의
          이용을 제한할 수 있습니다.</li>
      </ul>

      <h2>제6조 (지적재산권)</h2>
      <ul>
        <li>서비스의 디자인·로고·자료실 콘텐츠 등은 운영자에게 귀속됩니다.</li>
        <li>회원이 작성한 발언은 회원에게 귀속되나, 서비스 운영·홍보·통계
          목적의 비독점적 사용권을 운영자에게 부여합니다.</li>
      </ul>

      <h2>제7조 (책임의 제한)</h2>
      <ul>
        <li>서비스는 무료로 제공되며, 천재지변·외부 서비스(Firebase·Anthropic
          API) 장애 등 운영자의 통제를 벗어난 사유로 인한 손해에 대해
          책임지지 않습니다.</li>
        <li>회원 간 분쟁, 회원의 콘텐츠로 인한 분쟁은 당사자가 해결하며 운영자는
          개입할 의무가 없습니다.</li>
      </ul>

      <h2>제8조 (약관의 변경)</h2>
      <p>
        본 약관은 사전 고지 후 변경될 수 있으며, 변경 후에도 서비스를 계속
        이용하는 것은 변경된 약관에 동의하는 것으로 간주됩니다.
      </p>

      <h2>제9조 (준거법 · 분쟁 해결)</h2>
      <p>
        본 약관은 대한민국 법률에 따르며, 분쟁이 발생할 경우 운영자의 주소지
        관할 법원을 1심 법원으로 합니다.
      </p>

      <h2>제10조 (문의)</h2>
      <p>
        문의: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalLayout>
  );
}

export function AboutView() {
  return (
    <LegalLayout
      eyebrow="ABOUT · 소개"
      title={
        <>
          토론배틀은
          <br />
          <span className="hand">이런 곳입니다.</span>
        </>
      }
      updated="2026-05-13"
    >
      <h2>🎯 무엇인가요?</h2>
      <p>
        토론배틀은 한국어 사용자를 위한 <b>1대1 실시간 토론 플랫폼</b>입니다.
        하나의 주제를 두고 찬성과 반대 두 명이 무대에 올라 입론·반박을 주고
        받고, 관전석에서 청중이 투표하며 AI 사회자가 진행과 정성 평가를
        맡습니다.
      </p>

      <h2>⚖️ 어떻게 운영되나요?</h2>
      <ul>
        <li>
          <b>AI 사회자</b>가 개회·단계 전환·마무리 심사를 자동으로 진행합니다.
          (Anthropic Claude Haiku 4.5 모델 사용)
        </li>
        <li>
          <b>관전자 투표 50% + AI 정성 평가 50%</b>를 합산해 승부를
          결정합니다. 대중성과 논증의 질 양쪽을 모두 고려한 설계입니다.
        </li>
        <li>
          <b>5단계</b>로 끝나는 정형화된 형식: 개회 → 찬성 입론 → 반대 입론 →
          찬성 반박 → 반대 반박 → 마무리 심사.
        </li>
        <li>
          연장 라운드, 비공개방 + 초대 링크, AI 토론자 모드(상대가 없어도
          AI와 진검 승부 가능) 등을 지원합니다.
        </li>
      </ul>

      <h2>📚 콘텐츠 자료실</h2>
      <p>
        토론을 처음 만나는 분, 다시 정리하고 싶은 분을 위해{' '}
        <b>8개 챕터·약 18분 분량</b>의 자료실을 운영합니다. 실무 5대 원칙,
        대표적 토론 형식, 자주 등장하는 논리 오류 10가지, 역사 속 명토론,
        단계별 준비 체크리스트, 공식 평가 기준, 추천 자원·도서까지.
      </p>

      <h2>🛠️ 기술 스택</h2>
      <ul>
        <li>프론트: React 19 + Vite + TypeScript + Tailwind CSS</li>
        <li>백엔드: Cloudflare Pages Functions, Firebase Firestore (실시간
          구독), Firebase Authentication (Google)</li>
        <li>AI: Anthropic Claude Haiku 4.5 (사회자/토론자/마무리 평가)</li>
        <li>배포: Cloudflare Pages</li>
      </ul>

      <h2>📧 문의 · 피드백</h2>
      <p>
        제안·버그 신고·제휴 문의는 언제든{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 으로 보내주세요.
      </p>

      <h2>📜 약속</h2>
      <ul>
        <li>발언 내용은 토론 운영과 AI 응답 생성 목적 외 다른 곳에 활용하지
          않습니다.</li>
        <li>특정 입장을 편들지 않으며, AI 사회자는 절차적 중립을 원칙으로
          합니다.</li>
        <li>회원 데이터는 본인이 삭제 요청할 경우 즉시 파기합니다.</li>
      </ul>
    </LegalLayout>
  );
}

export function ContactView() {
  return (
    <LegalLayout
      eyebrow="CONTACT · 문의"
      title={
        <>
          말씀,
          <br />
          <span className="hand">건네주세요.</span>
        </>
      }
      updated="2026-05-13"
    >
      <h2>📧 이메일</h2>
      <p style={{ fontSize: 19 }}>
        <a href={`mailto:${CONTACT_EMAIL}`}>
          <b>{CONTACT_EMAIL}</b>
        </a>
      </p>
      <p>
        제안, 버그 신고, 콘텐츠 신고, 제휴 문의 모두 위 주소로 보내주시면
        영업일 기준 3일 이내 답변드리도록 노력하겠습니다.
      </p>

      <h2>📝 메일에 포함해주시면 좋은 정보</h2>
      <ul>
        <li>
          <b>버그 신고</b>: 발생한 화면, 어떤 동작을 했을 때, 가능하면 스크린샷
        </li>
        <li>
          <b>콘텐츠 신고</b>: 신고 대상 방·발언·계정, 신고 사유
        </li>
        <li>
          <b>제안</b>: 어떤 상황에서 필요한지, 누구에게 도움이 될지
        </li>
      </ul>

      <h2>⚠️ 콘텐츠 신고 · 권리 침해 신고</h2>
      <p>
        본인의 저작권·초상권·명예가 침해되었다고 판단하시는 게시물이 있다면
        위 이메일로 신고해주세요. 사실 확인 후 즉시 조치합니다.
      </p>

      <h2>🤝 운영</h2>
      <p>
        토론배틀은 개인이 운영하는 사이드 프로젝트입니다. 광고나 마케팅은
        아직 없으며, 받은 메일은 운영자가 직접 확인합니다.
      </p>
    </LegalLayout>
  );
}
