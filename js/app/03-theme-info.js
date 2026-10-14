/*
 * 홈터 · 편집 화면 동작 (3/12) — 사이트 꾸미기 (색 · 글꼴 · 분위기) · 사이트 정보 (가게 기본 정보 · 공유 · QR)
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// ---------- 사이트 꾸미기 (오른쪽 칸) ----------
let sidePanel = null;   // 'theme' 이면 오른쪽 칸에 사이트 꾸미기
const PALETTE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1-.8-1.4-.8-2.4 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4c0-4.7-4-8.4-9-8.4z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/></svg>';
// 색 고르기에서 기억할 것 (보기 상태라 저장하지 않아요)
let themeFamily = 'base';                       // 추천 색 묶음에서 펼친 계열
const harm = { base: '', mix: 0.35, photo: [] }; // 색 조합 찾기: 기준 색 · 섞기 정도 · 사진에서 뽑은 색
let themeLocks = {};                            // 자물쇠로 고정한 색 { bg: '#…' }
const codeIn = { open: false, key: 'point', kind: 'hex' };   // 색 번호로 넣기 칸
// 작은 사이트 미리보기 (메뉴 · 배너 · 글 · 버튼)
function themeMini(t) {
  const TH = window.HometeoTheme;
  const x = TH.normalize(t);
  const ink = x.text || TH.inkOn(x.bg);
  return `<span class="tmini" style="--b:${x.bg};--t:${ink};--p:${x.point};--pi:${TH.inkOn(x.point)};--d:${x.dark};--di:${TH.inkOn(x.dark)}" aria-hidden="true">
    <i class="tm-head"><b></b><b></b><b></b></i><i class="tm-ban"><b></b><b class="s"></b><em></em></i><i class="tm-body"><b></b><b class="s"></b><em></em></i></span>`;
}
const colorCodes = (hex) => {
  const TH = window.HometeoTheme;
  const rgb = TH.hexToRgb(hex), cmyk = TH.rgbToCmyk(...rgb);
  return `<span class="tc-codes"><code>${hex.toUpperCase()}</code><code>RGB ${rgb.join(' ')}</code>${getShowEn() ? `<code>CMYK ${cmyk.join(' ')}</code>` : ''}</span>`;
};
const LOCK_ICON = (on) => on
  ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>';
function themeHtml() {
  const TH = window.HometeoTheme;
  useFonts();
  const t = TH.normalize(state.site.theme);
  const fonts = state.site.fonts || [];
  const fontSel = (key, kind, cur) => `<select class="input small" data-theme-font="${key}" aria-label="${kind === 'ko' ? '한글 글꼴' : '영문 글꼴'}">
    ${TH.fontList(kind).map((f) => `<option value="${f.id}" ${f.id === cur ? 'selected' : ''}>${f.custom ? '★ ' : ''}${escapeHtml(f.name)}${f.note ? ' · ' + escapeHtml(f.note) : ''}</option>`).join('')}
  </select>`;
  const same = (a, b) => a.bg.toLowerCase() === b.bg.toLowerCase() && a.point.toLowerCase() === b.point.toLowerCase() && a.dark.toLowerCase() === b.dark.toLowerCase();
  const color = (key, label, help) => {
    const v = t[key] || TH.inkOn(t.bg);
    const lockable = key !== 'text';
    return `<div class="theme-color">
      <label class="tc-swatch" style="background:${v}"><input type="color" data-theme-color="${key}" value="${v}" aria-label="${label}"></label>
      <span><b>${label}</b><small>${help}</small>${key === 'text' && !t.text ? '<span class="tc-codes"><code>자동</code></span>' : colorCodes(v)}</span>
      ${lockable ? `<button class="tc-lock${themeLocks[key] ? ' is-on' : ''}" data-theme-lock="${key}" title="${themeLocks[key] ? '고정 풀기' : '이 색 고정하기 (색 묶음 · 조합을 골라도 그대로)'}" aria-pressed="${themeLocks[key] ? 'true' : 'false'}">${LOCK_ICON(!!themeLocks[key])}</button>` : ''}
    </div>`;
  };
  // 글자가 잘 안 보이면 알려줘요
  const issues = TH.checkColors(t);
  const alert = issues.length ? `<div class="theme-alert lv-${issues.some((i) => i.level === 'red') ? 'red' : 'yellow'}">
      <b>글자가 잘 안 보일 수 있어요</b>
      <ul>${issues.map((i) => `<li>${escapeHtml(i.text)}</li>`).join('')}</ul>
      <button class="btn btn-primary small" data-theme-fix>추천 색으로 바꾸기</button>
    </div>` : '';
  // 추천 색 묶음
  const fam = themeFamily;
  const famChip = (id, name, dot) => `<button class="fam-chip${fam === id ? ' is-on' : ''}" data-theme-family="${id}"><i style="background:${dot}"></i>${name}</button>`;
  const presets = fam === 'base'
    ? TH.PRESETS.map((pr) => Object.assign({}, pr))
    : TH.familyPresets(fam);
  const presetCards = presets.map((pr) => `<button class="theme-card${same(pr, t) ? ' is-on' : ''}" data-theme-preset="${pr.id}" data-fam="${fam}">
      ${themeMini(pr)}<span>${escapeHtml(pr.name)}</span></button>`).join('');
  const PLAIN_GROUP = { rgb: '화면에서 선명한 색', cmyk: '명함 · 전단지와 맞추기 좋은 색', etc: '그 밖의 색' };
  const groups = TH.GROUPS.map((g) => `<div class="fam-group"><small>${getShowEn() ? `${g.name}${g.help ? ` · ${g.help}` : ''}` : (PLAIN_GROUP[g.id] || g.name)}</small><div class="fam-row">
      ${TH.FAMILIES.filter((f) => f.group === g.id).map((f) => famChip(f.id, f.name, TH.familyPresets(f.id)[2].point)).join('')}</div></div>`).join('');
  // 색 조합 찾기
  const base = harm.base || t.point;
  const harmCards = TH.HARMONY.map((H) => {
    const th = TH.harmonyTheme(base, H.id, harm.mix, themeLocks);
    return `<button class="harm-card${same(th, t) ? ' is-on' : ''}" data-harm-apply="${H.id}">
      ${themeMini(th)}
      <span class="harm-txt"><b>${H.name}</b><small>${H.orig} · ${H.feel}</small>
        <span class="harm-dots">${TH.harmonyColors(base, H.id).map((c) => `<i style="background:${c}"></i>`).join('')}</span></span>
    </button>`;
  }).join('');
  const custom = fonts.map((f) => `<li class="my-font">
      <span><b style="font-family:'ht-${escapeHtml(f.id)}'">${escapeHtml(f.name)}</b><small>${f.format.toUpperCase()} · ${fmtSize(f.size || 0)}${(f.size || 0) > 2 * 1024 * 1024 ? ' · <em>파일이 커서 사이트가 느려질 수 있어요</em>' : ''}</small>
      <label class="check small"><input type="checkbox" data-font-license="${f.id}" ${f.licensed ? 'checked' : ''}> 홈페이지에 써도 되는 글꼴인지 확인했어요 (상업용 포함)</label></span>
      <button class="icon-btn" data-font-del="${f.id}" title="이 글꼴 빼기" aria-label="이 글꼴 빼기">${ICON.trash}</button>
    </li>`).join('');
  return `
    <div class="picker-head">
      <div><h3>사이트 꾸미기${enTag('Theme')}</h3><small>여기서 정한 색과 글꼴이 모든 페이지 · 모든 블록에 적용돼요</small></div>
      <button class="icon-btn" data-theme-close title="닫기 (Esc)" aria-label="닫기">${ICON.x}</button>
    </div>
    ${alert}
    ${moodHtml()}
    <section class="field">
      <h3 class="field-title">추천 색 묶음${enTag('Presets')}</h3>
      <div class="fam-group"><div class="fam-row">${famChip('base', '홈터 추천', '#F2B33D')}</div></div>
      ${groups}
      <div class="theme-cards">${presetCards}</div>
      <p class="field-help">누르면 바로 바뀌어요. 마음에 안 들면 Ctrl + Z 로 되돌려요. 자물쇠로 고정한 색은 그대로 둬요.</p>
    </section>
    <section class="field" data-fold-key="theme-harmony">
      <h3 class="field-title">색 조합 찾기${enTag('Harmony')}</h3>
      <p class="field-help first">좋아하는 색 하나를 고르면 어울리는 조합을 만들어 드려요. 가게 로고나 사진에서 색을 뽑을 수도 있어요.</p>
      <div class="harm-base">
        <label class="tc-swatch" style="background:${base}"><input type="color" data-harm-base value="${base}" aria-label="기준 색"></label>
        <span><b>기준 색</b>${colorCodes(base)}</span>
        <button class="btn small" data-harm-photo>${ICON.image} 사진에서 색 뽑기</button>
      </div>
      ${harm.photo.length ? `<div class="harm-photo"><small>사진에서 찾은 색 · 눌러서 기준 색으로</small><div>${harm.photo.map((c) => `<button class="harm-pick${c === base ? ' is-on' : ''}" data-harm-pick="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div></div>` : ''}
      <div class="harm-cards">${harmCards}</div>
      <div class="row-btns"><button class="btn small" data-harm-shuffle>다시 섞기 (밝기 · 진하기 바꾸기)</button></div>
    </section>
    <section class="field">
      <h3 class="field-title">색 직접 고르기${enTag('Colors')}</h3>
      ${color('bg', '바탕색', '글 · 사진 · 카드 · 맨 위 메뉴의 바탕')}
      ${color('point', '포인트색', '버튼 · 강조')}
      ${color('dark', '어두운 칸', '메인 배너 · 어두운 맨 아래 정보')}
      ${color('text', '글자색', t.text ? '직접 고른 색' : '바탕색에 맞춰 저절로')}
      <label class="check"><input type="checkbox" data-theme-textauto ${t.text ? '' : 'checked'}> 글자색은 바탕색에 맞춰 저절로</label>
      <details class="code-in"${codeIn.open ? ' open' : ''}>
        <summary data-code-toggle>색 번호로 넣기 (HEX · RGB${getShowEn() ? ' · CMYK' : ''})</summary>
        <div class="code-row">
          <select class="input small" data-code-key aria-label="어느 색">${[['point', '포인트색'], ['bg', '바탕색'], ['dark', '어두운 칸'], ['text', '글자색']].map(([v, l]) => `<option value="${v}"${codeIn.key === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
          <select class="input small" data-code-kind aria-label="번호 방식">${[['hex', 'HEX (#F2B33D)'], ['rgb', 'RGB (242 179 61)'], ['cmyk', 'CMYK (0 26 75 5)']].filter(([v]) => v !== 'cmyk' || getShowEn() || codeIn.kind === 'cmyk').map(([v, l]) => `<option value="${v}"${codeIn.kind === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </div>
        <div class="code-row"><input class="input small" type="text" data-code-val placeholder="${{ hex: '#F2B33D', rgb: '242 179 61', cmyk: '0 26 75 5' }[codeIn.kind]}"><button class="btn small" data-code-apply>넣기</button></div>
        ${getShowEn() ? '<p class="field-help">CMYK는 인쇄용 번호라 화면에서는 조금 다르게 보일 수 있어요. 명함 · 간판 색과 맞출 때 써요.</p>' : ''}
      </details>
      <p class="field-help">블록마다 색을 따로 고르면 그 블록만 바뀌어요. 블록의 색 고르기 맨 앞 <b>‘자동’</b>을 고르면 다시 사이트 색을 따라요.</p>
    </section>
    <section class="field">
      <h3 class="field-title">글꼴${enTag('Fonts')}</h3>
      <h4 class="field-sub first">한글</h4>${fontSel('font.ko', 'ko', t.font.ko)}
      <h4 class="field-sub">영문 <small>영문 · 숫자에만 쓰여요</small></h4>${fontSel('font.en', 'en', t.font.en)}
      <div class="font-sample" style="font-family:${escapeHtml(TH.stack(t.font))}">가나다라 홈터 ABC 123</div>
      <label class="check"><input type="checkbox" data-theme-head ${t.head ? 'checked' : ''}> 제목 글꼴 따로 정하기</label>
      ${t.head ? `<div class="theme-head">
        <h4 class="field-sub first">제목 · 한글</h4>${fontSel('head.ko', 'ko', t.head.ko)}
        <h4 class="field-sub">제목 · 영문</h4>${fontSel('head.en', 'en', t.head.en)}
        <div class="font-sample head" style="font-family:${escapeHtml(TH.stack(t.head))}">제목은 이렇게 Title 2026</div>
      </div>` : ''}
      <p class="field-help">처음엔 제목과 본문이 같은 글꼴이에요. 목록의 글꼴은 모두 무료로 상업적으로 써도 돼요. 인터넷에 연결돼 있을 때 보여요.</p>
      <h4 class="field-sub">읽기 쉬운 글꼴 <small>본문에 추천</small></h4>
      ${readableHtml()}
      <h4 class="field-sub">내 글꼴 <small>★ 표시로 목록에 생겨요</small></h4>
      ${custom ? `<ul class="my-fonts">${custom}</ul>` : ''}
      <div class="row-btns"><button class="btn" data-font-add>${ICON.plus} 내 글꼴 올리기</button></div>
      <h4 class="field-sub">글꼴 찾기</h4>
      <div class="font-find">
        <a class="font-find-card" href="https://noonnu.cc" target="_blank" rel="noopener"><b>눈누</b><small>무료 한글 글꼴 모음 · 상업용 가능 여부를 함께 보여줘요</small></a>
        <a class="font-find-card" href="https://www.sandollcloud.com" target="_blank" rel="noopener"><b>산돌구름</b><small>산돌 글꼴 · 무료 글꼴도 있어요 (가입 필요)</small></a>
      </div>
      <p class="field-help">woff2 · woff · ttf · otf 파일을 넣을 수 있어요. 한글 글꼴은 파일이 커서(수 MB) 사이트가 느려질 수 있으니 <b>woff2</b>를 추천해요. 내려받으면 <code>fonts</code> 폴더에 함께 들어가요. 글꼴마다 쓸 수 있는 곳이 달라요 — 꼭 사용 범위를 확인하세요.</p>
    </section>`;
}
const fmtSize = (n) => (n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB');
// 올린 글꼴을 글꼴 목록 · 편집 화면에 알려줘요
function useFonts() { window.HometeoTheme.setCustom(state.site && state.site.fonts); }
function fontFaceFor(urlOf) { return window.HometeoTheme.fontFaceCss(state.site.fonts || [], urlOf); }
const INFO_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>';
const siteName = () => (nameSynced() ? siteTitle() : (state.site.info && state.site.info.name) || siteTitle());
function infoHtml() {
  const inf = state.site.info || newInfo();
  const pg = curPage();
  const share = helpers.asset(inf.shareImage), icon = helpers.asset(inf.icon);
  const desc = pg.desc || inf.desc;
  const host = (inf.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '내-홈페이지-주소';
  const slot = (key, src, rec, label, alpha) => src
    ? `<div class="photo-preview${alpha ? ' contain' : ''}"><img src="${src}" alt=""></div>
       <p class="photo-rec" data-rec-w="${rec.w}">권장 ${rec.text}<span data-photo-real></span></p>
       <div class="row-btns"><button class="btn" data-info-pick="${key}"${alpha ? ' data-alpha="1"' : ''}>${ICON.image} 바꾸기</button><button class="btn btn-ghost" data-info-clear="${key}">빼기</button></div>`
    : `<button class="photo-drop" data-info-pick="${key}"${alpha ? ' data-alpha="1"' : ''}>${ICON.image}<strong>${label}</strong></button><p class="photo-rec">권장 ${rec.text}</p>`;
  return `
    <div class="picker-head">
      <div><h3>사이트 기본 정보${enTag('Site info')}</h3><small>검색 결과와 카톡 · 문자로 주소를 보낼 때 보이는 정보예요</small></div>
      <button class="icon-btn" data-panel-close title="닫기 (Esc)" aria-label="닫기">${ICON.x}</button>
    </div>
    <section class="field" id="biz-sec">
      <h3 class="field-title">가게 기본 정보 <small>한 번 고치면 홈페이지 전체가 바뀌어요</small></h3>
      ${(() => {
        const U = ADM_UI(); const v = U.bizValues(state.site); const sync = U.companySynced(state.site, siteName());
        return U.BIZ_FIELDS.map((f) => f.key === 'company'
          ? `<label class="input-label" for="biz-company">${f.label}</label>
             <input id="biz-company" class="input" type="text" data-biz="company" value="${escapeHtml(sync ? siteName() : v.company)}" placeholder="${escapeHtml(f.ph)}"${sync ? ' disabled title="사이트 이름과 같아요"' : ''}>
             <label class="check small"><input type="checkbox" data-biz-sync ${sync ? 'checked' : ''}> 사이트 이름과 같이 쓰기 — 끄면 상호를 따로 적어요 (예: 주식회사 ○○)</label>`
          : `<label class="input-label" for="biz-${f.key}">${f.label}</label><input id="biz-${f.key}" class="input" type="text" data-biz="${f.key}" value="${escapeHtml(v[f.key])}" placeholder="${escapeHtml(f.ph)}">`).join('');
      })()}
      <p class="field-help">예: 전화번호를 바꾸면 맨 위 버튼 · 맨 아래 정보 · 지도 · 퀵메뉴에 들어 있던 예전 번호가 모두 새 번호로 바뀌어요.</p>
      ${(() => {
        const all = ADM_UI().siteBlocks(state.site).map((x) => x.block.type);
        const addr = ADM_UI().bizValues(state.site).address;
        const btns = [
          addr && !all.includes('map') ? '<button class="btn small" data-info-add="map">이 주소로 ‘오시는 길’ 지도 넣기</button>' : '',
          !all.includes('hours') ? '<button class="btn small" data-info-add="hours">‘영업시간’ 넣기</button>' : ''
        ].filter(Boolean).join('');
        return btns ? `<div class="row-btns">${btns}</div>` : '';
      })()}
    </section>
    <section class="field">
      <h3 class="field-title">공유하면 이렇게 보여요</h3>
      <div class="share-card">
        ${share ? `<img src="${share}" alt="">` : '<div class="share-noimg">공유 사진을 넣으면 여기에 보여요</div>'}
        <div class="share-body"><b>${escapeHtml(pg.id === state.site.home ? siteName() : `${pg.name} · ${siteName()}`)}</b><small>${escapeHtml(desc || '한 줄 소개를 적어주세요')}</small><i>${escapeHtml(host)}</i></div>
      </div>
      ${(() => { const w = ADM_UI().shareChecks(state.site, { siteUrl: normAdmin(state.site.admin).siteUrl }); return w.length ? `<ul class="share-warn">${w.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : '<p class="share-ok">카톡 · 문자로 보내도 잘 보여요.</p>'; })()}
    </section>
    <section class="field">
      <h3 class="field-title">이름 · 소개</h3>
      <label class="input-label" for="info-name">사이트 이름</label>
      ${(() => {
        const hasHeader = state.blocks.some((b) => b.type === 'header');
        const synced = nameSynced() && hasHeader;
        return `<input id="info-name" class="input" type="text" ${synced ? 'data-info-logo' : 'data-info="name"'} value="${escapeHtml(synced ? headerLogo() : inf.name)}" placeholder="${escapeHtml(siteTitle())}">
          ${hasHeader ? `<label class="check small"><input type="checkbox" data-info-sync ${nameSynced() ? 'checked' : ''}> 맨 위 메뉴 제목과 같이 쓰기 (추천) — 한쪽을 고치면 다른 쪽도 바뀌어요</label>` : ''}`;
      })()}
      <label class="input-label" for="info-desc">한 줄 소개 <small>(검색 결과 · 공유에 보여요, 80자 안팎)</small></label>
      <textarea id="info-desc" class="input textarea" rows="3" data-info="desc" placeholder="예: 골목 끝 작은 카페, 매일 볶는 원두와 계절 디저트">${escapeHtml(inf.desc)}</textarea>
      <label class="input-label" for="info-pdesc">‘${escapeHtml(pg.name)}’ 페이지 소개 <small>(비우면 위 한 줄 소개)</small></label>
      <textarea id="info-pdesc" class="input textarea" rows="2" data-page-desc placeholder="이 페이지만의 소개 (선택)">${escapeHtml(pg.desc || '')}</textarea>
    </section>
    <section class="field">
      <h3 class="field-title">공유 미리보기 사진</h3>
      ${slot('shareImage', share, { w: 1200, text: '1200 × 630 px (가로 1.91:1)' }, '공유 사진 넣기')}
      <p class="field-help">카톡 · 문자 · SNS로 주소를 보냈을 때 크게 보이는 사진이에요. 가게 간판이나 대표 사진이 좋아요.</p>
    </section>
    <section class="field">
      <h3 class="field-title">작은 아이콘 (브라우저 탭)</h3>
      ${slot('icon', icon, { w: 192, text: '정사각형 192 × 192 px · 투명 배경 PNG' }, '아이콘 넣기', true)}
    </section>
    <section class="field">
      <h3 class="field-title">홈페이지 주소 <small>(인터넷에 올린 뒤)</small></h3>
      <input class="input" type="text" data-info="url" value="${escapeHtml(inf.url)}" placeholder="예: https://hometeo.onrender.com">
      <p class="field-help">인터넷에 올린 뒤 주소를 적고 다시 내려받으면, 카톡 공유에 사진이 제대로 나와요. 공유 사진은 ‘전체 주소’가 있어야 보여서 그래요.</p>
    </section>
    <section class="field">
      <h3 class="field-title">QR 코드 <small>테이블 · 전단지 · 명함용</small></h3>
      ${(() => {
        const url = (inf.url || normAdmin(state.site.admin).siteUrl || '').trim();
        if (!url) return '<p class="field-help">위에 홈페이지 주소를 적으면 QR 코드를 만들 수 있어요.</p>';
        const src = ADM_UI().qrImage(url, siteName());
        return src ? `<img class="qr-preview" src="${src}" alt="홈페이지 QR 코드"><div class="row-btns"><button class="btn" data-qr-save>QR 그림 내려받기</button></div><p class="field-help">휴대폰 카메라로 비추면 홈페이지가 열려요. 인쇄 전에 꼭 한 번 찍어 보세요.</p>` : '';
      })()}
    </section>
    <section class="field">
      <h3 class="field-title">누구나 읽기 쉽게</h3>
      ${readableHtml()}
      <p class="field-help">본문 글꼴을 또렷하고 읽기 쉬운 글꼴로 바꿔요. 어르신이 많이 찾는 곳이나 공공기관에 추천해요. 제목 글꼴은 그대로예요. 사진 설명 글이 빠진 곳과 흐린 글자는 점검에서 알려줘요.</p>
    </section>
    <section class="field">
      <h3 class="field-title">글자 한 번에 바꾸기</h3>
      <input class="input" type="text" id="rep-find" placeholder="찾을 글 (예: 아메리카노)">
      <input class="input" type="text" id="rep-to" placeholder="바꿀 글 (예: 오늘의 커피)" style="margin-top:6px">
      <div class="row-btns"><button class="btn" data-replace-all>모든 페이지에서 바꾸기</button></div>
      <p class="field-help">모든 페이지의 글에서 찾아 바꿔요. 마음에 안 들면 되돌리기(Ctrl + Z)로 돌아와요.</p>
    </section>`;
}

let adminTab = 'design';   // design: 관리자 화면 꾸미기 · guide: 따라 하기 안내
function openAdmin(tab) { if (tab) adminTab = tab; finishEdit(true); picker = null; state.selectedId = null; sidePanel = 'admin'; render(); els.inspector.scrollTop = 0; }
// 관리자 화면 배치도 바꾸기
function setAdminUI(label, fn) {
  setAdmin(label, (adm) => { const ui = ADM_UI().normUI(adm.ui); fn(ui); adm.ui = ADM_UI().normUI(ui); });
  renderInspector();
  sendAdminPreview();
}
function setAdmin(label, fn) {
  changeSite(label, () => {
    const adm = Object.assign(newAdmin(), state.site.admin || {});
    fn(adm);
    state.site.admin = normAdmin(adm);
  });
}
function adminHtml() {
  const adm = normAdmin(state.site.admin);
  return `
    <div class="picker-head">
      <h3>🔒 관리자 화면${enTag('Admin')}</h3>
      <button class="icon-btn" data-panel-close title="닫기">${ICON.x}</button>
    </div>
    <div class="segmented adm-tabs-switch" role="tablist">
      <button class="${adminTab === 'design' ? 'is-on' : ''}" data-adm-tab="design" role="tab" aria-selected="${adminTab === 'design'}">꾸미기</button>
      <button class="${adminTab === 'guide' ? 'is-on' : ''}" data-adm-tab="guide" role="tab" aria-selected="${adminTab === 'guide'}">따라 하기 안내</button>
    </div>
    ${adminTab === 'design' ? adminDesignHtml(adm) : adminGuideHtml(adm)}`;
}
