import '../landing.css';

export function LandingView({ onStart }: { onStart: () => void }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page">
      {/* ===== IN-PAGE NAV ===== */}
      <div className="lpnav">
        <div className="lpnav__inner">
          <nav className="lpnav__menu">
            <a onClick={() => scrollTo('how')}>진행 방식</a>
            <a onClick={() => scrollTo('features')}>기능</a>
            <a onClick={() => scrollTo('demo')}>미리보기</a>
            <a onClick={() => scrollTo('topics')}>주제</a>
            <a onClick={() => scrollTo('faq')}>FAQ</a>
            <a onClick={onStart} className="lpnav__cta">
              시작하기 ▶
            </a>
          </nav>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero" id="top">
        <div className="wrap hero__layout">
          <div>
            <div className="hero__eyebrow">REAL-TIME · 1 vs 1 · KOREAN DEBATE</div>
            <h1 className="hero__title">
              주제를 던지고,
              <br />
              <span className="hand">맞붙어라.</span>
            </h1>
            <p className="hero__sub">
              <b>찬성과 반대 1대1.</b> AI 사회자가 진행하고, 관전자가 투표하며,
              라운드가 끝나면 승부가 갈립니다. 사람과 사람, 혹은 사람과 AI —
              누구든 무대에 오를 수 있습니다.
            </p>
            <div className="hero__cta">
              <button onClick={onStart} className="lpbtn lpbtn--pri lpbtn--lg">
                무대 열기 ▶
              </button>
              <button onClick={onStart} className="lpbtn lpbtn--lg">
                관전부터 해보기
              </button>
            </div>
            <div className="hero__meta">
              <span>
                ● <b>Google 로그인</b> 1초 시작
              </span>
              <span>
                ● <b>AI 사회자</b> 자동 진행
              </span>
              <span>
                ● <b>실시간 투표</b> 집계
              </span>
            </div>
          </div>

          <div>
            <div className="stage" aria-hidden="true">
              <div className="float-badge float-badge--objection">이의 있음!</div>
              <div className="float-badge float-badge--vote">+1표 👍</div>

              <div className="stage__topic">AI는 인간을 대체할 것인가?</div>

              <div className="stage__side stage__side--pro">
                <span className="stage__side-tag">찬성</span>
                <div className="stage__side-avatar">🦊</div>
                <div className="stage__side-name">홍길동</div>
                <div className="stage__side-quote">"이미 시작된 변화다."</div>
              </div>

              <div className="stage__side stage__side--con">
                <span className="stage__side-tag">반대</span>
                <div className="stage__side-avatar">🐻</div>
                <div className="stage__side-name">김토론</div>
                <div className="stage__side-quote">"인간만의 영역은 남는다."</div>
              </div>

              <div className="stage__vs">VS</div>

              <svg
                className="stage__spark stage__spark--1"
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
              >
                <path
                  d="M28 4 L31 24 L52 28 L31 32 L28 52 L25 32 L4 28 L25 24 Z"
                  fill="#c84b1f"
                  stroke="#1a0f08"
                  strokeWidth="1.5"
                />
              </svg>
              <svg
                className="stage__spark stage__spark--2"
                width="44"
                height="44"
                viewBox="0 0 56 56"
                fill="none"
              >
                <path
                  d="M28 4 L31 24 L52 28 L31 32 L28 52 L25 32 L4 28 L25 24 Z"
                  fill="#b8842a"
                  stroke="#1a0f08"
                  strokeWidth="1.5"
                />
              </svg>

              <div className="stage__moderator">
                <span className="dot"></span>
                🤖 AI 사회자 · 입론 중
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="phases-bg" id="how">
        <div className="wrap">
          <div className="section-eyebrow">HOW IT WORKS · 진행 방식</div>
          <h2 className="section-title">
            <span className="hand">5단계</span>로 끝나는,
            <br />
            깔끔한 한 판.
          </h2>
          <p className="section-lead">
            AI 사회자가 단계를 자동으로 진행합니다. 토론자는 발언만, 관전자는
            투표만 — 룰이 단순해서 누구나 바로 참여할 수 있습니다.
          </p>

          <div className="phases">
            <Phase num="01" name="개회" who="사회자" whoCls="mod" desc="AI 사회자가 주제를 정리하고 양측에게 발언 순서를 안내합니다." />
            <Phase num="02" name="찬성 입론" who="찬성" whoCls="pro" desc="왜 동의하는가. 핵심 근거 3가지를 정리해 던집니다." />
            <Phase num="03" name="반대 입론" who="반대" whoCls="con" desc="반대편의 주장과 근거. 입장 차이가 본격적으로 드러나는 라운드." />
            <Phase num="04" name="반박" who="양측" whoCls="all" desc='상대 논리의 약점을 짚고 재반박. "이의 있음!" 컷이 등장하는 구간.' />
            <Phase num="05" name="종료 · 판정" who="사회자" whoCls="mod" desc="관전자 투표 + AI 사회자의 정성 평가가 합쳐져 승부가 결정됩니다." last />
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features">
        <div className="wrap">
          <div className="section-eyebrow">FEATURES · 알찬 기능들</div>
          <h2 className="section-title">
            가볍게 켜지만,
            <br />
            <span className="hand">속은 꽉 차있다.</span>
          </h2>
          <p className="section-lead">
            참여자도 관전자도 헤매지 않도록, 토론에 꼭 필요한 기능만 추렸습니다.
            처음 와도 5분 안에 한 라운드 끝낼 수 있습니다.
          </p>

          <div className="features-grid">
            <Feat tag="CORE" tagNew icon="⚖️" iconCls="mod" title="AI 사회자"
              desc="개회 멘트, 단계 안내, 시간 조율까지. Claude 기반 AI가 끊김 없이 한 판을 진행합니다." />
            <Feat icon="🤖" iconCls="ink" title="AI 토론자"
              desc="상대가 없어도 시작할 수 있습니다. AI를 찬성/반대로 세우고 바로 한 판." />
            <Feat icon="⚡" iconCls="pro" title="실시간 1:1"
              desc="선착순 2명만 무대에 오릅니다. 단 둘. 군더더기 없는 진검 승부." />
            <Feat icon="🗳️" iconCls="con" title="관전자 투표"
              desc="관전자는 실시간으로 표를 던집니다. 발언은 못 해도 결과는 바꿀 수 있습니다." />
            <Feat tag="PRIVATE" icon="🔒" iconCls="ink" title="비공개방 + 초대 링크"
              desc="친구·동아리·스터디용 비공개방을 만들고 링크 하나로 초대하세요." />
            <Feat icon="🎲" iconCls="pro" title="주제 추천 · 발언 다듬기"
              desc="막막할 땐 AI가 토론 주제를 추천하고, 발언도 가독성 있게 다듬어 줍니다." />
            <Feat icon="📚" iconCls="con" title="자료실"
              desc="토론 기본기, 자주 쓰는 논증 구조, 좋은 반박법까지 — 학습 콘텐츠가 함께 있습니다." />
            <Feat icon="🏆" iconCls="mod" title="전적 · 프로필"
              desc="사람전 / AI전 따로 집계. 캐릭터 아바타와 닉네임으로 나만의 토론 기록." />
            <Feat icon="✂️" iconCls="ink" title="연장 라운드"
              desc="아직 결판이 안 났다면 양측 동의로 1라운드 더. 끝장을 봅시다." />
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section style={{ padding: '0 0 100px' }}>
        <div className="wrap">
          <div className="stats">
            <div className="stat">
              <div className="stat__num">5<span className="unit">단계</span></div>
              <div className="stat__label">정형화된 라운드</div>
            </div>
            <div className="stat">
              <div className="stat__num">2<span className="unit">명</span></div>
              <div className="stat__label">선착순 토론자</div>
            </div>
            <div className="stat">
              <div className="stat__num">99+<span className="unit">석</span></div>
              <div className="stat__label">관전자 자리</div>
            </div>
            <div className="stat">
              <div className="stat__num">1<span className="unit">초</span></div>
              <div className="stat__label">Google 로그인 시작</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DEMO PREVIEW ===== */}
      <section className="demo" id="demo">
        <div className="wrap">
          <div className="section-eyebrow">LIVE · 진짜 토론장은 이런 모습</div>
          <h2 className="section-title">
            들어오자마자
            <br />
            <span className="hand">"아, 알겠다"</span>
          </h2>
          <p className="section-lead">
            복잡한 설정 없이, 한 화면 안에서 발언과 투표가 동시에 흐릅니다. 아래는
            실제 토론방의 미리보기입니다.
          </p>

          <div className="demo-grid">
            <div>
              <div className="ribbon">ROOM CARD</div>
              <div className="roomcard">
                <div className="roomcard__bar">
                  <span className="pill-live">
                    <span className="dot"></span>LIVE
                  </span>
                  <span>R1 · 반박 라운드</span>
                  <span style={{ marginLeft: 'auto' }}>#a7f2c1</span>
                </div>
                <h3 className="roomcard__topic">AI는 인간을 대체할 것인가?</h3>

                <div className="roomcard__row">
                  <div className="roomcard__side roomcard__side--pro">
                    <div className="roomcard__av">🦊</div>
                    <div>
                      <div className="roomcard__role">PRO · 찬성</div>
                      <div className="roomcard__name">홍길동</div>
                    </div>
                  </div>
                  <div className="roomcard__vs">VS</div>
                  <div className="roomcard__side roomcard__side--con">
                    <div className="roomcard__av">🐻</div>
                    <div>
                      <div className="roomcard__role">CON · 반대</div>
                      <div className="roomcard__name">김토론</div>
                    </div>
                  </div>
                </div>

                <div className="vote-bar">
                  <div className="vote-bar__pro" style={{ flex: 58 }}>58%</div>
                  <div className="vote-bar__con" style={{ flex: 42 }}>42%</div>
                </div>
                <div className="vote-meta">
                  <span>👀 관전자 <b>27명</b></span>
                  <span>🗳️ 누적 투표 <b>114표</b></span>
                  <span>⏱ 남은 시간 <b>02:48</b></span>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="ribbon">VERDICT</div>
                <div
                  style={{
                    border: '1.5px solid var(--ink)',
                    background: 'var(--paper-light)',
                    boxShadow: '4px 4px 0 var(--ink)',
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.15em',
                      color: 'var(--ink-fade)',
                      marginBottom: 8,
                    }}
                  >
                    AI 사회자 판정 (예시)
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 700,
                      fontSize: 17,
                      lineHeight: 1.5,
                      color: 'var(--ink-soft)',
                    }}
                  >
                    "찬성 측은 변화 속도라는{' '}
                    <span className="squiggle-under">정량 근거</span>를 강하게
                    제시했고, 반대 측은 윤리·관계의 영역을 단단히 방어했습니다.
                    근거의 폭에서 찬성이 한 발 앞섰습니다."
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        background: 'var(--vermillion)',
                        color: '#fff',
                        padding: '4px 14px',
                        fontFamily: 'var(--font-hand)',
                        fontWeight: 700,
                        fontSize: 22,
                        transform: 'rotate(-3deg)',
                        display: 'inline-block',
                      }}
                    >
                      찬성 승
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--ink-fade)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      + 관전자 58% · AI 사회자 PRO
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="ribbon">DEBATE FLOOR</div>
              <div className="chat">
                <div className="chat__head">
                  <span>● ROOM · #a7f2c1</span>
                  <span className="phase-pill">PRO_REBUT</span>
                </div>
                <div className="chat__body">
                  <div className="msg msg--mod">
                    <div className="msg__meta">⚖️ AI 사회자</div>
                    <div className="msg__bubble">
                      반대 측 입론 잘 들었습니다. 이제 찬성 측의 반박 차례입니다.
                    </div>
                  </div>

                  <div className="msg msg--pro">
                    <div className="msg__meta">
                      <span className="pill">PRO</span>
                      <span>홍길동</span>
                      <span>· 14:02</span>
                    </div>
                    <div className="msg__bubble">
                      "인간만의 영역이 있다"는 전제부터 짚겠습니다. 10년 전엔
                      번역·작곡·디자인이 그 영역이었습니다. 지금은요?
                    </div>
                  </div>

                  <div className="msg msg--con">
                    <div className="msg__meta">
                      <span>김토론</span>
                      <span className="pill">CON</span>
                      <span>· 14:03</span>
                    </div>
                    <div className="msg__bubble">
                      대체된 게 아니라 도구가 바뀐 겁니다. 결정과 책임은 여전히
                      사람이 집니다.
                    </div>
                  </div>

                  <div className="msg msg--pro">
                    <div className="msg__meta">
                      <span className="pill">PRO</span>
                      <span>홍길동</span>
                      <span>· 14:04</span>
                    </div>
                    <div className="msg__bubble">
                      '결정'의 비율을 묻는 게 핵심입니다. 비율이 줄어드는 추세를
                      부정할 수 있나요?
                    </div>
                  </div>

                  <div className="typing">
                    <span
                      style={{
                        background: 'var(--celadon-soft)',
                        padding: '4px 10px',
                        border: '1.5px solid var(--celadon)',
                        color: 'var(--celadon)',
                      }}
                    >
                      김토론 입력 중
                      <span className="dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOPICS ===== */}
      <section id="topics">
        <div className="wrap">
          <div className="section-eyebrow">TOPICS · 던지기 좋은 주제</div>
          <h2 className="section-title">
            뭘로 싸울지
            <br />
            <span className="hand">고민될 땐.</span>
          </h2>
          <p className="section-lead">
            AI가 매일 새로운 주제를 추천합니다. 아래는 자주 등장하는 클래식
            토픽. 한 번 눌러서 무대를 열어보세요.
          </p>

          <div className="topics-grid">
            <Topic cat="기술 · 사회" q="AI는 결국 인간의 일자리를 빼앗을까?" pro={55} con={45} onClick={onStart} />
            <Topic cat="교육" q="학교 시험은 이제 절대평가로 바꿔야 한다." pro={62} con={38} onClick={onStart} />
            <Topic cat="문화" q="민트초코는 음식인가, 치약인가?" pro={48} con={52} onClick={onStart} />
            <Topic cat="정책" q="주 4일 근무제, 한국에 도입해도 될까?" pro={71} con={29} onClick={onStart} />
            <Topic cat="환경" q="원자력은 친환경 에너지로 분류해도 된다." pro={52} con={48} onClick={onStart} />
            <Topic cat="일상" q="탕수육은 부먹이 옳다." pro={41} con={59} onClick={onStart} />
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button onClick={onStart} className="lpbtn">
              🎲 AI에게 주제 추천받고 시작하기
            </button>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section
        style={{
          background: 'var(--paper-light)',
          borderTop: '1.5px solid var(--ink)',
          borderBottom: '1.5px solid var(--ink)',
        }}
        id="faq"
      >
        <div className="wrap-narrow">
          <div className="section-eyebrow">FAQ · 자주 묻는 것들</div>
          <h2 className="section-title">
            궁금한 건
            <br />
            <span className="hand">여기서 끝.</span>
          </h2>
          <div className="faq-list">
            <FAQ q="혼자서도 토론할 수 있나요?" open>
              네. 방을 만들 때 <b>"AI와 토론"</b>을 선택하면 AI 토론자가 즉시
              상대편에 앉습니다. 사람이 없어도 진검 승부 한 판을 끝낼 수 있고,
              관전자가 들어와 투표도 합니다.
            </FAQ>
            <FAQ q="토론자는 어떻게 정해지나요?">
              <b>선착순 1:1</b>입니다. 누구든 방에 들어와 찬성·반대 자리를
              선점하면 토론자가 되고, 양쪽이 채워지는 순간 LIVE로 전환됩니다.
              자리가 찬 뒤 들어온 사람은 관전자로 투표만 가능합니다.
            </FAQ>
            <FAQ q="승부는 어떻게 결정되나요?">
              <b>관전자 투표</b>와 <b>AI 사회자의 정성 평가</b>가 함께 반영됩니다.
              라운드 종료 시 사회자가 양측의 근거·반박을 정리해 코멘트를 남기고,
              최종 득표가 많은 쪽이 승리합니다. 동점이면 무승부.
            </FAQ>
            <FAQ q="친구들끼리만 토론하고 싶어요.">
              방 생성 시 <b>비공개방</b>으로 설정하면 공개 목록에 노출되지
              않습니다. 입장 후 생성되는 초대 링크를 친구·동아리·스터디원에게
              공유하세요.
            </FAQ>
            <FAQ q="발언이 정리가 안 돼요. 도와주나요?">
              <b>발언 다듬기</b> 기능을 켜면 보낸 내용이 자동으로 가독성 있게
              정리됩니다. 핵심 주장과 근거가 살아남되 문장이 매끄러워집니다 —
              입력 부담을 크게 줄여줍니다.
            </FAQ>
            <FAQ q="무료인가요?" open>
              현재 MVP는 <b>무료</b>입니다. Google 계정으로 1초 로그인하고 바로
              무대를 열 수 있습니다.
            </FAQ>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" style={{ padding: '100px 0 120px' }}>
        <div className="wrap">
          <div className="cta-block">
            <div className="section-eyebrow">START NOW</div>
            <h2 className="cta-title">
              준비 완료,
              <br />
              <span className="hand">지금 바로 시작.</span>
            </h2>
            <p>
              찬성과 반대, 단 두 자리. 관전석은 무한.
              <br />
              지금 첫 무대를 열고 도전자를 기다리세요.
            </p>
            <div
              style={{
                display: 'inline-flex',
                gap: 14,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button onClick={onStart} className="lpbtn lpbtn--pri lpbtn--lg">
                Google로 시작하기 ▶
              </button>
              <button
                onClick={onStart}
                className="lpbtn lpbtn--lg"
                style={{ background: 'var(--paper-light)' }}
              >
                먼저 둘러보기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Phase({
  num,
  name,
  who,
  whoCls,
  desc,
  last,
}: {
  num: string;
  name: string;
  who: string;
  whoCls: 'pro' | 'con' | 'mod' | 'all';
  desc: string;
  last?: boolean;
}) {
  return (
    <div className="phase">
      <div className="phase__num">{num}</div>
      <div className="phase__name">{name}</div>
      <span className={`phase__who phase__who--${whoCls}`}>{who}</span>
      <div className="phase__desc">{desc}</div>
      {!last && <div className="phase__arrow"></div>}
    </div>
  );
}

function Feat({
  tag,
  tagNew,
  icon,
  iconCls,
  title,
  desc,
}: {
  tag?: string;
  tagNew?: boolean;
  icon: string;
  iconCls: 'pro' | 'con' | 'mod' | 'ink';
  title: string;
  desc: string;
}) {
  return (
    <div className="feat">
      {tag && <div className={`feat__tag${tagNew ? ' feat__tag--new' : ''}`}>{tag}</div>}
      <div className={`feat__icon feat__icon--${iconCls}`}>{icon}</div>
      <h3 className="feat__title">{title}</h3>
      <p className="feat__desc">{desc}</p>
    </div>
  );
}

function Topic({
  cat,
  q,
  pro,
  con,
  onClick,
}: {
  cat: string;
  q: string;
  pro: number;
  con: number;
  onClick: () => void;
}) {
  return (
    <button className="topic-card" onClick={onClick}>
      <div className="topic-card__cat">{cat}</div>
      <div className="topic-card__q">{q}</div>
      <div className="topic-card__split">
        <span className="seg seg-pro" style={{ width: `${pro}%` }}></span>
        <span className="seg seg-con" style={{ width: `${con}%` }}></span>
        <span className="lbl lbl-pro" style={{ marginLeft: 10 }}>
          {pro}
        </span>
        <span className="lbl">:</span>
        <span className="lbl lbl-con">{con}</span>
      </div>
    </button>
  );
}

function FAQ({
  q,
  open,
  children,
}: {
  q: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="faq" open={open}>
      <summary>{q}</summary>
      <div className="answer">{children}</div>
    </details>
  );
}
