/*
 * 페이지 견본 · 사이트 묶음 견본 (사이트 지도에서 골라요)
 * ------------------------------------------------------------
 * 페이지 견본: 페이지 하나를 블록이 채워진 채로 더해요.
 *   { id, name, desc, file, art, blocks: [{ type, props, pt, pb }], links: ['맨 위 메뉴 · 맨 아래 링크에서 찾을 이름', …] }
 *   links: 이름이 같은 메뉴 · 링크가 비어 있으면 저절로 이 페이지와 이어요 (예: '개인정보 처리 방침')
 *   글 안의 {상호} {대표} {전화} {이메일} {주소} {오늘} 은 맨 아래 정보의 사업자 정보로 채워요
 *
 * 사이트 묶음 견본: 여러 페이지를 한 번에, 맨 위 메뉴까지 이어진 채로 시작해요.
 *   { id, name, desc, base(시작 견본 id) 또는 home(첫 페이지 블록) + theme, pages: [{ tpl, name, menu }] }
 */
(function () {
  const t = (title, body, more) => ({ type: 'text', props: Object.assign({ title, body }, more || {}) });

  const PRIVACY = [
    '{상호}(이하 ‘우리’)는 「개인정보 보호법」에 따라 이용자의 개인정보를 소중히 다루고, 궁금한 점이나 불편한 점을 빠르게 처리하기 위해 다음과 같이 개인정보 처리방침을 둡니다.',
    '',
    '1. 받는 개인정보와 쓰는 곳',
    '문의 · 예약 양식으로 이름, 연락처, 문의 내용을 받아요. 받은 정보는 문의에 답하고 예약을 확인하는 데만 써요.',
    '',
    '2. 보관 기간',
    '쓰는 목적을 다 이루면 바로 지워요. 다만 다른 법에서 정한 보관 기간이 있으면 그 기간 동안만 보관해요.',
    '',
    '3. 다른 곳에 주지 않아요',
    '이용자가 동의했거나 법에 정해진 경우가 아니면 개인정보를 다른 곳에 주지 않아요.',
    '',
    '4. 처리를 맡기는 곳',
    '문의 양식을 구글 설문지 · 네이버 폼으로 받는 경우, 받은 내용은 그 회사의 서버에 저장돼요.',
    '',
    '5. 이용자의 권리',
    '언제든 내 정보를 보거나, 고치거나, 지워 달라고 요청할 수 있어요. 아래 연락처로 알려 주세요.',
    '',
    '6. 개인정보 보호책임자',
    '이름: {대표} · 전화: {전화} · 이메일: {이메일}',
    '',
    '7. 언제부터',
    '이 방침은 {오늘}부터 적용해요.'
  ].join('\n');

  const TERMS = [
    '제1조 (목적)',
    '이 약관은 {상호}(이하 ‘우리’)가 운영하는 홈페이지를 이용하는 데 필요한 내용을 정해요.',
    '',
    '제2조 (홈페이지 이용)',
    '누구나 홈페이지의 글과 사진을 볼 수 있어요. 다만 글과 사진을 허락 없이 다른 곳에 옮겨 쓰면 안 돼요.',
    '',
    '제3조 (예약 · 문의)',
    '예약과 문의는 양식이나 전화로 받아요. 예약을 바꾸거나 취소하려면 하루 전까지 알려 주세요.',
    '',
    '제4조 (책임)',
    '천재지변처럼 어쩔 수 없는 일로 홈페이지를 쓸 수 없을 때는 책임지지 않아요.',
    '',
    '제5조 (문의처)',
    '{상호} · 전화 {전화} · 이메일 {이메일}',
    '',
    '부칙: 이 약관은 {오늘}부터 적용해요.'
  ].join('\n');

  const NOTE = '※ 견본 문구예요. 우리 가게 · 회사에 맞게 꼭 고쳐 주세요. (법률 상담이 필요하면 전문가와 확인하세요)';

  const PAGES = [
    { id: 'about', name: '소개', desc: '우리 이야기 · 하는 일 · 사진', file: 'about', art: 'about', links: ['소개', '우리 이야기', '회사 소개', '병원 소개', '학원 소개'],
      blocks: [
        t('우리를 소개합니다', '어떤 마음으로 시작했는지, 무엇을 잘하는지 적어 주세요.\n짧고 솔직한 이야기가 가장 잘 읽혀요.', { eyebrow: 'ABOUT', imagePos: 'right', ratio: '4/3' }),
        { type: 'cards', props: { title: '우리가 지키는 것', sub: '', perView: 3, ratio: '4/3', arrows: false, dots: false,
          cards: [
            { title: '정직하게', text: '보이는 그대로 설명해요.', open: 'link', link: '', youtube: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
            { title: '꼼꼼하게', text: '작은 것도 놓치지 않아요.', open: 'link', link: '', youtube: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
            { title: '친절하게', text: '처음 오신 분도 편하게.', open: 'link', link: '', youtube: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 }
          ] } },
        { type: 'gallery', props: { title: '둘러보기', sub: '', cols: 4, ratio: '1/1' } }
      ] },
    { id: 'menu', name: '메뉴 · 가격', desc: '가격표 · 대표 메뉴', file: 'menu', art: 'price', links: ['메뉴', '가격', '수강료', '요금'],
      blocks: [
        { type: 'pricing', props: { title: '가격 안내', sub: '부가세 포함 가격이에요.' } },
        { type: 'cards', props: { title: '대표 메뉴', sub: '사진을 넣어 보여 주세요.', perView: 3, ratio: '1/1' } }
      ] },
    { id: 'location', name: '오시는 길', desc: '지도 · 주차 · 대중교통', file: 'location', art: 'map', links: ['오시는 길', '찾아오시는 길', '위치'],
      blocks: [
        { type: 'map', props: { title: '오시는 길' } },
        { type: 'hours', props: {} },
        t('이렇게 오세요', '지하철: ○○역 ○번 출구에서 걸어서 5분\n버스: ○○ 정류장 하차\n주차: 건물 앞 2대 (무료 1시간)', { align: 'center' })
      ] },
    { id: 'team', name: '사람 소개', desc: '의료진 · 강사 · 직원을 사진과 함께', file: 'team', art: 'team', links: ['의료진', '의료진 소개', '강사진', '강사 소개', '직원 소개', '팀 소개', '사람들'],
      blocks: [
        { type: 'team', props: { title: '함께하는 사람들', sub: '사진과 함께 소개해 주세요.' } },
        t('함께 일하고 싶다면', '언제든 편하게 연락 주세요.', { align: 'center', showButton: true, button: '문의하기' })
      ] },
    { id: 'schedule', name: '일정 · 행사', desc: '다가오는 행사 · 수업 날짜', file: 'schedule', art: 'calendar', links: ['일정', '행사', '행사 일정', '수업 일정', '공연 일정'],
      blocks: [
        { type: 'schedule', props: { title: '다가오는 일정', sub: '지난 일정은 빼거나 아래로 옮겨 주세요.' } },
        { type: 'table', props: { title: '정기 일정', cols: ['', '월', '수', '금'], rows: [
          { cells: ['오전반', '10:00', '10:00', '10:00'] }, { cells: ['저녁반', '19:00', '19:00', '–'] }
        ] } }
      ] },
    { id: 'notice', name: '공지사항 · 소식', desc: '누르면 펼쳐지는 소식 목록', file: 'notice', art: 'list', links: ['소식', '공지사항', '공지', '새소식'],
      blocks: [
        { type: 'faq', props: { title: '공지사항', sub: '새 소식을 맨 위에 적어 주세요.', openFirst: true, look: 'card',
          items: [
            { q: '[공지] 연휴 쉬는 날 안내 · 2026.10.01', a: '연휴 기간에는 쉬어요. 연휴가 끝나면 평소처럼 문을 열어요.' },
            { q: '[소식] 새 메뉴가 나왔어요 · 2026.09.15', a: '가을을 맞아 새 메뉴를 준비했어요. 많이 찾아 주세요.' },
            { q: '[안내] 영업시간이 바뀌어요 · 2026.09.01', a: '9월부터 평일 영업시간이 오전 10시 ~ 오후 9시로 바뀌어요.' }
          ] } }
      ] },
    { id: 'faq', name: '자주 묻는 질문', desc: '질문을 누르면 답이 펼쳐져요', file: 'faq', art: 'list', links: ['자주 묻는 질문', 'FAQ', '고객센터'],
      blocks: [
        { type: 'faq', props: { title: '자주 묻는 질문', sub: '궁금한 점을 눌러 보세요.' } },
        t('더 궁금한 점이 있나요?', '전화나 문의 양식으로 편하게 물어봐 주세요.', { align: 'center', showButton: true, button: '문의하기' })
      ] },
    { id: 'contact', name: '예약 · 문의', desc: '문의 양식 · 연락처', file: 'contact', art: 'form', links: ['문의하기', '예약하기', '문의', '예약', '상담 신청', '연락하기'],
      blocks: [
        { type: 'form', props: { title: '예약 · 문의', sub: '남겨 주시면 확인 후 연락드릴게요.' } },
        t('전화로도 받아요', '평일 10:00 – 18:00 · 전화 02-000-0000', { align: 'center' })
      ] },
    { id: 'signup', name: '회원가입', desc: '가입 양식 (모양만 있어요 · 연결 안내 있어요)', file: 'signup', art: 'form', links: ['회원가입'],
      blocks: [
        { pt: 'l', pb: 'l', type: 'form', props: { title: '회원가입', sub: '아래 정보를 적어 주세요.', button: '가입하기', send: 'action', action: '',
          fields: [
            { kind: 'name', label: '이름', required: true, options: '' },
            { kind: 'text', label: '아이디', required: true, options: '' },
            { kind: 'password', label: '비밀번호', required: true, options: '' },
            { kind: 'email', label: '이메일', required: true, options: '' },
            { kind: 'phone', label: '연락처', required: false, options: '' }
          ],
          agree: '이용약관과 개인정보 처리방침을 읽었고 동의합니다.' } }
      ] },
    { id: 'login', name: '로그인', desc: '아이디 · 비밀번호 (모양만 있어요 · 연결 안내 있어요)', file: 'login', art: 'login', links: ['로그인'],
      blocks: [{ pt: 'l', pb: 'l', type: 'login', props: {} }] },
    { id: 'board', name: '공지사항 (게시판)', desc: '번호 · 제목 · 날짜 · 첨부파일', file: 'board', art: 'list', links: ['공지사항', '알림마당', '보도자료', '새소식', '회사 소식'],
      blocks: [{ type: 'board', props: { title: '공지사항', sub: '' } }] },
    { id: 'files', name: '자료실', desc: '신청서 · 서식 · 안내 책자 내려받기', file: 'files', art: 'doc', links: ['자료실', '서식', '자료 내려받기'],
      blocks: [{ type: 'files', props: {} }] },
    { id: 'guide', name: '이용 · 민원 안내', desc: '진행 순서 · 담당 부서 · 자주 묻는 질문', file: 'guide', art: 'list', links: ['민원 안내', '이용 안내', '이용 방법'],
      blocks: [
        { type: 'steps', props: { title: '이렇게 진행돼요' } },
        { type: 'table', props: { title: '담당 부서', cols: ['부서', '하는 일', '전화번호'], rows: [
          { cells: ['총무팀', '시설 · 행사 안내', '02-000-0001'] }, { cells: ['민원팀', '서류 신청 · 상담', '02-000-0002'] }, { cells: ['홍보팀', '소식 · 취재 문의', '02-000-0003'] }] } },
        { type: 'faq', props: { title: '자주 묻는 질문' } }
      ] },
    { id: 'history', name: '연혁 · 인증', desc: '걸어온 길 · 인증서 · 거래처', file: 'history', art: 'about', links: ['연혁', '회사 연혁', '걸어온 길', '경력'],
      blocks: [{ type: 'timeline', props: { title: '걸어온 길' } }, { type: 'logos', props: { title: '인증 · 함께하는 곳' } }] },
    { id: 'works', name: '작업물', desc: '분류 버튼으로 골라 보는 작업 모음', file: 'works', art: 'about', links: ['작업물', '포트폴리오', '시공 사례', '제품 소개', 'Works'],
      blocks: [{ type: 'works', props: {} }] },
    { id: 'jobs', name: '채용', desc: '모집 분야 · 마감일이 지나면 저절로 마감', file: 'jobs', art: 'list', links: ['채용', '인재 채용', '채용 공고'],
      blocks: [{ type: 'jobs', props: {} }, t('이런 분과 함께하고 싶어요', '성실하고 배우기를 좋아하는 분이면 경력이 없어도 괜찮아요.', { align: 'center' })] },
    { id: 'privacy', name: '개인정보 처리방침', desc: '사업자 정보로 저절로 채워요', file: 'privacy', art: 'doc', links: ['개인정보 처리 방침', '개인정보처리방침', '개인정보 처리방침'],
      blocks: [t('개인정보 처리방침', PRIVACY, { eyebrow: NOTE })] },
    { id: 'terms', name: '이용약관', desc: '사업자 정보로 저절로 채워요', file: 'terms', art: 'doc', links: ['이용약관'],
      blocks: [t('이용약관', TERMS, { eyebrow: NOTE })] },
    { id: '404', name: '찾는 페이지가 없어요', desc: '주소를 잘못 쳤을 때 보이는 화면 (404)', file: '404', art: '404', links: [],
      blocks: [t('찾는 페이지가 없어요', '주소가 바뀌었거나 없어진 페이지예요.\n아래 버튼을 눌러 첫 페이지로 가 주세요.', { align: 'center', eyebrow: '404', showButton: true, button: '첫 페이지로', link: 'page:@home' })] }
  ];

  // 회사 · 행사 첫 페이지 (시작 견본에 없는 것)
  const HOME = {
    company: {
      theme: { bg: '#ffffff', point: '#3B6FD8', dark: '#1F2A44', font: { ko: 'pretendard', en: 'inter' } },
      blocks: [
        { type: 'header', props: { logo: '바른솔루션', sticky: true, showCta: true, cta: '문의하기', menu: [] } },
        { type: 'banner', minh: 560, props: { align: 'left', slides: [
          { eyebrow: 'SINCE 2015', title: '작은 회사의 일을\n크게 돕습니다', text: '사무 자동화 · 홈페이지 · 업무 상담까지 한 곳에서.', button: '회사 소개 보기', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#1F2A44' }
        ] } },
        { type: 'cards', props: { title: '하는 일', sub: '', perView: 3, ratio: '4/3', arrows: false, dots: false,
          cards: [
            { title: '업무 자동화', text: '반복되는 일을 줄여요.', open: 'link', link: '', youtube: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
            { title: '홈페이지 제작', text: '찾기 쉽고 보기 좋게.', open: 'link', link: '', youtube: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
            { title: '업무 상담', text: '처음부터 함께 고민해요.', open: 'link', link: '', youtube: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 }
          ] } },
        { type: 'reviews', props: { title: '함께한 고객의 이야기' } },
        { type: 'footer', props: { layout: 'detail', theme: 'dark', name: '바른솔루션', info: [], copy: '© 바른솔루션',
          biz: { company: '바른솔루션', owner: '홍길동', bizNo: '000-00-00000', mailOrderNo: '', address: '서울특별시 ○○구 ○○로 1', phone: '02-000-0000', email: '' } } }
      ]
    },
    office: {
      theme: { bg: '#ffffff', point: '#2563C9', dark: '#17325C', font: { ko: 'pretendard', en: 'inter' } },
      blocks: [
        { type: 'notice', props: { text: '10월 9일(금) 한글날은 쉬어요. 급한 일은 대표 전화로 연락 주세요.', tone: 'dark' } },
        { type: 'header', props: { logo: '○○구 주민센터', sticky: true, showCta: false, showTop: true, topLinks: [{ label: '자료실', link: '' }, { label: 'English', link: '' }], menu: [] } },
        { type: 'banner', minh: 420, props: { align: 'left', slides: [
          { eyebrow: '○○구 주민센터', title: '주민 여러분의 생활을\n가까이에서 돕습니다', text: '서류 발급 · 복지 상담 · 주민 프로그램', button: '민원 안내 보기', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 }
        ] } },
        { type: 'steps', props: { title: '서류 발급은 이렇게', items: [
          { title: '신청', text: '창구나 온라인으로 신청해요.' }, { title: '확인', text: '신분증을 확인해요.' }, { title: '발급', text: '바로 받거나 우편으로 받아요.' }] } },
        { type: 'board', props: { title: '공지사항', more: '공지 전체 보기' } },
        { type: 'hours', props: { title: '민원실 운영 시간', word: '운영', days: [{ day: '평일', time: '09:00 - 18:00' }, { day: '주말', time: '쉬어요' }], brk: '12:00 - 13:00', last: '', note: '공휴일은 쉬어요.' } },
        { type: 'footer', props: { layout: 'simple', theme: 'dark', name: '○○구 주민센터', kogl: '1', info: ['팩스 02-000-0009'], copy: '© ○○구 주민센터',
          biz: { company: '', owner: '', bizNo: '', mailOrderNo: '', address: '서울특별시 ○○구 ○○로 1', phone: '02-000-0000', email: '' } } }
      ]
    },
    event: {
      theme: { bg: '#FFF8F8', point: '#E06C8B', dark: '#7A3E4E', font: { ko: 'gowun-dodum', en: 'poppins' } },
      blocks: [
        { type: 'header', props: { layout: 'center', logo: '가을 동네 장터', menu: [] } },
        { type: 'banner', minh: 600, props: { slides: [
          { eyebrow: '2026. 10. 24 (토) 11:00 – 17:00', title: '가을 동네 장터', text: '이웃이 만든 먹거리 · 손으로 만든 물건 · 작은 공연', button: '참가 신청', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#7A3E4E' }
        ] } },
        t('이런 걸 해요', '먹거리 장터 · 플리마켓 · 어린이 그림 대회 · 작은 음악회\n누구나 무료로 들어올 수 있어요.', { align: 'center' }),
        { type: 'schedule', props: { title: '하루 일정', layout: 'timeline', items: [
          { date: '11:00', day: '', time: '', title: '장터 문 열어요', place: '광장 전체', text: '먹거리 · 플리마켓', button: '', link: '' },
          { date: '14:00', day: '', time: '', title: '어린이 그림 대회', place: '잔디밭', text: '그림 도구는 준비돼 있어요.', button: '', link: '' },
          { date: '16:00', day: '', time: '', title: '작은 음악회', place: '야외 무대', text: '', button: '', link: '' }
        ] } },
        { type: 'gallery', props: { title: '지난 장터 사진', cols: 4, ratio: '1/1' } },
        { type: 'footer', props: { layout: 'simple', theme: 'dark', name: '가을 동네 장터', info: ['주최 ○○동 주민자치회 | 문의 02-000-0000'], copy: '© 가을 동네 장터' } }
      ]
    }
  };

  const SETS = [
    { id: 'shop', name: '가게 (카페 · 식당)', desc: '첫 페이지 · 메뉴 · 오시는 길 · 소식', base: 'cafe', count: 4,
      pages: [{ tpl: 'menu', menu: '메뉴' }, { tpl: 'location', menu: '오시는 길' }, { tpl: 'notice', menu: '소식' }] },
    { id: 'clinic', name: '병원 · 의원', desc: '첫 페이지 · 소개 · 의료진 · 질문 · 오시는 길 · 예약', base: 'clinic', count: 6,
      pages: [{ tpl: 'about', name: '병원 소개', menu: '병원 소개' }, { tpl: 'team', name: '의료진', menu: '의료진' }, { tpl: 'faq', menu: '자주 묻는 질문' }, { tpl: 'location', menu: '오시는 길' }, { tpl: 'contact', name: '진료 예약', menu: '진료 예약' }] },
    { id: 'academy', name: '학원 · 교실', desc: '첫 페이지 · 소개 · 강사진 · 수강료 · 공지 · 상담', base: 'academy', count: 6,
      pages: [{ tpl: 'about', name: '학원 소개', menu: '학원 소개' }, { tpl: 'team', name: '강사진', menu: '강사진' }, { tpl: 'menu', name: '수강료', menu: '수강료' }, { tpl: 'notice', name: '공지사항', menu: '공지사항' }, { tpl: 'contact', name: '상담 신청', menu: '상담 신청' }] },
    { id: 'company', name: '회사 · 중소기업', desc: '첫 페이지 · 회사 소개 · 연혁 · 제품 · 소식 · 채용 · 문의 · 개인정보', home: 'company', count: 8,
      pages: [{ tpl: 'about', name: '회사 소개', menu: '회사 소개' }, { tpl: 'history', name: '연혁', menu: '연혁' }, { tpl: 'works', name: '제품 · 사례', menu: '제품 · 사례' }, { tpl: 'board', name: '새소식', menu: '새소식' }, { tpl: 'jobs', name: '채용', menu: '채용' }, { tpl: 'contact', name: '견적 문의', menu: '견적 문의' }, { tpl: 'privacy' }] },
    { id: 'office', name: '관공서 · 기관', desc: '첫 페이지 · 기관 소개 · 공지사항 · 민원 안내 · 자료실 · 오시는 길 · 개인정보', home: 'office', count: 7,
      pages: [{ tpl: 'about', name: '기관 소개', menu: '기관 소개' }, { tpl: 'board', name: '공지사항', menu: '공지사항' }, { tpl: 'guide', name: '민원 안내', menu: '민원 안내' }, { tpl: 'files', name: '자료실', menu: '자료실' }, { tpl: 'location', menu: '오시는 길' }, { tpl: 'privacy' }] },
    { id: 'portfolio', name: '포트폴리오', desc: '첫 페이지 · 작업물 · 경력 · 연락하기', base: 'personal', count: 4,
      pages: [{ tpl: 'works', menu: '작업물' }, { tpl: 'history', name: '경력', menu: '경력' }, { tpl: 'contact', name: '연락하기', menu: '연락하기' }] },
    { id: 'event', name: '행사 · 모임', desc: '첫 페이지 · 오시는 길 · 참가 신청', home: 'event', count: 3,
      pages: [{ tpl: 'location', menu: '오시는 길' }, { tpl: 'contact', name: '참가 신청', menu: '참가 신청' }] }
  ];

  window.HOMETEO_PAGE_TEMPLATES = PAGES;
  window.HOMETEO_SITE_SETS = SETS;
  window.HOMETEO_SET_HOMES = HOME;
})();
