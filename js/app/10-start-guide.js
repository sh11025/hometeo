/*
 * 홈터 · 편집 화면 동작 (10/12) — 내려받은 다음 · 시작 견본 · 처음 길잡이 · 사용 안내 · 파일 메뉴
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// =========================================================
// 내려받은 다음엔? (인터넷에 올리는 방법)
// =========================================================
const AFTER_KEY = 'hometeo.afterSeen';
function afterSeen() { try { return localStorage.getItem(AFTER_KEY) === '1'; } catch (e) { return false; } }
function openAfter(fromDownload) {
  const url = (state.site.info && state.site.info.url) || '';
  const el = openModal(`
    <div class="modal wide after" role="dialog" aria-modal="true" aria-labelledby="after-title">
      <div class="modal-head">
        <h2 id="after-title">${fromDownload ? '홈페이지를 받았어요! 다음엔 이렇게 해요' : '내려받은 다음엔?'}</h2>
        <button class="icon-btn" data-close aria-label="닫기">${ICON.x}</button>
      </div>
      <ol class="after-steps">
        <li><b>압축 풀기</b><span>받은 압축파일(zip)을 오른쪽 버튼으로 누르고 ‘압축 풀기’ 또는 ‘모두 추출’을 고르세요. 폴더 하나가 생겨요.</span></li>
        <li><b>내 컴퓨터에서 확인</b><span>폴더 안의 <code>index.html</code> 을 두 번 누르면 브라우저에서 열려요. 메뉴 · 버튼 · 페이지 이동을 눌러 보세요.</span></li>
        <li><b>인터넷에 올리기</b><span>아래 세 곳 중 하나를 고르세요. 모두 무료로 시작할 수 있어요. (서비스 화면의 버튼 이름은 조금 바뀔 수 있어요)</span></li>
      </ol>
      <div class="after-hosts">
        <div class="after-host best">
          <span class="ah-tag">가장 쉬워요</span>
          <h3>Netlify Drop</h3>
          <p>사이트에 들어가 가입한 다음, 압축을 푼 <b>폴더를 통째로 끌어다 놓으면</b> 바로 주소가 생겨요.</p>
          <a href="https://app.netlify.com/drop" target="_blank" rel="noopener">app.netlify.com/drop 열기</a>
        </div>
        <div class="after-host">
          <h3>Render (정적 사이트)</h3>
          <p>폴더를 GitHub에 올린 뒤, Render에서 <b>New → Static Site</b> 를 고르고 그 저장소를 이어요. 고쳐서 다시 올리면 저절로 바뀌어요.</p>
          <a href="https://render.com" target="_blank" rel="noopener">render.com 열기</a>
        </div>
        <div class="after-host">
          <h3>GitHub Pages</h3>
          <p>GitHub 저장소에 파일을 올리고 <b>Settings → Pages</b> 에서 켜면 <code>아이디.github.io</code> 주소가 생겨요.</p>
          <a href="https://pages.github.com" target="_blank" rel="noopener">pages.github.com 열기</a>
        </div>
      </div>
      <ol class="after-steps" start="4">
        <li><b>올린 뒤 할 일</b><span>받은 주소를 <b>사이트 정보 → 홈페이지 주소</b>에 적고 다시 내려받아 올리면, 카톡으로 보냈을 때 공유 사진이 제대로 보여요.${url ? ` 지금 적힌 주소: <code>${escapeHtml(url)}</code>` : ''} 내 도메인(예: mycafe.co.kr)은 각 서비스의 ‘Custom domain’ 메뉴에서 이어요.</span></li>
        <li><b>다시 고치고 싶을 때</b><span>홈터에서 로고 메뉴 → ‘작업 파일 불러오기’로 폴더 안의 <code>project.hometeo</code> 를 열면 이어서 고칠 수 있어요. 고친 뒤 다시 내려받아 올리면 돼요.</span></li>
      </ol>
      <div class="modal-foot">
        <label class="check"><input type="checkbox" data-after-hide ${afterSeen() ? 'checked' : ''}> 내려받을 때 이 안내 그만 보기</label>
        <span class="spacer"></span>
        <button class="btn btn-primary" data-close>알겠어요</button>
      </div>
    </div>`);
  el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-after-hide]')) { try { localStorage.setItem(AFTER_KEY, e.target.checked ? '1' : '0'); } catch (err) { /* 괜찮아요 */ } }
  });
}

// =========================================================
// 시작 견본 고르기
// =========================================================
const TEMPLATES = window.HOMETEO_TEMPLATES || [];
let modalOpen = null;   // 지금 열린 창 (견본 · 안내)

function templateBlocks(tpl) {
  return tidy(tpl.blocks.map((b) => liftHeight({
    id: newId('b'), type: b.type, col: 1,
    span: b.span || BLOCKS[b.type].span || COLUMNS, offset: b.offset || 0,
    ...(b.minh ? { minh: b.minh } : BLOCKS[b.type].height ? { minh: BLOCKS[b.type].height } : {}),
    ...(b.mspan ? { mspan: b.mspan } : {}),
    props: (BLOCKS[b.type].migrate || ((x) => x))(makeProps(b.type, b.props))
  })));
}
function applyTemplate(id) {
  if (id === 'blank') { startNew(); return; }
  const tpl = TEMPLATES.find((t) => t.id === id);
  if (!tpl) return;
  const had = state.blocks.length > 0;
  state.view = {};
  state.selectedId = null;
  changeSite(`견본으로 시작 · ${tpl.name}`, () => {
    const site = makeSite(templateBlocks(tpl), 0);
    if (tpl.theme) site.theme = window.HometeoTheme.normalize(tpl.theme);
    state.site = site; state.pageId = site.home;
  });
  els.stage.scrollTop = 0;
  showToast(`‘${tpl.name}’ 견본으로 시작했어요. 글자는 두 번 눌러 고치고, 사진 자리를 두 번 눌러 사진을 넣어보세요.`, had ? '되돌리기' : null, had ? undo : null);
}

function closeModal() {
  if (!modalOpen) return;
  const m = modalOpen;
  modalOpen = null;
  m.el.remove();
  if (m.onClose) m.onClose();
}
function openModal(html, opts) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.className = 'modal-back';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  modalOpen = Object.assign({ el: wrap }, opts || {});
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeModal(); });
  return wrap;
}

function openStart(first) {
  const cards = [
    `<button class="tpl-card blank" data-tpl="blank">
      <span class="tpl-art blank">${ICON.plus}</span>
      <strong>빈 페이지</strong><small>블록을 하나씩 직접 쌓아요</small>
    </button>`
  ].concat(TEMPLATES.map((t) => `
    <button class="tpl-card" data-tpl="${t.id}">
      <span class="tpl-art" style="--c1:${t.colors[0]};--c2:${t.colors[1]};--c3:${t.colors[2]}">
        <i class="a-head"></i><i class="a-hero"><b></b><b></b></i><i class="a-row"><b></b><b></b></i><i class="a-foot"></i>
      </span>
      <strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.desc)}</small>
    </button>`));
  const el = openModal(`
    <div class="modal wide" role="dialog" aria-modal="true" aria-labelledby="start-title">
      <div class="modal-head">
        <h2 id="start-title">${first ? '어떤 홈페이지를 만들까요?' : '견본으로 시작하기'}</h2>
        <button class="icon-btn" data-close aria-label="닫기">${ICON.x}</button>
      </div>
      <p class="modal-help">견본을 고르면 완성된 페이지에서 시작해요. 글자와 사진만 바꾸면 돼요.${first ? '' : ' 지금 페이지는 바뀌지만, 되돌리기로 돌아올 수 있어요.'}</p>
      <div class="tpl-grid">${cards.join('')}</div>
    </div>`, { onClose: first ? maybeGuide : null });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const c = e.target.closest('[data-tpl]');
    if (!c) return;
    closeModal();
    applyTemplate(c.dataset.tpl);
  });
  el.querySelector('.tpl-card:not(.blank)') && el.querySelector('.tpl-card:not(.blank)').focus();
}

// =========================================================
// 처음 사용 안내 (처음 한 번만 저절로 떠요)
// =========================================================
const GUIDE_KEY = 'hometeo.guideSeen';
function guideSeen() { try { return localStorage.getItem(GUIDE_KEY) === '1'; } catch (e) { return true; } }
function markGuideSeen() { try { localStorage.setItem(GUIDE_KEY, '1'); } catch (e) { /* 저장이 안 되면 다음에 또 보여요 */ } }
function maybeGuide() { if (!guideSeen()) setTimeout(startTour, 250); }

// ---------- 처음 길잡이: 화면 위에서 네 군데를 차례로 짚어 줘요 ----------
const TOUR = [
  { at: '#btn-file-menu', title: '견본 고르기', text: '로고를 누르면 ‘견본으로 시작하기’가 있어요. 여러 페이지가 이어진 견본은 ‘사이트 지도 → 여러 페이지 견본’에서 골라요. 언제든 되돌리기(Ctrl + Z)로 돌아올 수 있어요.' },
  { at: () => els.paper.querySelector('.zone-banner > .blk') || els.paper.querySelector('.zone-main > .blk') || els.paper.querySelector('.blk'), title: '글 · 사진 바꾸기', text: '글자는 두 번 눌러 바로 고쳐요. 사진 자리를 두 번 누르면 사진을 넣어요. 블록을 한 번 누르면 오른쪽 설정에서 자세히 바꿀 수 있어요.' },
  { at: '[data-page-act="theme"]', title: '색 고르기', text: '‘사이트 꾸미기’에서 색과 글꼴을 한 번에 바꿔요. 좋아하는 색 하나만 고르면 어울리는 조합을 만들어 드려요. 로고 사진에서 색을 뽑을 수도 있어요.' },
  { at: '#btn-download', title: '내려받기', text: '다 만들면 ‘내려받기’를 눌러요. 빠뜨린 것(견본 글 · 빈 링크 등)을 먼저 점검해 드리고, 인터넷에 올리는 방법도 알려 드려요.' }
];
let tourEl = null;
function endTour() { if (tourEl) { tourEl.remove(); tourEl = null; } markGuideSeen(); window.removeEventListener('resize', tourPlace); }
let tourStep = 0;
function tourTarget() {
  const st = TOUR[tourStep];
  return typeof st.at === 'function' ? st.at() : document.querySelector(st.at);
}
function tourPlace() {
  if (!tourEl) return;
  const el = tourTarget();
  const hole = tourEl.querySelector('.tour-hole'), tip = tourEl.querySelector('.tour-tip');
  if (!el) { hole.style.cssText = 'left:50%;top:40%;width:0;height:0'; tip.style.cssText = 'left:calc(50% - 170px);top:40%'; return; }
  el.scrollIntoView({ block: 'nearest' });
  const r = el.getBoundingClientRect();
  const pad = 6;
  const box = { x: Math.max(4, r.left - pad), y: Math.max(4, r.top - pad), w: Math.min(r.width + pad * 2, innerWidth - 8), h: Math.min(r.height + pad * 2, innerHeight * 0.5) };
  hole.style.cssText = `left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px`;
  const tw = 340;
  const below = box.y + box.h + 12;
  const left = Math.min(Math.max(12, box.x + box.w / 2 - tw / 2), innerWidth - tw - 12);
  tip.style.cssText = below + 200 < innerHeight ? `left:${left}px;top:${below}px` : `left:${left}px;top:${Math.max(12, box.y - 12)}px;transform:translateY(-100%)`;
}
function startTour() {
  if (modalOpen) closeModal();
  if (tourEl) tourEl.remove();
  if (state.mode === 'map') setMode('edit');
  tourStep = 0;
  tourEl = document.createElement('div');
  tourEl.className = 'tour';
  tourEl.innerHTML = `<div class="tour-hole"></div>
    <div class="tour-tip" role="dialog" aria-live="polite" aria-labelledby="tour-title">
      <span class="tour-step" data-tstep></span>
      <h3 id="tour-title" data-ttitle></h3>
      <p data-ttext></p>
      <div class="tour-foot">
        <button class="btn btn-ghost-plain small" data-t="skip">건너뛰기</button>
        <span class="spacer"></span>
        <button class="btn small" data-t="prev">이전</button>
        <button class="btn btn-primary small" data-t="next">다음</button>
      </div>
    </div>`;
  document.body.appendChild(tourEl);
  const paint = () => {
    const st = TOUR[tourStep];
    tourEl.querySelector('[data-tstep]').textContent = `처음 길잡이 ${tourStep + 1} / ${TOUR.length}`;
    tourEl.querySelector('[data-ttitle]').textContent = st.title;
    tourEl.querySelector('[data-ttext]').textContent = st.text;
    tourEl.querySelector('[data-t="prev"]').disabled = tourStep === 0;
    tourEl.querySelector('[data-t="next"]').textContent = tourStep === TOUR.length - 1 ? '시작하기' : '다음';
    tourPlace();
  };
  tourEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    if (b.dataset.t === 'skip') return endTour();
    if (b.dataset.t === 'prev' && tourStep > 0) tourStep--;
    if (b.dataset.t === 'next') { if (tourStep === TOUR.length - 1) return endTour(); tourStep++; }
    paint();
  });
  window.addEventListener('resize', tourPlace);
  const onKey = (e) => { if (!tourEl) { document.removeEventListener('keydown', onKey, true); return; } if (e.key === 'Escape') { e.stopPropagation(); endTour(); document.removeEventListener('keydown', onKey, true); } };
  document.addEventListener('keydown', onKey, true);
  paint();
  tourEl.querySelector('[data-t="next"]').focus();
}

// ---------- 사용 안내 (기능별로 차근차근) ----------
const GUIDE = [
  { id: 'start', title: '시작하기', items: [
    ['견본으로 시작', '처음 화면이나 로고 메뉴의 ‘견본으로 시작하기’에서 카페 · 병원 · 학원 · 개인 소개를 골라요. 글자와 사진만 바꾸면 돼요.'],
    ['여러 페이지 한 번에', '‘사이트 지도 → 여러 페이지 견본’을 고르면 가게 · 병원 · 회사 소개처럼 여러 페이지가 맨 위 메뉴까지 이어진 채로 시작해요.'],
    ['저절로 저장', '고칠 때마다 이 컴퓨터의 브라우저에 저절로 저장돼요. 다른 컴퓨터로 옮기려면 로고 메뉴 → ‘작업 파일로 저장’(.hometeo 파일)을 써요.'],
    ['되돌리기', 'Ctrl + Z 로 되돌리고 Ctrl + Y 로 다시 해요. 견본을 바꿔도 되돌리기로 돌아올 수 있어요.']
  ] },
  { id: 'blocks', title: '블록 넣고 고치기', items: [
    ['블록 넣기', '본문 블록 사이의 + 를 누르면 오른쪽에 블록 목록이 나와요. 눌러서 넣거나 페이지로 끌어다 놓아요.'],
    ['글 · 사진 고치기', '글자는 두 번 눌러 바로 고쳐요. 사진 자리를 두 번 누르거나 사진 파일을 블록에 끌어다 놓으면 사진이 들어가요.'],
    ['너비 · 높이', '블록 오른쪽 끝 손잡이로 너비를, 아래쪽 손잡이로 높이를 바꿔요. 너비 합이 12칸 이하면 나란히 붙어요.'],
    ['복사', '블록 이름표의 복사 버튼이나 Ctrl + D. 다른 페이지로 복사하려면 설정 → 더보기에서 골라요.'],
    ['휴대폰 따로', '맨 위 PC | 휴대폰 버튼으로 바꿔 보고, 블록 설정 → 더보기에서 휴대폰 높이 · 사진 위치를 따로 맞춰요.'],
    ['설정 칸 접기', '오른쪽 위 접기 버튼으로 설정 칸을 접어 편집 화면을 넓게 써요. 블록을 고르면 다시 펼쳐져요. 작은 화면에서는 저절로 접혀요.']
  ] },
  { id: 'pages', title: '페이지와 사이트 지도', items: [
    ['새 페이지', '페이지 막대의 ‘새 페이지’에서 빈 페이지나 페이지 견본(소개 · 메뉴 · 오시는 길 · 공지사항 · 예약 · 회원가입 · 개인정보 처리방침 · 404 등)을 골라요.'],
    ['저절로 잇기', '페이지 견본과 이름이 같은 메뉴(예: ‘오시는 길’)가 비어 있으면 저절로 그 페이지와 이어요.'],
    ['사이트 지도', '페이지 카드와 연결선이 보여요. 카드 오른쪽 동그라미를 다른 카드로 끌면 버튼 · 메뉴로 이어져요. 노란 카드는 찾아갈 방법이 없는 페이지예요.'],
    ['메모', '지도에 스티커 메모를 붙일 수 있어요. 홈페이지에는 들어가지 않아요.']
  ] },
  { id: 'theme', title: '색 · 글꼴 꾸미기', items: [
    ['추천 색 묶음', '‘사이트 꾸미기’에서 색 계열(빨강 · 초록 · 파랑 / 청록 · 자홍 · 노랑 / 그 밖의 색)을 고르면 밝은 · 차분한 · 진한 · 어두운 묶음이 미리보기로 나와요.'],
    ['색 조합 찾기', '좋아하는 색 하나(또는 로고 사진에서 뽑은 색)를 고르면 한 가지 색 · 비슷한 색 · 반대 색 · 반대 색 양옆 · 세 가지 고르게 조합을 만들어 드려요. ‘다시 섞기’로 밝기를 바꿔 봐요.'],
    ['자물쇠', '마음에 드는 색은 자물쇠로 고정해요. 다른 묶음을 골라도 그 색은 그대로예요.'],
    ['색 번호', '‘색 직접 고르기’에서 HEX · RGB 번호로 넣을 수 있어요. (도구 설정의 ‘전문 용어 함께 보기’를 켜면 인쇄용 CMYK 번호도 보여요)'],
    ['글자 안 보임 알림', '바탕과 글자색이 비슷하면 알려 드려요. ‘추천 색으로 바꾸기’를 누르면 밝기만 고쳐요.'],
    ['내 글꼴', '‘내 글꼴 올리기’로 woff2 · woff · ttf · otf 파일을 넣어요. 홈페이지에 써도 되는 글꼴인지 꼭 확인하고 표시해 주세요.']
  ] },
  { id: 'info', title: '사이트 정보 · 사업자 정보', items: [
    ['사이트 정보', '페이지 막대의 ‘사이트 정보’에서 이름 · 한 줄 소개 · 카톡 공유 사진(1200×630) · 작은 아이콘을 넣어요. 검색 결과와 카톡 미리보기에 쓰여요.'],
    ['사업자 정보', '맨 아래 정보 블록 → 설정에서 상호 · 대표자 · 사업자등록번호 · 통신판매업 신고번호 · 주소 · 전화 · 이메일을 칸마다 적어요. 쓴 칸만 보여요.'],
    ['개인정보 처리방침', '페이지 견본의 ‘개인정보 처리방침 · 이용약관’은 사업자 정보로 채워져요. 견본 문구라서 우리에게 맞게 꼭 고쳐 주세요.'],
    ['문의 양식', '구글 설문지 · 네이버 폼 주소를 넣는 방법을 추천해요. ‘메일로 받기’는 손님 컴퓨터에 메일 프로그램이 없으면 동작하지 않을 수 있어요.']
  ] },
  { id: 'check', title: '점검하고 내려받기', items: [
    ['빠뜨린 것 점검', '내려받기를 누르면 먼저 점검해요. 빨강은 꼭 고치고, 노랑은 고치면 좋아요. 항목을 누르면 그 자리로 가요. 로고 메뉴 → ‘빠뜨린 것 점검’으로 언제든 볼 수 있어요.'],
    ['찾아 주는 것', '견본 글 · 가짜 번호(○○, 000-0000), 갈 곳 없는 버튼, 연결 안 된 페이지, 빈 사이트 정보, 사진 설명, 잘 안 보이는 글자, 비어 있는 폼 주소, 사용 확인 안 한 내 글꼴'],
    ['받은 파일', '압축파일 안에 페이지(index.html 등) · images · fonts · css · js 폴더와 작업 파일(project.hometeo)이 들어 있어요.']
  ] },
  { id: 'upload', title: '인터넷에 올리기', items: [
    ['Render (정적 사이트)', '압축을 푼 폴더를 GitHub 저장소에 올리고, Render에서 New → Static Site → 그 저장소를 골라요. Publish directory 는 비워 두거나 . 으로 둬요.'],
    ['더 쉽게', 'Netlify Drop(app.netlify.com/drop)에 폴더를 끌어다 놓으면 바로 주소가 생겨요. GitHub Pages 도 돼요.'],
    ['올린 뒤', '받은 주소를 사이트 정보 → 홈페이지 주소에 적고 다시 내려받아 올리면 카톡 공유 사진이 제대로 보여요.'],
    ['다시 고칠 때', '로고 메뉴 → 작업 파일 불러오기 → 폴더 안의 project.hometeo 를 열어요.']
  ] },
  { id: 'login', title: '로그인 연결하기', items: [
    ['왜 모양만 있나요?', '홈터 홈페이지는 파일로만 되어 있어서, 아이디 · 비밀번호를 확인하고 기억해 둘 곳(서버)이 없어요. 그래서 로그인 칸 · 회원가입 페이지는 모양만 있고, 손님이 누르면 ‘아직 연결되지 않았어요’ 안내가 나와요.'],
    ['가장 쉬운 방법: 로그인 없이', '회원만 보는 내용이 꼭 필요하지 않다면 로그인 칸을 빼요. 회원 공간이 필요하면 네이버 카페 · 밴드 · 카카오톡 채널을 만들고, 메뉴나 버튼의 ‘누르면 갈 곳’에 그 주소를 적어요.'],
    ['회원 관리 서비스 쓰기 (개발자 도움)', '회원 가입 · 로그인을 대신 해 주는 서비스를 쓰면 이 홈페이지에 로그인을 붙일 수 있어요. 개발자에게 부탁해 서비스에서 받은 ‘로그인 주소’를 로그인 칸 설정 → 더보기 → ‘로그인 연결 (개발자용)’에 넣어요.'],
    ['개발자가 직접 연결', '내려받은 파일 안의 ‘홈터 · 로그인 연결 자리’ 안내를 봐요. 보내는 이름은 username(아이디) · password(비밀번호) · remember(로그인 상태 유지), 보내는 방식은 POST예요. 주소를 넣으면 ‘모양만 있어요’ 표시가 사라져요.'],
    ['꼭 지켜요', '비밀번호를 받으려면 주소가 https 로 시작해야 하고(Render는 저절로 돼요), 개인정보 처리방침 페이지가 있어야 해요. 페이지 견본에 ‘개인정보 처리방침’이 있어요.'],
    ['더 자세히', '홈터 폴더의 ‘로그인_연결_안내.md’ 파일에 같은 내용을 더 자세히 적어 두었어요.']
  ] }
];
function openGuide(sec) {
  let cur = sec || 'start';
  const el = openModal(`
    <div class="modal wide guide2" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div class="modal-head">
        <h2 id="guide-title">사용 안내</h2>
        <button class="icon-btn" data-close aria-label="닫기">${ICON.x}</button>
      </div>
      <div class="g2">
        <nav class="g2-nav">${GUIDE.map((g, i) => `<button data-gsec="${g.id}"><b>${i + 1}</b>${g.title}</button>`).join('')}</nav>
        <div class="g2-body" data-gbody></div>
      </div>
      <div class="modal-foot">
        <button class="btn" data-g="tour">처음 길잡이 다시 보기</button>
        <button class="btn" data-g="after">내려받은 다음엔?</button>
        <span class="spacer"></span>
        <button class="btn btn-primary" data-close>알겠어요</button>
      </div>
    </div>`, { onClose: markGuideSeen });
  const paint = () => {
    const g = GUIDE.find((x) => x.id === cur) || GUIDE[0];
    el.querySelectorAll('[data-gsec]').forEach((b) => b.classList.toggle('is-on', b.dataset.gsec === g.id));
    el.querySelector('[data-gbody]').innerHTML = `<h3>${g.title}</h3><dl>${g.items.map(([t, d]) => `<dt>${escapeHtml(t)}</dt><dd>${escapeHtml(d)}</dd>`).join('')}</dl>`;
    el.querySelector('[data-gbody]').scrollTop = 0;
  };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const sb = e.target.closest('[data-gsec]');
    if (sb) { cur = sb.dataset.gsec; paint(); return; }
    const gb = e.target.closest('[data-g]');
    if (gb && gb.dataset.g === 'tour') { closeModal(); startTour(); }
    if (gb && gb.dataset.g === 'after') { closeModal(); openAfter(false); }
  });
  paint();
}

// ---------- 파일 메뉴 ----------
function toggleFileMenu(open) {
  const show = open == null ? els.fileMenu.hidden : open;
  els.fileMenu.hidden = !show;
  els.fileMenuBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
}
els.fileMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFileMenu(); });
document.addEventListener('click', (e) => {
  if (!els.fileMenu.hidden && !e.target.closest('#file-menu')) toggleFileMenu(false);
});
els.fileMenu.addEventListener('click', (e) => {
  const item = e.target.closest('[data-file]');
  if (!item) return;
  toggleFileMenu(false);
  if (item.dataset.file === 'save') saveProjectFile();
  if (item.dataset.file === 'open') {
    const adm = normAdmin(state.site.admin);
    if (!adm.owner || !adm.repo) { projectPicker.click(); return; }
    const el = openModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="open-title">
        <div class="modal-head"><h2 id="open-title">어디서 불러올까요?</h2><button class="icon-btn" data-close aria-label="닫기">${ICON.x}</button></div>
        <p class="modal-help">사장님이 관리자 화면에서 고친 적이 있다면 ‘보관함의 최신 내용’을 불러와서 그 위에서 고쳐요. 그래야 사장님이 고친 내용을 덮어쓰지 않아요.</p>
        <div class="row-btns" style="flex-direction:column;align-items:stretch">
          <button class="btn btn-primary" data-open-repo>보관함의 최신 내용 (${escapeHtml(adm.repo)})</button>
          <button class="btn" data-open-file>내 컴퓨터의 작업 파일 (.hometeo)</button>
        </div>
      </div>`);
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-close]')) closeModal();
      if (ev.target.closest('[data-open-repo]')) { closeModal(); loadFromRepo(); }
      if (ev.target.closest('[data-open-file]')) { closeModal(); projectPicker.click(); }
    });
  }
  if (item.dataset.file === 'new') startNew();
  if (item.dataset.file === 'download') downloadSite();
  if (item.dataset.file === 'download-admin') downloadSite(false, true);
  if (item.dataset.file === 'template') openStart(false);
  if (item.dataset.file === 'guide') openGuide();
  if (item.dataset.file === 'after') openAfter(false);
  if (item.dataset.file === 'info') openInfo();
  if (item.dataset.file === 'check') openCheck(false);
  if (item.dataset.file === 'tour') startTour();
});
els.download.addEventListener('click', () => downloadSite());
