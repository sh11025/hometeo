/*
 * 홈터 · 편집 화면 동작 (1/12) — 상태 · 블록 목록 · 칸 채우기 · 바꾸기(되돌리기) · 블록 넣기 · 지우기 · 고르기
 * ------------------------------------------------------------
 * 블록 쌓기 · 고치기 · 너비 · 높이, 여러 페이지 · 사이트 지도, 사이트 꾸미기(색 · 글꼴), 사이트 정보,
 * 자동 저장 · 작업 파일, 점검 · 내려받기, 견본 · 길잡이 · 사용 안내
 *
 * 페이지는 "블록 목록" 하나로 표현돼요.
 *   blocks = [{ id, type, col, span, offset, props }, ...]   (읽는 순서: 왼쪽→오른쪽, 위→아래)
 *   span   = 차지하는 칸 수 (1~12),  offset = 앞에 비워 둘 칸 수
 *   col    = 시작 칸. 직접 정하지 않고 pack() 이 순서대로 채워 넣으며 계산해요.
 *   props  = 블록 내용 (글자, 사진 번호, 색 등)
 * 사진은 크기가 커서 블록 안에 직접 넣지 않고 assets 에 따로 보관해요.
 *   assets = { 사진번호: 사진데이터 }
 * 화면은 이 목록을 보고 다시 그려요. 되돌리기는 예전 목록으로 바꿔 끼우는 거예요.
 *
 * 이 파일들은 원래 js/app.js 한 파일이었는데, 고치기 쉽게 12개로 나눴어요.
 *   01-core · 02-picker · 03-theme-info · 04-admin-guide · 05-side-by-side · 06-inspector
 *   07-pages-map · 08-edit-media · 09-save-export · 10-start-guide · 11-resize-drag · 12-events-start
 * 빌드 없이 index.html이 차례대로 불러와요. 같은 이름(state, els, render …)을 서로 함께 써요.
 */
'use strict';

const BLOCKS = window.HOMETEO_BLOCKS;
const PRESETS = window.HOMETEO_PRESETS;
const RENDER = window.HOMETEO_RENDER;
const PRESET_BY_ID = {};
PRESETS.forEach((g) => g.items.forEach((it) => { PRESET_BY_ID[it.id] = it; }));
const COLUMNS = 12;              // 보이지 않는 칸 수
const MIN_SPAN = 3;              // 블록이 가장 좁아질 수 있는 칸 수
const SPAN_NAMES = { 12: '전체', 9: '4분의 3', 8: '3분의 2', 6: '절반', 4: '3분의 1', 3: '4분의 1' };
const IMAGE_MAX_SIDE = 1920;     // 사진의 가장 긴 변을 이 크기까지 줄여요
const IMAGE_QUALITY = 0.82;      // 사진 화질 (0~1)
const undoStack = window.HometeoHistory(100);

const state = {
  blocks: [],
  assets: {},
  selectedId: null,
  device: 'pc',         // 'pc' 또는 'phone' (보기 방식일 뿐, 되돌리기에 남기지 않아요)
  view: {},             // 블록별 보고 있는 장 · 카드 번호 (보기 방식일 뿐)
  page: { gap: 0 },     // 지금 페이지 설정: 나란한 블록 사이 간격(px)
  // 사이트 = 여러 페이지. 맨 위 메뉴 · 맨 아래 정보 · 퀵메뉴(shared)는 모든 페이지가 함께 써요.
  //   site = { pages: [{ id, name, file, blocks, gap, x, y }], shared: [블록], home: 첫 페이지 번호 }
  //   blocks 는 '지금 페이지'의 작업용 목록 (= shared + 지금 페이지의 블록)
  site: null,
  pageId: null,
  mode: 'edit'          // 'edit' 페이지 꾸미기 · 'map' 사이트 지도
};

// ---------- 화면 요소 ----------
const $ = (id) => document.getElementById(id);
const els = {
  side: $('side-slot'),
  float: $('float-layer'),
  stage: $('stage'),
  paper: $('paper'),
  page: $('page'),
  inspector: $('inspector-body'),
  undo: $('btn-undo'),
  redo: $('btn-redo'),
  toast: $('toast'),
  device: $('device-switch'),
  deviceLabel: $('device-label'),
  preview: $('btn-preview'),
  download: $('btn-download'),
  fileMenuBtn: $('btn-file-menu'),
  fileMenu: $('file-menu'),
  saveStatus: $('save-status'),
  pageBar: $('page-bar'),
  map: $('sitemap')
};

const ICON = {
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>',
  grip: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  crop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
  move: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>'
};

const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 버튼에 적은 '갈 곳'을 실제 주소로 바꿔요
//   010-1234-5678 → 전화 걸기,  naver.com → https://naver.com
function toHref(v, resolvePage) {
  const s = String(v || '').trim();
  if (!s) return null;
  const pm = /^page:([^#]*)(?:#(.*))?$/.exec(s);
  if (pm) return { url: resolvePage ? resolvePage(pm[1], pm[2] || '') : '#', external: false };
  if (s === '#') return { url: '#', external: false };
  if (/^[0-9+\-\s()]{7,}$/.test(s)) return { url: 'tel:' + s.replace(/[^0-9+]/g, ''), external: false };
  if (/^(https?:|mailto:|tel:|#)/i.test(s)) return { url: s, external: /^https?:/i.test(s) };
  if (/^[^\s]+\.[^\s]+$/.test(s)) return { url: 'https://' + s, external: true };
  return null;
}

// 블록을 그릴 때 쓰는 도우미
const helpers = {
  text: (s) => escapeHtml(s).replace(/\n/g, '<br>'),   // 글자 안전하게 + 줄바꿈 살리기
  attr: escapeHtml,
  asset: (id) => (id && state.assets[id]) || null,
  href: function (v) {
    const h = toHref(v, this.resolvePage);
    if (!h) return ' href="#"';
    return ` href="${escapeHtml(h.url)}"` + (h.external ? ' target="_blank" rel="noopener"' : '');
  },
  // 사진에서 보일 부분(위치)과 확대(자르기)
  hrefValue: function (v) { const h = toHref(v, this.resolvePage); return h ? h.url : ''; },
  //   휴대폰을 따로 맞추면(imgXm …) 휴대폰 화면에서는 그 값을 써요
  photoStyle: (p) => {
    const x = p.imgX == null ? 50 : p.imgX, y = p.imgY == null ? 50 : p.imgY, z = p.imgZoom || 1;
    let st = `--ix:${x}%;--iy:${y}%;--iz:${z}`;
    if (p.imgXm != null) st += `;--ixm:${p.imgXm}%;--iym:${p.imgYm == null ? 50 : p.imgYm}%;--izm:${p.imgZoomm || 1}`;
    return st;
  },
  icon: ICON,
  ui: window.HometeoUI,
  linkTargets: () => linkTargets(),
  block: (id) => findBlock(id),               // '누르면 갈 곳' 고르기에 보여줄 페이지 · 블록
  resolvePage: () => '#',                         // 'page:…' 링크 → 실제 주소 (편집 화면에서는 이동하지 않아요)
  editor: true,                                   // 편집 화면에서 그리는 중인지
  view: (id) => state.view[id] || 0,              // 슬라이드: 지금 보고 있는 장
  // 편집 화면에서만 보이는 '사진 넣기' 자리 (두 번 누르면 파일 고르기)
  placeholder: (path, label, kind) => `<div class="b-ph"${path ? ` data-pick${kind === 'video' ? '-video' : ''}="${path}"` : ''}>
      ${kind === 'video' ? window.HometeoUI.icon.video : window.HometeoUI.icon.image}
      <span>${escapeHtml(label)}</span>${path ? '<small>두 번 눌러서 넣기 · 파일을 끌어다 놓아도 돼요</small>' : ''}
    </div>`
};

const newId = (prefix) => (prefix || 'b') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const findIndex = (id) => state.blocks.findIndex((b) => b.id === id);
const findBlock = (id) => state.blocks[findIndex(id)];

// "menu.2" 같은 이름으로 내용 읽기/쓰기
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

// ---------- 페이지 흐름 ----------
// 벽에 고정한 맨 위 메뉴와 퀵메뉴는 12칸 흐름 밖에 있어요. 나머지가 '흐름 블록'이에요.
const isFlow = (b) => window.HometeoExport.isFlow(b, BLOCKS);
const flowBlocks = () => state.blocks.filter(isFlow);

// ---------- 페이지 영역 ----------
// 맨 위(header) · 메인 배너(banner) · 본문(main) · 맨 아래(footer), 그리고 화면에 떠 있는 퀵메뉴(float)
// 블록은 자기 영역에만 들어가요. 순서를 바꾸는 건 본문 안에서만 해요.
const ZONES = window.HOMETEO_ZONES;
const ZONE_RANK = window.HometeoExport.ZONE_RANK;
const zoneOf = (b) => window.HometeoExport.zoneOf(b, BLOCKS);
const zoneName = (z) => (ZONES.find((x) => x.id === z) || { ko: '' }).ko;
const isMain = (b) => zoneOf(b) === 'main';
const mainBlocks = () => state.blocks.filter((b) => isFlow(b) && isMain(b));
const zoneFlow = (z) => state.blocks.filter((b) => isFlow(b) && zoneOf(b) === z);
const existingSingle = (type) => (BLOCKS[type].single ? state.blocks.find((b) => b.type === type) : null);
// 블록을 알아보기 쉬운 이름으로 ("본문 2 · 글 본문 ‘저희 가게를…’")
function blockTitle(b) {
  const p = b.props || {};
  const t = p.title || (p.slides && p.slides[0] && p.slides[0].title) || p.caption || '';
  return String(t).replace(/\s+/g, ' ').trim().slice(0, 18);
}
function anchorList(blocks) {
  let n = 0;
  return blocks.filter((b) => isFlow(b) && (zoneOf(b) === 'main' || zoneOf(b) === 'banner')).map((b) => {
    const z = zoneOf(b);
    const t = blockTitle(b);
    return { id: b.id, label: `${z === 'banner' ? '메인 배너' : '본문 ' + (++n)} · ${BLOCKS[b.type].name}${t ? ` ‘${t}’` : ''}` };
  });
}
// '누르면 갈 곳'에서 고를 수 있는 페이지와 블록
let linkPending = {};   // 종류만 고르고 아직 내용을 안 적은 칸 { 블록번호: { path: kind } }
function linkTargets() {
  const pages = (state.site ? state.site.pages : [{ id: 'home', name: '첫 페이지' }]).map((pg) => ({
    id: pg.id, name: pg.name,
    blocks: anchorList(pg.id === currentPageId() ? state.blocks : (pg.blocks || []))
  }));
  return { pages, current: currentPageId(), pending: linkPending[state.selectedId] || {} };
}
const currentPageId = () => state.pageId || 'home';

// 영역 순서대로 정리하고(같은 영역 안의 순서는 그대로), 본문이 아닌 블록은 한 줄 전체로
function tidy(blocks) {
  blocks.forEach((b) => {
    const z = zoneOf(b);
    if (z === 'main') return;
    b.span = COLUMNS; b.offset = 0; delete b.mspan;
    if (z !== 'banner') { delete b.minh; delete b.pt; delete b.pb; delete b.px; }
  });
  return blocks.map((b, i) => [b, i])
    .sort((x, y) => (ZONE_RANK[zoneOf(x[0])] - ZONE_RANK[zoneOf(y[0])]) || ((y[0].type === 'notice') - (x[0].type === 'notice')) || (x[1] - y[1]))
    .map((x) => x[0]);
}

// ---------- 칸 채우기 ----------
// 흐름 블록을 순서대로 왼쪽부터 칸에 채워 넣어요. 남은 칸에 안 들어가면 다음 줄로 가요.
// 그래서 너비를 합쳐 12칸 이하인 블록들은 저절로 옆에 나란히 붙어요.
function layout(blocks) {
  let cursor = 1, row = 0;
  return blocks.map((b) => {
    if (!isFlow(b)) return { col: 1, row: -1 };
    const offset = b.offset || 0;
    const need = offset + b.span;
    if (cursor > 1 && cursor + need - 1 > COLUMNS) { row++; cursor = 1; }
    const place = { col: cursor + offset, row };
    cursor += need;
    if (cursor > COLUMNS) { cursor = 1; row++; }
    return place;
  });
}
function pack() {
  layout(state.blocks).forEach((pl, i) => { state.blocks[i].col = pl.col; });
}
const spanName = (n) => `${n}칸` + (SPAN_NAMES[n] ? ` · ${SPAN_NAMES[n]}` : '');

// ---------- 바꾸기 (모든 변경은 여기를 거쳐서 되돌리기에 기록돼요) ----------
// 되돌리기에는 블록 목록과 페이지 설정(블록 사이 간격 등)을 함께 남겨요
// ---------- 사이트 · 페이지 ----------
const SHARED_ZONES = ['header', 'footer', 'float'];
const isShared = (b) => SHARED_ZONES.includes(zoneOf(b));
const curPage = () => state.site.pages.find((pg) => pg.id === state.pageId) || state.site.pages[0];
const homePage = () => state.site.pages.find((pg) => pg.id === state.site.home) || state.site.pages[0];
const fileSlug = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
function uniqueFile(base, exceptId) {
  let f = fileSlug(base) || 'page';
  if (f === 'index') f = 'page';
  const used = new Set(state.site ? state.site.pages.filter((pg) => pg.id !== exceptId).map((pg) => pg.file) : []);
  if (!used.has(f)) return f;
  let n = 2;
  while (used.has(`${f}-${n}`)) n++;
  return `${f}-${n}`;
}
// 사이트 기본 정보: 검색 · 카톡 공유에 보이는 이름 · 소개 · 사진, 브라우저 탭의 작은 아이콘
const newInfo = () => ({ name: '', syncName: true, desc: '', url: '', shareImage: null, icon: null });
function normInfo(x) {
  const d = newInfo();
  const o = x && typeof x === 'object' ? x : {};
  return { name: String(o.name || '').slice(0, 60), syncName: o.syncName !== false, desc: String(o.desc || '').slice(0, 300), url: String(o.url || '').trim().slice(0, 200),
    shareImage: typeof o.shareImage === 'string' ? o.shareImage : d.shareImage, icon: typeof o.icon === 'string' ? o.icon : d.icon,
    a11y: !!o.a11y,
    ...(typeof o.syncCompany === 'boolean' ? { syncCompany: o.syncCompany } : {}),
    biz: o.biz && typeof o.biz === 'object' ? Object.fromEntries(Object.entries(o.biz).filter(([k, v]) => typeof v === 'string').map(([k, v]) => [k, v.slice(0, 200)])) : {} };
}

const newAdmin = () => ({ enabled: false, owner: '', repo: '', branch: 'main', siteUrl: '', guideSteps: {}, x: null, y: null, ui: null });
const ADM_UI = () => window.HometeoAdminUI;
function normAdmin(x) {
  const d = newAdmin();
  const o = x && typeof x === 'object' ? x : {};
  return {
    enabled: !!o.enabled,
    owner: String(o.owner || '').trim(),
    repo: String(o.repo || '').trim(),
    branch: String(o.branch || 'main').trim() || 'main',
    siteUrl: String(o.siteUrl || '').trim(),
    guideSteps: o.guideSteps && typeof o.guideSteps === 'object' ? Object.assign({}, o.guideSteps) : {},
    x: Number.isFinite(o.x) ? o.x : null,
    y: Number.isFinite(o.y) ? o.y : null,
    ui: ADM_UI() ? ADM_UI().normUI(o.ui) : (o.ui || null)   // 관리자 화면 배치도 (꾸미기)
  };
}
function makeSite(blocks, gap) {
  const home = { id: newId('p'), name: '첫 페이지', file: 'index', blocks: [], gap: gap || 0, x: 120, y: 200 };
  const site = { pages: [home], shared: [], home: home.id, theme: window.HometeoTheme.DEFAULT(), notes: [], info: newInfo(), fonts: [], admin: normAdmin() };
  (blocks || []).forEach((b) => (isShared(b) ? site.shared : home.blocks).push(b));
  return site;
}
// 작업용 목록(state.blocks) → 사이트에 나눠 담기
function syncOut() {
  if (!state.site) return;
  const pg = curPage();
  state.site.shared = state.blocks.filter(isShared);
  pg.blocks = state.blocks.filter((b) => !isShared(b));
  pg.gap = Number(state.page.gap) || 0;
}
// 사이트 → 지금 페이지의 작업용 목록
function syncIn() {
  const pg = curPage();
  state.pageId = pg.id;
  state.blocks = tidy([...state.site.shared, ...pg.blocks]);
  state.page = { gap: pg.gap || 0 };
  pack();
  if (state.selectedId && findIndex(state.selectedId) < 0) state.selectedId = null;
}
function useSite(site) {
  // 상호 같이 쓰기를 정하지 않은 옛 파일: 지금 모습(상호가 비었거나 이름과 같음)대로 정해 둬요
  if (site.info && typeof site.info.syncCompany !== 'boolean' && ADM_UI()) site.info.syncCompany = ADM_UI().companySynced(site, ADM_UI().currentName(site));
  state.site = site;
  state.pageId = site.home;
  state.view = {};
  syncIn();
}

const snapshot = () => { syncOut(); return { site: state.site, pageId: state.pageId }; };
function change(label, mutate, opts) {
  paneLabel = label;
  undoStack.record(snapshot(), label);
  const oldLogo = headerLogo();
  mutate();
  state.blocks = tidy(state.blocks);
  pack();
  syncOut();
  followName(oldLogo, headerLogo());
  ADM_UI().ensureCompany(state.site, BLOCKS);
  render(opts);
  scheduleSave();
}

// ---------- 사이트 이름 = 맨 위 메뉴 제목 (같이 쓰기) ----------
//   site.info.syncName(처음엔 켜짐)이면 사이트 이름은 맨 위 메뉴의 제목(로고 글자)을 따라가요.
//   제목이 바뀌면 맨 아래 정보의 이름 · 저작권 글 · 상호도 같은 이름이었던 곳은 같이 바뀌어요.
const nameSynced = () => !(state.site && state.site.info && state.site.info.syncName === false);
function headerLogo() { const h = state.blocks.find((b) => b.type === 'header'); return h ? String(h.props.logo || '') : null; }
function followName(oldName, newName) {
  if (window.HOMETEO_FOLLOW_NAME) window.HOMETEO_FOLLOW_NAME(state.site, oldName, newName, state.blocks);
}

function setWidth(id, span) {
  const b = findBlock(id);
  span = Math.max(MIN_SPAN, Math.min(COLUMNS, span));
  if (!b || (b.span === span && !(b.offset && b.offset + span > COLUMNS))) return;
  change('너비 바꾸기', () => {
    b.span = span;
    b.offset = Math.min(b.offset || 0, COLUMNS - span);
  });
}
function setPlace(id, where) {
  const b = findBlock(id);
  if (!b) return;
  const free = COLUMNS - b.span;
  const offset = where === 'center' ? Math.floor(free / 2) : where === 'right' ? free : 0;
  if ((b.offset || 0) === offset) return;
  change('줄 안 위치 바꾸기', () => { b.offset = offset; });
}
// 블록 상자의 설정 (높이 minh · 여백 pt/pb · 휴대폰 너비 mspan · 보이기 hide)
const BLOCK_FIELD_LABEL = { px: '양옆 여백 바꾸기', minhM: '휴대폰 높이 바꾸기', minh: '높이 바꾸기', pt: '위 여백 바꾸기', pb: '아래 여백 바꾸기', mspan: '휴대폰 너비 바꾸기', hide: '보이기 바꾸기' };
function setBlockField(id, key, value) {
  const b = findBlock(id);
  if (!b || (b[key] || '') === (value || '')) return;
  change(BLOCK_FIELD_LABEL[key] || '바꾸기', () => {
    if (value === '' || value == null || value === 0) delete b[key]; else b[key] = value;
  });
}

function setProp(id, path, value, label) {
  const b = findBlock(id);
  if (!b || getPath(b.props, path) === value) return;
  change(label || '설정 바꾸기', () => setPath(findBlock(id).props, path, value));
}

// 높이는 블록 상자(minh)에서 정해요. 블록 내용에 옛 높이 이름(height: 'large' 등)이 있으면 옮겨요.
const OLD_HEIGHTS = window.HOMETEO_OLD_HEIGHTS || {};
function liftHeight(block) {
  const p = block.props || {};
  if (p.height && p.height in OLD_HEIGHTS) { block.minh = OLD_HEIGHTS[p.height]; }
  delete p.height;
  return block;
}

// 처음 내용 + 고른 모양의 내용 (안쪽 목록까지 통째로 바꿔요)
const clone = (v) => JSON.parse(JSON.stringify(v));
function makeProps(type, override) {
  return Object.assign(BLOCKS[type].defaults(), clone(override || {}));
}

// 새 블록 만들기 (처음 내용 + 처음 높이)
function makeBlock(type, preset) {
  const def = BLOCKS[type];
  return liftHeight({ id: newId('b'), type, col: 1, span: def.span || COLUMNS, offset: 0, ...(def.height ? { minh: def.height } : {}), props: makeProps(type, preset && preset.props) });
}

// 블록 넣기: 자기 영역의 zoneIndex 번째 자리에 (없으면 영역 맨 끝에)
//   맨 위 메뉴 · 메인 배너 · 맨 아래 정보 · 퀵메뉴는 한 페이지에 하나만 둬요
function addBlock(type, zoneIndex, presetId) {
  const preset = presetId && PRESET_BY_ID[presetId];
  const def = BLOCKS[type];
  picker = null;
  const had = existingSingle(type);
  if (had) {
    select(had.id);
    snapIn(had.id);
    showToast(`‘${def.name}’는 한 페이지에 하나만 둘 수 있어요. 이미 있는 블록을 골랐어요.`);
    return;
  }
  const block = makeBlock(type, preset);
  presetUsed(presetId || type);
  let filled = 0;
  change(`${preset ? preset.name : def.name} 추가`, () => {
    const list = state.blocks.filter((b) => isFlow(b) && zoneOf(b) === zoneOf(block));
    const at = zoneIndex == null || zoneIndex >= list.length ? list.length : zoneIndex;
    // 앞줄에 빈자리가 있으면 그 너비만큼 들어가서 줄을 채워요 (본문 · 처음 너비가 한 줄 전체인 블록만)
    if (isFlow(block) && isMain(block) && block.span === COLUMNS) {
      const left = rowLeft(list.slice(0, at));
      if (left >= 3) {
        block.span = left; filled = left;
        // 옆에 나란히 들어가는 사진 · 영상은 칸에 꽉 채우기로 (위아래 빈 곳이 안 생기게)
        if (block.type === 'image' || (block.type === 'video' && block.props.source === 'file')) { block.props.ratio = 'fill'; block.props.padded = false; }
      }
    }
    if (at >= list.length) state.blocks.push(block);   // tidy()가 영역 맨 끝으로 보내줘요
    else state.blocks.splice(state.blocks.indexOf(list[at]), 0, block);
    state.selectedId = block.id;
  });
  snapIn(block.id);
  renderDrawer();
  if (filled) {
    showToast(`옆 빈자리에 맞춰 ${filled}칸으로 넣었어요.`, '한 줄 전체로', () => {
      change('한 줄 전체 너비로', () => { const b = findBlock(block.id); if (b) { b.span = COLUMNS; b.offset = 0; } });
    });
  }
}
// 블록들을 차례로 놓았을 때 마지막 줄에 남는 칸 수 (줄이 꽉 찼거나 비었으면 0)
function rowLeft(blocks) {
  let cursor = 1;
  blocks.forEach((b) => {
    const need = (b.offset || 0) + b.span;
    if (cursor > 1 && cursor + need - 1 > COLUMNS) cursor = 1;
    cursor += need;
    if (cursor > COLUMNS) cursor = 1;
  });
  return cursor === 1 ? 0 : COLUMNS - cursor + 1;
}

// 본문 안에서 zoneIndex 자리로 옮겨요
function moveInZone(id, zoneIndex) {
  const b = findBlock(id);
  if (!b || !isMain(b)) return;
  const from = mainBlocks().indexOf(b);
  if (from === zoneIndex) return;
  change('순서 바꾸기', () => {
    const [it] = state.blocks.splice(findIndex(id), 1);
    const list = state.blocks.filter((x) => isFlow(x) && isMain(x));
    if (zoneIndex >= list.length) state.blocks.push(it);
    else state.blocks.splice(state.blocks.indexOf(list[zoneIndex]), 0, it);
    state.selectedId = id;
  });
  snapIn(id);
}
function moveBlock(id, dir) {   // 위로(-1) · 아래로(+1) — 본문 안에서만
  const order = mainBlocks().map((x) => x.id);
  const i = order.indexOf(id);
  if (i < 0 || i + dir < 0 || i + dir >= order.length) return;
  moveInZone(id, i + dir);
}

// 블록 복사하기: 같은 페이지면 바로 아래에, 다른 페이지면 그 페이지 본문 맨 아래에
//   메인 배너는 다른 페이지로만 (페이지마다 하나), 맨 위 메뉴 · 맨 아래 정보 · 퀵메뉴는 모든 페이지가 함께 써서 복사하지 않아요
function copyBlock(id, toPageId) {
  const b = findBlock(id);
  if (!b) return;
  const def = BLOCKS[b.type];
  const other = toPageId && toPageId !== state.pageId;
  if (isShared(b)) { showToast(`‘${def.name}’는 모든 페이지가 함께 써서 복사할 필요가 없어요.`); return; }
  const copy = clone(b);
  copy.id = newId('b');
  if (!other) {
    if (def.single) { showToast(`‘${def.name}’는 한 페이지에 하나만 둬요. 다른 페이지로 복사할 수 있어요.`); return; }
    change(`${def.name} 복사`, () => {
      state.blocks.splice(findIndex(id) + 1, 0, copy);
      state.selectedId = copy.id;
    });
    snapIn(copy.id);
    showToast(`‘${def.name}’ 블록을 복사했어요. 바로 아래에 있어요.`, '되돌리기', undo);
    return;
  }
  syncOut();
  const target = state.site.pages.find((pg) => pg.id === toPageId);
  if (!target) return;
  if (def.single && target.blocks.some((x) => x.type === b.type)) { showToast(`‘${target.name}’ 페이지에 이미 ‘${def.name}’가 있어요.`); return; }
  changeSite(`${def.name}을 ‘${target.name}’ 페이지로 복사`, () => {
    state.site.pages.find((pg) => pg.id === toPageId).blocks.push(copy);
  });
  showToast(`‘${target.name}’ 페이지 맨 아래에 복사했어요.`, '그 페이지 보기', () => { switchPage(toPageId); select(copy.id); snapIn(copy.id); });
}

function deleteBlock(id) {
  const i = findIndex(id);
  if (i < 0) return;
  const gone = state.blocks[i];
  const name = BLOCKS[gone.type].name;
  // 같은 줄에 남는 본문 블록이 있으면 빈자리만큼 넓혀요 (휴대폰 너비는 그대로)
  let mates = [];
  if (isFlow(gone) && isMain(gone)) {
    const list = mainBlocks();
    const rows = layout(list);
    const r = rows[list.indexOf(gone)].row;
    mates = list.filter((b, k) => b !== gone && rows[k].row === r);
  }
  const freed = (gone.offset || 0) + gone.span;
  // 넓어지는 사진 · 영상은 지금 높이를 그대로 지켜요 (가로만 넓어지게: 칸에 꽉 채우기 + 지금 높이)
  const keepH = {};
  if (state.device === 'pc') {
    mates.forEach((m) => {
      const media = m.type === 'image' || (m.type === 'video' && m.props.source === 'file');
      const el = els.paper.querySelector(`.blk[data-id="${m.id}"]`);
      if (media && el && !m.minh) keepH[m.id] = Math.round(el.getBoundingClientRect().height);
    });
  }
  change(`${name} 삭제`, () => {
    state.blocks.splice(i, 1);
    if (state.selectedId === id) state.selectedId = null;
    if (mates.length) {
      const each = Math.floor(freed / mates.length);
      let extra = freed - each * mates.length;
      mates.forEach((m) => {
        const b = findBlock(m.id);
        b.span = Math.min(COLUMNS, b.span + each + (extra-- > 0 ? 1 : 0));
        if (keepH[m.id] > 40) { b.minh = keepH[m.id]; b.props.ratio = 'fill'; }
      });
    }
  });
  renderDrawer();
  showToast(mates.length ? `‘${name}’ 블록을 지우고, 옆 블록을 넓혀 빈자리를 채웠어요.` : `‘${name}’ 블록을 지웠어요.`, '되돌리기', undo);
}

// 고르기는 내용을 바꾸지 않으니 되돌리기에 남기지 않아요
function select(id) {
  if (sidePanel && id) { sidePanel = null; renderPageBar(); }
  if (picker && id) { picker = null; state.selectedId = id; renderPage(); renderInspector(); return; }
  if (state.selectedId === id) return;
  state.selectedId = id;
  els.paper.querySelectorAll('.blk').forEach((el) => el.classList.toggle('is-selected', el.dataset.id === id));
  renderInspector();
  if (PANE) { if (!paneQuiet && window.parent !== window) window.parent.postMessage({ type: 'ht-select', id }, '*'); }
  else paneSelect();
}

// 페이지를 더하거나 지우는 것처럼 사이트 전체가 바뀔 때
function changeSite(label, fn) {
  finishEdit(true);
  paneLabel = label;
  undoStack.record(snapshot(), label);
  fn();
  ADM_UI().ensureCompany(state.site, BLOCKS);
  syncIn();
  render();
  renderDrawer();
  scheduleSave();
}
// 다른 페이지 열기 (보기만 바뀌어서 되돌리기에 남기지 않아요)
function switchPage(id) {
  if (id === state.pageId || !state.site.pages.some((pg) => pg.id === id)) return;
  finishEdit(true);
  syncOut();
  state.pageId = id;
  state.selectedId = null;
  state.view = {};
  syncIn();
  render();
  els.stage.scrollTop = 0;
}

function restore(step, verb) {
  finishEdit(false);
  state.site = step.state.site;
  state.pageId = step.state.pageId;
  syncIn();
  render();
  renderDrawer();
  scheduleSave();
  showToast(`${verb} · ${step.label}`);
}
function undo() { const s = undoStack.undo(snapshot()); if (s) restore(s, '되돌렸어요'); }
function redo() { const s = undoStack.redo(snapshot()); if (s) restore(s, '다시 했어요'); }

// ---------- 전문 용어 함께 보기 (도구 설정 · 이 브라우저에 기억해요) ----------
//   켜면: 블록 영문 이름(Header …), 어려운 말(anchor · tel: · CMYK …)을 함께 보이고, '자세히' 칸을 처음부터 펼쳐요
//   처음 쓰는 사람을 위해 기본은 꺼져 있어요
const EN_KEY = 'hometeo.showEn2';
function getShowEn() { try { return localStorage.getItem(EN_KEY) === '1'; } catch (e) { return false; } }
function setShowEn(on) {
  try { localStorage.setItem(EN_KEY, on ? '1' : '0'); } catch (e) { /* 기억 못 해도 지금은 바뀌어요 */ }
  document.body.classList.toggle('show-en', on);
}
const enTag = (en) => (en ? ` <span class="en">${escapeHtml(en)}</span>` : '');

// ---------- 그리기 ----------
// 서랍: 영역 탭 (Header · Main Banner · Main · Footer · Aside) + 실제 모습을 줄인 미리보기
let drawerZone = 'main';
function miniPreview(it) {
  const def = BLOCKS[it.type];
  if (it.thumb || def.flow && !def.flow(makeProps(it.type, it.props)) || it.type === 'quick') {
    return `<span class="mini mini-thumb">${it.thumb || def.thumb}</span>`;
  }
  // 미리보기 속 버튼 · 링크는 그림일 뿐이라 span으로 바꿔요 (버튼 안에 버튼이 들어가면 카드가 깨져요)
  const html = def.render(makeProps(it.type, it.props), helpers, { id: 'preview-' + it.id })
    .replace(/<(button|a)\b/g, '<span').replace(/<\/(button|a)>/g, '</span>');
  return `<span class="mini"><span class="mini-inner ib-page"><span class="ib-grid"><span class="ib-cell" style="grid-column:1 / -1">${html}</span></span></span></span>`;
}
