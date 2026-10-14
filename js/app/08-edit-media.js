/*
 * 홈터 · 편집 화면 동작 (8/12) — 글자 바로 고치기 · 사진 · 영상 넣기 · 미리보기 · 사진 위치 맞추기
 * ------------------------------------------------------------
 * js/app/ 폴더의 파일들은 index.html에서 차례대로 불러와 한 덩어리처럼 함께 움직여요.
 * 같은 이름을 서로 쓰니 순서를 바꾸지 마세요. 전체 설명은 01-core.js 머리말에 있어요.
 */
'use strict';

// =========================================================
// 글자 바로 고치기
// =========================================================
let editing = null; // { el, blockId, key, before }

function startEdit(target) {
  const tBlk = target.closest('.blk');
  if (!tBlk) return;
  const blockId = tBlk.dataset.id, key = target.dataset.edit;
  finishEdit(true); // 고치던 글자가 있으면 먼저 마무리 (화면이 다시 그려질 수 있어요)
  const blk = els.paper.querySelector(`.blk[data-id="${blockId}"]`);
  const el = blk && blk.querySelector(`[data-edit="${key}"]`);
  if (!el) return;
  select(blk.dataset.id);
  editing = { el, blockId: blk.dataset.id, key: el.dataset.edit, before: el.innerText };
  // 지원하는 브라우저에서는 '글자만' 붙여넣어지게 해요
  el.contentEditable = 'plaintext-only';
  if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
  el.classList.add('is-editing');
  blk.classList.add('is-editing-blk');
  el.focus();
  // 글자 전체를 골라 둬요. 바로 타자를 치면 새 글로 바뀌어요.
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  el.addEventListener('keydown', onEditKey);
  el.addEventListener('keyup', onEditKeyUp);
  el.addEventListener('beforeinput', onEditBeforeInput);
  el.addEventListener('blur', onEditBlur);
  el.addEventListener('paste', onEditPaste);
}

function onEditKey(e) {
  if (!editing) return;
  if (e.key === 'Escape' && !e.isComposing) { e.preventDefault(); finishEdit(false); return; }
  if (e.key === 'Enter') {
    const multi = editing.el.hasAttribute('data-multiline');
    const finish = !(multi && e.shiftKey);
    // 한글을 조합하는 중에 Enter를 누르면, 마지막 글자가 완성된 다음에 마무리해요
    if (e.isComposing || e.keyCode === 229) { if (finish) editing.finishAfterCompose = true; return; }
    if (finish) { e.preventDefault(); finishEdit(true); }
  }
}
function onEditKeyUp(e) {
  if (editing && editing.finishAfterCompose && e.key === 'Enter') finishEdit(true);
}
// 조합 중 Enter 때문에 줄이 바뀌지 않게 막아요
function onEditBeforeInput(e) {
  if (editing && editing.finishAfterCompose && /^insert(Paragraph|LineBreak)$/.test(e.inputType)) e.preventDefault();
}
function onEditBlur() { finishEdit(true); }
// 'plaintext-only' 를 모르는 브라우저를 위해: 서식 없이 글자만 붙여넣기
function onEditPaste(e) {
  if (!editing || editing.el.contentEditable === 'plaintext-only') return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
}

function finishEdit(save) {
  if (!editing) return;
  const { el, blockId, key, before } = editing;
  editing = null;
  // 글자는 고치기 모양을 끄기 전에 읽어요 (그래야 줄바꿈이 살아 있어요)
  let value = el.innerText.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!el.hasAttribute('data-multiline')) value = value.replace(/\s*\n\s*/g, ' '); // 한 줄짜리 글자
  el.removeEventListener('keyup', onEditKeyUp);
  el.removeEventListener('beforeinput', onEditBeforeInput);
  el.removeEventListener('keydown', onEditKey);
  el.removeEventListener('blur', onEditBlur);
  el.removeEventListener('paste', onEditPaste);
  el.contentEditable = 'false';
  el.classList.remove('is-editing');
  const blk = el.closest('.blk');
  if (blk) blk.classList.remove('is-editing-blk');
  window.getSelection().removeAllRanges();

  if (!save || value === before.trim()) { renderPage(); return; }
  if (!value) {
    renderPage();
    showToast('글자를 모두 지울 수는 없어요. 원래 글자로 돌려놨어요.');
    return;
  }
  setProp(blockId, key, value, '글자 고치기');
}

// =========================================================
// 사진 · 영상 넣기 (+ 사진 자동 줄이기)
// =========================================================
const VIDEO_MAX_BYTES = 30 * 1024 * 1024;   // 영상 파일은 30MB까지
const formatSize = (bytes) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
  : `${Math.max(1, Math.round(bytes / 1024))}KB`;

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

// 큰 사진을 알맞은 크기로 줄여요 (js/site-build.js 공통 모듈 사용)
const shrinkImage = (file, alpha) => (window.HometeoBuild && window.HometeoBuild.shrinkImage ? window.HometeoBuild.shrinkImage(file, alpha) : Promise.resolve({ dataUrl: '' }));

// 사진을 블록의 path 자리에 넣어요. push 면 목록(예: 인증 마크)에 하나 더해요.
async function putImage(blockId, file, path, opts) {
  const o = opts || {};
  if (!file || !findBlock(blockId)) return;
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)) {
    showToast('사진 파일만 넣을 수 있어요.');
    return;
  }
  showToast('사진을 알맞은 크기로 줄이는 중이에요…');
  try {
    const r = await shrinkImage(file, o.alpha);
    const assetId = newId('img');
    state.assets[assetId] = r.dataUrl;
    // 세로 사진인지 알아봐요 (높이가 너비보다 10% 넘게 길면 세로)
    const portrait = r.w && r.h && r.h > r.w * 1.1;
    const blk = findBlock(blockId);
    let note = '';
    change(o.push ? '그림 추가' : '사진 넣기', () => {
      const p = findBlock(blockId).props;
      if (o.push) { getPath(p, path).push(assetId); return; }
      setPath(p, path, assetId);
      // 새 사진은 가운데부터 (위치 맞추기 값이 있는 자리라면). 휴대폰용 사진이면 휴대폰 값만
      const base = path.includes('.') ? getPath(p, path.slice(0, path.lastIndexOf('.'))) : p;
      const key = path.slice(path.lastIndexOf('.') + 1);
      if (key === 'imageM') { base.imgXm = 50; base.imgYm = 50; base.imgZoomm = 1; }
      else if (base && 'imgX' in base) { base.imgX = 50; base.imgY = 50; base.imgZoom = 1; if (blk.phoneOwn) { base.imgXm = 50; base.imgYm = 50; base.imgZoomm = 1; } }
      if (!portrait || key === 'imageM') return;
      if (blk.type === 'image' && path === 'image') {
        if (!['3/4', '9/16', 'auto', 'fill'].includes(p.ratio)) {
          p.ratio = '3/4';
          if (blk.span === COLUMNS && !blk.px) blk.px = 'l';
          note = blk.span === COLUMNS ? '세로 사진이라 3:4 비율로 바꾸고 양옆 여백을 넓게 두었어요' : '세로 사진이라 3:4 비율로 바꿨어요';
        }
      } else if (blk.type === 'text' && path === 'image' && !['3/4', '9/16', '1/1'].includes(p.ratio)) {
        p.ratio = '3/4';
        note = '세로 사진이라 3:4 비율로 바꿨어요';
      } else if (blk.type === 'banner') {
        note = '세로 사진은 휴대폰용 사진으로 넣으면 더 잘 보여요 (더보기 → 휴대폰 따로 맞추기)';
      }
    });
    const saved = r.before > r.after * 1.05
      ? `${formatSize(r.before)} → ${formatSize(r.after)}로 줄였어요`
      : `${formatSize(r.after)}`;
    showToast(`사진을 넣었어요 · ${saved}${note ? ' · ' + note : ''}`);
  } catch (err) {
    showToast('이 사진은 열 수 없어요. JPG나 PNG 사진으로 바꿔서 넣어주세요.');
  }
}

// 영상의 가로 · 세로 크기 (알 수 없으면 null)
function videoSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    const done = (r) => { URL.revokeObjectURL(url); resolve(r); };
    v.preload = 'metadata';
    v.onloadedmetadata = () => done(v.videoWidth ? { w: v.videoWidth, h: v.videoHeight } : null);
    v.onerror = () => done(null);
    setTimeout(() => done(null), 4000);
    v.src = url;
  });
}
async function putVideo(blockId, file, path) {
  if (!file || !findBlock(blockId)) return;
  if (!/^video\//.test(file.type) && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
    showToast('영상 파일(MP4)만 넣을 수 있어요.');
    return;
  }
  if (file.size > VIDEO_MAX_BYTES) {
    showToast(`영상이 너무 커요 (${formatSize(file.size)}). 30MB보다 큰 영상은 유튜브에 올리고 주소를 넣어주세요.`);
    return;
  }
  showToast('영상을 넣는 중이에요…');
  try {
    let dataUrl = await readAsDataURL(file);
    if (/^data:application\/octet-stream/.test(dataUrl) || /^data:;/.test(dataUrl)) dataUrl = dataUrl.replace(/^data:[^;]*;/, 'data:video/mp4;');
    const assetId = newId('vid');
    state.assets[assetId] = dataUrl;
    const dims = await videoSize(file);
    const portrait = dims && dims.h > dims.w * 1.1;
    change('영상 넣기', () => {
      const p = findBlock(blockId).props;
      setPath(p, path, assetId);
      if (portrait && p.ratio !== 'fill') { p.ratio = '9/16'; const vb = findBlock(blockId); if (vb.span === COLUMNS && !vb.px) vb.px = 'l'; }
    });
    showToast(`영상을 넣었어요 · ${formatSize(file.size)}${portrait ? ' · 세로 영상이라 9:16 비율로 바꿨어요' : ''}`);
  } catch (err) {
    showToast('이 영상은 열 수 없어요. MP4 파일로 바꿔서 넣어주세요.');
  }
}

// 숨겨진 '파일 고르기' 창
function makePicker(accept) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.hidden = true;
  document.body.appendChild(input);
  return input;
}
const imagePicker = makePicker('image/*');
const videoPicker = makePicker('video/mp4,video/webm,video/quicktime,video/*');
let pickTarget = null;   // { blockId, path, push, alpha }
let siteImgTarget = null;   // 사이트 정보의 공유 사진 · 아이콘
imagePicker.addEventListener('change', () => {
  const file = imagePicker.files[0];
  imagePicker.value = '';
  if (file && siteImgTarget) { const t = siteImgTarget; siteImgTarget = null; putSiteImage(t.key, file, t.alpha); return; }
  if (file && pickTarget) putImage(pickTarget.blockId, file, pickTarget.path, pickTarget);
});
videoPicker.addEventListener('change', () => {
  const file = videoPicker.files[0];
  videoPicker.value = '';
  if (file && pickTarget) putVideo(pickTarget.blockId, file, pickTarget.path);
});
// 갤러리: 사진 여러 장을 한꺼번에 (빈 칸부터 채우고, 모자라면 칸을 더해요)
const multiPicker = makePicker('image/*');
multiPicker.multiple = true;
let multiTarget = null;
multiPicker.addEventListener('change', async () => {
  const files = [...multiPicker.files].filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)).slice(0, 40);
  multiPicker.value = '';
  const t = multiTarget;
  if (!t || !files.length || !findBlock(t.blockId)) return;
  showToast(`사진 ${files.length}장을 알맞은 크기로 줄이는 중이에요…`);
  const ids = [];
  for (const f of files) {
    try { const r = await shrinkImage(f, false); const id = newId('img'); state.assets[id] = r.dataUrl; ids.push(id); } catch (e) { /* 열 수 없는 사진은 건너뛰어요 */ }
  }
  if (!ids.length) { showToast('사진을 열 수 없어요. JPG나 PNG 사진으로 넣어주세요.'); return; }
  change(`사진 ${ids.length}장 넣기`, () => {
    const list = getPath(findBlock(t.blockId).props, t.path);
    ids.forEach((id) => {
      const empty = list.find((x) => !x.image);
      if (empty) Object.assign(empty, { image: id, imgX: 50, imgY: 50, imgZoom: 1 });
      else if (list.length < 40) list.push({ image: id, imgX: 50, imgY: 50, imgZoom: 1, caption: '' });
    });
  });
  showToast(`사진 ${ids.length}장을 넣었어요.`);
});

// 자료 파일 (PDF · 한글 · 워드 · 엑셀 · 압축): 줄이지 않고 그대로 담아요 (10MB까지)
const docPicker = makePicker('.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.png');
let docTarget = null;
docPicker.addEventListener('change', () => {
  const file = docPicker.files[0];
  docPicker.value = '';
  const t = docTarget;
  if (!file || !t || !findBlock(t.blockId)) return;
  if (file.size > 10 * 1024 * 1024) { showToast('10MB보다 큰 파일은 넣을 수 없어요. 구글 드라이브에 올리고 주소를 적어 주세요.'); return; }
  const ext = (/\.([a-z0-9]{1,5})$/i.exec(file.name) || [, 'bin'])[1].toLowerCase();
  const r = new FileReader();
  r.onload = () => {
    const aid = newId('doc-') + '.' + ext;
    state.assets[aid] = r.result;
    change('파일 넣기', () => { const it = getPath(findBlock(t.blockId).props, t.path); it.file = aid; it.fname = file.name; });
    showToast(`‘${file.name}’을 넣었어요.`);
  };
  r.readAsDataURL(file);
});

function pickImage(blockId, path, opts) { siteImgTarget = null; pickTarget = Object.assign({ blockId, path }, opts || {}); imagePicker.click(); }
function pickVideo(blockId, path) { pickTarget = { blockId, path }; videoPicker.click(); }

// 컴퓨터의 사진 파일을 블록 위로 끌어다 놓기
const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
function dropPathFor(blk) {
  const b = blk && findBlock(blk.dataset.id);
  const def = b && BLOCKS[b.type];
  return def && def.dropPath ? def.dropPath(b.props, { id: b.id }, helpers) : null;
}
let fileHoverEl = null;
function setFileHover(el) {
  if (fileHoverEl === el) return;
  if (fileHoverEl) fileHoverEl.classList.remove('is-file-over');
  fileHoverEl = el;
  if (el) el.classList.add('is-file-over');
}
window.addEventListener('dragover', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault(); // 브라우저가 사진을 열어버리지 않게
  const blk = e.target.closest && e.target.closest('.blk');
  const ok = blk && dropPathFor(blk);
  e.dataTransfer.dropEffect = ok ? 'copy' : 'none';
  setFileHover(ok ? blk : null);
});
window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) setFileHover(null); });
window.addEventListener('drop', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  setFileHover(null);
  const blk = e.target.closest && e.target.closest('.blk');
  const path = blk && dropPathFor(blk);
  if (path) putImage(blk.dataset.id, e.dataTransfer.files[0], path);
  else showToast('사진은 사진이 들어가는 블록(메인 배너, 사진, 카드 슬라이드, 사진 있는 글) 위에 놓아주세요.');
});

// =========================================================
// PC / 휴대폰 미리보기
// =========================================================
const DEVICES = {
  pc: { label: 'PC 화면 · 최대 1040px' },
  phone: { label: '휴대폰 화면 · 390px' }
};
function setDevice(device) {
  finishEdit(true);
  state.sideBySide = device === 'both';
  const pick = device;
  if (device === 'both') device = 'pc';
  state.device = device;
  document.body.dataset.device = device;
  document.body.classList.toggle('with-phone', state.sideBySide);
  if (phoneSide && !PANE) { phoneSide.hidden = !state.sideBySide; openPane(state.sideBySide); }
  els.device.querySelectorAll('[data-device]').forEach((b) => {
    const on = b.dataset.device === pick;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  els.deviceLabel.textContent = state.sideBySide ? 'PC 화면 · 오른쪽 휴대폰 화면에서도 바로 고쳐요' : DEVICES[device].label;
  els.stage.scrollTop = 0;
  renderPage();
  renderInspector();
}
els.device.addEventListener('click', (e) => {
  const b = e.target.closest('[data-device]');
  if (b) setDevice(b.dataset.device);
});

// =========================================================
// 새 탭에서 열어보기 (편집 도구 없이 진짜 홈페이지처럼)
// =========================================================
function siteTitle() {
  const header = state.blocks.find((b) => b.type === 'header');
  if (nameSynced() && header && header.props.logo) return header.props.logo;
  if (state.site && state.site.info && state.site.info.name) return state.site.info.name;
  if (header && header.props.logo) return header.props.logo;
  const footer = state.blocks.find((b) => b.type === 'footer');
  return footer && footer.props.name ? footer.props.name : '내 홈페이지';
}
// 완성 홈페이지용 도우미: 편집 화면에서만 보이는 '사진 넣기' 자리는 빼요
function siteHelpers(assetFn) {
  return Object.assign({}, helpers, {
    editor: false,
    placeholder: () => '',
    view: () => 0,
    asset: assetFn || helpers.asset
  });
}
// 모든 페이지를 완성 파일로 만들어요 [{ id, name, file, html }]
function buildSitePages(assetFn) {
  syncOut();
  useFonts();
  return window.HometeoBuild.buildSitePages({
    site: state.site,
    assets: state.assets,
    assetFn
  });
}
function openPreview() {
  finishEdit(true);
  if (!state.blocks.length) { showToast('페이지가 비어 있어요. 블록을 먼저 놓아주세요.'); return; }
  const pages = buildSitePages();
  const html = window.HometeoExport.buildPreviewHtml({ pages, current: fileOf(curPage()), title: siteTitle(), device: state.device });
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const win = window.open(url, '_blank');
  if (!win) showToast('새 탭이 막혔어요. 브라우저 주소창 옆의 팝업 허용을 눌러주세요.');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
els.preview.addEventListener('click', openPreview);
document.getElementById('btn-insp').addEventListener('click', toggleInsp);

// =========================================================
// 사진 위치 맞추기 · 자르기
// =========================================================
// 사진에서 '꼭 보여야 할 곳'(x, y %)과 '확대'(zoom)를 정해요.
// 그 곳이 PC에서도 휴대폰에서도 화면 안에 들어오도록 맞춰져요.
//   base   : 사진이 있는 자리 ('' = 블록 자신, 'slides.2' = 세 번째 슬라이드)
//   frames : 'wide' = PC·휴대폰 두 모습 / 'ratio:4/3' = 그 비율 한 모습
//   key    : 'image'(보통) 또는 'imageM'(휴대폰용 사진 — 휴대폰 모습만)
//   블록에서 '휴대폰은 따로 맞추기'를 켜면 PC 모습과 휴대폰 모습을 따로 움직여요
let crop = null;
function cropFrames(spec, own) {
  if (spec && spec.startsWith('ratio:')) return [{ label: '페이지에서 보이는 모습', ratio: spec.slice(6), cls: 'single', which: 'pc' }];
  return [{ label: 'PC에서 보이는 모습', ratio: '16/7', cls: 'is-pc', which: 'pc' }, { label: '휴대폰에서 보이는 모습', ratio: '9/11', cls: 'is-phone', which: own ? 'm' : 'pc' }];
}

function openCrop(blockId, base, framesSpec, key) {
  const b = findBlock(blockId);
  const obj = b && (base ? getPath(b.props, base) : b.props);
  key = key || 'image';
  const src = obj && helpers.asset(obj[key]);
  if (!src) return;
  const onlyM = key === 'imageM';
  const own = !!b.phoneOwn && (onlyM || !(framesSpec || '').startsWith('ratio:'));
  const v = (k, d) => (obj[k] == null ? d : obj[k]);
  crop = {
    blockId, base, key, own, onlyM,
    pc: { x: v('imgX', 50), y: v('imgY', 50), zoom: obj.imgZoom || 1 },
    m: { x: v('imgXm', v('imgX', 50)), y: v('imgYm', v('imgY', 50)), zoom: obj.imgZoomm || obj.imgZoom || 1 },
    active: onlyM ? 'm' : 'pc'
  };
  // 칸에 꽉 채우기: 지금 화면의 사진 칸 모양 그대로 맞춰요
  if (framesSpec === 'fill') {
    const fr = els.paper.querySelector(`.blk[data-id="${blockId}"] .b-image-frame, .blk[data-id="${blockId}"] .b-video-frame`);
    const r = fr && fr.getBoundingClientRect();
    framesSpec = r && r.width && r.height ? `ratio:${Math.round(r.width)}/${Math.round(r.height)}` : 'ratio:4/3';
  }
  const frames = onlyM ? [{ label: '휴대폰에서 보이는 모습', ratio: '9/16', cls: 'is-phone', which: 'm' }] : cropFrames(framesSpec, own);
  const wrap = document.createElement('div');
  wrap.className = 'modal-back';
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div class="modal-head">
        <h2 id="crop-title">${onlyM ? '휴대폰용 사진 위치 맞추기' : '사진 위치 맞추기 · 자르기'}</h2>
        <button class="icon-btn" data-crop="cancel" aria-label="닫기">${ICON.x}</button>
      </div>
      <p class="modal-help">${ICON.move} ${own && !onlyM ? '<b>PC와 휴대폰을 따로 맞춰요.</b> 고칠 모습을 누르고 끌어서 꼭 보여야 할 부분을 맞추세요.' : '사진을 끌어서 꼭 보여야 할 부분을 가운데로 맞추세요.'} 확대하면 가장자리가 잘려요.</p>
      <div class="crop-views${frames.length === 1 ? ' one' : ''}">
        ${frames.map((f) => `
        <figure class="crop-view${own && !onlyM ? ' can-pick' : ''}" data-which="${f.which}">
          <div class="crop-frame ${f.cls}" style="aspect-ratio:${f.ratio}" data-crop-frame data-which="${f.which}"><img src="${src}" alt="" draggable="false"></div>
          <figcaption>${f.label}${own && !onlyM ? (f.which === 'm' ? ' <b class="own-tag">따로</b>' : '') : ''}</figcaption>
        </figure>`).join('')}
      </div>
      <div class="crop-zoom">
        <label for="crop-zoom">확대<span id="crop-zoom-which"></span></label>
        <input id="crop-zoom" type="range" min="100" max="300" step="5" value="100">
        <output id="crop-zoom-out">100%</output>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost-plain" data-crop="reset">원래대로</button>
        <span class="spacer"></span>
        <button class="btn" data-crop="cancel">취소</button>
        <button class="btn btn-primary" data-crop="apply">적용하기</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  crop.el = wrap;
  paintCrop();

  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) return closeCrop(false);
    const a = e.target.closest('[data-crop]');
    if (!a) return;
    if (a.dataset.crop === 'cancel') closeCrop(false);
    if (a.dataset.crop === 'apply') closeCrop(true);
    if (a.dataset.crop === 'reset') { crop[crop.active] = { x: 50, y: 50, zoom: 1 }; paintCrop(); }
  });
  wrap.querySelector('#crop-zoom').addEventListener('input', (e) => {
    crop[crop.active].zoom = Number(e.target.value) / 100;
    paintCrop();
  });
  wrap.querySelectorAll('[data-crop-frame]').forEach((frame) => {
    frame.addEventListener('pointerdown', (e) => { crop.active = frame.dataset.which; startCropDrag(e, frame); });
    frame.addEventListener('wheel', (e) => {
      e.preventDefault();
      crop.active = frame.dataset.which;
      const c = crop[crop.active];
      c.zoom = Math.min(3, Math.max(1, c.zoom - e.deltaY / 800));
      paintCrop();
    }, { passive: false });
  });
  wrap.querySelector('[data-crop="apply"]').focus();
}

function paintCrop() {
  if (!crop) return;
  crop.el.querySelectorAll('[data-crop-frame]').forEach((frame) => {
    const c = crop[frame.dataset.which];
    frame.querySelector('img').setAttribute('style', helpers.photoStyle({ imgX: c.x, imgY: c.y, imgZoom: c.zoom }));
    frame.closest('.crop-view').classList.toggle('is-active', crop.own && !crop.onlyM && frame.dataset.which === crop.active);
  });
  const pct = Math.round(crop[crop.active].zoom * 100);
  crop.el.querySelector('#crop-zoom').value = pct;
  crop.el.querySelector('#crop-zoom-out').textContent = pct + '%';
  crop.el.querySelector('#crop-zoom-which').textContent = crop.own && !crop.onlyM ? (crop.active === 'm' ? ' · 휴대폰' : ' · PC') : '';
}

// 화면에 보이는 사진 크기를 계산해서, 끈 만큼 정확히 따라 움직이게 해요
function startCropDrag(e, frame) {
  if (e.button !== 0) return;
  e.preventDefault();
  const c = crop[frame.dataset.which];
  const img = frame.querySelector('img');
  const fw = frame.clientWidth, fh = frame.clientHeight;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max(fw / iw, fh / ih);
  const extraX = iw * base * c.zoom - fw;   // 가로로 남는 부분 (움직일 수 있는 거리)
  const extraY = ih * base * c.zoom - fh;
  const start = { x: e.clientX, y: e.clientY, cx: c.x, cy: c.y };
  frame.classList.add('is-grabbing');
  frame.setPointerCapture(e.pointerId);
  paintCrop();
  const move = (ev) => {
    if (extraX > 0.5) c.x = clamp(start.cx - (ev.clientX - start.x) / extraX * 100, 0, 100);
    if (extraY > 0.5) c.y = clamp(start.cy - (ev.clientY - start.y) / extraY * 100, 0, 100);
    paintCrop();
  };
  const up = () => {
    frame.classList.remove('is-grabbing');
    frame.removeEventListener('pointermove', move);
    frame.removeEventListener('pointerup', up);
    frame.removeEventListener('pointercancel', up);
  };
  frame.addEventListener('pointermove', move);
  frame.addEventListener('pointerup', up);
  frame.addEventListener('pointercancel', up);
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function closeCrop(apply) {
  if (!crop) return;
  const c = crop;
  crop = null;
  c.el.remove();
  if (!apply) return;
  if (!findBlock(c.blockId)) return;
  const r = (v, k) => Math.round(v * k) / k;
  change('사진 위치 맞추기', () => {
    const o = c.base ? getPath(findBlock(c.blockId).props, c.base) : findBlock(c.blockId).props;
    if (!c.onlyM) { o.imgX = r(c.pc.x, 10); o.imgY = r(c.pc.y, 10); o.imgZoom = r(c.pc.zoom, 100); }
    if (c.own || c.onlyM) { o.imgXm = r(c.m.x, 10); o.imgYm = r(c.m.y, 10); o.imgZoomm = r(c.m.zoom, 100); }
  });
  showToast('사진 위치를 맞췄어요.');
}
