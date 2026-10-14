/*
 * 홈터 · 편집 화면 동작 (12/12) — 이벤트 연결 · 시작
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// =========================================================
// 이벤트 연결
// =========================================================
// 블록 고르기 칸: 누르면 넣고, 끌면 원하는 자리에 놓아요
els.inspector.addEventListener('pointerdown', (e) => {
  const pk = e.target.closest('[data-fav], [data-pk-kind], [data-pk-view], [data-pk-fold]');
  if (pk && picker) { e.preventDefault(); pkAction(pk); return; }
  const item = e.target.closest('.drawer-card');
  const ptog = e.target.closest('[data-ptog]');
  if (ptog && picker) { flipToggle(ptog.dataset.ptog); return; }
  if (item && picker && picker.replace) { e.preventDefault(); replaceBlock(picker.replace, item.dataset.type, item.dataset.preset); return; }
  if (item && picker) onPointerDown(e, { kind: 'new', type: item.dataset.type, preset: item.dataset.preset, index: picker.at });
});
els.inspector.addEventListener('keydown', (e) => {
  const item = e.target.closest('.drawer-card');
  if (item && picker && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (picker.replace) replaceBlock(picker.replace, item.dataset.type, item.dataset.preset); else addBlock(item.dataset.type, picker.at, item.dataset.preset); }
});

// 벽에 붙은 메뉴 · 퀵메뉴는 끌어서 옮기지 않고 누르면 골라져요
[els.side, els.float].forEach((layer) => layer.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.blk-btn') || e.target.isContentEditable) return;
  const blk = e.target.closest('.blk');
  if (blk) select(blk.dataset.id);
}));
els.paper.addEventListener('click', (e) => {   // 퀵메뉴 버튼 · 벽 메뉴 링크가 실제로 눌리지 않게
  if (e.target.closest('.blk a')) e.preventDefault();
}, true);
els.page.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.blk-btn')) return;
  const handle = e.target.closest('.blk-resize');
  if (handle) {
    const id = handle.closest('.blk').dataset.id;
    if (state.device === 'phone') startPhoneResize(e, id); else startResize(e, id);
    return;
  }
  const hHandle = e.target.closest('.blk-hresize');
  if (hHandle) { startHeightResize(e, hHandle.closest('.blk').dataset.id); return; }
  if (e.target.isContentEditable) return;   // 글자를 고치는 중에는 끌지 않아요
  if (e.target.closest('.zone-add, [data-add-at]')) return;
  const blk = e.target.closest('.blk');
  if (!blk) return;
  // 본문 블록만 끌어서 옮겨요. 맨 위 메뉴 · 메인 배너 · 맨 아래 정보는 자기 자리에 있어요
  if (blk.classList.contains('is-main')) onPointerDown(e, { kind: 'move', id: blk.dataset.id });
  else select(blk.dataset.id);
});
// 비어 있는 영역의 '넣기' 버튼
els.page.addEventListener('click', (e) => {
  const plus = e.target.closest('[data-add-at]');
  if (plus) { openPicker(Number(plus.dataset.addAt)); return; }
  const add = e.target.closest('.zone-add');
  if (!add) return;
  if (add.dataset.add) { addBlock(add.dataset.add); return; }
  openPicker(0);
});
els.paper.addEventListener('dblclick', (e) => {
  const hh = e.target.closest('.blk-hresize');
  if (hh) { resetHeight(hh.closest('.blk').dataset.id); return; }
  const blk = e.target.closest('.blk');
  const ph = e.target.closest('[data-pick]');
  if (ph && blk) { pickImage(blk.dataset.id, ph.dataset.pick); return; }
  const phv = e.target.closest('[data-pick-video]');
  if (phv && blk) { pickVideo(blk.dataset.id, phv.dataset.pickVideo); return; }
  const el = e.target.closest('[data-edit]');
  if (el && !el.isContentEditable) startEdit(el);
});
// 메인 배너 · 카드 슬라이드의 화살표·점을 누르면 편집 화면에서도 넘어가요
els.page.addEventListener('click', (e) => {
  const blk = e.target.closest('.blk');
  if (!blk) return;
  const arrow = e.target.closest('.b-slider-arrow');
  const dot = e.target.closest('.b-slider-dots [data-go]');
  if (!arrow && !dot) return;
  const b = findBlock(blk.dataset.id);
  const sl = blk.querySelector('[data-slider]');
  if (!b || !sl) return;
  const dir = arrow ? (arrow.classList.contains('next') ? 1 : -1) : 0;
  if (sl.dataset.slider === 'track') {   // 카드: 보이는 칸 단위로 밀어요
    const t = trackInfo(sl, b);
    const m = t.last + 1;
    showSlide(b.id, (dot ? Number(dot.dataset.go) : (((t.pos + dir) % m) + m) % m) * t.rows);
  } else {
    showSlide(b.id, dot ? Number(dot.dataset.go) : (state.view[b.id] || 0) + dir);
  }
});
els.paper.addEventListener('click', (e) => {
  const btn = e.target.closest('.blk-btn');
  if (btn) runAction(btn.dataset.act, btn.closest('.blk').dataset.id);
});
// 블록 속 링크·버튼이 실제로 눌리지 않게 막아요 (편집 화면이니까요)
els.page.addEventListener('click', (e) => {
  if (e.target.closest('.blk-body a')) e.preventDefault();
}, true);

// 빈 곳을 누르면 선택이 풀려요
els.stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.blk, [data-add-at], .zone-add')) return;
  if (picker) closePicker();
  else if (state.selectedId) select(null);
});

// 페이지 막대 · 페이지 설정 · 사이트 지도의 버튼
function runPageAction(act) {
  if (act === 'add' || act === 'add-map') { openPageTemplates('page'); return; }
  if (act === 'sets') { openPageTemplates('set'); return; }
  if (act === 'map') { setMode(state.mode === 'map' ? 'edit' : 'map'); return; }
  if (act === 'note') { addNote(); return; }
  if (act === 'add-login') { addLoginPage(); return; }
  if (act === 'theme') { if (sidePanel === 'theme') closeTheme(); else openTheme(); return; }
  if (act === 'info') { if (sidePanel === 'info') closeTheme(); else openInfo(); return; }
  if (act === 'home') setPageField(state.pageId, 'home');
  if (act === 'dup') duplicatePage(state.pageId);
  if (act === 'del') deletePage(state.pageId);
}
els.pageBar.addEventListener('click', (e) => {
  const pgBtn = e.target.closest('[data-page]');
  if (pgBtn) { if (state.mode === 'map') { syncOut(); state.pageId = pgBtn.dataset.page; syncIn(); setMode('edit'); } else switchPage(pgBtn.dataset.page); return; }
  const a = e.target.closest('[data-page-act]');
  if (a) runPageAction(a.dataset.pageAct);
});
els.map.addEventListener('pointerdown', mapPointerDown);
els.map.addEventListener('click', (e) => {
  const nd = e.target.closest('[data-note-del]');
  if (nd) { const id = nd.closest('[data-note]').dataset.note; changeSite('메모 지우기', () => { state.site.notes = state.site.notes.filter((n) => n.id !== id); }); return; }
  const nc = e.target.closest('[data-note-color]');
  if (nc) { noteSet(nc.closest('[data-note]').dataset.note, (n) => { n.color = nc.dataset.noteColor; }, '메모 색 바꾸기'); return; }
  const del = e.target.closest('[data-map-del]');
  if (del) { if (!del.disabled) deletePage(del.dataset.mapDel); return; }
  const a = e.target.closest('[data-page-act]');
  if (a) runPageAction(a.dataset.pageAct);
});
els.map.addEventListener('change', (e) => {
  const ta = e.target.closest('[data-note-text]');
  if (ta) noteSet(ta.closest('[data-note]').dataset.note, (n) => { n.text = ta.value.slice(0, 2000); }, '메모 고치기');
});
els.map.addEventListener('dblclick', (e) => {
  // 지도 빈 곳을 두 번 누르면 그 자리에 메모
  if (e.target.classList.contains('map-canvas')) {
    const r = e.target.getBoundingClientRect();
    addNote(e.clientX - r.left - 20, e.clientY - r.top - 20);
    return;
  }
  const card = e.target.closest('.map-card');
  if (!card) return;
  syncOut(); state.pageId = card.dataset.page; syncIn();
  setMode('edit');
});

// 오른쪽 설정
els.inspector.addEventListener('click', (e) => {
  if (e.target.closest('[data-picker="close"]')) { closePicker(); return; }
  if (e.target.closest('[data-theme-close], [data-panel-close]')) { closeTheme(); return; }
  if (e.target.closest('[data-replace-all]')) {
    const find = (els.inspector.querySelector('#rep-find') || {}).value || '', to = (els.inspector.querySelector('#rep-to') || {}).value || '';
    if (find.trim().length < 2) { showToast('찾을 글을 두 글자 이상 적어 주세요.'); return; }
    let n = 0;
    changeSite(`글자 바꾸기 · ${find} → ${to}`, () => { n = ADM_UI().replaceAll(state.site, find, to, { BLOCKS }); });
    showToast(n ? `${n}곳을 바꿨어요.` : '찾는 글이 없어요.', n ? '되돌리기' : null, n ? undo : null);
    return;
  }
  const og = e.target.closest('[data-open-guide]');
  if (og) { openGuide(og.dataset.openGuide); return; }
  // 관리자 화면 꾸미기
  const admTab = e.target.closest('[data-adm-tab]');
  if (admTab) { adminTab = admTab.dataset.admTab; renderInspector(); return; }
  if (e.target.closest('[data-adm-preview]')) { openAdminPreview(); return; }
  const admLay = e.target.closest('[data-adm-layout]');
  if (admLay) { const id = admLay.dataset.admLayout; setAdminUI('관리자 화면 배치 바꾸기', (ui) => { ui.layout = id; }); return; }
  const admMove = e.target.closest('[data-adm-card-move], [data-adm-menu-move], [data-adm-quick-move]');
  if (admMove && !admMove.disabled) {
    const key = admMove.hasAttribute('data-adm-card-move') ? 'cards' : admMove.hasAttribute('data-adm-menu-move') ? 'menu' : 'quick';
    const i = Number(admMove.dataset.admCardMove ?? admMove.dataset.admMenuMove ?? admMove.dataset.admQuickMove);
    const j = i + Number(admMove.dataset.dir);
    setAdminUI('관리자 화면 순서 바꾸기', (ui) => { const l = ui[key]; if (j < 0 || j >= l.length) return; const [it] = l.splice(i, 1); l.splice(j, 0, it); });
    return;
  }
  const admQDel = e.target.closest('[data-adm-quick-del]');
  if (admQDel) { const i = Number(admQDel.dataset.admQuickDel); setAdminUI('자주 고치는 곳 빼기', (ui) => { ui.quick.splice(i, 1); }); return; }
  if (e.target.closest('[data-adm-quick-add]')) {
    const sel = els.inspector.querySelector('#adm-quick-pick');
    if (!sel || !sel.value) { showToast('먼저 칸을 골라 주세요.'); return; }
    const [pageId, blockId, ...rest] = sel.value.split('|');
    setAdminUI('자주 고치는 곳 담기', (ui) => { ui.quick.push({ pageId, blockId, path: rest.join('|') }); });
    return;
  }
  if (e.target.closest('[data-adm-todo-add]')) {
    const inp = els.inspector.querySelector('#adm-todo-new');
    const v = inp ? inp.value.trim() : '';
    if (!v) { showToast('할 일을 적어 주세요.'); if (inp) inp.focus(); return; }
    setAdminUI('처음 할 일 더하기', (ui) => { ui.todo.push({ label: v }); });
    return;
  }
  const admTDel = e.target.closest('[data-adm-todo-del]');
  if (admTDel) { const i = Number(admTDel.dataset.admTodoDel); setAdminUI('처음 할 일 빼기', (ui) => { ui.todo.splice(i, 1); }); return; }
  const rd = e.target.closest('[data-readable]');
  if (rd) { setReadable(rd.dataset.readable); return; }
  const ia = e.target.closest('[data-info-add]');
  if (ia) { infoAddBlock(ia.dataset.infoAdd); return; }
  if (e.target.closest('[data-qr-save]')) {
    const img = els.inspector.querySelector('.qr-preview');
    if (img) { const a = document.createElement('a'); a.href = img.src; a.download = `${safeName(siteTitle())}_QR.png`; a.click(); showToast('QR 그림을 내려받았어요.'); }
    return;
  }
  const ip = e.target.closest('[data-info-pick]');
  if (ip) { siteImgTarget = { key: ip.dataset.infoPick, alpha: ip.dataset.alpha === '1' }; imagePicker.click(); return; }
  const ic = e.target.closest('[data-info-clear]');
  if (ic) { setInfo('사진 빼기', (inf) => { inf[ic.dataset.infoClear] = null; }); return; }
  const md = e.target.closest('[data-mood]');
  if (md) { applyMood(md.dataset.mood); return; }
  const tp = e.target.closest('[data-theme-preset]');
  if (tp) {
    const TH = window.HometeoTheme;
    const list = tp.dataset.fam === 'base' || !tp.dataset.fam ? TH.PRESETS : TH.familyPresets(tp.dataset.fam);
    const pr = list.find((x) => x.id === tp.dataset.themePreset);
    if (pr) setTheme(`색 묶음 바꾸기 · ${pr.name}`, (t) => applyColors(t, pr));
    return;
  }
  const tfam = e.target.closest('[data-theme-family]');
  if (tfam) { themeFamily = tfam.dataset.themeFamily; renderInspector(); return; }
  if (e.target.closest('[data-theme-fix]')) {
    setTheme('추천 색으로 바꾸기', (t) => { const f = window.HometeoTheme.fixColors(t); t.bg = f.bg; t.point = f.point; t.dark = f.dark; t.text = f.text; });
    showToast('글자가 잘 보이게 색의 밝기를 고쳤어요.', '되돌리기', undo);
    return;
  }
  const tl = e.target.closest('[data-theme-lock]');
  if (tl) {
    const k = tl.dataset.themeLock;
    if (themeLocks[k]) delete themeLocks[k]; else themeLocks[k] = window.HometeoTheme.normalize(state.site.theme)[k];
    renderInspector(); return;
  }
  const ha = e.target.closest('[data-harm-apply]');
  if (ha) {
    const TH = window.HometeoTheme;
    const th = TH.harmonyTheme(harm.base || TH.normalize(state.site.theme).point, ha.dataset.harmApply, harm.mix, themeLocks);
    setTheme('색 조합 고르기', (t) => applyColors(t, th));
    return;
  }
  if (e.target.closest('[data-harm-shuffle]')) { harm.mix = Math.round(Math.random() * 100) / 100; renderInspector(); return; }
  const hp = e.target.closest('[data-harm-pick]');
  if (hp) { harm.base = hp.dataset.harmPick; renderInspector(); return; }
  if (e.target.closest('[data-harm-photo]')) { colorPhotoPicker.click(); return; }
  if (e.target.closest('[data-code-apply]')) { applyColorCode(); return; }
  const ctg = e.target.closest('[data-code-toggle]');
  if (ctg) { codeIn.open = !ctg.parentElement.open; return; }
  if (e.target.closest('[data-font-add]')) { fontPicker.click(); return; }
  const fd = e.target.closest('[data-font-del]');
  if (fd) { removeFont(fd.dataset.fontDel); return; }
  const pa = e.target.closest('[data-page-act]');
  if (pa) { runPageAction(pa.dataset.pageAct); return; }
  const tab = e.target.closest('[data-insp-tab]');
  if (tab) { setInspTab(tab.dataset.inspTab); return; }
  const ft = e.target.closest('.field > .field-title[role="button"]');
  if (ft) { toggleFold(ft.parentElement); return; }
  const pg = e.target.closest('[data-page-gap]');
  if (pg) {
    const v = Number(pg.dataset.pageGap);
    if ((Number(state.page.gap) || 0) !== v) change('블록 사이 간격 바꾸기', () => { state.page = Object.assign({}, state.page, { gap: v }); });
    return;
  }
  const id = state.selectedId;
  if (!id) return;
  // 사진 비율 가로 · 세로: 방향을 기억하고, 지금 비율이 반대 방향이면 뒤집어요 (16:9 ↔ 9:16)
  const rf = e.target.closest('[data-ratio-flip]');
  if (rf && id) {
    const key = rf.dataset.ratioFlip, dir = rf.dataset.dir;
    change(dir === 'v' ? '사진 세로로' : '사진 가로로', () => {
      const p = findBlock(id).props;
      p[key + 'Dir'] = dir;
      const n = String(p[key] || '').split('/').map(Number);
      if (n.length === 2 && n[0] && n[1] && n[0] !== n[1] && (n[0] < n[1]) !== (dir === 'v')) p[key] = n[1] + '/' + n[0];
    });
    return;
  }
  const insp = e.target.closest('[data-insp]');
  if (insp) { runAction(insp.dataset.insp, id); return; }

  const ms = e.target.closest('[data-mspan]');
  if (ms) { setBlockField(id, 'mspan', ms.dataset.mspan === '6' ? 6 : ''); return; }
  const bf = e.target.closest('[data-bfield]');
  if (bf) {
    const v = bf.dataset.value;
    const k = bf.dataset.bfield;
    setBlockField(id, k, k === 'minh' ? (v === 'full' ? 'full' : (Number(v) || '')) : k === 'minhM' ? (['full', 'auto'].includes(v) ? v : (Number(v) || '')) : v);
    return;
  }

  const wBtn = e.target.closest('[data-width]');
  if (wBtn) { setWidth(id, Number(wBtn.dataset.width)); return; }
  const pBtn = e.target.closest('[data-place]');
  if (pBtn) { setPlace(id, pBtn.dataset.place); return; }

  const setBtn = e.target.closest('[data-set]');
  if (setBtn) { setProp(id, setBtn.dataset.set, setBtn.dataset.value); return; }

  const act = e.target.closest('[data-action]');
  if (!act || act.disabled) return;
  runInspectorAction(id, act.dataset);
});
// 입력 칸 · 체크 칸: 다 쓰고 나면(칸을 벗어나거나 Enter) 반영돼요
els.inspector.addEventListener('change', (e) => {
  const admEl = e.target.closest('[data-admin]');
  if (admEl) {
    const k = admEl.dataset.admin;
    const v = admEl.type === 'checkbox' ? admEl.checked : admEl.value.trim();
    const label = k === 'enabled' ? (v ? '관리자 화면 켜기' : '관리자 화면 끄기') : '관리자 설정 바꾸기';
    setAdmin(label, (adm) => { adm[k] = v; });
    if (k === 'enabled') renderInspector();
    return;
  }

  const admCard = e.target.closest('[data-adm-card-on]');
  if (admCard) { const t = admCard.dataset.admCardOn, on = admCard.checked; setAdminUI(on ? '첫 화면 카드 켜기' : '첫 화면 카드 끄기', (ui) => { const c = ui.cards.find((x) => x.type === t); if (c) c.on = on; }); return; }
  const admML = e.target.closest('[data-adm-menu-label]');
  if (admML) { const id = admML.dataset.admMenuLabel, v = admML.value.trim(); setAdminUI('메뉴 이름 바꾸기', (ui) => { const m = ui.menu.find((x) => x.id === id); if (m) m.label = v; }); return; }
  const admMH = e.target.closest('[data-adm-menu-hide]');
  if (admMH) { const id = admMH.dataset.admMenuHide, on = admMH.checked; setAdminUI(on ? '메뉴 숨기기' : '메뉴 보이기', (ui) => { const m = ui.menu.find((x) => x.id === id); if (m) m.hidden = on; }); return; }
  const admTL = e.target.closest('[data-adm-todo-label]');
  if (admTL) { const i = Number(admTL.dataset.admTodoLabel), v = admTL.value.trim(); setAdminUI('처음 할 일 고치기', (ui) => { if (!ui.todo[i]) return; if (v) ui.todo[i].label = v; else ui.todo.splice(i, 1); }); return; }
  if (e.target.matches('[data-adm-memo]')) { const v = e.target.value; setAdminUI('사장님께 메모', (ui) => { ui.memo = v; }); return; }

  const bizEl = e.target.closest('[data-biz]');
  if (bizEl) {
    const key = bizEl.dataset.biz, v = bizEl.value.trim();
    let n = 0;
    changeSite('가게 기본 정보 고치기', () => { n = ADM_UI().setBiz(state.site, key, v, { BLOCKS }); });
    if (n > 1) showToast(`홈페이지 ${n}곳을 함께 바꿨어요.`, '되돌리기', undo);
    return;
  }

  const stepEl = e.target.closest('[data-guide-step]');
  if (stepEl) {
    const step = String(stepEl.dataset.guideStep);
    const on = stepEl.checked;
    setAdmin(`따라 하기 ${step}단계 확인`, (adm) => {
      if (!adm.guideSteps) adm.guideSteps = {};
      adm.guideSteps[step] = on;
    });
    return;
  }

  const tool = e.target.closest('[data-tool="showEn"]');
  if (tool) { setShowEn(tool.checked); renderDrawer(); render(); showToast(tool.checked ? '전문 용어를 함께 보여요. ‘자세히’ 칸도 펼쳐져요.' : '쉬운 말로만 보여요.'); return; }
  const tc = e.target.closest('[data-theme-color]');
  if (tc) { const k = tc.dataset.themeColor; setTheme('사이트 색 바꾸기', (t) => { t[k] = tc.value; }); return; }
  if (e.target.matches('[data-theme-textauto]')) { const on = e.target.checked; setTheme('글자색 바꾸기', (t) => { t.text = on ? '' : window.HometeoTheme.inkOn(t.bg); }); return; }
  const tf = e.target.closest('[data-theme-font]');
  if (tf) { const [a, b] = tf.dataset.themeFont.split('.'); setTheme('글꼴 바꾸기', (t) => { if (!t[a]) t[a] = Object.assign({}, t.font); t[a][b] = tf.value; }); return; }
  if (e.target.matches('[data-theme-head]')) { const on = e.target.checked; setTheme(on ? '제목 글꼴 따로' : '제목 글꼴 본문과 같이', (t) => { t.head = on ? Object.assign({}, t.font) : null; }); return; }
  if (e.target.matches('[data-harm-base]')) { harm.base = e.target.value.toUpperCase(); renderInspector(); return; }
  if (e.target.matches('[data-code-key]')) { codeIn.key = e.target.value; return; }
  if (e.target.matches('[data-code-kind]')) { codeIn.kind = e.target.value; const ph = { hex: '#F2B33D', rgb: '242 179 61', cmyk: '0 26 75 5' }; const v = els.inspector.querySelector('[data-code-val]'); if (v) v.placeholder = ph[e.target.value]; return; }
  const fl = e.target.closest('[data-font-license]');
  if (fl) { const on = fl.checked; changeSite(on ? '글꼴 사용 확인' : '글꼴 사용 확인 풀기', () => { const f = (state.site.fonts || []).find((x) => x.id === fl.dataset.fontLicense); if (f) f.licensed = on; }); return; }
  if (e.target.matches('[data-info-logo]')) {
    const v = e.target.value.trim();
    const h = state.blocks.find((b) => b.type === 'header');
    if (h && v && v !== h.props.logo) setProp(h.id, 'logo', v, '사이트 이름 바꾸기');
    return;
  }
  if (e.target.matches('[data-info-sync]')) {
    const on = e.target.checked;
    setInfo(on ? '사이트 이름 · 메뉴 제목 같이 쓰기' : '사이트 이름 따로 쓰기', (x) => { x.syncName = on; if (!on && !x.name) x.name = headerLogo() || ''; });
    return;
  }
  if (e.target.matches('[data-biz-sync]')) {
    const on = e.target.checked;
    const nm = siteName();
    changeSite(on ? '상호를 사이트 이름과 같이 쓰기' : '상호 따로 쓰기', () => {
      state.site.info = normInfo(Object.assign({}, state.site.info || {}, { syncCompany: on }));
      if (on && nm) ADM_UI().setBiz(state.site, 'company', nm, { BLOCKS });
    });
    return;
  }
  if (e.target.matches('[data-info-a11y]')) { const v = e.target.checked; setInfo(v ? '글자 크게 버튼 넣기' : '글자 크게 버튼 빼기', (x) => { x.a11y = v; }); return; }
  const inf = e.target.closest('[data-info]');
  if (inf) {
    const k = inf.dataset.info; const v = inf.value.trim();
    if ((state.site.info || {})[k] === v) return;
    const coSync = k === 'name' && v && ADM_UI().companySynced(state.site, siteName());
    changeSite(k === 'name' ? '사이트 이름 바꾸기' : '사이트 정보 바꾸기', () => {
      state.site.info = normInfo(Object.assign({}, state.site.info || {}, { [k]: v }));
      if (coSync) ADM_UI().setBiz(state.site, 'company', v, { BLOCKS });
    });
    return;
  }
  if (e.target.matches('[data-page-desc]')) { const v = e.target.value.trim(); changeSite('페이지 소개 바꾸기', () => { curPage().desc = v; }); return; }
  if (e.target.matches('[data-pk-sort]')) { pkSet('sort', e.target.value); pkAction(e.target); return; }
  const ct = e.target.closest('[data-copy-to]');
  if (ct) { if (ct.value && state.selectedId) copyBlock(state.selectedId, ct.value); ct.value = ''; return; }
  const pf = e.target.closest('[data-page-field]');
  if (pf) { setPageField(state.pageId, pf.dataset.pageField, pf.value); return; }
  const lp = e.target.closest('.link-pick');
  if (lp && state.selectedId) { onLinkPick(lp, e.target); return; }
  const po = e.target.closest('[data-phone-own]');
  if (po && state.selectedId) { setPhoneOwn(state.selectedId, po.checked); return; }
  const f = e.target.closest('[data-field]');
  if (!f || !state.selectedId) return;
  let value = f.type === 'checkbox' ? f.checked : f.value.trim();
  if (f.hasAttribute('data-number')) value = Number(value);
  // 퀵메뉴: '휴대폰도 PC와 같은 버튼'을 끄면 지금 PC 버튼에서 시작해요
  const qb = findBlock(state.selectedId);
  if (qb && qb.type === 'quick' && f.dataset.field === 'phoneSame' && value === false) {
    change('휴대폰 버튼 따로 정하기', () => { const p = findBlock(qb.id).props; p.phoneSame = false; if (!p.itemsM || !p.itemsM.length) p.itemsM = clone(p.items.slice(0, 5)); });
    return;
  }
  // 유튜브 쇼츠 주소는 세로 영상이라 9:16 · 가운데 좁게로
  const vb = findBlock(state.selectedId);
  if (vb && vb.type === 'video' && f.dataset.field === 'url' && /youtube\.com\/shorts\//.test(value) && value !== vb.props.url) {
    change('영상 주소 넣기', () => { const t = findBlock(vb.id); t.props.url = value; t.props.ratio = '9/16'; if (t.span === COLUMNS && !t.px) t.px = 'l'; });
    showToast('쇼츠(세로 영상)라서 9:16 비율로 바꾸고 양옆 여백을 넓게 두었어요.');
    return;
  }
  setProp(state.selectedId, f.dataset.field, value);
});

// 휴대폰은 따로 맞추기: 켜면 지금 PC 값에서 시작하고, 끄면 휴대폰 값을 지워 PC와 같아져요
function walkObjs(o, fn) {
  if (Array.isArray(o)) o.forEach((x) => walkObjs(x, fn));
  else if (o && typeof o === 'object') { fn(o); Object.values(o).forEach((x) => walkObjs(x, fn)); }
}
function setPhoneOwn(id, on) {
  const b = findBlock(id);
  if (!b || !!b.phoneOwn === on) return;
  change(on ? '휴대폰 따로 맞추기 켜기' : '휴대폰 따로 맞추기 끄기', () => {
    const x = findBlock(id);
    if (on) {
      x.phoneOwn = true;
      walkObjs(x.props, (o) => { if ('imgX' in o) { o.imgXm = o.imgX == null ? 50 : o.imgX; o.imgYm = o.imgY == null ? 50 : o.imgY; o.imgZoomm = o.imgZoom || 1; } });
    } else {
      delete x.phoneOwn; delete x.minhM;
      walkObjs(x.props, (o) => { delete o.imgXm; delete o.imgYm; delete o.imgZoomm; if ('imageM' in o) o.imageM = null; });
    }
  });
  showToast(on ? '휴대폰을 따로 맞춰요. 휴대폰 보기로 바꿔서 높이와 사진을 고쳐 보세요.' : '휴대폰도 PC와 같이 보여요.');
}

// '누르면 갈 곳' 고르기가 바뀌면 값을 만들어 넣어요
function onLinkPick(box, el) {
  const id = state.selectedId;
  const path = box.dataset.link;
  const pend = linkPending[id] || (linkPending[id] = {});
  const kindSel = box.querySelector('[data-link-kind]');
  const kind = kindSel.value;
  let value;
  if (el.matches('[data-link-kind]')) {
    delete pend[path];
    if (kind === 'none') value = '';
    else if (kind === 'page') value = 'page:' + currentPageId();
    else { pend[path] = kind; renderInspector(); const inp = els.inspector.querySelector(`.link-pick[data-link="${path}"] [data-link-input]`); if (inp) inp.focus(); return; }
  } else if (el.matches('[data-link-page]')) {
    value = 'page:' + el.value;
  } else if (el.matches('[data-link-anchor]')) {
    const pg = box.querySelector('[data-link-page]').value;
    value = 'page:' + pg + (el.value ? '#' + el.value : '');
  } else if (el.matches('[data-link-input]')) {
    // 직접 적기: 전화번호 · 메일 · 인터넷 주소를 홈터가 알아봐요
    const raw = el.value.trim();
    if (!raw) value = '';
    else if (/^mailto:/i.test(raw) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) value = 'mailto:' + raw.replace(/^mailto:/i, '');
    else if (/^(tel:)?[0-9+\-\s()]{7,}$/.test(raw)) value = raw.replace(/^tel:/i, '');
    else if (/^[a-z]+:/i.test(raw) || raw.startsWith('#')) value = raw;
    else value = 'https://' + raw;
    if (value) delete pend[path];
  } else return;
  const b = findBlock(id);
  if (b && getPath(b.props, path) === value) { renderInspector(); return; }
  setProp(id, path, value, '갈 곳 바꾸기');
}

// 목록 이름에서 번호를 * 로 바꿔서, 블록의 newItem 에서 새 내용을 찾아요 ('menu.2.children' → 'menu.*.children')
// 목록이 바뀐 뒤 블록이 따로 맞출 것 (예: 표의 칸을 빼면 모든 줄의 칸도 빼요)
function afterList(b, props, path, op) { const f = BLOCKS[b.type].afterList; if (f) f(props, path, op); }
function newItemFor(b, path) {
  const key = path.replace(/\.\d+(?=\.|$)/g, '.*');
  const make = BLOCKS[b.type].newItem && BLOCKS[b.type].newItem[key];
  return make ? make() : null;
}

function runInspectorAction(id, d) {
  const b = findBlock(id);
  if (!b) return;
  const path = d.path;
  switch (d.action) {
    case 'image-pick': pickImage(id, path, { push: d.push === '1', alpha: d.alpha === '1' }); break;
    case 'video-pick': pickVideo(id, path); break;
    case 'image-crop': openCrop(id, d.base || '', d.frames, d.key); break;
    case 'images-add': multiTarget = { blockId: id, path }; multiPicker.click(); break;
    case 'set-null': setProp(id, path, null, '빼기'); break;
    case 'list-add': {
      const item = newItemFor(b, path);
      if (item == null) return;
      change('목록에 추가', () => { const bp = findBlock(id).props; const l = getPath(bp, path); if (BLOCKS[b.type].addAt === 'top' && !path.includes('.')) l.unshift(item); else l.push(item); afterList(b, bp, path, { action: 'add' }); });
      if (path === 'slides' || path === 'cards') { state.view[id] = getPath(b.props, path).length - 1; render(); }
      break;
    }
    case 'list-remove': {
      const i = Number(d.index);
      change('목록에서 빼기', () => { const bp = findBlock(id).props; getPath(bp, path).splice(i, 1); afterList(b, bp, path, { action: 'remove', i }); });
      if (path === 'slides' || path === 'cards') { state.view[id] = Math.max(0, Math.min(state.view[id] || 0, getPath(b.props, path).length - 1)); render(); }
      break;
    }
    case 'list-move': {
      const i = Number(d.index), j = i + Number(d.dir);
      const list = getPath(b.props, path);
      if (j < 0 || j >= list.length) return;
      change('순서 바꾸기', () => {
        const bp = findBlock(id).props;
        const l = getPath(bp, path);
        const [it] = l.splice(i, 1);
        l.splice(j, 0, it);
        afterList(b, bp, path, { action: 'move', i, j });
      });
      if ((path === 'slides' || path === 'cards') && (state.view[id] || 0) === i) { state.view[id] = j; render(); }
      break;
    }
    case 'slide-show': showSlide(id, Number(d.index)); break;
    case 'item-flag': {
      const key = `${path}.${d.index}.${d.flag}`;
      const on = !getPath(b.props, key);
      change(d.flag === '_sold' ? (on ? '품절 표시' : '품절 표시 빼기') : (on ? '잠시 숨기기' : '다시 보이기'), () => {
        const it = getPath(findBlock(id).props, `${path}.${d.index}`);
        if (on) it[d.flag] = true; else delete it[d.flag];
      });
      break;
    }
    case 'file-pick': docTarget = { blockId: id, path }; docPicker.click(); break;
    case 'file-clear': change('파일 빼기', () => { const it = getPath(findBlock(id).props, path); it.file = null; it.fname = ''; }); break;
  }
}

// 메인 배너 · 카드: 편집 화면에서 보고 있는 장 바꾸기 (내용이 바뀌는 건 아니라 되돌리기에 남기지 않아요)
function showSlide(id, index) {
  const b = findBlock(id);
  const list = b && (b.props.slides || b.props.cards);
  if (!list) return;
  const n = list.length;
  state.view[id] = ((index % n) + n) % n;
  finishEdit(true);
  renderPage();
  renderInspector();
}
// 색을 고르는 동안에는 바로 보여주기만 하고, 다 고르면(change) 저장해요
els.inspector.addEventListener('input', (e) => {
  const ps = e.target.closest('[data-picker-search]');
  if (ps) {
    const q = ps.value.trim().replace(/\s+/g, '');
    let any = false;
    els.inspector.querySelectorAll('ul[data-pg]').forEach((ul) => {
      let n = 0;
      ul.querySelectorAll('.drawer-card').forEach((c) => { const ok = !q || (c.querySelector('.drawer-text') || c).textContent.replace(/\s+/g, '').includes(q); c.parentElement.hidden = !ok; if (ok) n++; });
      ul.hidden = q ? !n : ul.hasAttribute('data-folded'); const h4 = els.inspector.querySelector(`h4[data-pg="${ul.dataset.pg}"]`); if (h4) h4.hidden = q ? !n : false;
      if (n) any = true;
    });
    const em = els.inspector.querySelector('.picker-empty'); if (em) em.hidden = any;
    const help = els.inspector.querySelector('.picker-help'); if (help) help.hidden = !!q;
    return;
  }
  if (e.target.matches('[data-harm-base]')) { e.target.parentElement.style.background = e.target.value; return; }
  const tc = e.target.closest('[data-theme-color]');
  if (!tc) return;
  const t = Object.assign({}, state.site.theme, { [tc.dataset.themeColor]: tc.value });
  window.HometeoTheme.vars(t).split(';').forEach((kv) => { const i = kv.indexOf(':'); els.paper.style.setProperty(kv.slice(0, i), kv.slice(i + 1)); });
  themeKey = '';
  tc.parentElement.style.background = tc.value;
});
els.inspector.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'adm-todo-new') { e.preventDefault(); const add = els.inspector.querySelector('[data-adm-todo-add]'); if (add) add.click(); return; }
  if (e.key === 'Enter' && e.target.matches('input[type="text"]')) e.target.blur();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.field > .field-title[role="button"]')) { e.preventDefault(); toggleFold(e.target.parentElement); }
});

function runAction(act, id) {
  const i = findIndex(id);
  if (act === 'up') moveBlock(id, -1);
  if (act === 'down') moveBlock(id, 1);
  if (act === 'delete') deleteBlock(id);
  if (act === 'copy') copyBlock(id);
  if (act === 'replace') openReplace(id);
  if (act === 'style-copy') { styleClip = styleOf(findBlock(id)); renderInspector(); showToast('모양을 기억했어요. 다른 블록을 골라 ‘모양 붙이기’를 누르세요.'); }
  if (act === 'style-paste' && styleClip) { change('모양 붙이기', () => pasteStyle(findBlock(id), styleClip)); showToast('모양을 붙였어요. 글과 사진은 그대로예요.', '되돌리기', undo); }
  if (act === 'style-all') {
    const src = styleOf(findBlock(id));
    const targets = mainBlocks().filter((x) => x.id !== id && x.type !== 'aside' && x.type !== 'spacer');
    change('모양을 페이지 전체에', () => targets.forEach((x) => pasteStyle(x, src)));
    showToast(`이 페이지의 본문 블록 ${targets.length}개를 같은 모양으로 맞췄어요.`, '되돌리기', undo);
  }
  if (act === 'off') { const on = !findBlock(id).props._off; change(on ? '블록 잠시 숨기기' : '블록 다시 보이기', () => { const p = findBlock(id).props; if (on) p._off = true; else delete p._off; }); showToast(on ? '손님 화면에서 감췄어요. 지운 건 아니라 언제든 다시 보이게 할 수 있어요.' : '다시 보이게 했어요.'); }
}

els.undo.addEventListener('click', undo);
els.redo.addEventListener('click', redo);

document.addEventListener('keydown', (e) => {
  if (modalOpen && !modalOpen.el.isConnected) modalOpen = null;
  if (modalOpen) {   // 견본 · 안내 창이 열려 있을 때
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    return;
  }
  if (e.key === 'Escape' && !els.fileMenu.hidden) { toggleFileMenu(false); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {   // Ctrl+S = 작업 파일로 저장
    e.preventDefault();
    if (!crop) saveProjectFile();
    return;
  }
  if (crop) {   // 사진 위치 창이 열려 있을 때
    if (e.key === 'Escape') { e.preventDefault(); closeCrop(false); }
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); closeCrop(true); }
    return;
  }
  const t = e.target;
  const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
  if (typing) return; // 글을 쓰는 중에는 아래 단축키를 쓰지 않아요
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); if (PANE) window.parent.postMessage({ type: 'ht-undo' }, '*'); else undo(); return; }
  if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); if (PANE) window.parent.postMessage({ type: 'ht-redo' }, '*'); else redo(); return; }
  if (mod && k === 'd' && state.selectedId) { e.preventDefault(); copyBlock(state.selectedId); return; }
  if (e.key === 'Escape') {
    if (drag) cancelDrag();
    else if (picker) closePicker();
    else if (sidePanel) closeTheme();
    else if (state.selectedId) select(null);
    return;
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId && state.mode === 'edit') {
    e.preventDefault();
    deleteBlock(state.selectedId);
  }
});

// ---------- 시작 ----------
useSite(makeSite([], 0));
setShowEn(getShowEn());
render();
setDevice('pc');
// 지난 작업이 있으면 이어서, 없으면 견본 고르기 → (처음이면) 사용 안내
if (PANE) {
  setDevice('phone');
  window.parent.postMessage({ type: 'ht-ready' }, '*');
} else {
  loadSaved().then((restored) => {
    if (restored) maybeGuide();
    else openStart(true);
  });
}
