/*
 * 홈터 · 편집 화면 동작 (9/12) — 자동 저장 · 작업 파일 · 내려받기 · 점검
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// =========================================================
// 저장 · 불러오기 · 내려받기
// =========================================================
const FILE_VERSION = 6;   // 2: 페이지 영역 · 메인 배너 / 3: 여러 페이지(site) / 4: 사이트 색 · 글꼴(theme) / 5: 홈터 · 내 글꼴(fonts) · 사업자 정보
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const safeName = (s) => String(s || '홈페이지').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) || '홈페이지';

// 블록 내용 안에서 쓰고 있는 사진 번호만 골라요 (안 쓰는 사진은 저장하지 않아요)
function allSiteBlocks() {
  syncOut();
  return [...state.site.shared, ...state.site.pages.flatMap((pg) => pg.blocks)];
}
function usedAssetIds(blocks) {
  if (window.HometeoBuild && window.HometeoBuild.usedAssetIds) {
    return window.HometeoBuild.usedAssetIds(state.site, state.assets);
  }
  const ids = new Set();
  const walk = (v) => {
    if (typeof v === 'string' && state.assets[v]) ids.add(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  blocks.forEach((b) => walk(b.props));
  if (state.site && state.site.info) walk([state.site.info.shareImage, state.site.info.icon]);
  if (state.site && state.site.fonts) walk(state.site.fonts.map((f) => f.asset));
  return [...ids];
}

function projectData() {
  const assets = {};
  usedAssetIds(allSiteBlocks()).forEach((id) => { assets[id] = state.assets[id]; });
  const site = { pages: state.site.pages, shared: state.site.shared, home: state.site.home, theme: state.site.theme, notes: state.site.notes || [], info: state.site.info || newInfo(), fonts: state.site.fonts || [], admin: normAdmin(state.site.admin) };
  return { app: 'hometeo', version: FILE_VERSION, savedAt: new Date().toISOString(), site, assets };
}

// 앞선 판의 작업 파일을 지금 구조로 바꿔요
//   큰 사진 소개(hero) · 슬라이드(slider) → 메인 배너(banner) 하나로 (두 번째부터는 본문의 글 블록으로)
//   맨 위 메뉴 · 맨 아래 정보 · 퀵메뉴가 여러 개면 첫 번째만 남겨요
function migrateLegacy(raw) {
  const notes = new Set();
  let hasBanner = raw.some((b) => b && b.type === 'banner');
  const seen = {};
  const out = [];
  raw.forEach((b) => {
    if (!b) return;
    if (b.type === 'hero' || b.type === 'slider') {
      const p = b.props || {};
      const minh = b.minh || (p.height ? OLD_HEIGHTS[p.height] || 480 : undefined);   // 높이 '자동'이었으면 그대로
      const slides = b.type === 'hero'
        ? [{ eyebrow: p.eyebrow || '', title: p.title, text: p.text, button: p.button, showButton: p.showButton !== false, link: p.link || '', image: p.image || null, imgX: p.imgX, imgY: p.imgY, imgZoom: p.imgZoom, bg: p.bg }]
        : (Array.isArray(p.slides) && p.slides.length ? p.slides : BLOCKS.banner.defaults().slides).map((x) => Object.assign({ eyebrow: '' }, x));
      if (!hasBanner) {
        hasBanner = true;
        notes.add('큰 사진 · 슬라이드 → 메인 배너');
        out.push({ id: b.id, type: 'banner', span: COLUMNS, offset: 0, ...(minh ? { minh } : {}), ...(b.hide ? { hide: b.hide } : {}),
          props: { slides, align: p.align || 'center', overlay: p.overlay == null ? 45 : p.overlay,
            autoplay: p.autoplay !== false, interval: p.interval || 5, arrows: p.arrows !== false, dots: p.dots !== false } });
      } else {
        notes.add('두 번째 큰 사진 → 본문의 글 블록');
        slides.forEach((x, k) => out.push({ id: k ? newId('b') : b.id, type: 'text', span: b.span, offset: b.offset, mspan: b.mspan, pt: b.pt, pb: b.pb, hide: b.hide,
          props: { eyebrow: x.eyebrow || '', title: x.title, body: x.text, align: p.align === 'left' ? 'left' : 'center', bg: x.bg || '#2B2A28',
            showButton: !!x.showButton, button: x.button, link: x.link || '',
            imagePos: x.image ? 'left' : 'none', image: x.image || null, imgX: x.imgX, imgY: x.imgY, imgZoom: x.imgZoom, ratio: '16/9' } }));
      }
      return;
    }
    if (BLOCKS[b.type] && BLOCKS[b.type].single) {
      if (seen[b.type]) { notes.add(`겹친 ‘${BLOCKS[b.type].name}’ 정리`); return; }
      seen[b.type] = true;
    }
    out.push(b);
  });
  return { blocks: out, notes: [...notes] };
}

// 블록 목록 하나를 확인하고, 빠진 내용은 처음 값으로 채워요 (나중에 블록이 바뀌어도 열리게)
function normBlocks(raw, notes) {
  const mig = migrateLegacy(Array.isArray(raw) ? raw : []);
  mig.notes.forEach((n) => { if (!notes.includes(n)) notes.push(n); });
  let blocks = mig.blocks
    .filter((b) => b && BLOCKS[b.type])
    .map((b) => ({
      id: typeof b.id === 'string' ? b.id : newId('b'),
      type: b.type,
      col: 1,
      span: Math.max(MIN_SPAN, Math.min(COLUMNS, Number(b.span) || COLUMNS)),
      offset: Math.max(0, Math.min(COLUMNS - 1, Number(b.offset) || 0)),
      ...(b.mspan === 6 ? { mspan: 6 } : {}),
      ...(b.minh === 'full' ? { minh: 'full' } : Number(b.minh) > 0 ? { minh: Math.min(1600, Math.round(Number(b.minh))) } : {}),
      ...(['none', 's', 'm', 'l'].includes(b.pt) ? { pt: b.pt } : {}),
      ...(['none', 's', 'm', 'l'].includes(b.pb) ? { pb: b.pb } : {}),
      ...(['none', 's', 'm', 'l'].includes(b.px) ? { px: b.px } : {}),
      ...(['pc', 'phone'].includes(b.hide) ? { hide: b.hide } : {}),
      ...(b.phoneOwn ? { phoneOwn: true } : {}),
      ...(b.minhM === 'full' || b.minhM === 'auto' || Number(b.minhM) > 0 ? { minhM: ['full', 'auto'].includes(b.minhM) ? b.minhM : Math.min(1600, Math.round(Number(b.minhM))) } : {}),
      props: (BLOCKS[b.type].migrate || ((x) => x))(Object.assign(BLOCKS[b.type].defaults(), b.props || {}))
    })).map((b) => {
      if (b.props.height && !b.minh) liftHeight(b); else delete b.props.height;
      // 옛 ‘가운데 좁게’(사진 · 영상) → 양옆 여백 ‘넓게’
      if (b.props.narrow) { if (!b.px) b.px = 'l'; delete b.props.narrow; }
      return b;
    });
  // 영역 순서가 바뀌었는지 (옛 파일은 본문 블록이 메뉴 위에 있을 수도 있어요)
  const before = blocks.map((b) => b.id).join();
  blocks = tidy(blocks);
  if (blocks.map((b) => b.id).join() !== before && !notes.includes('블록을 영역 순서대로 정리')) notes.push('블록을 영역 순서대로 정리');
  return blocks;
}
// 내 글꼴 목록 확인 (파일이 없는 글꼴은 빼요)
function normFonts(list, assets) {
  return (Array.isArray(list) ? list : []).filter((f) => f && typeof f.id === 'string' && typeof f.asset === 'string' && assets && typeof assets[f.asset] === 'string' && /^data:font\//.test(assets[f.asset]))
    .slice(0, 6).map((f) => ({ id: f.id, name: String(f.name || '내 글꼴').slice(0, 40), asset: f.asset, format: ['woff2', 'woff', 'ttf', 'otf'].includes(f.format) ? f.format : 'woff2', size: Number(f.size) || 0, licensed: !!f.licensed }));
}
const normGap = (g) => ([0, 16, 32, 48].includes(Number(g)) ? Number(g) : 0);

// 저장된 작업 파일을 확인해요. 옛 파일(한 페이지)은 첫 페이지 하나짜리 사이트로 바꿔요
function normalizeProject(data) {
  if (!data || typeof data !== 'object' || (data.app !== 'hometeo' && !(data.site || Array.isArray(data.blocks)))) throw new Error('not-project');   // 앞선 판의 파일도 구조를 보고 열어요
  const notes = [];
  let site;
  if (data.site && Array.isArray(data.site.pages) && data.site.pages.length) {
    const sharedRaw = normBlocks(data.site.shared, notes);
    const seen = {};
    const shared = sharedRaw.filter((b) => isShared(b) && !(BLOCKS[b.type].single && seen[b.type]) && (seen[b.type] = true));
    const files = new Set();
    const pages = data.site.pages.filter(Boolean).map((pg, i) => {
      let file = i === 0 && pg.file === 'index' ? 'index' : fileSlug(pg.file) || `page-${i + 1}`;
      if (file === 'index' && files.has('index')) file = `page-${i + 1}`;
      while (files.has(file)) file += '-2';
      files.add(file);
      return {
        id: typeof pg.id === 'string' ? pg.id : newId('p'),
        name: String(pg.name || `페이지 ${i + 1}`).slice(0, 30),
        file,
        gap: normGap(pg.gap),
        desc: String(pg.desc || '').slice(0, 300),
        x: Number.isFinite(pg.x) ? pg.x : 120 + i * 280,
        y: Number.isFinite(pg.y) ? pg.y : 200,
        blocks: normBlocks(pg.blocks, notes).filter((b) => !isShared(b))
      };
    });
    const home = pages.some((pg) => pg.id === data.site.home) ? data.site.home : pages[0].id;
    const fonts = normFonts(data.site.fonts, data.assets);
    window.HometeoTheme.setCustom(fonts);
    site = { pages, shared, home, fonts, theme: window.HometeoTheme.normalize(data.site.theme), info: normInfo(data.site.info), admin: normAdmin(data.site && data.site.admin), notes: (Array.isArray(data.site.notes) ? data.site.notes : []).filter((n) => n && typeof n === 'object').slice(0, 200).map((n) => ({
      id: typeof n.id === 'string' ? n.id : newId('n'), x: Number(n.x) || 0, y: Number(n.y) || 0,
      text: String(n.text || '').slice(0, 2000), color: ['yellow', 'pink', 'blue', 'green'].includes(n.color) ? n.color : 'yellow' })) };
  } else if (Array.isArray(data.blocks)) {
    site = makeSite(normBlocks(data.blocks, notes), normGap(data.page && data.page.gap));
  } else throw new Error('not-project');
  // 버전 4 전 파일: 흰 바탕(#ffffff)은 '사이트 바탕색 따르기'로 바꿔요 (보이는 모습은 같아요)
  if (!(data.version >= 4)) {
    const OLD = { header: '#ffffff', text: '#ffffff', image: '#ffffff', video: '#ffffff', cards: '#ffffff', aside: '#FBF7EF' };
    [...site.shared, ...site.pages.flatMap((pg) => pg.blocks)].forEach((b) => {
      if (OLD[b.type] && String(b.props.bg || '').toLowerCase() === OLD[b.type].toLowerCase()) b.props.bg = '';
    });
  }
  // 예전 파일: 사이트 이름을 따로 적어 두었으면(메뉴 제목과 다르면) 따로 쓰기로 둬요
  if (data.site && data.site.info && data.site.info.syncName === undefined && site.info && site.info.name) {
    const h = site.shared.find((b) => b.type === 'header');
    if (!h || h.props.logo !== site.info.name) site.info.syncName = false;
  }
  const assets = {};
  Object.entries(data.assets || {}).forEach(([k, v]) => {
    if (typeof v === 'string' && /^data:(image|video|font)\//.test(v)) assets[k] = v;
  });
  return { site, assets, savedAt: data.savedAt, notes };
}
// 옛 파일을 바꿨다면 한 번 알려줘요
const migratedNote = (p) => (p.notes && p.notes.length ? `옛 작업 파일을 새 구조로 바꿨어요 · ${p.notes.join(', ')}` : '');

// ---------- 자동 저장 ----------
let saveTimer = null;
let saveBroken = false;
function setSaveStatus(kind, text) {
  els.saveStatus.dataset.state = kind;
  els.saveStatus.textContent = text;
}
let liveChannel = null;
function scheduleSave() {
  if (PANE) { paneSend(); return; }
  schedulePhone();
  if (saveBroken) return;
  setSaveStatus('saving', '저장 중…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 500);
}
async function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    await window.HometeoStorage.save(projectData());
    // 열려 있는 관리자 화면(미리보기)에 '새로 저장됐어요' 알리기
    try { if (!liveChannel && window.BroadcastChannel) liveChannel = new BroadcastChannel('hometeo-live'); if (liveChannel) liveChannel.postMessage({ type: 'hometeo-saved' }); } catch (e) { /* 괜찮아요 */ }
    nudgeFileSave();
    const t = new Date();
    setSaveStatus('saved', `자동 저장됨 · ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
  } catch (err) {
    saveBroken = true;
    setSaveStatus('error', '자동 저장 안 됨');
    els.saveStatus.title = '이 브라우저에서는 자동 저장이 안 돼요. 파일 메뉴의 ‘작업 파일로 저장’을 써주세요.';
    showToast('이 브라우저에서는 자동 저장이 안 돼요. ‘작업 파일로 저장’을 써주세요.');
  }
}
// 창을 닫거나 다른 탭으로 갈 때, 기다리던 저장을 바로 해요
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveTimer) saveNow();
});

async function loadSaved() {
  try {
    const data = await window.HometeoStorage.load();
    if (!data) { setSaveStatus('saved', '자동 저장 켜짐'); return false; }
    const p = normalizeProject(data);
    if (!p.site.shared.length && p.site.pages.every((pg) => !pg.blocks.length)) { setSaveStatus('saved', '자동 저장 켜짐'); return false; }
    Object.assign(state.assets, p.assets);
    state.selectedId = null;
    useSite(p.site);
    render();
    renderDrawer();
    const when = p.savedAt ? new Date(p.savedAt) : null;
    const label = when ? `${when.getMonth() + 1}월 ${when.getDate()}일 ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}` : '';
    setSaveStatus('saved', '자동 저장 켜짐');
    const note = migratedNote(p);
    if (note) { showToast(note); scheduleSave(); }
    else showToast(`지난번 작업을 이어서 해요${label ? ` · ${label} 저장` : ''}`);
    return true;
  } catch (err) {
    setSaveStatus('saved', '자동 저장 켜짐');
    return false;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// ---------- 작업 파일 ----------
function saveProjectFile() {
  finishEdit(true);
  const json = JSON.stringify(projectData());
  downloadBlob(new Blob([json], { type: 'application/json' }), `${safeName(siteTitle())}_작업파일_${today()}.hometeo`);
  showToast('작업 파일을 저장했어요. 다음에 ‘작업 파일 불러오기’로 이어서 할 수 있어요.');
  try { localStorage.setItem('hometeo.fileSavedAt', String(Date.now())); localStorage.setItem('hometeo.editsSinceFile', '0'); } catch (e) { /* 괜찮아요 */ }
}
// 작업 파일 챙기기: 자동 저장은 이 브라우저 안에만 있어서, 많이 고쳤는데 파일로 받아 둔 지 오래면 한 번 알려줘요
let fileNudged = false;
function nudgeFileSave() {
  if (fileNudged) return;
  try {
    const n = Number(localStorage.getItem('hometeo.editsSinceFile') || 0) + 1;
    localStorage.setItem('hometeo.editsSinceFile', String(n));
    const at = Number(localStorage.getItem('hometeo.fileSavedAt') || 0);
    const days = at ? (Date.now() - at) / 86400000 : 999;
    if (n >= 40 && days >= 3) {
      fileNudged = true;
      setTimeout(() => showToast(at ? `작업 파일을 받아 둔 지 ${Math.floor(days)}일 지났어요. 브라우저 기록을 지우면 고친 내용이 사라질 수 있어요.` : '고친 내용은 이 브라우저 안에만 저장돼 있어요. 작업 파일로 한 번 받아 두면 안전해요.', '지금 받아 두기', saveProjectFile), 1200);
    }
  } catch (e) { /* 괜찮아요 */ }
}

const projectPicker = document.createElement('input');
projectPicker.type = 'file';
// 확장자는 따로 막지 않아요 (앞선 판에서 저장한 작업 파일도 열 수 있게)
projectPicker.hidden = true;
document.body.appendChild(projectPicker);
// 보관함(GitHub)의 최신 작업 파일 불러오기: 사장님이 관리자 화면에서 고친 내용까지
async function loadFromRepo() {
  const adm = normAdmin(state.site.admin);
  if (!adm.owner || !adm.repo) { showToast('내려받기 창의 ② 칸에 GitHub 아이디와 보관함 이름을 먼저 적어 주세요.'); return; }
  showToast('보관함에서 최신 내용을 가져오는 중…');
  const br = encodeURIComponent(adm.branch || 'main');
  const urls = [
    `https://api.github.com/repos/${encodeURIComponent(adm.owner)}/${encodeURIComponent(adm.repo)}/contents/project.hometeo?ref=${br}`,
    `https://raw.githubusercontent.com/${encodeURIComponent(adm.owner)}/${encodeURIComponent(adm.repo)}/${br}/project.hometeo`
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: /api\.github/.test(u) ? { Accept: 'application/vnd.github.raw' } : {}, cache: 'no-store' });
      if (!res.ok) continue;
      const p = normalizeProject(await res.json());
      p.site.admin = Object.assign({}, p.site.admin || {}, { owner: adm.owner, repo: adm.repo, branch: adm.branch, siteUrl: adm.siteUrl || (p.site.admin && p.site.admin.siteUrl) || '', enabled: true });
      Object.assign(state.assets, p.assets);
      state.selectedId = null;
      changeSite('보관함에서 불러오기', () => { state.site = p.site; state.pageId = p.site.home; state.view = {}; });
      renderDrawer();
      showToast('보관함의 최신 내용을 불러왔어요. 사장님이 고친 내용이 들어 있어요.', '되돌리기', undo);
      return true;
    } catch (e) { /* 다음 주소로 */ }
  }
  showToast('보관함에서 불러오지 못했어요. 보관함 이름과 공개(Public)인지 확인해 주세요.');
  return false;
}
projectPicker.addEventListener('change', async () => {
  const file = projectPicker.files[0];
  projectPicker.value = '';
  if (!file) return;
  try {
    const p = normalizeProject(JSON.parse(await file.text()));
    Object.assign(state.assets, p.assets);
    state.selectedId = null;
    changeSite('작업 파일 불러오기', () => { state.site = p.site; state.pageId = p.site.home; state.view = {}; });
    renderDrawer();
    const note = migratedNote(p);
    showToast(note ? `‘${file.name}’을 불러왔어요 · ${note}` : `‘${file.name}’을 불러왔어요.`, '되돌리기', undo);
  } catch (err) {
    showToast('홈터 작업 파일이 아니에요. ‘.hometeo’ 파일을 골라주세요.');
  }
});

// 빈 페이지는 맨 위 메뉴와 맨 아래 정보로 시작해요
const blankBlocks = () => [makeBlock('header'), makeBlock('footer')];
function startNew() {
  finishEdit(true);
  const had = state.blocks.length > 0;
  state.view = {};
  state.selectedId = null;
  changeSite('새로 시작', () => { const site = makeSite(blankBlocks(), 0); state.site = site; state.pageId = site.home; });
  els.stage.scrollTop = 0;
  showToast('새 페이지로 시작했어요. 맨 위 메뉴와 맨 아래 정보 사이에 블록을 놓아보세요.', had ? '되돌리기' : null, had ? undo : null);
}

// ---------- 압축파일로 내려받기 ----------
function dataUrlToBytes(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  return { bytes, mime };
}
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };

// 개발자 안내 (DEVELOPER.md): 파일 구조 · 이름 규칙 · 연결할 곳
function developerGuide(pages) {
  const forms = allSiteBlocks().filter((b) => b.type === 'form' || b.type === 'login');
  return [
    '# 개발자 안내 · Developer notes',
    '',
    '홈터(Hometeo)로 만든 정적 홈페이지예요. 서버 없이 그대로 열리고, 어떤 정적 호스팅에도 올릴 수 있어요.',
    '',
    '## 파일',
    '',
    ...pages.map((pg) => `- \`${pg.file}\` — ${pg.name}`),
    '- `css/hometeo.css` — 모든 페이지가 함께 쓰는 모양',
    '- `js/hometeo.js` — 움직이는 부분 (전체 메뉴, 슬라이드, 지금 보는 곳 표시, 퀵메뉴 전화, 갤러리 크게 보기, 문의 양식, 로그인 안내)',
    '- `images/`, `videos/` — 사진 · 영상 (각각 고유 에셋 번호로 저장돼요. 예: `images/img-…`)',
    '- `files/` — 자료실 · 게시판에 넣은 PDF · 한글 · 워드 파일',
    '- `project.hometeo` — 홈터 작업 파일 (JSON). 올리지 않아도 돼요',
    '',
    '## 구조',
    '',
    '```',
    '<body style="--c-bg … --font-body …">   사이트 색 · 글꼴 (CSS 변수)',
    '  .ib-page > .ib-frame',
    '    .ib-side                            벽에 고정한 맨 위 메뉴 (있을 때)',
    '    .ib-body',
    '      .ib-zone.zone-header              맨 위 메뉴 (.is-sticky = 따라오는 메뉴)',
    '      .ib-zone.zone-banner              메인 배너',
    '      main.ib-zone.zone-main            본문 (12칸 grid)',
    '      .ib-zone.zone-footer              맨 아래 정보',
    '  .b-quick                              퀵메뉴 (화면에 떠 있어요)',
    '```',
    '',
    '- 블록 하나 = `<div id="b-블록번호" class="ib-cell section-이름">` 안의 `.b-이름` (예: `.b-text`, `.b-cards`). 메뉴의 페이지 안 이동은 `#b-블록번호` 로 가요.',
    '- 칸: `.ib-grid` 는 12칸 grid. 블록 너비는 `grid-column`, 휴대폰 너비는 `--mspan`, 높이는 `--minh` · `--minh-phone`.',
    '- 휴대폰 모습은 화면 폭이 아니라 페이지 폭 기준이에요 (CSS container query `ib`, 640px 이하).',
    '- 사이트 색: `--c-bg` 바탕, `--c-text` 글자, `--c-point` 포인트, `--c-point-ink` 포인트 위 글자, `--c-dark` 어두운 칸, `--c-soft` 연한 바탕. 글꼴: `--font-body`, `--font-head`.',
    '- 사진 위치: `--ix --iy --iz` (휴대폰 따로 `--ixm --iym --izm`).',
    '',
    '## 연결할 곳',
    '',
    forms.length ? '이 사이트에는 다음 양식이 있어요. HTML 안의 `홈터 · …` 주석을 찾으세요.' : '이 사이트에는 서버에 연결할 양식이 없어요.',
    ...forms.map((b) => b.type === 'login'
      ? '- 로그인 칸: `form[data-login]` — `action` · `method` 를 서버에 맞게 바꾸세요. 보내는 이름: `username`, `password`, `remember`. `data-not-connected` 를 지우면 그대로 보내요.'
      : `- 문의 양식: \`form.b-form-grid\` — 지금 ${b.props.send === 'mail' ? '메일로 받기(mailto)' : b.props.send === 'link' ? '바깥 양식 링크' : '서버로 보내기'}. 서버로 받으려면 \`data-send="mail"\` 을 지우고 \`action\` 을 넣으세요. 항목 이름은 \`f0, f1, …\` 순서예요.`),
    '',
    '## 다시 고치기',
    '',
    '홈터에서 로고 메뉴 → 작업 파일 불러오기 → `project.hometeo`. 손으로 고친 HTML은 홈터로 다시 내려받으면 덮어써지니, 큰 수정은 홈터에서 하거나 내려받은 다음 마지막에 하세요.',
    ''
  ].join('\n');
}

// =========================================================
// 내려받기 전 점검: 견본 글 · 빈 링크 · 연결 안 된 페이지 · 빈 사이트 정보 · 사진 설명 · 글자 대비 · 내 글꼴
//   red    = 꼭 고치세요 (그대로 올리면 방문자가 곤란해요)
//   yellow = 고치면 좋아요
//   go     = 누르면 그곳으로: { page, block } · 'info' · 'theme' · 'map' · 'fonts'
// =========================================================
const SAMPLE_RE = /견본 문구|○○|0{2,3}-0{3,4}-0{4}|0{3}-0{2}-0{5}|홍길동|김바른|example\.com|0000호/;
function siteChecks() {
  finishEdit(true);
  syncOut();
  const site = state.site;
  const out = [];
  const TH = window.HometeoTheme;
  const pageName = (pg) => pg.name || '페이지';
  const sharedIds = new Set(site.shared.map((b) => b.id));
  const seenShared = new Set();
  // 1) 완성 파일과 똑같이 그려 보고 살펴봐요
  const built = buildSitePages((id) => (id ? 'asset/' + id : null));
  built.forEach((bp) => {
    const pg = site.pages.find((x) => x.id === bp.id);
    const doc = new DOMParser().parseFromString(bp.html, 'text/html');
    doc.querySelectorAll('.b-panel').forEach((el) => el.remove());   // 같은 내용을 두 번 세지 않게
    doc.querySelectorAll('[id^="b-"].ib-cell').forEach((cell) => {
      const id = cell.id.slice(2);
      const shared = sharedIds.has(id);
      if (shared && seenShared.has(id)) return;   // 모든 페이지에 있는 블록은 한 번만
      if (shared) seenShared.add(id);
      const b = shared ? site.shared.find((x) => x.id === id) : pg.blocks.find((x) => x.id === id);
      if (!b) return;
      const where = { page: pg.id, block: id };
      const bname = BLOCKS[b.type].name || (window.HometeoAdminUI ? window.HometeoAdminUI.blockName(b.type) : b.type);
      const at = shared ? `${bname} (모든 페이지)` : `${pageName(pg)} · ${bname}`;
      const txt = cell.textContent.replace(/\s+/g, ' ');
      const m = SAMPLE_RE.exec(txt);
      if (m) out.push({ level: 'red', kind: 'sample', at, text: `견본 글이 남아 있어요: “${txt.slice(Math.max(0, m.index - 12), m.index + 24).trim()}”`, go: where });
      const empty = [...cell.querySelectorAll('a[href="#"]')].filter((a) => !a.matches('[data-open-menu], [data-go-top], .b-logo') && a.textContent.trim());
      if (empty.length) {
        const names = empty.slice(0, 3).map((a) => `‘${a.textContent.trim().slice(0, 12)}’`).join(', ');
        out.push({ level: 'red', kind: 'link', at, text: `눌러도 갈 곳이 없는 버튼 · 메뉴 ${empty.length}개: ${names}${empty.length > 3 ? ' …' : ''}`, go: where });
      }
      if (b.type === 'map' && b.props.mapKind === 'embed' && !/daumRoughmapContainer|"timestamp"/.test(b.props.kakaoCode || '')) out.push({ level: 'yellow', kind: 'map', at, text: '카카오맵 ‘지도 퍼가기’ 코드를 넣으면 진짜 지도가 보여요 (지금은 주소 카드)', go: where });
      if (b.type === 'files') {
        const none = (b.props.items || []).filter((it) => !it._hide && !it.file && !(it.url || '').trim()).length;
        if (none) out.push({ level: 'red', kind: 'files', at, text: `파일을 넣지 않은 자료가 ${none}개 있어요 (손님이 받을 수 없어요)`, go: where });
      }
      if (b.props && b.props._off) out.push({ level: 'yellow', kind: 'off', at, text: '잠시 숨겨 둔 블록이에요 (손님 화면에는 안 보여요)', go: where });
      if (['image', 'gallery', 'logos', 'works'].includes(b.type)) {
        const noAlt = [...cell.querySelectorAll('img')].filter((im) => !(im.getAttribute('alt') || '').trim()).length;
        if (noAlt) out.push({ level: 'yellow', kind: 'alt', at, text: `사진 설명 글이 없는 사진 ${noAlt}장 (검색 · 화면 읽어주기에 쓰여요)`, go: where });
      }
      if (b.type === 'form') {
        const p = b.props;
        if (p.send === 'mail' && !/@/.test(p.email || '')) out.push({ level: 'red', kind: 'form', at, text: '문의를 받을 메일 주소가 비어 있어요', go: where });
        if (p.send === 'link' && !(p.formUrl || '').trim()) out.push({ level: 'red', kind: 'form', at, text: '연결할 구글 · 네이버 폼 주소가 비어 있어요', go: where });
        if (p.send === 'mail' && p.fields.some((f) => f.kind === 'password')) out.push({ level: 'red', kind: 'form', at, text: '비밀번호를 메일로 받으면 위험해요. 비밀번호 항목을 빼거나 ‘개발자 연결’로 바꾸세요', go: where });
        if (p.send === 'action' && !(p.action || '').trim()) out.push({ level: 'yellow', kind: 'form', at, text: '개발자 연결 주소가 비어 있어요 (내려받은 뒤 연결하면 돼요)', go: where });
      }
      // 블록 바탕색을 따로 골랐을 때 글자가 잘 보이는지
      const bg = b.props && b.props.bg;
      if (bg && /^#[0-9a-f]{6}$/i.test(bg)) {
        const n = parseInt(bg.slice(1), 16);
        const ink = ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 140 ? '#ffffff' : '#2B2A28';   // 블록이 쓰는 것과 같은 계산
        if (TH.contrast(bg, ink) < 4.5) out.push({ level: 'yellow', kind: 'contrast', at, text: `바탕색(${bg})에서 글자가 잘 안 보일 수 있어요`, go: where });
      }
    });
  });
  // 2) 찾아갈 방법이 없는 페이지
  const incoming = new Set(mapEdges().map((e) => e.to));
  site.pages.forEach((pg) => {
    if (pg.id !== site.home && !incoming.has(pg.id)) out.push({ level: 'red', kind: 'orphan', at: pageName(pg), text: '어디에서도 이 페이지로 가는 버튼 · 메뉴가 없어요', go: 'map' });
  });
  // 3) 사이트 정보
  const inf = site.info || newInfo();
  if (!inf.name.trim()) out.push({ level: 'yellow', kind: 'info', at: '사이트 정보', text: '사이트 이름이 비어 있어요 (브라우저 탭 · 검색에 보여요)', go: 'info' });
  if (!inf.desc.trim()) out.push({ level: 'yellow', kind: 'info', at: '사이트 정보', text: '사이트 소개가 비어 있어요 (검색 결과 · 카톡 공유에 보여요)', go: 'info' });
  if (!inf.shareImage) out.push({ level: 'yellow', kind: 'info', at: '사이트 정보', text: '카톡 · SNS 공유 사진이 없어요', go: 'info' });
  // 4) 사이트 색: 글자가 잘 보이는지
  TH.checkColors(site.theme).forEach((c) => out.push({ level: c.level, kind: 'contrast', at: '사이트 꾸미기', text: c.text, go: 'theme' }));
  // 5) 내가 올린 글꼴: 써도 되는지 확인했는지
  if (DECO_FONTS.includes(((site.theme || {}).font || {}).ko)) out.push({ level: 'yellow', kind: 'readable', at: '사이트 꾸미기 · 글꼴', text: '본문 글꼴이 꾸밈 글꼴이라 긴 글은 읽기 힘들 수 있어요', go: 'theme' });
  (site.fonts || []).forEach((f) => { if (!f.licensed) out.push({ level: 'red', kind: 'font', at: '사이트 꾸미기 · 내 글꼴', text: `‘${f.name}’ 글꼴을 홈페이지에 써도 되는지 확인 표시가 없어요`, go: 'theme' }); });
  // 로그인 칸은 모양만 있어요
  site.pages.forEach((pg) => (pg.blocks || []).forEach((b) => {
    if (b.type === 'login' && !(b.props && b.props.action)) out.push({ level: 'yellow', kind: 'login', at: `${pg.name} · 로그인 칸`, text: '로그인 칸은 모양만 있어요. 손님이 눌러도 로그인되지 않아요 (도움말 → 로그인 연결하기)', go: { page: pg.id, block: b.id } });
  }));

  return out;
}
function goCheck(go) {
  closeModal();
  if (go === 'admin') { if (state.mode === 'map') setMode('edit'); openAdmin('guide'); return; }
  if (go === 'info') { if (state.mode === 'map') setMode('edit'); openInfo(); return; }
  if (go === 'theme') { if (state.mode === 'map') setMode('edit'); openTheme(); return; }
  if (go === 'map') { if (state.mode !== 'map') setMode('map'); return; }
  if (go && go.block) {
    if (state.mode === 'map') setMode('edit');
    switchPage(go.page);
    select(go.block);
    const el = els.paper.querySelector(`[data-id="${go.block}"]`);
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('check-flash'); setTimeout(() => el.classList.remove('check-flash'), 1600); }
  }
}
function openCheck(forDownload) {
  const list = siteChecks();
  const reds = list.filter((c) => c.level === 'red'), yellows = list.filter((c) => c.level === 'yellow');
  if (forDownload && !list.length) return true;   // 문제 없으면 바로 내려받기
  const fixOf = (c) => ({ sample: '가게 기본 정보 적기', font: '확인했어요', login: '연결 안내 보기', readable: '읽기 쉬운 글꼴로' })[c.kind] || (c.kind === 'contrast' && c.go === 'theme' ? '추천 색으로 바꾸기' : '') || (c.kind === 'info' && /공유 사진/.test(c.text) && firstPhoto() ? '첫 사진을 공유 사진으로' : '');
  const row = (c, i) => `<li class="ck-item lv-${c.level}"><button data-ck="${i}"><i class="ck-dot"></i><span><small>${escapeHtml(c.at)}</small>${escapeHtml(c.text)}</span><em>고치러 가기 →</em></button>${fixOf(c) ? `<button class="ck-fix" data-ck-fix="${i}">${fixOf(c)}</button>` : ''}</li>`;
  const all = [...reds, ...yellows];
  const el = openModal(`
    <div class="modal wide checkup" role="dialog" aria-modal="true" aria-labelledby="check-title">
      <div class="modal-head">
        <h2 id="check-title">${all.length ? (forDownload ? '내려받기 전에 확인해 주세요' : '빠뜨린 것 점검') : '빠뜨린 것이 없어요!'}</h2>
        <button class="icon-btn" data-close aria-label="닫기">${ICON.x}</button>
      </div>
      ${all.length ? `<p class="modal-help">항목을 누르면 그 자리로 가요. <b class="ck-red">빨강</b>은 꼭 고치는 게 좋고, <b class="ck-yellow">노랑</b>은 고치면 더 좋아요.</p>
      ${reds.length ? `<h3 class="ck-head">꼭 고치세요 · ${reds.length}</h3><ul class="ck-list">${reds.map((c) => row(c, all.indexOf(c))).join('')}</ul>` : ''}
      ${yellows.length ? `<h3 class="ck-head">고치면 좋아요 · ${yellows.length}</h3><ul class="ck-list">${yellows.map((c) => row(c, all.indexOf(c))).join('')}</ul>` : ''}`
      : '<p class="modal-help">견본 글, 빈 링크, 연결 안 된 페이지, 사이트 정보, 글자 색까지 모두 괜찮아요.</p>'}
      <div class="modal-foot">
        <span class="spacer"></span>
        ${forDownload ? '<button class="btn" data-close>고치러 가기</button><button class="btn btn-primary" data-ck-download>이대로 내려받기</button>'
          : `<button class="btn${all.length ? '' : ' btn-primary'}" data-close>닫기</button>`}
      </div>
    </div>`);
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    if (e.target.closest('[data-ck-download]')) {
      closeModal();
      if (pendingDownloadAction) pendingDownloadAction();
      else downloadSite(true);
      return;
    }
    const fx = e.target.closest('[data-ck-fix]');
    if (fx) { runFix(all[Number(fx.dataset.ckFix)], forDownload); return; }
    const b = e.target.closest('[data-ck]');
    if (b) goCheck(all[Number(b.dataset.ck)].go);
  });
  return false;
}

let pendingDownloadAction = null;

// 점검에서 바로 고치기
function firstPhoto() {
  for (const b of allSiteBlocks()) {
    const sl = b.type === 'banner' && b.props.slides && b.props.slides.find((x) => x.image && state.assets[x.image]);
    if (sl) return sl.image;
    if (b.props && b.props.image && state.assets[b.props.image]) return b.props.image;
  }
  return null;
}
function runFix(c, forDownload) {
  const again = () => { closeModal(); openCheck(forDownload); };
  if (c.kind === 'sample') {
    closeModal(); if (state.mode === 'map') setMode('edit'); openInfo();
    setTimeout(() => { const sec = els.inspector.querySelector('#biz-sec'); if (sec) { sec.classList.remove('is-folded'); sec.scrollIntoView({ block: 'start' }); const i = sec.querySelector('input'); if (i) i.focus(); } }, 60);
    showToast('가게 정보를 적으면 견본 글(가짜 번호 · 이름)이 한 번에 바뀌어요.');
    return;
  }
  if (c.kind === 'font') { changeSite('글꼴 사용 확인', () => { (state.site.fonts || []).forEach((f) => { f.licensed = true; }); }); again(); return; }
  if (c.kind === 'login') { closeModal(); openGuide('login'); return; }
  if (c.kind === 'readable') { setReadable('pretendard'); again(); return; }
  if (c.kind === 'contrast') {
    setTheme('추천 색으로 바꾸기', (t) => { const f = window.HometeoTheme.fixColors(t); t.bg = f.bg; t.point = f.point; t.dark = f.dark; t.text = f.text; });
    again(); return;
  }
  if (c.kind === 'info') { const img = firstPhoto(); if (img) setInfo('공유 사진 넣기', (inf) => { inf.shareImage = img; }); again(); }
}

// 완성 홈페이지 압축파일(ZIP) 생성
function generateSiteZip() {
  const enc = new TextEncoder();
  const BUILD = window.HometeoBuild;
  const assetResult = (BUILD && BUILD.buildSiteAssetFiles)
    ? BUILD.buildSiteAssetFiles(state.site, state.assets)
    : { files: [], paths: {} };
  const files = assetResult.files.map((f) => ({ name: f.name, data: f.data }));
  const paths = assetResult.paths;
  const pages = buildSitePages((id) => (id && paths[id]) || null);
  const readme = [
    '홈터로 만든 홈페이지예요.',
    '',
    '■ 열어보기',
    '  index.html 을 더블클릭하면 브라우저에서 열려요.',
    '',
    '■ 들어 있는 것',
    '  index.html      첫 페이지',
    ...pages.filter((pg) => pg.file !== 'index.html').map((pg) => `  ${pg.file.padEnd(15)} ${pg.name}`),
    '  css, js 폴더    모든 페이지가 함께 쓰는 모양 · 움직임 파일',
    '  images 폴더     홈페이지에 들어간 사진',
    '  videos 폴더     홈페이지에 들어간 영상 (넣은 경우)',
    '  project.hometeo  홈터 작업 파일 (다시 고칠 때 써요)',
    '',
    '■ 인터넷에 올리기',
    '  압축을 푼 폴더를 통째로 올리면 돼요 (.html 파일, css · js · images · videos 폴더).',
    '  가장 쉬운 곳: Netlify Drop (https://app.netlify.com/drop) 에 폴더를 끌어다 놓기',
    '  그 밖에: Render 정적 사이트, GitHub Pages',
    '  올린 뒤 받은 주소를 홈터의 [사이트 정보 → 홈페이지 주소]에 적고 다시 내려받으면 카톡 공유 사진이 보여요.',
    '  (유튜브 영상은 인터넷에 올린 다음에 재생돼요. 내 컴퓨터에서 바로 열면 안 나올 수 있어요)',
    '  (project.hometeo 는 올리지 않아도 돼요)',
    '',
    '■ 다시 고치고 싶을 때',
    '  홈터에서 [파일] → [작업 파일 불러오기] 를 누르고 project.hometeo 를 고르세요.',
    ''
  ].join('\r\n');
  pages.slice().reverse().forEach((pg) => files.unshift({ name: pg.file, data: enc.encode(pg.html) }));
  // 모든 페이지가 함께 쓰는 모양 · 스크립트 파일, 개발자 안내
  files.push({ name: 'css/hometeo.css', data: enc.encode(window.HometeoExport.siteCss()) });
  files.push({ name: 'js/hometeo.js', data: enc.encode(window.HometeoExport.siteScript()) });
  files.push({ name: 'DEVELOPER.md', data: enc.encode(developerGuide(pages)) });
  files.push({ name: 'project.hometeo', data: enc.encode(JSON.stringify(projectData())) });
  files.push({ name: 'README.txt', data: enc.encode('\uFEFF' + readme) });
  return window.HometeoZip.make(files);
}

// 관리자 화면 포함 내보내기 모달 (2개 받기 팝업 창)
function openAdminExportModal(openAdmin2) {
  closeModal();
  const isFile = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:');
  let siteDownloaded = false;
  let adminDownloaded = false;

  const wrap = document.createElement('div');
  wrap.className = 'modal-back';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.innerHTML = `
    <div class="modal admin-export-card">
      <div class="modal-head">
        <h2>내려받기</h2>
        <button class="icon-btn" data-close aria-label="닫기">${ICON.x}</button>
      </div>
      <p class="modal-help">① 홈페이지만 받아도 돼요. 사장님이 직접 글 · 사진을 고치게 하려면 ②도 받아요.</p>

      ${isFile ? `
        <div class="admin-export-warn">
          ⚠️ <b>관리자 화면 내보내기는 인터넷 주소에서 연 홈터에서 할 수 있어요 (예: Render 주소).</b>
          <small>지금은 내 컴퓨터 파일(file://)로 열려 있어서 관리자 화면 파일을 읽을 수 없어요. 홈페이지 파일은 아래에서 그대로 내려받을 수 있어요.</small>
        </div>
      ` : ''}

      ${(() => { const a = normAdmin(state.site.admin); return a.owner && a.repo ? `<div class="export-repo-note">사장님이 관리자 화면에서 고친 적이 있나요? 다시 올리면 덮어써질 수 있어요. <button class="btn small" id="btn-load-repo">보관함의 최신 내용 먼저 불러오기</button></div>` : ''; })()}
      <div class="export-dl-grid">
        <div class="export-dl-item" id="export-box-site">
          <div class="export-dl-top">
            <button class="btn btn-primary export-dl-btn" id="btn-dl-site">① 홈페이지 받기</button>
            <span class="export-dl-badge" id="badge-dl-site" hidden>✓ 받음</span>
          </div>
          <p class="export-dl-sub">손님이 보는 홈페이지예요. 압축을 풀어 인터넷에 올리면 돼요.</p>
        </div>
        <details class="export-admin-opt"${openAdmin2 ? ' open' : ''}>
          <summary>② 사장님이 직접 고치는 관리자 화면도 받기 <small>(골라서 · GitHub 필요)</small></summary>

        <div class="export-dl-item" id="export-box-admin">
          <div class="export-admin-fields">
            <label>GitHub 아이디<input class="input" id="exp-owner" type="text" value="${escapeHtml(normAdmin(state.site.admin).owner)}" placeholder="예: my-name" autocomplete="off"></label>
            <label>홈페이지 보관함 이름<input class="input" id="exp-repo" type="text" value="${escapeHtml(normAdmin(state.site.admin).repo)}" placeholder="예: my-shop" autocomplete="off"></label>
            <label>홈페이지 주소 <small>(몰라도 돼요)</small><input class="input" id="exp-url" type="text" value="${escapeHtml(normAdmin(state.site.admin).siteUrl || (state.site.info && state.site.info.url) || '')}" placeholder="예: https://my-shop.onrender.com" autocomplete="off"></label>
          </div>
          <div class="export-dl-top">
            <button class="btn btn-primary export-dl-btn" id="btn-dl-admin"${isFile ? ' disabled' : ''}>② 관리자 화면 받기</button>
            <span class="export-dl-badge" id="badge-dl-admin" hidden>✓ 받음</span>
          </div>
          <p class="export-dl-sub">사장님이 고치는 화면 → 관리자 보관함(비공개)에 올려요</p>
          <div class="export-owner-msg" id="exp-msg" hidden>
            <label for="exp-msg-text">사장님께 보낼 안내문 <small>(고쳐 써도 돼요 · 열쇠는 따로 전해요)</small></label>
            <textarea class="input" id="exp-msg-text" rows="9"></textarea>
            <button class="btn small" id="btn-copy-msg">안내문 복사하기</button>
          </div>
        </div>
        </details>
      </div>

      <div class="export-dl-done" id="export-dl-done" hidden>
        🎉 <b>다 받았어요!</b> 이제 각 안내에 따라 GitHub 보관함에 올려주세요.
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" id="btn-show-after" type="button">☁️ 내려받은 다음엔?</button>
        <button class="btn btn-ghost" id="btn-show-guide" type="button">📖 관리자 화면 따라 하기</button>
        <span class="spacer"></span>
        <button class="btn" data-close>닫기</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  modalOpen = { el: wrap };

  const checkAllDone = () => {
    if (siteDownloaded && adminDownloaded) {
      const doneEl = wrap.querySelector('#export-dl-done');
      if (doneEl) doneEl.hidden = false;
    }
  };

  wrap.addEventListener('click', async (e) => {
    if (e.target === wrap || e.target.closest('[data-close]')) {
      closeModal();
      return;
    }

    // 0. 따라 하기 안내 보기 (내보내기 창 닫고 관리자 설정 열어 첫 단계 펼치기)
    if (e.target.closest('#btn-show-guide')) {
      closeModal();
      if (state.mode === 'map') setMode('edit');
      openAdmin('guide');
      const openFirst = () => {
        const guideBox = document.querySelector('#admin-guide-box');
        if (guideBox) {
          guideBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const firstStep = guideBox.querySelector('.guide-step');
          if (firstStep) {
            firstStep.open = true;
            firstStep.setAttribute('open', '');
          }
        }
      };
      openFirst();
      setTimeout(openFirst, 80);
      setTimeout(openFirst, 250);
      return;
    }

    if (e.target.closest('#btn-show-after')) { closeModal(); openAfter(false); return; }
    if (e.target.closest('#btn-load-repo')) { closeModal(); loadFromRepo(); return; }
    if (e.target.closest('#btn-copy-msg')) {
      const ta = wrap.querySelector('#exp-msg-text');
      try { await navigator.clipboard.writeText(ta.value); showToast('안내문을 복사했어요. 문자 · 카톡에 붙여넣으세요.'); }
      catch (err) { ta.select(); document.execCommand && document.execCommand('copy'); showToast('안내문을 골라 두었어요. Ctrl + C 로 복사하세요.'); }
      return;
    }
    // 1. 홈페이지 받기
    if (e.target.closest('#btn-dl-site')) {
      const zip = generateSiteZip();
      downloadBlob(zip, `${safeName(siteTitle())}_홈페이지_${today()}.zip`);
      siteDownloaded = true;
      { const kb = zip.size / 1024; showToast(`홈페이지를 내려받았어요 · ${kb >= 1024 ? (kb / 1024).toFixed(1) + 'MB' : Math.max(1, Math.round(kb)) + 'KB'} · 올리는 방법은 ‘내려받은 다음엔?’`); }
      const b = wrap.querySelector('#badge-dl-site');
      if (b) b.hidden = false;
      checkAllDone();
      return;
    }

    // 2. 관리자 화면 받기
    const adminBtn = e.target.closest('#btn-dl-admin');
    if (adminBtn) {
      if (isFile) {
        showToast('관리자 화면 내보내기는 인터넷 주소에서 연 홈터에서 할 수 있어요 (예: Render 주소)');
        return;
      }
      const val = (id) => ((wrap.querySelector(id) || {}).value || '').trim();
      const owner = val('#exp-owner'), repo = val('#exp-repo'), siteUrl = val('#exp-url');
      if (!owner || !repo) {
        showToast('GitHub 아이디와 홈페이지 보관함 이름을 적어 주세요. (따라 하기 안내 ①에서 만드는 보관함이에요)');
        const f = wrap.querySelector(owner ? '#exp-repo' : '#exp-owner'); if (f) f.focus();
        return;
      }
      // 적은 값은 기억해요 (다음에 다시 받을 때 그대로)
      const cur = normAdmin(state.site.admin);
      if (cur.owner !== owner || cur.repo !== repo || cur.siteUrl !== siteUrl || !cur.enabled) {
        setAdmin('관리자 화면 보관함 적기', (a) => { a.owner = owner; a.repo = repo; a.siteUrl = siteUrl; a.enabled = true; });
      }
      adminBtn.disabled = true;
      adminBtn.textContent = '준비 중…';
      const adm = normAdmin(state.site.admin);
      const adminConfig = {
        owner: adm.owner,
        repo: adm.repo,
        branch: adm.branch || 'main',
        siteUrl: adm.siteUrl,
        siteName: siteTitle(),
        iconColor: (state.site.theme && (state.site.theme.dark || state.site.theme.point)) || ''
      };
      try {
        const adminFiles = await window.HometeoAdminTemplate.makeAdminFiles(adminConfig);
        const adminZip = window.HometeoZip.make(adminFiles);
        downloadBlob(adminZip, `${safeName(siteTitle())}_관리자_${today()}.zip`);
        adminDownloaded = true;
        // 사장님께 보낼 안내문 (열쇠는 넣지 않아요)
        const msg = wrap.querySelector('#exp-msg');
        if (msg) {
          msg.hidden = false;
          wrap.querySelector('#exp-msg-text').value = [
            `[${siteTitle()}] 홈페이지 관리자 화면 안내`,
            '',
            '관리자 화면 주소: (관리자 화면을 올린 뒤 생긴 주소를 적어 주세요)',
            siteUrl ? `우리 홈페이지: ${siteUrl}` : '',
            '',
            '1. 관리자 화면 주소를 열고, 따로 받은 ‘관리자 열쇠’와 이 기기에서 쓸 비밀번호를 넣어요.',
            '2. 전화번호 · 주소는 첫 화면의 ‘가게 기본 정보’에서 한 번만 고치면 홈페이지 전체가 바뀌어요.',
            '3. 글 · 사진은 메뉴에서 페이지를 고르면 고칠 칸이 나와요.',
            '4. 다 고치면 맨 아래 ‘사이트에 반영하기’를 눌러요. 1~2분 뒤 홈페이지에 보여요.',
            '',
            '모르는 건 관리자 화면 맨 위 ‘도움말’을 눌러 보세요.'
          ].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
        }
        const b = wrap.querySelector('#badge-dl-admin');
        if (b) b.hidden = false;
        checkAllDone();
      } catch (err) {
        if (err && err.message === 'FILE_PROTOCOL_NOT_SUPPORTED') {
          showToast('관리자 화면 내보내기는 인터넷 주소에서 연 홈터에서 할 수 있어요 (예: Render 주소)');
        } else {
          showToast('관리자 화면 압축파일을 만드는 중 문제가 생겼어요.');
        }
      } finally {
        adminBtn.disabled = false;
        adminBtn.textContent = '② 관리자 화면 받기';
      }
    }
  });
}

async function downloadSite(skipCheck, withAdmin) {
  finishEdit(true);
  if (!state.blocks.length && !state.site.pages.some((pg) => pg.blocks.length)) { showToast('페이지가 비어 있어요. 블록을 먼저 놓아주세요.'); return; }
  if (skipCheck !== true) {
    pendingDownloadAction = () => downloadSite(true, withAdmin);
    if (!openCheck(true)) return;
  }
  pendingDownloadAction = null;

  // 내려받기 창 하나로: ① 홈페이지 · ② (골라서) 사장님용 관리자 화면
  if (withAdmin !== 'direct') {
    openAdminExportModal(!!withAdmin);
  } else {
    // 기존 단독 내려받기: 홈페이지 ZIP 바로 내려받기
    const zip = generateSiteZip();
    downloadBlob(zip, `${safeName(siteTitle())}_홈페이지_${today()}.zip`);
    const kb = zip.size / 1024;
    showToast(`홈페이지를 내려받았어요 · ${kb >= 1024 ? (kb / 1024).toFixed(1) + 'MB' : Math.max(1, Math.round(kb)) + 'KB'}`);
    if (!afterSeen()) setTimeout(() => openAfter(true), 300);
  }
}
