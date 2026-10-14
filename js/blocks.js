/*
 * 홈터 블록 목록
 * ------------------------------------------------------------
 * 블록 하나에 들어 있는 것
 *   name, desc        서랍·설정에 보이는 이름과 짧은 설명
 *   thumb             작은 미리보기 그림
 *   defaults()        처음 놓았을 때의 내용
 *   render(p, h, c)   실제 페이지에 그려지는 모습   (p = 내용, h = 도우미, c = { id })
 *   inspector(p, h, c) 오른쪽 설정 화면 (HometeoUI 부품으로 만들어요)
 *   newItem           목록에 "하나 더하기"를 누를 때 새로 들어갈 내용 (목록 이름별)
 *   dropPath(p, c, h) 사진 파일을 블록 위에 끌어다 놓으면 들어갈 자리
 *   wrapperStyle(p)   완성 홈페이지에서 블록을 감싸는 상자의 모양 (예: 따라오는 메뉴)
 *   migrate(p)        옛날 작업 파일의 내용을 지금 모양으로 바꾸기
 *
 * 페이지 위에서 바로 고칠 글자에는 data-edit="내용이름" 을 붙여요. (여러 줄이면 data-multiline)
 * 사진이 없을 때 편집 화면에서만 보이는 '사진 넣기' 자리는 h.placeholder() 로 만들어요.
 */
(function () {
  const PALETTE = [
    ['#2F4A7A', '남색'], ['#2B2A28', '먹색'], ['#2E6B4F', '초록'],
    ['#7A3E4E', '자주'], ['#9A5B24', '황토'], ['#5B6470', '회색']
  ];
  const BG_LIGHT = [
    ['#ffffff', '흰색'], ['#FBF7EF', '한지'], ['#F4F4F6', '연회색'],
    ['#EEF3FB', '연파랑'], ['#F1F6F1', '연초록'], ['#2B2A28', '먹색']
  ];
  const RATIOS = [['16/9', '16:9'], ['4/3', '4:3'], ['1/1', '1:1'], ['3/4', '3:4'], ['9/16', '9:16']];
  // 페이지 영역: 맨 위 · 메인 배너 · 본문 · 맨 아래 (퀵메뉴는 화면 위에 떠 있어요)
  const ZONES = [
    { id: 'header', ko: '맨 위', en: 'Header' },
    { id: 'banner', ko: '메인 배너', en: 'Main Banner' },
    { id: 'main', ko: '본문', en: 'Main' },
    { id: 'footer', ko: '맨 아래', en: 'Footer' }
  ];
  // 옛 높이 이름 → 블록 높이(px). 옛 작업 파일과 견본을 열 때 써요.
  const OLD_HEIGHTS = { small: 320, medium: 480, large: 640, full: 'full' };
  // 바탕색: 비어 있으면 사이트 색을 따라가요 (CSS 변수 --c-bg …)
  const bgStyle = (h, v) => (v ? ` style="background:${h.attr(v)}"` : '');
  // 사업자 정보 (맨 아래 정보)
  const newBiz = () => ({ company: '', owner: '', bizNo: '', mailOrderNo: '', address: '', phone: '', email: '' });
  const BIZ_FIELDS = [
    ['company', '상호 (가게 · 회사 이름)', '예: 온기 카페'], ['owner', '대표자', '예: 홍길동'],
    ['bizNo', '사업자등록번호', '예: 123-45-67890'], ['mailOrderNo', '통신판매업 신고번호 (온라인 판매 시)', '예: 2026-서울중구-0123'],
    ['address', '주소', '예: 서울특별시 중구 세종대로 110, 1층'], ['phone', '전화', '예: 02-123-4567'], ['email', '이메일', '예: myshop@naver.com']
  ];
  // 색 고르기 맨 앞에 '사이트 색' (빈 값)



  // ---- 그리기 공통: 잠시 숨긴 항목(_hide)은 빼고, 품절(_sold) 항목엔 표시를 붙여요 ----
  // 번호가 밀리지 않게 data-edit 번호는 원래 번호로 되돌려요 (페이지에서 두 번 눌러 고치기가 그대로 돼요)
  function renderBlock(def, props, h, c) {
    const html0 = renderItems(def, props, h, c);
    // 본문 블록 공통 디자인: 테두리(skin) · 제목 위치(headAlign) — 맨 바깥 태그에 이름표를 붙여요
    const extra = def.zone === 'main' ? [props.skin ? 'skin-' + props.skin : '', props.headAlign === 'left' ? 'head-left' : ''].filter(Boolean).join(' ') : '';
    return extra ? html0.replace(/class="/, 'class="' + extra + ' ') : html0;
  }
  function renderItems(def, props, h, c) {
    const lists = (def.lists || []).filter((l) => l.indexOf('*') < 0);
    let flagged = false;
    lists.forEach((l) => { const a = props && props[l]; if (Array.isArray(a) && a.some((x) => x && (x._hide || x._sold))) flagged = true; });
    if (!flagged) return def.render(props, h, c);
    const p = Object.assign({}, props);
    const maps = {};
    lists.forEach((l) => {
      const a = props[l];
      if (!Array.isArray(a)) return;
      const keep = [];
      a.forEach((x, i) => { if (!(x && x._hide)) keep.push(i); });
      if (keep.length === a.length) return;
      p[l] = keep.map((i) => a[i]);
      maps[l] = keep;
    });
    let html = def.render(p, h, c);
    const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    Object.keys(maps).forEach((l) => {
      html = html.replace(new RegExp('(["\\s])' + esc(l) + '\\.(\\d+)(?=[."\\s])', 'g'), (m, pre, n) => pre + l + '.' + (maps[l][Number(n)] != null ? maps[l][Number(n)] : n));
    });
    lists.forEach((l) => {
      (props[l] || []).forEach((x, i) => {
        if (!x || !x._sold || x._hide) return;
        const re = new RegExp('(<(\\w+)[^>]*data-edit="' + esc(l) + '\\.' + i + '\\.(?:title|name|q|label)"[^>]*>[\\s\\S]*?<\\/\\2>)');
        html = html.replace(re, '$1<span class="b-sold">품절</span>');
      });
    });
    return html;
  }

  // 카카오맵 ‘지도 퍼가기’ 코드에서 지도 번호(timestamp · key)만 꺼내요 (다른 글은 쓰지 않아요)
  function kakaoMap(code) {
    const c = String(code || '');
    const ts = /"timestamp"\s*:\s*"(\d{6,20})"/.exec(c) || /daumRoughmapContainer(\d{6,20})/.exec(c);
    const key = /"key"\s*:\s*"([A-Za-z0-9_-]{4,40})"/.exec(c);
    return ts && key ? { ts: ts[1], key: key[1] } : null;
  }
  // ---- 날짜 · 파일 도우미 ----
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function isRecent(dateStr, days) {
    const t = Date.parse(String(dateStr || '').replace(/\./g, '-'));
    return !isNaN(t) && Date.now() - t < days * 86400000 && Date.now() - t > -86400000;
  }
  function fileExt(name) { const m = /\.([a-z0-9]{2,5})(?:$|\?)/i.exec(String(name || '')); return m ? m[1].toUpperCase() : ''; }
  const FILE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.5l-8.4 8.4a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/></svg>';
  // 설정 칸: 파일 넣기 · 바꾸기 · 빼기 (자료실 · 게시판 첨부)
  function fileField(h, base, it) {
    return it.file
      ? `<div class="file-pick is-set"><span>📎 ${h.text(it.fname || '파일')}</span><button class="btn small" data-action="file-pick" data-path="${base}">바꾸기</button><button class="btn small" data-action="file-clear" data-path="${base}">빼기</button></div>`
      : `<div class="file-pick"><button class="btn small" data-action="file-pick" data-path="${base}">📎 파일 넣기 (PDF · 한글 · 워드 · 엑셀)</button></div>`;
  }
  // ---- 영업시간 계산 (편집 화면 · 완성 홈페이지가 같은 함수를 써요) ----
  // '월 ~ 금' · '평일' · '주말' · '매일' · '토요일' → 요일 번호 목록 (일=0 … 토=6)
  function hoursDays(label) {
    var W = '일월화수목금토';
    var s = String(label || '').replace(/공휴일/g, '').replace(/요일/g, '');
    if (/매일|모든\s*날|연중/.test(s)) return [0, 1, 2, 3, 4, 5, 6];
    var out = [];
    if (/평일/.test(s)) out.push(1, 2, 3, 4, 5);
    if (/주말/.test(s)) out.push(6, 0);
    s = s.replace(/평일|주말/g, '');
    s = s.replace(/([일월화수목금토])\s*[~\-–]\s*([일월화수목금토])/g, function (m, a, b) {
      var i = W.indexOf(a), j = W.indexOf(b), k = i;
      for (var n = 0; n < 7; n++) { out.push(k); if (k === j) break; k = (k + 1) % 7; }
      return '';
    });
    for (var c = 0; c < s.length; c++) { var x = W.indexOf(s[c]); if (x >= 0) out.push(x); }
    return out.filter(function (v, i) { return out.indexOf(v) === i; });
  }
  function hoursStatus(p, now) {
    function toMin(hh, mm) { return Number(hh) * 60 + Number(mm || 0); }
    function range(t) {
      var m = /(\d{1,2})(?:[:시]\s*(\d{2}))?\s*[~\-–]\s*(\d{1,2})(?:[:시]\s*(\d{2}))?/.exec(String(t || ''));
      if (!m) return null;
      var a = toMin(m[1], m[2]), b = toMin(m[3], m[4]);
      if (b <= a) b += 1440;
      return [a, b];
    }
    function hm(v) { v = ((v % 1440) + 1440) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); }
    function dayRange(d) {
      var row = null;
      (p.days || []).forEach(function (r) { if (hoursDays(r.day).indexOf(d) >= 0) row = r; });
      if (!row || /휴|쉬|닫|없/.test(row.time || '')) return null;
      return range(row.time);
    }
    var w = p.word || '영업';
    var d = now.getDay(), t = now.getHours() * 60 + now.getMinutes();
    var y = dayRange((d + 6) % 7);
    if (y && y[1] > 1440 && t < y[1] - 1440) return { state: 'open', text: '지금 ' + w + ' 중 · ' + hm(y[1]) + '까지' };
    var r = dayRange(d);
    var anyRow = (p.days || []).some(function (x) { return hoursDays(x.day).indexOf(d) >= 0; });
    if (!r) return anyRow ? { state: 'off', text: '오늘은 쉬어요' } : { state: 'none', text: '오늘 ' + w + '시간은 전화로 물어봐 주세요' };
    if (t < r[0]) return { state: 'before', text: w + ' 전 · ' + hm(r[0]) + '에 열어요' };
    if (t >= r[1]) return { state: 'after', text: '오늘 ' + w + '이 끝났어요' };
    var b = range(p.brk);
    if (b && t >= b[0] && t < b[1]) return { state: 'break', text: '쉬는 시간 · ' + hm(b[1]) + '에 다시 열어요' };
    return { state: 'open', text: '지금 ' + w + ' 중 · ' + hm(r[1]) + '까지' };
  }
  const SITE = (label) => [['', label || '사이트 색']];
  const isDark = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 140;
  };

  // 버튼 하나 (글자는 페이지에서 고치고, 갈 곳은 설정에서)
  const button = (p, h, key, linkKey, cls) => `<a class="b-button${cls ? ' ' + cls : ''}"${h.href(p[linkKey])} data-edit="${key}">${h.text(p[key])}</a>`;
  const buttonFields = (p, ui, h, opts) => {
    const o = opts || {};
    return ui.section('버튼',
      ui.check(o.show || 'showButton', p[o.show || 'showButton'], '버튼 보이기') +
      (p[o.show || 'showButton'] ? ui.link(o.link || 'link', p[o.link || 'link'], h.linkTargets(), { label: '버튼을 누르면 갈 곳' }) : ''),
      p[o.show || 'showButton'] ? '버튼 글자는 페이지에서 두 번 눌러 고쳐요. 전화번호를 적으면 휴대폰에서 바로 전화가 걸려요.' : '');
  };

  // 영상 주소에서 유튜브 / 비메오 번호 꺼내기
  function parseVideo(url) {
    const s = String(url || '').trim();
    let m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (m) return { kind: 'youtube', id: m[1] };
    m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: 'vimeo', id: m[1] };
    return null;
  }

  // SNS 표시 (상표 그림 대신 알아보기 쉬운 간단한 표시를 써요)
  const SNS = [
    ['instagram', '인스타그램', '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/></svg>'],
    ['youtube', '유튜브', '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none"/></svg>'],
    ['blog', '블로그', '<span class="b-sns-txt small">blog</span>'],
    ['kakao', '카카오톡 채널', '<svg viewBox="0 0 24 24"><path d="M12 5c-4.7 0-8 2.8-8 6.2 0 2.2 1.5 4.1 3.7 5.2L7 19.5l3.5-2.3c.5.1 1 .1 1.5.1 4.7 0 8-2.8 8-6.1S16.7 5 12 5z"/></svg>'],
    ['facebook', '페이스북', '<span class="b-sns-txt">f</span>'],
    ['naver', '네이버', '<span class="b-sns-txt">N</span>'],
    ['x', 'X', '<span class="b-sns-txt">X</span>']
  ];

  // 퀵메뉴 버튼 종류
  const QUICK_KINDS = {
    kakao: { name: '카톡 상담', hint: '카카오톡 채널 주소 (pf.kakao.com/…)', icon: '<svg viewBox="0 0 24 24"><path d="M12 5c-4.7 0-8 2.8-8 6.2 0 2.2 1.5 4.1 3.7 5.2L7 19.5l3.5-2.3c.5.1 1 .1 1.5.1 4.7 0 8-2.8 8-6.1S16.7 5 12 5z"/></svg>' },
    phone: { name: '전화', hint: '전화번호 (예: 010-1234-5678)', icon: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>' },
    top: { name: '맨 위로', hint: '', icon: '<svg viewBox="0 0 24 24"><path d="m6 14 6-6 6 6"/></svg>' },
    map: { name: '오시는 길', hint: '지도 주소 (네이버·카카오 지도 공유 주소)', icon: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>' },
    blog: { name: '블로그', hint: '블로그 주소', icon: '<span class="b-sns-txt small">blog</span>' },
    instagram: { name: '인스타그램', hint: '인스타그램 주소', icon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/></svg>' },
    link: { name: '바로가기', hint: '주소', icon: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>' }
  };


  // 메인 배너의 한 장 · 카드 한 장의 처음 내용
  const newSlide = (o) => Object.assign({ eyebrow: '', title: '', text: '', button: '자세히 보기', showButton: false, link: '', image: null, imgX: 50, imgY: 50, imgZoom: 1, imageM: null, bg: '' }, o || {});
  const newCard = (title, text) => ({ title, text, open: 'link', link: '', youtube: '', image: null, imgX: 50, imgY: 50, imgZoom: 1 });
  // 카드에 넣은 유튜브 주소 → 영상 번호 (표지 그림과 누르면 갈 곳에 써요)
  const cardVideo = (cd) => (cd.open === 'youtube' ? parseVideo(cd.youtube) : null);

  // 넘기는 블록(메인 배너 · 카드 슬라이드)이 함께 쓰는 화살표와 점
  const sliderControls = (p, n, cur) => `
          ${p.arrows ? `<button class="b-slider-arrow prev" type="button" aria-label="이전"><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button>
          <button class="b-slider-arrow next" type="button" aria-label="다음"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button>` : ''}
          ${p.dots ? `<div class="b-slider-dots">${Array.from({ length: n }, (_, i) => `<button type="button" class="${i === cur ? 'is-active' : ''}" aria-label="${i + 1}번째" data-go="${i}"></button>`).join('')}</div>` : ''}`;

  // 블록 위쪽 제목 · 작은 글 (카드 · 질문 · 후기 · 갤러리 · 가격표가 함께 써요)
  const sectionHead = (p, h) => (p.showHead ? `<div class="b-sec-head"><h2 data-edit="title" data-multiline>${h.text(p.title)}</h2>${p.sub ? `<p data-edit="sub" data-multiline>${h.text(p.sub)}</p>` : ''}</div>` : '');
  const headFields = (p, ui) => ui.section('제목', ui.check('showHead', p.showHead, '위에 제목 보이기') +
    (p.showHead ? ui.input('sub', p.sub, { label: '제목 아래 작은 글', placeholder: '비워 두면 안 보여요' }) : ''),
    p.showHead ? '제목은 페이지에서 두 번 눌러 고쳐요.' : '', 'content');
  // 사진 설명 글 (대체 글): 화면을 읽어주는 프로그램과 검색에 쓰여요
  const altField = (ui, path, v) => ui.input(path, v, { label: '사진 설명 글 <small>(눈이 불편한 분 · 검색용)</small>', small: true, placeholder: '예: 창가 자리에서 본 골목 풍경' });
  const newPhoto = () => ({ image: null, imgX: 50, imgY: 50, imgZoom: 1, caption: '' });

  // 설정의 장 · 카드 목록 (누르면 그 장이 페이지에 보여요)
  const itemList = (list, cur, path, h) => `<div class="slide-list">${list.map((it, i) => {
    const img = h.asset(it.image);
    return `<div class="slide-row${i === cur ? ' is-on' : ''}">
      <button class="slide-pick" data-action="slide-show" data-index="${i}" title="이 장 보기·고치기">
        <span class="slide-thumb" style="background:${h.ui.esc(it.bg || '#E6E1D6')}">${img ? `<img src="${img}" alt="">` : ''}</span>
        <span class="slide-name">${i + 1}. ${h.ui.esc(String(it.title || '').replace(/\n/g, ' ')).slice(0, 16)}</span>
      </button>
      ${h.ui.itemTools(path, i, list.length, 1)}
    </div>`;
  }).join('')}</div>`;

  const BLOCKS = {
    // =======================================================
    header: {
      content: ["logo","logoLink","logoImage","menu.*.label","menu.*.link","menu.*.children.*.label","menu.*.children.*.link","topLinks.*.label","topLinks.*.link","cta","ctaLink"],
      lists: [],
      name: '맨 위 메뉴',
      en: 'Header',
      zone: 'header',
      single: true,
      desc: '로고와 메뉴',
      thumb: `<div class="t t-header"><i class="t-dot"></i><i class="t-line w30"></i><span class="t-gap"></span><i class="t-line w12"></i><i class="t-line w12"></i><i class="t-line w12"></i></div>`,
      defaults: () => ({
        position: 'top',         // top: 맨 위 / left: 왼쪽 벽에 고정 / right: 오른쪽 벽에 고정
        layout: 'left',          // left: 로고 왼쪽 · 메뉴 오른쪽 / center: 로고 가운데 · 메뉴 아래
                                 // split: 로고 가운데 · 메뉴 양옆 / split-top: 위에 제목 · 아래 메뉴 양옆
        splitAt: null,           // 양옆 메뉴에서 왼쪽에 둘 메뉴 수 (null = 반씩)
        logoMode: 'text',        // text: 글자 / image: 그림 / both: 그림 + 글자
        logo: '우리 가게',
        logoImage: null,
        logoHeight: 36,
        logoAction: 'link',      // link: 누르면 이동 / menu: 누르면 전체 메뉴 열기
        logoLink: '#',
        menu: [
          { label: '홈', link: '#', children: [] },
          { label: '소개', link: '#', children: [] },
          { label: '메뉴', link: '#', children: [] },
          { label: '오시는 길', link: '#', children: [] }
        ],
        showTop: false,          // 두 줄 메뉴: 윗줄에 작은 링크 (로그인 · 고객센터 등)
        topLinks: [{ label: '로그인', link: '' }, { label: '고객센터', link: '' }],
        showCta: false,
        cta: '예약하기',
        ctaLink: '',
        sticky: false,
        look: 'plain',           // plain 기본 · line 아래 선 · float 떠 있는 막대 · pill 메뉴 알약 · under 메뉴 밑줄
        bg: ''                   // '' = 사이트 바탕색
      }),
      newItem: {
        'menu': () => ({ label: '새 메뉴', link: '#', children: [] }),
        'menu.*.children': () => ({ label: '하위 메뉴', link: '#' }),
        'topLinks': () => ({ label: '새 링크', link: '' })
      },
      migrate: (p) => {
        if (Array.isArray(p.menu)) p.menu = p.menu.map((m) => (typeof m === 'string' ? { label: m, link: '#', children: [] } : Object.assign({ link: '#', children: [] }, m)));
        return p;
      },
      // 벽에 고정하면 페이지 흐름에서 빠져 옆 칸(ib-side)으로 가요
      flow: (p) => !p.position || p.position === 'top',
      dropPath: () => null,
      render: (p, h) => {
        const img = h.asset(p.logoImage);
        const showImg = p.logoMode !== 'text' && img;
        const showText = p.logoMode !== 'image' || !img;
        const dark = isDark(p.bg);
        const logo = `<a class="b-logo"${p.logoAction === 'menu' ? ' href="#" data-open-menu' : h.href(p.logoLink)} aria-label="${h.attr(p.logo)}">
            ${showImg ? `<img src="${img}" alt="${h.attr(p.logo)}" style="height:${p.logoHeight}px">` : ''}
            ${showText ? `<span data-edit="logo">${h.text(p.logo)}</span>` : ''}
          </a>`;
        const navItem = (m, i) => `
            <div class="b-nav-item${m.children && m.children.length ? ' has-sub' : ''}">
              <a${h.href(m.link)} data-edit="menu.${i}.label">${h.text(m.label)}</a>
              ${m.children && m.children.length ? `<div class="b-sub">${m.children.map((c, j) => `<a${h.href(c.link)} data-edit="menu.${i}.children.${j}.label">${h.text(c.label)}</a>`).join('')}</div>` : ''}
            </div>`;
        const nav = p.menu.map(navItem).join('');
        // 양옆 메뉴: 왼쪽에 splitAt 개, 나머지는 오른쪽
        const cut = Math.max(0, Math.min(p.menu.length, p.splitAt == null || p.splitAt === '' ? Math.ceil(p.menu.length / 2) : Number(p.splitAt)));
        const navL = p.menu.slice(0, cut).map((m, i) => navItem(m, i)).join('');
        const navR = p.menu.slice(cut).map((m, i) => navItem(m, i + cut)).join('');
        const panel = p.menu.map((m) => `
            <div class="b-panel-group">
              <a class="b-panel-main"${h.href(m.link)}>${h.text(m.label)}</a>
              ${(m.children || []).map((c) => `<a${h.href(c.link)}>${h.text(c.label)}</a>`).join('')}
            </div>`).join('');
        // 두 줄 메뉴의 윗줄 (휴대폰에서는 ☰ 안 맨 아래로 들어가요)
        const tops = p.showTop && p.topLinks && p.topLinks.length
          ? p.topLinks.map((t, i) => `<a${h.href(t.link)} data-edit="topLinks.${i}.label">${h.text(t.label)}</a>`).join('<i class="b-top-sep" aria-hidden="true"></i>') : '';
        const topRow = tops ? `<div class="b-header-top"><nav class="b-top-links" aria-label="작은 메뉴">${tops}</nav></div>` : '';
        const side = p.position && p.position !== 'top';
        const sideBox = `<div class="b-header-side">
              ${p.showCta ? button(p, h, 'cta', 'ctaLink', 'small') : ''}
              <button class="b-menu-btn" type="button" aria-label="전체 메뉴 열기" aria-expanded="false" data-open-menu>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              </button>
            </div>`;
        const lay = side ? 'left' : p.layout;
        let rows;
        if (lay === 'split') {   // 로고 가운데, 메뉴는 양옆
          rows = `<div class="b-header-row">
            <div class="b-split-l"><nav class="b-nav">${navL}</nav></div>
            ${logo}
            <div class="b-split-r"><nav class="b-nav">${navR}</nav>${sideBox}</div>
          </div>`;
        } else if (lay === 'split-top') {   // 위에 제목, 아래 메뉴는 양옆
          rows = `<div class="b-header-row b-title-row">${logo}${sideBox}</div>
          <div class="b-header-row b-nav-row"><nav class="b-nav">${navL}</nav><nav class="b-nav">${navR}</nav></div>`;
        } else {
          rows = `<div class="b-header-row">
            ${logo}
            <nav class="b-nav">${nav}</nav>
            ${sideBox}
          </div>`;
        }
        return `
        <header class="b-header layout-${h.attr(p.layout)} look-${h.attr(p.look || 'plain')}${side ? ' pos-side' : ''}${dark ? ' is-dark' : ''}${topRow ? ' has-top' : ''}" ${bgStyle(h, p.bg)}>
          ${side ? '' : topRow}
          ${rows}
          ${side ? topRow : ''}
          <div class="b-panel">${panel}${tops ? `<div class="b-panel-top">${p.topLinks.map((t) => `<a${h.href(t.link)}>${h.text(t.label)}</a>`).join('')}</div>` : ''}</div>
        </header>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const img = h.asset(p.logoImage);
        const T = h.linkTargets();
        const menuRows = p.menu.map((m, i) => `
          <div class="list-card">
            <div class="list-row">
              ${ui.input(`menu.${i}.label`, m.label, { small: true, placeholder: '메뉴 이름' })}
              ${ui.itemTools('menu', i, p.menu.length, 1)}
            </div>
            ${ui.link(`menu.${i}.link`, m.link, T)}
            ${(m.children || []).map((c, j) => `
              <div class="child-card">
                <div class="list-row child">
                  <span class="child-mark">└</span>
                  ${ui.input(`menu.${i}.children.${j}.label`, c.label, { small: true, placeholder: '하위 메뉴' })}
                  ${ui.itemTools(`menu.${i}.children`, j, m.children.length, 0)}
                </div>
                ${ui.link(`menu.${i}.children.${j}.link`, c.link, T)}
              </div>`).join('')}
            <button class="link-btn" data-action="list-add" data-path="menu.${i}.children">${ui.icon.plus} 하위 메뉴 추가</button>
          </div>`).join('');
        return [
          ui.section('디자인', ui.looks('look', p.look || 'plain', [
              ['plain', '기본', '<i class="lp-logo"></i><i class="lp-sp"></i><i class="lp-m"></i><i class="lp-m"></i><i class="lp-m"></i>'],
              ['line', '아래 선', '<span class="lp-col"><span class="lp-r" style="width:100%"><i class="lp-logo"></i><i class="lp-sp"></i><i class="lp-m"></i><i class="lp-m"></i></span><i class="lp-hr"></i></span>'],
              ['float', '떠 있는 막대', '<span class="lp-box"><i class="lp-logo"></i><i class="lp-sp"></i><i class="lp-m"></i><i class="lp-m"></i></span>'],
              ['pill', '메뉴를 알약 모양', '<i class="lp-logo"></i><i class="lp-sp"></i><i class="lp-pill"></i><i class="lp-m"></i><i class="lp-m"></i>'],
              ['under', '고른 메뉴에 굵은 밑줄', '<i class="lp-logo"></i><i class="lp-sp"></i><i class="lp-m lp-u"></i><i class="lp-m"></i><i class="lp-m"></i>'],
              ['bold', '큰 글자 메뉴', '<i class="lp-logo"></i><i class="lp-sp"></i><i class="lp-m lp-b"></i><i class="lp-m lp-b"></i>']
            ]), '', 'look'),
          ui.section('메뉴 위치', ui.seg('position', p.position || 'top', [['top', '맨 위 가로'], ['left', '왼쪽 세로'], ['right', '오른쪽 세로']]),
            (p.position && p.position !== 'top') ? '벽에 붙이면 로고와 메뉴가 세로로 놓이고, 화면을 내려도 그 자리에 있어요. 휴대폰에서는 맨 위 ☰ 메뉴로 바뀌어요.' : '', 'look'),
          ui.section('모양', ((p.position || 'top') === 'top' ? ui.sub('메뉴 배치') + `<div class="layout-picks">${[
              ['left', '로고 왼쪽', '<i class="lp-logo"></i><i class="lp-sp"></i><i class="lp-m"></i><i class="lp-m"></i><i class="lp-m"></i>'],
              ['center', '로고 가운데 · 메뉴 아래', '<span class="lp-col"><i class="lp-logo"></i><span class="lp-r"><i class="lp-m"></i><i class="lp-m"></i><i class="lp-m"></i></span></span>'],
              ['split', '로고 가운데 · 메뉴 양옆', '<i class="lp-m"></i><i class="lp-m"></i><i class="lp-logo"></i><i class="lp-m"></i><i class="lp-m"></i>'],
              ['split-top', '위에 제목 · 아래 양옆', '<span class="lp-col"><i class="lp-logo"></i><span class="lp-r spread"><span><i class="lp-m"></i><i class="lp-m"></i></span><span><i class="lp-m"></i><i class="lp-m"></i></span></span></span>']
            ].map(([v, l, art]) => `<button class="layout-pick${p.layout === v ? ' is-on' : ''}" data-set="layout" data-value="${v}"><span class="lp-art">${art}</span>${l}</button>`).join('')}</div>` +
            (String(p.layout).startsWith('split') ? ui.range('splitAt', p.splitAt == null || p.splitAt === '' ? Math.ceil(p.menu.length / 2) : p.splitAt, 0, p.menu.length, 1, '왼쪽에 둘 메뉴 수', '개') : '') : '') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)) +
            ((p.position || 'top') === 'top' ? ui.check('sticky', p.sticky, '아래로 내려도 맨 위에 붙어 있기') : ''), '', 'look'),
          ui.section('로고',
            ui.seg('logoMode', p.logoMode, [['text', '글자'], ['image', '그림'], ['both', '그림+글자']]) +
            (p.logoMode !== 'text' ? ui.photo('logoImage', img, { alpha: true, contain: true, addLabel: '로고 그림 넣기' }) +
              (img ? ui.range('logoHeight', p.logoHeight, 20, 80, 2, '로고 크기', 'px') : '') : '') +
            ui.sub('로고를 누르면') +
            ui.seg('logoAction', p.logoAction, [['link', '이동하기'], ['menu', '전체 메뉴 열기']]) +
            (p.logoAction === 'link' ? ui.link('logoLink', p.logoLink, T) : ''),
            p.logoMode !== 'text' ? '투명한 배경의 PNG 로고도 그대로 넣을 수 있어요.' : '로고 글자는 페이지에서 두 번 눌러 고쳐요.'),
          ui.section('메뉴', menuRows + ui.addBtn('menu', '메뉴 추가', p.menu.length >= 7),
            '갈 곳에서 ‘이 사이트의 페이지’를 고르면 다른 페이지나 페이지 안의 블록으로 가요. 화면을 내리면 지금 보고 있는 블록의 메뉴가 굵게 표시돼요.'),
          ui.section('메뉴 위 작은 링크', ui.check('showTop', p.showTop, '메뉴 위에 작은 링크 줄 넣기 (예: 로그인 · 고객센터)') +
            (p.showTop ? p.topLinks.map((t, i) => `
              <div class="list-card">
                <div class="list-row">${ui.input(`topLinks.${i}.label`, t.label, { small: true, placeholder: '이름 (예: 로그인)' })}${ui.itemTools('topLinks', i, p.topLinks.length, 0)}</div>
                ${ui.link(`topLinks.${i}.link`, t.link, T)}
              </div>`).join('') + ui.addBtn('topLinks', '링크 추가', p.topLinks.length >= 5) : ''),
            p.showTop ? '로그인, 고객센터처럼 작은 링크를 메뉴 위 한 줄에 놓아요. 영문 페이지를 만들었다면 ‘English’ 링크를 넣어 언어 바꾸기 버튼으로 써요. 휴대폰에서는 ☰ 안 맨 아래에 들어가요.' : '', 'content'),
          ui.section('오른쪽 버튼', ui.check('showCta', p.showCta, '버튼 보이기') +
            (p.showCta ? ui.link('ctaLink', p.ctaLink, T, { label: '누르면 갈 곳' }) : ''), '', 'content')
        ].join('');
      }
    },

    // =======================================================
    // 메인 배너: 한 장이면 고정된 큰 사진, 두 장 이상이면 저절로 넘어가는 슬라이드
    banner: {
      content: ["slides.*.eyebrow","slides.*.title","slides.*.text","slides.*.button","slides.*.link","slides.*.image","slides.*.imageM","slides.*.imgX","slides.*.imgY","slides.*.imgZoom","slides.*.imgXm","slides.*.imgYm","slides.*.imgZoomm"],
      lists: ["slides"],
      name: '메인 배너',
      en: 'Main Banner',
      zone: 'banner',
      single: true,
      desc: '첫눈에 보이는 큰 사진 · 슬라이드',
      thumb: `<div class="t t-hero"><i class="t-line w50 light"></i><i class="t-line w30 light thin"></i><i class="t-btn"></i></div>`,
      defaults: () => ({
        slides: [newSlide({ title: '골목 끝, 따뜻한 커피 한 잔', text: '매일 아침 직접 볶은 원두로 내린 커피를 만나보세요.', button: '메뉴 보러 가기', showButton: true })],
        align: 'center',
        look: 'full',            // full 사진 가득 · split 글 왼쪽 · 사진 오른쪽 · card 둥근 상자 · bottom 글 아래쪽 · soft 연한 바탕
        overlay: 45,
        autoplay: true,
        interval: 5,
        arrows: true,
        dots: true
      }),
      newItem: {
        'slides': () => newSlide({ title: '새 이야기', text: '글을 두 번 눌러 고쳐주세요.' })
      },
      height: 480,               // 처음 높이 (크기 칸의 '보통')
      dropPath: (p, c, h) => `slides.${Math.min(h.view(c.id), p.slides.length - 1)}.image`,
      render: (p, h, c) => {
        const n = p.slides.length;
        const cur = Math.min(h.view(c.id), n - 1);
        const many = n > 1;
        return `
        <section class="b-banner look-${h.attr(p.look || 'full')} align-${h.attr(p.align)}${many ? '' : ' is-single'}"${many ? ` data-slider="fade" data-autoplay="${p.autoplay ? 1 : 0}" data-interval="${Number(p.interval) || 5}"` : ''} style="--overlay:${(Number(p.overlay) || 0) / 100}">
          ${p.slides.map((s, i) => {
            const img = h.asset(s.image);
            const imgM = h.asset(s.imageM);   // 휴대폰용 사진 (휴대폰은 따로 맞추기)
            const T = i === 0 ? 'h1' : 'h2';
            const mStyle = h.photoStyle({ imgX: s.imgXm == null ? 50 : s.imgXm, imgY: s.imgYm == null ? 50 : s.imgYm, imgZoom: s.imgZoomm || 1 });
            return `<div class="b-slide${i === cur ? ' is-active' : ''}${img ? ' has-image' : ''}${imgM ? ' has-m' : ''}" ${s.bg ? ` style="background-color:${h.attr(s.bg)}"` : ''}${many ? ` aria-hidden="${i === cur ? 'false' : 'true'}"` : ''}>
              ${img ? `<img class="b-slide-bg" src="${img}" alt="" style="${h.photoStyle(s)}">` : ''}
              ${imgM ? `<img class="b-slide-bg is-m" src="${imgM}" alt="" style="${mStyle}">` : ''}
              <div class="b-slide-inner">
                ${s.eyebrow ? `<span class="b-eyebrow" data-edit="slides.${i}.eyebrow">${h.text(s.eyebrow)}</span>` : ''}
                <${T} data-edit="slides.${i}.title" data-multiline>${h.text(s.title)}</${T}>
                <p data-edit="slides.${i}.text" data-multiline>${h.text(s.text)}</p>
                ${s.showButton ? `<a class="b-button"${h.href(s.link)} data-edit="slides.${i}.button">${h.text(s.button)}</a>` : ''}
              </div>
            </div>`;
          }).join('')}
          ${many ? sliderControls(p, n, cur) : ''}
        </section>`;
      },
      inspector: (p, h, c) => {
        const ui = h.ui;
        const own = h.block && h.block(c.id) && h.block(c.id).phoneOwn;
        const n = p.slides.length;
        const cur = Math.min(h.view(c.id), n - 1);
        const s = p.slides[cur];
        const base = `slides.${cur}`;
        const anyImg = p.slides.some((x) => h.asset(x.image));
        return [
          ui.section(`장 <small>${n}장${n > 1 ? ' · 넘어가는 슬라이드' : ' · 고정된 큰 사진'}</small>`, itemList(p.slides, cur, 'slides', h) + ui.addBtn('slides', '장 추가', n >= 8),
            n > 1 ? '목록에서 누른 장이 페이지에 보여요. 페이지의 화살표나 점을 눌러도 넘어가요.' : '한 장이면 고정된 큰 사진이에요. 장을 더하면 저절로 넘어가는 슬라이드가 돼요.', 'content'),
          ui.section(n > 1 ? `${cur + 1}번째 장` : '사진 · 버튼',
            (own ? ui.sub('PC 사진') : '') + ui.photo(`${base}.image`, h.asset(s.image), { frames: 'wide' }) +
            (own ? ui.sub('휴대폰용 사진 <b class="own-tag">따로</b> <small>(세로 사진 추천 · 비우면 PC 사진)</small>') + ui.photo(`${base}.imageM`, h.asset(s.imageM), { frames: 'ratio:9/16' }) : '') +
            ui.sub('작은 제목') + ui.input(`${base}.eyebrow`, s.eyebrow, { placeholder: '예: SINCE 2018 (비워 두면 안 보여요)' }) +
            ui.check(`${base}.showButton`, s.showButton, '버튼 보이기') +
            (s.showButton ? ui.link(`${base}.link`, s.link, h.linkTargets(), { label: '버튼을 누르면 갈 곳' }) : '') +
            ui.sub(`배경색${h.asset(s.image) ? ' <small>(사진이 없을 때)</small>' : ''}`) + ui.swatches(`${base}.bg`, s.bg, SITE('사이트 어두운 색').concat(PALETTE)),
            '제목과 글은 페이지에서 두 번 눌러 고쳐요. 큰 사진은 자동으로 알맞은 크기로 줄여서 넣어요.', 'content'),
          ui.section('디자인', ui.looks('look', p.look || 'full', [
              ['full', '사진 가득', '<span class="lp-ban dark"><i class="lp-m"></i></span>'],
              ['split', '글 왼쪽 · 사진 오른쪽', '<span class="lp-ban"><i class="lp-m"></i><b class="lp-photo half"></b></span>'],
              ['card', '둥근 상자', '<span class="lp-ban pad"><b class="lp-photo round"></b></span>'],
              ['bottom', '글은 아래쪽에', '<span class="lp-ban dark low"><i class="lp-m"></i></span>'],
              ['soft', '연한 바탕 · 사진은 작게', '<span class="lp-ban soft"><i class="lp-m"></i><b class="lp-photo small"></b></span>']
            ]), '어떤 디자인이든 사진 · 글은 그대로예요. 휴대폰에서는 위아래로 놓여요.', 'look'),
          ui.section('글 · 사진', ui.sub('글 정렬') + ui.seg('align', p.align, [['left', '왼쪽'], ['center', '가운데']]) +
            (anyImg ? ui.range('overlay', p.overlay, 0, 75, 5, '사진 어둡게', '%') : ''), '', 'look'),
          n > 1 ? ui.section('넘기기',
            ui.check('autoplay', p.autoplay, '저절로 넘기기') +
            (p.autoplay ? ui.range('interval', p.interval, 2, 12, 1, '넘기는 간격', '초') : '') +
            ui.check('arrows', p.arrows, '화살표 보이기') +
            ui.check('dots', p.dots, '아래 점 보이기'), '', 'look') : ''
        ].join('');
      }
    },

    // =======================================================
    // 카드 슬라이드: 본문에 여러 장의 카드를 한 줄로 보여주고 옆으로 넘겨요
    cards: {
      content: ["title","sub","cards.*.title","cards.*.text","cards.*.link","cards.*.youtube","cards.*.image","cards.*.imgX","cards.*.imgY","cards.*.imgZoom","cards.*.imgXm","cards.*.imgYm","cards.*.imgZoomm"],
      lists: ["cards"],
      name: '카드 슬라이드',
      en: 'Card Slider',
      zone: 'main',
      desc: '사진 카드 여러 장을 옆으로 넘겨요',
      thumb: `<div class="t t-cards"><span class="t-row"><i class="t-photo"></i><i class="t-photo"></i><i class="t-photo"></i></span><i class="t-line w60 thin"></i></div>`,
      defaults: () => ({
        showHead: true,
        title: '이런 것도 있어요',
        sub: '카드를 옆으로 넘겨 보세요.',
        cards: [
          newCard('첫 번째 카드', '짧은 설명을 적어주세요.'),
          newCard('두 번째 카드', '사진과 글을 함께 보여줘요.'),
          newCard('세 번째 카드', '누르면 갈 곳도 정할 수 있어요.'),
          newCard('네 번째 카드', '보이는 수보다 많으면 넘어가요.')
        ],
        perView: 3,
        rows: 1,                 // 1줄 · 2줄
        ratio: '4/3',
        showText: true,
        autoplay: false,
        interval: 5,
        arrows: true,
        dots: true,
        bg: ''
      }),
      newItem: { 'cards': () => newCard('새 카드', '설명을 적어주세요.') },
      dropPath: (p, c, h) => `cards.${Math.min(h.view(c.id), p.cards.length - 1)}.image`,
      render: (p, h, c) => {
        const n = p.cards.length;
        const cur = Math.min(h.view(c.id), n - 1);
        // 2줄이면 카드가 위아래로 두 장씩 한 칸에 들어가요
        const rows = Number(p.rows) === 2 ? 2 : 1;
        const cols = Math.ceil(n / rows);
        // 칸 수가 '보이는 수'보다 적으면 있는 칸으로 꽉 채워요 (3장씩 · 카드 2장 → 2장 너비)
        const per = Math.max(1, Math.min(Number(p.perView) || 3, cols));
        const cards = p.cards.map((cd, i) => {
          const img = h.asset(cd.image);
          const vid = cardVideo(cd);
          const thumb = img || (vid && vid.kind === 'youtube' ? `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg` : null);
          const media = thumb ? `<img src="${thumb}" alt="${h.attr(cd.alt || cd.title || '')}" style="${img ? h.photoStyle(cd) : ''}" loading="lazy">` : (h.editor ? h.placeholder(`cards.${i}.image`, vid ? '영상 표지를 불러올 수 없어요' : '사진 넣기') : '');
          const play = vid ? '<span class="b-card-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>' : '';
          const go = vid ? cd.youtube : cd.link;
          return `<a class="b-card${go ? '' : ' no-link'}${vid ? ' is-video' : ''}"${go ? h.href(go) : ''}${vid ? ' aria-label="유튜브 영상 보기"' : ''}>
            <span class="b-card-media" style="aspect-ratio:${h.attr(p.ratio)}">${media}${play}</span>
            <span class="b-card-body">
              <strong data-edit="cards.${i}.title">${h.text(cd.title)}</strong>
              ${p.showText ? `<span class="b-card-text" data-edit="cards.${i}.text" data-multiline>${h.text(cd.text)}</span>` : ''}
            </span>
          </a>`;
        }).join('');
        return `
        <section class="b-cards${isDark(p.bg) ? ' is-dark' : ''}" data-slider="track" data-autoplay="${p.autoplay ? 1 : 0}" data-interval="${Number(p.interval) || 5}" style="${p.bg ? `background:${h.attr(p.bg)};` : ''}--per-set:${per};--rows:${rows};--pos:${Math.floor(cur / rows)}">
          ${p.showHead ? `<div class="b-cards-head"><h2 data-edit="title" data-multiline>${h.text(p.title)}</h2>${p.sub ? `<p data-edit="sub" data-multiline>${h.text(p.sub)}</p>` : ''}</div>` : ''}
          <div class="b-cards-wrap">
            <div class="b-cards-viewport"><div class="b-cards-track">${cards}</div></div>
            ${sliderControls(p, cols, Math.floor(cur / rows))}
          </div>
        </section>`;
      },
      inspector: (p, h, c) => {
        const ui = h.ui;
        const n = p.cards.length;
        const cur = Math.min(h.view(c.id), n - 1);
        const cd = p.cards[cur];
        const base = `cards.${cur}`;
        return [
          ui.section(`카드 <small>${n}장</small>`, itemList(p.cards, cur, 'cards', h) + ui.addBtn('cards', '카드 추가', n >= 12),
            '목록에서 누른 카드가 페이지에 보여요. 카드 제목과 설명은 페이지에서 두 번 눌러 고쳐요.', 'content'),
          ui.section(`${cur + 1}번째 카드`,
            ui.sub('카드를 누르면') + ui.seg(`${base}.open`, cd.open || 'link', [['link', '페이지·주소로 이동'], ['youtube', '유튜브 영상']]) +
            (cd.open === 'youtube'
              ? ui.input(`${base}.youtube`, cd.youtube, { label: '유튜브 주소', placeholder: 'https://youtu.be/…' }) +
                (cd.youtube && !parseVideo(cd.youtube) ? '<p class="field-error">영상 주소를 알아볼 수 없어요. 유튜브의 ‘공유’ 버튼에서 주소를 복사해 주세요.</p>' : '')
              : h.ui.link(`${base}.link`, cd.link, h.linkTargets(), { label: '누르면 갈 곳' })) +
            ui.sub(cd.open === 'youtube' ? '표지 사진 <small>(넣지 않으면 유튜브 표지를 써요)</small>' : '사진') +
            ui.photo(`${base}.image`, h.asset(cd.image), { frames: 'ratio:' + p.ratio }),
            cd.open === 'youtube' ? '누르면 새 창에서 유튜브 영상이 열려요. 유튜브 표지는 인터넷에 연결돼 있을 때 보여요.' : '', 'content'),
          ui.section('제목', ui.check('showHead', p.showHead, '카드 위에 제목 보이기'), p.showHead ? '제목과 작은 글은 페이지에서 두 번 눌러 고쳐요.' : '', 'content'),
          ui.section('카드 모양',
            ui.sub('줄 수') + ui.seg('rows', Number(p.rows) === 2 ? 2 : 1, [[1, '1줄'], [2, '2줄 (위아래로 두 장씩)']]) +
            ui.sub(`옆으로 보이는 수${Math.ceil(n / (Number(p.rows) === 2 ? 2 : 1)) < Number(p.perView) ? ` <small>카드가 적어서 있는 만큼 넓게 채워요</small>` : ''}`) + ui.seg('perView', p.perView, [[1, '1장'], [2, '2장'], [3, '3장'], [4, '4장']]) +
            ui.sub('사진 비율') + ui.ratio('ratio', p.ratio, { dir: p.ratioDir }) +
            ui.check('showText', p.showText, '제목 아래 설명 보이기') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)),
            '좁은 블록에서는 옆으로 2장까지, 휴대폰에서는 1장씩 보여요.', 'look'),
          ui.section('넘기기',
            ui.check('autoplay', p.autoplay, '저절로 넘기기') +
            (p.autoplay ? ui.range('interval', p.interval, 2, 12, 1, '넘기는 간격', '초') : '') +
            ui.check('arrows', p.arrows, '화살표 보이기') +
            ui.check('dots', p.dots, '아래 점 보이기'),
            '카드 수가 한 번에 보이는 수보다 많을 때만 넘어가요.', 'look')
        ].join('');
      }
    },

    // =======================================================
    text: {
      content: ["eyebrow","title","body","button","link","image","alt","imgX","imgY","imgZoom","imgXm","imgYm","imgZoomm"],
      lists: [],
      name: '글 본문',
      en: 'Text',
      zone: 'main',
      desc: '제목과 글, 옆에 사진',
      thumb: `<div class="t t-text"><i class="t-line w40 bold"></i><i class="t-line w90 thin"></i><i class="t-line w80 thin"></i><i class="t-line w60 thin"></i></div>`,
      defaults: () => ({
        eyebrow: '',
        title: '저희 가게를 소개합니다',
        body: '2018년 작은 골목에서 시작한 동네 카페입니다. 계절마다 바뀌는 디저트와 정성껏 내린 커피로, 잠시 쉬어 가는 시간을 선물하고 싶습니다.\n\n단체 예약과 원두 구매는 전화로 문의해 주세요.',
        align: 'left',
        imagePos: 'none',        // none · left · right
        image: null, imgX: 50, imgY: 50, imgZoom: 1,
        ratio: '4/3',
        bg: '',
        showButton: false,
        button: '자세히 보기',
        link: ''
      }),
      dropPath: (p) => (p.imagePos === 'none' ? null : 'image'),
      render: (p, h) => {
        const img = h.asset(p.image);
        const wantMedia = p.imagePos === 'left' || p.imagePos === 'right';
        const media = wantMedia
          ? (img ? `<figure class="b-text-media" style="aspect-ratio:${h.attr(p.ratio)}"><img src="${img}" alt="${h.attr(p.alt || '')}" style="${h.photoStyle(p)}"></figure>`
            : (h.editor ? `<figure class="b-text-media" style="aspect-ratio:${h.attr(p.ratio)}">${h.placeholder('image', '사진 넣기')}</figure>` : ''))
          : '';
        const pos = media ? p.imagePos : 'none';
        return `
        <section class="b-text align-${h.attr(p.align)} img-${pos}${isDark(p.bg) ? ' is-dark' : ''}" ${bgStyle(h, p.bg)}>
          <div class="b-text-wrap">
            ${media}
            <div class="b-text-content">
              ${p.eyebrow ? `<span class="b-eyebrow" data-edit="eyebrow">${h.text(p.eyebrow)}</span>` : ''}
              <h2 data-edit="title" data-multiline>${h.text(p.title)}</h2>
              <div class="b-text-body" data-edit="body" data-multiline>${h.text(p.body)}</div>
              ${p.showButton ? button(p, h, 'button', 'link', 'outline') : ''}
            </div>
          </div>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        return [
          ui.section('사진', ui.seg('imagePos', p.imagePos, [['none', '없음'], ['left', '왼쪽'], ['right', '오른쪽']]) +
            (p.imagePos !== 'none' ? ui.sub('사진 비율') + ui.ratio('ratio', p.ratio, { dir: p.ratioDir }) +
              ui.photo('image', h.asset(p.image), { frames: 'ratio:' + p.ratio }) + altField(ui, 'alt', p.alt) : ''),
            p.imagePos !== 'none' ? '휴대폰이나 좁은 블록에서는 사진이 글 위로 올라가요.' : ''),
          ui.section('글', ui.sub('정렬') + ui.seg('align', p.align, [['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']]) +
            ui.sub('작은 제목') + ui.input('eyebrow', p.eyebrow, { placeholder: '예: ABOUT US (비워 두면 안 보여요)' }),
            '글을 고칠 때 Shift + Enter 를 누르면 줄이 바뀌어요.'),
          ui.section('바탕색', ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look'),
          buttonFields(p, ui, h)
        ].join('');
      }
    },

    // =======================================================
    image: {
      content: ["image","alt","caption","link","imgX","imgY","imgZoom","imgXm","imgYm","imgZoomm"],
      lists: [],
      name: '사진',
      en: 'Image',
      zone: 'main',
      desc: '사진 한 장',
      thumb: `<div class="t t-image"><i class="t-photo"></i></div>`,
      defaults: () => ({
        image: null, imgX: 50, imgY: 50, imgZoom: 1,
        ratio: '16/9',          // auto = 원래 비율
        alt: '',                // 사진 설명 글 (눈이 불편한 분 · 검색용)
        padded: true,
        rounded: false,
        showCaption: false,
        caption: '사진 설명을 적어주세요',
        link: '',
        bg: ''
      }),
      dropPath: () => 'image',
      render: (p, h) => {
        const img = h.asset(p.image);
        if (!img && !h.editor) return '<section class="b-image is-empty"></section>';
        const auto = p.ratio === 'auto';
        const fill = p.ratio === 'fill';   // 칸에 꽉 채우기: 블록 높이만큼 사진을 키워요
        const ar = fill ? '' : ` style="aspect-ratio:${auto ? '16/9' : h.attr(p.ratio)}"`;
        const inner = img
          ? (auto ? `<img class="b-image-natural" src="${img}" alt="${h.attr(p.alt || (p.showCaption ? p.caption : ''))}">`
            : `<div class="b-image-frame"${ar}><img src="${img}" alt="${h.attr(p.alt || (p.showCaption ? p.caption : ''))}" style="${h.photoStyle(p)}"></div>`)
          : `<div class="b-image-frame"${ar}>${h.placeholder('image', '사진 넣기')}</div>`;
        const link = img && p.link ? `<a class="b-image-link"${h.href(p.link)}>${inner}</a>` : inner;
        return `
        <section class="b-image${fill ? ' is-fill' : ''}${p.padded ? ' is-padded' : ''}${p.rounded ? ' is-rounded' : ''}${p.narrow ? ' is-narrow' : ''}${isDark(p.bg) ? ' is-dark' : ''}" ${bgStyle(h, p.bg)}>
          <figure class="b-image-fig">
            ${link}
            ${p.showCaption ? `<figcaption data-edit="caption" data-multiline>${h.text(p.caption)}</figcaption>` : ''}
          </figure>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        return [
          ui.section('사진', ui.sub('비율') + ui.ratio('ratio', p.ratio, { auto: true, fill: true, dir: p.ratioDir }) +
            ui.photo('image', h.asset(p.image), { frames: p.ratio === 'auto' ? '' : p.ratio === 'fill' ? 'fill' : 'ratio:' + p.ratio }) +
            altField(ui, 'alt', p.alt),
            p.ratio === 'fill' ? '블록 크기에 맞춰 사진을 키워서 빈 곳 없이 채워요. 잘린 부분은 ‘위치 맞추기’로 골라요. 가운데 좁게 놓으려면 모양 탭의 ‘양옆 여백’을 써요.'
              : '세로 사진을 넣으면 저절로 세로 비율로 바꿔줘요. 가운데 좁게 놓으려면 모양 탭의 ‘양옆 여백’을 써요.'),
          ui.section('모양', ui.check('padded', p.padded, '둘레에 여백 두기') +
            ui.check('rounded', p.rounded, '모서리 둥글게') +
            ui.check('showCaption', p.showCaption, '아래에 설명 글 보이기') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look'),
          ui.section('누르면 갈 곳', ui.link('link', p.link, h.linkTargets()))
        ].join('');
      }
    },

    // =======================================================
    video: {
      content: ["url","video","caption"],
      lists: [],
      name: '영상',
      en: 'Video',
      zone: 'main',
      desc: '유튜브 영상이나 영상 파일',
      thumb: `<div class="t t-video"><i class="t-play"></i></div>`,
      defaults: () => ({
        source: 'youtube',       // youtube · file
        url: '',
        video: null,
        ratio: '16/9',
        autoplay: false,
        loop: false,
        controls: true,
        padded: true,
        showCaption: false,
        caption: '영상 설명을 적어주세요',
        bg: ''
      }),
      dropPath: () => null,
      render: (p, h) => {
        const fill = p.ratio === 'fill' && p.source === 'file';   // 칸에 꽉 채우기 (영상 파일만)
        const ratio = h.attr(p.ratio === 'fill' ? '16/9' : p.ratio);
        let inner = '';
        if (p.source === 'file') {
          const src = h.asset(p.video);
          if (src) {
            inner = `<video src="${src}" ${p.controls ? 'controls' : ''} ${p.autoplay && !h.editor ? 'autoplay muted' : ''} ${p.loop ? 'loop' : ''} playsinline preload="metadata"></video>`;
          }
        } else {
          const v = parseVideo(p.url);
          if (v && h.editor) {
            // 편집 화면에서는 가볍게 표지 그림만 보여줘요
            inner = `<div class="b-video-cover">${v.kind === 'youtube' ? `<img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="">` : ''}<span class="b-video-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><span class="b-video-tag">${v.kind === 'youtube' ? '유튜브' : '비메오'} 영상</span></div>`;
          } else if (v) {
            const q = [];
            if (v.kind === 'youtube') {
              q.push('rel=0', 'playsinline=1');
              if (p.autoplay) q.push('autoplay=1', 'mute=1');
              if (p.loop) q.push('loop=1', `playlist=${v.id}`);
              if (!p.controls) q.push('controls=0');
              inner = `<iframe src="https://www.youtube-nocookie.com/embed/${v.id}?${q.join('&')}" title="유튜브 영상" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
            } else {
              if (p.autoplay) q.push('autoplay=1', 'muted=1');
              if (p.loop) q.push('loop=1');
              if (!p.controls) q.push('controls=0');
              inner = `<iframe src="https://player.vimeo.com/video/${v.id}?${q.join('&')}" title="비메오 영상" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
            }
          }
        }
        if (!inner && !h.editor) return '<section class="b-video is-empty"></section>';
        if (!inner) inner = h.placeholder(p.source === 'file' ? 'video' : null, p.source === 'file' ? '영상 파일 넣기' : '오른쪽 설정에 유튜브 주소를 넣어주세요', 'video');
        return `
        <section class="b-video${fill ? ' is-fill' : ''}${p.padded ? ' is-padded' : ''}${p.narrow ? ' is-narrow' : ''}${isDark(p.bg) ? ' is-dark' : ''}" ${bgStyle(h, p.bg)}>
          <figure class="b-video-fig">
            <div class="b-video-frame"${fill ? '' : ` style="aspect-ratio:${ratio}"`}>${inner}</div>
            ${p.showCaption ? `<figcaption data-edit="caption" data-multiline>${h.text(p.caption)}</figcaption>` : ''}
          </figure>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const v = parseVideo(p.url);
        const fileSrc = h.asset(p.video);
        return [
          ui.section('영상', ui.seg('source', p.source, [['youtube', '유튜브 주소'], ['file', '영상 파일']]) +
            (p.source === 'youtube'
              ? ui.input('url', p.url, { label: '유튜브 · 비메오 주소', placeholder: 'https://youtu.be/…' }) +
                (p.url && !v ? '<p class="field-error">영상 주소를 알아볼 수 없어요. 유튜브의 ‘공유’ 버튼에서 주소를 복사해 주세요.</p>' : '')
              : (fileSrc
                ? `<div class="photo-preview"><video src="${fileSrc}" muted preload="metadata"></video></div>
                   <div class="row-btns"><button class="btn" data-action="video-pick" data-path="video">${ui.icon.video} 바꾸기</button><button class="btn btn-ghost" data-action="set-null" data-path="video">빼기</button></div>`
                : `<button class="photo-drop" data-action="video-pick" data-path="video">${ui.icon.video}<strong>영상 파일 넣기</strong><span>MP4 파일, 30MB까지</span></button>`)) +
            `<p class="photo-rec">권장 크기 가로 1920 × 1080 (16:9) · 세로 1080 × 1920 (9:16)</p>`,
            p.source === 'youtube' ? '편집 화면에서는 표지만 보이고, 새 탭 미리보기와 내려받은 홈페이지에서 재생돼요.' : '영상 파일은 크기가 커서, 짧은 영상은 파일로, 긴 영상은 유튜브에 올려 주소를 넣는 걸 추천해요.'),
          ui.section('재생', ui.sub('비율') + ui.ratio('ratio', p.ratio === 'fill' && p.source !== 'file' ? '16/9' : p.ratio, { dir: p.ratioDir, fill: p.source === 'file' }) +
            (p.source === 'file' ? '' : '<p class="field-help">유튜브 영상은 화면 비율을 바꿀 수 없어서 ‘칸에 꽉 채우기’는 영상 파일에만 있어요.</p>') +
            ui.check('autoplay', p.autoplay, '저절로 재생 (소리 없이)') +
            ui.check('loop', p.loop, '반복 재생') +
            ui.check('controls', p.controls, '재생 버튼 보이기'), '', 'look'),
          ui.section('모양', ui.check('padded', p.padded, '둘레에 여백 두기') +
            ui.check('showCaption', p.showCaption, '아래에 설명 글 보이기') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    footer: {
      content: ["name","copy","biz.company","biz.owner","biz.bizNo","biz.mailOrderNo","biz.address","biz.phone","biz.email","info.*","socials.instagram","socials.youtube","socials.blog","socials.kakao","socials.facebook","socials.naver","socials.x","columns.*.title","columns.*.links.*.label","columns.*.links.*.url","bottomLinks.*.label","bottomLinks.*.url","selectLabel","selectOptions.*.label","selectOptions.*.url"],
      lists: ["info","columns.*.links","bottomLinks","selectOptions"],
      name: '맨 아래 정보',
      en: 'Footer',
      zone: 'footer',
      single: true,
      desc: '회사 정보·링크·SNS',
      thumb: `<div class="t t-footer"><i class="t-line w40 light"></i><i class="t-line w70 light thin"></i><i class="t-line w50 light thin"></i></div>`,
      defaults: () => ({
        layout: 'simple',        // simple · detail
        theme: 'dark',           // dark · light
        name: '우리 가게',
        biz: newBiz(),           // 사업자 정보 (쓴 칸만 보여요)
        bizCheck: true,          // '사업자 정보 확인'(공정거래위원회) 링크
        info: [],                // 그 밖의 정보 줄 (영업시간 · 팩스 등)
        copy: '© 우리 가게. All rights reserved.',
        socials: { instagram: '', youtube: '', blog: '', kakao: '', facebook: '', naver: '', x: '' },
        badges: [],
        columns: [
          { title: '안내', links: [{ label: '소개', url: '' }, { label: '오시는 길', url: '' }] },
          { title: '고객센터', links: [{ label: '자주 묻는 질문', url: '' }, { label: '문의하기', url: '' }] }
        ],
        bottomLinks: [
          { label: '이용약관', url: '', bold: false },
          { label: '개인정보 처리 방침', url: '', bold: true }
        ],
        showSelect: false,
        selectLabel: '패밀리 사이트',
        selectOptions: [{ label: '본점', url: '' }, { label: '2호점', url: '' }]
      }),
      newItem: {
        'info': () => '새 정보 | 내용을 적어주세요',
        'columns': () => ({ title: '새 묶음', links: [{ label: '새 링크', url: '' }] }),
        'columns.*.links': () => ({ label: '새 링크', url: '' }),
        'bottomLinks': () => ({ label: '새 링크', url: '', bold: false }),
        'selectOptions': () => ({ label: '새 항목', url: '' })
      },
      // 옛날 바닥글(line1, line2) → 지금 모양(info 줄 목록), 사업자 정보 칸 채우기
      migrate: (p) => {
        if (!Array.isArray(p.info)) {
          p.info = [p.line1, p.line2].filter(Boolean).map((s) => String(s).replace(/ · /g, ' | '));
          delete p.line1; delete p.line2;
        }
        p.biz = Object.assign(newBiz(), p.biz && typeof p.biz === 'object' ? p.biz : {});
        if (p.bizCheck == null) p.bizCheck = true;
        return p;
      },
      dropPath: () => null,
      render: (p, h) => {
        const z = p.biz || {};
        const sep = '<i class="b-sep">|</i>';
        const part = (label, v) => (v ? `<span>${label} ${h.text(v)}</span>` : '');
        const no = String(z.bizNo || '').replace(/[^0-9]/g, '');
        const check = p.bizCheck && no.length === 10 && !/^0+$/.test(no) ? `<a class="b-biz-check" href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${no}" target="_blank" rel="noopener">사업자 정보 확인</a>` : '';
        const bizLines = [
          [part('상호', z.company), part('대표', z.owner), part('사업자등록번호', z.bizNo) + (check ? ' ' + check : ''), part('통신판매업 신고번호', z.mailOrderNo)],
          [z.address && p.mapLink !== false ? `<span>주소 <a class="b-biz-map" href="https://map.naver.com/p/search/${encodeURIComponent(z.address)}" target="_blank" rel="noopener" title="네이버 지도에서 보기">${h.text(z.address)}</a></span>` : part('주소', z.address),
            z.phone ? `<span>전화 <a class="b-biz-tel"${h.href(z.phone)}>${h.text(z.phone)}</a></span>` : '', part('이메일', z.email)]
        ].map((row) => row.filter(Boolean)).filter((row) => row.length).map((row) => `<p class="b-biz">${row.join(sep)}</p>`).join('');
        const KOGL = { 1: '출처표시', 2: '출처표시 · 상업적 이용금지', 3: '출처표시 · 변경금지', 4: '출처표시 · 상업적 이용금지 · 변경금지' };
        const kogl = p.kogl && KOGL[p.kogl] ? `<p class="b-kogl"><a href="https://www.kogl.or.kr/info/license.do" target="_blank" rel="noopener"><b>공공누리</b> 제${p.kogl}유형: ${KOGL[p.kogl]}</a></p>` : '';
        const lines = bizLines + kogl + p.info.map((line, i) => `<p data-edit="info.${i}">${h.text(line).replace(/\|/g, sep)}</p>`).join('')
          + (h.editor && !bizLines && !p.info.length ? '<p class="b-biz-empty">오른쪽 설정에서 사업자 정보를 적어 주세요 (이 안내는 홈페이지에 안 보여요)</p>' : '');
        const sns = SNS.filter(([k]) => p.socials && p.socials[k]).map(([k, label, icon]) =>
          `<a class="b-sns"${h.href(p.socials[k])} aria-label="${label}" title="${label}">${icon}</a>`).join('');
        const badges = (p.badges || []).map((id) => h.asset(id)).filter(Boolean).map((src) => `<img src="${src}" alt="인증 마크">`).join('');
        const info = `
            <div class="b-footer-info">
              <strong data-edit="name">${h.text(p.name)}</strong>
              <div class="b-footer-lines">${lines}</div>
              <small data-edit="copy">${h.text(p.copy)}</small>
              ${sns ? `<div class="b-footer-sns">${sns}</div>` : ''}
              ${badges ? `<div class="b-footer-badges">${badges}</div>` : ''}
            </div>`;
        if (p.layout !== 'detail') {
          return `<footer class="b-footer layout-${p.layout === 'center' ? 'center' : 'simple'} theme-${h.attr(p.theme)}"><div class="b-footer-wrap">${info}</div></footer>`;
        }
        const cols = p.columns.map((c, ci) => `
            <div class="b-footer-col">
              <h4 data-edit="columns.${ci}.title">${h.text(c.title)}</h4>
              <ul>${c.links.map((l, li) => `<li><a${h.href(l.url)} data-edit="columns.${ci}.links.${li}.label">${h.text(l.label)}</a></li>`).join('')}</ul>
            </div>`).join('');
        const bottom = p.bottomLinks.map((l, i) => `<a${h.href(l.url)} class="${l.bold ? 'is-bold' : ''}" data-edit="bottomLinks.${i}.label">${h.text(l.label)}</a>`).join('');
        const select = p.showSelect ? `
            <select class="b-footer-select" aria-label="${h.attr(p.selectLabel)}" data-go-select>
              <option value="">${h.text(p.selectLabel)}</option>
              ${p.selectOptions.map((o) => { const u = h.hrefValue(o.url); return `<option value="${h.attr(u)}">${h.text(o.label)}</option>`; }).join('')}
            </select>` : '';
        return `
        <footer class="b-footer layout-detail theme-${h.attr(p.theme)}">
          <div class="b-footer-wrap">
            <div class="b-footer-top">
              ${info}
              ${cols ? `<div class="b-footer-cols" style="--cols:${p.columns.length}">${cols}</div>` : ''}
            </div>
            ${bottom || select ? `<div class="b-footer-bottom"><nav class="b-footer-legal">${bottom}</nav>${select}</div>` : ''}
          </div>
        </footer>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const detail = p.layout === 'detail';
        const T = h.linkTargets();
        const infoRows = p.info.map((line, i) => `<div class="list-row">${ui.input(`info.${i}`, line, { small: true })}${ui.itemTools('info', i, p.info.length, 0)}</div>`).join('');
        const sns = SNS.map(([k, label]) => `<div class="sns-row"><span>${label}</span>${ui.input(`socials.${k}`, (p.socials || {})[k], { small: true, placeholder: '주소 (비우면 안 보여요)' })}</div>`).join('');
        const badges = (p.badges || []).map((id, i) => {
          const src = h.asset(id);
          return `<div class="badge-item">${src ? `<img src="${src}" alt="">` : ''}<button class="icon-btn danger" data-action="list-remove" data-path="badges" data-index="${i}" title="빼기">${ui.icon.x}</button></div>`;
        }).join('');
        const cols = p.columns.map((c, ci) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`columns.${ci}.title`, c.title, { small: true, placeholder: '묶음 제목' })}${ui.itemTools('columns', ci, p.columns.length, 0)}</div>
            ${c.links.map((l, li) => `
              <div class="list-row child">
                ${ui.input(`columns.${ci}.links.${li}.label`, l.label, { small: true, placeholder: '링크 이름' })}
                ${ui.itemTools(`columns.${ci}.links`, li, c.links.length, 0)}
              </div>
              ${ui.link(`columns.${ci}.links.${li}.url`, l.url, T)}`).join('')}
            <button class="link-btn" data-action="list-add" data-path="columns.${ci}.links">${ui.icon.plus} 링크 추가</button>
          </div>`).join('');
        const bottom = p.bottomLinks.map((l, i) => `
          <div class="list-row">
            ${ui.input(`bottomLinks.${i}.label`, l.label, { small: true, placeholder: '이름' })}
            <label class="mini-check" title="굵게"><input type="checkbox" data-field="bottomLinks.${i}.bold" ${l.bold ? 'checked' : ''}>굵게</label>
            ${ui.itemTools('bottomLinks', i, p.bottomLinks.length, 0)}
          </div>
          ${ui.link(`bottomLinks.${i}.url`, l.url, T)}`).join('');
        const opts = p.selectOptions.map((o, i) => `
          <div class="list-row">
            ${ui.input(`selectOptions.${i}.label`, o.label, { small: true, placeholder: '이름' })}
            ${ui.itemTools('selectOptions', i, p.selectOptions.length, 1)}
          </div>
          ${ui.link(`selectOptions.${i}.url`, o.url, T)}`).join('');
        return [
          ui.section('디자인', ui.looks('layout', p.layout, [
              ['simple', '간단하게', '<span class="lp-col left"><i class="lp-logo"></i><i class="lp-m w2"></i><i class="lp-m"></i></span>'],
              ['center', '가운데 정렬', '<span class="lp-col"><i class="lp-logo"></i><i class="lp-m w2"></i><i class="lp-m"></i></span>'],
              ['detail', '자세하게 (링크 묶음)', '<span class="lp-r spread" style="width:100%"><span class="lp-col left"><i class="lp-logo"></i><i class="lp-m"></i></span><span class="lp-col"><i class="lp-m"></i><i class="lp-m"></i></span><span class="lp-col"><i class="lp-m"></i><i class="lp-m"></i></span></span>']
            ]) + ui.sub('색') + ui.seg('theme', p.theme, [['dark', '어둡게'], ['light', '밝게'], ['soft', '연하게'], ['point', '포인트색']]),
            detail ? '자세하게: 회사 정보, 링크 묶음, 아래 줄 링크와 선택 상자까지 넣을 수 있어요.' : '', 'look'),
          ui.section('사업자 정보', BIZ_FIELDS.map(([k, label, ph]) => ui.input(`biz.${k}`, (p.biz || {})[k], { label, placeholder: ph, small: true })).join('') +
            ui.check('bizCheck', p.bizCheck, '‘사업자 정보 확인’ 링크 보이기 (공정거래위원회)') +
            ui.check('mapLink', p.mapLink !== false, '주소를 누르면 네이버 지도가 열리게'),
            '인터넷으로 물건 · 서비스를 파는 곳이라면 상호, 대표자, 사업자등록번호, 통신판매업 신고번호, 주소, 연락처를 꼭 적어야 해요. 쓴 칸만 보여요. 개인정보 처리방침 · 이용약관 페이지 견본도 이 정보로 채워져요.', 'content'),
          ui.section('그 밖의 정보 줄', infoRows + ui.addBtn('info', '줄 추가', p.info.length >= 8),
            '영업시간 · 팩스처럼 더 적을 것이 있으면 줄을 더해요. 한 줄 안에서 <b>|</b> 로 나누면 얇은 구분선이 들어가요.'),
          ui.section('SNS', sns, '주소를 넣은 것만 아이콘으로 보여요.'),
          ui.section('공공누리 (공공기관)', ui.seg('kogl', p.kogl || '', [['', '안 씀'], ['1', '1유형'], ['2', '2유형'], ['3', '3유형'], ['4', '4유형']]),
            '공공기관 홈페이지 글 · 사진을 다른 사람이 어떻게 써도 되는지 알려주는 표시예요. 1유형: 출처만 밝히면 자유롭게 · 2유형: 돈 버는 데는 못 써요 · 3유형: 고쳐 쓰면 안 돼요 · 4유형: 2 + 3.'),
          ui.section('인증 마크 · 로고', `<div class="badge-list">${badges}</div>` +
            `<button class="btn btn-ghost" data-action="image-pick" data-path="badges" data-push="1" data-alpha="1" ${(p.badges || []).length >= 6 ? 'disabled' : ''}>${ui.icon.plus} 그림 추가</button>`,
            '인증 마크, 협력사 로고처럼 작은 그림을 넣어요.'),
          detail ? ui.section('링크 묶음', cols + ui.addBtn('columns', '묶음 추가', p.columns.length >= 4), '최대 4개까지 넣을 수 있어요.') : '',
          detail ? ui.section('아래 줄 링크', bottom + ui.addBtn('bottomLinks', '링크 추가', p.bottomLinks.length >= 8), '이용약관, 개인정보 처리 방침처럼 맨 아래에 놓이는 링크예요.') : '',
          detail ? ui.section('다른 사이트 고르기 상자', ui.check('showSelect', p.showSelect, '오른쪽에 고르기 상자 보이기 (예: 패밀리 사이트 · 다른 지점)') +
            (p.showSelect ? ui.input('selectLabel', p.selectLabel, { label: '처음 보이는 글자' }) + ui.sub('항목') + opts + ui.addBtn('selectOptions', '항목 추가', p.selectOptions.length >= 10) : ''),
            p.showSelect ? '항목을 고르면 적어둔 주소로 이동해요. 패밀리 사이트, 다른 지점, 언어 선택 등에 써요.' : '', 'more') : ''
        ].join('');
      }
    },

    // =======================================================
    quick: {
      content: ["items.*.label","items.*.url","itemsM.*.label","itemsM.*.url"],
      lists: ["items","itemsM"],
      name: '퀵메뉴',
      en: 'Quick Menu',
      zone: 'float',
      single: true,
      desc: '화면 옆에 떠 있는 버튼',
      thumb: `<div class="t t-quick"><i></i><i></i><i></i></div>`,
      defaults: () => ({
        side: 'right',           // right · left
        place: 'bottom',         // bottom · middle
        look: 'circle',          // circle: 동그라미 / pill: 글자 함께
        phoneBar: false,         // 휴대폰에서는 화면 맨 아래 탭바로
        phoneSame: true,         // 휴대폰도 PC와 같은 버튼 (끄면 itemsM)
        itemsM: [],
        items: [
          { kind: 'kakao', label: '카톡 상담', url: '' },
          { kind: 'phone', label: '전화하기', url: '010-0000-0000' },
          { kind: 'top', label: '맨 위로', url: '' }
        ]
      }),
      newItem: { 'items': () => ({ kind: 'link', label: '바로가기', url: '' }), 'itemsM': () => ({ kind: 'link', label: '바로가기', url: '' }) },
      flow: () => false,         // 페이지 흐름에 들어가지 않고 화면 위에 떠 있어요
      dropPath: () => null,
      render: (p, h) => {
        // 전화 버튼: PC에서는 누르면 번호를 말풍선으로 보여주고, 휴대폰에서는 바로 전화가 걸려요
        const btn = (it, i, list, cls) => {
          const k = QUICK_KINDS[it.kind] || QUICK_KINDS.link;
          const href = it.kind === 'top' ? ' href="#top" data-go-top' : h.href(it.url);
          const tel = it.kind === 'phone' && it.url ? `<span class="b-quick-tip">${h.text(it.url)}</span>` : '';
          return `<a class="b-quick-btn k-${h.attr(it.kind)}${cls}"${href}${tel ? ' data-tel' : ''} title="${h.attr(it.label)}" aria-label="${h.attr(it.label)}${it.kind === 'phone' && it.url ? ' ' + h.attr(it.url) : ''}">
            <span class="b-quick-ico">${k.icon}</span><span class="b-quick-label" data-edit="${list}.${i}.label">${h.text(it.label)}</span>${tel}
          </a>`;
        };
        const own = !p.phoneSame && p.itemsM && p.itemsM.length;
        const items = (p.items || []).slice(0, 5).map((it, i) => btn(it, i, 'items', own ? ' only-pc' : '')).join('') +
          (own ? p.itemsM.slice(0, 5).map((it, i) => btn(it, i, 'itemsM', ' only-m')).join('') : '');
        return `<div class="b-quick side-${h.attr(p.side)} place-${h.attr(p.place)} look-${h.attr(p.look)}${p.phoneBar ? ' phone-bar' : ''}">${items}</div>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = (list) => (p[list] || []).map((it, i) => `
          <div class="list-card">
            <div class="list-row">
              <select class="input small" data-field="${list}.${i}.kind" aria-label="종류">
                ${Object.entries(QUICK_KINDS).map(([k, v]) => `<option value="${k}" ${it.kind === k ? 'selected' : ''}>${v.name}</option>`).join('')}
              </select>
              ${ui.itemTools(list, i, p[list].length, 1)}
            </div>
            ${ui.input(`${list}.${i}.label`, it.label, { small: true, placeholder: '이름' })}
            ${it.kind === 'top' ? '' : it.kind === 'link' ? ui.link(`${list}.${i}.url`, it.url, h.linkTargets()) : ui.input(`${list}.${i}.url`, it.url, { small: true, placeholder: QUICK_KINDS[it.kind] ? QUICK_KINDS[it.kind].hint : '주소' })}
          </div>`).join('');
        const own = !p.phoneSame;
        return [
          ui.section(own ? 'PC 버튼 <small>최대 5개</small>' : '버튼 <small>최대 5개</small>', rows('items') + ui.addBtn('items', '버튼 추가', p.items.length >= 5),
            '전화 버튼은 PC에서 누르면 번호가 말풍선으로 보이고, 휴대폰에서는 바로 전화가 걸려요.'),
          ui.section('휴대폰 버튼', ui.check('phoneSame', !own ? true : false, '휴대폰도 PC와 같은 버튼') +
            (own ? rows('itemsM') + ui.addBtn('itemsM', '버튼 추가', (p.itemsM || []).length >= 5) : ''),
            own ? '휴대폰에서는 이 버튼들이 보여요. 휴대폰 보기로 바꿔서 확인해 보세요.' : '끄면 휴대폰에서 보일 버튼을 따로 정할 수 있어요 (최대 5개).'),
          ui.section('나오는 쪽', ui.seg('side', p.side, [['left', '왼쪽'], ['right', '오른쪽']]) +
            ui.sub('높이') + ui.seg('place', p.place, [['middle', '가운데'], ['bottom', '아래']]),
            '실제 홈페이지에서는 화면을 내려도 항상 그 자리에 떠 있어요. 편집 화면에서는 페이지 오른쪽 아래에 보여요.', 'look'),
          ui.section('모양', ui.seg('look', p.look, [['circle', '동그라미'], ['pill', '이름 함께']]), '', 'look'),
          ui.section('휴대폰', ui.check('phoneBar', p.phoneBar, '휴대폰에서는 화면 아래 탭바로 보이기'),
            '휴대폰에서 버튼이 화면 맨 아래에 한 줄로 붙어요. 이름도 함께 보여요. 휴대폰 보기에서 확인해 보세요.', 'look')
        ].join('');
      }
    },

    // =======================================================
    aside: {
      content: ["title","links.*.label","links.*.url","bannerTitle","bannerText","bannerLink","bannerImage","imgX","imgY","imgZoom","imgXm","imgYm","imgZoomm"],
      lists: ["links"],
      name: '사이드 칸',
      en: 'Sidebar',
      zone: 'main',
      desc: '본문 옆 메뉴·배너',
      thumb: `<div class="t t-aside"><span class="t-col"><i class="t-line w60 bold"></i><i class="t-line w80 thin"></i><i class="t-line w70 thin"></i><i class="t-line w80 thin"></i></span></div>`,
      defaults: () => ({
        title: '바로가기',
        links: [{ label: '공지사항', url: '' }, { label: '자주 묻는 질문', url: '' }, { label: '오시는 길', url: '' }],
        showBanner: false,
        bannerImage: null, imgX: 50, imgY: 50, imgZoom: 1,
        bannerTitle: '이달의 소식',
        bannerText: '작은 배너에 알릴 내용을 적어주세요.',
        bannerLink: '',
        bg: '',
        sticky: true
      }),
      newItem: { 'links': () => ({ label: '새 링크', url: '' }) },
      span: 3,                   // 처음 놓을 때 너비 (12칸 중 3칸)
      dropPath: (p) => (p.showBanner ? 'bannerImage' : null),
      render: (p, h) => {
        const img = h.asset(p.bannerImage);
        const banner = p.showBanner ? `
            <a class="b-aside-banner"${h.href(p.bannerLink)}>
              ${img ? `<span class="b-aside-img"><img src="${img}" alt="" style="${h.photoStyle(p)}"></span>` : (h.editor ? `<span class="b-aside-img">${h.placeholder('bannerImage', '사진 넣기')}</span>` : '')}
              <strong data-edit="bannerTitle">${h.text(p.bannerTitle)}</strong>
              <span data-edit="bannerText" data-multiline>${h.text(p.bannerText)}</span>
            </a>` : '';
        return `
        <aside class="b-aside${p.sticky ? ' is-sticky' : ''}${isDark(p.bg) ? ' is-dark' : ''}" ${bgStyle(h, p.bg)}>
          <div class="b-aside-inner">
            ${p.title ? `<h3 data-edit="title">${h.text(p.title)}</h3>` : ''}
            <ul>${p.links.map((l, i) => `<li><a${h.href(l.url)} data-edit="links.${i}.label">${h.text(l.label)}</a></li>`).join('')}</ul>
            ${banner}
          </div>
        </aside>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.links.map((l, i) => `
          <div class="list-row">
            ${ui.input(`links.${i}.label`, l.label, { small: true, placeholder: '이름' })}
            ${ui.itemTools('links', i, p.links.length, 0)}
          </div>
          ${ui.link(`links.${i}.url`, l.url, h.linkTargets())}`).join('');
        return [
          ui.section('링크 목록', rows + ui.addBtn('links', '링크 추가', p.links.length >= 12),
            '본문 블록 옆에 놓으려면, 옆 블록의 너비를 줄여서 합이 12칸이 되게 하세요. (예: 본문 9칸 + 사이드 3칸)'),
          ui.section('작은 배너', ui.check('showBanner', p.showBanner, '배너 보이기') +
            (p.showBanner ? ui.photo('bannerImage', h.asset(p.bannerImage), { frames: 'ratio:4/3' }) +
              ui.link('bannerLink', p.bannerLink, h.linkTargets(), { label: '배너를 누르면 갈 곳' }) : '')),
          ui.section('모양', ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)) +
            ui.check('sticky', p.sticky, '화면을 내려도 따라오기'), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 자주 묻는 질문: 질문을 누르면 답이 펼쳐져요 (자바스크립트 없이도 돼요)
    faq: {
      content: ["title","sub","items.*.q","items.*.a"],
      lists: ["items"],
      name: '자주 묻는 질문',
      en: 'FAQ',
      zone: 'main',
      desc: '질문을 누르면 답이 펼쳐져요',
      thumb: `<div class="t t-faq"><i class="t-line w60 bold"></i><i class="t-row-line"></i><i class="t-row-line"></i><i class="t-row-line"></i></div>`,
      defaults: () => ({
        showHead: true, title: '자주 묻는 질문', sub: '',
        items: [
          { q: '예약은 어떻게 하나요?', a: '전화나 카카오톡 채널로 편하게 문의해 주세요.' },
          { q: '주차할 수 있나요?', a: '건물 앞에 2대까지 주차할 수 있어요.' },
          { q: '쉬는 날은 언제인가요?', a: '매주 월요일과 명절 당일에 쉬어요.' }
        ],
        openFirst: true,
        look: 'line',            // line: 줄 / card: 상자
        bg: ''
      }),
      newItem: { 'items': () => ({ q: '새 질문을 적어주세요', a: '답을 적어주세요.' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-faq look-${h.attr(p.look)}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <div class="b-faq-list">
            ${p.items.map((it, i) => `<details class="b-faq-item"${p.openFirst && i === 0 ? ' open' : ''}>
              <summary><span data-edit="items.${i}.q">${h.text(it.q)}</span><i class="b-faq-arrow" aria-hidden="true"></i></summary>
              <div class="b-faq-a" data-edit="items.${i}.a" data-multiline>${h.text(it.a)}</div>
            </details>`).join('')}
          </div>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.q`, it.q, { small: true, placeholder: '질문' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            ${ui.textarea(`items.${i}.a`, it.a, { rows: 3, placeholder: '답' })}
          </div>`).join('');
        return [
          ui.section(`질문 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '질문 추가', p.items.length >= 20),
            '페이지에서 질문과 답을 두 번 눌러 고쳐도 돼요. 답을 고칠 때 Shift + Enter 로 줄을 바꿔요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('look', p.look, [['line', '줄로 나누기'], ['card', '상자']]) +
            ui.check('openFirst', p.openFirst, '첫 질문은 펼쳐 두기') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 후기: 손님이 남긴 말을 카드로 (실제 받은 후기를 적어주세요)
    reviews: {
      content: ["title","sub","items.*.text","items.*.name","items.*.meta","items.*.stars","items.*.photo"],
      lists: ["items"],
      name: '후기',
      en: 'Reviews',
      zone: 'main',
      desc: '손님 후기 · 별점',
      thumb: `<div class="t t-reviews"><span class="t-row"><i class="t-card"></i><i class="t-card"></i><i class="t-card"></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '이용 후기', sub: '실제로 받은 후기를 적어주세요.',
        items: [
          { text: '여기에 손님이 남긴 후기를 적어주세요.', name: '손님 이름', meta: '2026년 10월', stars: 5, photo: null },
          { text: '짧아도 괜찮아요. 실제로 들은 말을 그대로 옮기면 가장 좋아요.', name: '손님 이름', meta: '', stars: 5, photo: null },
          { text: '이름은 ‘김○○ 님’처럼 가려서 적어도 돼요.', name: '김○○ 님', meta: '', stars: 5, photo: null }
        ],
        perRow: 3,
        showStars: true,
        bg: ''
      }),
      newItem: { 'items': () => ({ text: '후기를 적어주세요.', name: '손님 이름', meta: '', stars: 5, photo: null }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-reviews" style="${p.bg ? `background:${h.attr(p.bg)};` : ''}--cols:${Math.max(1, Math.min(4, Number(p.perRow) || 3))}">
          ${sectionHead(p, h)}
          <div class="b-reviews-grid">
            ${p.items.map((it, i) => {
              const ph = h.asset(it.photo);
              const n = Math.max(0, Math.min(5, Number(it.stars) || 0));
              return `<figure class="b-review">
                ${p.showStars ? `<div class="b-stars" aria-label="별점 ${n}점">${'★'.repeat(n)}<span>${'★'.repeat(5 - n)}</span></div>` : ''}
                <blockquote data-edit="items.${i}.text" data-multiline>${h.text(it.text)}</blockquote>
                <figcaption>
                  ${ph ? `<img src="${ph}" alt="">` : ''}
                  <span><b data-edit="items.${i}.name">${h.text(it.name)}</b>${it.meta ? `<small data-edit="items.${i}.meta">${h.text(it.meta)}</small>` : ''}</span>
                </figcaption>
              </figure>`;
            }).join('')}
          </div>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.name`, it.name, { small: true, placeholder: '이름' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            ${ui.input(`items.${i}.meta`, it.meta, { small: true, placeholder: '날짜나 메모 (비워 두면 안 보여요)' })}
            ${p.showStars ? ui.seg(`items.${i}.stars`, it.stars, [[5, '★5'], [4, '★4'], [3, '★3'], [2, '★2'], [1, '★1']]) : ''}
            ${ui.photo(`items.${i}.photo`, h.asset(it.photo), { compact: true, addLabel: '얼굴 사진 (선택)' })}
          </div>`).join('');
        return [
          ui.section(`후기 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '후기 추가', p.items.length >= 12),
            '후기 글은 페이지에서 두 번 눌러 고쳐요. 실제로 받은 후기만 적어주세요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.sub('한 줄에') + ui.seg('perRow', p.perRow, [[1, '1개'], [2, '2개'], [3, '3개'], [4, '4개']]) +
            ui.check('showStars', p.showStars, '별점 보이기') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '좁은 화면에서는 한 줄에 하나씩 보여요.', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 표: 영업 · 진료 시간, 시간표, 가격 비교처럼 칸을 나눠 보여줘요
    //   cols: 맨 위 줄(칸 이름), rows: [{ cells: [...] }] — 칸을 더하거나 빼면 모든 줄이 같이 바뀌어요(afterList)
    table: {
      content: ["title","sub","cols.*","rows.*.cells.*","note"],
      lists: ["rows"],
      name: '표',
      en: 'Table',
      zone: 'main',
      desc: '영업시간 · 시간표 · 가격 비교',
      thumb: `<div class="t t-table"><span class="t-tgrid"><i class="h"></i><i class="h"></i><i class="h"></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '운영 시간', sub: '',
        cols: ['', '평일', '토요일', '일요일 · 공휴일'],
        rows: [
          { cells: ['영업 시간', '10:00 – 21:00', '11:00 – 22:00', '쉬어요'] },
          { cells: ['점심 시간', '13:00 – 14:00', '–', '–'] },
          { cells: ['마지막 주문', '20:30', '21:30', '–'] }
        ],
        headRow: true,           // 맨 위 줄을 칸 이름으로
        headCol: true,           // 맨 왼쪽 칸을 굵게
        look: 'line',            // line: 줄 / stripe: 줄무늬 / box: 상자
        align: 'center',         // center · left
        note: '',                // 표 아래 작은 글
        bg: ''
      }),
      newItem: { 'rows': () => ({ cells: [] }), 'cols': () => '새 칸' },
      // 칸(cols)을 더하고 · 빼고 · 옮기면 모든 줄의 칸도 같이 맞춰요
      afterList: (p, path, op) => {
        const n = p.cols.length;
        if (path === 'cols') {
          p.rows.forEach((r) => {
            if (op.action === 'add') r.cells.push('');
            if (op.action === 'remove') r.cells.splice(op.i, 1);
            if (op.action === 'move') { const [c] = r.cells.splice(op.i, 1); r.cells.splice(op.j, 0, c == null ? '' : c); }
          });
        }
        p.rows.forEach((r) => { if (!Array.isArray(r.cells)) r.cells = []; while (r.cells.length < n) r.cells.push(''); r.cells.length = n; });
      },
      dropPath: () => null,
      render: (p, h) => {
        const n = p.cols.length;
        const cell = (v, path, tag, cls) => `<${tag}${cls ? ` class="${cls}"` : ''}${tag === 'th' ? ' scope="' + (cls === 'rh' ? 'row' : 'col') + '"' : ''} data-edit="${path}">${h.text(v || '')}</${tag}>`;
        const head = p.headRow ? `<thead><tr>${p.cols.map((c, j) => cell(c, `cols.${j}`, 'th')).join('')}</tr></thead>` : '';
        const body = p.rows.map((r, i) => `<tr>${Array.from({ length: n }, (_, j) => (j === 0 && p.headCol ? cell(r.cells[j], `rows.${i}.cells.${j}`, 'th', 'rh') : cell(r.cells[j], `rows.${i}.cells.${j}`, 'td'))).join('')}</tr>`).join('');
        return `
        <section class="b-table look-${h.attr(p.look)} align-${h.attr(p.align)}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <div class="b-table-wrap"><table>${head}<tbody>${body}</tbody></table></div>
          ${p.note ? `<p class="b-table-note" data-edit="note" data-multiline>${h.text(p.note)}</p>` : ''}
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const cols = p.cols.map((c, j) => `<div class="list-row">${ui.input(`cols.${j}`, c, { small: true, placeholder: j === 0 ? '(비워도 돼요)' : '칸 이름' })}${ui.itemTools('cols', j, p.cols.length, 1)}</div>`).join('');
        const rows = p.rows.map((r, i) => `
          <div class="list-card">
            <div class="list-row"><b class="tbl-rowno">${i + 1}번째 줄</b>${ui.itemTools('rows', i, p.rows.length, 1)}</div>
            <div class="tbl-cells" style="--n:${Math.min(p.cols.length, 3)}">${p.cols.map((c, j) => ui.input(`rows.${i}.cells.${j}`, r.cells[j], { small: true, placeholder: c || `${j + 1}번째 칸` })).join('')}</div>
          </div>`).join('');
        return [
          ui.section(`칸 <small>${p.cols.length}개</small>`, cols + ui.addBtn('cols', '칸 추가', p.cols.length >= 6),
            '칸 이름은 표 맨 위 줄이에요. 칸을 빼거나 옮기면 모든 줄이 같이 바뀌어요.', 'content'),
          ui.section(`줄 <small>${p.rows.length}개</small>`, rows + ui.addBtn('rows', '줄 추가', p.rows.length >= 20),
            '표 안의 글자는 페이지에서 두 번 눌러 바로 고쳐도 돼요.', 'content'),
          ui.section('표 아래 글', ui.input('note', p.note, { placeholder: '예: 명절 당일은 쉬어요 (비우면 안 보여요)' }), '', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('look', p.look, [['line', '가로줄만'], ['stripe', '한 줄씩 색'], ['box', '칸마다 테두리']]) +
            ui.sub('글자 맞춤') + ui.seg('align', p.align, [['center', '가운데'], ['left', '왼쪽']]) +
            ui.check('headRow', p.headRow, '맨 위 줄을 칸 이름으로') + ui.check('headCol', p.headCol, '맨 왼쪽 칸 굵게') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)),
            '휴대폰처럼 좁은 화면에서는 표를 옆으로 밀어서 봐요.', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 일정: 행사 · 수업 · 공연 날짜를 차례로
    schedule: {
      content: ["title","sub","items.*.date","items.*.day","items.*.time","items.*.title","items.*.place","items.*.text","items.*.button","items.*.link"],
      lists: ["items"],
      name: '일정',
      en: 'Schedule',
      zone: 'main',
      desc: '행사 · 수업 · 공연 날짜',
      thumb: `<div class="t t-schedule"><span class="t-srow"><b></b><i></i></span><span class="t-srow"><b></b><i></i></span><span class="t-srow"><b></b><i></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '다가오는 일정', sub: '',
        items: [
          { date: '10.24', day: '토', time: '11:00 – 17:00', title: '가을 동네 장터', place: '○○공원 광장', text: '먹거리 · 플리마켓 · 작은 음악회', button: '', link: '' },
          { date: '11.07', day: '토', time: '14:00', title: '손뜨개 원데이 클래스', place: '2층 작업실', text: '재료는 모두 준비돼 있어요.', button: '신청하기', link: '' },
          { date: '12.19', day: '토', time: '19:00', title: '연말 작은 음악회', place: '1층 홀', text: '', button: '', link: '' }
        ],
        layout: 'list',          // list: 날짜 상자 / timeline: 세로 선
        bg: ''
      }),
      newItem: { 'items': () => ({ date: '01.01', day: '', time: '', title: '새 일정', place: '', text: '', button: '', link: '' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-schedule layout-${h.attr(p.layout)}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ol class="b-sched-list">
            ${p.items.map((it, i) => `<li class="b-sched">
              <div class="b-sched-date"><b data-edit="items.${i}.date">${h.text(it.date)}</b>${it.day ? `<small data-edit="items.${i}.day">${h.text(it.day)}</small>` : ''}</div>
              <div class="b-sched-body">
                <h3 data-edit="items.${i}.title">${h.text(it.title)}</h3>
                ${it.time || it.place ? `<p class="b-sched-meta">${it.time ? `<span data-edit="items.${i}.time">${h.text(it.time)}</span>` : ''}${it.time && it.place ? '<i class="b-sep">|</i>' : ''}${it.place ? `<span data-edit="items.${i}.place">${h.text(it.place)}</span>` : ''}</p>` : ''}
                ${it.text ? `<p class="b-sched-text" data-edit="items.${i}.text" data-multiline>${h.text(it.text)}</p>` : ''}
                ${it.button ? `<a class="b-button small"${h.href(it.link)} data-edit="items.${i}.button">${h.text(it.button)}</a>` : ''}
              </div>
            </li>`).join('')}
          </ol>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.title`, it.title, { small: true, placeholder: '일정 이름' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            <div class="tbl-cells" style="--n:2">${ui.input(`items.${i}.date`, it.date, { small: true, placeholder: '날짜 (예: 10.24)' })}${ui.input(`items.${i}.day`, it.day, { small: true, placeholder: '요일 (예: 토)' })}</div>
            <div class="tbl-cells" style="--n:2">${ui.input(`items.${i}.time`, it.time, { small: true, placeholder: '시간 (선택)' })}${ui.input(`items.${i}.place`, it.place, { small: true, placeholder: '장소 (선택)' })}</div>
            ${ui.input(`items.${i}.button`, it.button, { small: true, placeholder: '버튼 글자 (예: 신청하기 · 비우면 안 보여요)' })}
            ${it.button ? ui.link(`items.${i}.link`, it.link, T, { label: '버튼을 누르면 갈 곳' }) : ''}
          </div>`).join('');
        return [
          ui.section(`일정 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '일정 추가', p.items.length >= 20),
            '설명 글은 페이지에서 두 번 눌러 적어요. 지난 일정은 빼거나 아래로 옮겨 주세요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('layout', p.layout, [['list', '날짜를 네모 칸에'], ['timeline', '왼쪽 세로 줄 따라']]) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 팀 소개: 의료진 · 강사 · 직원을 사진과 함께
    team: {
      content: ["title","sub","members.*.photo","members.*.alt","members.*.name","members.*.role","members.*.text","members.*.link"],
      lists: ["members"],
      name: '팀 소개',
      en: 'Team',
      zone: 'main',
      desc: '의료진 · 강사 · 직원 소개',
      thumb: `<div class="t t-team"><span class="t-row"><i class="t-person"></i><i class="t-person"></i><i class="t-person"></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '함께하는 사람들', sub: '',
        members: [
          { photo: null, alt: '', name: '김바른', role: '대표', text: '15년 동안 한자리에서 일했어요.', link: '' },
          { photo: null, alt: '', name: '이다정', role: '실장', text: '처음 오신 분도 편하게 안내해 드려요.', link: '' },
          { photo: null, alt: '', name: '박꼼꼼', role: '매니저', text: '작은 것도 꼼꼼하게 챙겨요.', link: '' }
        ],
        perRow: 3,
        shape: 'circle',         // circle: 동그랗게 / square: 네모 / tall: 세로 사진
        align: 'center',
        bg: ''
      }),
      newItem: { 'members': () => ({ photo: null, alt: '', name: '이름', role: '하는 일', text: '', link: '' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-team shape-${h.attr(p.shape)} align-${h.attr(p.align)}" style="${p.bg ? `background:${h.attr(p.bg)};` : ''}--cols:${Math.max(1, Math.min(4, Number(p.perRow) || 3))}">
          ${sectionHead(p, h)}
          <div class="b-team-grid">
            ${p.members.map((m, i) => {
              const ph = h.asset(m.photo);
              const name = `<b data-edit="members.${i}.name">${h.text(m.name)}</b>`;
              return `<figure class="b-member">
                <div class="b-member-photo">${ph ? `<img src="${ph}" alt="${h.attr(m.alt || m.name)}">` : (h.editor ? h.placeholder(`members.${i}.photo`, '사진', 'image') : '<span class="b-member-noimg" aria-hidden="true"></span>')}</div>
                <figcaption>
                  ${m.role ? `<small data-edit="members.${i}.role">${h.text(m.role)}</small>` : ''}
                  ${m.link ? `<a${h.href(m.link)}>${name}</a>` : name}
                  ${m.text ? `<p data-edit="members.${i}.text" data-multiline>${h.text(m.text)}</p>` : ''}
                </figcaption>
              </figure>`;
            }).join('')}
          </div>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        const rows = p.members.map((m, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`members.${i}.name`, m.name, { small: true, placeholder: '이름' })}${ui.itemTools('members', i, p.members.length, 1)}</div>
            ${ui.input(`members.${i}.role`, m.role, { small: true, placeholder: '하는 일 (예: 대표원장 · 영어 강사)' })}
            ${ui.photo(`members.${i}.photo`, h.asset(m.photo), { compact: true, addLabel: '사진 넣기' })}
            ${m.photo ? ui.input(`members.${i}.alt`, m.alt, { small: true, placeholder: '사진 설명 글 (비우면 이름)' }) : ''}
            ${ui.link(`members.${i}.link`, m.link, T, { label: '이름을 누르면 갈 곳 (선택)' })}
          </div>`).join('');
        return [
          ui.section(`사람 <small>${p.members.length}명</small>`, rows + ui.addBtn('members', '사람 추가', p.members.length >= 16),
            '소개 글은 페이지에서 두 번 눌러 고쳐요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.sub('한 줄에') + ui.seg('perRow', p.perRow, [[2, '2명'], [3, '3명'], [4, '4명']]) +
            ui.sub('사진 모양') + ui.seg('shape', p.shape, [['circle', '동그랗게'], ['square', '네모'], ['tall', '세로 사진']]) +
            ui.sub('글자 맞춤') + ui.seg('align', p.align, [['center', '가운데'], ['left', '왼쪽']]) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '좁은 화면에서는 한 줄에 둘씩 보여요.', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 갤러리: 사진 여러 장을 바둑판처럼. 누르면 크게 보여요
    gallery: {
      content: ["title","sub","images.*.image","images.*.caption","images.*.imgX","images.*.imgY","images.*.imgZoom","images.*.imgXm","images.*.imgYm","images.*.imgZoomm"],
      lists: ["images"],
      name: '갤러리',
      en: 'Gallery',
      zone: 'main',
      desc: '사진 여러 장 · 누르면 크게',
      thumb: `<div class="t t-gallery"><span class="t-grid"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '갤러리', sub: '',
        images: [newPhoto(), newPhoto(), newPhoto(), newPhoto(), newPhoto(), newPhoto()],
        cols: 3,
        ratio: '1/1',
        gap: 'm',                // none · s · m
        rounded: true,
        zoom: true,              // 누르면 크게 보기
        showCaption: false,
        bg: ''
      }),
      newItem: { 'images': () => newPhoto() },
      dropPath: (p) => { const i = p.images.findIndex((x) => !x.image); return `images.${i < 0 ? 0 : i}.image`; },
      render: (p, h) => {
        const items = p.images.map((it, i) => {
          const img = h.asset(it.image);
          if (!img && !h.editor) return '';
          const pic = img ? `<img src="${img}" alt="${h.attr(it.caption || '')}" style="${h.photoStyle(it)}" loading="lazy">` : h.placeholder(`images.${i}.image`, '사진 넣기');
          const cap = p.showCaption && it.caption ? `<figcaption>${h.text(it.caption)}</figcaption>` : '';
          return img && p.zoom
            ? `<figure class="b-gal-item"><a class="b-gal-frame" href="${img}" data-zoom style="aspect-ratio:${h.attr(p.ratio)}" aria-label="크게 보기">${pic}</a>${cap}</figure>`
            : `<figure class="b-gal-item"><div class="b-gal-frame" style="aspect-ratio:${h.attr(p.ratio)}">${pic}</div>${cap}</figure>`;
        }).join('');
        return `
        <section class="b-gallery gap-${h.attr(p.gap)}${p.rounded ? ' is-rounded' : ''}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <div class="b-gal-grid" style="--cols:${Math.max(2, Math.min(5, Number(p.cols) || 3))}">${items}</div>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const cells = p.images.map((it, i) => {
          const img = h.asset(it.image);
          return `<div class="gal-cell">
            ${img ? `<img src="${img}" alt="">` : `<button class="gal-empty" data-action="image-pick" data-path="images.${i}.image" title="사진 넣기">${ui.icon.plus}</button>`}
            <span class="gal-tools">${img ? `<button class="icon-btn" data-action="image-crop" data-base="images.${i}" data-key="image" data-frames="ratio:${p.ratio}" title="위치 맞추기">${ui.icon.crop}</button>` : ''}${ui.itemTools('images', i, p.images.length, 1)}</span>
          </div>`;
        }).join('');
        return [
          ui.section(`사진 <small>${p.images.length}장</small>`,
            `<button class="btn btn-primary" data-action="images-add" data-path="images">${ui.icon.image} 사진 여러 장 한꺼번에 넣기</button>
             <div class="gal-cells">${cells}</div>` + ui.addBtn('images', '빈 칸 추가', p.images.length >= 40) +
            `<p class="photo-rec">${ui.recSize({ frames: 'ratio:' + p.ratio }).text}</p>`,
            '사진 파일을 블록 위에 끌어다 놓으면 빈 칸부터 채워져요. 사진을 넣지 않은 칸은 홈페이지에서 보이지 않아요.', 'content'),
          ui.section('사진 설명 글', p.images.map((it, i) => (it.image ? ui.input(`images.${i}.caption`, it.caption, { small: true, placeholder: `${i + 1}번째 사진 설명` }) : '')).join(''),
            '눈이 불편한 분의 화면 읽기와 검색에 쓰여요. ‘사진 아래 설명’을 켜면 홈페이지에도 보여요.', 'more'),
          headFields(p, ui),
          ui.section('모양', ui.sub('한 줄에') + ui.seg('cols', p.cols, [[2, '2장'], [3, '3장'], [4, '4장'], [5, '5장']]) +
            ui.sub('사진 비율') + ui.ratio('ratio', p.ratio, { dir: p.ratioDir }) +
            ui.sub('사진 사이') + ui.seg('gap', p.gap, [['none', '붙이기'], ['s', '좁게'], ['m', '보통']]) +
            ui.check('rounded', p.rounded, '모서리 둥글게') +
            ui.check('zoom', p.zoom, '누르면 크게 보기') +
            ui.check('showCaption', p.showCaption, '사진 아래 설명') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '휴대폰에서는 한 줄에 2장씩 보여요.', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 가격표: 요금제 · 메뉴 가격을 나란히
    pricing: {
      content: ["title","sub","badge","plans.*.name","plans.*.price","plans.*.unit","plans.*.desc","plans.*.features","plans.*.button","plans.*.link"],
      lists: ["plans"],
      name: '가격표',
      en: 'Pricing',
      zone: 'main',
      desc: '요금 · 상품을 나란히 비교',
      thumb: `<div class="t t-pricing"><span class="t-row"><i class="t-card"></i><i class="t-card hi"></i><i class="t-card"></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '가격 안내', sub: '부가세 포함 가격이에요.',
        plans: [
          { name: '기본', price: '30,000원', unit: '/ 1회', desc: '처음 오시는 분께', features: '상담 30분\n기본 관리', button: '예약하기', showButton: true, link: '', highlight: false },
          { name: '추천', price: '80,000원', unit: '/ 3회', desc: '가장 많이 골라요', features: '상담 30분\n기본 관리\n집에서 하는 방법 안내', button: '예약하기', showButton: true, link: '', highlight: true },
          { name: '정기', price: '150,000원', unit: '/ 6회', desc: '꾸준히 관리하고 싶다면', features: '상담 60분\n기본 관리\n집에서 하는 방법 안내\n언제든 일정 바꾸기', button: '예약하기', showButton: true, link: '', highlight: false }
        ],
        badge: '추천',
        bg: ''
      }),
      newItem: { 'plans': () => ({ name: '새 상품', price: '0원', unit: '', desc: '', features: '내용을 한 줄씩 적어주세요', button: '예약하기', showButton: true, link: '', highlight: false }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-pricing"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <div class="b-price-grid" style="--cols:${Math.max(1, Math.min(4, p.plans.length))}">
            ${p.plans.map((pl, i) => `<div class="b-plan${pl.highlight ? ' is-hi' : ''}">
              ${pl.highlight && p.badge ? `<span class="b-plan-badge" data-edit="badge">${h.text(p.badge)}</span>` : ''}
              <h3 data-edit="plans.${i}.name">${h.text(pl.name)}</h3>
              ${pl.desc ? `<p class="b-plan-desc" data-edit="plans.${i}.desc">${h.text(pl.desc)}</p>` : ''}
              <div class="b-plan-price"><strong data-edit="plans.${i}.price">${h.text(pl.price)}</strong>${pl.unit ? `<span data-edit="plans.${i}.unit">${h.text(pl.unit)}</span>` : ''}</div>
              <ul>${String(pl.features || '').split('\n').map((f) => f.trim()).filter(Boolean).map((f) => `<li>${h.text(f)}</li>`).join('')}</ul>
              ${pl.showButton ? `<a class="b-button${pl.highlight ? '' : ' outline'}"${h.href(pl.link)} data-edit="plans.${i}.button">${h.text(pl.button)}</a>` : ''}
            </div>`).join('')}
          </div>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        const rows = p.plans.map((pl, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`plans.${i}.name`, pl.name, { small: true, placeholder: '이름' })}${ui.itemTools('plans', i, p.plans.length, 1)}</div>
            <div class="list-row">${ui.input(`plans.${i}.price`, pl.price, { small: true, placeholder: '가격 (예: 30,000원)' })}${ui.input(`plans.${i}.unit`, pl.unit, { small: true, placeholder: '단위 (예: / 1회)' })}</div>
            ${ui.textarea(`plans.${i}.features`, pl.features, { rows: 3, placeholder: '들어 있는 것을 한 줄에 하나씩' })}
            ${ui.check(`plans.${i}.highlight`, pl.highlight, '강조하기 (추천 표시)')}
            ${ui.check(`plans.${i}.showButton`, pl.showButton, '버튼 보이기')}
            ${pl.showButton ? ui.link(`plans.${i}.link`, pl.link, T, { label: '버튼을 누르면 갈 곳' }) : ''}
          </div>`).join('');
        return [
          ui.section(`상품 <small>${p.plans.length}개 · 최대 4개</small>`, rows + ui.addBtn('plans', '상품 추가', p.plans.length >= 4),
            '들어 있는 것은 한 줄에 하나씩 적으면 ✓ 표시와 함께 보여요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.input('badge', p.badge, { label: '추천 상품 위 작은 글자', placeholder: '예: 추천, BEST' }) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '좁은 화면에서는 한 줄에 하나씩 보여요.', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 지도 · 오시는 길: 주소만 적으면 지도가 들어가고, 네이버 지도 · 카카오맵 버튼이 함께 생겨요
    map: {
      content: ["title","address","detail","phone","mapImage","naverUrl","kakaoUrl","kakaoCode","imgX","imgY","imgZoom","imgXm","imgYm","imgZoomm"],
      lists: [],
      name: '지도 · 오시는 길',
      en: 'Map',
      zone: 'main',
      desc: '주소만 적으면 지도 · 네이버 · 카카오맵',
      thumb: `<div class="t t-map"><span class="t-row"><span class="t-col"><i class="t-line w60 bold"></i><i class="t-line w80 thin"></i><i class="t-line w70 thin"></i></span><i class="t-mapbox"></i></span></div>`,
      defaults: () => ({
        title: '오시는 길',
        address: '서울특별시 중구 세종대로 110',
        detail: '○○역 2번 출구에서 걸어서 5분\n건물 앞 주차 2대 가능',
        phone: '',
        layout: 'side',          // side: 글 옆에 지도 / stack: 지도 위 · 글 아래
        mapKind: 'embed',        // embed: 카카오맵 넣기 / image: 지도 그림(사진) / none: 지도 없이
        kakaoCode: '',           // 카카오맵 ‘지도 퍼가기’ 코드 (그대로 붙여넣어요)
        mapImage: null, imgX: 50, imgY: 50, imgZoom: 1,
        zoom: 16,
        showNaver: true, naverUrl: '',
        showKakao: true, kakaoUrl: '',
        bg: ''
      }),
      dropPath: (p) => (p.mapKind === 'image' ? 'mapImage' : null),
      render: (p, h) => {
        const q = encodeURIComponent(p.address || '');
        const naver = p.naverUrl || `https://map.naver.com/p/search/${q}`;
        const kakao = p.kakaoUrl || `https://map.kakao.com/link/search/${q}`;
        const km = kakaoMap(p.kakaoCode);
        let map = '';
        if (p.mapKind === 'image') {
          const img = h.asset(p.mapImage);
          map = img ? `<img src="${img}" alt="${h.attr(p.address)} 지도" style="${h.photoStyle(p)}">` : (h.editor ? h.placeholder('mapImage', '지도 그림 넣기') : '');
        } else if (p.mapKind === 'embed') {
          // 카카오맵 ‘지도 퍼가기’ 코드가 있으면 진짜 지도, 없으면 주소 카드 (누르면 카카오맵에서 크게)
          const pin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>';
          if (h.editor) {
            map = `<div class="b-map-cover">${pin}<b>${h.text(p.address || '주소를 적어주세요')}</b><small>${km ? '카카오맵이 들어 있어요 · 새 탭 미리보기와 내려받은 홈페이지에서 보여요' : '카카오맵 ‘지도 퍼가기’ 코드를 넣으면 진짜 지도가 보여요'}</small></div>`;
          } else if (km) {
            map = `<div id="daumRoughmapContainer${km.ts}" class="root_daum_roughmap root_daum_roughmap_landing b-map-kakao"></div>
<script charset="UTF-8" class="daum_roughmap_loader_script" src="https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js"></script>
<script charset="UTF-8">new daum.roughmap.Lander({"timestamp":"${km.ts}","key":"${km.key}","mapWidth":"1000","mapHeight":"720"}).render();</script>`;
          } else if (p.address) {
            map = `<a class="b-map-card" href="${h.attr(kakao)}" target="_blank" rel="noopener">${pin}<b>${h.text(p.address)}</b><small>카카오맵에서 크게 보기</small></a>`;
          }
        }
        const btns = [
          p.showNaver ? `<a class="b-map-btn naver" href="${h.attr(naver)}" target="_blank" rel="noopener"><b>N</b>네이버 지도</a>` : '',
          p.showKakao ? `<a class="b-map-btn kakao" href="${h.attr(kakao)}" target="_blank" rel="noopener"><b>K</b>카카오맵</a>` : '',
          p.phone ? `<a class="b-map-btn tel"${h.href(p.phone)}>전화 ${h.text(p.phone)}</a>` : ''
        ].join('');
        return `
        <section class="b-map layout-${h.attr(p.layout)}${map ? '' : ' no-map'}"${bgStyle(h, p.bg)}>
          <div class="b-map-wrap">
            <div class="b-map-info">
              <h2 data-edit="title">${h.text(p.title)}</h2>
              <p class="b-map-addr" data-edit="address">${h.text(p.address)}</p>
              ${p.detail ? `<p class="b-map-detail" data-edit="detail" data-multiline>${h.text(p.detail)}</p>` : ''}
              ${btns ? `<div class="b-map-btns">${btns}</div>` : ''}
            </div>
            ${map ? `<div class="b-map-box">${map}</div>` : ''}
          </div>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        return [
          ui.section('주소', ui.input('address', p.address, { placeholder: '예: 서울특별시 중구 세종대로 110' }) +
            ui.input('phone', p.phone, { label: '전화번호 (선택)', placeholder: '예: 02-000-0000' }),
            '주소만 정확히 적으면 지도와 네이버 지도 · 카카오맵 버튼이 저절로 그 주소를 찾아요. 오시는 방법은 페이지에서 두 번 눌러 고쳐요.', 'content'),
          ui.section('지도', ui.seg('mapKind', p.mapKind, [['embed', '카카오맵'], ['image', '지도 그림'], ['none', '지도 없이']]) +
            (p.mapKind === 'image' ? ui.photo('mapImage', h.asset(p.mapImage), { frames: 'ratio:4/3' }) : '') +
            (p.mapKind === 'embed' ? ui.textarea('kakaoCode', p.kakaoCode, { rows: 3, label: '카카오맵 ‘지도 퍼가기’ 코드', placeholder: '<div id="daumRoughmapContainer…"> … </script> 를 그대로 붙여넣어요' }) +
              (p.kakaoCode && !kakaoMap(p.kakaoCode) ? '<p class="field-error">코드를 알아볼 수 없어요. 카카오맵의 ‘지도 퍼가기’에서 ‘HTML 태그 복사’로 받은 코드를 붙여넣어 주세요.</p>' : '') +
              (kakaoMap(p.kakaoCode) ? '<p class="field-ok">카카오맵이 들어 있어요.</p>' : '') : ''),
            p.mapKind === 'embed' ? '<b>코드 받는 법</b> ① map.kakao.com에서 가게를 찾아요 ② 오른쪽 위 ‘공유’ → ‘지도 퍼가기’ ③ ‘HTML 태그 복사’를 눌러 여기에 붙여넣어요. 코드가 없으면 주소 카드가 보이고, 누르면 카카오맵이 열려요. 지도는 새 탭 미리보기와 내려받은 홈페이지에서 보여요.' : p.mapKind === 'image' ? '약도나 지도 캡처 그림을 넣어요.' : '', 'content'),
          ui.section('지도 앱 버튼', ui.check('showNaver', p.showNaver, '네이버 지도 버튼') +
            (p.showNaver ? ui.input('naverUrl', p.naverUrl, { small: true, placeholder: '가게 공유 주소 (비우면 주소로 찾기)' }) : '') +
            ui.check('showKakao', p.showKakao, '카카오맵 버튼') +
            (p.showKakao ? ui.input('kakaoUrl', p.kakaoUrl, { small: true, placeholder: '가게 공유 주소 (비우면 주소로 찾기)' }) : ''),
            '네이버 · 카카오맵에서 가게를 찾아 ‘공유’ 주소를 넣으면 가게 정보가 바로 열려요.', 'content'),
          ui.section('모양', ui.seg('layout', p.layout, [['side', '글 옆에 지도'], ['stack', '지도 위 · 글 아래']]) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 문의 · 예약 양식: 서버 없이도 받을 수 있게 — 메일로 받기 / 구글 설문지 · 네이버 폼 / 개발자 연결
    form: {
      content: ["title","sub","agree","button","email","formUrl","fields.*.label","fields.*.options"],
      lists: [],
      name: '문의 · 예약 양식',
      en: 'Contact Form',
      zone: 'main',
      desc: '이름 · 연락처 · 날짜 · 내용 받기',
      thumb: `<div class="t t-login"><i class="t-line w40 bold"></i><i class="t-field"></i><i class="t-field"></i><i class="t-field tall"></i><i class="t-btn wide"></i></div>`,
      defaults: () => ({
        title: '문의하기',
        sub: '남겨 주시면 확인 후 연락드릴게요.',
        fields: [
          { kind: 'name', label: '이름', required: true, options: '' },
          { kind: 'phone', label: '연락처', required: true, options: '' },
          { kind: 'date', label: '희망 날짜', required: false, options: '' },
          { kind: 'message', label: '문의 내용', required: true, options: '' }
        ],
        showAgree: true,
        agree: '개인정보(이름 · 연락처)를 문의 답변을 위해 받고, 답변 후 지워요. 동의합니다.',
        button: '보내기',
        send: 'link',            // link: 구글 설문지 · 네이버 폼 (추천) / mail: 메일로 받기 / action: 개발자 연결
        email: '',
        formUrl: '',
        action: '',
        bg: ''
      }),
      newItem: { 'fields': () => ({ kind: 'text', label: '새 항목', required: false, options: '' }) },
      dropPath: () => null,
      render: (p, h) => {
        const field = (f, i) => {
          const req = f.required ? ' required' : '';
          const nm = `f${i}`;
          const lab = `<span><span data-edit="fields.${i}.label">${h.text(f.label)}</span>${f.required ? '<i class="b-req" aria-label="꼭 적어야 해요">*</i>' : ''}</span>`;
          let input;
          if (f.kind === 'message') input = `<textarea name="${nm}" rows="5"${req}></textarea>`;
          else if (f.kind === 'select') input = `<select name="${nm}"${req}><option value="">고르세요</option>${String(f.options || '').split(',').map((o) => o.trim()).filter(Boolean).map((o) => `<option>${h.text(o)}</option>`).join('')}</select>`;
          else {
            const t = { name: 'text', phone: 'tel', email: 'email', date: 'date', text: 'text', password: 'password' }[f.kind] || 'text';
            const extra = f.kind === 'password' ? ' autocomplete="new-password"' : f.kind === 'phone' ? ' inputmode="tel" placeholder="010-0000-0000" pattern="0[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}"' : f.kind === 'name' ? ' autocomplete="name"' : f.kind === 'email' ? ' autocomplete="email"' : '';
            input = `<input type="${t}" name="${nm}"${extra}${req}>`;
          }
          return `<label class="b-form-f${f.kind === 'message' ? ' wide' : ''}" data-label="${h.attr(f.label)}">${lab}${input}</label>`;
        };
        const body = p.send === 'link'
          ? `<a class="b-button b-form-btn"${h.href(p.formUrl)} data-edit="button">${h.text(p.button)}</a>`
          : `<!-- ===== 홈터 · 문의 양식 =====
                 메일로 받기: 보내기를 누르면 손님의 메일 프로그램이 열리고, 적은 내용이 받는 메일 주소로 채워져요.
                 내 서버로 받으려면 form 의 action 을 바꾸고 data-send 를 지우세요. 항목 이름은 f0, f1, … 순서예요. -->
            <form class="b-form-grid" ${p.send === 'action' ? (p.action ? `action="${h.attr(p.action)}" method="post"` : 'data-send="none"') : `data-send="mail" data-to="${h.attr(p.email || '')}" data-subject="${h.attr('[홈페이지 문의] ' + (p.title || ''))}"`}>
              ${p.fields.map(field).join('')}
              ${p.showAgree ? `<label class="b-form-agree wide"><input type="checkbox" required> <span data-edit="agree" data-multiline>${h.text(p.agree)}</span></label>` : ''}
              <button class="b-button b-form-btn wide" type="submit" data-edit="button">${h.text(p.button)}</button>
              <p class="b-form-note wide" role="status" hidden></p>
            </form>`;
        return `
        <section class="b-form"${bgStyle(h, p.bg)}>
          <div class="b-form-card">
            <h2 data-edit="title">${h.text(p.title)}</h2>
            ${p.sub ? `<p class="b-form-sub" data-edit="sub" data-multiline>${h.text(p.sub)}</p>` : ''}
            ${body}
          </div>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const KINDS = [['name', '이름'], ['phone', '연락처'], ['email', '이메일'], ['date', '날짜'], ['text', '짧은 글'], ['select', '고르기'], ['message', '긴 글'], ['password', '비밀번호']];
        const rows = p.fields.map((f, i) => `
          <div class="list-card">
            <div class="list-row">
              <select class="input small" data-field="fields.${i}.kind" aria-label="항목 종류">${KINDS.map(([k, l]) => `<option value="${k}" ${f.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
              ${ui.itemTools('fields', i, p.fields.length, 1)}
            </div>
            ${ui.input(`fields.${i}.label`, f.label, { small: true, placeholder: '항목 이름' })}
            ${f.kind === 'select' ? ui.input(`fields.${i}.options`, f.options, { small: true, placeholder: '고를 것을 쉼표로 (예: 상담, 예약, 기타)' }) : ''}
            <label class="mini-check"><input type="checkbox" data-field="fields.${i}.required" ${f.required ? 'checked' : ''}> 꼭 적어야 해요</label>
          </div>`).join('');
        const sendHelp = {
          mail: '손님이 보내기를 누르면 손님의 메일 프로그램이 열리고, 적은 내용이 아래 메일 주소로 채워져요. 서버가 없어도 돼요.',
          link: '받은 내용은 구글 · 네이버에서 표처럼 모아 볼 수 있어요. 휴대폰 알림도 받을 수 있어요.',
          action: '개발자가 만든 주소로 보내요. 항목 이름은 f0, f1, … 순서예요.'
        }[p.send];
        return [
          ui.section('손님이 보낸 내용 받는 곳', ui.seg('send', p.send, [['link', '구글 · 네이버 폼 (가장 쉬워요)'], ['mail', '내 메일로'], ['action', '개발자 연결']]) +
            (p.send === 'mail' ? `<div class="form-warn"><b>알아두세요</b> 손님 컴퓨터에 메일 프로그램(아웃룩 등)이 설정돼 있지 않으면, 보내기를 눌러도 아무 일도 안 일어나는 것처럼 보여요. 휴대폰에서는 대부분 잘 돼요.<br>확실하게 받으려면 <b>구글 · 네이버 폼</b>을 추천해요.
                <button class="btn small" data-set="send" data-value="link">구글 · 네이버 폼으로 바꾸기</button></div>` +
              ui.input('email', p.email, { label: '받을 메일 주소', placeholder: '예: myshop@naver.com' }) +
              (p.email ? '' : '<p class="field-error">받을 메일 주소를 적어주세요.</p>') : '') +
            (p.send === 'link' ? `<ol class="form-steps">
                <li><a href="https://docs.google.com/forms" target="_blank" rel="noopener">구글 설문지</a> 또는 <a href="https://form.office.naver.com" target="_blank" rel="noopener">네이버 폼</a>에서 양식을 만들어요 (이름 · 연락처 · 문의 내용 같은 항목).</li>
                <li>‘보내기’ 또는 ‘공유’를 눌러 양식 주소를 복사해요.</li>
                <li>아래 칸에 붙여 넣으면 끝! 손님이 버튼을 누르면 그 양식이 열려요.</li></ol>` +
              ui.input('formUrl', p.formUrl, { label: '설문지 · 폼 주소', placeholder: 'https://forms.gle/… 또는 https://naver.me/…' }) +
              (p.formUrl ? '' : '<p class="field-error">폼 주소를 붙여 넣어 주세요.</p>') : '') +
            (p.send === 'action' ? ui.input('action', p.action, { label: '보낼 주소 (action)', placeholder: 'https://내서버/contact' }) : ''),
            sendHelp, 'content'),
          p.send === 'link' ? '' : ui.section(`받을 항목 <small>${p.fields.length}개</small>`, rows + ui.addBtn('fields', '항목 추가', p.fields.length >= 10),
            '연락처는 010-0000-0000 모양으로만 받아요. 항목 이름과 버튼 글자는 페이지에서 두 번 눌러 고쳐도 돼요.', 'content'),
          p.send === 'link' ? '' : ui.section('개인정보 동의', ui.check('showAgree', p.showAgree, '동의 칸 보이기 (추천)'),
            '이름 · 연락처를 받을 때는 받는 까닭과 보관 기간을 알리고 동의를 받는 게 좋아요. 동의 글은 페이지에서 고쳐요.', 'content'),
          ui.section('바탕색', ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 로그인 칸: 모양만 만들어요. 실제 로그인 연결은 내려받은 뒤 각자 붙여요 (연결할 자리에 안내가 들어 있어요)
    login: {
      content: ["title","sub","idLabel","pwLabel","button","remember","joinLabel","joinLink","findLabel","findLink"],
      lists: [],
      name: '로그인 칸',
      en: 'Login',
      zone: 'main',
      desc: '아이디 · 비밀번호 칸 (모양만 있어요 · 연결 안내 있어요)',
      thumb: `<div class="t t-login"><i class="t-line w40 bold"></i><i class="t-field"></i><i class="t-field"></i><i class="t-btn wide"></i></div>`,
      defaults: () => ({
        title: '로그인',
        sub: '회원 정보를 입력해 주세요.',
        idLabel: '아이디',
        pwLabel: '비밀번호',
        button: '로그인',
        showRemember: true,
        remember: '로그인 상태 유지',
        showJoin: true, joinLabel: '회원가입', joinLink: '',
        showFind: true, findLabel: '아이디 · 비밀번호 찾기', findLink: '',
        action: '',              // 개발자용: 로그인 정보를 보낼 주소
        method: 'post',
        bg: ''
      }),
      dropPath: () => null,
      render: (p, h) => {
        const links = [p.showFind ? `<a${h.href(p.findLink)} data-edit="findLabel">${h.text(p.findLabel)}</a>` : '', p.showJoin ? `<a${h.href(p.joinLink)} data-edit="joinLabel">${h.text(p.joinLabel)}</a>` : ''].filter(Boolean).join('<i class="b-top-sep" aria-hidden="true"></i>');
        return `
        <section class="b-login"${bgStyle(h, p.bg)}>
          <div class="b-login-card">
            ${h.editor && !p.action ? '<p class="b-shape-only">모양만 있어요 · 손님이 눌러도 로그인되지 않아요 (도움말 → 로그인 연결하기)</p>' : ''}
            <h2 data-edit="title">${h.text(p.title)}</h2>
            ${p.sub ? `<p class="b-login-sub" data-edit="sub" data-multiline>${h.text(p.sub)}</p>` : ''}
            <!-- ===== 홈터 · 로그인 연결 자리 =====
                 아래 form 의 action(보낼 주소)과 method 를 내 서버에 맞게 바꿔 주세요.
                 보내는 이름: username (아이디), password (비밀번호), remember (로그인 상태 유지)
                 action 이 비어 있으면 '아직 연결되지 않았어요' 안내만 보여요. -->
            <form class="b-login-form" action="${h.attr(p.action || '')}" method="${p.method === 'get' ? 'get' : 'post'}" data-login${p.action ? '' : ' data-not-connected'}>
              <label><span data-edit="idLabel">${h.text(p.idLabel)}</span><input type="text" name="username" autocomplete="username" required></label>
              <label><span data-edit="pwLabel">${h.text(p.pwLabel)}</span><input type="password" name="password" autocomplete="current-password" required></label>
              ${p.showRemember ? `<label class="b-login-check"><input type="checkbox" name="remember" value="1"> <span data-edit="remember">${h.text(p.remember)}</span></label>` : ''}
              <button class="b-button b-login-btn" type="submit" data-edit="button">${h.text(p.button)}</button>
              <p class="b-login-note" role="status" hidden>아직 로그인이 연결되지 않았어요. 홈페이지를 만든 분이 연결하면 쓸 수 있어요.</p>
            </form>
            ${links ? `<div class="b-login-links">${links}</div>` : ''}
          </div>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        return [
          (p.action ? '' : `<div class="insp-warn"><b>모양만 있어요</b><span>홈터 홈페이지는 파일로만 되어 있어서 아이디 · 비밀번호를 확인할 곳이 없어요. 그래서 손님이 눌러도 ‘아직 연결되지 않았어요’ 안내만 나와요.</span><button class="btn small" data-open-guide="login">로그인 연결하는 법 보기</button></div>`),
          ui.section('아래 링크', ui.check('showFind', p.showFind, '아이디 · 비밀번호 찾기') + (p.showFind ? ui.link('findLink', p.findLink, T) : '') +
            ui.check('showJoin', p.showJoin, '회원가입') + (p.showJoin ? ui.link('joinLink', p.joinLink, T) : '') +
            ui.check('showRemember', p.showRemember, '‘로그인 상태 유지’ 보이기'),
            '글자(제목 · 칸 이름 · 버튼)는 페이지에서 두 번 눌러 고쳐요.', 'content'),
          ui.section('바탕색', ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look'),
          ui.section('로그인 연결 (개발자용)',
            ui.input('action', p.action, { label: '로그인 정보를 보낼 주소 (action)', placeholder: '예: https://내서버/login' }) +
            ui.sub('보내는 방식 (개발자가 정해요)') + ui.seg('method', p.method, [['post', 'POST (추천)'], ['get', 'GET']]),
            '홈터는 모양만 만들어요. 실제 로그인은 내려받은 파일에 직접 연결해요. 파일 안에 ‘홈터 · 로그인 연결 자리’ 안내가 들어 있어요. 보내는 이름: username, password, remember', 'more')
        ].join('');
      }
    },

    // =======================================================
    // 공지 띠: 맨 위 한 줄 알림 · 기간이 지나면 손님 화면에서 저절로 사라져요
    notice: {
      content: ["text","more","link","start","end"],
      lists: [],
      name: '공지 띠',
      en: 'Notice Bar',
      zone: 'header',
      single: true,
      desc: '맨 위 한 줄 알림 · 기간을 정하면 그때만 보여요',
      thumb: `<div class="t t-notice"><i class="t-line w60"></i></div>`,
      defaults: () => ({ text: '10월 20일(월)은 쉬어요. 21일부터 정상 영업해요.', more: '', link: '', start: '', end: '', tone: 'point' }),
      dropPath: () => null,
      render: (p, h) => {
        const tone = { dark: 'background:var(--c-dark);color:var(--c-dark-ink)', soft: 'background:var(--c-soft);color:var(--c-text)' }[p.tone] || 'background:var(--c-point);color:var(--c-point-ink)';
        const when = p.start || p.end ? `${p.start || '처음'} ~ ${p.end || '계속'}` : '';
        return `<div class="b-notice" style="${tone}"${p.start ? ` data-notice-start="${h.attr(p.start)}"` : ''}${p.end ? ` data-notice-end="${h.attr(p.end)}"` : ''}>
          <span class="b-notice-text" data-edit="text">${h.text(p.text)}</span>
          ${p.more ? `<a class="b-notice-more"${h.href(p.link)} data-edit="more">${h.text(p.more)}</a>` : ''}
          ${h.editor && when ? `<span class="b-notice-when">${h.text(when)}에만 보여요</span>` : ''}
        </div>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const date = (k, label) => `<label class="input-label">${label}</label><input class="input" type="date" data-field="${k}" value="${h.attr(p[k] || '')}">`;
        return [
          ui.section('보이는 기간', date('start', '보이기 시작하는 날') + date('end', '마지막 날'),
            '비워 두면 늘 보여요. 마지막 날이 지나면 손님 화면에서 저절로 사라져요 (다시 내려받거나 반영하지 않아도 돼요). 글은 페이지에서 두 번 눌러 고쳐요.', 'content'),
          ui.section('자세히 보기 버튼', ui.input('more', p.more, { label: '버튼 글자 (비우면 안 보여요)', placeholder: '예: 자세히' }) + (p.more ? ui.link('link', p.link, h.linkTargets()) : ''), '', 'content'),
          ui.section('색', ui.seg('tone', p.tone || 'point', [['point', '포인트색'], ['dark', '어두운 색'], ['soft', '연한 색']]), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 영업시간: 요일별 시간 + '지금 영업 중' (손님 화면은 열 때마다 시계를 보고 바꿔요)
    hours: {
      content: ["title","sub","days.*.day","days.*.time","brk","last","note"],
      lists: ["days"],
      name: '영업시간',
      en: 'Business Hours',
      zone: 'main',
      desc: '요일별 시간 · 지금 영업 중인지 저절로',
      thumb: `<div class="t t-schedule"><span class="t-srow"><b></b><i></i></span><span class="t-srow"><b></b><i></i></span><span class="t-srow"><b></b><i></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '영업시간', sub: '',
        days: [
          { day: '월 ~ 금', time: '11:00 - 21:00' },
          { day: '토요일', time: '11:00 - 22:00' },
          { day: '일요일', time: '쉬어요' }
        ],
        brk: '15:00 - 17:00', last: '20:30', note: '공휴일 휴무는 공지로 알려드려요.',
        showNow: true, word: '영업', look: 'box', bg: ''
      }),
      newItem: { 'days': () => ({ day: '요일', time: '10:00 - 20:00' }) },
      dropPath: () => null,
      render: (p, h) => {
        const st = p.showNow ? hoursStatus(p, new Date()) : null;
        const today = new Date().getDay();
        const data = JSON.stringify({ days: p.days, brk: p.brk, last: p.last, word: p.word });
        return `
        <section class="b-hours look-${h.attr(p.look || 'box')}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <div class="b-hours-box"${p.showNow ? ` data-hours="${h.attr(data)}"` : ''}>
            ${st ? `<p class="b-hours-now is-${st.state}"><i></i><span>${h.text(st.text)}</span></p>` : ''}
            <dl class="b-hours-list">
              ${p.days.map((d, i) => `<div class="b-hours-row${hoursDays(d.day).indexOf(today) >= 0 ? ' is-today' : ''}" data-hours-days="${hoursDays(d.day).join(',')}">
                <dt data-edit="days.${i}.day">${h.text(d.day)}</dt><dd data-edit="days.${i}.time">${h.text(d.time)}</dd></div>`).join('')}
              ${p.brk ? `<div class="b-hours-row is-sub"><dt>쉬는 시간</dt><dd data-edit="brk">${h.text(p.brk)}</dd></div>` : ''}
              ${p.last ? `<div class="b-hours-row is-sub"><dt>마지막 주문</dt><dd data-edit="last">${h.text(p.last)}</dd></div>` : ''}
            </dl>
            ${p.note ? `<p class="b-hours-note" data-edit="note" data-multiline>${h.text(p.note)}</p>` : ''}
          </div>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.days.map((d, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`days.${i}.day`, d.day, { small: true, placeholder: '요일 (예: 월 ~ 금)' })}${ui.itemTools('days', i, p.days.length, 1)}</div>
            ${ui.input(`days.${i}.time`, d.time, { small: true, placeholder: '시간 (예: 11:00 - 21:00 · 쉬어요)' })}
          </div>`).join('');
        return [
          ui.section(`요일별 시간 <small>${p.days.length}줄</small>`, rows + ui.addBtn('days', '줄 더하기', p.days.length >= 10),
            '요일은 ‘월 ~ 금’, ‘평일’, ‘주말’, ‘토요일’처럼 적어요. 쉬는 날은 시간 칸에 ‘쉬어요’라고 적어요. 밤 12시를 넘기면 ‘18:00 - 02:00’처럼 적어요.', 'content'),
          ui.section('쉬는 시간 · 마지막 주문', ui.input('brk', p.brk, { label: '쉬는 시간 (비우면 안 보여요)', placeholder: '예: 15:00 - 17:00' }) +
            ui.input('last', p.last, { label: '마지막 주문 (비우면 안 보여요)', placeholder: '예: 20:30' }), '', 'content'),
          ui.section('지금 영업 중 표시', ui.check('showNow', p.showNow, '‘지금 영업 중 · 21:00까지’ 보여주기') +
            ui.sub('부르는 말') + ui.seg('word', p.word || '영업', [['영업', '영업'], ['운영', '운영'], ['진료', '진료'], ['상담', '상담']]),
            '손님이 홈페이지를 열 때마다 그 시각을 보고 ‘영업 중 · 쉬는 시간 · 영업 전 · 오늘은 쉬어요’로 저절로 바뀌어요. 임시 휴무는 맨 위 ‘공지 띠’로 알려 주세요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('look', p.look || 'box', [['box', '상자'], ['plain', '상자 없이'], ['dark', '어두운 상자']]) + ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 줄 보기: 연혁 · 경력 · 걸어온 길
    timeline: {
      content: ["title","sub","items.*.year","items.*.title","items.*.text"],
      lists: ["items"],
      name: '연혁 · 경력',
      en: 'Timeline',
      zone: 'main',
      desc: '연도별로 한 줄씩 · 회사 연혁 · 내 경력',
      thumb: `<div class="t t-timeline"><i></i><i></i><i></i></div>`,
      defaults: () => ({
        showHead: true, title: '걸어온 길', sub: '',
        items: [
          { year: '2026', title: '새 사무실로 옮겼어요', text: '' },
          { year: '2023', title: '지역 우수 기업으로 뽑혔어요', text: '' },
          { year: '2020', title: '처음 문을 열었어요', text: '작은 공간에서 시작했어요.' }
        ],
        look: 'left', bg: ''
      }),
      newItem: { 'items': () => ({ year: String(new Date().getFullYear()), title: '새 일', text: '' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-timeline look-${h.attr(p.look || 'left')}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ol class="b-tl-list">
            ${p.items.map((it, i) => `<li class="b-tl">
              <b class="b-tl-year" data-edit="items.${i}.year">${h.text(it.year)}</b>
              <div class="b-tl-body"><h3 data-edit="items.${i}.title">${h.text(it.title)}</h3>${it.text ? `<p data-edit="items.${i}.text" data-multiline>${h.text(it.text)}</p>` : ''}</div>
            </li>`).join('')}
          </ol>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.year`, it.year, { small: true, placeholder: '연도 (예: 2024 · 2024.03)' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            ${ui.input(`items.${i}.title`, it.title, { small: true, placeholder: '한 일' })}
          </div>`).join('');
        return [
          ui.section(`줄 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '줄 더하기', p.items.length >= 40),
            '최근 일을 위에 두는 게 보통이에요. 자세한 글은 페이지에서 두 번 눌러 적어요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('look', p.look || 'left', [['left', '왼쪽 줄'], ['center', '가운데 줄 · 양옆'], ['cards', '연도별 상자']]) + ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 게시판 모양 목록: 공지사항 · 회사 소식 · 보도자료
    board: {
      content: ["title","sub","items.*.posted","items.*.title","items.*.link","items.*.file","more","moreLink"],
      lists: ["items"],
      name: '게시판 목록',
      en: 'Board List',
      zone: 'main',
      desc: '번호 · 제목 · 날짜 한 줄씩 · 공지사항 · 보도자료',
      thumb: `<div class="t t-board"><i></i><i></i><i></i><i></i></div>`,
      defaults: () => ({
        showHead: true, title: '공지사항', sub: '',
        items: [
          { posted: todayStr(), title: '홈페이지를 새로 열었어요', link: '', file: null, fname: '' },
          { posted: '2026-09-01', title: '추석 연휴 쉬는 날 안내', link: '', file: null, fname: '' },
          { posted: '2026-08-12', title: '여름 프로그램 신청 결과 안내', link: '', file: null, fname: '' }
        ],
        showNo: true, newDays: 7, more: '', moreLink: '', look: 'line', bg: ''
      }),
      newItem: { 'items': () => ({ posted: todayStr(), title: '새 글', link: '', file: null, fname: '' }) },
      // 새 글은 맨 위에 더해요
      addAt: 'top',
      dropPath: () => null,
      render: (p, h) => {
        const n = p.items.length;
        return `
        <section class="b-board look-${h.attr(p.look || 'line')}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ul class="b-board-list"${Number(p.newDays) ? ` data-new-days="${Number(p.newDays)}"` : ''}>
            ${p.items.map((it, i) => {
              const fresh = Number(p.newDays) && isRecent(it.posted, Number(p.newDays));
              const file = it.file ? h.asset(it.file) : '';
              return `<li class="b-board-row" data-posted="${h.attr(it.posted || '')}">
                ${p.showNo ? `<span class="b-board-no">${n - i}</span>` : ''}
                <a class="b-board-title"${h.href(it.link)}><span data-edit="items.${i}.title">${h.text(it.title)}</span>${fresh ? '<em class="b-new">N</em>' : ''}</a>
                ${file ? `<a class="b-board-file" href="${h.attr(file)}" download="${h.attr(it.fname || '첨부파일')}" title="첨부파일 받기 · ${h.attr(it.fname || '')}">${FILE_ICON}</a>` : '<span class="b-board-file"></span>'}
                <time class="b-board-date" data-edit="items.${i}.posted">${h.text(it.posted)}</time>
              </li>`;
            }).join('')}
          </ul>
          ${p.more ? `<div class="b-board-more"><a class="b-button small"${h.href(p.moreLink)} data-edit="more">${h.text(p.more)}</a></div>` : ''}
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.title`, it.title, { small: true, placeholder: '글 제목' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            <input class="input small" type="date" data-field="items.${i}.posted" value="${h.attr(it.posted || '')}" aria-label="올린 날">
            ${ui.link(`items.${i}.link`, it.link, T, { label: '제목을 누르면 갈 곳 (선택)' })}
            ${fileField(h, `items.${i}`, it)}
          </div>`).join('');
        return [
          ui.section(`글 <small>${p.items.length}개</small>`, ui.addBtn('items', '새 글 맨 위에 더하기', p.items.length >= 60) + rows,
            '새 글은 맨 위에 들어가요. 올린 날이 며칠 안 지났으면 제목 옆에 N 표시가 저절로 붙어요.', 'content'),
          ui.section('더 보기 버튼', ui.input('more', p.more, { label: '버튼 글자 (비우면 안 보여요)', placeholder: '예: 공지 전체 보기' }) + (p.more ? ui.link('moreLink', p.moreLink, T) : ''), '', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('look', p.look || 'line', [['line', '줄 목록'], ['card', '카드'], ['simple', '번호 없이 간단히']]) + ui.check('showNo', p.showNo, '글 번호 보이기') +
            ui.seg('newDays', String(p.newDays), [['0', 'N 표시 안 함'], ['3', '3일'], ['7', '7일'], ['14', '14일']]) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 자료 내려받기: 신청서 · 서식 · 카탈로그 · 이력서
    files: {
      content: ["title","sub","items.*.name","items.*.desc","items.*.file","items.*.url"],
      lists: ["items"],
      name: '자료 내려받기',
      en: 'Downloads',
      zone: 'main',
      desc: '신청서 · 서식 · 카탈로그 · 이력서 PDF',
      thumb: `<div class="t t-files"><i></i><i></i></div>`,
      defaults: () => ({
        showHead: true, title: '자료실', sub: '필요한 서식을 내려받아 쓰세요.',
        items: [
          { name: '신청서 (한글 파일)', desc: '적어서 메일로 보내 주세요.', file: null, fname: '', url: '' },
          { name: '안내 책자 (PDF)', desc: '', file: null, fname: '', url: '' }
        ],
        button: '내려받기', bg: ''
      }),
      newItem: { 'items': () => ({ name: '새 자료', desc: '', file: null, fname: '', url: '' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-files"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ul class="b-files-list">
            ${p.items.map((it, i) => {
              const href = it.file ? h.asset(it.file) : (it.url || '');
              const ext = fileExt(it.fname || it.url || '');
              return `<li class="b-file">
                <span class="b-file-ext">${h.text(ext || '파일')}</span>
                <div class="b-file-body"><b data-edit="items.${i}.name">${h.text(it.name)}</b>${it.desc ? `<small data-edit="items.${i}.desc">${h.text(it.desc)}</small>` : ''}</div>
                ${href ? `<a class="b-button small" href="${h.attr(href)}"${it.file ? ` download="${h.attr(it.fname || it.name)}"` : ' target="_blank" rel="noopener"'}>${h.text(p.button || '내려받기')}</a>`
                  : (h.editor ? '<span class="b-file-empty">파일을 넣어 주세요</span>' : '')}
              </li>`;
            }).join('')}
          </ul>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.name`, it.name, { small: true, placeholder: '자료 이름' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            ${ui.input(`items.${i}.desc`, it.desc, { small: true, placeholder: '짧은 설명 (선택)' })}
            ${fileField(h, `items.${i}`, it)}
            ${it.file ? '' : ui.input(`items.${i}.url`, it.url, { small: true, placeholder: '또는 파일이 있는 인터넷 주소 (구글 드라이브 등)' })}
          </div>`).join('');
        return [
          ui.section(`자료 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '자료 더하기', p.items.length >= 30),
            'PDF · 한글 · 워드 · 엑셀 · 압축 파일을 넣을 수 있어요 (한 파일 10MB까지). 큰 파일은 구글 드라이브에 올리고 주소를 적어요.', 'content'),
          ui.section('버튼 글자', ui.input('button', p.button, { placeholder: '내려받기' }), '', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 단계 안내: 민원 처리 · 이용 방법 · 주문 순서
    steps: {
      content: ["title","sub","items.*.title","items.*.text"],
      lists: ["items"],
      name: '단계 안내',
      en: 'Steps',
      zone: 'main',
      desc: '① 신청 → ② 검토 → ③ 안내 · 이용 순서',
      thumb: `<div class="t t-steps"><i>1</i><i>2</i><i>3</i></div>`,
      defaults: () => ({
        showHead: true, title: '이렇게 진행돼요', sub: '',
        items: [
          { title: '신청', text: '홈페이지나 전화로 신청해요.' },
          { title: '검토', text: '담당자가 3일 안에 살펴봐요.' },
          { title: '결과 안내', text: '문자로 결과를 알려드려요.' }
        ],
        look: 'box', bg: ''
      }),
      newItem: { 'items': () => ({ title: '새 단계', text: '' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-steps look-${h.attr(p.look || 'box')}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ol class="b-steps-list" style="--n:${Math.min(p.items.length, 5)}">
            ${p.items.map((it, i) => `<li class="b-step"><span class="b-step-no">${i + 1}</span><h3 data-edit="items.${i}.title">${h.text(it.title)}</h3>${it.text ? `<p data-edit="items.${i}.text" data-multiline>${h.text(it.text)}</p>` : ''}</li>`).join('')}
          </ol>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.title`, it.title, { small: true, placeholder: '단계 이름' })}${ui.itemTools('items', i, p.items.length, 2)}</div>
          </div>`).join('');
        return [
          ui.section(`단계 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '단계 더하기', p.items.length >= 8),
            '번호는 저절로 붙어요. 설명 글은 페이지에서 두 번 눌러 적어요. 5단계가 넘으면 두 줄로 보여요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('look', p.look || 'box', [['box', '네모 상자'], ['line', '선으로 잇기'], ['big', '큰 번호']]) + ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 로고 띠: 거래처 · 인증서 · 특허 · 함께하는 곳
    logos: {
      content: ["title","sub","items.*.image","items.*.name","items.*.link"],
      lists: ["items"],
      name: '로고 · 인증 띠',
      en: 'Logo Strip',
      zone: 'main',
      desc: '거래처 · 인증서 · 특허 로고를 줄지어',
      thumb: `<div class="t t-logos"><i></i><i></i><i></i><i></i></div>`,
      defaults: () => ({
        showHead: true, title: '함께하는 곳', sub: '',
        items: [{ image: null, name: '거래처 1', link: '' }, { image: null, name: '거래처 2', link: '' }, { image: null, name: '인증 1', link: '' }, { image: null, name: '인증 2', link: '' }],
        gray: true, size: 'm', bg: ''
      }),
      newItem: { 'items': () => ({ image: null, name: '새 로고', link: '' }) },
      dropPath: (p) => { const i = p.items.findIndex((x) => !x.image); return i >= 0 ? `items.${i}.image` : null; },
      render: (p, h) => `
        <section class="b-logos size-${h.attr(p.size)}${p.gray ? ' is-gray' : ''}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ul class="b-logos-list">
            ${p.items.map((it, i) => {
              const src = h.asset(it.image);
              const inner = src ? `<img src="${src}" alt="${h.attr(it.name)}">` : `<span class="b-logo-name" data-edit="items.${i}.name">${h.text(it.name)}</span>`;
              return `<li>${it.link ? `<a${h.href(it.link)} title="${h.attr(it.name)}">${inner}</a>` : inner}</li>`;
            }).join('')}
          </ul>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.name`, it.name, { small: true, placeholder: '이름 (사진 설명으로도 쓰여요)' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            ${ui.photo(`items.${i}.image`, h.asset(it.image), { alpha: true, contain: true, compact: true, addLabel: '로고 그림 넣기' })}
            ${ui.link(`items.${i}.link`, it.link, T, { label: '누르면 갈 곳 (선택)' })}
          </div>`).join('');
        return [
          ui.section(`로고 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '로고 더하기', p.items.length >= 30),
            '바탕이 비치는 PNG 로고가 가장 깔끔해요. 그림이 없으면 이름 글자로 보여요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.check('gray', p.gray, '로고를 회색으로 (마우스를 올리면 원래 색)') +
            ui.seg('size', p.size, [['s', '작게'], ['m', '보통'], ['l', '크게']]) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 채용 공고: 마감일이 지나면 저절로 '마감'
    jobs: {
      content: ["title","sub","items.*.title","items.*.job","items.*.place","items.*.end","items.*.button","items.*.link"],
      lists: ["items"],
      name: '채용 공고',
      en: 'Jobs',
      zone: 'main',
      desc: '모집 분야 · 마감일 · 지나면 저절로 마감',
      thumb: `<div class="t t-board"><i></i><i></i><i></i></div>`,
      defaults: () => ({
        showHead: true, title: '함께 일할 분을 찾아요', sub: '',
        items: [
          { title: '매장 직원', job: '정규직', place: '본점', end: '', button: '지원하기', link: '' },
          { title: '주말 아르바이트', job: '아르바이트', place: '본점', end: '', button: '지원하기', link: '' }
        ],
        showClosed: true, bg: ''
      }),
      newItem: { 'items': () => ({ title: '새 모집', job: '', place: '', end: '', button: '지원하기', link: '' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-jobs"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ul class="b-jobs-list"${p.showClosed ? '' : ' data-hide-closed'}>
            ${p.items.map((it, i) => {
              const closed = it.end && it.end < todayStr();
              return `<li class="b-job${closed ? ' is-closed' : ''}"${it.end ? ` data-job-end="${h.attr(it.end)}"` : ''}>
                <div class="b-job-body">
                  <h3 data-edit="items.${i}.title">${h.text(it.title)}</h3>
                  <p class="b-job-meta">${[it.job ? `<span data-edit="items.${i}.job">${h.text(it.job)}</span>` : '', it.place ? `<span data-edit="items.${i}.place">${h.text(it.place)}</span>` : '', `<span class="b-job-end">${it.end ? h.text(it.end.replace(/-/g, '.')) + ' 마감' : '채용 시 마감'}</span>`].filter(Boolean).join('<i class="b-sep">|</i>')}</p>
                </div>
                <span class="b-job-state">마감</span>
                ${it.button ? `<a class="b-button small b-job-btn"${h.href(it.link)} data-edit="items.${i}.button">${h.text(it.button)}</a>` : ''}
              </li>`;
            }).join('')}
          </ul>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.title`, it.title, { small: true, placeholder: '모집 분야' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            <div class="tbl-cells" style="--n:2">${ui.input(`items.${i}.job`, it.job, { small: true, placeholder: '형태 (예: 정규직)' })}${ui.input(`items.${i}.place`, it.place, { small: true, placeholder: '근무지 (선택)' })}</div>
            <label class="input-label">마감일 (비우면 ‘채용 시 마감’)</label>
            <input class="input small" type="date" data-field="items.${i}.end" value="${h.attr(it.end || '')}">
            ${ui.input(`items.${i}.button`, it.button, { small: true, placeholder: '버튼 글자 (비우면 안 보여요)' })}
            ${it.button ? ui.link(`items.${i}.link`, it.link, T, { label: '버튼을 누르면 갈 곳 (지원 양식 · 메일)' }) : ''}
          </div>`).join('');
        return [
          ui.section(`모집 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '모집 더하기', p.items.length >= 20),
            '마감일이 지나면 손님 화면에서 저절로 ‘마감’으로 바뀌고 버튼이 사라져요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.check('showClosed', p.showClosed, '마감된 공고도 보여주기 (끄면 숨겨요)') +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 작업물: 분류 버튼으로 골라 보기 (포트폴리오 · 시공 사례 · 제품)
    works: {
      content: ["title","sub","cats","items.*.image","items.*.title","items.*.cat","items.*.text","items.*.link"],
      lists: ["items"],
      name: '작업물 · 분류별 보기',
      en: 'Works',
      zone: 'main',
      desc: '‘전체 · 웹 · 인쇄’ 버튼으로 골라 보기 · 포트폴리오 · 제품',
      thumb: `<div class="t t-gallery"><span class="t-grid"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`,
      defaults: () => ({
        showHead: true, title: '작업물', sub: '',
        cats: '웹, 인쇄, 사진',
        items: [
          { image: null, title: '카페 홈페이지', cat: '웹', text: '', link: '' },
          { image: null, title: '가을 행사 포스터', cat: '인쇄', text: '', link: '' },
          { image: null, title: '제품 사진', cat: '사진', text: '', link: '' },
          { image: null, title: '병원 홈페이지', cat: '웹', text: '', link: '' }
        ],
        cols: 3, ratio: '4/3', bg: ''
      }),
      newItem: { 'items': () => ({ image: null, title: '새 작업', cat: '', text: '', link: '' }) },
      dropPath: (p) => { const i = p.items.findIndex((x) => !x.image); return i >= 0 ? `items.${i}.image` : null; },
      render: (p, h) => {
        const cats = String(p.cats || '').split(',').map((s) => s.trim()).filter(Boolean);
        return `
        <section class="b-works"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          ${cats.length ? `<div class="b-works-cats" role="group" aria-label="분류">${['전체'].concat(cats).map((c, i) => `<button type="button" class="${i ? '' : 'is-on'}" data-cat="${i ? h.attr(c) : ''}">${h.text(c)}</button>`).join('')}</div>` : ''}
          <ul class="b-works-list" style="--cols:${Number(p.cols) || 3};--ratio:${h.attr(p.ratio || '4/3')}">
            ${p.items.map((it, i) => {
              const src = h.asset(it.image);
              const pic = src ? `<img src="${src}" alt="${h.attr(it.title)}" loading="lazy">` : (h.editor ? h.placeholder(`items.${i}.image`, '사진 넣기') : '<span class="b-works-nopic"></span>');
              const body = `<span class="b-works-pic">${pic}</span><span class="b-works-cap"><small>${h.text(it.cat)}</small><b data-edit="items.${i}.title">${h.text(it.title)}</b>${it.text ? `<span data-edit="items.${i}.text">${h.text(it.text)}</span>` : ''}</span>`;
              return `<li class="b-work" data-cat="${h.attr(String(it.cat || '').trim())}">${it.link ? `<a${h.href(it.link)}>${body}</a>` : body}</li>`;
            }).join('')}
          </ul>
        </section>`;
      },
      inspector: (p, h) => {
        const ui = h.ui;
        const T = h.linkTargets();
        const cats = String(p.cats || '').split(',').map((s) => s.trim()).filter(Boolean);
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.title`, it.title, { small: true, placeholder: '작업 이름' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            ${ui.photo(`items.${i}.image`, h.asset(it.image), { compact: true, frames: 'ratio:' + (p.ratio || '4/3') })}
            ${cats.length ? `<select class="input small" data-field="items.${i}.cat" aria-label="분류"><option value="">분류 고르기</option>${cats.map((c) => `<option${c === String(it.cat || '').trim() ? ' selected' : ''}>${h.text(c)}</option>`).join('')}</select>` : ''}
            ${ui.link(`items.${i}.link`, it.link, T, { label: '누르면 갈 곳 (작업 자세히 보기 페이지)' })}
          </div>`).join('');
        return [
          ui.section('분류 이름', ui.input('cats', p.cats, { placeholder: '쉼표로 나눠요 (예: 웹, 인쇄, 사진)' }),
            '여기 적은 분류가 ‘전체’ 옆 버튼이 돼요. 비우면 버튼 없이 다 보여요.', 'content'),
          ui.section(`작업 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '작업 더하기', p.items.length >= 60),
            '작업마다 자세한 페이지를 만들고 ‘누르면 갈 곳’으로 이어 주면 포트폴리오가 돼요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('cols', String(p.cols), [['2', '2줄'], ['3', '3줄'], ['4', '4줄']]) +
            ui.sub('사진 비율') + ui.ratio('ratio', p.ratio, { dir: p.ratioDir }) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    // 숫자로 보는 우리: 큰 숫자 3~4개 (업력 · 손님 수 · 별점 …)
    stats: {
      content: ["title","sub","items.*.num","items.*.unit","items.*.label"],
      lists: ["items"],
      name: '숫자로 보는 우리',
      en: 'Stats',
      zone: 'main',
      desc: '“10년 · 3,000명 · 4.9점”처럼 큰 숫자로',
      thumb: `<div class="t t-steps"><i>10</i><i>3K</i><i>4.9</i></div>`,
      defaults: () => ({
        showHead: true, title: '숫자로 보는 우리', sub: '',
        items: [
          { num: '10', unit: '년', label: '한자리에서' },
          { num: '3,000', unit: '명+', label: '다녀간 손님' },
          { num: '4.9', unit: '점', label: '평균 별점' }
        ],
        look: 'plain', bg: ''
      }),
      newItem: { 'items': () => ({ num: '0', unit: '', label: '설명' }) },
      dropPath: () => null,
      render: (p, h) => `
        <section class="b-stats look-${h.attr(p.look || 'plain')}"${bgStyle(h, p.bg)}>
          ${sectionHead(p, h)}
          <ul class="b-stats-list" style="--n:${Math.min(p.items.length, 4)}">
            ${p.items.map((it, i) => `<li class="b-stat"><b><span data-edit="items.${i}.num">${h.text(it.num)}</span><small data-edit="items.${i}.unit">${h.text(it.unit)}</small></b><p data-edit="items.${i}.label">${h.text(it.label)}</p></li>`).join('')}
          </ul>
        </section>`,
      inspector: (p, h) => {
        const ui = h.ui;
        const rows = p.items.map((it, i) => `
          <div class="list-card">
            <div class="list-row">${ui.input(`items.${i}.label`, it.label, { small: true, placeholder: '설명 (예: 다녀간 손님)' })}${ui.itemTools('items', i, p.items.length, 1)}</div>
            <div class="tbl-cells" style="--n:2">${ui.input(`items.${i}.num`, it.num, { small: true, placeholder: '숫자 (예: 3,000)' })}${ui.input(`items.${i}.unit`, it.unit, { small: true, placeholder: '단위 (예: 명+)' })}</div>
          </div>`).join('');
        return [
          ui.section(`숫자 <small>${p.items.length}개</small>`, rows + ui.addBtn('items', '숫자 더하기', p.items.length >= 8),
            '3~4개가 가장 보기 좋아요. 부풀리지 말고 실제 숫자를 적어 주세요.', 'content'),
          headFields(p, ui),
          ui.section('모양', ui.seg('look', p.look || 'plain', [['plain', '숫자만'], ['card', '상자'], ['point', '포인트색 띠']]) +
            ui.sub('바탕색') + ui.swatches('bg', p.bg, SITE('사이트 바탕').concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    },

    // =======================================================
    spacer: {
      content: [],
      lists: [],
      name: '빈 칸',
      en: 'Spacer',
      zone: 'main',
      desc: '블록 사이 여백 · 구분선',
      thumb: `<div class="t t-spacer"><i></i></div>`,
      defaults: () => ({ size: 80, line: false, lineWidth: 'narrow', bg: '' }),
      dropPath: () => null,
      render: (p, h) => `
        <div class="b-spacer${p.line ? ' has-line line-' + h.attr(p.lineWidth) : ''}" style="height:${Number(p.size) || 80}px${p.bg ? ';background:' + h.attr(p.bg) : ''}">
          ${p.line ? '<hr>' : ''}
          ${h.editor ? `<span class="b-spacer-tag">빈 칸 · ${Number(p.size) || 80}px</span>` : ''}
        </div>`,
      inspector: (p, h) => {
        const ui = h.ui;
        return [
          ui.section('높이', ui.range('size', p.size, 16, 320, 8, '빈 칸 높이', 'px'),
            '블록 아래쪽 손잡이를 끌어도 높이가 바뀌어요.'),
          ui.section('구분선', ui.check('line', p.line, '가운데에 선 긋기') +
            (p.line ? ui.seg('lineWidth', p.lineWidth, [['narrow', '짧게'], ['wide', '넓게'], ['full', '끝까지']]) : '')),
          ui.section('바탕색', ui.swatches('bg', p.bg, [['', '바탕색 없음 (뒤가 비쳐요)']].concat(BG_LIGHT)), '', 'look')
        ].join('');
      }
    }
  };

  // =========================================================
  // 서랍에 보이는 모양들 (같은 블록이라도 처음 모양이 달라요)
  // =========================================================
  // 서랍에는 블록 '종류'만 하나씩 둬요.
  // 같은 블록의 다른 모양(로고 가운데, 사진 왼쪽, 벽에 고정 등)은 오른쪽 설정에서 바꿔요.
  const PRESETS = [
    { zone: 'header', ko: '맨 위', en: 'Header', items: [
      { id: 'header', type: 'header', name: '맨 위 메뉴', desc: '로고와 메뉴 · 벽에 고정도 돼요', props: {} },
      { id: 'notice', type: 'notice', name: '공지 띠', desc: '“이번 주 휴무” 같은 한 줄 알림 · 기간이 지나면 저절로 사라져요', props: {} }
    ] },
    { zone: 'banner', ko: '큰 소개', en: 'Main Banner', items: [
      { id: 'banner', type: 'banner', name: '메인 배너', desc: '한 장이면 큰 사진, 여러 장이면 슬라이드', props: {} }
    ] },
    { zone: 'main', ko: '본문', en: 'Main', items: [
      { id: 'text', type: 'text', group: 'basic', name: '글 본문', desc: '제목과 글 · 옆에 사진도 돼요', props: {} },
      { id: 'image', type: 'image', group: 'basic', name: '사진', desc: '사진 한 장', props: {} },
      { id: 'video', type: 'video', group: 'basic', name: '영상', desc: '유튜브 주소나 영상 파일', props: {} },
      { id: 'spacer', type: 'spacer', group: 'basic', name: '빈 칸', desc: '여백 · 구분선', props: {} },
      { id: 'text-left', type: 'text', group: 'basic', name: '사진 왼쪽 · 글', desc: '사진 옆에 소개 글', props: { imagePos: 'left', title: '우리를 소개합니다' } },
      { id: 'text-right', type: 'text', group: 'basic', name: '글 · 사진 오른쪽', desc: '글 옆에 사진', props: { imagePos: 'right', title: '이렇게 만들어요' } },
      { id: 'big-quote', type: 'text', group: 'basic', name: '큰 문구 강조', desc: '한 문장을 크게 · 가운데', props: { align: 'center', eyebrow: '우리의 약속', title: '“매일 아침, 가장 좋은 재료만 고릅니다”', body: '— 대표 홍길동' } },
      { id: 'cta-band', type: 'text', group: 'basic', name: '버튼 띠 · 지금 예약', desc: '어두운 띠에 버튼 하나', props: { align: 'center', title: '지금 바로 예약하세요', body: '전화 한 통이면 충분해요.', showButton: true, button: '예약하기', skin: 'dark' } },
      { id: 'stats', type: 'stats', group: 'basic', name: '숫자로 보는 우리', desc: '“10년 · 3,000명 · 4.9점”', props: {} },
      { id: 'intro-me', type: 'text', group: 'basic', tags: ['folio'], name: '자기소개', desc: '사진과 함께 나를 소개', props: { imagePos: 'left', ratio: '3/4', eyebrow: 'ABOUT ME', title: '안녕하세요, ○○○입니다', body: '사람들이 편하게 쓰는 화면을 만들어요.\n작은 가게부터 회사 홈페이지까지 함께했어요.', showButton: true, button: '작업물 보기' } },
      { id: 'cards', type: 'cards', group: 'often', name: '카드 슬라이드', desc: '사진 카드 여러 장을 옆으로 넘겨요', props: {} },
      { id: 'gallery', type: 'gallery', group: 'often', name: '갤러리', desc: '사진 여러 장 · 누르면 크게', props: {} },
      { id: 'faq', type: 'faq', group: 'often', name: '자주 묻는 질문', desc: '질문을 누르면 답이 펼쳐져요', props: {} },
      { id: 'reviews', type: 'reviews', group: 'often', name: '후기', desc: '손님 후기 · 별점', props: {} },
      { id: 'table', type: 'table', group: 'often', name: '표', desc: '시간표 · 가격 비교 · 부서 안내', props: {} },
      { id: 'schedule', tags: ['academy', 'event', 'office'], type: 'schedule', group: 'often', name: '일정', desc: '행사 · 수업 · 공연 날짜', props: {} },
      { id: 'team', tags: ['clinic', 'academy', 'company'], type: 'team', group: 'often', name: '팀 소개', desc: '의료진 · 강사 · 직원 소개', props: {} },
      { id: 'cards-menu', type: 'cards', group: 'often', tags: ['shop'], name: '대표 메뉴 3가지', desc: '사진 카드 3장 · 넘기지 않아요', props: { title: '대표 메뉴', sub: '', perView: 3, ratio: '1/1', arrows: false, dots: false, cards: [newCard('아메리카노', '고소한 원두로 내려요'), newCard('계절 케이크', '달마다 바뀌어요'), newCard('수제 레몬청', '직접 담가요')] } },
      { id: 'cards-service', type: 'cards', group: 'often', tags: ['company', 'clinic', 'academy', 'office'], name: '하는 일 3가지', desc: '서비스 · 진료 과목 · 수업 소개', props: { title: '이런 일을 해요', sub: '', perView: 3, ratio: '4/3', arrows: false, dots: false, cards: [newCard('상담', '처음부터 함께 고민해요'), newCard('관리', '꼼꼼하게 챙겨요'), newCard('사후 관리', '끝난 뒤에도 연락드려요')] } },
      { id: 'before-after', type: 'cards', group: 'often', tags: ['clinic', 'shop', 'company'], name: '전후 비교', desc: '전 · 후 사진 두 장 나란히', props: { title: '이렇게 달라졌어요', sub: '', perView: 2, ratio: '4/3', arrows: false, dots: false, cards: [newCard('전', '처음 모습'), newCard('후', '작업한 뒤')] } },
      { id: 'gallery-2', type: 'gallery', group: 'often', name: '사진 두 장 나란히', desc: '큰 사진 2장', props: { title: '', showHead: false, cols: 2, ratio: '4/3', images: [newPhoto(), newPhoto()] } },
      { id: 'reviews-box', type: 'reviews', group: 'often', name: '별점 후기 · 상자', desc: '연한 상자 안에 후기', props: { skin: 'soft' } },
      { id: 'reviews-client', type: 'reviews', group: 'often', tags: ['company', 'folio'], name: '고객사 후기', desc: '함께한 회사 · 의뢰인의 말', props: { title: '함께한 분들의 이야기', sub: '', showStars: false, items: [
        { text: '일정을 정확히 지켜 주셔서 믿고 맡겼어요.', name: '○○상사 김 팀장', meta: '홈페이지 제작', stars: 5, photo: null },
        { text: '설명이 쉬워서 처음인데도 편했어요.', name: '○○카페 대표', meta: '브랜드 디자인', stars: 5, photo: null },
        { text: '끝난 뒤에도 꼼꼼히 챙겨 주셨어요.', name: '○○학원 원장', meta: '운영 상담', stars: 5, photo: null }] } },
      { id: 'faq-box', type: 'faq', group: 'often', name: '질문 · 상자 모양', desc: '질문마다 상자로 나눠요', props: { look: 'card' } },
      { id: 'timetable', type: 'table', group: 'often', tags: ['academy', 'event'], name: '수업 시간표', desc: '요일별 반 · 시간', props: { title: '수업 시간표', cols: ['', '월', '수', '금'], rows: [{ cells: ['초등반', '15:00', '15:00', '15:00'] }, { cells: ['중등반', '17:00', '17:00', '17:00'] }, { cells: ['성인반', '19:30', '–', '19:30'] }] } },
      { id: 'event', type: 'text', group: 'often', tags: ['shop', 'academy', 'clinic'], name: '이벤트 · 쿠폰', desc: '할인 · 행사 알림을 눈에 띄게', props: { align: 'center', eyebrow: 'EVENT', title: '첫 방문 10% 할인', body: '이 화면을 보여 주시면 할인해 드려요. (11월 30일까지)', skin: 'soft' } },
      { id: 'team-org', type: 'team', group: 'often', tags: ['office', 'company'], name: '담당자 안내', desc: '부서 · 담당자 사진과 연락처', props: { title: '담당자 안내', shape: 'square', members: [
        { photo: null, alt: '', name: '김담당', role: '총무 · 02-000-0001', text: '시설 · 행사 안내', link: '' },
        { photo: null, alt: '', name: '이담당', role: '민원 · 02-000-0002', text: '서류 신청 · 상담', link: '' },
        { photo: null, alt: '', name: '박담당', role: '홍보 · 02-000-0003', text: '소식 · 취재 문의', link: '' }] } },
      { id: 'hours', tags: ['shop', 'clinic', 'academy', 'office'], type: 'hours', group: 'shop', name: '영업시간', desc: '요일별 시간 · 지금 영업 중인지 저절로', props: {} },
      { id: 'pricing', tags: ['shop', 'clinic', 'academy'], type: 'pricing', group: 'shop', name: '가격표', desc: '요금 · 상품을 나란히', props: {} },
      { id: 'map', tags: ['shop', 'clinic', 'academy', 'office', 'event'], type: 'map', group: 'shop', name: '지도 · 오시는 길', desc: '주소만 적으면 지도 · 네이버 · 카카오맵', props: {} },
      { id: 'form', type: 'form', group: 'shop', name: '문의 · 예약 양식', desc: '이름 · 연락처 · 날짜 · 내용 받기', props: {} },
      { id: 'quote', tags: ['company'], type: 'form', group: 'org', name: '견적 문의 양식', desc: '회사 · 수량 · 원하는 날짜 받기', props: { title: '견적 문의', fields: [
        { kind: 'text', label: '회사 · 기관 이름', required: true, options: '' },
        { kind: 'name', label: '담당자', required: true, options: '' },
        { kind: 'phone', label: '연락처', required: true, options: '' },
        { kind: 'text', label: '품목 · 수량', required: true, options: '' },
        { kind: 'date', label: '원하는 날짜', required: false, options: '' },
        { kind: 'message', label: '자세한 내용', required: false, options: '' }] } },
      { id: 'login', type: 'login', group: 'shop', name: '로그인 칸', desc: '아이디 · 비밀번호 (연결은 내려받은 뒤)', props: {} },
      { id: 'menu-board', type: 'pricing', group: 'shop', tags: ['shop'], name: '메뉴판', desc: '메뉴 이름 · 가격을 한눈에', props: { title: '메뉴', sub: '', badge: '', plans: [
        { name: '아메리카노', price: '4,500원', unit: '', desc: 'HOT · ICE', features: '', button: '', showButton: false, link: '', highlight: false },
        { name: '카페라테', price: '5,000원', unit: '', desc: '우유를 듬뿍', features: '', button: '', showButton: false, link: '', highlight: true },
        { name: '계절 케이크', price: '6,500원', unit: '', desc: '달마다 바뀌어요', features: '', button: '', showButton: false, link: '', highlight: false }] } },
      { id: 'reserve-steps', type: 'steps', group: 'shop', tags: ['shop', 'clinic', 'academy'], name: '예약 안내', desc: '예약 순서 3단계', props: { title: '예약은 이렇게', items: [{ title: '전화 · 카톡', text: '원하는 날짜를 알려 주세요.' }, { title: '확인 문자', text: '예약이 되면 문자를 보내드려요.' }, { title: '방문', text: '예약 시간에 맞춰 오시면 돼요.' }] } },
      { id: 'parking', type: 'table', group: 'shop', tags: ['shop', 'clinic', 'academy', 'office'], name: '주차 · 대중교통', desc: '오시는 방법을 표로', props: { title: '오시는 방법', cols: ['방법', '안내'], rows: [{ cells: ['지하철', '○○역 2번 출구에서 걸어서 5분'] }, { cells: ['버스', '○○ 정류장에서 내려요'] }, { cells: ['주차', '건물 앞 2대 · 1시간 무료'] }] } },
      { id: 'kakao-band', type: 'text', group: 'shop', name: '카톡 상담 띠', desc: '“카톡으로 물어보세요” 버튼', props: { align: 'center', title: '카카오톡으로 편하게 물어보세요', body: '평일 10시 ~ 18시 · 바로 답해 드려요', showButton: true, button: '카톡 상담하기', skin: 'soft' } },
      { id: 'hours-clinic', type: 'hours', group: 'shop', tags: ['clinic'], name: '진료 시간', desc: '지금 진료 중인지 저절로', props: { title: '진료 시간', word: '진료', days: [{ day: '평일', time: '09:00 - 18:00' }, { day: '토요일', time: '09:00 - 13:00' }, { day: '일요일 · 공휴일', time: '쉬어요' }], brk: '13:00 - 14:00', last: '', note: '점심시간에는 접수하지 않아요.' } },
      { id: 'board', tags: ['company', 'office', 'academy'], type: 'board', group: 'org', name: '게시판 목록', desc: '공지사항 · 회사 소식 · 보도자료', props: {} },
      { id: 'files', tags: ['office', 'company', 'folio'], type: 'files', group: 'org', name: '자료 내려받기', desc: '신청서 · 서식 · 카탈로그 · 이력서', props: {} },
      { id: 'steps', tags: ['office', 'clinic', 'company'], type: 'steps', group: 'org', name: '단계 안내', desc: '① 신청 → ② 검토 → ③ 안내', props: {} },
      { id: 'dept', tags: ['office', 'company'], type: 'table', group: 'org', name: '부서 · 담당자 안내', desc: '부서 · 하는 일 · 전화번호 표', props: { title: '부서 안내', cols: ['부서', '하는 일', '전화번호'], rows: [
        { cells: ['총무팀', '시설 · 행사 안내', '02-000-0001'] }, { cells: ['민원팀', '서류 신청 · 상담', '02-000-0002'] }, { cells: ['홍보팀', '소식 · 취재 문의', '02-000-0003'] }] } },
      { id: 'timeline', tags: ['company', 'folio'], type: 'timeline', group: 'org', name: '연혁 · 경력', desc: '연도별로 한 줄씩 · 걸어온 길', props: {} },
      { id: 'logos', tags: ['company', 'office'], type: 'logos', group: 'org', name: '로고 · 인증 띠', desc: '거래처 · 인증서 · 특허 로고', props: {} },
      { id: 'jobs', tags: ['company', 'office'], type: 'jobs', group: 'org', name: '채용 공고', desc: '마감일이 지나면 저절로 마감', props: {} },
      { id: 'works', tags: ['folio', 'company'], type: 'works', group: 'org', name: '작업물 · 분류별 보기', desc: '포트폴리오 · 시공 사례 · 제품', props: {} },
      { id: 'stats-company', type: 'stats', group: 'org', tags: ['company'], name: '회사 숫자 성과', desc: '업력 · 고객사 · 재계약률', props: { title: '숫자로 보는 우리 회사', look: 'card', items: [{ num: '12', unit: '년', label: '업력' }, { num: '340', unit: '곳', label: '함께한 고객사' }, { num: '98', unit: '%', label: '다시 찾는 비율' }] } },
      { id: 'certs', type: 'logos', group: 'org', tags: ['company'], name: '인증 · 특허', desc: '인증서 · 특허 마크를 색 그대로', props: { title: '인증 · 특허', gray: false, items: [{ image: null, name: '인증 1', link: '' }, { image: null, name: '인증 2', link: '' }, { image: null, name: '특허 1', link: '' }] } },
      { id: 'press', type: 'board', group: 'org', tags: ['company', 'office'], name: '보도자료 · 언론 보도', desc: '기사 제목 · 날짜 · 링크', props: { title: '언론 보도', showNo: false, newDays: 0, items: [
        { posted: '2026-09-20', title: '[○○신문] 동네 가게를 살리는 작은 회사', link: '', file: null, fname: '' },
        { posted: '2026-05-02', title: '[○○일보] 올해의 우수 기업 선정', link: '', file: null, fname: '' }] } },
      { id: 'awards', type: 'timeline', group: 'org', tags: ['folio', 'company'], name: '수상 내역', desc: '연도별 수상 · 선정', props: { title: '수상 내역', look: 'cards', items: [{ year: '2026', title: '○○ 디자인 공모전 우수상', text: '' }, { year: '2024', title: '지역 우수 기업 선정', text: '' }, { year: '2022', title: '○○ 협회 감사패', text: '' }] } },
      { id: 'career', type: 'timeline', group: 'org', tags: ['folio'], name: '경력', desc: '회사 · 프로젝트 순서대로', props: { title: '경력', items: [{ year: '2024 –', title: '프리랜서 디자이너', text: '가게 · 기관 홈페이지 40곳' }, { year: '2020 – 2024', title: '○○디자인 디자이너', text: '' }, { year: '2020', title: '○○대학교 시각디자인 졸업', text: '' }] } },
      { id: 'resume', type: 'files', group: 'org', tags: ['folio'], name: '이력서 · 포트폴리오 받기', desc: 'PDF 파일 내려받기', props: { title: '자료 받기', sub: '', items: [{ name: '이력서 (PDF)', desc: '', file: null, fname: '', url: '' }, { name: '포트폴리오 (PDF)', desc: '작업 20개 모음', file: null, fname: '', url: '' }] } },
      { id: 'civil-hours', type: 'hours', group: 'org', tags: ['office'], name: '민원실 운영 시간', desc: '지금 운영 중인지 저절로', props: { title: '민원실 운영 시간', word: '운영', days: [{ day: '평일', time: '09:00 - 18:00' }, { day: '주말', time: '쉬어요' }], brk: '12:00 - 13:00', last: '', note: '공휴일은 쉬어요.' } },
    ] },
    { zone: 'footer', ko: '맨 아래', en: 'Footer', items: [
      { id: 'footer', type: 'footer', name: '맨 아래 정보', desc: '간단하게 · 자세하게', props: {} }
    ] },
    { zone: 'aside', ko: '옆', en: 'Aside', items: [
      { id: 'quick', type: 'quick', name: '퀵메뉴', desc: '카톡·전화·맨 위로 (추천)', props: {} },
      { id: 'aside', type: 'aside', group: 'basic', name: '사이드 칸', desc: '본문 옆 링크 · 배너 (본문에 들어가요)', props: {} }
    ] }
  ];


  // 사이트 이름 = 맨 위 메뉴 제목 맞추기 공통 함수
  // 사이트 이름 = 맨 위 메뉴 제목 맞추기 공통 함수
  function followName(site, oldName, newName, currentBlocks) {
    if (!site || !site.info || site.info.syncName === false || !oldName || !newName || oldName === newName) return;
    const targetBlocks = [
      ...(currentBlocks || []),
      ...(site.shared || []),
      ...(site.pages ? site.pages.flatMap((p) => p.blocks || []) : [])
    ];
    targetBlocks.forEach((b) => {
      if (b && b.type === 'footer' && b.props) {
        const p = b.props;
        if (p.name === oldName) p.name = newName;
        if (typeof p.copy === 'string' && p.copy.includes(oldName)) p.copy = p.copy.split(oldName).join(newName);
        if (p.biz && (site.info.syncCompany === true || p.biz.company === oldName)) p.biz.company = newName;
      }
    });
    if (site.info && site.info.name === oldName) site.info.name = newName;
    // 상호도 사이트 이름과 같이 쓰기 (가게 기본 정보)
    if (site.info.syncCompany === true || (site.info.biz && site.info.biz.company === oldName)) site.info.biz = Object.assign({}, site.info.biz || {}, { company: newName });
  }

  // ---- 사이트 분위기: 색 · 글꼴 · 메뉴 · 배너 · 본문 · 맨 아래 디자인을 한 세트로 ----
  const MOODS = [
    { id: 'clean', name: '깔끔하게', feel: '하얀 바탕 · 파란 포인트 · 반듯한 글꼴',
      theme: { bg: '#ffffff', text: '', point: '#3B6FD8', dark: '#1F2A44', font: { ko: 'pretendard', en: 'inter' }, head: null },
      header: 'line', banner: 'split', align: 'left', footer: ['simple', 'light'], skin: '', head: 'left' },
    { id: 'warm', name: '따뜻하게', feel: '크림색 바탕 · 갈색 · 부드러운 글꼴',
      theme: { bg: '#FFFCF6', text: '', point: '#D9822B', dark: '#6B4A35', font: { ko: 'gowun-dodum', en: '' }, head: null },
      header: 'plain', banner: 'card', align: 'center', footer: ['center', 'soft'], skin: 'soft', head: 'center' },
    { id: 'luxe', name: '고급스럽게', feel: '어두운 바탕 · 금빛 · 명조 글꼴',
      theme: { bg: '#161513', text: '', point: '#C9A86A', dark: '#4A3F33', font: { ko: 'nanum-myeongjo', en: 'playfair' }, head: null },
      header: 'under', banner: 'bottom', align: 'left', footer: ['simple', 'dark'], skin: 'line', head: 'center' },
    { id: 'playful', name: '발랄하게', feel: '분홍 · 둥근 모양 · 귀여운 글꼴',
      theme: { bg: '#FFF8F8', text: '', point: '#E06C8B', dark: '#7A3E4E', font: { ko: 'jua', en: 'poppins' }, head: null },
      header: 'pill', banner: 'soft', align: 'left', footer: ['center', 'point'], skin: 'card', head: 'center' },
    { id: 'trust', name: '믿음직하게', feel: '남색 · 굵은 메뉴 · 회사 · 기관용',
      theme: { bg: '#ffffff', text: '', point: '#2563C9', dark: '#17325C', font: { ko: 'noto-sans', en: 'roboto' }, head: null },
      header: 'bold', banner: 'full', align: 'left', footer: ['detail', 'dark'], skin: '', head: 'left' }
  ];
  // 블록 하나에 분위기 입히기 (글 · 사진은 그대로, 블록 바탕색은 사이트 색을 따르게)
  function applyMoodToBlock(b, m) {
    const def = BLOCKS[b.type];
    if (!def || !b.props) return;
    const p = b.props;
    if (b.type === 'header') { p.look = m.header; p.bg = ''; }
    else if (b.type === 'banner') { p.look = m.banner; p.align = m.align; }
    else if (b.type === 'footer') { p.layout = m.footer[0]; p.theme = m.footer[1]; }
    else if (def.zone === 'main' && b.type !== 'aside' && b.type !== 'spacer') {
      if (m.skin) p.skin = m.skin; else delete p.skin;
      if (m.head === 'left') p.headAlign = 'left'; else delete p.headAlign;
      if ('bg' in p) p.bg = '';
    }
  }
  window.HOMETEO_BLOCKS = BLOCKS;
  window.HOMETEO_PRESETS = PRESETS;
  window.HOMETEO_ZONES = ZONES;
  window.HometeoVideo = { parse: parseVideo };
  window.HOMETEO_OLD_HEIGHTS = OLD_HEIGHTS;
  window.HOMETEO_FOLLOW_NAME = followName;
  window.HOMETEO_MOODS = { list: MOODS, applyToBlock: applyMoodToBlock };
  window.HOMETEO_HOURS = { days: hoursDays, status: hoursStatus };
  window.HOMETEO_DATE = { today: todayStr, isRecent };
  window.HOMETEO_RENDER = renderBlock;
  // 블록 밖에서 주인이 고칠 수 있는 칸 (사이트 정보 및 페이지 설명)
  window.HOMETEO_ADMIN_PATHS = {
    siteInfo: ['name', 'desc', 'shareImage', 'icon'],
    page: ['desc']
  };
})();
