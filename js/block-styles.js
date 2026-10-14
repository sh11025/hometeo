/*
 * 블록의 실제 모습 (홈페이지에 들어갈 모습)
 * ------------------------------------------------------------
 * 편집 화면, 새 탭 미리보기, 내려받기가 모두 이 한 가지 모습을 써요.
 *
 * 두 가지 기준으로 모습이 바뀌어요.
 *   1) 페이지 폭 (@container ib) : 640px 이하면 '휴대폰' → 모든 블록이 전체 너비로 한 줄씩
 *   2) 블록 폭 (@container blk) : 블록 자신이 좁으면 '좁은 모습' → 글자·여백이 작아지고 사진이 위로
 */
window.HOMETEO_BLOCK_CSS = `
.ib-page { container: ib / inline-size; background: var(--c-bg, #fff); color: var(--c-text, #2B2A28); font-family: var(--font-body, inherit); }
/* 제목 글꼴 (따로 정하지 않으면 본문 글꼴) */
.ib-page h1, .ib-page h2, .ib-page h3, .ib-page h4, .ib-page .b-logo, .ib-page .b-footer-info strong { font-family: var(--font-head, var(--font-body, inherit)); }
.ib-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: var(--gap, 0px); }
.ib-grid > *, .ib-side { min-width: 0; container: blk / inline-size; display: flex; flex-direction: column; }
.ib-grid > * > * { flex: 1 1 auto; }

/* 벽에 고정한 맨 위 메뉴 (ib-side) : PC에서는 옆에 세로로, 휴대폰에서는 맨 위로 */
.ib-page.has-side .ib-frame { display: flex; align-items: flex-start; }
.ib-page.side-right .ib-frame { flex-direction: row-reverse; }
.ib-page.has-side .ib-body { flex: 1 1 auto; min-width: 0; }
.ib-side { flex: none; width: 240px; position: sticky; top: 0; height: 100vh; z-index: 30; }
.ib-side > * { flex: 1 1 auto; display: flex; flex-direction: column; }
.ib-side > * > * { flex: 1 1 auto; }

/* 페이지 영역: 맨 위 · 메인 배너 · 본문 · 맨 아래. 영역마다 12칸이 따로 있어요 */
.ib-zone { position: relative; }
.zone-header { z-index: 30; }
.zone-header.is-sticky { position: sticky; top: 0; }

/* 블록마다 정하는 높이 · 여백 · 휴대폰 너비 (상자에 --minh, --pt, --pb, --mspan 으로 들어와요) */
/* 높이: 블록을 감싸는 상자에 최소 높이를 주면, 안쪽 블록이 그만큼 늘어나요 */
.ib-grid > *, .ib-side { min-height: var(--minh, auto); }
/* 휴대폰에서는 정한 높이를 4분의 3으로 (화면 가득은 그대로) */
.ib-cell.has-pt > *, .blk.has-pt > .blk-body > * { padding-top: calc(var(--pt) * var(--pscale, 1)) !important; }
.ib-cell.has-pb > *, .blk.has-pb > .blk-body > * { padding-bottom: calc(var(--pb) * var(--pscale, 1)) !important; }
.ib-cell.has-px > *, .blk.has-px > .blk-body > * { padding-left: calc(var(--px) * var(--pscale, 1)) !important; padding-right: calc(var(--px) * var(--pscale, 1)) !important; }

/* 사진에서 보일 부분과 확대 (휴대폰을 따로 맞추면 휴대폰에서는 --ixm …) */
img[style*="--ix"] { object-position: var(--ix) var(--iy); transform-origin: var(--ix) var(--iy); transform: scale(var(--iz, 1)); }
@container ib (max-width: 640px) {
  img[style*="--ixm"] { object-position: var(--ixm) var(--iym); transform-origin: var(--ixm) var(--iym); transform: scale(var(--izm, 1)); }
}

/* 공통 */
.b-button {
  display: inline-block; padding: 13px 26px; border-radius: 999px;
  background: var(--c-point, #F2B33D); color: var(--c-point-ink, #2B2A28); font-weight: 700; text-decoration: none; line-height: 1.2;
}
.b-button.small { padding: 9px 16px; font-size: 14px; }
.b-button.outline { background: transparent; color: inherit; box-shadow: inset 0 0 0 1.5px currentColor; }
.b-eyebrow { display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; opacity: .75; margin-bottom: 10px; }

/* ---------- 맨 위 메뉴 ---------- */
.b-header { position: relative; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); border-bottom: 1px solid rgba(0,0,0,.07); }
.b-header.is-dark { color: #fff; border-bottom-color: rgba(255,255,255,.1); }
.b-header-row { display: flex; align-items: center; gap: 24px; padding: 16px 40px; min-height: 72px; }
.b-logo { display: inline-flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: inherit; text-decoration: none; flex: none; }
.b-logo img { display: block; width: auto; max-width: 220px; object-fit: contain; }
.b-nav { display: flex; gap: 6px; margin-left: auto; font-size: 15px; }
.b-nav-item { position: relative; }
.b-nav-item > a { display: block; padding: 10px 12px; color: inherit; opacity: .8; text-decoration: none; border-radius: 8px; white-space: nowrap; word-break: keep-all; }
.b-nav-item > a:hover { opacity: 1; }
.b-nav-item.has-sub > a::after { content: ''; display: inline-block; width: 6px; height: 6px; margin-left: 6px; border: solid currentColor; border-width: 0 1.5px 1.5px 0; transform: translateY(-3px) rotate(45deg); opacity: .6; }
.b-sub {
  position: absolute; top: 100%; left: 50%; transform: translate(-50%, 6px); z-index: 40;
  min-width: 160px; padding: 8px; background: var(--c-bg, #fff); color: var(--c-text, #2B2A28);
  border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.14);
  opacity: 0; visibility: hidden; transition: opacity .15s, transform .15s;
}
.b-nav-item:hover .b-sub, .b-nav-item:focus-within .b-sub { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
.b-sub a { display: block; padding: 9px 12px; border-radius: 8px; color: inherit; text-decoration: none; font-size: 14px; white-space: nowrap; }
.b-sub a:hover { background: #F4F4F6; }
.b-header-side { display: flex; align-items: center; gap: 8px; flex: none; }
.b-menu-btn { display: none; width: 40px; height: 40px; place-items: center; border: 0; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; }
.b-menu-btn svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.b-header.layout-center .b-header-row { flex-wrap: wrap; justify-content: center; padding-top: 22px; padding-bottom: 6px; }
.b-header.layout-center .b-logo { width: 100%; justify-content: center; font-size: 24px; }
.b-header.layout-center .b-nav { margin: 0 auto; }
.b-header.layout-center .b-header-side { position: absolute; right: 40px; top: 22px; }
/* 메뉴 배치: 로고 가운데 · 메뉴 양옆 / 위에 제목 · 아래 양옆 */
.b-header.layout-split .b-header-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: 24px; }
.b-split-l, .b-split-r { display: flex; align-items: center; min-width: 0; }
.b-split-l { justify-content: flex-end; }
.b-split-r { justify-content: space-between; gap: 12px; }
.b-header.layout-split .b-nav { margin: 0; }
.b-header.layout-split .b-logo { justify-self: center; }
.b-header.layout-split-top .b-title-row { position: relative; justify-content: center; padding-top: 22px; padding-bottom: 4px; min-height: 0; }
.b-header.layout-split-top .b-title-row .b-logo { font-size: 26px; }
.b-header.layout-split-top .b-title-row .b-header-side { position: absolute; right: 40px; top: 50%; transform: translateY(-50%); }
.b-header.layout-split-top .b-nav-row { justify-content: space-between; min-height: 0; padding-top: 4px; padding-bottom: 10px; }
.b-header.layout-split-top .b-nav { margin: 0; }

/* 두 줄 메뉴의 윗줄 */
.b-header-top { display: flex; justify-content: flex-end; padding: 6px 40px 0; font-size: 12.5px; }
.b-top-links { display: flex; align-items: center; gap: 12px; }
.b-top-links a { color: inherit; opacity: .6; text-decoration: none; }
.b-top-links a:hover { opacity: 1; }
.b-top-sep { width: 1px; height: 10px; background: currentColor; opacity: .25; }
.b-header.has-top .b-header-row { padding-top: 6px; }
.b-panel-top { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px 18px; padding-top: 12px; border-top: 1px solid #eee; }
.b-panel-top a { font-size: 13px; color: #888; text-decoration: none; }
/* 지금 보고 있는 곳 (화면을 내리면 그 블록의 메뉴가 표시돼요) */
.b-nav-item > a.is-current { opacity: 1; font-weight: 700; box-shadow: inset 0 -2px 0 currentColor; border-radius: 0; }
.b-header.pos-side .b-nav-item > a.is-current { box-shadow: inset 3px 0 0 currentColor; padding-left: 10px !important; }
.b-panel a.is-current { color: #3B6FD8 !important; font-weight: 700; }
/* 전체 메뉴 (로고 또는 ☰ 를 누르면 펼쳐져요) */
.b-panel {
  display: none; position: absolute; left: 0; right: 0; top: 100%; z-index: 35;
  padding: 28px 40px 32px; background: var(--c-bg, #fff); color: var(--c-text, #2B2A28);
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px 32px;
  box-shadow: 0 18px 32px rgba(0,0,0,.12); border-top: 1px solid #eee;
}
.b-header.is-open .b-panel { display: grid; }
.b-panel-group { display: flex; flex-direction: column; gap: 2px; }
.b-panel-group a { color: #666; text-decoration: none; padding: 6px 0; font-size: 14px; }
.b-panel-group a { color: inherit !important; opacity: .65; }
.b-panel-group a.b-panel-main { opacity: 1; font-weight: 700; font-size: 16px; }

/* ---------- 메인 배너 (한 장: 고정 · 여러 장: 슬라이드) ---------- */
.b-banner { position: relative; overflow: hidden; display: grid; min-height: 300px; color: #fff; }
.b-slide {
  grid-area: 1 / 1; position: relative; display: flex; align-items: center; justify-content: center;
  padding: 72px 72px; background: var(--c-dark, #2F4A7A); color: var(--c-dark-ink, #fff); text-align: center;
  opacity: 0; visibility: hidden; transition: opacity .6s ease, visibility .6s;
}
.b-slide.is-active, .b-banner.is-single .b-slide { opacity: 1; visibility: visible; }
.b-slide-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.b-slide.has-image, .b-slide.has-m { color: #fff; }
.b-slide.has-image::before { content: ''; position: absolute; inset: 0; background: rgba(20, 18, 15, var(--overlay, .45)); z-index: 1; }
.b-slide-inner { position: relative; z-index: 2; width: 100%; max-width: 680px; }
.b-banner.align-left .b-slide { justify-content: flex-start; text-align: left; }
.b-banner.align-left .b-slide-inner { max-width: 1040px; margin: 0 auto; }
.b-banner.align-left .b-slide-inner > * { max-width: 620px; }
.b-slide h1, .b-slide h2 { font-size: 44px; line-height: 1.25; letter-spacing: -0.03em; margin: 0 0 16px; }
.b-slide p { font-size: 18px; line-height: 1.7; opacity: .9; margin: 0 0 30px; }
.b-slider-arrow {
  position: absolute; top: 50%; z-index: 5; transform: translateY(-50%);
  width: 46px; height: 46px; display: grid; place-items: center; cursor: pointer;
  border: 0; border-radius: 50%; background: rgba(255,255,255,.18); color: #fff;
}
.b-slider-arrow:hover { background: rgba(255,255,255,.32); }
.b-slider-arrow svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.b-slider-arrow.prev { left: 18px; } .b-slider-arrow.next { right: 18px; }
.b-slider-dots { position: absolute; left: 0; right: 0; bottom: 20px; z-index: 5; display: flex; justify-content: center; gap: 8px; }
.b-slider-dots button { width: 9px; height: 9px; padding: 0; border: 0; border-radius: 999px; background: rgba(255,255,255,.5); cursor: pointer; transition: width .25s, background .25s; }
.b-slider-dots button.is-active { width: 26px; background: #fff; }
.b-slider-dots button[hidden] { display: none; }

/* ---------- 카드 슬라이드 ---------- */
.b-cards { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-cards.is-dark { color: #fff; }
.b-cards-head { max-width: 720px; margin: 0 auto 32px; text-align: center; }
.b-cards-head h2 { font-size: 30px; line-height: 1.35; letter-spacing: -0.02em; margin: 0; }
.b-cards-head p { font-size: 16px; line-height: 1.7; opacity: .75; margin: 10px 0 0; }
.b-cards-wrap { position: relative; max-width: 1040px; margin: 0 auto; }
.b-cards-viewport { overflow: hidden; margin: 0 -10px; }
.b-cards { --per: var(--per-set, 3); }
/* 카드는 위→아래, 왼쪽→오른쪽 순서로 칸에 들어가요 (2줄이면 한 칸에 두 장) */
.b-cards-track {
  display: grid; grid-auto-flow: column; grid-template-rows: repeat(var(--rows, 1), auto);
  grid-auto-columns: calc(100% / var(--per)); row-gap: 28px;
  transition: transform .5s ease; transform: translateX(calc(var(--pos, 0) * -100% / var(--per)));
}
.b-card { min-width: 0; padding: 0 10px; display: block; color: inherit; text-decoration: none; }
.b-card-media { position: relative; display: block; overflow: hidden; border-radius: 14px; background: #EEE; }
.b-card-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.b-card-body { display: block; padding: 14px 2px 0; }
.b-card-body strong { display: block; font-size: 17px; line-height: 1.4; }
.b-card-text { display: block; margin-top: 6px; font-size: 14px; line-height: 1.65; opacity: .72; }
a.b-card:not(.no-link):hover .b-card-media img { filter: brightness(.94); }
.b-cards .b-slider-arrow { top: 0; transform: translateY(var(--arrow-y, 90px)); background: #fff; color: #2B2A28; box-shadow: 0 4px 14px rgba(0,0,0,.18); width: 42px; height: 42px; }
.b-cards .b-slider-arrow:hover { background: #fff; filter: brightness(.95); }
.b-cards .b-slider-arrow.prev { left: -14px; } .b-cards .b-slider-arrow.next { right: -14px; }
.b-cards .b-slider-dots { position: static; margin-top: 24px; }
.b-cards .b-slider-dots button { background: rgba(0,0,0,.18); }
.b-cards .b-slider-dots button.is-active { background: var(--c-text, #2B2A28); }
.b-cards.is-dark .b-slider-dots button { background: rgba(255,255,255,.35); }
.b-cards.is-dark .b-slider-dots button.is-active { background: #fff; }
.b-cards.is-static .b-slider-arrow, .b-cards.is-static .b-slider-dots { display: none; }
.b-card-play { position: absolute; left: 50%; top: 50%; z-index: 2; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,.6); color: #fff; }
.b-card-play svg { width: 24px; height: 24px; fill: currentColor; margin-left: 3px; }
a.b-card.is-video:hover .b-card-play { background: #E0302A; }

/* ---------- 글 본문 ---------- */
.b-text { padding: 72px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-text.is-dark { color: #fff; }
.b-text-wrap { max-width: 1040px; margin: 0 auto; }
.b-text.img-none .b-text-content { max-width: 720px; }
.b-text.img-none.align-center .b-text-content { margin: 0 auto; }
.b-text.img-none.align-right .b-text-content { margin-left: auto; }
.b-text.img-left .b-text-wrap, .b-text.img-right .b-text-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
.b-text.img-right .b-text-media { order: 2; }
.b-text-media { position: relative; margin: 0; overflow: hidden; border-radius: 16px; background: #EEE; }
.b-text-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.b-text.align-center { text-align: center; }
.b-text.align-right { text-align: right; }
.b-text h2 { font-size: 30px; line-height: 1.35; letter-spacing: -0.02em; margin: 0 0 18px; }
.b-text-body { font-size: 16px; line-height: 1.85; opacity: .82; }
.b-text .b-button { margin-top: 26px; }

/* ---------- 사진 ---------- */
.b-image { color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-image.is-padded { padding: 48px 40px; }
.b-image.is-dark { color: #fff; }
.b-image-fig { margin: 0 auto; max-width: 1040px; }
.b-image:not(.is-padded) .b-image-fig { max-width: none; }
.b-image-frame { position: relative; overflow: hidden; background: #EEE; }
.b-image-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.b-image-natural { display: block; width: 100%; height: auto; }
.b-image.is-rounded .b-image-frame, .b-image.is-rounded .b-image-natural { border-radius: 16px; }
.b-image-link { display: block; }
.b-image figcaption, .b-video figcaption { margin-top: 12px; font-size: 14px; line-height: 1.6; opacity: .7; text-align: center; padding: 0 16px; }
.b-image:not(.is-padded) figcaption { padding-bottom: 16px; }
.b-image.is-empty, .b-video.is-empty { display: none; }
/* 세로 사진 · 영상: 가운데 좁게 */
.b-image.is-narrow .b-image-fig, .b-video.is-narrow .b-video-fig { max-width: 420px; }
/* 칸에 꽉 채우기: 블록 높이만큼 사진 · 영상을 키워요 (혼자 있으면 4:3 높이) */
.b-image.is-fill, .b-video.is-fill { display: flex; flex-direction: column; }
.b-image.is-fill .b-image-fig, .b-video.is-fill .b-video-fig { flex: 1 1 auto; display: flex; flex-direction: column; width: 100%; max-width: none; }
.b-image.is-fill .b-image-frame, .b-video.is-fill .b-video-frame { flex: 1 1 auto; aspect-ratio: 4 / 3; min-height: 0; max-height: none; width: 100%; }
.b-image.is-fill .b-image-link { flex: 1 1 auto; display: flex; flex-direction: column; }
/* 높이를 정했으면 그 높이를 그대로 채워요 (비율 대신) */
.has-minh .b-image.is-fill .b-image-frame, .has-minh .b-video.is-fill .b-video-frame { aspect-ratio: auto; }
.b-slide-bg.is-m { display: none; }

/* ---------- 영상 ---------- */
.b-video { color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-video.is-padded { padding: 48px 40px; }
.b-video.is-dark { color: #fff; }
.b-video-fig { margin: 0 auto; max-width: 1040px; }
.b-video:not(.is-padded) .b-video-fig { max-width: none; }
.b-video-frame { position: relative; overflow: hidden; background: #111; max-height: 85vh; margin: 0 auto; }
.b-video.is-padded .b-video-frame { border-radius: 14px; }
.b-video-frame iframe, .b-video-frame video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; object-fit: cover; background: #000; }
.b-video-cover { position: absolute; inset: 0; display: grid; place-items: center; background: #1d1d1d; }
.b-video-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .85; }
.b-video-play { position: relative; width: 72px; height: 72px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,.6); color: #fff; }
.b-video-play svg { width: 30px; height: 30px; fill: currentColor; margin-left: 4px; }
.b-video-tag { position: absolute; left: 14px; top: 12px; padding: 4px 10px; border-radius: 999px; background: rgba(0,0,0,.6); color: #fff; font-size: 12px; }

/* ---------- 맨 아래 정보 ---------- */
.b-footer { padding: 48px 40px; font-size: 14px; line-height: 1.75; }
.b-footer.theme-dark { background: var(--c-dark, #2B2A28); color: #cfc8bc; }
.b-footer.theme-light { background: #F4F4F6; color: #6B7280; }
.b-footer-wrap { max-width: 1200px; margin: 0 auto; }
.b-footer-info strong { display: block; font-size: 16px; margin-bottom: 12px; }
.b-footer.theme-dark .b-footer-info strong { color: #fff; }
.b-footer.theme-light .b-footer-info strong { color: #4B5563; }
.b-footer-lines p { margin: 0; word-break: keep-all; }
.b-biz { word-break: keep-all; }
.b-biz span, .b-footer-lines span {
  display: inline-block;
  white-space: nowrap;
}
.b-biz-check { display: inline-block; white-space: nowrap; margin-left: 4px; padding: 0 6px; border: 1px solid currentColor; border-radius: 4px; font-size: .85em; color: inherit; text-decoration: none; opacity: .8; }
.b-biz-check:hover { opacity: 1; }
.b-biz-empty { padding: 8px 12px; border: 1px dashed currentColor; border-radius: 8px; opacity: .6; font-size: 13px; }
.b-sep { font-style: normal; display: inline-block; margin: 0 8px; opacity: .35; transform: scaleY(.8); white-space: nowrap; }
.b-footer-info small { display: block; margin-top: 4px; font-size: 14px; }
.b-footer.theme-dark .b-footer-info small { color: #8f887d; }
.b-footer-sns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.b-sns { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: inherit; text-decoration: none; }
.b-footer.theme-light .b-sns { background: #E8E8EC; color: #6B7280; }
.b-footer.theme-dark .b-sns { background: rgba(255,255,255,.1); color: #e4ded3; }
.b-sns:hover { filter: brightness(.94); }
.b-sns svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; }
.b-sns-txt { font-weight: 800; font-size: 17px; line-height: 1; font-family: Arial, sans-serif; }
.b-sns-txt.small { font-size: 10px; letter-spacing: -.02em; }
.b-footer-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 20px; }
.b-footer-badges img { height: 40px; width: auto; object-fit: contain; opacity: .8; }
.b-footer-top { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 40px 48px; }
.b-footer-info { flex: 1 1 340px; min-width: 0; }
.b-footer-cols { flex: 0 1 auto; display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(96px, 150px)); gap: 28px; }
.b-footer-col h4 { margin: 0 0 14px; font-size: 14px; }
.b-footer.theme-light .b-footer-col h4 { color: #374151; }
.b-footer.theme-dark .b-footer-col h4 { color: #fff; }
.b-footer-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.b-footer-col a, .b-footer-legal a { color: inherit; text-decoration: none; }
.b-footer-col a:hover, .b-footer-legal a:hover { text-decoration: underline; }
.b-footer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 36px; padding-top: 28px; border-top: 1px solid rgba(128,128,128,.25); }
.b-footer-legal { display: flex; flex-wrap: wrap; gap: 8px 30px; }
.b-footer.theme-light .b-footer-legal a { color: #374151; }
.b-footer.theme-dark .b-footer-legal a { color: #e4ded3; }
.b-footer-legal a.is-bold { font-weight: 700; }
.b-footer-select {
  min-width: 200px; height: 42px; padding: 0 36px 0 14px; border-radius: 8px; font: inherit; font-size: 14px;
  appearance: none; -webkit-appearance: none; cursor: pointer;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
  border: 1px solid #DDDDE2; color: #374151;
}
.b-footer.theme-dark .b-footer-select { background-color: #3a3835; border-color: #4a4743; color: #e4ded3; }


/* ---------- 퀵메뉴 (화면에 떠 있는 버튼) ---------- */
.b-quick { position: fixed; z-index: 80; display: flex; flex-direction: column; gap: 10px; }
.b-quick.side-right { right: 20px; } .b-quick.side-left { left: 20px; }
.b-quick.place-bottom { bottom: 24px; } .b-quick.place-middle { top: 50%; transform: translateY(-50%); }
.b-quick-btn {
  display: flex; align-items: center; gap: 8px; text-decoration: none;
  height: 52px; min-width: 52px; justify-content: center; border-radius: 999px;
  background: #fff; color: #2B2A28; box-shadow: 0 6px 18px rgba(0,0,0,.16); font-size: 14px; font-weight: 700;
}
.b-quick.look-pill .b-quick-btn { justify-content: flex-start; padding: 0 18px 0 14px; }
.b-quick.look-circle .b-quick-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.b-quick-ico { width: 24px; height: 24px; display: grid; place-items: center; }
.b-quick-ico svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.b-quick-btn.k-kakao { background: #FEE500; color: #3A1D1D; }
.b-quick-btn.k-kakao svg { fill: currentColor; stroke: none; }
.b-quick-btn.k-phone { background: #2E9E5B; color: #fff; }
.b-quick-btn.k-top { background: var(--c-dark, #2B2A28); color: var(--c-dark-ink, #fff); }
.b-quick-btn.k-map { background: #3B6FD8; color: #fff; }

/* ---------- 사이드 칸 ---------- */
.b-aside { padding: 28px 24px; color: var(--c-text, #2B2A28); background: var(--c-soft, #FBF7EF); }
.b-aside.is-dark { color: #fff; }
.b-aside.is-sticky .b-aside-inner { position: sticky; top: 24px; }
.b-aside h3 { font-size: 15px; margin: 0 0 12px; }
.b-aside ul { list-style: none; margin: 0; padding: 0; }
.b-aside li a { display: block; padding: 10px 0; color: inherit; opacity: .8; text-decoration: none; border-bottom: 1px solid rgba(128,128,128,.2); font-size: 14px; }
.b-aside li a:hover { opacity: 1; }
.b-aside-banner { display: grid; gap: 6px; margin-top: 20px; padding: 14px; border-radius: 12px; background: rgba(255,255,255,.7); color: #2B2A28; text-decoration: none; font-size: 13px; line-height: 1.6; }
.b-aside-banner strong { font-size: 14px; }
.b-aside-img { position: relative; display: block; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 8px; background: #eee; }
.b-aside-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* ---------- 블록 위 제목 (질문 · 후기 · 갤러리 · 가격표) ---------- */
.b-sec-head { max-width: 720px; margin: 0 auto 32px; text-align: center; }
.b-sec-head h2 { font-size: 30px; line-height: 1.35; letter-spacing: -0.02em; margin: 0; }
.b-sec-head p { font-size: 16px; line-height: 1.7; opacity: .72; margin: 10px 0 0; }

/* ---------- 자주 묻는 질문 ---------- */
.b-faq { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-faq-list { max-width: 820px; margin: 0 auto; }
.b-faq-item { border-bottom: 1px solid rgba(128,128,128,.25); }
.b-faq-item:first-child { border-top: 1px solid rgba(128,128,128,.25); }
.b-faq.look-card .b-faq-item { border: 0; margin-bottom: 10px; border-radius: 14px; background: var(--c-soft, #F6F3EC); }
.b-faq summary { list-style: none; display: flex; align-items: center; gap: 12px; padding: 20px 6px; font-size: 17px; font-weight: 700; cursor: pointer; }
.b-faq.look-card summary { padding: 18px 20px; }
.b-faq summary::-webkit-details-marker { display: none; }
.b-faq summary::before { content: 'Q'; flex: none; font-weight: 800; color: var(--c-point, #F2B33D); }
.b-faq summary > span { flex: 1; }
.b-faq-arrow { flex: none; width: 10px; height: 10px; border: solid currentColor; border-width: 0 2px 2px 0; transform: rotate(45deg); opacity: .5; transition: transform .2s; margin-top: -4px; }
.b-faq-item[open] .b-faq-arrow { transform: rotate(-135deg); margin-top: 4px; }
.b-faq-a { padding: 0 6px 22px 30px; font-size: 15.5px; line-height: 1.8; opacity: .82; }
.b-faq.look-card .b-faq-a { padding: 0 20px 20px 44px; }

/* ---------- 후기 ---------- */
.b-reviews { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-soft, #FBF7EF); }
.b-reviews-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 18px; }
.b-review { margin: 0; padding: 26px 24px; border-radius: 16px; background: #fff; color: #2B2A28; box-shadow: 0 4px 18px rgba(0,0,0,.05); display: flex; flex-direction: column; gap: 14px; }
.b-stars { color: var(--c-point, #F2B33D); letter-spacing: 2px; font-size: 16px; }
.b-stars span { color: #DDD8CE; }
.b-review blockquote { margin: 0; flex: 1; font-size: 15.5px; line-height: 1.75; }
.b-review figcaption { display: flex; align-items: center; gap: 10px; }
.b-review figcaption img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.b-review figcaption span { display: grid; gap: 2px; }
.b-review figcaption b { font-size: 14px; }
.b-review figcaption small { font-size: 12.5px; opacity: .6; }

/* ---------- 갤러리 ---------- */
.b-gallery { padding: 56px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-gal-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 16px; }
.b-gallery.gap-s .b-gal-grid { gap: 6px; }
.b-gallery.gap-none .b-gal-grid { gap: 0; }
.b-gal-item { margin: 0; }
.b-gal-frame { position: relative; display: block; overflow: hidden; background: #EEE; }
.b-gallery.is-rounded .b-gal-frame { border-radius: 12px; }
.b-gal-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: filter .2s; }
a.b-gal-frame:hover img { filter: brightness(.9); }
.b-gal-item figcaption { margin-top: 8px; font-size: 13.5px; opacity: .7; text-align: center; }
.ib-zoom { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; background: rgba(15,14,12,.9); }
.ib-zoom img { max-width: 92vw; max-height: 86vh; border-radius: 6px; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
.ib-zoom button { position: absolute; width: 48px; height: 48px; border: 0; border-radius: 50%; background: rgba(255,255,255,.15); color: #fff; font-size: 26px; line-height: 1; cursor: pointer; }
.ib-zoom button:hover { background: rgba(255,255,255,.3); }
.ib-zoom .z-close { top: 18px; right: 18px; }
.ib-zoom .z-prev { left: 18px; top: 50%; transform: translateY(-50%); }
.ib-zoom .z-next { right: 18px; top: 50%; transform: translateY(-50%); }
.ib-zoom .z-count { position: absolute; bottom: 18px; left: 0; right: 0; text-align: center; color: #ddd; font-size: 13px; }

/* ---------- 가격표 ---------- */
.b-pricing { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-price-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 18px; align-items: stretch; }
.b-plan { position: relative; display: flex; flex-direction: column; gap: 10px; padding: 30px 26px; border-radius: 18px; background: #fff; color: #2B2A28; border: 1px solid rgba(0,0,0,.09); }
.b-plan.is-hi { border: 2px solid var(--c-point, #F2B33D); box-shadow: 0 12px 30px rgba(0,0,0,.08); }
.b-plan-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); padding: 4px 14px; border-radius: 999px; background: var(--c-point, #F2B33D); color: var(--c-point-ink, #2B2A28); font-size: 12.5px; font-weight: 800; white-space: nowrap; }
.b-plan h3 { margin: 0; font-size: 19px; }
.b-plan-desc { margin: 0; font-size: 14px; opacity: .65; }
.b-plan-price { display: flex; align-items: baseline; gap: 6px; margin: 6px 0 4px; }
.b-plan-price strong { font-size: 30px; letter-spacing: -0.02em; }
.b-plan-price span { font-size: 14px; opacity: .6; }
.b-plan ul { list-style: none; margin: 0 0 8px; padding: 14px 0 0; border-top: 1px solid rgba(0,0,0,.08); display: grid; align-content: start; gap: 9px; flex: 1; font-size: 14.5px; }
.b-plan li { position: relative; padding-left: 24px; line-height: 1.5; }
.b-plan li::before { content: ''; position: absolute; left: 3px; top: 5px; width: 6px; height: 11px; border: solid var(--c-point, #F2B33D); border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
.b-plan .b-button { text-align: center; }
.b-plan .b-button.outline { color: #2B2A28; }

/* ---------- 지도 · 오시는 길 ---------- */
.b-map { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-map-wrap { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 40px; align-items: center; }
.b-map.layout-stack .b-map-wrap, .b-map.no-map .b-map-wrap { grid-template-columns: 1fr; }
.b-map.layout-stack .b-map-box { order: -1; }
.b-map h2 { margin: 0 0 14px; font-size: 28px; }
.b-map-addr { margin: 0 0 10px; font-size: 18px; font-weight: 700; line-height: 1.5; }
.b-map-detail { margin: 0 0 22px; font-size: 15px; line-height: 1.8; opacity: .78; }
.b-map-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.b-map-btn { display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; }
.b-map-btn b { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 5px; font-size: 12px; font-family: Arial, sans-serif; }
.b-map-btn.naver { background: #03C75A; color: #fff; } .b-map-btn.naver b { background: #fff; color: #03C75A; }
.b-map-btn.kakao { background: #FEE500; color: #191600; } .b-map-btn.kakao b { background: #191600; color: #FEE500; }
.b-map-btn.tel { background: transparent; color: inherit; box-shadow: inset 0 0 0 1.5px currentColor; }
.b-map-box { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 16px; background: #E8EEF2; }
.b-map.layout-stack .b-map-box { aspect-ratio: 16 / 7; }
.b-map-box iframe, .b-map-box img { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; object-fit: cover; }
/* 카카오맵 (지도 퍼가기) · 주소 카드 */
.b-map-box .root_daum_roughmap { position: absolute !important; inset: 0; width: 100% !important; height: 100% !important; }
.b-map-box .root_daum_roughmap .wrap_map { height: 100% !important; }
.b-map-box .root_daum_roughmap .cont { display: none; }
.b-map-card { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; text-align: center; color: #2F4A7A; text-decoration: none;
  background: linear-gradient(135deg, #EAF1E6 0 25%, #E3ECF4 25% 50%, #EEF0E8 50% 75%, #E6EDF3 75%) 0 0 / 120px 120px; }
.b-map-card svg { width: 44px; height: 44px; fill: #E0584A; stroke: #fff; stroke-width: 1.5; }
.b-map-card b { font-size: 16px; padding: 4px 10px; border-radius: 8px; background: rgba(255,255,255,.85); }
.b-map-card small { font-size: 13px; padding: 4px 12px; border-radius: 999px; background: #FEE500; color: #191919; font-weight: 700; }
.b-map-cover { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px; text-align: center; color: #2F4A7A;
  background: #E8EEF2 repeating-linear-gradient(0deg, transparent 0 38px, rgba(47,74,122,.08) 38px 40px), repeating-linear-gradient(90deg, transparent 0 38px, rgba(47,74,122,.08) 38px 40px); }
.b-map-cover svg { width: 40px; height: 40px; fill: #E0584A; stroke: #fff; stroke-width: 1.5; }
.b-map-cover b { font-size: 15px; }
.b-map-cover small { font-size: 12px; opacity: .7; }

/* ---------- 문의 · 예약 양식 ---------- */
.b-form { padding: 64px 24px; color: var(--c-text, #2B2A28); background: var(--c-soft, #FBF7EF); display: flex; justify-content: center; }
.b-form-card { width: 100%; max-width: 640px; padding: 36px; border-radius: 18px; background: #fff; color: #2B2A28; box-shadow: 0 10px 34px rgba(0,0,0,.06); }
.b-form-card h2 { margin: 0 0 6px; font-size: 26px; text-align: center; }
.b-form-sub { margin: 0 0 24px; text-align: center; font-size: 14.5px; opacity: .65; }
.b-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.b-form-grid .wide { grid-column: 1 / -1; }
.b-form-f { display: grid; gap: 6px; font-size: 13.5px; font-weight: 600; }
.b-req { color: #E0584A; font-style: normal; margin-left: 3px; }
.b-form-f input, .b-form-f select, .b-form-f textarea { width: 100%; min-height: 46px; padding: 10px 14px; border: 1px solid #DCD8D0; border-radius: 10px; font: inherit; font-size: 15px; font-weight: 400; background: #fff; color: inherit; }
.b-form-f textarea { resize: vertical; line-height: 1.6; }
.b-form-f input:focus, .b-form-f select:focus, .b-form-f textarea:focus { outline: 2px solid var(--c-point, #F2B33D); outline-offset: 1px; border-color: transparent; }
.b-form-agree { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; line-height: 1.6; opacity: .85; }
.b-form-agree input { margin-top: 4px; }
.b-form-btn { border: 0; font: inherit; font-weight: 700; font-size: 16px; padding: 14px; cursor: pointer; text-align: center; width: 100%; }
.b-form-note { margin: 0; padding: 10px 12px; border-radius: 10px; background: #FFF6DF; font-size: 13.5px; line-height: 1.6; }

/* ---------- 로그인 칸 ---------- */
.b-login { padding: 80px 24px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); display: flex; align-items: center; justify-content: center; }
.b-login-card { width: 100%; max-width: 400px; padding: 36px 32px; border-radius: 18px; background: #fff; color: #2B2A28; box-shadow: 0 10px 34px rgba(0,0,0,.08); border: 1px solid rgba(0,0,0,.06); }
.b-login-card h2 { margin: 0 0 6px; font-size: 26px; text-align: center; letter-spacing: -0.02em; }
.b-login-sub { margin: 0 0 24px; font-size: 14px; text-align: center; opacity: .65; }
.b-login-form { display: grid; gap: 14px; }
.b-login-form label { display: grid; gap: 6px; font-size: 13px; font-weight: 600; }
.b-login-form input[type="text"], .b-login-form input[type="password"] { height: 46px; padding: 0 14px; border: 1px solid #DCD8D0; border-radius: 10px; font: inherit; font-size: 15px; }
.b-login-form input:focus { outline: 2px solid var(--c-point, #F2B33D); outline-offset: 1px; border-color: transparent; }
.b-login-check { display: flex !important; align-items: center; gap: 8px !important; font-weight: 500 !important; }
.b-login-btn { width: 100%; border: 0; font: inherit; font-weight: 700; font-size: 16px; padding: 14px; cursor: pointer; }
.b-login-note { margin: 0; padding: 10px 12px; border-radius: 10px; background: #FFF6DF; font-size: 13px; line-height: 1.5; }
.b-login-links { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 18px; font-size: 13px; }
.b-login-links a { color: inherit; opacity: .7; text-decoration: none; }
.b-login-links a:hover { opacity: 1; text-decoration: underline; }

/* ---------- 빈 칸 · 구분선 ---------- */
.b-notice { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px 14px; padding: 10px 20px; font-size: 14.5px; font-weight: 600; line-height: 1.45; text-align: center; }
.b-notice-more { color: inherit; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
.b-notice-when { font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,.16); }
.b-spacer { position: relative; display: flex; align-items: center; justify-content: center; }
.b-spacer hr { margin: 0; border: 0; border-top: 1px solid rgba(128,128,128,.35); width: 120px; }
.b-spacer.line-wide hr { width: min(1040px, 80%); }
.b-spacer.line-full hr { width: 100%; }

/* 퀵메뉴: PC · 휴대폰 따로 정한 버튼, 전화번호 말풍선 */
.b-quick-btn { position: relative; }
.b-quick-btn.only-m { display: none; }
@media (max-width: 640px) { .b-quick-btn.only-pc { display: none !important; } .b-quick-btn.only-m { display: flex; } }
body[data-device="phone"] .float-layer .b-quick-btn.only-pc { display: none !important; }
body[data-device="phone"] .float-layer .b-quick-btn.only-m { display: flex; }
.b-quick-tip {
  position: absolute; top: 50%; transform: translateY(-50%); right: calc(100% + 10px);
  padding: 8px 12px; border-radius: 10px; background: #2B2A28; color: #fff; font-size: 14px; font-weight: 700; white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0,0,0,.2); opacity: 0; visibility: hidden; transition: opacity .15s; pointer-events: none;
}
.b-quick.side-left .b-quick-tip { right: auto; left: calc(100% + 10px); }
.b-quick-btn.is-tip .b-quick-tip { opacity: 1; visibility: visible; }
@media (hover: hover) { .b-quick-btn[data-tel]:hover .b-quick-tip { opacity: 1; visibility: visible; } }
@media (max-width: 640px) { .b-quick-tip { display: none; } }

/* 퀵메뉴 → 휴대폰 아래 탭바 (실제 휴대폰 · 편집 화면의 휴대폰 보기) */
@media (max-width: 640px) { body:has(.b-quick.phone-bar) { padding-bottom: 68px; } }
${['@media (max-width: 640px) { ', 'body[data-device="phone"] .float-layer '].map((pre, k) => {
  const S = k === 0 ? '.b-quick.phone-bar' : '.b-quick.phone-bar';
  const p = k === 0 ? '' : pre;
  const rules = `
  ${p}${S} { left: 0; right: 0; bottom: 0; top: auto; transform: none; flex-direction: row; gap: 0; padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px)); background: #fff; box-shadow: 0 -4px 16px rgba(0,0,0,.08); border-top: 1px solid rgba(0,0,0,.06); }
  ${p}${S} .b-quick-btn { flex: 1 1 0; min-width: 0; height: auto; flex-direction: column; gap: 3px; padding: 6px 2px; border-radius: 10px; background: transparent !important; color: #2B2A28 !important; box-shadow: none; font-size: 11px; font-weight: 600; justify-content: center !important; }
  ${p}${S} .b-quick-label { position: static !important; width: auto !important; height: auto !important; clip: auto !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 100%; }
  ${p}${S} .b-quick-ico { width: 30px; height: 30px; border-radius: 50%; background: #F1EFEA; }
  ${p}${S} .k-kakao .b-quick-ico { background: #FEE500; color: #3A1D1D; }
  ${p}${S} .k-phone .b-quick-ico { background: #2E9E5B; color: #fff; }
  ${p}${S} .k-map .b-quick-ico { background: #3B6FD8; color: #fff; }
  ${p}${S} .k-top .b-quick-ico { background: #2B2A28; color: #fff; }`;
  return k === 0 ? pre + rules + ' }' : rules;
}).join('\n')}

/* 벽에 붙인 맨 위 메뉴: 넓은 화면(PC)에서 세로 모양 */
@container ib (min-width: 641px) {
  .b-header.pos-side { height: 100%; border-bottom: 0; }
  .ib-page.side-left .b-header.pos-side { border-right: 1px solid rgba(128,128,128,.18); }
  .ib-page.side-right .b-header.pos-side { border-left: 1px solid rgba(128,128,128,.18); }
  .b-header.pos-side .b-header-row { flex-direction: column; align-items: flex-start; justify-content: flex-start; gap: 32px; padding: 36px 28px; min-height: 100%; }
  .b-header.pos-side .b-logo { font-size: 22px; flex-direction: column; align-items: flex-start; }
  .b-header.pos-side .b-nav { display: flex; flex-direction: column; margin: 0; gap: 0; width: 100%; }
  .b-header.pos-side .b-nav-item > a { padding: 10px 0; font-size: 16px; }
  .b-header.pos-side .b-nav-item.has-sub > a::after { display: none; }
  .b-header.pos-side .b-sub { position: static; transform: none; opacity: 1; visibility: visible; box-shadow: none; background: transparent; color: inherit; padding: 0 0 6px 12px; min-width: 0; }
  .b-header.pos-side .b-sub a { padding: 5px 0; opacity: .7; }
  .b-header.pos-side .b-sub a:hover { background: none; opacity: 1; }
  .b-header.pos-side .b-header-side { margin-top: auto; margin-left: 0; }
  .b-header.pos-side .b-menu-btn { display: none !important; }
}

/* 블록 안이 좁으면 여백도 알맞게 줄여요 */
@container blk (max-width: 640px) {
  .ib-cell > *, .blk-body > * { --pscale: .6; }
}

/* ---------- 휴대폰: 블록은 한 줄씩 위아래로 (절반으로 정한 블록은 두 개씩) ---------- */
@container ib (max-width: 640px) {
  .b-cards { --per: 1 !important; }
  .ib-grid { column-gap: 0; }
  .ib-grid > * { min-height: var(--minh-phone, var(--minh, auto)); }
  .ib-grid > * { grid-column: auto / span var(--mspan, 12) !important; }
  .ib-grid > .hide-phone { display: none !important; }
  .ib-page.has-side .ib-frame { display: block; }
  .ib-side { width: auto; height: auto; position: sticky; top: 0; }
  .b-quick-btn { height: 46px; min-width: 46px; }
  .b-quick.side-right { right: 14px; } .b-quick.side-left { left: 14px; }
}

@container ib (min-width: 641px) {
  .ib-grid > .hide-pc { display: none !important; }
}

/* ---------- 좁은 블록 (휴대폰, 또는 PC에서 좁게 줄인 블록) ---------- */
@container blk (max-width: 640px) {
  .b-header-row { padding: 12px 20px; min-height: 60px; }
  .b-header-top { display: none; }
  .b-header.layout-split .b-header-row { display: flex; }
  .b-split-l { display: none; }
  .b-split-r { margin-left: auto; }
  .b-header.layout-split-top .b-nav-row { display: none; }
  .b-header.layout-split-top .b-title-row { justify-content: flex-start; padding: 12px 20px; min-height: 60px; }
  .b-header.layout-split-top .b-title-row .b-logo { font-size: 18px; }
  .b-header.layout-split-top .b-title-row .b-header-side { position: static; transform: none; margin-left: auto; }
  .b-logo { font-size: 18px; }
  .b-logo img { max-width: 160px; max-height: 40px; }
  .b-nav { display: none; }
  .b-header-side { margin-left: auto; }
  .b-header.layout-center .b-header-row { padding: 12px 20px; flex-wrap: nowrap; justify-content: flex-start; }
  .b-header.layout-center .b-logo { width: auto; font-size: 18px; }
  .b-header.layout-center .b-header-side { position: static; }
  .b-menu-btn { display: grid; }
  .b-panel { padding: 8px 20px 16px; grid-template-columns: 1fr; gap: 0; }
  .b-panel-group { padding: 10px 0; border-bottom: 1px solid #eee; }
  .b-panel-group a { padding: 6px 0 6px 12px; }
  .b-panel-group a.b-panel-main { padding-left: 0; }
  .b-header .b-button.small { padding: 8px 12px; font-size: 13px; }

  .b-banner { min-height: 260px; }
  .b-slide.has-m .b-slide-bg:not(.is-m) { display: none; }
  .b-slide.has-m .b-slide-bg.is-m { display: block; }
  .b-slide.has-m::before { content: ''; position: absolute; inset: 0; background: rgba(20, 18, 15, var(--overlay, .45)); z-index: 1; }
  .b-slide { padding: 48px 24px 64px; }
  .b-slide h1, .b-slide h2 { font-size: 28px; }
  .b-slide p { font-size: 15px; margin-bottom: 22px; }
  .b-button { padding: 12px 22px; font-size: 15px; }
  .b-slider-arrow { width: 36px; height: 36px; top: auto; bottom: 12px; transform: none; }
  .b-slider-arrow.prev { left: 12px; } .b-slider-arrow.next { right: 12px; }
  .b-slider-dots { bottom: 24px; }

  .b-cards { --per: min(var(--per-set, 3), 2); padding: 44px 22px; }
  .b-cards-head { margin-bottom: 22px; }
  .b-cards-head h2 { font-size: 22px; }
  .b-cards .b-slider-arrow { top: 0; bottom: auto; transform: translateY(var(--arrow-y, 90px)); }
  .b-cards .b-slider-arrow.prev { left: 4px; } .b-cards .b-slider-arrow.next { right: 4px; }

  .b-text { padding: 44px 22px; }
  .b-text.img-left .b-text-wrap, .b-text.img-right .b-text-wrap { grid-template-columns: 1fr; gap: 24px; }
  .b-text.img-right .b-text-media { order: 0; }
  .b-text-media { border-radius: 12px; }
  .b-text h2 { font-size: 22px; }
  .b-text-body { font-size: 15px; }

  .b-image.is-padded, .b-video.is-padded { padding: 24px 20px; }
  .b-faq, .b-reviews, .b-gallery, .b-pricing, .b-map { padding: 44px 20px; }
  .b-sec-head h2 { font-size: 22px; }
  .b-sec-head { margin-bottom: 22px; }
  .b-faq summary { font-size: 15.5px; padding: 16px 4px; }
  .b-faq-a { padding: 0 4px 18px 26px; font-size: 14.5px; }
  .b-reviews-grid, .b-price-grid { grid-template-columns: 1fr; }
  .b-price-grid { gap: 22px; }
  .b-gal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .b-map-wrap { grid-template-columns: 1fr; gap: 22px; }
  .b-map .b-map-box { order: -1; aspect-ratio: 4 / 3; }
  .b-map h2 { font-size: 22px; }
  .b-form { padding: 40px 16px; }
  .b-form-card { padding: 26px 20px; }
  .b-form-grid { grid-template-columns: 1fr; }

  .b-footer { padding: 32px 22px; font-size: 13px; }
  .b-footer-top { flex-direction: column; gap: 28px; }
  .b-footer-cols { grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .b-footer-bottom { flex-direction: column; align-items: flex-start; }
  .b-footer-legal { gap: 6px 18px; }
  .b-footer-select { width: 100%; }
  .b-sep { margin: 0 6px; }
}

/* ----- 표 ----- */
.b-table { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-table-wrap { max-width: 980px; margin: 0 auto; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.b-table table { width: 100%; border-collapse: collapse; font-size: 15.5px; line-height: 1.55; }
.b-table th, .b-table td { padding: 14px 16px; border-bottom: 1px solid rgba(128,128,128,.25); white-space: nowrap; }
.b-table.align-center th, .b-table.align-center td { text-align: center; }
.b-table.align-left th, .b-table.align-left td { text-align: left; }
.b-table thead th { font-weight: 700; border-bottom: 2px solid var(--c-point, #F2B33D); }
.b-table tbody th { font-weight: 700; }
.b-table.look-stripe tbody tr:nth-child(odd) { background: var(--c-soft, #F6F3EC); }
.b-table.look-stripe th, .b-table.look-stripe td { border-bottom: 0; }
.b-table.look-box .b-table-wrap { border-radius: 14px; border: 1px solid rgba(128,128,128,.3); }
.b-table.look-box th, .b-table.look-box td { border-right: 1px solid rgba(128,128,128,.2); }
.b-table.look-box th:last-child, .b-table.look-box td:last-child { border-right: 0; }
.b-table.look-box tbody tr:last-child > * { border-bottom: 0; }
.b-table.look-box thead th { background: var(--c-soft, #F6F3EC); border-bottom: 1px solid rgba(128,128,128,.3); }
.b-table-note { max-width: 980px; margin: 14px auto 0; font-size: 13.5px; opacity: .65; text-align: center; }

/* ----- 일정 ----- */
.b-schedule { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-sched-list { list-style: none; margin: 0 auto; padding: 0; max-width: 860px; display: grid; gap: 14px; }
.b-sched { display: grid; grid-template-columns: 96px 1fr; gap: 22px; align-items: start; padding: 20px; border-radius: 16px; background: var(--c-soft, #F6F3EC); }
.b-sched-date { display: grid; justify-items: center; align-content: center; gap: 2px; min-height: 84px; border-radius: 12px; background: var(--c-point, #F2B33D); color: var(--c-point-ink, #2B2A28); }
.b-sched-date b { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
.b-sched-date small { font-size: 13px; opacity: .85; }
.b-sched-body h3 { margin: 4px 0 6px; font-size: 19px; }
.b-sched-meta { margin: 0; font-size: 14px; opacity: .72; }
.b-sched-text { margin: 8px 0 0; font-size: 15px; line-height: 1.7; opacity: .85; }
.b-sched .b-button { margin-top: 14px; }
.b-schedule.layout-timeline .b-sched-list { gap: 0; position: relative; padding-left: 4px; }
.b-schedule.layout-timeline .b-sched { background: none; border-radius: 0; padding: 0 0 30px; grid-template-columns: 110px 1fr; position: relative; }
.b-schedule.layout-timeline .b-sched::before { content: ''; position: absolute; left: 118px; top: 8px; bottom: -8px; width: 2px; background: rgba(128,128,128,.25); }
.b-schedule.layout-timeline .b-sched:last-child::before { display: none; }
.b-schedule.layout-timeline .b-sched::after { content: ''; position: absolute; left: 112px; top: 6px; width: 14px; height: 14px; border-radius: 50%; background: var(--c-point, #F2B33D); box-shadow: 0 0 0 4px var(--c-bg, #fff); }
.b-schedule.layout-timeline .b-sched-date { background: none; color: inherit; min-height: 0; justify-items: end; padding-right: 22px; }
.b-schedule.layout-timeline .b-sched-body { padding-left: 26px; }
.b-schedule.layout-timeline .b-sched-body h3 { margin-top: 0; }

/* ----- 영업시간 ----- */
.b-hours { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-hours-box { max-width: 560px; margin: 0 auto; padding: 26px 28px; border-radius: 18px; background: var(--c-soft, #F6F3EC); }
.b-hours-now { display: flex; align-items: center; gap: 10px; margin: 0 0 18px; font-size: 17px; font-weight: 700; }
.b-hours-now i { width: 10px; height: 10px; border-radius: 50%; background: #9A968E; flex: none; }
.b-hours-now.is-open i { background: #22A06B; box-shadow: 0 0 0 4px rgba(34,160,107,.18); }
.b-hours-now.is-break i, .b-hours-now.is-before i { background: #E2A100; }
.b-hours-now.is-off i, .b-hours-now.is-after i { background: #D9534F; }
.b-hours-list { margin: 0; display: grid; gap: 2px; }
.b-hours-row { display: grid; grid-template-columns: 120px 1fr; gap: 16px; padding: 9px 12px; border-radius: 10px; font-size: 15.5px; }
.b-hours-row dt { font-weight: 600; } .b-hours-row dd { margin: 0; }
.b-hours-row.is-today { background: var(--c-bg, #fff); font-weight: 700; }
.b-hours-row.is-today dt::after { content: ' · 오늘'; font-size: 12px; font-weight: 600; color: var(--c-point-deep, var(--c-point, #C98A12)); }
.b-hours-row.is-sub { font-size: 14px; opacity: .78; }
.b-hours-note { margin: 14px 12px 0; font-size: 13.5px; opacity: .7; line-height: 1.6; }

/* ----- 연혁 · 경력 ----- */
.b-timeline { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-tl-list { list-style: none; margin: 0 auto; padding: 0; max-width: 760px; }
.b-tl { display: grid; grid-template-columns: 110px 1fr; gap: 0 28px; position: relative; padding-bottom: 28px; }
.b-tl::before { content: ''; position: absolute; left: 124px; top: 10px; bottom: -6px; width: 2px; background: rgba(128,128,128,.22); }
.b-tl:last-child::before { display: none; }
.b-tl::after { content: ''; position: absolute; left: 118px; top: 6px; width: 14px; height: 14px; border-radius: 50%; background: var(--c-point, #F2B33D); box-shadow: 0 0 0 4px var(--c-bg, #fff); }
.b-tl-year { text-align: right; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
.b-tl-body { padding-left: 14px; }
.b-tl-body h3 { margin: 2px 0 4px; font-size: 17px; }
.b-tl-body p { margin: 0; font-size: 15px; line-height: 1.7; opacity: .78; }

/* ----- 게시판 목록 ----- */
.b-board { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-board-list { list-style: none; margin: 0 auto; padding: 0; max-width: 900px; border-top: 2px solid var(--c-text, #2B2A28); }
.b-board-row { display: grid; grid-template-columns: auto 1fr 28px auto; align-items: center; gap: 16px; padding: 15px 8px; border-bottom: 1px solid rgba(128,128,128,.2); font-size: 15.5px; }
.b-board-no { min-width: 32px; text-align: center; font-size: 13.5px; opacity: .55; }
.b-board-title { color: inherit; text-decoration: none; display: flex; align-items: center; gap: 8px; min-width: 0; }
.b-board-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
a.b-board-title:hover span { text-decoration: underline; text-underline-offset: 3px; }
.b-new { flex: none; font-style: normal; font-size: 11px; font-weight: 800; color: #fff; background: #E5484D; border-radius: 4px; padding: 1px 5px; }
.b-board-file svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; opacity: .6; }
.b-board-date { font-size: 13.5px; opacity: .6; white-space: nowrap; }
.b-board-more { text-align: center; margin-top: 26px; }

/* ----- 자료 내려받기 ----- */
.b-files { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-files-list { list-style: none; margin: 0 auto; padding: 0; max-width: 820px; display: grid; gap: 10px; }
.b-file { display: grid; grid-template-columns: 54px 1fr auto; align-items: center; gap: 16px; padding: 14px 18px; border-radius: 14px; background: var(--c-soft, #F6F3EC); }
.b-file-ext { display: grid; place-items: center; height: 54px; border-radius: 10px; background: var(--c-bg, #fff); font-size: 12px; font-weight: 800; letter-spacing: .02em; }
.b-file-body { display: grid; gap: 3px; min-width: 0; }
.b-file-body b { font-size: 16px; } .b-file-body small { font-size: 13.5px; opacity: .7; }
.b-file-empty { font-size: 12.5px; opacity: .55; }

/* ----- 단계 안내 ----- */
.b-steps { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-steps-list { list-style: none; margin: 0 auto; padding: 0; max-width: 1000px; display: grid; grid-template-columns: repeat(var(--n, 3), 1fr); gap: 18px; counter-reset: s; }
.b-step { position: relative; padding: 26px 22px; border-radius: 16px; background: var(--c-soft, #F6F3EC); }
.b-step:not(:last-child)::after { content: '›'; position: absolute; right: -15px; top: 50%; transform: translateY(-50%); font-size: 24px; opacity: .35; }
.b-step-no { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--c-point, #F2B33D); color: var(--c-point-ink, #2B2A28); font-weight: 800; }
.b-step h3 { margin: 14px 0 6px; font-size: 17px; }
.b-step p { margin: 0; font-size: 14.5px; line-height: 1.65; opacity: .8; }

/* ----- 로고 · 인증 띠 ----- */
.b-logos { padding: 48px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-logos-list { list-style: none; margin: 0 auto; padding: 0; max-width: 1040px; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 22px 44px; }
.b-logos-list img { display: block; height: var(--lh, 44px); width: auto; max-width: 180px; object-fit: contain; transition: filter .2s, opacity .2s; }
.b-logos.size-s { --lh: 32px; } .b-logos.size-l { --lh: 64px; }
.b-logos.is-gray img { filter: grayscale(1); opacity: .7; }
.b-logos.is-gray a:hover img, .b-logos.is-gray li:hover img { filter: none; opacity: 1; }
.b-logo-name { display: inline-block; padding: 10px 18px; border-radius: 10px; border: 1px dashed rgba(128,128,128,.4); font-weight: 700; opacity: .7; }
.b-logos-list a { color: inherit; text-decoration: none; }

/* ----- 채용 공고 ----- */
.b-jobs { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-jobs-list { list-style: none; margin: 0 auto; padding: 0; max-width: 860px; display: grid; gap: 12px; }
.b-job { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 16px; padding: 20px 22px; border-radius: 16px; background: var(--c-soft, #F6F3EC); }
.b-job h3 { margin: 0 0 6px; font-size: 18px; }
.b-job-meta { margin: 0; font-size: 14px; opacity: .72; }
.b-job-state { display: none; font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: rgba(128,128,128,.2); }
.b-job.is-closed { opacity: .6; }
.b-job.is-closed .b-job-state { display: inline-block; }
.b-job.is-closed .b-job-btn { display: none; }

/* ----- 작업물 · 분류별 보기 ----- */
.b-works { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-works-cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 0 auto 26px; }
.b-works-cats button { font: inherit; font-size: 14.5px; padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(128,128,128,.35); background: transparent; color: inherit; cursor: pointer; }
.b-works-cats button.is-on { background: var(--c-text, #2B2A28); color: var(--c-bg, #fff); border-color: transparent; }
.b-works-list { list-style: none; margin: 0 auto; padding: 0; max-width: 1100px; display: grid; grid-template-columns: repeat(var(--cols, 3), 1fr); gap: 22px; }
.b-work[hidden] { display: none; }
.b-work a { color: inherit; text-decoration: none; display: block; }
.b-works-pic { display: block; aspect-ratio: var(--ratio, 4/3); border-radius: 14px; overflow: hidden; background: var(--c-soft, #F6F3EC); }
.b-works-pic img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
.b-work a:hover img { transform: scale(1.04); }
.b-works-nopic { display: block; width: 100%; height: 100%; }
.b-works-cap { display: grid; gap: 3px; padding: 12px 2px 0; }
.b-works-cap small { font-size: 12.5px; opacity: .6; } .b-works-cap b { font-size: 16.5px; } .b-works-cap span { font-size: 14px; opacity: .75; }

/* ----- 맨 아래: 지도 · 전화 링크 · 공공누리 ----- */
.b-biz-map, .b-biz-tel { color: inherit; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(128,128,128,.5); }
.b-kogl a { color: inherit; text-decoration: none; font-size: 12.5px; opacity: .8; } .b-kogl b { padding: 1px 6px; margin-right: 4px; border: 1px solid currentColor; border-radius: 4px; font-size: 11px; }

/* ----- 품절 표시 ----- */
.b-sold { display: inline-block; margin-left: 8px; vertical-align: middle; font-size: 12px; font-weight: 700; letter-spacing: 0; padding: 2px 8px; border-radius: 999px; background: #E5484D; color: #fff; }

@container ib (max-width: 640px) {
  .b-hours, .b-timeline, .b-board, .b-files, .b-steps, .b-jobs, .b-works { padding: 44px 20px; }
  .b-logos { padding: 36px 20px; }
  .b-hours-box { padding: 20px 16px; } .b-hours-row { grid-template-columns: 96px 1fr; }
  .b-tl { grid-template-columns: 64px 1fr; gap: 0 18px; } .b-tl::before { left: 74px; } .b-tl::after { left: 68px; } .b-tl-year { font-size: 16px; }
  .b-board-row { grid-template-columns: 1fr auto; gap: 4px 10px; padding: 13px 4px; }
  .b-board-no { display: none; } .b-board-file:empty { display: none; } .b-board-date { grid-column: 1; }
  .b-file { grid-template-columns: 44px 1fr; } .b-file-ext { height: 44px; } .b-file .b-button, .b-file-empty { grid-column: 1 / -1; text-align: center; }
  .b-steps-list { grid-template-columns: 1fr; } .b-step:not(:last-child)::after { content: '⌄'; right: 50%; top: auto; bottom: -22px; transform: translateX(50%); }
  .b-job { grid-template-columns: 1fr; } .b-job-btn { justify-self: start; }
  .b-works-list { grid-template-columns: repeat(2, 1fr); gap: 14px; }
}

/* ===== 디자인 고르기 ===== */
/* 맨 위 메뉴 */
.b-header.look-line { border-bottom: 2px solid var(--c-text, #2B2A28); }
.b-header.look-float { background: transparent; border-bottom: 0; padding: 12px 24px; }
.b-header.look-float > .b-header-row, .b-header.look-float > .b-header-top { background: var(--c-bg, #fff); }
.b-header.look-float > .b-header-row { border-radius: 999px; box-shadow: 0 6px 24px rgba(0,0,0,.10); padding-left: 28px; padding-right: 16px; min-height: 60px; }
.b-header.look-float > .b-header-top { background: transparent; }
.b-header.look-pill .b-nav-item > a { border-radius: 999px; padding: 8px 16px; }
.b-header.look-pill .b-nav-item > a:hover { background: rgba(128,128,128,.12); }
.b-header.look-pill .b-nav-item > a.is-current { background: var(--c-point, #F2B33D); color: var(--c-point-ink, #2B2A28); box-shadow: none; border-radius: 999px; }
.b-header.look-under .b-nav-item > a.is-current { box-shadow: inset 0 -3px 0 var(--c-point, #F2B33D); }
.b-header.look-under .b-nav-item > a:hover { box-shadow: inset 0 -3px 0 rgba(128,128,128,.3); border-radius: 0; }
.b-header.look-bold .b-nav { font-size: 17px; font-weight: 700; gap: 14px; }
.b-header.look-bold .b-nav-item > a { opacity: 1; }
.b-header.look-bold .b-logo { font-size: 24px; }

/* 메인 배너 */
.b-banner.look-split .b-slide { justify-content: flex-start; text-align: left; padding-right: calc(50% + 48px); background: var(--c-soft, #F6F3EC); color: var(--c-text, #2B2A28); }
.b-banner.look-split .b-slide.has-image { color: var(--c-text, #2B2A28); }
.b-banner.look-split .b-slide.has-image::before { display: none; }
.b-banner.look-split .b-slide-bg { left: 50%; width: 50%; }
.b-banner.look-split .b-slide-inner { max-width: 560px; margin-left: auto; }
.b-banner.look-card { padding: 20px 40px; background: var(--c-bg, #fff); }
.b-banner.look-card .b-slide { border-radius: 28px; overflow: hidden; }
.b-banner.look-card .b-slider-arrow.prev { left: 58px; } .b-banner.look-card .b-slider-arrow.next { right: 58px; }
.b-banner.look-bottom .b-slide { align-items: flex-end; padding-bottom: 64px; }
.b-banner.look-bottom .b-slide.has-image::before { background: linear-gradient(to top, rgba(20,18,15, calc(var(--overlay, .45) + .35)) 0%, rgba(20,18,15, .05) 65%); }
.b-banner.look-soft .b-slide { background: var(--c-soft, #F6F3EC); color: var(--c-text, #2B2A28); justify-content: flex-start; text-align: left; padding-right: calc(38% + 56px); }
.b-banner.look-soft .b-slide.has-image { color: var(--c-text, #2B2A28); }
.b-banner.look-soft .b-slide.has-image::before { display: none; }
.b-banner.look-soft .b-slide-bg { left: auto; right: 56px; top: 50%; transform: translateY(-50%); width: 38%; height: 76%; border-radius: 24px; }
.b-banner.look-soft .b-slide-inner { max-width: 600px; margin-left: auto; }
.b-banner.look-split .b-slide:not(.has-image)::after { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; right: 0; background: linear-gradient(135deg, var(--c-point, #F2B33D), var(--c-dark, #6B4A35)); opacity: .35; }
.b-banner.look-soft .b-slide:not(.has-image)::after { content: ''; position: absolute; right: 56px; top: 12%; bottom: 12%; width: 38%; border-radius: 24px; background: linear-gradient(135deg, var(--c-point, #F2B33D), var(--c-dark, #6B4A35)); opacity: .3; }
.b-banner.look-split .b-slider-dots button, .b-banner.look-soft .b-slider-dots button { background: rgba(0,0,0,.2); }
.b-banner.look-split .b-slider-dots button.is-active, .b-banner.look-soft .b-slider-dots button.is-active { background: var(--c-text, #2B2A28); }

/* 맨 아래 정보 */
.b-footer.layout-center { text-align: center; }
.b-footer.layout-center .b-footer-sns, .b-footer.layout-center .b-footer-badges { justify-content: center; }
.b-footer.theme-soft { background: var(--c-soft, #F6F3EC); color: var(--c-text, #2B2A28); }
.b-footer.theme-soft .b-footer-info small { opacity: .7; }
.b-footer.theme-soft .b-sns { background: rgba(0,0,0,.06); color: inherit; }
.b-footer.theme-point { background: var(--c-point, #F2B33D); color: var(--c-point-ink, #2B2A28); }
.b-footer.theme-point .b-sns { background: rgba(0,0,0,.1); color: inherit; }

/* 본문 블록 공통: 테두리 · 제목 위치 */
.skin-card { margin: 20px 40px; border-radius: 24px; box-shadow: 0 10px 32px rgba(0,0,0,.08); overflow: hidden; }
.skin-soft { margin: 20px 40px; border-radius: 24px; background: var(--c-soft, #F6F3EC) !important; }
.skin-line { border-top: 1px solid rgba(128,128,128,.25); border-bottom: 1px solid rgba(128,128,128,.25); }
.skin-dark { background: var(--c-dark, #2B2A28) !important; color: var(--c-dark-ink, #fff) !important; }
.skin-dark .b-sec-head p, .skin-dark p { color: inherit; }
.head-left .b-sec-head, .head-left .b-cards-head { max-width: 1040px; text-align: left; }

/* 단계 안내 · 연혁 · 게시판 · 영업시간 디자인 */
.b-steps.look-line .b-step { background: none; padding: 0 8px; text-align: center; }
.b-steps.look-line .b-steps-list { position: relative; }
.b-steps.look-line .b-step::before { content: ''; position: absolute; top: 17px; left: calc(50% + 24px); right: calc(-50% + 24px); height: 2px; background: rgba(128,128,128,.25); }
.b-steps.look-line .b-step:last-child::before, .b-steps.look-line .b-step::after { display: none; }
.b-steps.look-big .b-step { background: none; padding: 0; border-top: 2px solid var(--c-text, #2B2A28); border-radius: 0; padding-top: 18px; }
.b-steps.look-big .b-step::after { display: none; }
.b-steps.look-big .b-step-no { width: auto; height: auto; background: none; color: var(--c-point, #F2B33D); font-size: 40px; line-height: 1; border-radius: 0; }
.b-timeline.look-center .b-tl-list { max-width: 900px; }
.b-timeline.look-center .b-tl { grid-template-columns: 1fr 1fr; gap: 0 56px; }
.b-timeline.look-center .b-tl::before { left: calc(50% - 1px); }
.b-timeline.look-center .b-tl::after { left: calc(50% - 7px); }
.b-timeline.look-center .b-tl:nth-child(even) .b-tl-year { order: 2; text-align: left; }
.b-timeline.look-center .b-tl:nth-child(even) .b-tl-body { text-align: right; padding: 0 14px 0 0; }
.b-timeline.look-cards .b-tl-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; max-width: 1040px; }
.b-timeline.look-cards .b-tl { display: block; padding: 22px; border-radius: 16px; background: var(--c-soft, #F6F3EC); }
.b-timeline.look-cards .b-tl::before, .b-timeline.look-cards .b-tl::after { display: none; }
.b-timeline.look-cards .b-tl-year { display: block; text-align: left; color: var(--c-point-deep, var(--c-point, #C98A12)); margin-bottom: 8px; }
.b-timeline.look-cards .b-tl-body { padding: 0; }
.b-board.look-card .b-board-list { border-top: 0; display: grid; gap: 10px; }
.b-board.look-card .b-board-row { border: 0; border-radius: 14px; background: var(--c-soft, #F6F3EC); padding: 16px 18px; }
.b-board.look-simple .b-board-list { border-top: 1px solid rgba(128,128,128,.25); }
.b-board.look-simple .b-board-no { display: none; }
.b-board.look-simple .b-board-row { grid-template-columns: 1fr 28px auto; }
.b-hours.look-plain .b-hours-box { background: none; padding: 0; }
.b-hours.look-plain .b-hours-row { border-bottom: 1px solid rgba(128,128,128,.18); border-radius: 0; }
.b-hours.look-plain .b-hours-row.is-today { background: none; }
.b-hours.look-dark .b-hours-box { background: var(--c-dark, #2B2A28); color: var(--c-dark-ink, #fff); }
.b-hours.look-dark .b-hours-row.is-today { background: rgba(255,255,255,.1); }

@container ib (max-width: 640px) {
  .b-header.look-float { padding: 8px 12px; }
  .b-banner.look-split .b-slide, .b-banner.look-soft .b-slide { padding: 300px 24px 40px; align-items: flex-start; }
  .b-banner.look-split .b-slide-bg, .b-banner.look-soft .b-slide-bg { left: 0; right: 0; top: 0; transform: none; width: 100%; height: 260px; border-radius: 0; }
  .b-banner.look-split .b-slide:not(.has-image)::after, .b-banner.look-soft .b-slide:not(.has-image)::after { left: 0; right: 0; top: 0; bottom: auto; width: auto; height: 260px; border-radius: 0; }
  .b-banner.look-card { padding: 12px; }
  .skin-card, .skin-soft { margin: 12px; border-radius: 18px; }
  .b-steps.look-line .b-step::before { display: none; }
  .b-timeline.look-center .b-tl { grid-template-columns: 64px 1fr; gap: 0 18px; }
  .b-timeline.look-center .b-tl::before { left: 74px; } .b-timeline.look-center .b-tl::after { left: 68px; }
  .b-timeline.look-center .b-tl:nth-child(even) .b-tl-year { order: 0; text-align: right; }
  .b-timeline.look-center .b-tl:nth-child(even) .b-tl-body { text-align: left; padding: 0 0 0 14px; }
}

/* ----- 숫자로 보는 우리 ----- */
.b-stats { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-stats-list { list-style: none; margin: 0 auto; padding: 0; max-width: 1000px; display: grid; grid-template-columns: repeat(var(--n, 3), 1fr); gap: 18px; text-align: center; }
.b-stat b { display: block; font-size: 48px; line-height: 1.1; font-weight: 800; letter-spacing: -0.03em; color: var(--c-point-deep, var(--c-point, #C98A12)); }
.b-stat b small { font-size: .45em; font-weight: 700; margin-left: 2px; }
.b-stat p { margin: 8px 0 0; font-size: 15px; opacity: .75; }
.b-stats.look-card .b-stat { padding: 28px 16px; border-radius: 18px; background: var(--c-soft, #F6F3EC); }
.b-stats.look-point { background: var(--c-point, #F2B33D) !important; color: var(--c-point-ink, #2B2A28); }
.b-stats.look-point .b-stat b { color: inherit; }
@container ib (max-width: 640px) { .b-stats { padding: 44px 20px; } .b-stats-list { grid-template-columns: repeat(2, 1fr); } .b-stat b { font-size: 34px; } }

/* ----- 팀 소개 ----- */
.b-team { padding: 64px 40px; color: var(--c-text, #2B2A28); background: var(--c-bg, #fff); }
.b-team-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 32px 24px; }
.b-member { margin: 0; display: flex; flex-direction: column; gap: 14px; }
.b-team.align-center .b-member { align-items: center; text-align: center; }
.b-member-photo { width: 100%; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 16px; background: var(--c-soft, #F6F3EC); position: relative; }
.b-team.shape-circle .b-member-photo { width: min(180px, 70%); border-radius: 50%; }
.b-team.shape-tall .b-member-photo { aspect-ratio: 3 / 4; }
.b-member-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.b-member-photo .b-ph { position: absolute; inset: 0; }
.b-member-noimg { display: block; width: 100%; height: 100%; background: radial-gradient(circle at 50% 38%, rgba(128,128,128,.28) 0 17%, transparent 17.5%), radial-gradient(ellipse at 50% 100%, rgba(128,128,128,.28) 0 38%, transparent 38.5%); }
.b-member figcaption { display: grid; gap: 4px; }
.b-member figcaption small { font-size: 13px; font-weight: 700; color: var(--c-point, #F2B33D); }
.b-member figcaption b { font-size: 18px; }
.b-member figcaption a { color: inherit; text-decoration: none; }
.b-member figcaption a:hover b { text-decoration: underline; }
.b-member figcaption p { margin: 4px 0 0; font-size: 14.5px; line-height: 1.7; opacity: .78; }

@container ib (max-width: 640px) {
  .b-table, .b-schedule, .b-team { padding: 44px 20px; }
  .b-table table { font-size: 14px; }
  .b-table th, .b-table td { padding: 11px 12px; }
  .b-sched { grid-template-columns: 72px 1fr; gap: 14px; padding: 16px; }
  .b-sched-date { min-height: 68px; }
  .b-sched-date b { font-size: 18px; }
  .b-schedule.layout-timeline .b-sched { grid-template-columns: 70px 1fr; }
  .b-schedule.layout-timeline .b-sched::before { left: 78px; }
  .b-schedule.layout-timeline .b-sched::after { left: 72px; }
  .b-schedule.layout-timeline .b-sched-date { padding-right: 16px; }
  .b-schedule.layout-timeline .b-sched-body { padding-left: 18px; }
  .b-team-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 14px; }
  .b-member figcaption b { font-size: 16px; }
}

`;

// 편집 화면에도 같은 모습을 넣어요
(function () {
  const style = document.createElement('style');
  style.id = 'hometeo-block-css';
  style.textContent = window.HOMETEO_BLOCK_CSS;
  document.head.appendChild(style);
})();
