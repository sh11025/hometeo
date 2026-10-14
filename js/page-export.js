/*
 * 완성된 홈페이지 만들기
 * ------------------------------------------------------------
 * 편집 도구(이름표, 버튼, 테두리) 없이, 실제 홈페이지 파일 한 장을 만들어요.
 * 새 탭 미리보기와 내려받기가 함께 써요.
 */
window.HometeoExport = (function () {
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 완성 홈페이지에서 움직이는 부분을 맡는 작은 코드
  //  - 로고 / ☰ 를 누르면 전체 메뉴 열고 닫기
  //  - 메인 배너 · 카드 슬라이드 넘기기 (저절로 · 화살표 · 점 · 손가락으로 밀기)
  //  - 바닥글 선택 상자에서 고르면 이동하기
  const HRS = window.HOMETEO_HOURS;
  const SITE_SCRIPT = `
  // 날짜를 보고 저절로 바뀌는 것들 (다시 올리지 않아도 돼요)
  (function () {
    var d = new Date();
    var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    // 영업시간: 지금 영업 중 · 쉬는 시간 · 오늘은 쉬어요
    ${HRS ? HRS.days.toString() + '\n    ' + HRS.status.toString() : ''}
    document.querySelectorAll('[data-hours]').forEach(function (box) {
      try {
        var p = JSON.parse(box.getAttribute('data-hours'));
        var st = hoursStatus(p, d), el = box.querySelector('.b-hours-now');
        if (el) { el.className = 'b-hours-now is-' + st.state; el.querySelector('span').textContent = st.text; }
        box.querySelectorAll('[data-hours-days]').forEach(function (r) { r.classList.toggle('is-today', r.getAttribute('data-hours-days').split(',').indexOf(String(d.getDay())) >= 0); });
      } catch (e) {}
    });
    // 게시판: 며칠 안 된 글에 N 표시
    document.querySelectorAll('[data-new-days]').forEach(function (list) {
      var days = Number(list.getAttribute('data-new-days'));
      list.querySelectorAll('[data-posted]').forEach(function (row) {
        var t = Date.parse(row.getAttribute('data-posted').replace(/\\./g, '-'));
        var fresh = !isNaN(t) && d - t < days * 86400000 && d - t > -86400000;
        var n = row.querySelector('.b-new'), a = row.querySelector('.b-board-title');
        if (fresh && !n && a) a.insertAdjacentHTML('beforeend', '<em class="b-new">N</em>');
        if (!fresh && n) n.remove();
      });
    });
    // 채용 공고: 마감일이 지나면 '마감'
    document.querySelectorAll('[data-job-end]').forEach(function (j) {
      var closed = j.getAttribute('data-job-end') < today;
      j.classList.toggle('is-closed', closed);
      if (closed && j.closest('[data-hide-closed]')) j.style.display = 'none';
    });
  })();
  // 작업물: 분류 버튼으로 골라 보기
  document.querySelectorAll('.b-works-cats').forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var c = b.getAttribute('data-cat');
      bar.parentNode.querySelectorAll('.b-work').forEach(function (w) { w.hidden = !!c && w.getAttribute('data-cat') !== c; });
    });
  });
  // 글자 크게 · 또렷하게 보기 (한 번 켜면 다른 페이지에서도 그대로)
  (function () {
    var btn = document.querySelector('.ib-a11y'); if (!btn) return;
    var key = 'hometeo-big-text', on = false;
    try { on = localStorage.getItem(key) === '1'; } catch (e) {}
    var set = function (v) { on = v; document.documentElement.classList.toggle('ib-big', v); btn.setAttribute('aria-pressed', v ? 'true' : 'false'); try { localStorage.setItem(key, v ? '1' : '0'); } catch (e) {} };
    set(on);
    btn.addEventListener('click', function () { set(!on); });
  })();
  // 공지 띠: 정한 기간이 아니면 손님 화면에서 숨겨요 (다시 올리지 않아도 날짜가 지나면 사라져요)
  (function () {
    var d = new Date();
    var t = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    document.querySelectorAll('[data-notice-start],[data-notice-end]').forEach(function (n) {
      var s = n.getAttribute('data-notice-start'), e = n.getAttribute('data-notice-end');
      if ((s && t < s) || (e && t > e)) { var c = n.closest('.ib-cell') || n; c.style.display = 'none'; }
    });
  })();
(function () {
  document.querySelectorAll('[data-open-menu]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var h = el.closest('.b-header');
      var open = h.classList.toggle('is-open');
      h.querySelectorAll('.b-menu-btn').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.b-header.is-open').forEach(function (h) {
      if (!h.contains(e.target)) h.classList.remove('is-open');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.b-header.is-open').forEach(function (h) { h.classList.remove('is-open'); });
  });

  // 넘기는 블록: 메인 배너(fade · 한 장씩 겹쳐 바뀜) · 카드 슬라이드(track · 옆으로 밀림)
  document.querySelectorAll('[data-slider]').forEach(function (sl) {
    var track = sl.dataset.slider === 'track';
    var items = sl.querySelectorAll(track ? '.b-card' : '.b-slide');
    var rows = track ? Math.max(1, parseInt(getComputedStyle(sl).getPropertyValue('--rows'), 10) || 1) : 1;
    var cols = Math.ceil(items.length / rows);
    var dots = sl.querySelectorAll('.b-slider-dots button');
    var cur = 0, timer = null;
    var wait = (parseFloat(sl.dataset.interval) || 5) * 1000;
    // 한 번에 보이는 칸 수 = 보이는 폭 ÷ 카드 한 칸 폭 (휴대폰·좁은 블록에서 저절로 줄어요)
    function per() {
      if (!track || !items.length) return 1;
      var vp = sl.querySelector('.b-cards-viewport');
      return Math.max(1, Math.round(vp.clientWidth / Math.max(1, items[0].offsetWidth)));
    }
    function last() { return track ? Math.max(0, cols - per()) : Math.max(0, items.length - 1); }
    function go(n) {
      var m = last() + 1;
      cur = ((n % m) + m) % m;
      if (track) {
        sl.style.setProperty('--pos', cur);
        var media = sl.querySelector('.b-card-media');
        if (media) sl.style.setProperty('--arrow-y', Math.max(0, media.offsetHeight / 2 - 21) + 'px');
        sl.classList.toggle('is-static', m < 2);
      } else {
        items.forEach(function (s, i) { s.classList.toggle('is-active', i === cur); s.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); });
      }
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === cur); d.hidden = i >= m; });
    }
    function play() { stop(); if (sl.dataset.autoplay === '1' && last() > 0) timer = setInterval(function () { go(cur + 1); }, wait); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    var prev = sl.querySelector('.b-slider-arrow.prev'), next = sl.querySelector('.b-slider-arrow.next');
    if (prev) prev.addEventListener('click', function () { go(cur - 1); play(); });
    if (next) next.addEventListener('click', function () { go(cur + 1); play(); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); play(); }); });
    sl.addEventListener('mouseenter', stop);
    sl.addEventListener('mouseleave', play);
    var sx = null;
    sl.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; stop(); }, { passive: true });
    sl.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
      play();
    });
    window.addEventListener('resize', function () { go(Math.min(cur, last())); });
    window.addEventListener('load', function () { go(cur); });
    go(0); play();
  });

  // 지금 보고 있는 곳: 메뉴의 '#b-…' 링크 중 화면에 보이는 블록의 메뉴를 굵게
  //   같은 페이지로 가는 링크(#top)는 다른 블록이 표시되지 않을 때 표시돼요
  (function () {
    var header = document.querySelector('.zone-header.is-sticky');
    function pad() { document.documentElement.style.scrollPaddingTop = header ? header.offsetHeight + 'px' : '0px'; }
    pad(); window.addEventListener('resize', pad);
    var links = [].slice.call(document.querySelectorAll('.b-nav a[href], .b-panel a[href], .b-aside a[href]'));
    var targets = [];
    links.forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^#b-/.test(h)) { var t = document.getElementById(h.slice(1)); if (t && targets.indexOf(t) < 0) targets.push(t); }
    });
    function mark() {
      var line = (header ? header.offsetHeight : 0) + window.innerHeight * 0.3;
      var cur = null;
      targets.forEach(function (t) { var r = t.getBoundingClientRect(); if (r.top <= line && r.bottom > line - 1) cur = t; });
      var want = cur ? '#' + cur.id : '#top';
      links.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === want); });
    }
    if (links.length) { mark(); window.addEventListener('scroll', mark, { passive: true }); window.addEventListener('resize', mark); }
    document.querySelectorAll('.b-panel a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () { var h = a.closest('.b-header'); if (h) h.classList.remove('is-open'); });
    });
  })();

  // 퀵메뉴 전화 버튼: 마우스로 쓰는 PC에서는 번호를 보여주고(전화를 걸 수 없으니까), 휴대폰에서는 그대로 전화 걸기
  var pcLike = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('.b-quick-btn[data-tel]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!pcLike || window.innerWidth <= 640) return;
      e.preventDefault();
      var on = !a.classList.contains('is-tip');
      document.querySelectorAll('.b-quick-btn.is-tip').forEach(function (x) { x.classList.remove('is-tip'); });
      if (on) a.classList.add('is-tip');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.b-quick-btn[data-tel]')) document.querySelectorAll('.b-quick-btn.is-tip').forEach(function (x) { x.classList.remove('is-tip'); });
  });

  // 갤러리: 사진을 누르면 크게 (← → 로 넘기기, Esc 로 닫기)
  document.querySelectorAll('.b-gal-grid').forEach(function (grid) {
    var links = [].slice.call(grid.querySelectorAll('a[data-zoom]'));
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var cur = i;
        var box = document.createElement('div');
        box.className = 'ib-zoom';
        box.innerHTML = '<img alt=""><button class="z-close" aria-label="닫기">×</button>' +
          (links.length > 1 ? '<button class="z-prev" aria-label="이전">‹</button><button class="z-next" aria-label="다음">›</button>' : '') + '<div class="z-count"></div>';
        function show() { box.querySelector('img').src = links[cur].getAttribute('href'); box.querySelector('.z-count').textContent = (cur + 1) + ' / ' + links.length; }
        function close() { box.remove(); document.removeEventListener('keydown', key); }
        function key(ev) { if (ev.key === 'Escape') close(); if (ev.key === 'ArrowRight') { cur = (cur + 1) % links.length; show(); } if (ev.key === 'ArrowLeft') { cur = (cur - 1 + links.length) % links.length; show(); } }
        box.addEventListener('click', function (ev) {
          if (ev.target.classList.contains('z-next')) { cur = (cur + 1) % links.length; show(); }
          else if (ev.target.classList.contains('z-prev')) { cur = (cur - 1 + links.length) % links.length; show(); }
          else if (ev.target.tagName !== 'IMG') close();
        });
        document.addEventListener('keydown', key);
        document.body.appendChild(box);
        show();
      });
    });
  });

  // 문의 양식 (메일로 받기): 적은 내용으로 메일을 만들어 손님의 메일 프로그램을 열어요
  document.querySelectorAll('form[data-send="mail"]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = f.querySelector('.b-form-note');
      var to = f.getAttribute('data-to');
      if (!to) { note.hidden = false; note.textContent = '아직 받을 메일 주소가 정해지지 않았어요. 홈페이지를 만든 분이 정하면 쓸 수 있어요.'; return; }
      var lines = [];
      f.querySelectorAll('.b-form-f').forEach(function (lab) {
        var el = lab.querySelector('input, select, textarea');
        lines.push('■ ' + lab.getAttribute('data-label') + '\\n' + (el.value || '-'));
      });
      location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(f.getAttribute('data-subject') || '홈페이지 문의') + '&body=' + encodeURIComponent(lines.join('\\n\\n'));
      note.hidden = false;
      note.textContent = '메일 프로그램이 열렸어요. 메일에서 ‘보내기’를 누르면 접수돼요. 아무것도 열리지 않으면 ' + to + ' 로 직접 메일을 보내 주세요.';
    });
  });

  // 아직 연결되지 않은 양식 (개발자 연결 · 주소 없음)
  document.querySelectorAll('form[data-send="none"]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = f.querySelector('.b-form-note');
      if (note) { note.hidden = false; note.textContent = '아직 연결되지 않은 양식이에요. 홈페이지를 만든 분이 연결하면 쓸 수 있어요.'; }
    });
  });

  // 로그인 칸: 아직 연결 주소(action)가 없으면 보내지 않고 안내만 보여줘요
  document.querySelectorAll('form[data-login][data-not-connected]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.querySelector('.b-login-note');
      if (n) n.hidden = false;
    });
  });

  document.querySelectorAll('[data-go-top]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });

  document.querySelectorAll('[data-go-select]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var url = sel.value;
      if (!url) return;
      if (/^https?:/i.test(url)) window.open(url, '_blank', 'noopener'); else location.href = url;
      sel.selectedIndex = 0;
    });
  });
})();`;

  const BASE_CSS = `
/* 글자 크게 · 또렷하게 보기 버튼 */
.ib-a11y { position: fixed; left: 16px; bottom: 16px; z-index: 60; display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 999px; border: 2px solid #111; background: #fff; color: #111; font: 700 14px/1 system-ui, sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,.18); cursor: pointer; }
.ib-a11y b { font-size: 17px; }
.ib-a11y[aria-pressed="true"] { background: #111; color: #fff; }
@media (max-width: 640px) { .ib-a11y { bottom: 84px; left: 12px; padding: 8px 12px; font-size: 13px; } }
html.ib-big { font-size: 118%; }
html.ib-big .ib-page { zoom: 1.15; --c-text: #000; }
html.ib-big .ib-page p, html.ib-big .ib-page small, html.ib-big .ib-page span { opacity: 1 !important; }
html.ib-big a:focus-visible, html.ib-big button:focus-visible { outline: 3px solid #1a5cff; outline-offset: 2px; }

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body {
  font-family: var(--font-body, 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', system-ui, sans-serif);
  color: var(--c-text, #2B2A28); background: var(--c-bg, #fff);
  word-break: keep-all; overflow-wrap: anywhere;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; }
html { scroll-behavior: smooth; }`;

  // 편집할 때만 쓰는 표시(data-edit 등)를 지워서 깔끔하게
  const clean = (html) => html
    .replace(/\sdata-edit="[^"]*"/g, '')
    .replace(/\sdata-multiline/g, '')
    .replace(/\n\s*\n/g, '\n');

  // 블록 하나를 감싸는 상자의 이름표와 모양 (편집 화면과 완성 홈페이지가 같이 써요)
  //   높이(minh), 위·아래 여백(pt·pb), 휴대폰 너비(mspan), 보이기(hide)
  const PAD = { none: 0, s: 24, m: 56, l: 96 };
  const PADX = { none: 0, s: 20, m: 48, l: 96 };   // 양옆 여백
  const kebab = (s) => String(s || 'block').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function cellLayout(b, def) {
    const cls = [];
    const style = [`grid-column:${b.col} / span ${b.span}`, `--mspan:${b.mspan === 6 ? 6 : 12}`];
    if (b.minh) cls.push('has-minh');
    if (b.minh === 'full') style.push('--minh:100vh');
    else if (b.minh) style.push(`--minh:${b.minh}px`);
    // 휴대폰 높이: 따로 맞췄으면 그 값, 아니면 PC 높이의 4분의 3
    const mh = b.phoneOwn && b.minhM ? b.minhM : null;
    if (mh === 'full' || (!mh && b.minh === 'full')) style.push('--minh-phone:88vh');
    else if (mh === 'auto') style.push('--minh-phone:auto');
    else if (mh) style.push(`--minh-phone:${mh}px`);
    else if (b.minh) style.push(`--minh-phone:${Math.round(b.minh * 0.75)}px`);
    if (b.pt && b.pt in PAD) { cls.push('has-pt'); style.push(`--pt:${PAD[b.pt]}px`); }
    if (b.pb && b.pb in PAD) { cls.push('has-pb'); style.push(`--pb:${PAD[b.pb]}px`); }
    if (b.px && b.px in PADX) { cls.push('has-px'); style.push(`--px:${PADX[b.px]}px`); }
    if (b.hide === 'pc' || b.hide === 'phone') cls.push('hide-' + b.hide);
    if (def && def.wrapperStyle) { const w = def.wrapperStyle(b.props); if (w) style.push(w); }
    return { cls, style: style.join(';') };
  }
  // 블록이 페이지 흐름(12칸) 안에 있는지 (벽 고정 메뉴 · 퀵메뉴는 밖에 있어요)
  function isFlow(b, BLOCKS) {
    const def = BLOCKS[b.type];
    return !def.flow || def.flow(b.props);
  }
  // 블록이 들어가는 영역 (header · banner · main · footer · float)
  const ZONE_RANK = { header: 0, banner: 1, main: 2, footer: 3, float: 4 };
  const zoneOf = (b, BLOCKS) => (BLOCKS[b.type] && BLOCKS[b.type].zone) || 'main';
  const ZONE_TAG = { header: 'div', banner: 'div', main: 'main', footer: 'div' };
  const ZONE_NAME = { header: 'Header · 맨 위', banner: 'Main Banner · 메인 배너', main: 'Main · 본문', footer: 'Footer · 맨 아래' };

  // 완성 홈페이지의 CSS (편집 화면에서만 쓰는 줄은 빼요)
  function siteCss() {
    const css = (BASE_CSS + '\n' + window.HOMETEO_BLOCK_CSS).split('\n')
      .filter((line) => !/^\s*body\[data-device/.test(line))
      .map((line) => line.replace(/,\s*\.blk[^,{]*(?=[,{])/g, ' '))
      .join('\n');
    return '/* 홈터 Hometeo · 홈페이지 모양\n   영역: .zone-header · .zone-banner · .zone-main · .zone-footer  /  블록: .b-이름 (예: .b-text)\n   사이트 색 · 글꼴은 <body style="--c-bg … --font-body …"> 의 CSS 변수로 들어가요 */\n' + css;
  }
  //   files: true 면 CSS · 스크립트를 css/hometeo.css · js/hometeo.js 파일로 따로 두고 불러와요 (내려받기)
  const RENDER = (def, p, h, c) => (window.HOMETEO_RENDER ? window.HOMETEO_RENDER(def, p, h, c) : def.render(p, h, c));
  function buildPageHtml({ blocks, BLOCKS, helpers, title, page, theme, meta, files, fontFace }) {
    // 잠시 숨겨 둔 블록은 손님 화면에 넣지 않아요
    blocks = (blocks || []).filter((b) => !(b.props && b.props._off));
    // 검색 · 공유에 보이는 정보 (사이트 기본 정보)
    const m = meta || {};
    const metaTags = [
      m.desc ? `<meta name="description" content="${escapeHtml(m.desc)}">` : '',
      '<meta property="og:type" content="website">',
      '<meta property="og:locale" content="ko_KR">',
      m.siteName ? `<meta property="og:site_name" content="${escapeHtml(m.siteName)}">` : '',
      `<meta property="og:title" content="${escapeHtml(title || '')}">`,
      m.desc ? `<meta property="og:description" content="${escapeHtml(m.desc)}">` : '',
      m.image ? `<meta property="og:image" content="${escapeHtml(m.image)}">\n<meta name="twitter:card" content="summary_large_image">` : '',
      m.url ? `<meta property="og:url" content="${escapeHtml(m.url)}">\n<link rel="canonical" href="${escapeHtml(m.url)}">` : '',
      m.icon ? `<link rel="icon" href="${escapeHtml(m.icon)}">\n<link rel="apple-touch-icon" href="${escapeHtml(m.icon)}">` : ''
    ].filter(Boolean).join('\n');
    const TH = window.HometeoTheme;
    const fonts = TH.fontUrls(theme).filter((u) => !/pretendard/.test(u)).map((u) => `<link rel="stylesheet" href="${escapeHtml(u)}">`).join('\n');
    const pg = page || {};
    const comment = (def) => `<!-- ===== ${def.en || ''} · ${def.name} ===== -->`;
    const flow = blocks.filter((b) => isFlow(b, BLOCKS));
    const side = blocks.find((b) => b.type === 'header' && !isFlow(b, BLOCKS));
    const floats = blocks.filter((b) => !isFlow(b, BLOCKS) && b !== side);
    const cell = (b) => {
      const def = BLOCKS[b.type];
      const inner = RENDER(def, b.props, helpers, { id: b.id });
      const L = cellLayout(b, def);
      return `${comment(def)}\n<div id="b-${escapeHtml(b.id)}" class="ib-cell section-${kebab(def.en)}${L.cls.length ? ' ' + L.cls.join(' ') : ''}" style="${L.style}">${clean(inner)}</div>`;
    };
    // 영역마다 상자 하나 (비어 있는 영역은 넣지 않아요)
    const body = ['header', 'banner', 'main', 'footer'].map((z) => {
      const list = flow.filter((b) => zoneOf(b, BLOCKS) === z);
      if (!list.length) return '';
      const sticky = z === 'header' && list[0].props.sticky ? ' is-sticky' : '';
      const tag = ZONE_TAG[z];
      return `<!-- ########## ${ZONE_NAME[z]} ########## -->\n<${tag} class="ib-zone zone-${z} ib-grid${sticky}">\n${list.map(cell).join('\n')}\n</${tag}>`;
    }).filter(Boolean).join('\n');
    const sideHtml = side ? `${comment(BLOCKS.header)}\n<div class="ib-side section-header">${clean(RENDER(BLOCKS.header, side.props, helpers, { id: side.id }))}</div>\n` : '';
    const floatHtml = floats.map((b) => `${comment(BLOCKS[b.type])}\n${clean(RENDER(BLOCKS[b.type], b.props, helpers, { id: b.id }))}`).join('\n');
    const pageCls = side ? ` has-side side-${side.props.position}` : '';
    const gap = Number(pg.gap) || 0;
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title || '내 홈페이지')}</title>
<meta name="generator" content="홈터 Hometeo">
${metaTags}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
${fonts}${fontFace ? `\n<style>/* 내 글꼴 */\n${fontFace}</style>` : ''}
${files ? '<link rel="stylesheet" href="css/hometeo.css">' : `<style>${siteCss()}</style>`}
</head>
<body id="top" style="${escapeHtml(TH.vars(theme))}">
<div class="ib-page${pageCls}"${gap ? ` style="--gap:${gap}px"` : ''}>
<div class="ib-frame">
${sideHtml}<div class="ib-body">
${body}
</div>
</div>
</div>
${floatHtml}
${m.a11y ? '<button class="ib-a11y" type="button" aria-pressed="false" title="글자를 크게, 색을 또렷하게 보여줘요"><b>가</b> 글자 크게</button>' : ''}
${files ? '<script src="js/hometeo.js"></script>' : `<script>${SITE_SCRIPT}</script>`}
</body>
</html>`;
  }

  // ---------------------------------------------------------
  // 새 탭 미리보기: 완성 홈페이지를 PC / 휴대폰 화면으로 바꿔 보는 틀
  // (이 틀과 위쪽 막대는 미리보기에서만 보여요. 내려받는 파일에는 들어가지 않아요)
  // ---------------------------------------------------------
  //   pages: [{ file, name, html }] — 페이지 사이 링크를 누르면 미리보기 안에서 그 페이지로 바뀌어요
  function buildPreviewHtml({ pages, current, title, device }) {
    const data = JSON.stringify(pages.map((p) => ({ file: p.file, name: p.name, html: p.html }))).replace(/</g, '\\u003c');
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>미리보기 · ${escapeHtml(title || '내 홈페이지')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  font-family: 'Pretendard', 'Malgun Gothic', system-ui, sans-serif; color: #2B2A28;
  display: flex; flex-direction: column; background: #EDE6D8;
}
.pv-bar {
  flex: none; height: 52px; display: flex; align-items: center; gap: 12px; padding: 0 16px;
  background: #fff; border-bottom: 1px solid #E4DCCD; font-size: 14px;
}
.pv-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.pv-logo i { display: grid; grid-template-columns: 7px 7px; gap: 2px; }
.pv-logo b { width: 7px; height: 7px; border-radius: 2px; display: block; }
.pv-note { color: #8A847B; font-size: 12px; }
.pv-spacer { flex: 1; }
.pv-switch { display: flex; padding: 3px; gap: 2px; background: #F3ECDF; border-radius: 10px; }
.pv-switch button {
  height: 30px; padding: 0 14px; border: 0; border-radius: 8px; background: transparent;
  font: inherit; font-size: 13px; color: #6E685F; cursor: pointer;
}
.pv-switch button.is-on { background: #fff; color: #2B2A28; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.pv-stage { flex: 1; min-height: 0; display: flex; justify-content: center; align-items: flex-start; overflow: auto; }
.pv-frame { display: block; width: 100%; height: 100%; border: 0; background: #fff; }
body.is-phone .pv-stage { padding: 24px; }
body.is-phone .pv-phone {
  flex: none; padding: 12px; border-radius: 48px; background: #2B2A28;
  box-shadow: 0 20px 50px rgba(43, 42, 40, .25);
}
body.is-phone .pv-frame { width: 390px; height: 844px; border-radius: 36px; }
body:not(.is-phone) .pv-phone { width: 100%; height: 100%; }
.pv-size { color: #8A847B; font-size: 12px; min-width: 120px; text-align: right; }
.pv-pages { height: 32px; border: 1px solid #E4DCCD; border-radius: 8px; padding: 0 8px; font: inherit; font-size: 13px; background: #fff; }
</style>
</head>
<body class="${device === 'phone' ? 'is-phone' : ''}">
<div class="pv-bar">
  <span class="pv-logo"><i><b style="background:#E0584A"></b><b style="background:#F2B33D"></b><b style="background:#3B6FD8"></b><b style="background:#8E5BD6"></b></i>홈터 미리보기</span>
  <span class="pv-note">이 막대는 미리보기에서만 보여요</span>
  <span class="pv-spacer"></span>
  ${pages.length > 1 ? `<select class="pv-pages" id="pv-pages" aria-label="페이지">${pages.map((p) => `<option value="${escapeHtml(p.file)}">${escapeHtml(p.name)} · ${escapeHtml(p.file)}</option>`).join('')}</select>` : ''}
  <span class="pv-size" id="pv-size"></span>
  <div class="pv-switch" role="group" aria-label="화면 크기">
    <button data-d="pc">PC</button>
    <button data-d="phone">휴대폰</button>
  </div>
</div>
<div class="pv-stage">
  <div class="pv-phone"><iframe class="pv-frame" id="pv-frame" title="홈페이지 미리보기"></iframe></div>
</div>
<script>
(function () {
  var btns = document.querySelectorAll('.pv-switch button');
  var size = document.getElementById('pv-size');
  function set(d) {
    document.body.classList.toggle('is-phone', d === 'phone');
    btns.forEach(function (b) { b.classList.toggle('is-on', b.dataset.d === d); });
    size.textContent = d === 'phone' ? '휴대폰 · 390 × 844' : 'PC · 창 크기에 맞춰요';
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.d); }); });
  set(${JSON.stringify(device === 'phone' ? 'phone' : 'pc')});

  // 페이지 바꾸기: 미리보기 속 링크(menu.html, menu.html#b-…)를 누르면 그 페이지를 보여줘요
  var PAGES = ${data};
  var frame = document.getElementById('pv-frame');
  var sel = document.getElementById('pv-pages');
  var pendingHash = '';
  function show(file, hash) {
    var p = PAGES.filter(function (x) { return x.file === file; })[0] || PAGES[0];
    pendingHash = hash || '';
    if (sel) sel.value = p.file;
    frame.srcdoc = p.html;
  }
  frame.addEventListener('load', function () {
    var doc = frame.contentDocument;
    if (!doc) return;
    if (pendingHash) { var t = doc.getElementById(pendingHash.slice(1)); if (t) t.scrollIntoView(); }
    doc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var m = /^([\\w.-]+\\.html)(#.*)?$/.exec(a.getAttribute('href'));
      if (m && PAGES.some(function (x) { return x.file === m[1]; })) { e.preventDefault(); show(m[1], m[2]); }
    });
  });
  if (sel) sel.addEventListener('change', function () { show(sel.value); });
  show(${JSON.stringify(current || '')});
})();
</script>
</body>
</html>`;
  }

  const siteScript = () => '/* 홈터 Hometeo · 움직이는 부분 (전체 메뉴 · 슬라이드 · 지금 보는 곳 · 퀵메뉴 · 갤러리 · 문의 양식 · 로그인) */\n' + SITE_SCRIPT.trim() + '\n';
  return { siteCss, siteScript, buildPageHtml, buildPreviewHtml, cellLayout, isFlow, kebab, zoneOf, ZONE_RANK };
})();
