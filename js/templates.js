/*
 * 시작 견본
 * ------------------------------------------------------------
 * 빈 페이지 대신 완성된 페이지에서 시작할 수 있게 준비한 견본이에요.
 * 블록마다 { type, span(칸 수, 없으면 12), minh(높이 px · 'full'), props(처음 내용과 다른 부분만) } 으로 적어요.
 * 메인 배너(banner)는 slides 에 한 장이면 고정된 큰 사진, 여러 장이면 슬라이드가 돼요.
 * 사진은 비워 두었어요. 편집 화면에서 '사진 넣기' 자리를 두 번 누르거나 사진 파일을 끌어다 놓으면 돼요.
 * (사진을 넣지 않은 자리는 완성 홈페이지에서 보이지 않아요)
 */
window.HOMETEO_TEMPLATES = [
  {
    id: 'cafe',
    theme: { bg: '#FFFCF6', point: '#D9822B', dark: '#6B4A35', font: { ko: 'gowun-dodum', en: '' } },
    name: '카페 · 식당',
    desc: '메뉴, 영업시간, 오시는 길',
    colors: ['#6B4A35', '#F2B33D', '#FBF7EF'],
    blocks: [
      { type: 'header', props: {
        logo: '온기 카페', showCta: true, cta: '예약하기', ctaLink: '010-0000-0000', sticky: true,
        menu: [
          { label: '우리 이야기', link: '#', children: [] },
          { label: '메뉴', link: '#', children: [{ label: '커피', link: '#' }, { label: '디저트', link: '#' }, { label: '원두 판매', link: '#' }] },
          { label: '오시는 길', link: '#', children: [] },
          { label: '소식', link: '#', children: [] }
        ] } },
      { type: 'banner', minh: 640, props: {
        overlay: 35,
        slides: [
          { eyebrow: '', title: '오늘도 온기 한 잔', text: '매일 아침 직접 볶은 원두로\n정성껏 내린 커피를 만나보세요.', button: '메뉴 보기', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#6B4A35' },
          { eyebrow: '', title: '계절을 담은 디저트', text: '제철 과일로 매주 새로 굽는\n타르트와 케이크가 기다려요.', button: '디저트 보기', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#3E5A4A' },
          { eyebrow: '', title: '단체 예약 받아요', text: '모임, 작은 파티도 편하게 문의해 주세요.', button: '전화하기', showButton: true, link: '010-0000-0000', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#7A3E4E' }
        ] } },
      { type: 'text', props: { align: 'center', bg: '#FBF7EF', eyebrow: 'OUR STORY',
        title: '골목 끝, 작은 카페에서 시작했어요',
        body: '2018년 다섯 평 남짓한 가게에서 시작한 온기 카페는\n오늘도 같은 자리에서 같은 마음으로 커피를 내립니다.' } },
      { type: 'text', props: { imagePos: 'left', ratio: '4/3', eyebrow: 'COFFEE',
        title: '매일 아침 직접 볶는 원두',
        body: '산지별로 고른 생두를 매장에서 소량씩 볶아요. 볶은 지 일주일이 넘은 원두는 쓰지 않습니다.\n\n산미가 적고 고소한 ‘온기 블렌드’가 가장 사랑받는 메뉴예요.',
        showButton: true, button: '커피 메뉴 보기' } },
      { type: 'text', props: { imagePos: 'right', ratio: '4/3', eyebrow: 'DESSERT', bg: '#FBF7EF',
        title: '계절이 바뀌면 디저트도 바뀌어요',
        body: '봄에는 딸기, 여름에는 복숭아, 가을에는 무화과.\n제철 과일로 매주 새로 굽는 타르트를 맛보세요.' } },
      { type: 'cards', props: { title: '이번 주 인기 메뉴', sub: '사진을 넣고 옆으로 넘겨 보세요.', perView: 3, ratio: '1/1', autoplay: true,
        cards: [
          { title: '온기 블렌드 아메리카노', text: '4,500원 · 고소하고 산미가 적어요', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '흑임자 라테', text: '5,800원 · 매장에서 직접 갈아요', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '무화과 타르트', text: '6,500원 · 가을 한정', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '바닐라 빈 스콘', text: '3,800원 · 매일 아침 구워요', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '원두 200g', text: '14,000원 · 매주 볶은 원두', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 }
        ] } },
      { type: 'gallery', props: { title: '매장 둘러보기', sub: '사진을 넣어 가게 분위기를 보여주세요.', cols: 4, ratio: '1/1' } },
      { type: 'text', props: { align: 'center', eyebrow: 'OPEN', title: '영업 시간',
        body: '평일 10:00 – 21:00\n주말 11:00 – 22:00\n매주 월요일 쉬어요', bg: '#2B2A28' } },
      { type: 'map', props: { title: '오시는 길', address: '서울특별시 중구 세종대로 110',
        detail: '○○역 2번 출구에서 걸어서 5분\n가게 앞 주차 2대 가능', phone: '02-000-0000' } },
      { type: 'footer', props: { layout: 'simple', theme: 'dark', name: '온기 카페',
        biz: { company: '온기 카페', owner: '홍길동', bizNo: '000-00-00000', address: '서울특별시 ○○구 ○○로 12, 1층', phone: '02-000-0000' }, info: [],
        copy: '© 온기 카페. All rights reserved.',
        socials: { instagram: 'https://instagram.com/', blog: 'https://blog.naver.com/', youtube: '', kakao: '', facebook: '', naver: '', x: '' } } }
    ]
  },
  {
    id: 'clinic',
    theme: { bg: '#ffffff', point: '#F2B33D', dark: '#2F4A7A', font: { ko: 'pretendard', en: '' } },
    name: '병원 · 의원',
    desc: '진료 과목, 의료진, 진료 시간',
    colors: ['#2F4A7A', '#EEF3FB', '#F2B33D'],
    blocks: [
      { type: 'header', props: {
        logo: '바른치과의원', showCta: true, cta: '진료 예약', ctaLink: '02-000-0000', sticky: true,
        menu: [
          { label: '병원 소개', link: '#', children: [{ label: '인사말', link: '#' }, { label: '의료진', link: '#' }, { label: '둘러보기', link: '#' }] },
          { label: '진료 과목', link: '#', children: [{ label: '일반 진료', link: '#' }, { label: '임플란트', link: '#' }, { label: '교정', link: '#' }] },
          { label: '진료 안내', link: '#', children: [] },
          { label: '오시는 길', link: '#', children: [] }
        ] } },
      { type: 'banner', minh: 640, props: { align: 'left', slides: [
        { eyebrow: 'BAREUN DENTAL CLINIC', title: '아프지 않게,\n바르게 치료합니다', text: '충분히 설명하고, 꼭 필요한 치료만 권해드려요.',
          button: '진료 예약하기', showButton: true, link: '02-000-0000', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#2F4A7A' }
      ] } },
      { type: 'text', props: { align: 'center', bg: '#EEF3FB', eyebrow: 'TREATMENT', title: '진료 과목',
        body: '일반 진료 · 임플란트 · 치아 교정 · 미백 · 어린이 치과\n한 곳에서 꼼꼼하게 진료해 드립니다.' } },
      { type: 'text', span: 4, props: { align: 'center', title: '일반 진료', body: '충치, 신경 치료, 잇몸 치료까지\n기본부터 꼼꼼하게.' } },
      { type: 'text', span: 4, props: { align: 'center', title: '임플란트', body: '정밀 검사 후\n나에게 맞는 계획을 세워요.' } },
      { type: 'text', span: 4, props: { align: 'center', title: '치아 교정', body: '투명 교정부터\n어린이 교정까지.' } },
      { type: 'text', props: { imagePos: 'right', ratio: '3/4', eyebrow: 'DOCTOR', title: '대표원장 인사말',
        body: '“환자분이 이해하실 때까지 설명드리는 것이 바른 진료의 시작이라고 생각합니다.”\n\n대표원장 김바른\n○○대학교 치의학 박사 · 보건복지부 인증 통합치의학과 전문의' } },
      { type: 'text', props: { align: 'center', eyebrow: 'HOURS', title: '진료 시간', bg: '#F4F4F6',
        body: '평일 09:30 – 18:30\n토요일 09:30 – 14:00\n점심 13:00 – 14:00\n일요일 · 공휴일 쉬어요' } },
      { type: 'faq', props: { title: '자주 묻는 질문', items: [
        { q: '예약 없이 가도 진료받을 수 있나요?', a: '네, 가능해요. 다만 예약하신 분이 먼저라 기다리실 수 있어요.' },
        { q: '주차할 수 있나요?', a: '건물 지하 주차장을 2시간 무료로 쓸 수 있어요.' },
        { q: '임플란트 상담은 얼마나 걸리나요?', a: '검사와 상담까지 40분 정도 걸려요.' }
      ] } },
      { type: 'map', props: { title: '오시는 길', address: '서울특별시 중구 세종대로 110',
        detail: '○○역 1번 출구 바로 앞, ○○빌딩 3층\n건물 지하 주차 2시간 무료', phone: '02-000-0000' } },
      { type: 'form', props: { title: '진료 예약 문의', sub: '남겨 주시면 진료 시간에 전화드릴게요.',
        fields: [
          { kind: 'name', label: '이름', required: true, options: '' },
          { kind: 'phone', label: '연락처', required: true, options: '' },
          { kind: 'select', label: '진료 과목', required: false, options: '일반 진료, 임플란트, 치아 교정, 기타' },
          { kind: 'date', label: '희망 날짜', required: false, options: '' },
          { kind: 'message', label: '불편한 곳', required: false, options: '' }
        ] } },
      { type: 'footer', props: { layout: 'detail', theme: 'light', name: '바른치과의원',
        biz: { company: '바른치과의원', owner: '김바른', bizNo: '000-00-00000', address: '서울특별시 ○○구 ○○로 34, ○○빌딩 3층', phone: '02-000-0000' }, info: ['팩스 02-000-0001'],
        copy: '© 바른치과의원. All rights reserved.',
        columns: [
          { title: '병원 소개', links: [{ label: '인사말', url: '' }, { label: '의료진', url: '' }, { label: '둘러보기', url: '' }] },
          { title: '진료 과목', links: [{ label: '일반 진료', url: '' }, { label: '임플란트', url: '' }, { label: '치아 교정', url: '' }] },
          { title: '진료 안내', links: [{ label: '진료 시간', url: '' }, { label: '비급여 안내', url: '' }, { label: '오시는 길', url: '' }] }
        ],
        bottomLinks: [{ label: '이용약관', url: '', bold: false }, { label: '개인정보 처리 방침', url: '', bold: true }, { label: '비급여 진료비 안내', url: '', bold: false }],
        showSelect: false,
        socials: { instagram: '', youtube: '', blog: 'https://blog.naver.com/', kakao: 'https://pf.kakao.com/', facebook: '', naver: '', x: '' } } }
    ]
  },
  {
    id: 'academy',
    theme: { bg: '#ffffff', point: '#F2B33D', dark: '#2E6B4F', font: { ko: 'noto-sans', en: '' } },
    name: '학원 · 교육',
    desc: '수업 소개, 강점, 상담 신청',
    colors: ['#2E6B4F', '#F1F6F1', '#F2B33D'],
    blocks: [
      { type: 'header', props: {
        logo: '생각숲 영어학원', showCta: true, cta: '상담 신청', ctaLink: '010-0000-0000',
        menu: [
          { label: '학원 소개', link: '#', children: [] },
          { label: '수업 과정', link: '#', children: [{ label: '초등', link: '#' }, { label: '중등', link: '#' }, { label: '고등', link: '#' }] },
          { label: '선생님', link: '#', children: [] },
          { label: '공지사항', link: '#', children: [] }
        ] } },
      { type: 'banner', minh: 480, props: {
        align: 'left',
        slides: [
          { eyebrow: '', title: '스스로 생각하는\n영어 수업', text: '외우기보다 이해하고, 말하고, 써보는 수업을 해요.', button: '수업 과정 보기', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#2E6B4F' },
          { eyebrow: 'NOTICE', title: '2026 겨울방학 특강', text: '초등 고학년 · 중등 문법 집중반 모집 중', button: '특강 자세히 보기', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#2F4A7A' }
        ] } },
      { type: 'text', props: { align: 'center', bg: '#F1F6F1', eyebrow: 'WHY US', title: '왜 생각숲일까요?',
        body: '한 반 최대 8명, 매 수업 기록, 매달 학부모 리포트.\n아이 한 명 한 명을 놓치지 않는 세 가지 약속이에요.' } },
      { type: 'text', span: 4, props: { align: 'center', bg: '#F1F6F1', title: '소수 정예', body: '한 반 최대 8명.\n모든 아이가 말할 기회를 가져요.' } },
      { type: 'text', span: 4, props: { align: 'center', bg: '#F1F6F1', title: '1:1 첨삭', body: '쓴 글은 선생님이\n한 문장씩 고쳐줘요.' } },
      { type: 'text', span: 4, props: { align: 'center', bg: '#F1F6F1', title: '학부모 리포트', body: '매달 수업 기록과\n성장 그래프를 보내드려요.' } },
      { type: 'text', props: { imagePos: 'left', ratio: '4/3', eyebrow: 'CLASS', title: '수업은 이렇게 해요',
        body: '읽기 – 생각 나누기 – 말하기 – 쓰기의 네 단계로 한 주제를 깊이 있게 다뤄요.\n\n수업이 끝나면 오늘 배운 표현으로 짧은 글을 쓰고, 다음 시간에 첨삭을 받아요.' } },
      { type: 'video', props: { showCaption: true, caption: '실제 수업 모습 (유튜브 주소를 넣어주세요)' } },
      { type: 'cards', props: { title: '선생님을 소개해요', sub: '아이마다 맞는 선생님이 함께해요.', perView: 4, ratio: '3/4', bg: '#F1F6F1',
        cards: [
          { title: '김숲 원장', text: '초등 · 리딩', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '박나무 선생님', text: '중등 · 문법', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '이새싹 선생님', text: '초등 · 말하기', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: 'Emma 선생님', text: '원어민 · 쓰기', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '최가지 선생님', text: '고등 · 수능', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 }
        ] } },
      { type: 'pricing', props: { title: '수강료 안내', sub: '교재비는 따로예요.', plans: [
        { name: '초등', price: '220,000원', unit: '/ 월', desc: '주 2회 · 90분', features: '읽기 · 말하기\n매 수업 기록\n월 1회 학부모 리포트', button: '상담 신청', showButton: true, link: '010-0000-0000', highlight: false },
        { name: '중등', price: '280,000원', unit: '/ 월', desc: '주 3회 · 90분', features: '문법 · 독해 · 쓰기\n1:1 첨삭\n월 1회 학부모 리포트', button: '상담 신청', showButton: true, link: '010-0000-0000', highlight: true },
        { name: '고등', price: '320,000원', unit: '/ 월', desc: '주 3회 · 120분', features: '수능 독해\n주간 모의고사\n1:1 첨삭', button: '상담 신청', showButton: true, link: '010-0000-0000', highlight: false }
      ] } },
      { type: 'reviews', props: { title: '학부모 이야기', sub: '실제로 받은 이야기를 적어주세요.' } },
      { type: 'form', props: { title: '상담 신청', sub: '남겨 주시면 상담 시간에 연락드릴게요.',
        fields: [
          { kind: 'name', label: '학생 이름', required: true, options: '' },
          { kind: 'phone', label: '보호자 연락처', required: true, options: '' },
          { kind: 'select', label: '학년', required: true, options: '초등, 중등, 고등' },
          { kind: 'message', label: '궁금한 점', required: false, options: '' }
        ] } },
      { type: 'text', props: { align: 'center', bg: '#2B2A28', title: '무료 레벨 테스트', body: '지금 실력에 맞는 반을 찾아드려요. 30분이면 충분해요.', showButton: true, button: '상담 신청하기', link: '010-0000-0000' } },
      { type: 'footer', props: { layout: 'detail', theme: 'light', name: '생각숲 영어학원',
        biz: { company: '생각숲 영어학원', owner: '이생각', bizNo: '000-00-00000', address: '서울특별시 ○○구 ○○로 56, 4층', phone: '02-000-0000' }, info: ['학원등록번호 제0000호 | 상담 평일 14:00 – 21:00'],
        copy: '© 생각숲 영어학원. All rights reserved.',
        columns: [
          { title: '수업 과정', links: [{ label: '초등', url: '' }, { label: '중등', url: '' }, { label: '고등', url: '' }] },
          { title: '안내', links: [{ label: '공지사항', url: '' }, { label: '수강료 안내', url: '' }, { label: '오시는 길', url: '' }] }
        ],
        bottomLinks: [{ label: '이용약관', url: '', bold: false }, { label: '개인정보 처리 방침', url: '', bold: true }],
        showSelect: true, selectLabel: '다른 지점', selectOptions: [{ label: '○○점', url: '' }, { label: '△△점', url: '' }],
        socials: { instagram: '', youtube: 'https://youtube.com/', blog: 'https://blog.naver.com/', kakao: '', facebook: '', naver: '', x: '' } } }
    ]
  },
  {
    id: 'personal',
    theme: { bg: '#ffffff', point: '#8E5BD6', dark: '#2B2A28', font: { ko: 'pretendard', en: 'inter' } },
    name: '개인 소개 · 포트폴리오',
    desc: '나를 소개하고 작업을 보여주기',
    colors: ['#2B2A28', '#FBF7EF', '#8E5BD6'],
    blocks: [
      { type: 'header', props: { layout: 'center', logo: '김하늘', logoAction: 'menu',
        menu: [
          { label: '소개', link: '#', children: [] },
          { label: '작업', link: '#', children: [] },
          { label: '연락하기', link: '#', children: [] }
        ] } },
      { type: 'banner', minh: 640, props: { align: 'left', slides: [
        { eyebrow: 'PRODUCT DESIGNER', title: '사람을 위한 화면을\n만듭니다', text: '7년 동안 금융, 교육, 커머스 서비스의 화면을 설계했어요.',
          button: '작업 보러 가기', showButton: true, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, bg: '#2B2A28' }
      ] } },
      { type: 'text', props: { imagePos: 'left', ratio: '1/1', eyebrow: 'ABOUT', title: '안녕하세요, 김하늘입니다',
        body: '복잡한 것을 쉽게 만드는 일을 좋아해요.\n사용하는 사람을 직접 만나고, 작게 만들어 보고, 고치는 과정을 반복합니다.\n\n지금은 프리랜서로 일하고 있어요.' } },
      { type: 'cards', props: { title: '최근 작업', sub: '사진을 넣어 작업을 보여주세요.', perView: 2, ratio: '4/3', bg: '#FBF7EF',
        cards: [
          { title: '모바일 뱅킹 앱 개편', text: '2025 · 앱 화면 설계', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '온라인 수업 도구', text: '2024 · 웹 서비스', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 },
          { title: '동네 가게 예약 서비스', text: '2023 · 앱 · 웹', link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 }
        ] } },
      { type: 'gallery', props: { title: '작업 사진', sub: '', cols: 3, ratio: '4/3' } },
      { type: 'text', props: { align: 'center', eyebrow: 'CONTACT', title: '함께 일해요',
        body: '새로운 프로젝트 이야기는 언제든 반가워요.\n편하게 메일 주세요.',
        showButton: true, button: '메일 보내기', link: 'mailto:hello@example.com' } },
      { type: 'footer', props: { layout: 'simple', theme: 'dark', name: '김하늘',
        info: ['hello@example.com | 서울'], copy: '© 김하늘',
        socials: { instagram: 'https://instagram.com/', youtube: '', blog: '', kakao: '', facebook: '', naver: '', x: '' } } }
    ]
  }
];
