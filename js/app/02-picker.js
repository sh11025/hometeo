/*
 * 홈터 · 편집 화면 동작 (2/12) — 블록 넣기 칸 (블록 고르기 · 견본 · 찾기 · 업종 · 정렬 · 켜고 끄기)
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// ---------- 블록 고르기 (오른쪽 칸) ----------
//   본문의 + 버튼이나 빈 자리의 '넣기'를 누르면 오른쪽 칸이 블록 고르기로 바뀌어요.
//   picker = { at: 본문의 몇 번째 자리 } — 고르면 그 자리에 들어가요. 끌어다 놓아도 돼요.
let picker = null;
function drawerCard(it, rep) {
  if (rep) {
    const cur = rep.type === it.type && !it.props.fields && !it.props.cols;
    return `
    <li>
      <button class="drawer-card${cur ? ' is-used' : ''}" data-type="${it.type}" data-preset="${it.id}" title="${cur ? '지금 이 블록이에요' : '눌러서 이 블록으로 바꿔요'}"${cur ? ' disabled' : ''}>
        ${miniPreview(it)}
        <span class="drawer-text">
          <strong>${escapeHtml(it.name)}${enTag(BLOCKS[it.type].en)}${cur ? ' <em class="used-tag">지금 블록</em>' : ''}</strong>
          <small>${escapeHtml(it.desc)}</small>
        </span>
      </button>
    </li>`;
  }
  const used = !!existingSingle(it.type);
  return `
    <li>
      <button class="drawer-card${used ? ' is-used' : ''}" data-type="${it.type}" data-preset="${it.id}" title="${used ? '이미 페이지에 있어요. 누르면 그 블록을 골라요' : '눌러서 넣거나, 페이지로 끌어다 놓으세요'}">
        ${miniPreview(it)}
        <span class="drawer-text">
          <strong>${escapeHtml(it.name)}${enTag(BLOCKS[it.type].en)}${used ? ' <em class="used-tag">페이지에 있어요</em>' : ''}</strong>
          <small>${escapeHtml(used ? '한 페이지에 하나만 둬요 · 누르면 골라요' : it.desc)}</small>
        </span>
      </button>
      <button type="button" class="dc-fav${pkGet('fav', []).includes(it.id) ? ' is-on' : ''}" data-fav="${it.id}" title="즐겨찾기" aria-label="즐겨찾기">★</button>
    </li>`;
}
// ---------- 블록 넣기 칸: 업종 고르기 · 정렬 · 즐겨찾기 · 접기 · 보는 방식 (이 브라우저에 기억해요) ----------
const PK_KINDS = [['all', '전체'], ['shop', '가게'], ['clinic', '병원'], ['academy', '학원'], ['company', '회사'], ['office', '기관'], ['folio', '포트폴리오'], ['event', '행사']];
const PK_SORTS = [['rec', '추천순'], ['used', '자주 쓴 순'], ['name', '이름순']];
const pkGet = (k, d) => { try { const v = localStorage.getItem('hometeo.pk.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const pkSet = (k, v) => { try { localStorage.setItem('hometeo.pk.' + k, JSON.stringify(v)); } catch (e) { /* 괜찮아요 */ } };
function presetUsed(id) { if (!id) return; const u = pkGet('used', {}); u[id] = (u[id] || 0) + 1; pkSet('used', u); }
function pickerItems(rep) {
  const kind = pkGet('kind', 'all'), sort = pkGet('sort', 'rec'), used = pkGet('used', {});
  let items = PRESETS.filter((g) => g.zone === 'main').flatMap((g) => g.items)
    .concat(PRESETS.filter((g) => g.zone === 'aside').flatMap((g) => g.items).filter((it) => it.type === 'aside'));
  if (rep) items = items.filter((it) => it.type !== 'aside');
  if (kind !== 'all') items = items.filter((it) => !it.tags || it.tags.includes(kind));
  const order = new Map(items.map((it, i) => [it.id, i]));
  if (sort === 'used') items.sort((a, b) => (used[b.id] || 0) - (used[a.id] || 0) || order.get(a.id) - order.get(b.id));
  if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  // 업종을 골랐으면 그 업종 전용 견본을 묶음 안에서 앞으로
  if (kind !== 'all' && sort === 'rec') items.sort((a, b) => (b.tags ? 1 : 0) - (a.tags ? 1 : 0) || order.get(a.id) - order.get(b.id));
  return items;
}
function pickerTools() {
  const kind = pkGet('kind', 'all'), sort = pkGet('sort', 'rec'), view = pkGet('view', 'big');
  return `<div class="pk-tools">
      <div class="pk-kinds" role="group" aria-label="업종">${PK_KINDS.map(([k, l]) => `<button class="pk-chip${kind === k ? ' is-on' : ''}" data-pk-kind="${k}">${l}</button>`).join('')}</div>
      <div class="pk-row">
        <select class="input small" data-pk-sort aria-label="정렬">${PK_SORTS.map(([k, l]) => `<option value="${k}"${sort === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <div class="pk-view" role="group" aria-label="보는 방식">
          <button class="${view === 'big' ? 'is-on' : ''}" data-pk-view="big" title="그림으로 크게">그림</button>
          <button class="${view === 'list' ? 'is-on' : ''}" data-pk-view="list" title="이름만 작게">목록</button>
        </div>
      </div>
    </div>`;
}
function pickerGroups(items, card) {
  const GROUPS = [['basic', '기본', 'Basic'], ['often', '자주 쓰는 블록', 'Common'], ['shop', '가게 · 연락', 'Shop · Contact'], ['org', '회사 · 기관 · 포트폴리오', 'Company · Public · Portfolio']];
  const folded = pkGet('folded', {}), favs = pkGet('fav', []), view = pkGet('view', 'big');
  const ul = (g, list) => `<ul class="drawer-list picker-list${view === 'list' ? ' is-compact' : ''}" data-pg="${g}"${folded[g] ? ' data-folded hidden' : ''}>${list.map(card).join('')}</ul>`;
  const head = (g, ko, en, n) => `<h4 class="picker-group" data-pg="${g}"><button type="button" class="pk-fold${folded[g] ? ' is-folded' : ''}" data-pk-fold="${g}" aria-expanded="${!folded[g]}">${ko}${enTag(en)} <small>${n}</small></button></h4>`;
  const fav = items.filter((it) => favs.includes(it.id));
  return (fav.length ? head('fav', '★ 즐겨찾기', 'Favorites', fav.length) + ul('fav', fav) : '') +
    GROUPS.map(([g, ko, en]) => {
      const list = items.filter((it) => (it.group || 'basic') === g);
      return list.length ? head(g, ko, en, list.length) + ul(g, list) : '';
    }).join('') +
    (items.length ? '' : '<p class="picker-empty">이 업종에 맞는 견본이 없어요. ‘전체’를 눌러 보세요.</p>');
}
function pickerHtml() {
  const mains = mainBlocks();
  const at = Math.min(picker.at, mains.length);
  const where = !mains.length ? '본문 첫 자리' : at === 0 ? '본문 맨 위' : at >= mains.length ? '본문 맨 아래' : `본문 ${at}번째 블록 다음`;
  const rep = picker.replace && findBlock(picker.replace);
  if (rep) {
    return `
    <div class="picker-head is-replace">
      <div>
        <h3>‘${escapeHtml(BLOCKS[rep.type].name)}’ 바꾸기${enTag('Replace block')}</h3>
        <small>같은 자리 · 같은 너비로 바뀌어요. 제목 · 목록 글 · 사진은 되도록 옮겨 와요</small>
      </div>
      <button class="icon-btn" data-picker="close" title="닫기 (Esc)" aria-label="닫기">${ICON.x}</button>
    </div>
    <input class="input small picker-search" type="search" data-picker-search placeholder="바꿀 블록 찾기 (예: 카드 · 표 · 갤러리)" aria-label="블록 찾기">
    <p class="picker-empty" hidden>찾는 블록이 없어요. 다른 말로 찾아보세요.</p>
    ${pickerTools()}
    ${pickerGroups(pickerItems(rep), (it) => drawerCard(it, rep))}`;
  }
  return `
    <div class="picker-head">
      <div>
        <h3>블록 넣기${enTag('Add block')}</h3>
        <small>${escapeHtml(where)}에 들어가요 · 페이지로 끌어다 놓아도 돼요</small>
      </div>
      <button class="icon-btn" data-picker="close" title="닫기 (Esc)" aria-label="닫기">${ICON.x}</button>
    </div>
    <input class="input small picker-search" type="search" data-picker-search placeholder="블록 찾기 (예: 영업시간 · 메뉴판 · 채용)" aria-label="블록 찾기">
    <p class="picker-empty" hidden>찾는 블록이 없어요. 다른 말로 찾아보세요.</p>
    ${togglesHtml()}
    ${pickerTools()}
    ${pickerGroups(pickerItems(null), (it) => drawerCard(it))}
    <p class="picker-help">맨 위 메뉴 · 메인 배너 · 맨 아래 정보는 페이지 가운데의 빈 자리에서 넣고, 블록 막대의 휴지통으로 빼요.</p>`;
}
// 블록 넣기 칸의 업종 · 정렬 · 보기 · 접기 · 즐겨찾기 바꾸기 (검색어는 그대로 둬요)
function pkAction(el) {
  const q = (els.inspector.querySelector('[data-picker-search]') || {}).value || '';
  if (el.dataset.pkKind) pkSet('kind', el.dataset.pkKind);
  if (el.dataset.pkView) pkSet('view', el.dataset.pkView);
  if (el.dataset.pkFold) { const f = pkGet('folded', {}); f[el.dataset.pkFold] = !f[el.dataset.pkFold]; pkSet('folded', f); }
  if (el.dataset.fav) { let f = pkGet('fav', []); f = f.includes(el.dataset.fav) ? f.filter((x) => x !== el.dataset.fav) : f.concat(el.dataset.fav); pkSet('fav', f); }
  const top = els.inspector.scrollTop;
  renderInspector();
  els.inspector.scrollTop = top;
  const box = els.inspector.querySelector('[data-picker-search]');
  if (box && q) { box.value = q; box.dispatchEvent(new Event('input', { bubbles: true })); }
}
// 읽기 쉬운 본문 글꼴 (사이트 정보 · 사이트 꾸미기 · 점검에서 함께 써요)
const READABLE = [['pretendard', '프리텐다드', '반듯하고 또렷해요 · 추천'], ['noto-sans', '본고딕', '화면 · 인쇄 모두 잘 읽혀요'], ['nanum-gothic', '나눔고딕', '익숙한 모양']];
const DECO_FONTS = ['do-hyeon', 'black-han-sans', 'jua', 'gaegu'];
function readableHtml() {
  const cur = ((state.site.theme || {}).font || {}).ko;
  return `<div class="readable-picks">${READABLE.map(([id, n, d]) => `<button class="readable-pick${cur === id ? ' is-on' : ''}" data-readable="${id}" style="font-family:${escapeHtml(window.HometeoTheme.stack({ ko: id, en: '' }))}"><b>${n}</b><small>${d}</small></button>`).join('')}</div>`;
}
function setReadable(id) {
  const n = (READABLE.find((x) => x[0] === id) || [])[1] || '';
  useFonts();
  setTheme(`읽기 쉬운 글꼴로 (${n})`, (t) => { t.font = Object.assign({}, t.font, { ko: id, en: '' }); });
  showToast(`본문 글꼴을 ‘${n}’로 바꿨어요.`, '되돌리기', undo);
}
// 떠 있는 것 · 한 줄 알림은 켜고 끄기만 하면 돼요
const TOGGLES = [
  ['quick', '퀵메뉴', '화면 구석의 카톡 · 전화 · 맨 위로 버튼'],
  ['notice', '공지 띠', '맨 위 한 줄 알림']
];
function toggleOn(k) { return state.blocks.some((b) => b.type === k); }
function togglesHtml() {
  return `<div class="picker-toggles"><small>켜고 끄기</small>${TOGGLES.map(([k, l, d]) => `<button type="button" class="ptog${toggleOn(k) ? ' is-on' : ''}" data-ptog="${k}" title="${d}" aria-pressed="${toggleOn(k)}"><i></i>${l}</button>`).join('')}</div>`;
}
function flipToggle(k) {
  const on = !toggleOn(k);
  if (k === 'a11y') { setInfo(on ? '글자 크게 버튼 넣기' : '글자 크게 버튼 빼기', (x) => { x.a11y = on; }); renderInspector(); return; }
  const name = BLOCKS[k].name;
  if (on) {
    const b = makeBlock(k);
    change(`${name} 켜기`, () => { state.blocks.push(b); });
    showToast(k === 'notice' ? '맨 위에 공지 띠를 넣었어요. 글은 두 번 눌러 고쳐요.' : `${name}를 켰어요. 누르면 설정을 고칠 수 있어요.`);
  } else {
    change(`${name} 끄기`, () => { state.blocks = state.blocks.filter((b) => b.type !== k); });
    showToast(`${name}를 껐어요.`, '되돌리기', undo);
  }
  renderPage(); renderInspector();
}
function openPicker(at) {
  finishEdit(true);
  sidePanel = null;
  picker = { at: at == null ? mainBlocks().length : at };
  state.selectedId = null;
  els.paper.querySelectorAll('.blk.is-selected').forEach((el) => el.classList.remove('is-selected'));
  renderPage();
  renderInspector();
  els.inspector.scrollTop = 0;
}
// ---- 블록 바꾸기: 같은 자리 · 같은 너비에서 종류만 바꿔요 (블록 번호도 그대로라 '그 부분으로 가기' 링크가 안 끊겨요) ----
function openReplace(id) {
  const b = findBlock(id);
  if (!b || zoneOf(b) !== 'main') return;
  finishEdit(true);
  sidePanel = null;
  picker = { at: Math.max(0, mainBlocks().indexOf(b)), replace: id };
  state.selectedId = null;
  renderPage();
  const el = els.paper.querySelector(`.blk[data-id="${id}"]`);
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  renderInspector();
  els.inspector.scrollTop = 0;
}
// 옮겨 올 수 있는 글 · 사진 칸 (이름이 달라도 뜻이 같은 칸끼리)
const SAME = {
  title: ['title', 'name', 'q', 'label', 'year'],
  text: ['text', 'desc', 'a', 'body', 'caption'],
  image: ['image', 'photo'],
  link: ['link', 'url'],
  date: ['date', 'posted']
};
function firstList(def, p) {
  const k = (def.lists || []).find((l) => l.indexOf('*') < 0 && l.indexOf('.') < 0 && Array.isArray(p[l]));
  return k || null;
}
function pickSame(from, group) { for (const k of SAME[group]) if (from && from[k] != null && from[k] !== '') return from[k]; return null; }
function convertProps(old, type, preset) {
  const np = makeProps(type, preset && preset.props);
  const op = old.props || {};
  let moved = 0;
  // 1) 블록 제목 · 작은 설명 · 바탕색처럼 이름이 같은 칸
  ['title', 'sub', 'showHead', 'bg', 'eyebrow', 'align'].forEach((k) => { if (k in np && op[k] != null && op[k] !== '' && typeof op[k] === typeof np[k]) { np[k] = op[k]; if (k === 'title') moved++; } });
  // 글 본문 → 다른 블록: 본문 글을 소개 글로
  if (old.type === 'text' && 'sub' in np && op.body && !np.sub) np.sub = String(op.body).split('\n')[0].slice(0, 80);
  // 2) 목록: 항목마다 제목 · 글 · 사진 · 링크를 같은 뜻의 칸으로
  const od = BLOCKS[old.type], nd = BLOCKS[type];
  const ol = firstList(od, op), nl = firstList(nd, np);
  if (ol && nl && op[ol].length) {
    const make = nd.newItem && nd.newItem[nl];
    const sample = np[nl][0];
    const fresh = () => (make ? make() : (sample && typeof sample === 'object' ? JSON.parse(JSON.stringify(sample)) : null));
    const items = op[ol].slice(0, 40).map((it) => {
      const ni = fresh();
      if (!ni || typeof ni !== 'object' || !it || typeof it !== 'object') return ni;
      Object.keys(SAME).forEach((g) => {
        const v = pickSame(it, g);
        if (v == null) return;
        const target = SAME[g].find((k) => k in ni);
        if (target && typeof ni[target] !== 'object') ni[target] = v;
        else if (target && g === 'image') ni[target] = v;
      });
      ['imgX', 'imgY', 'imgZoom', '_hide', '_sold'].forEach((k) => { if (k in it) ni[k] = it[k]; });
      return ni;
    }).filter(Boolean);
    if (items.length) { np[nl] = items; moved += items.length; }
  }
  // 3) 사진 한 장 블록 ↔ 사진이 있는 블록
  const oneImg = op.image && typeof op.image === 'string' ? op.image : null;
  if (oneImg && 'image' in np && !np.image) np.image = oneImg;
  return { props: np, moved };
}
function replaceBlock(id, type, presetId) {
  const b = findBlock(id);
  const def = BLOCKS[type];
  if (!b || !def) return;
  const preset = presetId && PRESET_BY_ID[presetId];
  const fromName = BLOCKS[b.type].name;
  const { props, moved } = convertProps(b, type, preset);
  presetUsed(presetId || type);
  picker = null;
  change(`‘${fromName}’ → ‘${preset ? preset.name : def.name}’ 바꾸기`, () => {
    const t = findBlock(id);
    t.type = type;
    t.props = props;
    delete t.minh; delete t.minhM;
    if (def.height) t.minh = def.height;
    liftHeight(t);
  });
  state.selectedId = id;
  render();
  showToast(`‘${fromName}’ 블록을 ‘${preset ? preset.name : def.name}’ 블록으로 바꿨어요.${moved ? ' 제목과 목록 글은 옮겨 왔어요.' : ''}`, '되돌리기', undo);
}
function closePicker() {
  if (!picker) return;
  picker = null;
  renderPage();
  renderInspector();
}
