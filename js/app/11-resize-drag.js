/*
 * 홈터 · 편집 화면 동작 (11/12) — 너비 · 높이 손잡이 · 끌어다 놓기
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// =========================================================
// 너비 조절 손잡이 (칸에 착 붙어요)
// =========================================================
// ---------- 높이 손잡이 (블록 아래쪽 가운데) : 40px씩 착 붙어요 ----------
const H_STEP = 40;
let lastHeightPress = { id: null, t: 0 };
function startHeightResize(e, id) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  // 손잡이를 빠르게 두 번 누르면 '내용에 맞게'로 돌아가요
  const now = Date.now();
  if (lastHeightPress.id === id && now - lastHeightPress.t < 450) {
    lastHeightPress = { id: null, t: 0 };
    if (findBlock(id).type === 'spacer') setProp(id, 'size', 80, '빈 칸 높이 바꾸기'); else resetHeight(id);
    return;
  }
  lastHeightPress = { id, t: now };
  finishEdit(true);
  select(id);
  const b = findBlock(id);
  const el = els.paper.querySelector(`.blk[data-id="${id}"]`);
  const isSpacer = b.type === 'spacer';
  const step = isSpacer ? 8 : H_STEP;
  const startY = e.clientY;
  const h0 = isSpacer ? (Number(b.props.size) || 80) : el.getBoundingClientRect().height;
  const phoneOwn = state.device === 'phone' && b.phoneOwn && !isSpacer;
  let val = isSpacer ? h0 : phoneOwn ? (Number(b.minhM) || 0) : (b.minh || 0);
  let moved = false;
  const tip = document.createElement('div');
  tip.className = 'size-tip';
  document.body.appendChild(tip);
  document.body.classList.add('is-hresizing');
  el.classList.add('is-resizing-blk');
  const move = (ev) => {
    if (Math.abs(ev.clientY - startY) > 3) moved = true;
    if (!moved) return;
    const raw = h0 + (ev.clientY - startY);
    val = Math.max(isSpacer ? 16 : H_STEP, Math.round(raw / step) * step);
    if (isSpacer) { val = Math.min(320, val); el.querySelector('.b-spacer').style.height = val + 'px'; }
    else el.style.setProperty(phoneOwn ? '--minh-phone' : '--minh', val + 'px');
    tip.textContent = `높이 ${val}px`;
    tip.style.transform = `translate(${ev.clientX + 14}px, ${ev.clientY - 34}px)`;
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    tip.remove();
    document.body.classList.remove('is-hresizing');
    el.classList.remove('is-resizing-blk');
    if (!moved) return;   // 누르기만 했으면 그대로 (두 번 누르기를 기다려요)
    if (isSpacer) { if (val !== h0) setProp(id, 'size', val, '빈 칸 높이 바꾸기'); else renderPage(); return; }
    if (phoneOwn) { if (Math.abs(val - h0) >= step / 2) { setBlockField(id, 'minhM', val); showToast(`휴대폰 높이를 바꿨어요 · ${val}px`); } else renderPage(); return; }
    if (val !== (b.minh || 0) && Math.abs(val - h0) >= step / 2) { setBlockField(id, 'minh', val); showToast(`높이를 바꿨어요 · ${val}px`); }
    else renderPage();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}
function resetHeight(id) {
  const b = findBlock(id);
  if (!b || !b.minh) return;
  setBlockField(id, 'minh', '');
  showToast('높이를 내용에 맞게 돌렸어요.');
}

// ---------- 휴대폰 보기에서 너비 손잡이 : 전체 · 절반 두 가지로 착 붙어요 ----------
function startPhoneResize(e, id) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  finishEdit(true);
  select(id);
  const b = findBlock(id);
  const el = els.page.querySelector(`.blk[data-id="${id}"]`);
  const grid = els.page.getBoundingClientRect();
  const left = el.getBoundingClientRect().left;
  let ms = b.mspan === 6 ? 6 : 12;
  const tip = document.createElement('div');
  tip.className = 'size-tip';
  document.body.appendChild(tip);
  document.body.classList.add('is-resizing');
  el.classList.add('is-resizing-blk');
  const move = (ev) => {
    ms = (ev.clientX - left) > grid.width * 0.72 ? 12 : 6;
    el.style.setProperty('--mspan', ms);
    tip.textContent = ms === 6 ? '휴대폰 · 절반' : '휴대폰 · 전체';
    tip.style.transform = `translate(${ev.clientX + 14}px, ${ev.clientY - 34}px)`;
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    tip.remove();
    document.body.classList.remove('is-resizing');
    el.classList.remove('is-resizing-blk');
    if (ms !== (b.mspan === 6 ? 6 : 12)) setBlockField(id, 'mspan', ms === 6 ? 6 : '');
    else renderPage();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

function startResize(e, id) {
  if (e.button !== 0 || state.device === 'phone') return;
  e.preventDefault();
  e.stopPropagation();
  finishEdit(true);
  select(id);
  const b = findBlock(id);
  const el = els.page.querySelector(`.blk[data-id="${id}"]`);
  const grid = els.page.getBoundingClientRect();
  const colW = grid.width / COLUMNS;
  const maxSpan = COLUMNS - b.col + 1;
  let span = b.span;
  const tip = document.createElement('div');
  tip.className = 'size-tip';
  document.body.appendChild(tip);
  document.body.classList.add('is-resizing');
  el.classList.add('is-resizing-blk');

  const move = (ev) => {
    const right = Math.round((ev.clientX - grid.left) / colW);   // 몇 번째 칸 경계에 가까운지
    span = Math.max(MIN_SPAN, Math.min(maxSpan, right - b.col + 1));
    el.style.gridColumn = `${b.col} / span ${span}`;
    el.querySelector('.blk-size').textContent = `${span}칸`;
    tip.textContent = spanName(span);
    tip.style.transform = `translate(${ev.clientX + 14}px, ${ev.clientY - 34}px)`;
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    tip.remove();
    document.body.classList.remove('is-resizing');
    el.classList.remove('is-resizing-blk');
    if (span !== b.span) { setWidth(id, span); showToast(`너비를 바꿨어요 · ${spanName(span)}`); }
    else renderPage();
  };
  move(e);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

// =========================================================
// 끌어다 놓기 (블록)
// =========================================================
// source: { kind: 'new', type } 또는 { kind: 'move', id }
let drag = null;
const DRAG_START_DISTANCE = 5; // 이만큼 움직여야 '끌기'로 봐요 (그 전엔 '누르기')

function onPointerDown(e, source) {
  if (e.button !== 0) return;
  drag = { source, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, started: false, index: null };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', cancelDrag);
}

function onPointerMove(e) {
  if (!drag) return;
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (!drag.started) {
    if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < DRAG_START_DISTANCE) return;
    beginDrag();
  }
  e.preventDefault();
  moveGhost();
  updateDropSlot();
}

function beginDrag() {
  finishEdit(true);
  drag.started = true;
  document.body.classList.add('is-dragging');
  window.getSelection().removeAllRanges();

  const type = drag.source.kind === 'new' ? drag.source.type : findBlock(drag.source.id).type;
  const def = BLOCKS[type];
  const preset = drag.source.preset && PRESET_BY_ID[drag.source.preset];
  // 놓을 수 있는 영역 (자기 영역에만 놓여요)
  const probe = { type, props: makeProps(type, preset && preset.props) };
  drag.zone = isFlow(probe) ? zoneOf(probe) : null;
  drag.blocked = !!(drag.source.kind === 'new' && existingSingle(type));
  els.paper.dataset.dragZone = drag.zone || 'none';

  drag.ghost = document.createElement('div');
  drag.ghost.className = 'ghost';
  drag.ghost.innerHTML = `<span class="drawer-thumb">${(preset && preset.thumb) || def.thumb}</span><strong>${escapeHtml(preset ? preset.name : def.name)}</strong>` +
    (drag.zone ? `<small>${escapeHtml(zoneName(drag.zone))} 영역에 놓여요</small>` : `<small>화면 위에 떠 있어요 · 놓으면 들어가요</small>`);
  document.body.appendChild(drag.ghost);

  drag.slot = document.createElement('div');
  drag.slot.className = 'drop-slot';
  const dragSpan = drag.source.kind === 'move' ? findBlock(drag.source.id).span : (def.span || COLUMNS);
  drag.slot.style.gridColumn = `auto / span ${drag.zone === 'main' ? dragSpan : COLUMNS}`;
  drag.slot.innerHTML = '<span>여기에 놓기</span>';

  if (drag.source.kind === 'move') {
    drag.origin = els.page.querySelector(`[data-id="${drag.source.id}"]`);
    drag.origin.classList.add('is-lifted');
  }
  autoScrollLoop();
}

function moveGhost() {
  drag.ghost.style.transform = `translate(${drag.x + 14}px, ${drag.y + 10}px) rotate(-3deg)`;
}

function isOverStage() {
  const r = els.stage.getBoundingClientRect();
  return drag.x >= r.left && drag.x <= r.right && drag.y >= r.top && drag.y <= r.bottom;
}

// 마우스 위치를 보고 "자기 영역의 몇 번째 자리에 들어갈지" 계산해요
function updateDropSlot() {
  const zoneEl = drag.zone && els.page.querySelector(`.ib-zone[data-zone="${drag.zone}"]`);
  const over = isOverStage();
  els.page.querySelectorAll('.ib-zone.is-drop').forEach((z) => { if (z !== zoneEl || !over) z.classList.remove('is-drop'); });
  if (!over) {
    drag.index = null;
    drag.slot.remove();
    drag.ghost.classList.remove('is-over', 'is-blocked');
    els.paper.classList.remove('is-target');
    return;
  }
  drag.ghost.classList.toggle('is-blocked', drag.blocked);
  drag.ghost.classList.toggle('is-over', !drag.blocked);
  els.paper.classList.add('is-target');
  if (drag.blocked) { drag.index = 0; drag.slot.remove(); return; }
  if (!zoneEl) { drag.index = 0; drag.slot.remove(); return; }   // 퀵메뉴 · 벽 메뉴: 어디에 놓아도 들어가요
  zoneEl.classList.add('is-drop');

  // 읽는 순서(위→아래, 왼쪽→오른쪽)로 보면서, 마우스가 어느 블록 '앞'에 있는지 찾아요
  const others = [...zoneEl.querySelectorAll(':scope > .blk')].filter((el) => el !== drag.origin);
  let index = others.length;
  for (let i = 0; i < others.length; i++) {
    const r = others[i].getBoundingClientRect();
    const fullRow = r.width > zoneEl.clientWidth * 0.9;
    if (drag.y < r.top) { index = i; break; }
    if (drag.y <= r.bottom) {
      if (fullRow ? drag.y < r.top + r.height / 2 : drag.x < r.left + r.width / 2) { index = i; break; }
    }
  }
  if (drag.index === index && drag.slot.isConnected) return;
  drag.index = index;
  if (index < others.length) zoneEl.insertBefore(drag.slot, others[index]);
  else zoneEl.appendChild(drag.slot);
}

// 페이지 위·아래 끝에 가까이 가면 저절로 스크롤돼요
function autoScrollLoop() {
  if (!drag || !drag.started) return;
  const r = els.stage.getBoundingClientRect();
  const edge = 90;   // 위·아래 끝에서 이만큼 안쪽부터 스크롤 시작
  const speed = (d) => Math.min(48, Math.ceil(d / 2.5));   // 끝에 가까울수록 빨라져요
  let dy = 0;
  if (drag.x >= r.left && drag.x <= r.right) {
    if (drag.y < r.top + edge) dy = -speed(r.top + edge - drag.y);
    else if (drag.y > r.bottom - edge) dy = speed(drag.y - (r.bottom - edge));
  }
  if (dy) { els.stage.scrollTop += dy; updateDropSlot(); }
  drag.raf = requestAnimationFrame(autoScrollLoop);
}

function onPointerUp() {
  if (!drag) return;
  const d = drag;
  cleanupDrag();
  if (!d.started) {
    // 끌지 않고 누르기만 했을 때
    if (d.source.kind === 'new') addBlock(d.source.type, d.source.index, d.source.preset);
    else select(d.source.id);
    return;
  }
  if (d.index == null) {
    if (d.source.kind === 'move') renderPage();
    return;
  }
  if (d.source.kind === 'new') addBlock(d.source.type, d.index, d.source.preset);
  else moveInZone(d.source.id, d.index);
}

function cancelDrag() {
  if (!drag) return;
  const wasMove = drag.started && drag.source.kind === 'move';
  cleanupDrag();
  if (wasMove) renderPage();
}

function cleanupDrag() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', cancelDrag);
  if (drag) {
    cancelAnimationFrame(drag.raf);
    if (drag.ghost) drag.ghost.remove();
    if (drag.slot) drag.slot.remove();
    if (drag.origin) drag.origin.classList.remove('is-lifted');
  }
  document.body.classList.remove('is-dragging');
  els.paper.classList.remove('is-target');
  delete els.paper.dataset.dragZone;
  els.page.querySelectorAll('.ib-zone.is-drop').forEach((z) => z.classList.remove('is-drop'));
  drag = null;
}
