/*
 * 홈터 · 편집 화면 동작 (6/12) — 오른쪽 설정 칸 (블록 설정 · 접기 · 모양 복사 · 본문 블록 디자인)
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// ---------- 오른쪽 설정 ----------
// 내용(자주 바꾸는 글·사진·메뉴) · 모양(크기·높이·여백·색) · 더보기(휴대폰 너비, 보이기 등 가끔 쓰는 것)
// 칸 묶음 제목을 누르면 접히고, 접은 것과 고른 탭은 이 브라우저에 기억해요
const TABS = [['content', '내용', 'Content'], ['look', '모양', 'Style'], ['more', '더보기', 'More']];
const TAB_KEY = 'hometeo.inspTab';
const FOLD_KEY = 'hometeo.folded';
let inspTab = (() => { try { return localStorage.getItem(TAB_KEY) || 'content'; } catch (e) { return 'content'; } })();
let folded = (() => { try { return JSON.parse(localStorage.getItem(FOLD_KEY) || '{}') || {}; } catch (e) { return {}; } })();
function setInspTab(t) {
  inspTab = t;
  try { localStorage.setItem(TAB_KEY, t); } catch (e) { /* 기억 못 해도 괜찮아요 */ }
  renderInspector();
}
const foldKey = (scope, sec) => {
  const t = sec.querySelector(':scope > .field-title');
  if (!t) return null;
  const c = t.cloneNode(true);
  c.querySelectorAll('small, .en').forEach((x) => x.remove());
  return scope + ':' + c.textContent.replace(/\d+번째/, 'N번째').trim();
};
// 처음 쓰는 사람에게는 어려운 칸: 처음엔 접어 두고 '자세히' 표시 (전문 용어 함께 보기를 켜면 펼쳐요)
const ADV_TITLES = ['크기', '여백', '휴대폰 너비', '휴대폰 따로 맞추기', '보이기', '블록 사이 간격', '색 조합 찾기', '색 직접 고르기', '로그인 연결 (개발자용)'];
function toggleFold(sec) {
  const key = sec.dataset.fold;
  if (!key) return;
  const on = !sec.classList.contains('is-folded');
  sec.classList.toggle('is-folded', on);
  folded[key] = on ? 1 : 0;   // 0 = 직접 펼침 (자세히 칸도 다음부터 펼쳐 둬요)
  try { localStorage.setItem(FOLD_KEY, JSON.stringify(folded)); } catch (e) { /* 괜찮아요 */ }
}
function applyFolds(root, scope) {
  root.querySelectorAll(':scope > .field').forEach((sec) => {
    const key = foldKey(scope, sec);
    if (!key) return;
    sec.dataset.fold = key;
    const title = key.slice(key.indexOf(':') + 1);
    const adv = ADV_TITLES.includes(title);
    sec.classList.toggle('is-adv', adv);
    sec.classList.toggle('is-folded', key in folded ? !!folded[key] : (adv && !getShowEn()));
    const t = sec.querySelector(':scope > .field-title');
    t.setAttribute('role', 'button');
    t.setAttribute('tabindex', '0');
    t.title = '눌러서 접기 · 펼치기';
  });
}

// ---------- 설정 칸 접기 ----------
//   화면이 좁으면(1280px 미만) 아무것도 고르지 않았을 때 저절로 접혀요. 블록을 고르면 다시 펼쳐져요.
//   넓은 화면에서도 접기 버튼으로 접을 수 있어요 (기억해요)
const INSP_KEY = 'hometeo.inspCollapsed';
let inspUserCollapsed = (() => { try { return localStorage.getItem(INSP_KEY) === '1'; } catch (e) { return false; } })();
let inspManualOpen = false;
function updateInspCollapse() {
  const busy = !!(state.selectedId || picker || sidePanel);
  const narrow = window.innerWidth < 1280;
  const collapsed = (inspUserCollapsed || narrow) && !busy && !inspManualOpen;
  document.body.classList.toggle('insp-collapsed', collapsed);
  const btn = document.getElementById('btn-insp');
  if (btn) { btn.title = collapsed ? '설정 칸 펼치기' : '설정 칸 접기'; btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true'); }
}
function toggleInsp() {
  if (document.body.classList.contains('insp-collapsed')) { inspManualOpen = true; inspUserCollapsed = false; }
  else {
    inspManualOpen = false; inspUserCollapsed = true;
    finishEdit(true);
    picker = null; sidePanel = null;
    if (state.selectedId) { state.selectedId = null; els.paper.querySelectorAll('.blk.is-selected').forEach((el) => el.classList.remove('is-selected')); }
    renderPageBar();
  }
  try { localStorage.setItem(INSP_KEY, inspUserCollapsed ? '1' : '0'); } catch (e) { /* 괜찮아요 */ }
  renderInspector();
}
window.addEventListener('resize', () => updateInspCollapse());
// 목록 항목마다 '잠시 숨기기 · 품절' 버튼 (지우지 않고 손님 화면에서만 감춰요)
const SOLD_LISTS = { plans: 1, items: 1, cards: 1, members: 1 };
function decorateItemTools(box, b) {
  box.querySelectorAll('.item-tools').forEach((tools) => {
    const rm = tools.querySelector('[data-action="list-remove"]');
    if (!rm) return;
    const path = rm.dataset.path, i = Number(rm.dataset.index);
    const list = getPath(b.props, path);
    const it = Array.isArray(list) ? list[i] : null;
    if (!it || typeof it !== 'object' || path.includes('.') || !['main', 'banner'].includes(zoneOf(b))) return;
    const canSold = SOLD_LISTS[path] && ('title' in it || 'name' in it) && !['board', 'files', 'steps', 'timeline', 'hours', 'faq'].includes(b.type);
    const card = tools.closest('.list-card, .list-row');
    if (card && it._hide) card.classList.add('is-item-hidden');
    tools.insertAdjacentHTML('afterbegin',
      (canSold ? `<button class="icon-btn flag-btn${it._sold ? ' is-on' : ''}" data-action="item-flag" data-flag="_sold" data-path="${path}" data-index="${i}" title="${it._sold ? '품절 표시 빼기' : '품절 표시'}">품절</button>` : '') +
      `<button class="icon-btn flag-btn${it._hide ? ' is-on' : ''}" data-action="item-flag" data-flag="_hide" data-path="${path}" data-index="${i}" title="${it._hide ? '다시 보이기' : '지우지 않고 손님 화면에서만 잠시 감추기'}">${it._hide ? '숨김' : '보임'}</button>`);
  });
}
function renderInspector() { renderInspectorBody(); updateInspCollapse(); if (tabNav) setTimeout(restoreTabFocus, 0); }
// Tab으로 다음 칸 넘어가기: 칸을 고치면 설정 칸이 새로 그려져서 커서가 사라지는데, 그 다음 칸을 다시 찾아 커서를 옮겨줘요
let tabNav = null;   // { key, dir, at }
const FOCUSABLE = 'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])';
function fieldKey(el) {
  if (el.id) return '#' + CSS.escape(el.id);
  for (const a of ['data-field', 'data-info', 'data-biz', 'data-page-desc', 'data-page-field', 'data-path']) {
    if (el.hasAttribute(a)) return `${el.tagName.toLowerCase()}[${a}="${CSS.escape(el.getAttribute(a))}"]`;
  }
  return null;
}
els.inspector.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !e.target.matches(FOCUSABLE)) return;
  const key = fieldKey(e.target);
  tabNav = key ? { key, dir: e.shiftKey ? -1 : 1, at: Date.now() } : null;
  setTimeout(() => { if (tabNav && Date.now() - tabNav.at > 400) tabNav = null; }, 450);
});
function restoreTabFocus() {
  const t = tabNav; tabNav = null;
  if (!t || Date.now() - t.at > 600) return;
  const act = document.activeElement;
  if (act && act !== document.body && els.inspector.contains(act) && act.isConnected) return;   // 브라우저가 이미 옮겼어요
  const list = [...els.inspector.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent);
  const cur = els.inspector.querySelector(t.key);
  const i = list.indexOf(cur);
  const next = i >= 0 ? list[i + t.dir] : null;
  if (next) { next.focus(); if (next.select && next.type !== 'checkbox' && next.type !== 'date') next.select(); }
}
function renderInspectorBody() {
  if (sidePanel === 'theme') { els.inspector.innerHTML = themeHtml(); return; }
  if (sidePanel === 'info') { els.inspector.innerHTML = infoHtml(); showPhotoSizes(); return; }
  if (sidePanel === 'admin') { els.inspector.innerHTML = adminHtml(); return; }
  if (picker && state.mode === 'edit') {
    els.inspector.innerHTML = pickerHtml();
    els.inspector.querySelectorAll('.mini [data-edit]').forEach((el) => el.removeAttribute('data-edit'));
    return;
  }
  const i = findIndex(state.selectedId);
  if (i < 0) {
    const gap = Number(state.page.gap) || 0;
    els.inspector.innerHTML = `
      <div class="insp-empty">
        <p>${state.mode === 'map' ? '지도에서 페이지 카드를 누르면<br>그 페이지의 설정이 여기 보여요.' : '페이지에서 블록을 누르면<br>여기서 고칠 수 있어요.'}</p>
      </div>
      ${pageSettingsHtml()}
      <section class="field">
        <h3 class="field-title">블록 사이 간격${enTag('Gap')}</h3>
        <h4 class="field-sub first">나란한 블록 사이 간격</h4>
        <div class="segmented" style="grid-template-columns:repeat(4,1fr)">
          ${[[0, '붙이기'], [16, '좁게'], [32, '보통'], [48, '넓게']].map(([v, l]) => `<button class="${gap === v ? 'is-on' : ''}" data-page-gap="${v}">${l}</button>`).join('')}
        </div>
        <p class="field-help">본문에서 옆으로 나란히 놓인 블록 사이를 얼마나 띄울지 정해요. 휴대폰에서는 붙여서 보여요.</p>
      </section>
      <section class="field">
        <h3 class="field-title">도구 설정${enTag('Settings')}</h3>
        <label class="check"><input type="checkbox" data-tool="showEn" ${getShowEn() ? 'checked' : ''}> 전문 용어 함께 보기 <span class="en-sample">개발자 · 디자이너용</span></label>
        <p class="field-help">켜면 블록의 영문 이름(Header, Main Banner …)과 전문 용어(anchor, tel:, CMYK 색 번호 …)를 함께 보여주고, ‘자세히’ 칸을 처음부터 펼쳐요. 처음 쓰는 분은 꺼 두는 걸 추천해요.</p>
      </section>
      <div class="insp-tips">
        <h3>알아두면 편해요</h3>
        <ul>
          <li>${ICON.edit} 글자를 <b>두 번 누르면</b> 바로 고쳐요</li>
          <li><kbd>Enter</kbd> 고치기 끝 · <kbd>Esc</kbd> 취소</li>
          <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> 되돌리기</li>
          <li><kbd>Ctrl</kbd> + <kbd>Y</kbd> 다시하기</li>
          <li><kbd>Delete</kbd> 고른 블록 지우기</li>
          <li><kbd>Ctrl</kbd> + <kbd>D</kbd> 고른 블록 복사</li>
          <li><span>본문의 <b>+</b> 를 누르면 여기서 블록을 골라요</span></li>
          <li><span>왼쪽 위 <b>홈터</b>를 누르면 파일 메뉴</span></li>
        </ul>
      </div>`;
    applyFolds(els.inspector, 'page');
    return;
  }
  const b = state.blocks[i];
  const def = BLOCKS[b.type];
  const z = zoneOf(b);
  const inFlow = isFlow(b);
  const mains = mainBlocks();
  const mi = mains.indexOf(b);
  const where = !inFlow ? (b.type === 'quick' ? '화면 위에 떠 있어요' : '벽에 고정돼 있어요')
    : z === 'main' ? `본문 · 위에서 ${mi + 1}번째 / ${mains.length}개` : `${zoneName(z)} 영역`;
  // 모든 칸 묶음을 모은 다음, 고른 탭의 것만 보여줘요
  const all = [
    inFlow && (z === 'main' || z === 'banner') ? sizeFieldHtml(b, i) : '',
    inFlow && z === 'main' ? spaceFieldHtml(b) : '',
    inFlow && z === 'main' && b.type !== 'aside' && b.type !== 'spacer' ? mainLookHtml(b) : '',
    def.inspector ? def.inspector(b.props, helpers, { id: b.id }) : '',
    inFlow && (z === 'main' || z === 'banner') ? moreFieldHtml(b) : ''
  ].join('');
  const box = document.createElement('div');
  box.innerHTML = all;
  decorateItemTools(box, b);
  const has = (t) => !!box.querySelector(`:scope > [data-tab="${t}"]`);
  const tabs = TABS.filter(([t]) => has(t));
  const cur = tabs.some(([t]) => t === inspTab) ? inspTab : (tabs[0] ? tabs[0][0] : 'content');
  box.querySelectorAll(':scope > [data-tab]').forEach((el) => { if (el.dataset.tab !== cur) el.remove(); });
  els.inspector.innerHTML = `
    <div class="insp-head">
      <span class="insp-thumb">${def.thumb}</span>
      <div>
        <strong>${escapeHtml(def.name)}${enTag(def.en)}</strong>
        <small>${where}</small>
      </div>
    </div>
    ${tabs.length > 1 ? `<div class="insp-tabs" role="tablist">${tabs.map(([t, l, en]) => `<button class="insp-tab${t === cur ? ' is-on' : ''}" role="tab" aria-selected="${t === cur}" data-insp-tab="${t}">${l}<small class="en">${en}</small></button>`).join('')}</div>` : ''}
    ${cur === 'content' ? `<p class="insp-hint">${ICON.edit} 페이지의 글자를 두 번 누르면 바로 고칠 수 있어요.</p>` : ''}
    <div class="insp-body" data-tab="${cur}"></div>
    <div class="insp-foot">
      ${mi >= 0 ? `<button class="btn" data-insp="up" ${mi === 0 ? 'disabled' : ''} title="위로 올리기">${ICON.up} 위로</button>
      <button class="btn" data-insp="down" ${mi === mains.length - 1 ? 'disabled' : ''} title="아래로 내리기">${ICON.down} 아래로</button>` : ''}
      ${mi >= 0 ? `<button class="btn" data-insp="copy" title="Ctrl + D">${ICON.copy} 복사</button>` : ''}
      ${z === 'main' && b.type !== 'aside' ? `<div class="style-clip">
        <button class="btn small" data-insp="style-copy" title="글 · 사진은 빼고 디자인만 기억해요">모양 복사</button>
        <button class="btn small" data-insp="style-paste" ${styleClip ? '' : 'disabled'} title="${styleClip ? `‘${escapeHtml(BLOCKS[styleClip.type].name)}’ 모양을 붙여요` : '먼저 다른 블록에서 ‘모양 복사’를 눌러요'}">모양 붙이기</button>
        <button class="btn small" data-insp="style-all" title="이 블록 모양을 이 페이지의 모든 본문 블록에">이 페이지 전체에</button>
      </div>` : ''}
      ${z === 'main' && b.type !== 'aside' ? `<button class="btn" data-insp="replace" title="같은 자리에서 다른 블록으로 바꿔요">⇄ 다른 블록으로 바꾸기</button>` : ''}
      ${z === 'main' || z === 'banner' || b.type === 'notice' ? `<button class="btn${b.props._off ? ' is-on' : ''}" data-insp="off" title="지우지 않고 손님 화면에서만 잠시 감춰요">${b.props._off ? '다시 보이기' : '잠시 숨기기'}</button>` : ''}
      <button class="btn btn-danger" data-insp="delete">${ICON.trash} 지우기</button>
      ${!isShared(b) && state.site.pages.length > 1 ? `<select class="input small insp-copy-to" data-copy-to aria-label="다른 페이지로 복사">
        <option value="">다른 페이지로 복사…</option>
        ${state.site.pages.filter((pg) => pg.id !== state.pageId).map((pg) => `<option value="${pg.id}">${escapeHtml(pg.name)}</option>`).join('')}
      </select>` : ''}
    </div>`;
  const body = els.inspector.querySelector('.insp-body');
  while (box.firstChild) body.appendChild(box.firstChild);
  applyFolds(body, b.type);
  showPhotoSizes();
}

// 넣은 사진의 실제 크기를 권장 크기 옆에 보여줘요 (너무 작으면 알려줘요)
function showPhotoSizes() {
  els.inspector.querySelectorAll('.photo-preview img').forEach((img) => {
    const rec = img.parentElement.nextElementSibling;
    if (!rec || !rec.classList.contains('photo-rec')) return;
    const put = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w) return;
      const small = w < Number(rec.dataset.recW) * 0.6;
      rec.querySelector('[data-photo-real]').textContent = ` · 지금 사진 ${w} × ${h}${small ? ' — 작아서 흐리게 보일 수 있어요' : ''}`;
      rec.classList.toggle('is-small', small);
    };
    if (img.complete) put(); else img.addEventListener('load', put, { once: true });
  });
}

// 높이 고르기 (크기 칸 안에서 너비와 함께)
const HEIGHTS_PX = [['', '자동'], [320, '낮게'], [480, '보통'], [640, '높게'], ['full', '화면 가득']];
function heightHtml(b, first) {
  if (b.type === 'spacer') return '';   // 빈 칸은 자기 높이 칸에서 정해요
  // 휴대폰 보기 + '휴대폰은 따로 맞추기'면 휴대폰 높이(minhM)를 따로 정해요
  if (state.device === 'phone' && b.phoneOwn) {
    const m = b.minhM;
    const label = m === 'full' ? '화면 가득' : m === 'auto' ? '내용에 맞게' : m ? m + 'px 이상' : 'PC 높이의 4분의 3';
    const opts = [['auto', '자동'], [240, '낮게'], [360, '보통'], [480, '높게'], ['full', '화면 가득']];
    return `<h4 class="field-sub${first ? ' first' : ''}">휴대폰 높이 <b class="own-tag">따로</b> <small>${label}</small></h4>
      <div class="segmented five">
        ${opts.map(([v, l]) => `<button class="${String(m || '') === String(v) ? 'is-on' : ''}" data-bfield="minhM" data-value="${v}">${l}</button>`).join('')}
      </div>`;
  }
  const label = b.minh === 'full' ? '화면 가득' : b.minh ? b.minh + 'px 이상' : '내용에 맞게';
  return `<h4 class="field-sub${first ? ' first' : ''}">높이${state.device === 'phone' ? ' <small>(PC와 같이 · 휴대폰은 4분의 3)</small>' : ''} <small>${label}</small></h4>
    <div class="segmented five">
      ${HEIGHTS_PX.map(([v, l]) => `<button class="${String(b.minh || '') === String(v) ? 'is-on' : ''}" data-bfield="minh" data-value="${v}">${l}</button>`).join('')}
    </div>`;
}
const phoneSeg = (b) => `<div class="segmented two">
    <button class="${b.mspan === 6 ? '' : 'is-on'}" data-mspan="12">전체</button>
    <button class="${b.mspan === 6 ? 'is-on' : ''}" data-mspan="6">절반</button>
  </div>`;

// 모양 탭: 크기 = 너비 · 줄 안 위치 · 높이 (메인 배너는 높이만)
function sizeFieldHtml(b, i) {
  if (zoneOf(b) === 'banner') {
    return `<section class="field" data-tab="look">
      <h3 class="field-title">크기${enTag('Size')}${state.device === 'phone' ? ' <small>휴대폰</small>' : ''}</h3>
      ${heightHtml(b, true)}
      <p class="field-help">메인 배너는 언제나 한 줄 전체예요. 아래쪽 손잡이를 끌어도 높이가 바뀌어요. 휴대폰에서는 정한 높이의 4분의 3으로 보여요.</p>
    </section>`;
  }
  if (state.device === 'phone') {
    return `<section class="field" data-tab="look">
      <h3 class="field-title">크기${enTag('Size')} <small>휴대폰</small></h3>
      <h4 class="field-sub first">너비 <small>${b.mspan === 6 ? '절반' : '전체'}</small></h4>
      ${phoneSeg(b)}
      ${heightHtml(b)}
      <p class="field-help">절반으로 한 블록끼리는 휴대폰에서 두 개씩 나란히 놓여요. 휴대폰에서는 정한 높이의 4분의 3으로 보여요.</p>
    </section>`;
  }
  const places = layout(state.blocks);
  const row = places[i].row;
  const alone = places.filter((pl) => pl.row === row).length === 1;
  const offset = b.offset || 0;
  const where = offset === 0 ? 'left' : offset === COLUMNS - b.span ? 'right' : 'center';
  const cells = Array.from({ length: COLUMNS }, (_, k) => {
    const c = k + 1;
    return `<i class="${c >= b.col && c < b.col + b.span ? 'on' : ''}"></i>`;
  }).join('');
  const presets = [[12, '전체'], [8, '2/3'], [6, '절반'], [4, '1/3']];
  return `<section class="field" data-tab="look">
    <h3 class="field-title">크기${enTag('Size')}</h3>
    <h4 class="field-sub first">너비 <small>12칸 중 ${b.span}칸</small></h4>
    <div class="col-meter" aria-hidden="true">${cells}</div>
    <div class="segmented four">
      ${presets.map(([n, label]) => `<button class="${b.span === n ? 'is-on' : ''}" data-width="${n}">${label}</button>`).join('')}
    </div>
    ${alone && b.span < COLUMNS ? `
    <h4 class="field-sub">줄 안 위치</h4>
    <div class="segmented three">
      <button class="${where === 'left' ? 'is-on' : ''}" data-place="left">왼쪽</button>
      <button class="${where === 'center' ? 'is-on' : ''}" data-place="center">가운데</button>
      <button class="${where === 'right' ? 'is-on' : ''}" data-place="right">오른쪽</button>
    </div>` : ''}
    ${heightHtml(b)}
    <p class="field-help">블록 오른쪽 끝 손잡이로 너비, 아래쪽 손잡이로 높이를 바꿀 수도 있어요. 이웃한 블록끼리 너비를 합쳐 12칸 이하면 옆에 나란히 붙어요.</p>
  </section>`;
}

// 모양 탭: 위 · 아래 여백
const PADS = [['', '기본'], ['none', '없음'], ['s', '좁게'], ['m', '보통'], ['l', '넓게']];
const bSeg = (key, cur, opts) => `<div class="segmented" style="grid-template-columns:repeat(${opts.length},1fr)">
    ${opts.map(([v, l]) => `<button class="${String(cur || '') === String(v) ? 'is-on' : ''}" data-bfield="${key}" data-value="${v}">${l}</button>`).join('')}
  </div>`;
function spaceFieldHtml(b) {
  return `<section class="field" data-tab="look">
    <h3 class="field-title">여백${enTag('Spacing')}</h3>
    <h4 class="field-sub first">위 여백</h4>
    ${bSeg('pt', b.pt || '', PADS)}
    <h4 class="field-sub">아래 여백</h4>
    ${bSeg('pb', b.pb || '', PADS)}
    <h4 class="field-sub">양옆 여백 <small>(왼쪽 · 오른쪽)</small></h4>
    ${bSeg('px', b.px || '', PADS)}
    <p class="field-help">휴대폰에서는 조금 줄여서 보여요.</p>
  </section>`;
}

// 더보기 탭: 휴대폰 너비 · 보이기
// ---------- 모양 복사 · 붙이기 (글 · 사진은 그대로, 디자인만) ----------
let styleClip = null;   // { type, props: {…}, fields: {…} }
const STYLE_ANY = ['skin', 'headAlign', 'bg', 'align'];                  // 어떤 블록끼리든 옮겨요
const STYLE_SAME = ['look', 'layout', 'theme', 'ratio', 'cols', 'perView', 'gray', 'size', 'tone', 'padded', 'imagePos', 'showHead', 'arrows', 'dots', 'rows'];   // 같은 종류끼리만
const STYLE_FIELDS = ['pt', 'pb', 'px', 'minh'];
function styleOf(b) {
  const props = {};
  STYLE_ANY.concat(STYLE_SAME).forEach((k) => { if (k in b.props) props[k] = clone(b.props[k]); });
  const fields = {};
  STYLE_FIELDS.forEach((k) => { if (b[k] != null) fields[k] = b[k]; });
  return { type: b.type, props, fields };
}
function pasteStyle(b, clip) {
  if (!b || !clip) return;
  const has = (k) => k in BLOCKS[b.type].defaults() || k === 'skin' || k === 'headAlign';
  Object.keys(clip.props).forEach((k) => {
    if (clip.type !== b.type && !STYLE_ANY.includes(k)) return;
    if (!has(k)) return;
    b.props[k] = clone(clip.props[k]);
  });
  ['skin', 'headAlign'].forEach((k) => { if (!(k in clip.props)) delete b.props[k]; });
  ['pt', 'pb', 'px'].forEach((k) => { if (k in clip.fields) b[k] = clip.fields[k]; else delete b[k]; });
  if (clip.type === b.type && 'minh' in clip.fields) b.minh = clip.fields.minh;
}

// ---------- 사이트 분위기 (사이트 꾸미기 맨 위) ----------
function applyMood(id) {
  const M = window.HOMETEO_MOODS;
  const m = M && M.list.find((x) => x.id === id);
  if (!m) return;
  useFonts();
  changeSite(`분위기: ${m.name}`, () => {
    state.site.theme = window.HometeoTheme.normalize(clone(m.theme));
    (state.site.shared || []).concat(...state.site.pages.map((pg) => pg.blocks || [])).forEach((b) => M.applyToBlock(b, m));
  });
  showToast(`‘${m.name}’ 분위기로 바꿨어요. 글과 사진은 그대로예요.`, '되돌리기', undo);
}
function moodHtml() {
  const M = window.HOMETEO_MOODS;
  if (!M) return '';
  return `<section class="field">
      <h3 class="field-title">분위기 한 번에 바꾸기${enTag('Mood')}</h3>
      <div class="mood-list">${M.list.map((m) => `<button class="mood-card" data-mood="${m.id}">${themeMini(m.theme)}<b>${escapeHtml(m.name)}</b><small>${escapeHtml(m.feel)}</small></button>`).join('')}</div>
      <p class="field-help">색 · 글꼴 · 메뉴 · 배너 · 본문 블록 · 맨 아래 디자인이 한 세트로 바뀌어요. 글과 사진은 그대로이고, 되돌리기 한 번이면 돌아와요.</p>
    </section>`;
}

// 본문 블록 공통 디자인: 블록 테두리 · 제목 위치 (모든 본문 블록이 같은 고르기를 써요)
function mainLookHtml(b) {
  const ui = helpers.ui, p = b.props;
  return ui.section('블록 디자인', ui.looks('skin', p.skin || '', [
      ['', '기본', '<span class="lp-ban pad" style="background:#fff"><i class="lp-m w2"></i></span>'],
      ['card', '그림자 카드', '<span class="lp-ban pad" style="background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.18);margin:0 6px"><i class="lp-m w2"></i></span>'],
      ['soft', '연한 상자', '<span class="lp-ban soft" style="margin:0 6px;justify-content:center;padding:0"><i class="lp-m w2"></i></span>'],
      ['line', '위아래 선', '<span class="lp-ban pad" style="background:#fff;border-top:2px solid #bbb;border-bottom:2px solid #bbb;border-radius:0"><i class="lp-m w2"></i></span>'],
      ['dark', '어두운 바탕', '<span class="lp-ban dark"><i class="lp-m w2"></i></span>']
    ]) + (/data-edit="title"/.test(RENDER(BLOCKS[b.type], p, helpers, { id: b.id })) ? ui.sub('제목 위치') + ui.seg('headAlign', p.headAlign || 'center', [['center', '가운데'], ['left', '왼쪽']]) : ''),
    '블록 바깥 모양이에요. 안쪽 모양은 아래에서 골라요.', 'look');
}
function moreFieldHtml(b) {
  const own = `
    <section class="field" data-tab="more">
      <h3 class="field-title">휴대폰 따로 맞추기${enTag('Mobile')}</h3>
      <label class="check"><input type="checkbox" data-phone-own ${b.phoneOwn ? 'checked' : ''}> 휴대폰은 따로 맞추기</label>
      <p class="field-help">${b.phoneOwn
        ? '켜져 있어요. 휴대폰 보기에서 높이를 바꾸거나, 사진의 ‘위치 맞추기’에서 휴대폰 모습을 따로 움직일 수 있어요.' + (b.type === 'banner' ? ' 메인 배너는 휴대폰용 사진(세로 사진)도 따로 넣을 수 있어요.' : '')
        : '처음엔 PC와 같이 보여요. 켜면 휴대폰에서의 높이와 사진 위치(메인 배너는 휴대폰용 사진까지)를 따로 정할 수 있어요.'}</p>
    </section>`;
  const phoneWidth = isMain(b) && state.device !== 'phone' ? `
    <section class="field" data-tab="more">
      <h3 class="field-title">휴대폰 너비${enTag('Mobile width')}</h3>
      ${phoneSeg(b)}
      <p class="field-help">PC 너비와 따로 정해요. 절반으로 한 블록끼리는 휴대폰에서 두 개씩 나란히 놓여요.</p>
    </section>` : '';
  return own + phoneWidth + `
    <section class="field" data-tab="more">
      <h3 class="field-title">보이기${enTag('Visibility')}</h3>
      ${bSeg('hide', b.hide || '', [['', '모두'], ['phone', 'PC에서만'], ['pc', '휴대폰에서만']])}
      <p class="field-help">PC나 휴대폰 한쪽에서만 보이게 할 수 있어요. 숨긴 블록은 편집 화면에서 흐리게 보여요.</p>
    </section>`;
}
