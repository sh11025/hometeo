/*
 * 홈터 · 편집 화면 동작 (7/12) — 페이지 막대 · 페이지 견본 · 사이트 지도 · 알림
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// ---------- 페이지 막대 (가운데 위) ----------
const HOME_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/></svg>';
const MAP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="4" width="6" height="5" rx="1"/><rect x="9" y="15" width="6" height="5" rx="1"/><path d="M9 6.5h6M6 9v3.5h12V9M12 12.5V15"/></svg>';
const fileOf = (pg) => (pg.id === state.site.home ? 'index' : pg.file) + '.html';
function renderPageBar() {
  const cur = state.pageId;
  els.pageBar.innerHTML = `
    <div class="pb-pages" role="tablist" aria-label="페이지">
      ${state.site.pages.map((pg) => `<button class="pb-page${pg.id === cur ? ' is-on' : ''}" data-page="${pg.id}" role="tab" aria-selected="${pg.id === cur}" title="${escapeHtml(fileOf(pg))}">
        ${pg.id === state.site.home ? HOME_ICON : ''}<span>${escapeHtml(pg.name)}</span></button>`).join('')}
      <button class="pb-add" data-page-act="add" title="새 페이지 만들기">${ICON.plus} 새 페이지</button>
    </div>
    <button class="pb-theme${sidePanel === 'info' ? ' is-on' : ''}" data-page-act="info" title="검색 · 카톡 공유에 보이는 이름 · 소개 · 사진">${INFO_ICON} 사이트 정보${enTag('Info')}</button>
    <button class="pb-theme${sidePanel === 'theme' ? ' is-on' : ''}" data-page-act="theme" title="사이트 전체 색 · 글꼴">${PALETTE_ICON} 사이트 꾸미기${enTag('Theme')}</button>
    <button class="pb-map${state.mode === 'map' ? ' is-on' : ''}" data-page-act="map" title="페이지끼리 어떻게 이어지는지 한눈에 봐요">${MAP_ICON} ${state.mode === 'map' ? '페이지 꾸미기로' : '사이트 지도'}${enTag(state.mode === 'map' ? 'Editor' : 'Site map')}</button>`;
}

function addPage(opts) {
  const o = opts || {};
  let made = null;
  changeSite('새 페이지', () => {
    const n = state.site.pages.length + 1;
    const last = state.site.pages[state.site.pages.length - 1];
    made = {
      id: newId('p'), name: o.name || `새 페이지 ${n - 1}`, file: uniqueFile(o.file || `page-${n}`),
      blocks: o.blocks || [], gap: 0,
      x: o.x != null ? o.x : (last ? last.x + 280 : 120), y: o.y != null ? o.y : (last ? last.y : 200)
    };
    state.site.pages.push(made);
    if (!o.stay) state.pageId = made.id;
  });
  if (!o.stay) { state.selectedId = null; render(); }
  showToast(`‘${made.name}’ 페이지를 만들었어요. 맨 위 메뉴 · 맨 아래 정보 · 퀵메뉴는 모든 페이지가 함께 써요.`, '되돌리기', undo);
  return made;
}
// 로그인 페이지 견본: 로그인 칸 하나가 들어간 페이지. 맨 위 메뉴 윗줄의 '로그인' 링크가 비어 있으면 이 페이지로 이어요
function addLoginPage() {
  const last = state.site.pages[state.site.pages.length - 1];
  const block = makeBlock('login');
  block.pt = 'l'; block.pb = 'l';
  const made = addPage({ name: '로그인', file: 'login', blocks: [block], stay: state.mode === 'map', x: last.x + 280, y: last.y });
  syncOut();
  const header = state.site.shared.find((b) => b.type === 'header');
  const slot = header && (header.props.topLinks || []).findIndex((t) => /로그인/.test(t.label) && !t.link);
  if (header && slot >= 0) {
    changeSite('로그인 링크 잇기', () => { state.site.shared.find((b) => b.type === 'header').props.topLinks[slot].link = 'page:' + made.id; });
    showToast('로그인 페이지를 만들고, 맨 위 메뉴 윗줄의 ‘로그인’과 이었어요. 실제 로그인 연결은 내려받은 뒤에 해요.', '되돌리기', undo);
  } else {
    showToast('로그인 페이지를 만들었어요. 실제 로그인 연결은 내려받은 뒤에 해요 (로그인 칸 설정 → 더보기).', '되돌리기', undo);
  }
}

// =========================================================
// 페이지 견본 · 사이트 묶음 견본 (js/page-templates.js)
// =========================================================
const PAGE_TPLS = window.HOMETEO_PAGE_TEMPLATES || [];
const SITE_SETS = window.HOMETEO_SITE_SETS || [];
const SET_HOMES = window.HOMETEO_SET_HOMES || {};
const PT_ART = {
  blank: '<i class="pa-blank">+</i>',
  about: '<i class="pa-row"><b class="img"></b><b class="lines"></b></i><i class="pa-cards"><b></b><b></b><b></b></i>',
  price: '<i class="pa-cards tall"><b></b><b class="hi"></b><b></b></i>',
  map: '<i class="pa-map"><b></b></i><i class="pa-lines"></i>',
  list: '<i class="pa-list"><b></b><b></b><b></b><b></b></i>',
  form: '<i class="pa-form"><b></b><b></b><b class="big"></b><b class="btn"></b></i>',
  login: '<i class="pa-form narrow"><b></b><b></b><b class="btn"></b></i>',
  doc: '<i class="pa-doc"><b></b><b></b><b></b><b></b><b></b></i>',
  404: '<i class="pa-404">404</i>',
  team: '<i class="pa-team"><b></b><b></b><b></b></i><i class="pa-lines"></i>',
  calendar: '<i class="pa-cal"><b></b><b></b><b></b></i>'
};
// 사업자 정보 (맨 아래 정보) — 견본 글의 {상호} 같은 자리를 채워요
function bizInfo() {
  const f = state.site.shared.find((b) => b.type === 'footer');
  const z = (f && f.props.biz) || {};
  const d = new Date();
  return {
    상호: z.company || (f && f.props.name) || siteName() || '○○', 대표: z.owner || '○○○', 전화: z.phone || '000-0000-0000',
    이메일: z.email || '○○@○○.com', 주소: z.address || '○○시 ○○구', 오늘: `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  };
}
// 견본 블록 만들기: {상호} 채우기 · 'page:@home' → 첫 페이지
function specBlocks(spec, homeId) {
  const biz = bizInfo();
  const fill = (v) => (typeof v === 'string' ? v.replace(/\{(상호|대표|전화|이메일|주소|오늘)\}/g, (m, k) => biz[k]).replace(/^page:@home$/, 'page:' + homeId)
    : Array.isArray(v) ? v.map(fill) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) : v);
  const blocks = templateBlocks({ blocks: spec.map((b) => Object.assign({}, b, { props: fill(b.props || {}) })) });
  spec.forEach((b, i) => { if (b.pt) blocks[i].pt = b.pt; if (b.pb) blocks[i].pb = b.pb; });
  return blocks;
}
// 이름이 같은 메뉴 · 링크가 비어 있으면 그 페이지와 이어요 (몇 곳 이었는지 돌려줘요)
const sameLabel = (a, b) => String(a || '').replace(/\s+/g, '') === String(b || '').replace(/\s+/g, '');
function autoConnect(site, pageId, labels) {
  let n = 0;
  const empty = (v) => !v || v === '#';
  const visit = (item, key) => {
    if (item && labels.some((l) => sameLabel(l, item.label)) && empty(item[key])) { item[key] = 'page:' + pageId; n++; }
  };
  site.shared.forEach((b) => {
    const p = b.props;
    if (b.type === 'header') {
      (p.menu || []).forEach((m) => { visit(m, 'link'); (m.children || []).forEach((c) => visit(c, 'link')); });
      (p.topLinks || []).forEach((t) => visit(t, 'link'));
      if (p.showCta && labels.some((l) => sameLabel(l, p.cta)) && empty(p.ctaLink)) { p.ctaLink = 'page:' + pageId; n++; }
    }
    if (b.type === 'footer') {
      (p.bottomLinks || []).forEach((l) => visit(l, 'url'));
      (p.columns || []).forEach((c) => (c.links || []).forEach((l) => visit(l, 'url')));
    }
  });
  // 로그인 칸의 '회원가입' → 회원가입 페이지
  if (labels.some((l) => sameLabel(l, '회원가입'))) {
    site.pages.forEach((pg) => pg.blocks.forEach((b) => { if (b.type === 'login' && empty(b.props.joinLink)) { b.props.joinLink = 'page:' + pageId; n++; } }));
  }
  return n;
}
function addTemplatePage(id) {
  const tpl = PAGE_TPLS.find((x) => x.id === id);
  if (!tpl) return;
  syncOut();
  const stay = state.mode === 'map';
  const last = state.site.pages[state.site.pages.length - 1];
  let made = null, linked = 0;
  changeSite(`페이지 견본 · ${tpl.name}`, () => {
    made = {
      id: newId('p'), name: tpl.name, file: uniqueFile(tpl.file), blocks: specBlocks(tpl.blocks, state.site.home), gap: 0,
      x: last ? last.x + 280 : 120, y: last ? last.y : 200
    };
    state.site.pages.push(made);
    linked = autoConnect(state.site, made.id, tpl.links || []);
    if (!stay) state.pageId = made.id;
  });
  if (!stay) { state.selectedId = null; render(); els.stage.scrollTop = 0; }
  const header = state.site.shared.find((b) => b.type === 'header');
  const extra = id === 'login' || id === 'signup' ? ' 실제 연결은 내려받은 뒤에 해요.' : ['privacy', 'terms'].includes(id) ? ' 사업자 정보로 채웠어요. 우리에게 맞게 꼭 고쳐 주세요.' : id === '404' ? ' 파일 이름이 404.html 이라 주소를 잘못 치면 저절로 보여요 (Netlify · GitHub Pages).' : '';
  if (linked) showToast(`‘${made.name}’ 페이지를 만들고, 이름이 같은 메뉴 · 링크 ${linked}곳과 이었어요.${extra}`, '되돌리기', undo);
  else if (header && id !== '404') showToast(`‘${made.name}’ 페이지를 만들었어요.${extra}`, '맨 위 메뉴에 넣기', () => {
    changeSite('맨 위 메뉴에 넣기', () => { state.site.shared.find((b) => b.type === 'header').props.menu.push({ label: made.name, link: 'page:' + made.id, children: [] }); });
    showToast(`맨 위 메뉴에 ‘${made.name}’을 넣었어요.`, '되돌리기', undo);
  });
  else showToast(`‘${made.name}’ 페이지를 만들었어요.${extra}`, '되돌리기', undo);
}
// 사이트 묶음: 첫 페이지 + 여러 페이지 + 맨 위 메뉴를 한 번에 (되돌리기 한 번이면 원래대로)
function applySiteSet(id) {
  const set = SITE_SETS.find((x) => x.id === id);
  if (!set) return;
  pkSet('kind', { shop: 'shop', clinic: 'clinic', academy: 'academy', company: 'company', office: 'office', portfolio: 'folio', event: 'event' }[id] || 'all');
  const base = set.base ? TEMPLATES.find((t) => t.id === set.base) : SET_HOMES[set.home];
  if (!base) return;
  state.view = {};
  state.selectedId = null;
  changeSite(`여러 페이지 견본 · ${set.name}`, () => {
    const site = makeSite(templateBlocks(base), 0);
    if (base.theme) site.theme = window.HometeoTheme.normalize(base.theme);
    site.info = Object.assign(newInfo(), state.site.info || {});   // 사이트 정보는 그대로 둬요
    state.site = site;
    const home = site.pages[0];
    home.x = 80; home.y = 260;
    const header = site.shared.find((b) => b.type === 'header');
    const menu = [{ label: '홈', link: 'page:' + home.id, children: [] }];
    set.pages.forEach((sp, i) => {
      const tpl = PAGE_TPLS.find((x) => x.id === sp.tpl);
      if (!tpl) return;
      const pg = { id: newId('p'), name: sp.name || tpl.name, file: uniqueFile(tpl.file), blocks: specBlocks(tpl.blocks, home.id), gap: 0, x: 400 + (i % 3) * 280, y: 120 + Math.floor(i / 3) * 300 };
      site.pages.push(pg);
      if (sp.menu) menu.push({ label: sp.menu, link: 'page:' + pg.id, children: [] });
      autoConnect(site, pg.id, [sp.name || tpl.name].concat(tpl.links || []));
    });
    if (header) { header.props.menu = menu; if (header.props.showCta) { const c = menu.find((m) => /예약|문의|상담|신청/.test(m.label)); if (c && (!header.props.ctaLink || header.props.ctaLink === '#')) header.props.ctaLink = c.link; } }
    state.pageId = home.id;
  });
  els.stage.scrollTop = 0;
  showToast(`‘${set.name}’ 여러 페이지 견본으로 시작했어요 · 페이지 ${state.site.pages.length}개, 맨 위 메뉴까지 이어 두었어요.`, '되돌리기', undo);
}
function openPageTemplates(tab) {
  finishEdit(true);
  let cur = tab || 'page';
  const pageCards = [`<button class="ptpl-card" data-ptpl="blank"><span class="ptpl-art">${PT_ART.blank}</span><strong>빈 페이지</strong><small>블록을 하나씩 직접 쌓아요</small></button>`]
    .concat(PAGE_TPLS.map((t) => `<button class="ptpl-card" data-ptpl="${t.id}"><span class="ptpl-art">${PT_ART[t.art] || ''}</span><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.desc)}</small></button>`)).join('');
  const setCards = SITE_SETS.map((t) => {
    const names = ['첫 페이지'].concat(t.pages.map((sp) => sp.name || (PAGE_TPLS.find((x) => x.id === sp.tpl) || {}).name));
    return `<button class="pset-card" data-pset="${t.id}">
      <span class="pset-map">${names.map((n, i) => `<i class="${i ? '' : 'home'}">${escapeHtml(n)}</i>`).join('')}</span>
      <strong>${escapeHtml(t.name)} <em>${names.length}페이지</em></strong><small>${escapeHtml(t.desc)}</small></button>`;
  }).join('');
  const el = openModal(`
    <div class="modal wide ptpl" role="dialog" aria-modal="true" aria-labelledby="ptpl-title">
      <div class="modal-head">
        <h2 id="ptpl-title">페이지 더하기</h2>
        <button class="icon-btn" data-close aria-label="닫기">${ICON.x}</button>
      </div>
      <div class="segmented ptpl-tabs" role="tablist">
        <button data-ptab="page" role="tab">페이지 하나 더하기</button>
        <button data-ptab="set" role="tab">여러 페이지로 시작</button>
      </div>
      <div data-pane="page"><p class="modal-help">고른 페이지가 블록이 채워진 채로 생겨요. 이름이 같은 메뉴(예: ‘오시는 길’)가 비어 있으면 저절로 이어요.</p><div class="ptpl-grid">${pageCards}</div></div>
      <div data-pane="set"><p class="modal-help">여러 페이지와 맨 위 메뉴가 이어진 채로 새로 시작해요. 지금 만든 페이지는 바뀌지만 <b>되돌리기</b>로 돌아올 수 있어요.</p><div class="pset-grid">${setCards}</div></div>
    </div>`);
  const paint = () => {
    el.querySelectorAll('[data-ptab]').forEach((b) => { b.classList.toggle('is-on', b.dataset.ptab === cur); b.setAttribute('aria-selected', b.dataset.ptab === cur ? 'true' : 'false'); });
    el.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== cur; });
  };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const tb = e.target.closest('[data-ptab]');
    if (tb) { cur = tb.dataset.ptab; paint(); return; }
    const pc = e.target.closest('[data-ptpl]');
    if (pc) {
      closeModal();
      if (pc.dataset.ptpl === 'blank') {
        const stay = state.mode === 'map';
        const last = state.site.pages[state.site.pages.length - 1];
        addPage(stay ? { stay: true, x: last.x + 280, y: last.y } : {});
      } else addTemplatePage(pc.dataset.ptpl);
      return;
    }
    const ps = e.target.closest('[data-pset]');
    if (ps) { closeModal(); applySiteSet(ps.dataset.pset); }
  });
  paint();
}

function deletePage(id) {
  const pg = state.site.pages.find((x) => x.id === id);
  if (!pg) return;
  if (state.site.pages.length === 1) { showToast('페이지가 하나뿐이라 지울 수 없어요.'); return; }
  changeSite(`‘${pg.name}’ 페이지 지우기`, () => {
    state.site.pages = state.site.pages.filter((x) => x.id !== id);
    if (state.site.home === id) state.site.home = state.site.pages[0].id;
    if (state.pageId === id) state.pageId = state.site.home;
  });
  showToast(`‘${pg.name}’ 페이지를 지웠어요. 이 페이지로 가던 링크는 첫 페이지로 가요.`, '되돌리기', undo);
}
function duplicatePage(id) {
  const pg = state.site.pages.find((x) => x.id === id);
  if (!pg) return;
  syncOut();
  const blocks = clone(pg.blocks).map((b) => Object.assign(b, { id: newId('b') }));
  addPage({ name: `${pg.name} 복사본`, file: `${pg.file === 'index' ? 'page' : pg.file}-copy`, blocks, x: pg.x + 40, y: pg.y + 200 });
}
function setPageField(id, key, value) {
  const pg = state.site.pages.find((x) => x.id === id);
  if (!pg) return;
  if (key === 'home') { if (state.site.home === id) return; changeSite('첫 페이지 바꾸기', () => { state.site.home = id; }); showToast(`‘${pg.name}’이 첫 페이지(index.html)가 됐어요.`); return; }
  if (key === 'name') {
    value = String(value || '').trim().slice(0, 30);
    if (!value || value === pg.name) { renderInspector(); return; }
    changeSite('페이지 이름 바꾸기', () => { state.site.pages.find((x) => x.id === id).name = value; });
    return;
  }
  if (key === 'file') {
    const f = uniqueFile(value, id);
    if (!fileSlug(value)) { showToast('파일 이름은 영어 소문자, 숫자, - 로 적어주세요. 예: menu, about-us'); renderInspector(); return; }
    if (f === pg.file) { renderInspector(); return; }
    changeSite('파일 이름 바꾸기', () => { state.site.pages.find((x) => x.id === id).file = f; });
    if (f !== fileSlug(value)) showToast(`같은 이름이 있어서 ‘${f}.html’로 정했어요.`);
  }
}
// 오른쪽 설정: 지금 페이지
function pageSettingsHtml() {
  const pg = curPage();
  const home = pg.id === state.site.home;
  return `<section class="field page-settings">
    <h3 class="field-title">이 페이지${enTag('Page')}</h3>
    <label class="input-label" for="pg-name">페이지 이름</label>
    <input id="pg-name" class="input" type="text" data-page-field="name" value="${escapeHtml(pg.name)}" placeholder="예: 메뉴, 오시는 길">
    <label class="input-label" for="pg-file">파일 이름 <small>(내려받을 때)</small></label>
    ${home ? `<p class="pg-file-fixed">index.html <small>첫 페이지는 언제나 index.html 이에요</small></p>`
      : `<div class="pg-file"><input id="pg-file" class="input" type="text" data-page-field="file" value="${escapeHtml(pg.file)}" placeholder="예: menu"><span>.html</span></div>`}
    <div class="insp-actions two">
      ${home ? '' : `<button class="btn" data-page-act="home">${HOME_ICON} 첫 페이지로</button>`}
      <button class="btn" data-page-act="dup">페이지 복사</button>
      ${state.site.pages.length > 1 ? `<button class="btn btn-danger" data-page-act="del">${ICON.trash} 페이지 지우기</button>` : ''}
    </div>
    <p class="field-help">맨 위 메뉴 · 맨 아래 정보 · 퀵메뉴는 모든 페이지가 함께 써요. 한 곳에서 고치면 모든 페이지가 바뀌어요.</p>
  </section>`;
}

function renderHistoryButtons() {
  els.undo.disabled = !undoStack.canUndo();
  els.redo.disabled = !undoStack.canRedo();
}

function render() {
  renderPageBar();
  if (state.mode === 'map') renderMap(); else renderPage();
  renderInspector();
  renderHistoryButtons();
  if (adminPreviewWin && !adminPreviewWin.closed) { clearTimeout(adminPreviewTimer); adminPreviewTimer = setTimeout(sendAdminPreview, 700); }
}
let adminPreviewTimer = null;

// 새로 놓인 블록이 '착' 붙는 느낌
function snapIn(id) {
  const el = els.paper.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  el.classList.add('snap-in');
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  setTimeout(() => el.classList.remove('snap-in'), 500);
}

// =========================================================
// 사이트 지도: 페이지 카드와 연결선
// =========================================================
//   실선  : 한 페이지 안의 버튼 · 링크가 다른 페이지로 가요
//   점선  : 맨 위 메뉴 · 맨 아래 정보(모든 페이지에 있어요)가 그 페이지로 가요
//   노란색: 어디에서도 연결되지 않은 페이지 (찾아갈 방법이 없어요)
const CARD_W = 220, CARD_H = 196;
const NOTE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/></svg>';
// 스티커 메모: site.notes = [{ id, x, y, text, color }] — 작업 파일에만 저장되고 홈페이지에는 안 들어가요
function addNote(x, y) {
  const scroll = els.map.querySelector('#map-scroll');
  const nx = x != null ? x : (scroll ? scroll.scrollLeft + 60 : 60);
  const ny = y != null ? y : (scroll ? scroll.scrollTop + 60 : 60);
  let id;
  changeSite('메모 붙이기', () => {
    id = newId('n');
    state.site.notes = (state.site.notes || []).concat([{ id, x: Math.round(nx), y: Math.round(ny), text: '', color: 'yellow' }]);
  });
  const ta = els.map.querySelector(`[data-note="${id}"] textarea`);
  if (ta) ta.focus();
}
function noteSet(id, fn, label) {
  changeSite(label, () => { const n = (state.site.notes || []).find((x) => x.id === id); if (n) fn(n); });
}
function pageLinks(value, out) {   // 블록 내용 속 'page:…' 링크를 모두 찾아요
  if (typeof value === 'string') { const m = /^page:([^#]+)/.exec(value); if (m) out.add(m[1]); }
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => pageLinks(v, out));
  return out;
}
// 페이지 → 페이지 링크를 모아요. 같은 곳으로 가는 링크가 여러 개면 한 선에 개수(×2)와 블록 이름을 붙여요
function pageLinkList(value, out) {
  if (typeof value === 'string') { const m = /^page:([^#]+)/.exec(value); if (m) out.push(m[1]); }
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => pageLinkList(v, out));
  return out;
}
function mapEdges() {
  syncOut();
  const ids = new Set(state.site.pages.map((pg) => pg.id));
  const byKey = {};
  const add = (from, to, kind, label) => {
    const k = from + '>' + to;
    const e = byKey[k] || (byKey[k] = { from, to, kind, count: 0, labels: [] });
    e.count++;
    e.labels.push(label);
  };
  state.site.pages.forEach((pg) => {
    const main = anchorList(pg.blocks);
    pg.blocks.forEach((b) => pageLinkList(b.props, []).forEach((to) => {
      if (to === pg.id || !ids.has(to)) return;   // 같은 페이지 안의 이동은 선을 긋지 않아요
      const a = main.find((x) => x.id === b.id);
      add(pg.id, to, 'page', a ? a.label : BLOCKS[b.type].name);
    }));
  });
  state.site.shared.forEach((b) => pageLinkList(b.props, []).forEach((to) => { if (ids.has(to)) add('menu', to, 'menu', BLOCKS[b.type].name); }));
  return Object.values(byKey);
}
function mapThumb(pg) {
  const list = tidy([...state.site.shared.filter((b) => isFlow(b)), ...(pg.id === state.pageId ? state.blocks.filter((b) => !isShared(b)) : pg.blocks)])
    .filter((b) => isFlow(b) && zoneOf(b) !== 'footer').slice(0, 4);
  const cells = list.map((b) => {
    const L = window.HometeoExport.cellLayout(b, null);
    return `<div class="ib-cell" style="${L.style}">${RENDER(BLOCKS[b.type], b.props, helpers, { id: 'map-' + b.id })}</div>`;
  }).join('');
  return `<div class="map-thumb"><div class="mini-inner ib-page"><div class="ib-grid">${cells || '<div class="map-empty-page" style="grid-column:1/-1">빈 페이지</div>'}</div></div></div>`;
}
let mapMenuPos = null;   // 공통 메뉴 표시의 자리 (보기 방식이라 저장하지 않아요)
function renderMap() {
  syncOut();
  const edges = mapEdges();
  const incoming = new Set(edges.map((e) => e.to));
  const pages = state.site.pages;
  const minX = Math.min(...pages.map((p) => p.x));
  const menu = mapMenuPos || { x: Math.max(20, minX), y: 40 };
  const notes = state.site.notes || [];
  const W = Math.max(1400, ...pages.map((p) => p.x + CARD_W + 200), ...notes.map((n) => n.x + 400));
  const H = Math.max(900, ...pages.map((p) => p.y + CARD_H + 200), ...notes.map((n) => n.y + 360));
  const pos = (id) => {
    if (id === 'menu') return { x: menu.x, y: menu.y, w: 260, h: 56 };
    const p = pages.find((x) => x.id === id);
    return { x: p.x, y: p.y, w: CARD_W, h: CARD_H };
  };
  // 선: 보내는 쪽 오른쪽(메뉴는 아래쪽) → 받는 쪽 왼쪽 위
  const pname = (id) => (id === 'menu' ? '맨 위 메뉴 · 맨 아래 정보' : (pages.find((x) => x.id === id) || {}).name);
  const paths = edges.map((e) => {
    const a = pos(e.from), b = pos(e.to);
    const x1 = e.kind === 'menu' ? a.x + a.w / 2 : a.x + a.w, y1 = e.kind === 'menu' ? a.y + a.h : a.y + 60;
    const x2 = e.kind === 'menu' ? b.x + b.w / 2 : b.x, y2 = e.kind === 'menu' ? b.y : b.y + 60;
    const c1 = e.kind === 'menu' ? [x1, (y1 + y2) / 2] : [x1 + 70, y1];
    const c2 = e.kind === 'menu' ? [x2, (y1 + y2) / 2] : [x2 - 70, y2];
    const ey = e.kind === 'menu' ? y2 - 8 : y2, ex = e.kind === 'menu' ? x2 : x2 - 8;
    const d = `M${x1},${y1} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${ex},${ey}`;
    // 곡선의 가운데 (개수 표시 자리)
    const mx = (x1 + 3 * c1[0] + 3 * c2[0] + ex) / 8, my = (y1 + 3 * c1[1] + 3 * c2[1] + ey) / 8;
    const tip = `${pname(e.from)} → ${pname(e.to)} · 링크 ${e.count}개\n` + e.labels.map((l) => '· ' + l).join('\n');
    return `<g class="map-edge ${e.kind}">
      <title>${escapeHtml(tip)}</title>
      <path class="map-hit" d="${d}"/>
      <path class="map-line ${e.kind}" d="${d}" marker-end="url(#map-arrow-${e.kind})"/>
      ${e.count > 1 ? `<g class="map-count" transform="translate(${mx},${my})"><rect x="-15" y="-10" width="30" height="20" rx="10"/><text text-anchor="middle" dy="4">×${e.count}</text></g>` : ''}
    </g>`;
  }).join('');
  const hasMenu = state.site.shared.some((b) => b.type === 'header' || b.type === 'footer');
  els.map.innerHTML = `
    <div class="map-bar">
      <div>
        <h2>사이트 지도${enTag('Site map')}</h2>
        <p>카드를 끌어서 자리를 옮기고, 두 번 누르면 그 페이지를 꾸며요. 카드 오른쪽 <b class="map-dot-sample"></b> 를 다른 카드로 끌면 두 페이지를 이어요.</p>
      </div>
      <div class="map-bar-btns">
        <button class="btn" data-page-act="map">페이지 꾸미기로</button>
        <button class="btn" data-page-act="note" title="지도에 붙이는 메모 (홈페이지에는 안 들어가요)">${NOTE_ICON} 메모</button>
        <button class="btn" data-page-act="sets" title="여러 페이지를 한 번에, 메뉴까지 이어진 채로">${ICON.plus} 여러 페이지 견본</button>
        <button class="btn btn-primary" data-page-act="add-map" title="빈 페이지 · 페이지 견본">${ICON.plus} 새 페이지</button>
      </div>
    </div>
    <div class="map-legend">
      <span><i class="lg page"></i>페이지 안의 버튼 · 링크</span>
      <span><i class="lg menu"></i>맨 위 메뉴 · 맨 아래 정보</span>
      <span><i class="lg orphan"></i>연결 안 된 페이지</span>
    </div>
    <div class="map-scroll" id="map-scroll">
      <div class="map-canvas" style="width:${W}px;height:${H}px">
        <svg class="map-lines" width="${W}" height="${H}" aria-hidden="true">
          <defs>
            <marker id="map-arrow-page" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
            <marker id="map-arrow-menu" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
          </defs>
          ${paths}
          <path class="map-line temp" id="map-temp" d=""/>
        </svg>
        ${(state.site.notes || []).map((n) => `<div class="map-note c-${escapeHtml(n.color || 'yellow')}" data-note="${escapeHtml(n.id)}" style="left:${n.x}px;top:${n.y}px">
          <div class="map-note-bar" title="끌어서 옮기기">
            ${['yellow', 'pink', 'blue', 'green'].map((c) => `<button class="note-color c-${c}${(n.color || 'yellow') === c ? ' is-on' : ''}" data-note-color="${c}" title="색 바꾸기" aria-label="색 바꾸기"></button>`).join('')}
            <button class="note-del" data-note-del title="메모 지우기" aria-label="메모 지우기">${ICON.x}</button>
          </div>
          <textarea data-note-text placeholder="메모를 적어요" aria-label="메모">${escapeHtml(n.text || '')}</textarea>
        </div>`).join('')}

        ${(() => {
          const adm = normAdmin(state.site.admin);
          const ax = Number.isFinite(adm.x) ? adm.x : menu.x + 280;
          const ay = Number.isFinite(adm.y) ? adm.y : menu.y;
          return `<div class="map-card map-admin${sidePanel === 'admin' ? ' is-cur' : ''}" data-admin-card style="left:${ax}px;top:${ay}px" tabindex="0" title="누르면 관리자 화면 꾸미기를 열어요">
            <div class="map-admin-thumb">
              <span class="admin-lock-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
              <span class="admin-status-pill is-on">${escapeHtml(((ADM_UI() && ADM_UI().LAYOUTS.find((l) => l.id === (adm.ui && adm.ui.layout))) || { name: '관리자 화면' }).name)}</span>
            </div>
            <div class="map-info">
              <strong>🔒 관리자 화면</strong>
              <small>${adm.repo ? escapeHtml(adm.repo) : '사장님이 내용 고치는 화면'}</small>
            </div>
          </div>`;
        })()}
        ${hasMenu ? `<div class="map-menu" data-node="menu" style="left:${menu.x}px;top:${menu.y}px">
          <strong>맨 위 메뉴 · 맨 아래 정보</strong><small>모든 페이지에 들어 있어요</small>
        </div>` : ''}
        ${pages.map((pg) => {
          const home = pg.id === state.site.home;
          const orphan = !home && !incoming.has(pg.id);
          return `<div class="map-card${pg.id === state.pageId ? ' is-cur' : ''}${home ? ' is-home' : ''}${orphan ? ' is-orphan' : ''}" data-page="${pg.id}" style="left:${pg.x}px;top:${pg.y}px" tabindex="0" title="두 번 누르면 이 페이지를 꾸며요">
            ${mapThumb(pg)}
            <div class="map-info">
              <strong>${home ? HOME_ICON : ''}${escapeHtml(pg.name)}</strong>
              <small>${escapeHtml(fileOf(pg))}</small>
            </div>
            ${home ? '<span class="map-tag home">첫 페이지</span>' : orphan ? '<span class="map-tag orphan">연결 안 됨</span>' : ''}
            <button class="map-del" data-map-del="${pg.id}" ${home ? 'disabled title="첫 페이지는 지울 수 없어요. 다른 페이지를 첫 페이지로 정하면 지울 수 있어요"' : 'title="이 페이지 지우기"'} aria-label="페이지 지우기">${ICON.trash}</button>
            <button class="map-handle" data-handle="${pg.id}" title="끌어서 다른 페이지와 잇기" aria-label="다른 페이지와 잇기"></button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  els.map.querySelectorAll('[data-edit]').forEach((el) => el.removeAttribute('data-edit'));
}

function setMode(mode) {
  finishEdit(true);
  picker = null;
  sidePanel = null;
  state.mode = mode;
  document.body.classList.toggle('mode-map', mode === 'map');
  els.map.hidden = mode !== 'map';
  if (mode === 'map') state.selectedId = null;
  render();
}

// 지도에서 끌기: 카드 옮기기 · 잇기 · 공통 메뉴 표시 옮기기
function mapPointerDown(e) {
  if (e.button !== 0) return;
  const canvas = els.map.querySelector('.map-canvas');
  if (!canvas) return;
  const at = (ev) => { const r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  
  const adminCard = e.target.closest('[data-admin-card]');
  if (adminCard) {
    e.preventDefault();
    const adm = normAdmin(state.site.admin);
    const minX = Math.min(...state.site.pages.map((p) => p.x));
    const menuPos = mapMenuPos || { x: Math.max(20, minX), y: 40 };
    const startX = Number.isFinite(adm.x) ? adm.x : menuPos.x + 280;
    const startY = Number.isFinite(adm.y) ? adm.y : menuPos.y;
    const ox = e.clientX, oy = e.clientY;
    adminCard.classList.add('is-moving');
    let moved = false;
    const move = (ev) => {
      const dx = ev.clientX - ox, dy = ev.clientY - oy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      adminCard.style.left = `${Math.max(20, startX + dx)}px`;
      adminCard.style.top = `${Math.max(20, startY + dy)}px`;
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      adminCard.classList.remove('is-moving');
      if (moved) {
        const dx = ev.clientX - ox, dy = ev.clientY - oy;
        setAdmin('관리자 카드 옮기기', (a) => {
          a.x = Math.max(20, Math.round((startX + dx) / 10) * 10);
          a.y = Math.max(20, Math.round((startY + dy) / 10) * 10);
        });
      } else {
        openAdmin('design');
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return;
  }
  const handle = e.target.closest('[data-handle]');
  if (handle) {   // 잇기
    e.preventDefault();
    const from = state.site.pages.find((p) => p.id === handle.dataset.handle);
    const temp = els.map.querySelector('#map-temp');
    const x1 = from.x + CARD_W, y1 = from.y + 60;
    let target = null;
    const move = (ev) => {
      const p = at(ev);
      temp.setAttribute('d', `M${x1},${y1} C${x1 + 70},${y1} ${p.x - 70},${p.y} ${p.x},${p.y}`);
      const over = document.elementFromPoint(ev.clientX, ev.clientY);
      const card = over && over.closest('.map-card');
      target = card && card.dataset.page !== from.id ? card.dataset.page : null;
      els.map.querySelectorAll('.map-card.is-target').forEach((c) => c.classList.remove('is-target'));
      if (target) els.map.querySelector(`.map-card[data-page="${target}"]`).classList.add('is-target');
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      temp.setAttribute('d', '');
      els.map.querySelectorAll('.map-card.is-target').forEach((c) => c.classList.remove('is-target'));
      if (target) openConnectMenu(from.id, target, at(ev));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return;
  }
  if (e.target.closest('.map-connect, button, .btn, textarea')) return;
  const bar = e.target.closest('.map-note-bar');
  if (bar) {   // 메모 옮기기
    e.preventDefault();
    const el = bar.closest('[data-note]');
    const n = state.site.notes.find((x) => x.id === el.dataset.note);
    const st = at(e);
    let moved = false, nx = n.x, ny = n.y;
    const mv = (ev) => {
      const q = at(ev);
      if (!moved && Math.hypot(q.x - st.x, q.y - st.y) < 4) return;
      moved = true;
      nx = Math.max(0, Math.round(n.x + q.x - st.x)); ny = Math.max(0, Math.round(n.y + q.y - st.y));
      el.style.left = nx + 'px'; el.style.top = ny + 'px';
    };
    const upn = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', upn);
      if (moved) noteSet(n.id, (x) => { x.x = nx; x.y = ny; }, '메모 옮기기');
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', upn);
    return;
  }
  if (e.target.closest('.map-note')) return;
  const node = e.target.closest('.map-card, .map-menu');
  if (!node) { closeConnectMenu(); return; }
  e.preventDefault();
  const isMenu = node.classList.contains('map-menu');
  const pg = !isMenu && state.site.pages.find((p) => p.id === node.dataset.page);
  const start = at(e);
  const o = isMenu ? (mapMenuPos || { x: parseFloat(node.style.left), y: parseFloat(node.style.top) }) : { x: pg.x, y: pg.y };
  let moved = false, nx = o.x, ny = o.y;
  const move = (ev) => {
    const p = at(ev);
    if (!moved && Math.hypot(p.x - start.x, p.y - start.y) < 4) return;
    moved = true;
    node.classList.add('is-moving');
    nx = Math.max(0, Math.round((o.x + p.x - start.x) / 10) * 10);
    ny = Math.max(0, Math.round((o.y + p.y - start.y) / 10) * 10);
    node.style.left = nx + 'px';
    node.style.top = ny + 'px';
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    node.classList.remove('is-moving');
    if (!moved) {   // 누르기만 하면 그 페이지를 골라요 (오른쪽에 페이지 설정)
      if (pg && pg.id !== state.pageId) { syncOut(); state.pageId = pg.id; syncIn(); render(); }
      return;
    }
    if (isMenu) { mapMenuPos = { x: nx, y: ny }; renderMap(); return; }
    changeSite('페이지 자리 옮기기', () => { const p = state.site.pages.find((x) => x.id === pg.id); p.x = nx; p.y = ny; });
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

// 두 페이지를 이을 때: 맨 위 메뉴에 넣거나, 보내는 페이지에 버튼을 넣어요
let connectMenu = null;
function closeConnectMenu() { if (connectMenu) { connectMenu.remove(); connectMenu = null; } }
function openConnectMenu(fromId, toId, p) {
  closeConnectMenu();
  const from = state.site.pages.find((x) => x.id === fromId);
  const to = state.site.pages.find((x) => x.id === toId);
  const m = document.createElement('div');
  m.className = 'map-connect';
  m.style.left = p.x + 'px';
  m.style.top = p.y + 'px';
  m.innerHTML = `<strong>‘${escapeHtml(from.name)}’ → ‘${escapeHtml(to.name)}’ 잇기</strong>
    <button class="btn" data-connect="menu">맨 위 메뉴에 ‘${escapeHtml(to.name)}’ 넣기 <small>모든 페이지에서 갈 수 있어요</small></button>
    <button class="btn" data-connect="button">‘${escapeHtml(from.name)}’ 페이지에 버튼 넣기 <small>그 페이지 본문 맨 아래에</small></button>
    <button class="btn btn-ghost-plain" data-connect="cancel">그만두기</button>`;
  els.map.querySelector('.map-canvas').appendChild(m);
  connectMenu = m;
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-connect]');
    if (!b) return;
    closeConnectMenu();
    if (b.dataset.connect === 'menu') connectByMenu(to);
    if (b.dataset.connect === 'button') connectByButton(from, to);
  });
}
function connectByMenu(to) {
  syncOut();
  const header = state.site.shared.find((b) => b.type === 'header');
  if (header && header.props.menu.some((m) => m.link === 'page:' + to.id)) { showToast(`맨 위 메뉴에 이미 ‘${to.name}’이 있어요.`); return; }
  changeSite('맨 위 메뉴에 페이지 넣기', () => {
    let h = state.site.shared.find((b) => b.type === 'header');
    if (!h) { h = makeBlock('header'); h.props.menu = []; state.site.shared.unshift(h); }
    h.props.menu.push({ label: to.name, link: 'page:' + to.id, children: [] });
  });
  showToast(`맨 위 메뉴에 ‘${to.name}’을 넣었어요. 이름은 맨 위 메뉴 설정에서 바꿀 수 있어요.`, '되돌리기', undo);
}
function connectByButton(from, to) {
  changeSite('페이지에 버튼 넣기', () => {
    const pg = state.site.pages.find((x) => x.id === from.id);
    pg.blocks.push(makeBlock('text', { props: { align: 'center', eyebrow: '', title: to.name, body: `${to.name} 페이지에서 더 자세히 볼 수 있어요.`, showButton: true, button: `${to.name} 보러 가기`, link: 'page:' + to.id } }));
  });
  showToast(`‘${from.name}’ 페이지 맨 아래에 ‘${to.name}’으로 가는 버튼을 넣었어요.`, '되돌리기', undo);
}

// ---------- 알림 ----------
let toastTimer = null;
function showToast(message, actionLabel, action) {
  els.toast.innerHTML = `<span>${escapeHtml(message)}</span>` +
    (actionLabel ? `<button class="toast-btn">${escapeHtml(actionLabel)}</button>` : '');
  if (actionLabel) {
    els.toast.querySelector('.toast-btn').onclick = () => { hideToast(); action(); };
  }
  els.toast.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actionLabel ? 5000 : 2600);
}
function hideToast() { els.toast.classList.remove('is-show'); }
