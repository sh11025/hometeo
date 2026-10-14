/*
 * 홈터 · 관리자 화면 배치도 (admin-ui.js)
 * ------------------------------------------------------------
 * 홈터 편집 화면(관리자 화면 꾸미기)과 관리자 화면이 함께 써요.
 *  - 배치도 site.admin.ui 의 기본값 · 정리(normUI)
 *  - 블록마다 "사장님이 고칠 수 있는 칸" 목록(fieldsOf) — blocks.js 의 content · lists 규칙에서 만들어요
 *  - 자주 고치는 곳으로 고를 수 있는 칸 목록(pickables)
 */
(function () {
  'use strict';

  // ---------- 배치 ----------
  const LAYOUTS = [
    { id: 'side', name: '왼쪽 메뉴형', desc: '왼쪽에 메뉴, 오른쪽에 내용 · 쇼핑몰 관리 화면처럼' },
    { id: 'top', name: '위쪽 탭형', desc: '맨 위에 메뉴 탭, 아래에 내용' },
    { id: 'simple', name: '한 줄형', desc: '가운데 한 줄로 · 휴대폰처럼 단순하게' }
  ];

  // ---------- 메뉴 (열쇠 · 도움말 · 반영하기는 늘 고정이라 여기 없어요) ----------
  //   fixed: 숨길 수 없는 메뉴
  const MENU = [
    { id: 'home', label: '첫 화면', fixed: true },
    { id: 'pages', label: '페이지', fixed: true },
    { id: 'info', label: '사이트 정보' },
    { id: 'history', label: '지난 모습' }
  ];

  // ---------- 첫 화면 카드 ----------
  //   wide: PC에서 두 칸을 다 써요
  const CARDS = [
    { type: 'biz', name: '가게 기본 정보', desc: '전화번호 · 주소를 한 번 고치면 홈페이지 전체가 바뀌어요', on: true },
    { type: 'todo', name: '처음 할 일', desc: '열쇠 넣기 · 첫 반영 같은 할 일과 진행 막대', on: true },
    { type: 'status', name: '지금 상태', desc: '마지막 반영 시간 · 반영 안 한 고친 곳', on: true },
    { type: 'quick', name: '자주 고치는 곳', desc: '골라 둔 칸을 바로 고쳐요', on: true, wide: true },
    { type: 'pages', name: '페이지 바로가기', desc: '홈페이지의 페이지 목록', on: true },
    { type: 'history', name: '최근 기록', desc: '지난 모습 최근 5개', on: true },
    { type: 'memo', name: '만든 사람 메모', desc: '사장님께 남기는 글', on: true },
    { type: 'preview', name: '홈페이지 미리보기', desc: '첫 페이지를 작게 보여줘요', on: false, wide: true }
  ];

  // ---------- 처음 할 일 (기본) ----------
  const TODO_BASE = [
    { id: 'key', label: '관리자 열쇠 넣기' },
    { id: 'help', label: '도움말 한 번 보기' },
    { id: 'edit', label: '글이나 사진 하나 고쳐 보기' },
    { id: 'publish', label: '사이트에 처음 반영하기' }
  ];

  const str = (v, max) => String(v == null ? '' : v).slice(0, max || 200);

  function defaultUI() {
    return {
      layout: 'side',
      menu: MENU.map((m) => ({ id: m.id, label: '', hidden: false })),
      cards: CARDS.map((c) => ({ type: c.type, on: c.on })),
      quick: [],
      todo: [],
      memo: ''
    };
  }

  // 배치도 정리: 모르는 값은 버리고, 빠진 메뉴 · 카드는 뒤에 붙여요 (옛 작업 파일도 그대로 열려요)
  function normUI(x) {
    const d = defaultUI();
    const o = x && typeof x === 'object' ? x : {};
    const layout = LAYOUTS.some((l) => l.id === o.layout) ? o.layout : d.layout;

    const menu = [];
    (Array.isArray(o.menu) ? o.menu : []).forEach((m) => {
      if (!m || typeof m !== 'object') return;
      const def = MENU.find((k) => k.id === m.id);
      if (!def || menu.some((k) => k.id === m.id)) return;
      menu.push({ id: m.id, label: str(m.label, 20).trim(), hidden: def.fixed ? false : !!m.hidden });
    });
    MENU.forEach((m) => { if (!menu.some((k) => k.id === m.id)) menu.push({ id: m.id, label: '', hidden: false }); });

    const cards = [];
    (Array.isArray(o.cards) ? o.cards : []).forEach((c) => {
      if (!c || typeof c !== 'object') return;
      if (!CARDS.some((k) => k.type === c.type) || cards.some((k) => k.type === c.type)) return;
      cards.push({ type: c.type, on: !!c.on });
    });
    CARDS.forEach((c) => { if (!cards.some((k) => k.type === c.type)) cards.push({ type: c.type, on: c.on }); });

    const quick = (Array.isArray(o.quick) ? o.quick : []).filter((q) => q && typeof q === 'object' && q.blockId && q.path)
      .slice(0, 30).map((q) => ({ pageId: str(q.pageId, 60), blockId: str(q.blockId, 60), path: str(q.path, 120) }));
    const todo = (Array.isArray(o.todo) ? o.todo : []).map((t) => (t && typeof t === 'object' ? str(t.label, 60).trim() : str(t, 60).trim()))
      .filter(Boolean).slice(0, 10).map((label) => ({ label }));

    return { layout, menu, cards, quick, todo, memo: str(o.memo, 600) };
  }

  const menuLabel = (m) => (m && m.label) || ((MENU.find((k) => k.id === (m && m.id)) || {}).label) || '';

  // =========================================================
  // 고칠 수 있는 칸
  // =========================================================
  // 사진 위치 · 확대 값은 만든 사람이 맞춘 모양이라 사장님 화면에는 안 보여요
  const HIDDEN_KEY = /^img(X|Y|Zoom)m?$/;

  const LABELS = {
    logo: '로고 글자', logoImage: '로고 그림', logoLink: '로고 누르면 갈 곳',
    cta: '버튼 글자', ctaLink: '버튼 누르면 갈 곳',
    eyebrow: '제목 위 작은 글', title: '제목', sub: '작은 설명', text: '글', body: '본문 글',
    button: '버튼 글자', link: '누르면 갈 곳', url: '주소', image: '사진', imageM: '휴대폰용 사진',
    alt: '사진 설명', caption: '사진 아래 글', video: '영상 파일', youtube: '유튜브 주소',
    label: '이름', name: '이름', copy: '맨 아래 저작권 글', company: '상호', owner: '대표',
    bizNo: '사업자등록번호', mailOrderNo: '통신판매업 신고번호', address: '주소', phone: '전화번호', email: '이메일',
    instagram: '인스타그램 주소', youtube_sns: '유튜브 주소', blog: '블로그 주소', kakao: '카카오톡 채널 주소',
    facebook: '페이스북 주소', naver: '네이버 주소', x: 'X(트위터) 주소',
    q: '질문', a: '답', meta: '날짜 · 덧붙임', stars: '별점', photo: '사진',
    date: '날짜', day: '요일', time: '시간', place: '장소', role: '하는 일',
    price: '가격', unit: '단위', desc: '설명', features: '들어 있는 것 (한 줄에 하나씩)', badge: '추천 표시 글',
    detail: '자세한 위치', mapImage: '지도 사진', naverUrl: '네이버 지도 주소', kakaoUrl: '카카오맵 주소',
    bannerTitle: '배너 제목', bannerText: '배너 글', bannerLink: '배너 누르면 갈 곳', bannerImage: '배너 사진',
    note: '표 아래 작은 글', agree: '동의 글', formUrl: '양식 주소', options: '고를 것 (쉼표로 나눠요)',
    idLabel: '아이디 칸 이름', pwLabel: '비밀번호 칸 이름', remember: '로그인 유지 글',
    joinLabel: '회원가입 글', joinLink: '회원가입 주소', findLabel: '찾기 글', findLink: '찾기 주소',
    selectLabel: '고르기 칸 이름', start: '보이기 시작하는 날', end: '마지막 날',
    brk: '쉬는 시간', last: '마지막 주문', posted: '올린 날', year: '연도', cats: '분류 이름 (쉼표로 나눠요)', cat: '분류',
    job: '고용 형태', file: '파일', kakaoCode: '카카오맵 ‘지도 퍼가기’ 코드', more: '더 보기 버튼 글자', moreLink: '더 보기 누르면 갈 곳'
  };
  const LIST_LABELS = {
    menu: '메뉴', children: '하위 메뉴', topLinks: '메뉴 위 작은 링크', slides: '배너 장', cards: '카드',
    items: '항목', itemsM: '휴대폰 항목', members: '사람', images: '사진', plans: '상품', rows: '줄', cols: '칸 이름',
    cells: '칸', info: '정보 줄', columns: '링크 묶음', links: '링크', bottomLinks: '맨 아래 링크',
    selectOptions: '고를 것', fields: '입력 칸', days: '요일별 시간'
  };
  const LIST_ITEM = {
    menu: '메뉴', children: '하위 메뉴', topLinks: '링크', slides: '장', cards: '카드', items: '항목', itemsM: '항목',
    members: '사람', images: '사진', plans: '상품', rows: '줄', cols: '칸', cells: '칸', info: '줄', columns: '묶음',
    links: '링크', bottomLinks: '링크', selectOptions: '항목', fields: '칸', days: '줄'
  };
  // 블록마다 다르게 부르는 이름
  const BLOCK_LABELS = {
    'faq.items': '질문', 'reviews.items': '후기', 'schedule.items': '일정', 'quick.items': 'PC 바로가기',
    'quick.itemsM': '휴대폰 바로가기', 'reviews.items.text': '후기 글', 'reviews.items.name': '쓴 사람',
    'footer.name': '가게 이름', 'team.members.text': '소개 글', 'map.title': '제목', 'video.url': '영상 주소 (유튜브 등)',
    'aside.title': '제목', 'aside.links': '링크', 'form.fields.label': '칸 이름', 'menu.label': '메뉴 이름',
    'video.caption': '영상 아래 글', 'header.menu.label': '메뉴 이름', 'header.menu.children.label': '하위 메뉴 이름'
  };

  const lastKey = (path) => { const s = String(path).split('.').filter((k) => k !== '*' && !/^\d+$/.test(k)); return s[s.length - 1] || ''; };
  const plainKey = (path) => String(path).split('.').filter((k) => k !== '*' && !/^\d+$/.test(k)).join('.');

  function label(type, path) {
    const p = plainKey(path);
    const k = lastKey(path);
    if (BLOCK_LABELS[type + '.' + p]) return BLOCK_LABELS[type + '.' + p];
    if (p.startsWith('socials.')) return LABELS[k === 'youtube' ? 'youtube_sns' : k] || '주소';
    return LABELS[k] || LIST_LABELS[k] || '글';
  }
  function listLabel(type, path) {
    const p = plainKey(path);
    return BLOCK_LABELS[type + '.' + p] || LIST_LABELS[lastKey(path)] || '목록';
  }
  function itemWord(path) { return LIST_ITEM[lastKey(path)] || '항목'; }

  // 칸의 종류: image · video · link · stars · long(여러 줄) · text
  function kind(type, path) {
    const k = lastKey(path);
    const p = plainKey(path);
    if (/^(image|imageM|photo|logoImage|mapImage|bannerImage)$/.test(k)) return 'image';
    if (k === 'video') return 'video';
    if (k === 'stars') return 'stars';
    if (k === 'start' || k === 'end' || k === 'posted') return 'date';
    if (k === 'file') return 'file';
    if (type === 'video' && k === 'url') return 'text';
    if (p.startsWith('socials.')) return 'text';
    if (/^(link|url)$/.test(k) || /Link$/.test(k)) return 'link';
    if (/^(text|body|desc|a|features|copy|bannerText|detail|note|caption|kakaoCode)$/.test(k)) return 'long';
    return 'text';
  }

  // content 규칙(['title', 'items.*.q', 'menu.*.children.*.label', 'info.*' …]) → 칸 나무
  //   { fields: [{ key, kind, label }], lists: [{ key, pattern, label, word, canEdit, strings, fields, lists }] }
  function buildTree(type, rules, listRules, prefix) {
    const fields = [];
    const lists = [];
    const groups = {};
    rules.forEach((r) => {
      const i = r.indexOf('*');
      if (i < 0) {
        if (HIDDEN_KEY.test(lastKey(r))) return;
        fields.push({ key: r, kind: kind(type, prefix + r), label: label(type, prefix + r) });
        return;
      }
      const head = r.slice(0, i).replace(/\.$/, '');   // 'items'
      const rest = r.slice(i + 1).replace(/^\./, '');   // 'q' · '' · 'children.*.label'
      (groups[head] = groups[head] || []).push(rest);
    });
    Object.keys(groups).forEach((head) => {
      const subs = groups[head];
      const pattern = prefix + head;                    // 'columns.*.links'
      const strings = subs.includes('');
      const inner = strings ? { fields: [], lists: [] } : buildTree(type, subs.filter(Boolean), listRules, pattern + '.*.');
      if (!strings && !inner.fields.length && !inner.lists.length) return;
      lists.push({
        key: head, pattern, strings,
        label: listLabel(type, pattern), word: itemWord(pattern),
        canEdit: listRules.includes(pattern),           // 더하기 · 빼기 · 순서 바꾸기
        kind: strings ? kind(type, pattern) : null,
        fields: inner.fields, lists: inner.lists
      });
    });
    return { fields, lists };
  }

  const treeCache = {};
  function fieldsOf(type, BLOCKS) {
    if (treeCache[type]) return treeCache[type];
    const def = (BLOCKS || window.HOMETEO_BLOCKS || {})[type];
    if (!def) return { fields: [], lists: [] };
    const t = buildTree(type, def.content || [], def.lists || [], '');
    treeCache[type] = t;
    return t;
  }
  const hasFields = (type, BLOCKS) => { const t = fieldsOf(type, BLOCKS); return t.fields.length > 0 || t.lists.length > 0; };

  // 칸 값 읽기 · 쓰기 ('items.2.q')
  function getPath(obj, path) {
    return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, val) {
    const parts = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = val;
  }

  // 사이트의 모든 블록 (어느 페이지에 있는지 함께)
  function siteBlocks(site) {
    const out = [];
    (site.shared || []).forEach((b) => out.push({ pageId: 'shared', block: b }));
    (site.pages || []).forEach((pg) => (pg.blocks || []).forEach((b) => out.push({ pageId: pg.id, block: b })));
    return out;
  }
  function findBlock(site, id) {
    const hit = siteBlocks(site).find((x) => x.block.id === id);
    return hit || null;
  }

  // 자주 고치는 곳으로 고를 수 있는 칸: 블록의 칸 하나 또는 목록 하나
  function pickables(site, BLOCKS) {
    const B = BLOCKS || window.HOMETEO_BLOCKS || {};
    const out = [];
    siteBlocks(site).forEach(({ pageId, block }) => {
      const def = B[block.type];
      if (!def) return;
      const t = fieldsOf(block.type, B);
      t.fields.forEach((f) => out.push({ pageId, blockId: block.id, type: block.type, path: f.key, label: f.label, kind: f.kind }));
      t.lists.forEach((l) => out.push({ pageId, blockId: block.id, type: block.type, path: l.key, label: l.label + ' 목록', kind: 'list' }));
    });
    return out;
  }

  // 자주 고치는 곳 하나 → 실제로 찾기 (지워진 블록이면 null)
  function resolveQuick(site, q, BLOCKS) {
    const hit = findBlock(site, q.blockId);
    if (!hit) return null;
    const B = BLOCKS || window.HOMETEO_BLOCKS || {};
    const t = fieldsOf(hit.block.type, B);
    const f = t.fields.find((x) => x.key === q.path);
    const l = t.lists.find((x) => x.key === q.path);
    if (!f && !l) return null;
    return { pageId: hit.pageId, block: hit.block, field: f || null, list: l || null };
  }

  // 블록 이름 (블록 고르기 목록의 이름: '맨 위 메뉴' · '자주 묻는 질문' …)
  function blockName(type) {
    const zones = window.HOMETEO_PRESETS || [];
    for (const z of zones) {
      const hit = (z.items || []).find((it) => it.type === type);
      if (hit) return hit.name;
    }
    const def = (window.HOMETEO_BLOCKS || {})[type];
    return (def && def.name) || '블록';
  }

  // =========================================================
  // 가게 기본 정보 · 글자 한 번에 바꾸기 (홈터와 관리자 화면이 함께 써요)
  // =========================================================
  //   from: 맨 아래 정보 블록에서 처음 값을 가져올 자리
  const BIZ_FIELDS = [
    { key: 'company', label: '상호', from: 'biz.company', ph: '예: 온기 카페' },
    { key: 'owner', label: '대표', from: 'biz.owner', ph: '예: 김온기' },
    { key: 'phone', label: '전화번호', from: 'biz.phone', ph: '예: 02-123-4567' },
    { key: 'address', label: '주소', from: 'biz.address', ph: '예: 서울시 종로구 …' },
    { key: 'email', label: '이메일', from: 'biz.email', ph: '예: hello@naver.com' },
    { key: 'bizNo', label: '사업자등록번호', from: 'biz.bizNo', ph: '예: 123-45-67890' },
    { key: 'kakao', label: '카카오톡 채널 주소', from: 'socials.kakao', ph: '예: pf.kakao.com/…' },
    { key: 'instagram', label: '인스타그램 주소', from: 'socials.instagram', ph: '예: instagram.com/…' }
  ];
  const footerOf = (site) => siteBlocks(site).map((x) => x.block).find((b) => b.type === 'footer') || null;
  function bizValues(site) {
    const saved = (site.info && site.info.biz) || {};
    const ft = footerOf(site);
    const out = {};
    BIZ_FIELDS.forEach((f) => {
      const v = saved[f.key];
      out[f.key] = (typeof v === 'string' && v) ? v : String((ft && getPath(ft.props || {}, f.from)) || '');
    });
    return out;
  }
  // 글자가 들어 있는 칸 하나하나 (onlyEditable: 사장님이 고칠 수 있는 칸만)
  function eachText(block, BLOCKS, onlyEditable, fn) {
    const p = block.props || {};
    if (!onlyEditable) {
      const walk = (obj, path) => {
        Object.keys(obj).forEach((k) => {
          if (k === 'id') return;
          const v = obj[k], here = path ? path + '.' + k : String(k);
          if (typeof v === 'string') fn(obj, k, here);
          else if (v && typeof v === 'object') walk(v, here);
        });
      };
      walk(p, '');
      return;
    }
    const visit = (obj, tree, base) => {
      tree.fields.forEach((f) => {
        if (f.kind === 'image' || f.kind === 'video') return;
        const parts = f.key.split('.'); const last = parts.pop();
        const parent = parts.length ? getPath(obj, parts.join('.')) : obj;
        if (parent && typeof parent[last] === 'string') fn(parent, last, base + f.key);
      });
      tree.lists.forEach((l) => {
        const arr = obj[l.key];
        if (!Array.isArray(arr)) return;
        arr.forEach((it, i) => {
          if (l.strings) { if (typeof it === 'string') fn(arr, i, base + l.key + '.' + i); }
          else if (it && typeof it === 'object') visit(it, l, base + l.key + '.' + i + '.');
        });
      });
    };
    visit(p, fieldsOf(block.type, BLOCKS), '');
  }
  // 사이트 전체에서 글자 바꾸기 → 바꾼 곳 수
  function replaceAll(site, find, repl, opts) {
    const o = opts || {};
    const f = String(find || '');
    if (f.length < 2 || f === repl) return 0;
    let n = 0;
    const swap = (obj, k) => {
      const v = obj[k];
      if (typeof v !== 'string' || !v.includes(f)) return;
      n += v.split(f).length - 1;
      obj[k] = v.split(f).join(repl);
    };
    siteBlocks(site).forEach(({ block }) => eachText(block, o.BLOCKS, !!o.onlyEditable, swap));
    if (site.info) { swap(site.info, 'name'); swap(site.info, 'desc'); if (site.info.biz) Object.keys(site.info.biz).forEach((k) => swap(site.info.biz, k)); }
    (site.pages || []).forEach((pg) => swap(pg, 'desc'));
    return n;
  }
  // 가게 기본 정보 하나 바꾸기: 예전 값이 들어 있던 곳을 모두 새 값으로
  function setBiz(site, key, value, opts) {
    const f = BIZ_FIELDS.find((x) => x.key === key);
    if (!f) return 0;
    const v = String(value || '').trim();
    const old = bizValues(site)[key];
    if (!site.info) site.info = {};
    site.info.biz = Object.assign({}, site.info.biz || {}, { [key]: v });
    let n = 0;
    // 상호가 사이트 이름과 같던 때에는 글 전체를 바꾸지 않아요 (메뉴 제목 · 사이트 이름까지 바뀌면 안 돼서)
    const hd = siteBlocks(site).map((x) => x.block).find((b) => b.type === 'header');
    const names = [(site.info || {}).name, hd && hd.props && hd.props.logo].filter(Boolean);
    const skipText = key === 'company' && names.includes(old);
    if (old && v && old !== v && !skipText) {
      n += replaceAll(site, old, v, opts);
      // 전화번호는 숫자만 쓴 곳도 (예: tel:021234567)
      const od = old.replace(/\D/g, ''), nd = v.replace(/\D/g, '');
      if (key === 'phone' && od.length >= 7 && od !== old) n += replaceAll(site, od, nd, opts);
    }
    const ft = footerOf(site);
    if (ft && v && getPath(ft.props || {}, f.from) !== v) { setPath(ft.props, f.from, v); n++; }
    return n;
  }
  // 상호를 사이트 이름과 같이 쓰나요? (정하지 않았으면: 비어 있거나 이름과 같으면 같이 써요)
  function companySynced(site, siteName) {
    const inf = site.info || {};
    if (inf.syncCompany === true) return true;
    if (inf.syncCompany === false) return false;
    const c = bizValues(site).company;
    return !c || c === siteName;
  }
  // 지금 사이트 이름 (맨 위 메뉴 제목과 같이 쓰면 메뉴 제목)
  function currentName(site) {
    const inf = site.info || {};
    if (inf.syncName !== false) {
      const hd = siteBlocks(site).map((x) => x.block).find((b) => b.type === 'header');
      if (hd && hd.props && hd.props.logo) return String(hd.props.logo);
    }
    return String(inf.name || '');
  }
  // 상호를 사이트 이름과 같이 쓰기로 했으면 늘 같게 맞춰요 (어디서 이름을 바꿨든)
  function ensureCompany(site, BLOCKS) {
    if (!site || !site.info || site.info.syncCompany !== true) return 0;
    const nm = currentName(site);
    if (!nm || bizValues(site).company === nm) return 0;
    return setBiz(site, 'company', nm, { BLOCKS });
  }
  // 견본 글처럼 보이는 곳 (반영 · 내려받기 전 점검)
  const SAMPLE_RE = /견본 문구|○○|0{2,3}-0{3,4}-0{4}|0{3}-0{2}-0{5}|홍길동|김바른|example\.com|0000호|123-45-67890|02-123-4567|010-1234-5678|적어주세요/;
  function findSamples(site, BLOCKS, onlyEditable) {
    const out = [];
    siteBlocks(site).forEach(({ pageId, block }) => eachText(block, BLOCKS, onlyEditable, (obj, k, path) => {
      const v = obj[k];
      const m = typeof v === 'string' && SAMPLE_RE.exec(v);
      if (m && out.length < 30) out.push({ pageId, blockId: block.id, type: block.type, path, text: v.slice(Math.max(0, m.index - 10), m.index + 22).trim() });
    }));
    return out;
  }


  // ---- 반영하기 전에: 원래 모습과 지금 모습에서 바뀐 곳 찾기 ----
  function diffSites(before, after, BLOCKS) {
    const out = [];
    const pageName = (site, id) => (id === 'shared' ? '모든 페이지' : ((site.pages || []).find((p) => p.id === id) || {}).name || '');
    const texts = (site) => {
      const m = {};
      siteBlocks(site).forEach(({ pageId, block }) => {
        eachText(block, BLOCKS, true, (o, k, path) => { m[block.id + '|' + path] = { v: o[k], pageId, block, path }; });
      });
      return m;
    };
    const A = texts(before), B = texts(after);
    Object.keys(B).forEach((k) => {
      const b = B[k], a = A[k];
      if (a && a.v === b.v) return;
      out.push({ where: pageName(after, b.pageId) + ' › ' + blockName(b.block.type), label: label(b.block.type, b.path), before: a ? a.v : '', after: b.v, pageId: b.pageId, blockId: b.block.id, path: b.path });
    });
    Object.keys(A).forEach((k) => {
      if (B[k]) return;
      const a = A[k];
      if (!findBlock(after, a.block.id)) return;
      out.push({ where: pageName(before, a.pageId) + ' › ' + blockName(a.block.type), label: label(a.block.type, a.path), before: a.v, after: '', removed: true });
    });
    // 글 말고 바뀐 것 (사진 · 숨기기 · 품절 · 목록 수)
    const bmap = {};
    siteBlocks(before).forEach(({ block }) => { bmap[block.id] = block; });
    siteBlocks(after).forEach(({ pageId, block }) => {
      const old = bmap[block.id];
      if (!old) return;
      const where = pageName(after, pageId) + ' › ' + blockName(block.type);
      const op = old.props || {}, np = block.props || {};
      if (!!op._off !== !!np._off) out.push({ where, label: '블록', before: op._off ? '숨김' : '보임', after: np._off ? '숨김' : '보임' });
      Object.keys(np).forEach((key) => {
        if (!Array.isArray(np[key]) || !Array.isArray(op[key])) return;
        if (np[key].length !== op[key].length) out.push({ where, label: listLabel(block.type, key), before: op[key].length + '개', after: np[key].length + '개' });
        np[key].forEach((it, i) => {
          const o = op[key][i];
          if (!it || !o || typeof it !== 'object') return;
          const nm = it.title || it.name || it.label || it.q || (i + 1) + '번째';
          if (!!o._hide !== !!it._hide) out.push({ where, label: nm, before: o._hide ? '숨김' : '보임', after: it._hide ? '숨김' : '보임' });
          if (!!o._sold !== !!it._sold) out.push({ where, label: nm, before: o._sold ? '품절' : '판매 중', after: it._sold ? '품절' : '판매 중' });
        });
      });
      const imgs = (p) => JSON.stringify(p, (k, v) => (v && typeof v === 'object') || (typeof v === 'string' && (/^(img|doc-|vid)/.test(v) || /image|photo|^file$/i.test(k))) || k === '' ? v : undefined);
      if (imgs(op) !== imgs(np)) out.push({ where, label: '사진 · 파일', before: '', after: '바뀌었어요', media: true });
    });
    const bi = before.info || {}, ai = after.info || {};
    ['name', 'desc'].forEach((k) => { if ((bi[k] || '') !== (ai[k] || '')) out.push({ where: '사이트 정보', label: k === 'name' ? '사이트 이름' : '한 줄 소개', before: bi[k] || '', after: ai[k] || '' }); });
    return out;
  }

  // ---- 공유(카톡 · 문자)에 보일 모습 점검 ----
  function shareChecks(site, opts) {
    const inf = site.info || {};
    const o = opts || {};
    const out = [];
    if (!inf.shareImage) out.push('공유 사진이 없어요. 카톡으로 보내면 사진 없이 글만 나와요.');
    if (!(inf.desc || '').trim()) out.push('한 줄 소개가 비어 있어요. 이름 아래에 설명이 안 나와요.');
    else if (inf.desc.length > 80) out.push(`한 줄 소개가 ${inf.desc.length}자예요. 80자가 넘으면 카톡에서 뒷부분이 잘려요.`);
    if (!(inf.url || o.siteUrl || '').trim()) out.push('홈페이지 주소가 비어 있어요. 주소가 있어야 공유 사진이 제대로 나와요.');
    if ((inf.name || '').length > 30) out.push('사이트 이름이 길어서 공유할 때 잘릴 수 있어요.');
    return out;
  }

  // ---- 가게용 QR 코드 그림 (테이블 · 전단지 · 명함용) ----
  // text: 홈페이지 주소 / title: 아래에 적을 이름 → PNG 그림 주소(data URL)
  function qrImage(text, title, color) {
    const Q = window.qrcode;
    if (!Q || !text) return '';
    if (Q.stringToBytesFuncs && Q.stringToBytesFuncs['UTF-8']) Q.stringToBytes = Q.stringToBytesFuncs['UTF-8'];
    const qr = Q(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const cell = Math.max(8, Math.floor(640 / n));
    const pad = cell * 4;
    const size = n * cell + pad * 2;
    const foot = title ? 120 : 40;
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size + foot;
    const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = color || '#111';
    for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) c.fillRect(pad + q * cell, pad + r * cell, cell, cell);
    c.textAlign = 'center';
    if (title) { c.fillStyle = '#111'; c.font = 'bold 44px sans-serif'; c.fillText(String(title).slice(0, 24), size / 2, size + 24); }
    c.fillStyle = '#666'; c.font = '26px sans-serif';
    c.fillText(String(text).replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 44), size / 2, size + (title ? 76 : 10));
    return cv.toDataURL('image/png');
  }
  window.HometeoAdminUI = {
    LAYOUTS, MENU, CARDS, TODO_BASE,
    defaultUI, normUI, menuLabel,
    fieldsOf, hasFields, label, listLabel, kind,
    getPath, setPath, siteBlocks, findBlock, pickables, resolveQuick, blockName,
    BIZ_FIELDS, bizValues, setBiz, replaceAll, findSamples, eachText,
    diffSites, shareChecks, qrImage, companySynced, currentName, ensureCompany
  };
})();
