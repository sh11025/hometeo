/*
 * 홈터 · 편집 화면 동작 (4/12) — 관리자 화면 꾸미기 · 따라 하기 안내
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// ---------- 관리자 화면 꾸미기 (고르는 방식 · 내용은 홈페이지와 저절로 이어져요) ----------
function adminDesignHtml(adm) {
  const U = ADM_UI();
  const ui = U.normUI(adm.ui);
  const TH = window.HometeoTheme;
  const t = TH.normalize(state.site.theme);
  const sw = (c, l) => `<span class="adm-sw" style="background:${c}" title="${l}"></span>`;
  const move = (attr, i, len) => `
    <button class="icon-btn" ${attr}="${i}" data-dir="-1" title="위로" aria-label="위로"${i === 0 ? ' disabled' : ''}>${ICON.up}</button>
    <button class="icon-btn" ${attr}="${i}" data-dir="1" title="아래로" aria-label="아래로"${i === len - 1 ? ' disabled' : ''}>${ICON.down}</button>`;
  const pickables = U.pickables(state.site, BLOCKS);
  const pgName = (pid) => (pid === 'shared' ? '모든 페이지' : ((state.site.pages.find((x) => x.id === pid) || {}).name || ''));
  const quickLabel = (q) => {
    const r = U.resolveQuick(state.site, q, BLOCKS);
    if (!r) return null;
    return `${pgName(r.pageId)} · ${U.blockName(r.block.type)} · ${r.field ? r.field.label : r.list.label + ' 목록'}`;
  };
  const chosen = new Set(ui.quick.map((q) => q.blockId + '|' + q.path));
  const groups = {};
  pickables.forEach((x) => { if (!chosen.has(x.blockId + '|' + x.path)) (groups[x.pageId] = groups[x.pageId] || []).push(x); });
  const order = ['shared', ...state.site.pages.map((x) => x.id)].filter((k) => groups[k]);
  return `
    <div class="insp-scroll">
      <div class="admin-panel-intro">
        <p>사장님이 보는 관리자 화면의 모양을 골라요. 안의 글 · 사진은 홈페이지와 저절로 이어져요.</p>
        <p class="admin-tip">색과 글꼴은 홈페이지 테마를 그대로 따라가요 ${sw(t.dark, '메뉴 바탕')}${sw(t.point, '중요한 버튼')}${sw(t.bg, '바탕')}</p>
      </div>
      <button class="btn btn-wide adm-preview-btn" data-adm-preview>${ICON.eye}관리자 화면 미리보기</button>
      <p class="field-help">새 탭에서 지금 꾸민 모습을 보여줘요. 여기서 바꾸면 미리보기도 바로 바뀌어요.</p>

      <section class="field">
        <h3 class="field-title">배치</h3>
        <div class="adm-layouts">
          ${U.LAYOUTS.map((l) => `<button class="adm-layout${ui.layout === l.id ? ' is-on' : ''}" data-adm-layout="${l.id}" aria-pressed="${ui.layout === l.id}">
            <span class="adm-layout-pic is-${l.id}"><i></i><b></b><b></b><b></b></span>
            <strong>${escapeHtml(l.name)}</strong><small>${escapeHtml(l.desc)}</small>
          </button>`).join('')}
        </div>
        <p class="field-help">휴대폰에서는 어떤 배치든 메뉴가 ≡ 버튼으로 접히고, 카드는 한 줄에 하나씩 보여요.</p>
      </section>

      <section class="field">
        <h3 class="field-title">첫 화면 카드 <small>켜고 끄기 · 순서</small></h3>
        <ul class="adm-rows">
          ${ui.cards.map((c, i) => { const d = U.CARDS.find((k) => k.type === c.type); return `<li class="adm-row">
            <label class="adm-check"><input type="checkbox" data-adm-card-on="${c.type}"${c.on ? ' checked' : ''}><span><b>${escapeHtml(d.name)}</b><small>${escapeHtml(d.desc)}</small></span></label>
            <span class="adm-row-tools">${move('data-adm-card-move', i, ui.cards.length)}</span>
          </li>`; }).join('')}
        </ul>
      </section>

      <section class="field">
        <h3 class="field-title">메뉴 <small>순서 · 이름 · 숨기기</small></h3>
        <ul class="adm-rows">
          ${ui.menu.map((m, i) => { const d = U.MENU.find((k) => k.id === m.id); return `<li class="adm-row">
            <input class="input" type="text" data-adm-menu-label="${m.id}" value="${escapeHtml(m.label)}" placeholder="${escapeHtml(d.label)}" aria-label="${escapeHtml(d.label)} 메뉴 이름" maxlength="20">
            <label class="adm-hide" title="${d.fixed ? '꼭 있어야 하는 메뉴라 숨길 수 없어요' : '사장님 화면에서 숨기기'}"><input type="checkbox" data-adm-menu-hide="${m.id}"${m.hidden ? ' checked' : ''}${d.fixed ? ' disabled' : ''}><span>${d.fixed ? '🔒 고정' : '숨기기'}</span></label>
            <span class="adm-row-tools">${move('data-adm-menu-move', i, ui.menu.length)}</span>
          </li>`; }).join('')}
        </ul>
        <p class="field-help">‘페이지’ 자리에는 홈페이지의 페이지들이 차례대로 들어가요. 열쇠 · 도움말 · 사이트에 반영하기 버튼은 늘 보여요.</p>
      </section>

      <section class="field">
        <h3 class="field-title">자주 고치는 곳 <small>첫 화면에서 바로 고쳐요</small></h3>
        ${ui.quick.length ? `<ul class="adm-rows">${ui.quick.map((q, i) => { const l = quickLabel(q); return `<li class="adm-row${l ? '' : ' is-missing'}">
            <span class="adm-row-text">${l ? escapeHtml(l) : '지워진 블록이에요'}</span>
            <span class="adm-row-tools">${move('data-adm-quick-move', i, ui.quick.length)}<button class="icon-btn" data-adm-quick-del="${i}" title="빼기" aria-label="빼기">${ICON.x}</button></span>
          </li>`; }).join('')}</ul>` : '<p class="field-help" style="margin-top:0">아직 없어요. 아래에서 골라 담아요.</p>'}
        <div class="adm-add-row">
          <select class="input" id="adm-quick-pick" aria-label="자주 고치는 곳 고르기">
            <option value="">페이지 · 블록 · 칸 고르기</option>
            ${order.map((pid) => `<optgroup label="${escapeHtml(pgName(pid))}">${groups[pid].map((x) => `<option value="${escapeHtml(x.pageId + '|' + x.blockId + '|' + x.path)}">${escapeHtml(U.blockName(x.type) + ' · ' + x.label)}</option>`).join('')}</optgroup>`).join('')}
          </select>
          <button class="btn" data-adm-quick-add>${ICON.plus}담기</button>
        </div>
        <p class="field-help">사장님이 고칠 수 있는 칸만 보여요. 예: 영업시간 표, 공지 글, 메뉴 가격.</p>
      </section>

      <section class="field">
        <h3 class="field-title">처음 할 일</h3>
        <ul class="adm-rows is-plain">
          ${U.TODO_BASE.map((x) => `<li class="adm-row is-base"><span class="adm-row-text">✓ ${escapeHtml(x.label)}</span><small>저절로 체크돼요</small></li>`).join('')}
          ${ui.todo.map((x, i) => `<li class="adm-row">
            <input class="input" type="text" data-adm-todo-label="${i}" value="${escapeHtml(x.label)}" maxlength="60" aria-label="할 일 ${i + 1}">
            <span class="adm-row-tools"><button class="icon-btn" data-adm-todo-del="${i}" title="빼기" aria-label="빼기">${ICON.x}</button></span>
          </li>`).join('')}
        </ul>
        <div class="adm-add-row">
          <input class="input" type="text" id="adm-todo-new" placeholder="예: 영업시간 확인하기" maxlength="60" aria-label="새 할 일">
          <button class="btn" data-adm-todo-add>${ICON.plus}더하기</button>
        </div>
        <p class="field-help">사장님이 직접 눌러서 체크해요.</p>
      </section>

      <section class="field">
        <h3 class="field-title">사장님께 메모</h3>
        <textarea class="input adm-memo" data-adm-memo rows="3" maxlength="600" placeholder="예: 가격이 바뀌면 ‘메뉴’ 페이지에서 고쳐 주세요.">${escapeHtml(ui.memo)}</textarea>
      </section>
    </div>`;
}

// ---------- 따라 하기 안내 (보관함 2개 · Render · 열쇠 · 전하기) ----------
function adminGuideHtml(adm) {
  return `
    <div class="insp-scroll">
      <div>
        <!-- 따라 하기 안내 (5단계) -->
        <div class="admin-guide-box" id="admin-guide-box">
          <div class="admin-guide-header">
            <h4>📖 따라 하기 안내</h4>
            <small>처음이어도 괜찮아요! 순서대로 따라 하면 홈페이지와 관리자 화면을 올릴 수 있어요.</small>
          </div>

          <!-- 1단계 -->
          <details class="guide-step" data-step="1">
            <summary>
              <span class="guide-step-title">① GitHub에 보관함 2개 만들기</span>
              <label class="guide-check-wrap" onclick="event.stopPropagation()">
                <input type="checkbox" data-guide-step="1" ${adm.guideSteps?.['1'] ? 'checked' : ''}>
                <span>다 했어요</span>
              </label>
            </summary>
            <div class="guide-step-body">
              <p>GitHub(github.com)에 로그인한 뒤 보관함(Repository)을 2개 만들어요.</p>
              <ul class="guide-list">
                <li><b>홈페이지 보관함</b>: <code>Public</code> (누구나 볼 수 있게) 으로 만들고, 홈터에서 내려받은 홈페이지 압축파일을 풀어서 나온 파일들과 <code>project.hometeo</code>를 올려요.</li>
                <li><b>관리자 보관함</b>: <code>Private</code> (나만 볼 수 있게) 으로 만들고, 관리자 화면 묶음 압축파일을 풀어 그대로 올려요.</li>
              </ul>
            </div>
          </details>

          <!-- 2단계 -->
          <details class="guide-step" data-step="2">
            <summary>
              <span class="guide-step-title">② Render에 각각 올리기</span>
              <label class="guide-check-wrap" onclick="event.stopPropagation()">
                <input type="checkbox" data-guide-step="2" ${adm.guideSteps?.['2'] ? 'checked' : ''}>
                <span>다 했어요</span>
              </label>
            </summary>
            <div class="guide-step-body">
              <p>Render(render.com)에 로그인하고 두 보관함을 각각 올려 인터넷 주소를 만들어요.</p>
              <ul class="guide-list">
                <li>버튼 누르기: <code>New → Static Site</code> (새로 만들기 → 그냥 파일만 올리는 사이트)를 누르고 보관함을 골라요.</li>
                <li>칸 채우기:
                  <br>• <code>Build Command</code>: (비워 두세요)
                  <br>• <code>Publish Directory</code>: (./ 그대로 두세요)
                </li>
                <li>💡 <b>안내</b>: 관리자 보관함은 나만 볼 수 있는 비공개(Private) 보관함이라서 GitHub Pages에는 올릴 수 없고, Render로 올려야 안전하게 작동해요.</li>
              </ul>
            </div>
          </details>

          <!-- 3단계 -->
          <details class="guide-step" data-step="3">
            <summary>
              <span class="guide-step-title">③ 열쇠 만들기</span>
              <label class="guide-check-wrap" onclick="event.stopPropagation()">
                <input type="checkbox" data-guide-step="3" ${adm.guideSteps?.['3'] ? 'checked' : ''}>
                <span>다 했어요</span>
              </label>
            </summary>
            <div class="guide-step-body">
              <p>사장님이 관리자 화면에서 글과 사진을 고쳐 사이트에 올릴 수 있도록 GitHub에서 안전한 열쇠를 만들어요.</p>
              <ul class="guide-list">
                <li>GitHub 오른쪽 위 프로필 → <code>Settings</code> (설정) → 왼쪽 맨 아래 <code>Developer settings</code> (개발자 설정) → <code>Personal access tokens</code> (개인 접속 열쇠) → <code>Fine-grained tokens</code> (보관함 하나만 여는 열쇠) 순서로 들어가요.</li>
                <li><code>Only select repositories</code>를 누르고, 방금 만든 <b>홈페이지 보관함 하나만</b> 골라요. (관리자 보관함은 고르지 마세요)</li>
                <li><code>Repository permissions</code>에서 <code>Contents</code>를 찾아 <code>Access: Read and write</code> (내용 읽고 고치기 허락)로 바꿔요. 나머지는 손대지 않아요.</li>
                <li><code>Expiration</code> (열쇠 쓸 수 있는 기간)을 정해요. 유효기간이 끝나기 전에 새 열쇠를 만들어 드려야 관리자 화면이 계속 작동해요.</li>
                <li>맨 아래 <code>Generate token</code>을 누르고 나온 영문·숫자 열쇠를 복사해요. (이 창을 닫으면 다시 볼 수 없어요!)</li>
              </ul>
            </div>
          </details>

          <!-- 4단계 -->
          <details class="guide-step" data-step="4">
            <summary>
              <span class="guide-step-title">④ 사장님께 전하기</span>
              <label class="guide-check-wrap" onclick="event.stopPropagation()">
                <input type="checkbox" data-guide-step="4" ${adm.guideSteps?.['4'] ? 'checked' : ''}>
                <span>다 했어요</span>
              </label>
            </summary>
            <div class="guide-step-body">
              <p>사이트를 직접 고치실 사장님께 관리자 접속 정보를 알려드려요.</p>
              <ul class="guide-list">
                <li>전해드릴 내용: <b>관리자 화면 인터넷 주소</b> + <b>3단계에서 만든 열쇠</b></li>
                <li>🔒 <b>보안 권장</b>: 열쇠는 메신저 대화방에 오래 남기지 마시고, 사장님이 관리자 화면에 등록하신 뒤 대화방에서 지우기를 권해드려요.</li>
              </ul>
            </div>
          </details>

          <!-- 5단계 -->
          <details class="guide-step" data-step="5">
            <summary>
              <span class="guide-step-title">⑤ 관리자 화면 받을 때 적는 칸 확인</span>
              <label class="guide-check-wrap" onclick="event.stopPropagation()">
                <input type="checkbox" data-guide-step="5" ${adm.guideSteps?.['5'] ? 'checked' : ''}>
                <span>다 했어요</span>
              </label>
            </summary>
            <div class="guide-step-body">
              <p>‘내려받기’ 창의 ② (관리자 화면도 받기)를 펼친 칸에 적는 정보가 맞는지 확인해 주세요. (한 번 적으면 기억해요)</p>
              <ul class="guide-list">
                <li><b>GitHub 아이디</b>: 홈페이지 보관함을 만든 GitHub 계정 아이디가 맞나요? (예: my-name)</li>
                <li><b>홈페이지 보관함 이름</b>: ①에서 만든 공개(Public) 보관함 이름이 맞나요? (예: my-shop)</li>
                <li><b>홈페이지 주소</b>: Render에 올린 손님용 실제 사이트 주소가 맞나요? (몰라도 비워 두고 나중에 다시 받아도 돼요)</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>`;
}
// 관리자 화면 미리보기: 새 탭에 admin/index.html?preview 를 열고 지금 작업 내용을 보내요
let adminPreviewWin = null;
function openAdminPreview() {
  syncOut();
  try { adminPreviewWin = window.open('admin/index.html?preview=1', 'hometeo-admin-preview'); } catch (e) { adminPreviewWin = null; }
  if (!adminPreviewWin) { showToast('새 탭이 막혔어요. 브라우저 주소창 오른쪽에서 팝업을 허용해 주세요.'); return; }
  setTimeout(sendAdminPreview, 600);
}
function sendAdminPreview() {
  if (!adminPreviewWin || adminPreviewWin.closed) return;
  try {
    const target = location.protocol === 'file:' ? '*' : location.origin;
    adminPreviewWin.postMessage({ type: 'hometeo-admin-preview', project: projectData(), siteUrl: normAdmin(state.site.admin).siteUrl }, target);
  } catch (e) { /* 미리보기 창이 아직 준비 안 됐어요 */ }
}
window.addEventListener('message', (e) => {
  if (!adminPreviewWin || e.source !== adminPreviewWin) return;
  if (e.data && e.data.type === 'hometeo-admin-preview-ready') sendAdminPreview();
});

// 사이트 정보에서 바로 블록 넣기: 지도는 가게 주소 · 전화로 채워요
function infoAddBlock(type) {
  const v = ADM_UI().bizValues(state.site);
  const b = makeBlock(type);
  if (type === 'map') { b.props.address = v.address || b.props.address; b.props.phone = v.phone || ''; }
  change(type === 'map' ? '오시는 길 지도 넣기' : '영업시간 넣기', () => { state.blocks.push(b); });   // tidy()가 본문 맨 끝으로 보내줘요
  sidePanel = null; state.selectedId = b.id; render();
  showToast(type === 'map' ? '이 페이지 아래쪽에 지도를 넣었어요.' : '이 페이지 아래쪽에 영업시간을 넣었어요. 시간을 고쳐 주세요.');
}
function openInfo() { finishEdit(true); picker = null; state.selectedId = null; sidePanel = 'info'; render(); els.inspector.scrollTop = 0; }
function setInfo(label, fn) {
  changeSite(label, () => { const inf = Object.assign(newInfo(), state.site.info || {}); fn(inf); state.site.info = normInfo(inf); });
}
// 사이트 사진 (공유 사진 · 아이콘) 넣기
async function putSiteImage(key, file, alpha) {
  if (!file) return;
  try {
    const r = await shrinkImage(file, alpha);
    const id = newId('img');
    state.assets[id] = r.dataUrl;
    setInfo(key === 'icon' ? '아이콘 넣기' : '공유 사진 넣기', (inf) => { inf[key] = id; });
    showToast(key === 'icon' ? '아이콘을 넣었어요.' : '공유 사진을 넣었어요.');
  } catch (e) { showToast('이 사진은 열 수 없어요. JPG나 PNG 사진으로 넣어주세요.'); }
}

function openTheme() { finishEdit(true); picker = null; state.selectedId = null; sidePanel = 'theme'; render(); els.inspector.scrollTop = 0; }
function closeTheme() { if (!sidePanel) return; sidePanel = null; renderPageBar(); renderInspector(); }
function setTheme(label, fn) {
  useFonts();
  changeSite(label, () => {
    const t = JSON.parse(JSON.stringify(window.HometeoTheme.normalize(state.site.theme)));
    fn(t);
    state.site.theme = window.HometeoTheme.normalize(t);
  });
}

// 색 묶음 · 조합을 사이트 색에 넣어요 (자물쇠로 고정한 색은 그대로)
function applyColors(t, src) {
  ['bg', 'point', 'dark'].forEach((k) => { if (!themeLocks[k]) t[k] = src[k]; });
  if (!themeLocks.bg) t.text = src.text || '';
  const f = window.HometeoTheme.fixColors(t);   // 고정한 색과 섞여도 글자가 잘 보이게
  ['bg', 'point', 'dark'].forEach((k) => { if (!themeLocks[k]) t[k] = f[k]; });
  t.text = f.text;
}
// 색 번호(HEX · RGB · CMYK)로 넣기
function applyColorCode() {
  const TH = window.HometeoTheme;
  const key = els.inspector.querySelector('[data-code-key]').value;
  const kind = els.inspector.querySelector('[data-code-kind]').value;
  const raw = els.inspector.querySelector('[data-code-val]').value.trim();
  const nums = (raw.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  let hex = null;
  if (kind === 'hex') { const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(raw); if (m) hex = '#' + (m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]); }
  if (kind === 'rgb' && nums.length === 3 && nums.every((n) => n >= 0 && n <= 255)) hex = TH.rgbToHex(...nums);
  if (kind === 'cmyk' && nums.length === 4 && nums.every((n) => n >= 0 && n <= 100)) hex = TH.rgbToHex(...TH.cmykToRgb(...nums));
  if (!hex) { showToast(kind === 'hex' ? '‘#F2B33D’처럼 # 뒤에 여섯 글자로 적어주세요.' : kind === 'rgb' ? '‘242 179 61’처럼 0~255 숫자 세 개로 적어주세요.' : '‘0 26 75 5’처럼 0~100 숫자 네 개로 적어주세요.'); return; }
  hex = hex.toUpperCase();
  setTheme('색 번호로 넣기', (t) => { t[key] = hex; });
  showToast(`${{ point: '포인트색', bg: '바탕색', dark: '어두운 칸', text: '글자색' }[key]}을 ${hex}로 바꿨어요.${kind === 'cmyk' ? ' (인쇄 색과 화면 색은 조금 다를 수 있어요)' : ''}`);
}
// 사진에서 대표 색 뽑기: 작게 줄여서 비슷한 색끼리 모으고, 많이 쓰였고 선명한 색부터
function extractColors(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const W = 80, H = Math.max(1, Math.round(80 * img.naturalHeight / Math.max(1, img.naturalWidth)));
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      URL.revokeObjectURL(url);
      const TH = window.HometeoTheme;
      const box = {};
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;   // 투명한 곳은 빼요
        const k = (d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4);
        const b = box[k] || (box[k] = { n: 0, r: 0, g: 0, b: 0 });
        b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2];
      }
      const cand = Object.values(box).map((b) => {
        const hex = TH.rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n);
        const [, sat, l] = TH.hexToHsl(hex);
        return { hex, score: b.n * (0.25 + sat / 100) * (l > 92 || l < 8 ? 0.2 : 1) };
      }).sort((a, b) => b.score - a.score);
      const out = [];
      cand.forEach((cd) => {
        if (out.length >= 6) return;
        const [h1, s1, l1] = TH.hexToHsl(cd.hex);
        if (out.every((o) => { const [h2, s2, l2] = TH.hexToHsl(o); const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)); return dh * (s1 + s2) / 200 + Math.abs(l1 - l2) + Math.abs(s1 - s2) / 2 > 18; })) out.push(cd.hex);
      });
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}
const colorPhotoPicker = document.createElement('input');
colorPhotoPicker.type = 'file'; colorPhotoPicker.accept = 'image/*';
colorPhotoPicker.addEventListener('change', async () => {
  const f = colorPhotoPicker.files[0];
  colorPhotoPicker.value = '';
  if (!f) return;
  try {
    harm.photo = await extractColors(f);
    if (harm.photo.length) { harm.base = harm.photo[0]; showToast(`사진에서 색 ${harm.photo.length}가지를 찾았어요. 눌러서 기준 색을 바꿔 보세요.`); }
    renderInspector();
  } catch (e) { showToast('이 사진은 열 수 없어요. JPG나 PNG 사진으로 넣어주세요.'); }
});

// 내 글꼴 올리기: site.fonts = [{ id, name, asset, format, size, licensed }] (파일은 state.assets에)
const FONT_MIME = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };
const fontPicker = document.createElement('input');
fontPicker.type = 'file'; fontPicker.accept = '.woff2,.woff,.ttf,.otf';
fontPicker.addEventListener('change', () => {
  const f = fontPicker.files[0];
  fontPicker.value = '';
  if (!f) return;
  const ext = (/\.([a-z0-9]+)$/i.exec(f.name) || [])[1];
  const format = ext && ext.toLowerCase();
  if (!FONT_MIME[format]) { showToast('글꼴 파일(woff2 · woff · ttf · otf)만 넣을 수 있어요.'); return; }
  if (f.size > 15 * 1024 * 1024) { showToast('글꼴 파일이 너무 커요(15MB 넘음). woff2 파일을 찾아 넣어주세요.'); return; }
  if ((state.site.fonts || []).length >= 6) { showToast('내 글꼴은 6개까지 넣을 수 있어요. 안 쓰는 글꼴을 빼고 넣어주세요.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const b64 = String(reader.result).split(',')[1] || '';
    const id = newId('f'), asset = newId('font');
    state.assets[asset] = `data:${FONT_MIME[format]};base64,${b64}`;
    const name = f.name.replace(/\.[^.]+$/, '').slice(0, 40) || '내 글꼴';
    changeSite('내 글꼴 올리기', () => { state.site.fonts = (state.site.fonts || []).concat([{ id, name, asset, format, size: f.size, licensed: false }]); });
    showToast(f.size > 2 * 1024 * 1024
      ? `‘${name}’을 넣었어요. 파일이 커서(${fmtSize(f.size)}) 사이트가 느려질 수 있어요. 한글 · 영문 칸에서 ★ 글꼴을 골라 쓰세요.`
      : `‘${name}’을 넣었어요. 한글 · 영문 칸에서 ★ 글꼴을 골라 쓰세요.`);
  };
  reader.onerror = () => showToast('글꼴 파일을 읽지 못했어요.');
  reader.readAsDataURL(f);
});
function removeFont(id) {
  const f = (state.site.fonts || []).find((x) => x.id === id);
  if (!f) return;
  changeSite('내 글꼴 빼기', () => {
    state.site.fonts = state.site.fonts.filter((x) => x.id !== id);
    useFonts();
    state.site.theme = window.HometeoTheme.normalize(state.site.theme);   // 그 글꼴을 쓰던 곳은 기본 글꼴로
  });
  showToast(`‘${f.name}’ 글꼴을 뺐어요.`, '되돌리기', undo);
}

// (예전 서랍 자리) 블록이 바뀌면 고르기 칸의 '페이지에 있어요' 표시를 새로 그려요
function renderDrawer() { if (picker) renderInspector(); }

// 페이지 위 블록 하나 (편집 도구 포함)
//   본문 블록: 끌어서 옮기기 · 위/아래 · 너비 · 높이   메인 배너: 높이   나머지: 지우기만
function blockHtml(b, mainPos, mainCount) {
  const def = BLOCKS[b.type];
  const sel = b.id === state.selectedId ? ' is-selected' : '';
  const L = window.HometeoExport.cellLayout(b, null);
  const inFlow = isFlow(b);
  const z = zoneOf(b);
  const main = inFlow && z === 'main';
  const tall = inFlow && (z === 'main' || z === 'banner');
  const tags = [];
  if (b.hide === 'pc') tags.push('PC에서 숨김');
  if (b.hide === 'phone') tags.push('휴대폰에서 숨김');
  const hm = state.device === 'phone' && b.phoneOwn && b.minhM ? b.minhM : null;
  const hText = hm ? (hm === 'full' ? '화면 가득' : hm === 'auto' ? '' : hm + 'px') : b.minh ? (b.minh === 'full' ? '화면 가득' : b.minh + 'px') : '';
  const sizeText = main
    ? (state.device === 'phone' ? (b.mspan === 6 ? '절반' : '전체') : b.span + '칸') + (hText ? ' · ' + hText : '')
    : (hText ? '높이 ' + hText : '높이 자동');
  return `
    <div class="blk${sel}${b.props._off ? ' is-off' : ''}${picker && picker.replace === b.id ? ' is-replacing' : ''}${L.cls.length ? ' ' + L.cls.join(' ') : ''}${inFlow ? '' : ' is-float'}${main ? ' is-main' : ''}" data-id="${b.id}" data-type="${b.type}" style="${L.style}">
      <div class="blk-bar">
        ${main ? `<span class="blk-grip" title="끌어서 옮기기">${ICON.grip}</span>` : ''}
        <span class="blk-name">${escapeHtml(def.name)}${enTag(def.en)}</span>
        ${main ? `<button class="blk-btn" data-act="up" title="위로 올리기" ${mainPos === 0 ? 'disabled' : ''}>${ICON.up}</button>
        <button class="blk-btn" data-act="down" title="아래로 내리기" ${mainPos === mainCount - 1 ? 'disabled' : ''}>${ICON.down}</button>` : ''}
        ${main ? `<button class="blk-btn" data-act="copy" title="복사 (Ctrl + D)">${ICON.copy}</button>` : ''}
        ${main && zoneOf(b) === 'main' && b.type !== 'aside' ? `<button class="blk-btn blk-swap" data-act="replace" title="다른 블록으로 바꾸기" aria-label="다른 블록으로 바꾸기">⇄</button>` : ''}
        <button class="blk-btn danger" data-act="delete" title="지우기 (Delete)">${ICON.trash}</button>
      </div>
      ${tags.length ? `<span class="blk-tag">${tags.join(' · ')}</span>` : ''}
      ${b.props._off ? '<span class="blk-off-tag">잠시 숨겨 둔 블록 · 손님에게는 안 보여요</span>' : ''}<div class="blk-body">${RENDER(def, b.props, helpers, { id: b.id })}</div>
      ${main ? `<div class="blk-resize" title="끌어서 너비 바꾸기"><i></i></div>
      <button class="blk-add" type="button" data-add-at="${mainPos + 1}" title="이 블록 다음에 블록 넣기" aria-label="이 블록 다음에 블록 넣기">${ICON.plus}</button>` : ''}
      ${tall ? `<div class="blk-hresize" title="끌어서 높이 바꾸기 · 두 번 누르면 내용에 맞게"><i></i></div>
      <span class="blk-size">${sizeText}</span>` : ''}
    </div>`;
}

// 비어 있는 영역에 보이는 자리 (편집 화면에서만)
const ZONE_EMPTY = {
  header: { add: 'header', label: '맨 위 메뉴 넣기', help: '로고와 메뉴가 들어가는 곳' },
  banner: { add: 'banner', label: '메인 배너 넣기', help: '첫 화면의 큰 사진 · 슬라이드 (없어도 돼요)' },
  main: { add: '', label: '본문 블록 고르기', help: '글 · 사진 · 카드 · 영상을 여기에 끌어다 놓으세요' },
  footer: { add: 'footer', label: '맨 아래 정보 넣기', help: '회사 정보 · 링크가 들어가는 곳' }
};
function zonePlaceholder(z) {
  const e = ZONE_EMPTY[z];
  return `<div class="zone-empty" style="grid-column:1 / -1">
    <button class="zone-add" type="button" data-add="${e.add}" data-zone-open="${z}">${ICON.plus} ${e.label}</button>
    <small>${e.help}</small>
  </div>`;
}

function renderPage() {
  const side = state.blocks.find((b) => b.type === 'header' && !isFlow(b));
  const floats = state.blocks.filter((b) => !isFlow(b) && b !== side);
  const mains = mainBlocks();
  els.page.innerHTML = ZONES.map((z) => {
    const list = zoneFlow(z.id);
    if (z.id === 'header' && side && !list.length) return '';   // 맨 위 메뉴가 벽에 붙어 있으면 맨 위 영역은 비워둬요
    const sticky = z.id === 'header' && list[0] && list[0].props.sticky ? ' is-sticky' : '';
    let inner = list.length ? list.map((b) => blockHtml(b, mains.indexOf(b), mains.length)).join('') : zonePlaceholder(z.id);
    if (z.id === 'main' && list.length) {
      // 줄에 빈자리가 남으면 그 자리에 '여기에 넣기' (PC 화면 · 3칸 이상 남을 때)
      if (state.device === 'pc' && state.mode === 'edit' && !(picker && !picker.replace)) {
        const rows = layout(list);
        inner = list.map((b, k) => {
          let html = blockHtml(b, mains.indexOf(b), mains.length);
          const last = k === list.length - 1 || rows[k + 1].row !== rows[k].row;
          const end = rows[k].col + b.span - 1;
          const left = COLUMNS - end;
          if (last && left >= 3) html += `<button class="gap-add" type="button" data-add-at="${mains.indexOf(b) + 1}" style="grid-column:${end + 1} / span ${left}" title="이 빈자리에 블록 넣기">${ICON.plus}<span>여기에 넣기 <small>${left}칸</small></span></button>`;
          return html;
        }).join('');
      }
      // 블록 고르는 중이면 들어갈 자리를 보여줘요
      if (picker && !picker.replace && state.mode === 'edit') {
        const slot = '<div class="pick-slot" style="grid-column:1 / -1"><span>새 블록이 여기에 들어가요</span></div>';
        const parts = list.map((b) => blockHtml(b, mains.indexOf(b), mains.length));
        parts.splice(Math.min(picker.at, parts.length), 0, slot);
        inner = parts.join('');
      }
      inner += `<button class="zone-more" type="button" data-add-at="${mains.length}" style="grid-column:1 / -1">${ICON.plus} 본문 블록 넣기</button>`;
    }
    return `<div class="ib-zone zone-${z.id} ib-grid${sticky}${list.length ? '' : ' is-vacant'}" data-zone="${z.id}" data-label="${escapeHtml(z.ko)}" data-en="${escapeHtml(z.en)}">${inner}</div>`;
  }).join('');
  els.side.innerHTML = side ? blockHtml(side) : '';
  els.side.hidden = !side;
  els.float.innerHTML = floats.map((b) => blockHtml(b)).join('');
  els.paper.classList.toggle('has-side', !!side);
  els.paper.classList.toggle('side-left', !!side && side.props.position === 'left');
  els.paper.classList.toggle('side-right', !!side && side.props.position === 'right');
  els.paper.style.setProperty('--gap', (Number(state.page.gap) || 0) + 'px');
  applyTheme();
  els.paper.querySelectorAll('[data-edit]').forEach((el) => { el.title = '두 번 눌러서 고치기'; });
  const shown = [...els.page.querySelectorAll('.ib-zone > .blk, .ib-zone > .zone-empty')];
  if (shown.length) { shown[0].classList.add('is-first'); shown[shown.length - 1].classList.add('is-last'); }
  syncTracks();
  schedulePhone();
}
