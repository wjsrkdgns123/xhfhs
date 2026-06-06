import '../landing.css';
import '../about.css';
import { useEffect } from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { Lang } from '../i18n/landing';

/**
 * Shared layout for static legal/info pages.
 * Reuses landing.css typography (wrap, section-eyebrow, section-title).
 */
function LegalLayout({
  eyebrow,
  title,
  updated,
  children,
  lang = 'ko',
}: {
  eyebrow: string;
  title: React.ReactNode;
  updated: string;
  children: React.ReactNode;
  lang?: Lang;
}) {
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
          <p className="legal-updated">
            {lang === 'en' ? 'Last updated' : '최종 업데이트'}: {updated}
          </p>
          <div className="legal-body">{children}</div>
        </div>
      </section>
    </div>
  );
}

const CONTACT_EMAIL = 'wjsrkdgns123a@gmail.com';

export function PrivacyView({ lang = 'ko' }: { lang?: Lang } = {}) {
  useDocumentMeta(
    lang === 'en' ? 'Privacy Policy — DebateBattle' : '개인정보처리방침 — 토론배틀',
    lang === 'en'
      ? 'How DebateBattle collects, uses, stores, and disposes of user personal information.'
      : '토론배틀이 이용자의 개인정보를 어떻게 수집·이용·보관·파기하는지 안내합니다.',
  );
  if (lang === 'en') {
    return (
      <LegalLayout
        eyebrow="PRIVACY · 개인정보처리방침"
        title="Privacy Policy"
        updated="2026-05-13"
        lang={lang}
      >
        <p>
          DebateBattle ("the Service") treats your personal information with care and complies
          with applicable laws (including the Korean Personal Information Protection Act). This
          policy explains what we collect, how we use it, how long we keep it, and how we dispose
          of it.
        </p>

        <h2>1. Information we collect</h2>
        <p>The Service only supports social login via Google and collects the following:</p>
        <ul>
          <li><b>Required</b>: Google account unique ID (uid), display name, email, profile image URL</li>
          <li><b>Generated through use</b>: nickname, avatar image, debate / speech / vote / spectator records</li>
          <li><b>Automatic</b>: access logs, IP, browser info, screen preferences stored in cookies and localStorage</li>
        </ul>

        <h2>2. Purpose of use</h2>
        <ul>
          <li>Member identification, session persistence, displaying nickname and record</li>
          <li>Debate rooms, spectator stands, lobby chat</li>
          <li>AI moderator / debater generation (speech text is sent to the Anthropic Claude API)</li>
          <li>Service operation analytics and abuse prevention</li>
        </ul>

        <h2>3. Retention and disposal</h2>
        <ul>
          <li>Member identifiers are deleted immediately upon account deletion.</li>
          <li>Information required to be retained by law is stored separately for the legally mandated period.</li>
          <li>Debate room data is automatically deleted 2 hours after creation.</li>
        </ul>

        <h2>4. Third-party sharing</h2>
        <p>The Service does not share your personal information with outside parties, except:</p>
        <ul>
          <li>When you have given prior consent</li>
          <li>When required for investigations or trials under applicable law</li>
        </ul>

        <h2>5. Processing entrusted to external services</h2>
        <p>The following external processors handle a portion of your data on our behalf:</p>
        <ul>
          <li><b>Google LLC</b> — Firebase Authentication, Firestore, Hosting (via Cloudflare Pages)</li>
          <li><b>Anthropic, PBC</b> — Claude API (debate speech content is sent for moderator / debater / final evaluation generation)</li>
          <li><b>Cloudflare, Inc.</b> — hosting / CDN</li>
        </ul>

        <h2>6. Cookies and local storage</h2>
        <p>
          The Service uses cookies and browser localStorage to keep you signed in and save screen
          preferences. You may opt out via your browser settings, though some features may not
          work as expected.
        </p>

        <h2>7. Advertising</h2>
        <p>
          The Service may display Google AdSense ads in the future. Google and its partners may
          use cookies to serve personalized ads based on visit history. Opt out of personalized
          Google ads at{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            Google Ad Settings
          </a>{' '}
          or refuse third-party cookies at{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noreferrer">
            aboutads.info
          </a>.
        </p>

        <h2>8. Your rights</h2>
        <p>
          You may request access, correction, deletion, or processing suspension of your personal
          information at any time. Nickname / avatar edits and account deletion are available on
          the profile page.
        </p>

        <h2>9. Data protection officer</h2>
        <p>
          Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalLayout>
    );
  }
  return (
    <LegalLayout
      eyebrow="PRIVACY · 개인정보처리방침"
      title="개인정보처리방침"
      updated="2026-05-13"
      lang={lang}
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

export function TermsView({ lang = 'ko' }: { lang?: Lang } = {}) {
  useDocumentMeta(
    lang === 'en' ? 'Terms of Service — DebateBattle' : '이용약관 — 토론배틀',
    lang === 'en'
      ? 'Terms governing the use of DebateBattle and the rights and obligations of users and the operator.'
      : '토론배틀 서비스의 이용 조건, 회원과 운영자의 권리·의무를 규정한 약관.',
  );
  if (lang === 'en') {
    return (
      <LegalLayout
        eyebrow="TERMS · 이용약관"
        title="Terms of Service"
        updated="2026-05-13"
        lang={lang}
      >
        <p>
          These terms govern the use of all features provided by DebateBattle ("the Service"), and
          the rights and obligations of members and the operator.
        </p>

        <h2>Article 1 (Purpose)</h2>
        <p>
          The Service is a real-time 1v1 debate platform for Korean-speaking users, operating
          through AI-moderated proceedings and audience voting.
        </p>

        <h2>Article 2 (Membership and eligibility)</h2>
        <ul>
          <li>Membership is created by signing in with a Google account.</li>
          <li>Users under 14 years of age require parental consent.</li>
          <li>You may not register using someone else's information.</li>
        </ul>

        <h2>Article 3 (Service availability and changes)</h2>
        <ul>
          <li>The Service is provided 24/7 in principle but may be partially or fully suspended for maintenance, incidents, or operational reasons.</li>
          <li>The operator may add, change, or discontinue features without prior notice.</li>
        </ul>

        <h2>Article 4 (User obligations — prohibited conduct)</h2>
        <p>Members must not engage in the following:</p>
        <ul>
          <li>Personal attacks, hate speech, discrimination, or harassment</li>
          <li>Sexually explicit content, violence, or content promoting self-harm or suicide</li>
          <li>Content that infringes copyright, image rights, or other rights of others</li>
          <li>Advertising, flooding, spam, fraud, or phishing</li>
          <li>Automated activity that disrupts the Service (scraping, DDoS, etc.)</li>
          <li>Illegal acts or content promoting them</li>
        </ul>

        <h2>Article 5 (Posted content)</h2>
        <ul>
          <li>Members are solely responsible for their own speech and chat content.</li>
          <li>The operator may delete content that violates Article 4 or restrict the responsible member without prior notice.</li>
        </ul>

        <h2>Article 6 (Intellectual property)</h2>
        <ul>
          <li>The Service's design, logos, and library content belong to the operator.</li>
          <li>Speech authored by members belongs to the member, but the member grants the operator a non-exclusive license for operational, promotional, and statistical use.</li>
        </ul>

        <h2>Article 7 (Limitation of liability)</h2>
        <ul>
          <li>The Service is provided free of charge. The operator is not liable for damages caused by force majeure or third-party service outages (e.g. Firebase, Anthropic API).</li>
          <li>Disputes between members or disputes arising from member-authored content are to be resolved by the parties involved; the operator has no obligation to intervene.</li>
        </ul>

        <h2>Article 8 (Amendment of terms)</h2>
        <p>
          These terms may be amended with prior notice. Continued use of the Service after an
          amendment constitutes agreement to the amended terms.
        </p>

        <h2>Article 9 (Governing law and dispute resolution)</h2>
        <p>
          These terms are governed by the laws of the Republic of Korea. Disputes shall be heard
          first by the court with jurisdiction over the operator's residence.
        </p>

        <h2>Article 10 (Contact)</h2>
        <p>
          Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalLayout>
    );
  }
  return (
    <LegalLayout
      eyebrow="TERMS · 이용약관"
      title="이용약관"
      updated="2026-05-13"
      lang={lang}
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

export function AboutView({ lang = 'ko' }: { lang?: Lang } = {}) {
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  useDocumentMeta(
    lang === 'en' ? 'About — DebateBattle' : '소개 — 토론배틀',
    lang === 'en'
      ? 'DebateBattle is a 1v1 real-time Korean debate platform judged by 50% audience vote and 50% AI qualitative evaluation.'
      : '토론배틀은 청중 투표 50%와 AI 정성 평가 50%로 승부를 판정하는 한국어 1:1 실시간 토론 플랫폼입니다.',
  );

  const isKo = lang !== 'en';

  const rounds = isKo
    ? [
        ['00', '개회', 'AI 사회자가 주제와 규칙을 정리합니다.'],
        ['01', '찬성 입론', '찬성 측이 핵심 주장과 근거를 제시합니다.'],
        ['02', '반대 입론', '반대 측이 반대 논리와 대안을 제시합니다.'],
        ['03', '찬성 반박', '찬성 측이 상대 논리의 약점을 짚습니다.'],
        ['04', '반대 반박', '반대 측이 재반박하고 쟁점을 좁힙니다.'],
        ['05', '마무리', '양측의 최종 발언 후 판정으로 이동합니다.'],
      ]
    : [
        ['00', 'Opening', 'The AI moderator frames the motion and rules.'],
        ['01', 'Affirmative Case', 'The affirmative side presents claims and evidence.'],
        ['02', 'Negative Case', 'The negative side presents objections and alternatives.'],
        ['03', 'Affirmative Rebuttal', 'The affirmative side challenges weak points.'],
        ['04', 'Negative Rebuttal', 'The negative side responds and narrows the issues.'],
        ['05', 'Closing', 'Both sides conclude before the final decision.'],
      ];

  const library = isKo
    ? ['논리 오류', '토론 형식', '명토론 분석', '준비 체크리스트', '평가 기준', '실전 복습']
    : ['Logical fallacies', 'Debate formats', 'Classic debates', 'Preparation checklist', 'Evaluation criteria', 'Practice review'];

  const tech = [
    'React 19 + Vite + TypeScript',
    'Tailwind CSS',
    'Cloudflare Pages Functions',
    'Firebase Firestore + Auth',
    'Anthropic Claude Haiku 4.5',
  ];

  const pledge = isKo
    ? [
        '발언 내용은 다른 용도로 사용하지 않습니다.',
        'AI 사회자는 절차적 중립을 지키도록 설계합니다.',
        '필요 없는 데이터는 즉시 파기하는 방향을 원칙으로 합니다.',
      ]
    : [
        'Debate content is not used for unrelated purposes.',
        'The AI moderator is designed to maintain procedural neutrality.',
        'Unneeded data is handled with immediate deletion as the guiding principle.',
      ];

  return (
    <main className="about-page" id="main">
      {/* ===== Hero ===== */}
      <section className="about-hero">
        <div className="wrap about-hero__inner">
          <div className="about-hero__copy">
            <p className="about-eyebrow">EDITORIAL DEBATE LEAGUE</p>
            <h1 className="about-title serif-display">
              {isKo ? (
                <>한국어 실시간<br />토론을 하나의<br />지적 리그로.</>
              ) : (
                <>Korean real-time<br />debate, designed as<br />an intellectual league.</>
              )}
            </h1>
            <p className="about-lede">
              {isKo
                ? '토론배틀은 찬성 한 명과 반대 한 명이 실시간으로 맞붙고, 관전석 청중과 AI 사회자가 함께 승부를 판정하는 1:1 토론 플랫폼입니다.'
                : 'DebateBattle is a real-time 1:1 debate platform where one affirmative and one negative speaker compete while the audience and an AI moderator help decide the result.'}
            </p>
            <div
              className="about-hero__actions"
              aria-label={isKo ? '소개 페이지 주요 링크' : 'About page links'}
            >
              <a className="about-button about-button--primary" href="/">
                {isKo ? '토론 시작하기' : 'Start debating'}
              </a>
              <a className="about-button about-button--secondary" href="/learn">
                {isKo ? '자료실 보기' : 'Explore library'}
              </a>
            </div>
          </div>

          {/* 50/50 스코어카드 */}
          <aside
            className="about-scorecard"
            aria-label={isKo ? '50 대 50 판정 시스템' : '50 50 judging system'}
          >
            <div className="about-scorecard__stamp">
              {isKo ? '판정 방식' : 'Judging'}
            </div>
            <p className="about-scorecard__label">FINAL DECISION</p>
            <div className="about-score-split">
              <div className="about-score-split__item about-score-split__item--audience">
                <strong>50%</strong>
                <span>{isKo ? '청중 투표' : 'Audience vote'}</span>
              </div>
              <div className="about-score-split__divider" aria-hidden="true" />
              <div className="about-score-split__item about-score-split__item--ai">
                <strong>50%</strong>
                <span>{isKo ? 'AI 정성 평가' : 'AI qualitative'}</span>
              </div>
            </div>
            <p className="about-scorecard__note">
              {isKo
                ? '인기만으로도, 기계 점수만으로도 끝나지 않습니다. 설득력과 토론 품질을 함께 봅니다.'
                : 'The result is not decided by popularity alone or machine scoring alone. Persuasion and debate quality are judged together.'}
            </p>
          </aside>
        </div>
      </section>

      {/* ===== 50/50 차별점 ===== */}
      <section className="about-section about-section--split">
        <div className="wrap about-split">
          <div>
            <p className="about-eyebrow">WHY IT IS DIFFERENT</p>
            <h2 className="about-section-title serif-display">
              {isKo
                ? '승패보다 중요한 것은 판정의 이유입니다.'
                : 'The reason behind the decision matters more than the result.'}
            </h2>
          </div>
          <div className="about-feature-grid">
            <article className="about-card">
              <span className="about-card__tag">{isKo ? '청중' : 'Audience'}</span>
              <h3>{isKo ? '실시간 관전석 투표' : 'Live spectator voting'}</h3>
              <p>
                {isKo
                  ? '관전자는 토론 흐름을 보며 더 설득력 있는 쪽에 투표합니다.'
                  : 'Spectators vote for the side they find more persuasive during the debate.'}
              </p>
            </article>
            <article className="about-card">
              <span className="about-card__tag">AI</span>
              <h3>{isKo ? '근거·반박·일관성 평가' : 'Evidence, rebuttal, consistency'}</h3>
              <p>
                {isKo
                  ? 'AI 사회자는 절차적 중립을 지키며 발언의 품질을 정성적으로 분석합니다.'
                  : 'The AI moderator stays procedurally neutral and reviews the quality of arguments.'}
              </p>
            </article>
            <article className="about-card">
              <span className="about-card__tag">{isKo ? '결과' : 'Result'}</span>
              <h3>{isKo ? '학습 리포트형 결과' : 'A result you can learn from'}</h3>
              <p>
                {isKo
                  ? '승패만 남기지 않고, 다음 토론에서 개선할 지점을 확인할 수 있게 설계합니다.'
                  : 'The outcome is designed to show what can be improved in the next debate.'}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ===== 라운드 타임라인 ===== */}
      <section className="about-section">
        <div className="wrap">
          <div className="about-section-head">
            <p className="about-eyebrow">ROUND BOARD</p>
            <h2 className="about-section-title serif-display">
              {isKo
                ? '개회 + 5라운드로 토론이 진행됩니다.'
                : 'Debates run through an opening and five rounds.'}
            </h2>
            <p className="about-section-desc">
              {isKo
                ? '각 라운드는 신문 스탬프처럼 기록되고, 필요한 경우 연장 라운드로 더 깊게 이어갈 수 있습니다.'
                : 'Each round is recorded like an editorial stamp, and extension rounds can continue the clash when needed.'}
            </p>
          </div>
          <ol
            className="about-timeline"
            aria-label={isKo ? '토론 진행 순서' : 'Debate flow'}
          >
            {rounds.map(([num, title, desc]) => (
              <li className="about-step" key={num}>
                <span className="about-step__num">{num}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </li>
            ))}
          </ol>
          <div className="about-note-grid">
            <div className="about-note">
              <strong>{isKo ? '연장 라운드' : 'Extension rounds'}</strong>
              <span>
                {isKo
                  ? '쟁점이 남으면 추가 반박으로 이어갑니다.'
                  : 'If key issues remain, additional rebuttals continue.'}
              </span>
            </div>
            <div className="about-note">
              <strong>{isKo ? '비공개방 + 초대 링크' : 'Private rooms + invite links'}</strong>
              <span>
                {isKo
                  ? '친구나 수업 참여자만 들어오는 토론방을 만들 수 있습니다.'
                  : 'Create invite-only rooms for friends or classes.'}
              </span>
            </div>
            <div className="about-note">
              <strong>{isKo ? 'AI 토론자 모드' : 'AI debater mode'}</strong>
              <span>
                {isKo
                  ? '상대가 없을 때도 AI와 연습 토론을 진행할 수 있습니다.'
                  : 'Practice against an AI debater when no human opponent is available.'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 자료실 ===== */}
      <section className="about-section about-section--library">
        <div className="wrap about-library">
          <div>
            <p className="about-eyebrow">LEARNING LIBRARY</p>
            <h2 className="about-section-title serif-display">
              {isKo
                ? '18분 안에 토론의 기본기를 훑습니다.'
                : 'Learn the debate basics in about 18 minutes.'}
            </h2>
            <p className="about-section-desc">
              {isKo
                ? '자료실은 8챕터로 구성되어 있으며, 논리 오류부터 평가 기준까지 실전 토론에 필요한 내용을 빠르게 정리합니다.'
                : 'The library contains eight chapters covering practical debate skills from logical fallacies to evaluation criteria.'}
            </p>
          </div>
          <div className="about-library__panel">
            <div className="about-library__stat">
              <strong>8</strong>
              <span>{isKo ? '챕터' : 'chapters'}</span>
            </div>
            <div className="about-library__stat">
              <strong>18</strong>
              <span>{isKo ? '분 내외' : 'min approx.'}</span>
            </div>
            <ul
              className="about-chip-list"
              aria-label={isKo ? '자료실 주제 목록' : 'Library topics'}
            >
              {library.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== 기술 스택 / 약속 ===== */}
      <section className="about-section">
        <div className="wrap about-two-column">
          <article className="about-ledger">
            <p className="about-eyebrow">TECH STACK</p>
            <h2 className="about-section-title serif-display">
              {isKo
                ? '가볍고 빠른 실시간 토론을 위해 만들었습니다.'
                : 'Built for fast, lightweight real-time debate.'}
            </h2>
            <ul className="about-ledger-list" aria-label={isKo ? '기술 스택 목록' : 'Tech stack list'}>
              {tech.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="about-pledge">
            <p className="about-eyebrow">OUR PROMISE</p>
            <h2 className="about-section-title serif-display">
              {isKo
                ? '토론은 안전해야 더 날카로워집니다.'
                : 'Debate gets sharper when it feels safe.'}
            </h2>
            <ul className="about-pledge-list" aria-label={isKo ? '약속 목록' : 'Our promises'}>
              {pledge.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ===== 문의 ===== */}
      <section className="about-contact">
        <div className="wrap about-contact__inner">
          <p className="about-eyebrow">CONTACT</p>
          <h2 className="about-section-title serif-display">
            {isKo
              ? '제안, 문의, 협업은 언제든 환영합니다.'
              : 'Questions, suggestions, and collaboration are welcome.'}
          </h2>
          <a className="about-mail" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </section>
    </main>
  );
}

export function ContactView({ lang = 'ko' }: { lang?: Lang } = {}) {
  useDocumentMeta(
    lang === 'en' ? 'Contact — DebateBattle' : '문의 — 토론배틀',
    lang === 'en'
      ? 'How to send suggestions, bug reports, content reports, or partnerships to the DebateBattle team.'
      : '토론배틀 운영팀에 제안·버그·신고·제휴를 보내는 방법.',
  );
  if (lang === 'en') {
    return (
      <LegalLayout
        eyebrow="CONTACT · 문의"
        title={<>Drop us<br /><span className="hand">a line.</span></>}
        updated="2026-05-13"
        lang={lang}
      >
        <h2>📧 Email</h2>
        <p style={{ fontSize: 19 }}>
          <a href={`mailto:${CONTACT_EMAIL}`}>
            <b>{CONTACT_EMAIL}</b>
          </a>
        </p>
        <p>
          Suggestions, bug reports, content reports, partnership inquiries — send them all to the
          address above and we'll do our best to reply within three business days.
        </p>

        <h2>📝 What to include</h2>
        <ul>
          <li><b>Bug reports</b>: which screen, what you did, and a screenshot if possible</li>
          <li><b>Content reports</b>: the room / speech / account in question and the reason</li>
          <li><b>Suggestions</b>: when it would be needed and who would benefit</li>
        </ul>

        <h2>⚠️ Content / rights infringement reports</h2>
        <p>
          If you believe a post infringes your copyright, image rights, or reputation, please
          email us at the address above. We will investigate and act promptly.
        </p>

        <h2>🤝 Operation</h2>
        <p>
          DebateBattle is a personally-run side project. There is no advertising or marketing
          team — the operator reads every email directly.
        </p>
      </LegalLayout>
    );
  }
  return (
    <LegalLayout
      eyebrow="CONTACT · 문의"
      title={<>말씀,<br /><span className="hand">건네주세요.</span></>}
      updated="2026-05-13"
      lang={lang}
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
