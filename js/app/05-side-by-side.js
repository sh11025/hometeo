/*
 * 홈터 · 편집 화면 동작 (5/12) — PC와 휴대폰 편집기 나란히
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// ---------- PC와 휴대폰 나란히 고치기 ----------
//   오른쪽 칸에 홈터 편집기를 하나 더 열어요(index.html?pane=phone · 휴대폰 화면 상태).
//   두 편집기는 메시지로 이어져요:
//     PC → 휴대폰  ht-load   : 지금 사이트 · 페이지 · 고른 블록 (사진은 새로 생긴 것만)
//     휴대폰 → PC  ht-change : 휴대폰에서 고친 사이트 → PC가 되돌리기 기록에 한 칸 남기고 받아요
//                  ht-select · ht-undo · ht-redo
//   되돌리기 기록 · 자동 저장 · 설정 칸은 PC 쪽 하나만 써요. '나란히'를 끄면 휴대폰 편집기는 닫아요.
var phoneSide = document.getElementById('phone-side');   // var: 처음 그리기 전에도 안전하게
var phoneTimer = null, paneSentAssets = new Set(), paneLastJson = '';
const PANE = new URLSearchParams(location.search).get('pane') === 'phone';
const paneFrame = () => (phoneSide && phoneSide.querySelector('iframe'));
function schedulePhone() {
  if (PANE || !state.sideBySide || !phoneSide) return;
  clearTimeout(phoneTimer);
  phoneTimer = setTimeout(paneSync, 120);
}
// 새로 생긴 사진만 골라 보내요 (사진은 크니까)
function newAssets(sent) {
  const out = {};
  Object.keys(state.assets).forEach((k) => { if (!sent.has(k) && state.assets[k]) { out[k] = state.assets[k]; sent.add(k); } });
  return out;
}
function paneSync(force) {
  const fr = paneFrame();
  if (!fr || !fr.contentWindow || !state.sideBySide) return;
  syncOut();
  const json = JSON.stringify(state.site);
  if (!force && json === paneLastJson) { paneSelect(); return; }
  paneLastJson = json;
  fr.contentWindow.postMessage({ type: 'ht-load', site: state.site, pageId: state.pageId, selectedId: state.selectedId, assets: newAssets(paneSentAssets) }, '*');
}
function paneSelect() {
  const fr = paneFrame();
  if (fr && fr.contentWindow && state.sideBySide) fr.contentWindow.postMessage({ type: 'ht-select', id: state.selectedId, pageId: state.pageId }, '*');
}
function openPane(on) {
  if (!phoneSide) return;
  const fr = paneFrame();
  if (on && !fr.getAttribute('src')) { paneSentAssets = new Set(); paneLastJson = ''; fr.src = location.pathname + '?pane=phone'; }
  if (!on && fr.getAttribute('src')) { fr.src = 'about:blank'; fr.removeAttribute('src'); }   // 끄면 휴대폰 편집기를 닫아요
  requestAnimationFrame(fitPane);
}
// 화면이 좁으면 휴대폰 편집기를 통째로 줄여서 보여줘요
const PANE_W = 470;
function fitPane() {
  if (!phoneSide || phoneSide.hidden) return;
  const shell = phoneSide.querySelector('.phone-shell');
  const fr = paneFrame();
  const w = shell.clientWidth, h = shell.clientHeight;
  const k = Math.min(1, w / PANE_W);
  fr.style.width = PANE_W + 'px';
  fr.style.height = Math.round(h / k) + 'px';
  fr.style.transform = `scale(${k})`;
  const note = phoneSide.querySelector('.pane-zoom');
  if (note) note.textContent = k < 0.99 ? `${Math.round(k * 100)}%로 줄여 보여요` : '';
}
window.addEventListener('resize', () => { clearTimeout(fitPane.t); fitPane.t = setTimeout(fitPane, 100); });
if (phoneSide && !PANE) {
  window.addEventListener('message', (e) => {
    const fr = paneFrame();
    const d = e.data;
    if (!fr || e.source !== fr.contentWindow || !d || typeof d.type !== 'string') return;
    if (d.type === 'ht-ready') { paneSentAssets = new Set(); paneLastJson = ''; paneSync(true); return; }
    if (d.type === 'ht-change') {
      finishEdit(true);
      undoStack.record(snapshot(), '휴대폰에서 · ' + (d.label || '고치기'));
      Object.assign(state.assets, d.assets || {});
      Object.keys(d.assets || {}).forEach((k) => paneSentAssets.add(k));
      state.site = d.site;
      if (d.pageId && state.site.pages.some((pg) => pg.id === d.pageId)) state.pageId = d.pageId;
      paneLastJson = JSON.stringify(d.site);
      syncIn();
      render();
      renderDrawer();
      scheduleSave();
      return;
    }
    if (d.type === 'ht-select') {
      if (d.id && findBlock(d.id)) {
        if (inspTab !== 'more' && state.selectedId !== d.id) { inspTab = 'more'; }
        select(d.id);
        const el = els.paper.querySelector(`.blk[data-id="${d.id}"]`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else if (!d.id) select(null);
      return;
    }
    if (d.type === 'ht-undo') { undo(); return; }
    if (d.type === 'ht-redo') { redo(); return; }
    if (d.type === 'ht-typing') { mirrorTyping(d); return; }
  });
  // 혹시 놓친 게 있어도 1.5초마다 한 번 더 맞춰요 (바뀐 게 없으면 아무것도 안 보내요)
  setInterval(() => { if (state.sideBySide && !editing) paneSync(); }, 1500);
  phoneSide.addEventListener('click', (e) => { if (e.target.closest('[data-phone-close]')) setDevice('pc'); });
}
// 글자를 고치는 동안에도 다른 쪽 화면 글자가 따라 바뀌어요 (저장은 고치기를 마칠 때 한 번)
function mirrorTyping(d) {
  if (editing && editing.blockId === d.id && editing.key === d.key) return;
  const el = els.paper.querySelector(`.blk[data-id="${d.id}"] [data-edit="${CSS.escape(d.key)}"]`);
  if (el) el.innerText = d.text;
}
els.paper.addEventListener('input', () => {
  if (!editing || !(PANE || state.sideBySide)) return;
  const msg = { type: 'ht-typing', id: editing.blockId, key: editing.key, text: editing.el.innerText };
  if (PANE) window.parent.postMessage(msg, '*');
  else { const fr = paneFrame(); if (fr && fr.contentWindow) fr.contentWindow.postMessage(msg, '*'); }
});
// 다른 쪽 화면을 누르면 이쪽에서 고치던 글자를 마무리해요
window.addEventListener('blur', () => { if (editing && (PANE || state.sideBySide)) finishEdit(true); });

// ---- 휴대폰 편집기 쪽 (index.html?pane=phone) ----
let paneQuiet = false;   // PC에서 받은 내용으로 그리는 동안엔 다시 보내지 않아요
let paneLabel = '';
function paneSend() {
  if (!PANE || paneQuiet || !window.parent || window.parent === window) return;
  syncOut();
  const json = JSON.stringify(state.site);
  if (json === paneLastJson) return;
  paneLastJson = json;
  window.parent.postMessage({ type: 'ht-change', label: paneLabel, site: state.site, pageId: state.pageId, assets: newAssets(paneSentAssets) }, '*');
}
if (PANE) {
  document.body.classList.add('is-pane');
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (e.source !== window.parent || !d) return;
    if (d.type === 'ht-load') {
      if (editing) finishEdit(true);
      paneQuiet = true;
      Object.assign(state.assets, d.assets || {});
      Object.keys(d.assets || {}).forEach((k) => paneSentAssets.add(k));
      const y = els.stage.scrollTop;
      const samePage = state.pageId === d.pageId;
      state.site = d.site;
      state.pageId = state.site.pages.some((pg) => pg.id === d.pageId) ? d.pageId : state.site.home;
      state.view = state.view || {};
      syncIn();
      state.selectedId = d.selectedId && findIndex(d.selectedId) >= 0 ? d.selectedId : null;
      paneLastJson = JSON.stringify(state.site);
      render();
      if (samePage) els.stage.scrollTop = y;
      paneQuiet = false;
    }
    if (d.type === 'ht-typing') { mirrorTyping(d); return; }
    if (d.type === 'ht-select') {
      if (d.pageId && d.pageId !== state.pageId) return;
      const id = d.id && findIndex(d.id) >= 0 ? d.id : null;
      if (id === state.selectedId) return;
      state.selectedId = id;
      els.paper.querySelectorAll('.blk').forEach((el) => el.classList.toggle('is-selected', el.dataset.id === id));
      const el = id && els.paper.querySelector(`.blk[data-id="${id}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

// 사이트 색 · 글꼴을 편집 화면에 적용 (페이지 상자에 CSS 변수 + 글꼴 파일 불러오기)
let themeKey = '';
function applyTheme() {
  const th = state.site.theme;
  const key = JSON.stringify(th) + '|' + (state.site.fonts || []).map((f) => f.id).join();
  if (key === themeKey) return;
  themeKey = key;
  useFonts();
  // 내가 올린 글꼴 (@font-face)
  let st = document.getElementById('ht-fonts');
  if (!st) { st = document.createElement('style'); st.id = 'ht-fonts'; document.head.appendChild(st); }
  st.textContent = fontFaceFor((f) => state.assets[f.asset] || '');
  window.HometeoTheme.vars(th).split(';').forEach((kv) => {
    const i = kv.indexOf(':');
    els.paper.style.setProperty(kv.slice(0, i), kv.slice(i + 1));
  });
  window.HometeoTheme.fontUrls(th).forEach((url) => {
    if (document.querySelector(`link[data-font="${CSS.escape(url)}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = url; l.dataset.font = url;
    document.head.appendChild(l);
  });
}

// 카드 슬라이드: 한 번에 보이는 수(휴대폰 · 좁은 블록에서는 1장)에 맞춰 위치 · 점 · 화살표를 맞춰요
function trackInfo(sl, b) {
  const rows = Number(b.props.rows) === 2 ? 2 : 1;
  const cols = Math.ceil(b.props.cards.length / rows);
  const vp = sl.querySelector('.b-cards-viewport');
  const card = sl.querySelector('.b-card');
  const per = vp && card ? Math.max(1, Math.round(vp.clientWidth / Math.max(1, card.offsetWidth))) : 1;
  const last = Math.max(0, cols - per);
  // 보고 있는 카드(view)가 들어 있는 칸이 보이게
  return { per, last, rows, pos: Math.min(Math.floor((state.view[b.id] || 0) / rows), last) };
}
function syncTracks() {
  els.paper.querySelectorAll('.blk [data-slider="track"]').forEach((sl) => {
    const b = findBlock(sl.closest('.blk').dataset.id);
    if (!b) return;
    const t = trackInfo(sl, b);
    sl.style.setProperty('--pos', t.pos);
    const media = sl.querySelector('.b-card-media');
    if (media) sl.style.setProperty('--arrow-y', Math.max(0, media.offsetHeight / 2 - 21) + 'px');
    sl.classList.toggle('is-static', t.last === 0);
    sl.querySelectorAll('.b-slider-dots button').forEach((d, i) => { d.hidden = i > t.last; d.classList.toggle('is-active', i === t.pos); });
  });
}
