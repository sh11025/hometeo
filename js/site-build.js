/*
 * 완성 페이지 만들기 공통 모듈 (HometeoBuild)
 * ------------------------------------------------------------
 * 홈터(app.js)와 관리자 화면(admin.js)이 똑같이 사용하여
 * 사이트 데이터(site, assets)로부터 실제 완성 홈페이지 HTML 파일 목록을 만듭니다.
 */
(function () {
  'use strict';

  const COLUMNS = 12;

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // '누르면 갈 곳' 값을 실제 브라우저 주소로 변환해요
  function toHref(v, resolvePage) {
    const s = String(v || '').trim();
    if (!s) return null;
    const pm = /^page:([^#]*)(?:#(.*))?$/.exec(s);
    if (pm) return { url: resolvePage ? resolvePage(pm[1], pm[2] || '') : '#', external: false };
    if (s === '#') return { url: '#', external: false };
    if (/^[0-9+\-\s()]{7,}$/.test(s)) return { url: 'tel:' + s.replace(/[^0-9+]/g, ''), external: false };
    if (/^(https?:|mailto:|tel:|#)/i.test(s)) return { url: s, external: /^https?:/i.test(s) };
    if (/^[^\s]+\.[^\s]+$/.test(s)) return { url: 'https://' + s, external: true };
    return null;
  }

  // 영역별 정렬 순서
  const ZONE_RANK = (window.HometeoExport && window.HometeoExport.ZONE_RANK) || { header: 10, banner: 20, main: 30, footer: 40, float: 50 };
  const zoneOf = (b) => (window.HOMETEO_BLOCKS && window.HOMETEO_BLOCKS[b.type] && window.HOMETEO_BLOCKS[b.type].zone) || 'main';
  const isFlow = (b) => (zoneOf(b) !== 'float');

  // 블록을 영역 순서대로 정렬하고 너비 규격을 맞춰요
  function tidy(blocks) {
    blocks.forEach((b) => {
      const z = zoneOf(b);
      if (z === 'main') return;
      b.span = COLUMNS;
      b.offset = 0;
      delete b.mspan;
      if (z !== 'banner') { delete b.minh; delete b.pt; delete b.pb; delete b.px; }
    });
    return blocks.map((b, i) => [b, i])
      .sort((x, y) => (ZONE_RANK[zoneOf(x[0])] - ZONE_RANK[zoneOf(y[0])]) || ((y[0].type === 'notice') - (x[0].type === 'notice')) || (x[1] - y[1]))
      .map((x) => x[0]);
  }

  // 12칸 그리드에 맞추어 블록 시작 칸(col)을 계산해요
  function layout(blocks) {
    let cursor = 1, row = 0;
    return blocks.map((b) => {
      if (!isFlow(b)) return { col: 1, row: -1 };
      const offset = b.offset || 0;
      const need = offset + b.span;
      if (cursor > 1 && cursor + need - 1 > COLUMNS) { row++; cursor = 1; }
      const place = { col: cursor + offset, row };
      cursor += need;
      if (cursor > COLUMNS) { cursor = 1; row++; }
      return place;
    });
  }

  // 페이지 파일 이름 (첫 페이지는 index.html, 나머지는 페이지이름.html)
  const fileOf = (pg, homeId) => (pg.id === homeId ? 'index' : pg.file) + '.html';

  // 사이트 대표 이름 꺼내기
  function siteName(site) {
    if (!site) return '내 홈페이지';
    if (site.info && site.info.syncName !== false) {
      const all = [...(site.shared || []), ...(site.pages ? site.pages.flatMap((p) => p.blocks || []) : [])];
      const h = all.find((b) => b.type === 'header');
      if (h && h.props && h.props.logo) return h.props.logo;
    }
    return (site.info && site.info.name) || '내 홈페이지';
  }

  // 블록 렌더링 도우미 (완성 페이지용)
  function createSiteHelpers({ assets, assetFn, resolvePage }) {
    const assetResolver = assetFn || ((id) => (id && assets && assets[id]) || null);
    return {
      text: (s) => escapeHtml(s).replace(/\n/g, '<br>'),
      attr: escapeHtml,
      asset: assetResolver,
      href: function (v) {
        const h = toHref(v, resolvePage);
        if (!h) return ' href="#"';
        return ` href="${escapeHtml(h.url)}"` + (h.external ? ' target="_blank" rel="noopener"' : '');
      },
      hrefValue: function (v) {
        const h = toHref(v, resolvePage);
        return h ? h.url : '';
      },
      photoStyle: (p) => {
        const x = p.imgX == null ? 50 : p.imgX, y = p.imgY == null ? 50 : p.imgY, z = p.imgZoom || 1;
        let st = `--ix:${x}%;--iy:${y}%;--iz:${z}`;
        if (p.imgXm != null) st += `;--ixm:${p.imgXm}%;--iym:${p.imgYm == null ? 50 : p.imgYm}%;--izm:${p.imgZoomm || 1}`;
        return st;
      },
      icon: {
        up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',
        down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>',
        trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>',
        grip: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>',
        x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
        plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
        edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
        crop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
        move: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
        copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>'
      },
      ui: window.HometeoUI,
      linkTargets: () => [],
      block: () => null,
      editor: false,
      placeholder: () => '',
      view: () => 0,
      resolvePage
    };
  }

  /**
   * 모든 페이지를 완성된 정적 HTML 파일 목록으로 빌드합니다.
   * @param {Object} opts
   * @param {Object} opts.site - 사이트 데이터 (pages, shared, home, theme, info, fonts)
   * @param {Object} [opts.assets] - 에셋 맵 ({ [id]: dataUrl })
   * @param {Function} [opts.assetFn] - 에셋 번호 -> 파일 상대경로 변환 함수 (예: (id) => `images/${id}.jpg`)
   * @returns {Array<{ id: string, name: string, file: string, html: string }>}
   */
  function buildSitePages({ site, assets, assetFn }) {
    if (!site || !Array.isArray(site.pages)) return [];
    const BLOCKS = window.HOMETEO_BLOCKS;
    const EXPORT = window.HometeoExport;
    const THEME = window.HometeoTheme;
    const sName = siteName(site);
    const homePg = site.pages.find((x) => x.id === site.home) || site.pages[0];
    const inf = site.info || { name: '', desc: '', url: '', shareImage: null, icon: null };
    const base = inf.url ? inf.url.replace(/\/+$/, '') + '/' : '';

    return site.pages.map((pg) => {
      // 페이지 안의 링크 대상 변환 (같은 페이지면 #b-anchor, 다른 페이지면 page.html#b-anchor)
      const resolvePage = (pid, anchor) => {
        const target = site.pages.find((x) => x.id === pid) || homePg;
        const same = target.id === pg.id;
        return (same ? '' : fileOf(target, site.home)) + (anchor ? '#b-' + anchor : (same ? '#top' : ''));
      };

      const helpers = createSiteHelpers({ assets, assetFn, resolvePage });

      // 블록 합치기: 함께 쓰는 블록(shared) + 이 페이지 전용 블록(pg.blocks)
      const blocks = tidy([...(site.shared || []), ...(pg.blocks || [])]);
      layout(blocks).forEach((pl, i) => {
        blocks[i] = Object.assign({}, blocks[i], { col: pl.col });
      });

      const title = pg.id === site.home ? sName : `${pg.name} · ${sName}`;
      const fileOrAsset = (id) => (id ? (assetFn ? assetFn(id) : (assets && assets[id])) : null);

      const meta = {
        siteName: sName,
        desc: pg.desc || inf.desc || '',
        image: assetFn && inf.shareImage && assetFn(inf.shareImage) ? base + assetFn(inf.shareImage) : '',
        icon: inf.icon ? (fileOrAsset(inf.icon) || '') : '',
        url: base ? base + (pg.id === site.home ? '' : fileOf(pg, site.home)) : ''
      };

      const fontFace = THEME && THEME.fontFaceCss ? THEME.fontFaceCss(site.fonts || [], (f) => (assetFn ? assetFn(f.asset) : (assets && assets[f.asset])) || '') : '';

      const html = EXPORT.buildPageHtml({
        blocks,
        BLOCKS,
        helpers,
        title,
        page: { gap: pg.gap || 0 },
        theme: site.theme,
        meta,
        files: !!assetFn,
        fontFace
      });

      return {
        id: pg.id,
        name: pg.name,
        file: fileOf(pg, site.home),
        html
      };
    });
  }

  // ---------- 이미지 축소 공통 함수 ----------
  const IMAGE_MAX_SIDE = 1920;
  const IMAGE_QUALITY = 0.82;

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('cannot-open')); };
      img.src = url;
    });
  }

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  // 큰 사진을 알맞은 크기로 줄여요. (보통 사진: 1920px JPG, 로고: 800px PNG)
  async function shrinkImage(file, alpha) {
    if (/svg/.test(file.type)) {
      const dataUrl = await readAsDataURL(file);
      return { dataUrl, before: file.size, after: file.size };
    }
    const img = await loadImage(file);
    const max = alpha ? 800 : IMAGE_MAX_SIDE;
    const w = img.naturalWidth, h = img.naturalHeight;
    const scale = Math.min(1, max / Math.max(w, h));
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!alpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch); }
    ctx.drawImage(img, 0, 0, cw, ch);
    let dataUrl = canvas.toDataURL(alpha ? 'image/png' : 'image/jpeg', IMAGE_QUALITY);
    let after = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 3 / 4);
    if (scale === 1 && file.size <= after && (alpha ? /png|webp/.test(file.type) : file.type === 'image/jpeg')) {
      dataUrl = await readAsDataURL(file);
      after = file.size;
    }
    return { dataUrl, before: file.size, after, w, h };
  }

  // 에셋(사진·영상·내 글꼴) 공통 처리
  const ASSET_EXT = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov'
  };

  function dataUrlToBytes(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return { bytes: new Uint8Array(0), mime: 'application/octet-stream' };
    const comma = dataUrl.indexOf(',');
    if (comma === -1) return { bytes: new Uint8Array(0), mime: 'application/octet-stream' };
    const head = dataUrl.slice(0, comma);
    const b64 = dataUrl.slice(comma + 1);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
    return { bytes, mime };
  }

  function usedAssetIds(site, assets) {
    const ids = new Set();
    if (!site || !assets) return [];
    const walk = (v) => {
      if (typeof v === 'string' && assets[v]) ids.add(v);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    const allBlocks = [
      ...(site.shared || []),
      ...(site.pages ? site.pages.flatMap((p) => p.blocks || []) : [])
    ];
    allBlocks.forEach((b) => walk(b.props));
    if (site.info) walk([site.info.shareImage, site.info.icon]);
    if (site.fonts) walk(site.fonts.map((f) => f.asset));
    return [...ids];
  }

  // 사이트에서 쓰는 사진·영상·글꼴 파일 목록과 경로를 똑같이 만들어요
  function buildSiteAssetFiles(site, assets) {
    const files = [];
    const paths = {};
    const fontOf = {};
    (site && site.fonts || []).forEach((f) => { fontOf[f.asset] = f; });
    const usedNames = new Set();
    const usedIds = usedAssetIds(site, assets);

    usedIds.forEach((id) => {
      const dataUrl = assets && assets[id];
      if (!dataUrl) return;
      const { bytes, mime } = dataUrlToBytes(dataUrl);
      if (fontOf[id]) {
        let base = (fontOf[id].name.replace(/[^0-9A-Za-z가-힣_-]+/g, '-').replace(/^-+|-+$/g, '') || 'font');
        while (usedNames.has(base)) base += '-2';
        usedNames.add(base);
        const path = `fonts/${base}.${fontOf[id].format || 'woff2'}`;
        paths[id] = path;
        files.push({ name: path, data: bytes, mime });
        return;
      }
      // 자료 파일 (PDF · 한글 …): files/ 폴더에 그대로
      if (/^doc-/.test(id)) { const path = `files/${id.replace(/^doc-/, '')}`; paths[id] = path; files.push({ name: path, data: bytes, mime }); return; }
      const isVideo = mime.startsWith('video/');
      const ext = ASSET_EXT[mime] || (isVideo ? 'mp4' : 'jpg');
      const path = isVideo ? `videos/${id}.${ext}` : `images/${id}.${ext}`;
      paths[id] = path;
      files.push({ name: path, data: bytes, mime });
    });

    return { files, paths, usedIds };
  }

  window.HometeoBuild = {
    tidy,
    layout,
    toHref,
    fileOf,
    siteName,
    buildSitePages,
    loadImage,
    readAsDataURL,
    shrinkImage,
    dataUrlToBytes,
    usedAssetIds,
    buildSiteAssetFiles,
    ASSET_EXT
  };
})();
