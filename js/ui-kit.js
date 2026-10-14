/*
 * 오른쪽 설정 칸 부품
 * ------------------------------------------------------------
 * 블록마다 설정 화면을 쉽게 만들도록 자주 쓰는 칸을 모아뒀어요.
 * 모든 칸은 "내용이름(path)"으로 블록 내용과 연결돼요. 예: 'title', 'menu.0.link'
 * 값이 바뀌면 편집 화면 동작(js/app/) 이 알아서 블록 내용을 고치고 되돌리기에 남겨요.
 *
 *   data-field="path"        입력 칸 · 체크 칸 · 슬라이더 (다 쓰고 나면 반영)
 *   data-set="path" data-value="값"   눌러서 고르는 버튼
 *   data-action="..."        사진 넣기, 목록 추가·빼기 같은 동작
 *   section(…, tab)          내용 · 모양 · 더보기 중 어느 탭에 보일지
 */
window.HometeoUI = (function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let uid = 0;
  const nextId = () => 'f' + (++uid);

  const I = {
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
    video: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2v8l-4-2"/></svg>',
    crop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  return {
    esc,
    icon: I,

    // 제목이 달린 칸 묶음
    //   tab: 오른쪽 설정의 어느 탭에 보일지 — 'content' 내용(기본) · 'look' 모양 · 'more' 더보기
    section(title, inner, help, tab) {
      return `<section class="field" data-tab="${tab || 'content'}">
        ${title ? `<h3 class="field-title">${title}</h3>` : ''}
        ${inner}
        ${help ? `<p class="field-help">${help}</p>` : ''}
      </section>`;
    },
    sub(title) { return `<h4 class="field-sub">${title}</h4>`; },
    // 사진 비율: 가로 · 세로를 고른 다음 크기를 골라요 (세로면 와이드 9:21 · 9:16 · 3:4)
    //   o.auto: '원래대로' 넣기 · dir: 'v' 면 세로 (원래대로 · 1:1 일 때 가로세로를 기억하려고 따로 둬요)
    ratio(path, value, o) {
      o = o || {};
      const v = String(value || '');
      const nums = v.split('/').map(Number);
      const vert = nums.length === 2 && nums[0] && nums[1] && nums[0] !== nums[1] ? nums[0] < nums[1] : o.dir === 'v';
      const H = [['21/9', '와이드'], ['16/9', '16:9'], ['4/3', '4:3'], ['1/1', '1:1']];
      const V = [['9/21', '와이드'], ['9/16', '9:16'], ['3/4', '3:4'], ['1/1', '1:1']];
      const opts = (o.auto ? [['auto', '원래대로']] : []).concat(vert ? V : H);
      const fill = o.fill ? `<button class="ratio-fill${v === 'fill' ? ' is-on' : ''}" data-set="${path}" data-value="fill" title="블록 크기에 맞춰 사진을 키워 빈 곳 없이 채워요 · 넘친 부분은 위치 맞추기로 골라요"><i></i>칸에 꽉 채우기</button>` : '';
      return `<div class="ratio-pick">
        <div class="ratio-dir" role="group" aria-label="가로 · 세로">
          <button class="${vert ? '' : 'is-on'}" data-ratio-flip="${path}" data-dir="h" title="가로로 긴 사진"><i class="rd-h"></i>가로</button>
          <button class="${vert ? 'is-on' : ''}" data-ratio-flip="${path}" data-dir="v" title="세로로 긴 사진"><i class="rd-v"></i>세로</button>
        </div>
        ${this.seg(path, v, opts)}
        ${fill}
      </div>`;
    },
    // 디자인 고르기: 작은 그림이 있는 버튼 묶음 (opts: [[값, 이름, 그림 HTML]])
    looks(path, value, opts) {
      return `<div class="layout-picks look-picks">${opts.map(([v, l, art]) => `<button class="layout-pick${String(value) === String(v) ? ' is-on' : ''}" data-set="${path}" data-value="${esc(v)}"><span class="lp-art">${art}</span>${l}</button>`).join('')}</div>`;
    },
    help(text) { return `<p class="field-help">${text}</p>`; },

    // 글자 입력 칸
    input(path, value, opts) {
      const o = opts || {};
      const id = nextId();
      return `${o.label ? `<label class="input-label" for="${id}">${o.label}</label>` : ''}
        <input id="${id}" class="input${o.small ? ' small' : ''}" type="text" data-field="${path}" value="${esc(value)}" placeholder="${esc(o.placeholder || '')}">`;
    },
    // 여러 줄 입력 칸
    textarea(path, value, opts) {
      const o = opts || {};
      const id = nextId();
      return `${o.label ? `<label class="input-label" for="${id}">${o.label}</label>` : ''}
        <textarea id="${id}" class="input textarea" rows="${o.rows || 3}" data-field="${path}" placeholder="${esc(o.placeholder || '')}">${esc(value)}</textarea>`;
    },
    // 켜기 / 끄기
    check(path, value, label) {
      return `<label class="check"><input type="checkbox" data-field="${path}" ${value ? 'checked' : ''}> ${label}</label>`;
    },
    // 여러 개 중 하나 고르기
    seg(path, value, options) {
      return `<div class="segmented" style="grid-template-columns:repeat(${options.length},1fr)">
        ${options.map(([v, label]) => `<button class="${String(value) === String(v) ? 'is-on' : ''}" data-set="${path}" data-value="${esc(v)}">${label}</button>`).join('')}
      </div>`;
    },
    // 색 고르기
    swatches(path, value, colors) {
      return `<div class="swatches">
        ${colors.map(([c, n]) => `<button class="swatch${c ? '' : ' site'}${(value || '') === c ? ' is-on' : ''}"${c ? ` style="background:${c}"` : ''} data-set="${path}" data-value="${c}" title="${n}" aria-label="${n}">${c ? '' : '<span>자동</span>'}</button>`).join('')}
      </div>`;
    },
    // 슬라이더 (숫자)
    range(path, value, min, max, step, label, unit) {
      const id = nextId();
      return `<div class="range-row">
        <label class="input-label" for="${id}">${label}</label>
        <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-field="${path}" data-number oninput="this.nextElementSibling.textContent=this.value+'${unit || ''}'">
        <output>${value}${unit || ''}</output>
      </div>`;
    },
    // 사진 칸: 미리보기 + 넣기/바꾸기/빼기 (+ 위치 맞추기)
    //   frames: 'wide' (PC·휴대폰 두 모습) 또는 'ratio:4/3' 처럼 한 모습. 없으면 위치 맞추기 없음
    // 이 자리에 알맞은 사진 크기 (px) — 사진을 만들 때 참고해요
    recSize(o) {
      if (o.alpha) return { w: 400, h: 0, text: '가로 400px 정도 · 투명 배경 PNG 추천' };
      const f = o.frames || '';
      if (f === 'wide') return { w: 1920, h: 840, text: '1920 × 840 px (가로 16:7) · 휴대폰에서는 가운데 부분이 보여요' };
      const m = /^ratio:(\d+)\/(\d+)$/.exec(f);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      const w = a >= b ? 1600 : 1080, h = Math.round(w * b / a);
      return { w, h, text: `${w} × ${h} px (${a}:${b}${a < b ? ' 세로' : ''})` };
    },
    photo(path, src, opts) {
      const o = opts || {};
      const alpha = o.alpha ? ' data-alpha="1"' : '';
      const rec = this.recSize(o);
      const recLine = rec ? `<p class="photo-rec" data-rec-w="${rec.w}">권장 크기 ${rec.text}<span data-photo-real></span></p>` : '';
      if (!src) {
        return `<button class="photo-drop${o.compact ? ' compact' : ''}" data-action="image-pick" data-path="${path}"${alpha}>
          ${I.image}<strong>${o.addLabel || '사진 넣기'}</strong>
          ${o.compact ? '' : '<span>눌러서 고르거나, 사진 파일을 블록에 끌어다 놓으세요</span>'}
        </button>${recLine}`;
      }
      const base = path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : '';
      return `<div class="photo-preview${o.contain ? ' contain' : ''}"><img src="${src}" alt="지금 사진"></div>${recLine}
        ${o.frames ? `<button class="btn btn-primary" data-action="image-crop" data-base="${base}" data-key="${path.slice(path.lastIndexOf('.') + 1)}" data-frames="${o.frames}">${I.crop} 위치 맞추기 · 자르기</button>` : ''}
        <div class="row-btns">
          <button class="btn" data-action="image-pick" data-path="${path}"${alpha}>${I.image} 바꾸기</button>
          <button class="btn btn-ghost" data-action="set-null" data-path="${path}">빼기</button>
        </div>`;
    },
    // 누르면 갈 곳 고르기: 대분류(페이지 · 전화 · 메일 · 다른 사이트) → 소분류(어느 페이지의 어느 블록)
    //   값: '' 없음 · 'page:페이지번호' · 'page:페이지번호#블록번호' · 전화번호 · 'mailto:주소' · https://…
    //   targets = { pages: [{ id, name, blocks: [{ id, label }] }], current, pending: { path: kind } }
    link(path, value, targets, opts) {
      const o = opts || {};
      const t = targets || { pages: [], pending: {} };
      const v = String(value || '').trim();
      const real = this.linkKind(v);                       // none · page · tel · mail · url
      const pend = t.pending && t.pending[path];
      const kind = pend || (real === 'tel' || real === 'mail' || real === 'url' ? 'direct' : real);
      const pro = typeof document !== 'undefined' && document.body && document.body.classList.contains('show-en');
      const id = nextId();
      // 처음 쓰는 사람도 알기 쉽게 세 가지만: 안 누름 · 내 홈페이지 페이지 · 직접 적기(전화 · 메일 · 주소는 홈터가 알아봐요)
      const kinds = [['none', '누르지 않게 두기'], ['page', '내 홈페이지의 페이지로'], ['direct', '직접 적기 (전화번호 · 메일 · 인터넷 주소)']];
      let more = '';
      if (kind === 'page') {
        const m = /^page:([^#]*)(?:#(.*))?$/.exec(v) || [];
        const pid = m[1] || t.current || (t.pages[0] && t.pages[0].id);
        const page = t.pages.find((pg) => pg.id === pid) || t.pages[0] || { blocks: [] };
        const anchor = m[2] || '';
        more = `<div class="link-sub">
          <select class="input small" data-link-page aria-label="페이지">
            ${t.pages.map((pg) => `<option value="${esc(pg.id)}" ${pg.id === page.id ? 'selected' : ''}>${esc(pg.name)}${pg.id === t.current ? ' (지금 페이지)' : ''}</option>`).join('')}
          </select>
          <label class="link-anchor-label">그 페이지의 어느 부분부터 보여줄까요?${pro ? ' <span class="en">anchor</span>' : ''}
            <select class="input small" data-link-anchor aria-label="페이지의 어느 부분부터">
              <option value="">맨 위부터</option>
              ${(page.blocks || []).map((bl) => `<option value="${esc(bl.id)}" ${bl.id === anchor ? 'selected' : ''}>${esc(bl.label)}</option>`).join('')}
              ${anchor && !(page.blocks || []).some((bl) => bl.id === anchor) ? '<option value="" selected>(지워진 블록 · 맨 위부터 보여요)</option>' : ''}
            </select>
          </label>
        </div>`;
      } else if (kind === 'direct') {
        const shown = real === 'mail' ? v.replace(/^mailto:/i, '') : (real === 'tel' ? v.replace(/^tel:/i, '') : v);
        const hint = {
          tel: ['📞 누르면 전화가 걸려요', 'tel: 링크'],
          mail: ['✉️ 누르면 메일 쓰기가 열려요', 'mailto: 링크'],
          url: ['🌐 누르면 그 사이트가 열려요', '외부 URL']
        }[real];
        more = `<input class="input small" type="text" data-link-input value="${esc(real === 'none' || real === 'page' ? '' : shown)}" placeholder="010-1234-5678 · abc@naver.com · naver.me/…">
          <p class="link-hint">${hint ? `${hint[0]}${pro ? ` <span class="en">${hint[1]}</span>` : ''}` : '전화번호 · 메일 주소 · 인터넷 주소 중 아무거나 적으면 홈터가 알아봐요.'}</p>`;
      }
      return `<div class="link-pick" data-link="${esc(path)}">
        ${o.label ? `<label class="input-label" for="${id}">${o.label}</label>` : ''}
        <select id="${id}" class="input small" data-link-kind aria-label="누르면 어디로 갈지">
          ${kinds.map(([k, l]) => `<option value="${k}" ${k === kind ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        ${more}
      </div>`;
    },
    linkKind(v) {
      if (!v || v === '#') return 'none';
      if (/^page:/.test(v)) return 'page';
      if (/^mailto:/i.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'mail';
      if (/^(tel:)?[0-9+\-\s()]{7,}$/.test(v)) return 'tel';
      return 'url';
    },

    // 목록 한 줄의 오른쪽 버튼들 (위로 · 아래로 · 빼기)
    itemTools(listPath, i, len, min) {
      return `<span class="item-tools">
        <button class="icon-btn" data-action="list-move" data-path="${listPath}" data-index="${i}" data-dir="-1" title="위로" ${i === 0 ? 'disabled' : ''}>${I.up}</button>
        <button class="icon-btn" data-action="list-move" data-path="${listPath}" data-index="${i}" data-dir="1" title="아래로" ${i === len - 1 ? 'disabled' : ''}>${I.down}</button>
        <button class="icon-btn danger" data-action="list-remove" data-path="${listPath}" data-index="${i}" title="빼기" ${len <= (min || 0) ? 'disabled' : ''}>${I.x}</button>
      </span>`;
    },
    // 목록에 하나 더하기
    addBtn(listPath, label, disabled) {
      return `<button class="btn btn-ghost" data-action="list-add" data-path="${listPath}" ${disabled ? 'disabled' : ''}>${I.plus} ${label}</button>`;
    }
  };
})();
