/*
 * 사이트 전체 꾸미기: 색 · 글꼴
 * ------------------------------------------------------------
 * 설정에서 색 몇 가지와 글꼴을 정하면 모든 블록에 알아서 적용돼요.
 * 블록의 색 칸에서 '사이트 색'(빈 값)을 고르면 여기 정한 색을 따라가고,
 * 다른 색을 고르면 그 블록만 따로 바뀌어요.
 *
 *   theme = {
 *     bg     바탕색          (글 · 사진 · 카드 · 맨 위 메뉴의 바탕)
 *     text   글자색          ('' = 바탕색에 맞춰 저절로)
 *     point  포인트색        (버튼 · 강조)
 *     dark   어두운 칸 색    (메인 배너 · 어두운 맨 아래 정보)
 *     font   { ko, en }      본문 글꼴 (en '' = 한글 글꼴 그대로)
 *     head   { ko, en } | null  제목 글꼴 (null = 본문과 같이)
 *   }
 * 글꼴은 글자 종류(ko 한글 · en 영문)마다 따로 정해요. 나중에 ja(일본어) · zh(한자)를 같은 방식으로 더하면 돼요.
 */
(function () {
  // 무료이고 상업적으로 써도 되는 글꼴만 넣었어요 (SIL Open Font License 등)
  const gf = (q) => `https://fonts.googleapis.com/css2?family=${q}&display=swap`;
  const FONTS = {
    ko: [
      { id: 'pretendard', name: '프리텐다드', note: '깔끔한 · 기본', family: "'Pretendard'", url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css' },
      { id: 'noto-sans', name: '본고딕 (Noto Sans KR)', note: '깔끔한', family: "'Noto Sans KR'", url: gf('Noto+Sans+KR:wght@400;700;800') },
      { id: 'nanum-gothic', name: '나눔고딕', note: '익숙한', family: "'Nanum Gothic'", url: gf('Nanum+Gothic:wght@400;700;800') },
      { id: 'gowun-dodum', name: '고운돋움', note: '부드러운', family: "'Gowun Dodum'", url: gf('Gowun+Dodum') },
      { id: 'nanum-myeongjo', name: '나눔명조', note: '단정한 · 명조', family: "'Nanum Myeongjo'", url: gf('Nanum+Myeongjo:wght@400;700;800') },
      { id: 'gowun-batang', name: '고운바탕', note: '부드러운 · 명조', family: "'Gowun Batang'", url: gf('Gowun+Batang:wght@400;700') },
      { id: 'do-hyeon', name: '도현', note: '강렬한 · 제목용', family: "'Do Hyeon'", url: gf('Do+Hyeon') },
      { id: 'black-han-sans', name: '검은고딕', note: '강렬한 · 제목용', family: "'Black Han Sans'", url: gf('Black+Han+Sans') },
      { id: 'jua', name: '주아', note: '귀여운', family: "'Jua'", url: gf('Jua') },
      { id: 'gaegu', name: '개구', note: '손글씨 느낌', family: "'Gaegu'", url: gf('Gaegu:wght@400;700') }
    ],
    en: [
      { id: '', name: '한글 글꼴 그대로', note: '', family: '', url: '' },
      { id: 'inter', name: 'Inter', note: '깔끔한', family: "'Inter'", url: gf('Inter:wght@400;700;800') },
      { id: 'roboto', name: 'Roboto', note: '익숙한', family: "'Roboto'", url: gf('Roboto:wght@400;700') },
      { id: 'montserrat', name: 'Montserrat', note: '둥근 · 시원한', family: "'Montserrat'", url: gf('Montserrat:wght@400;700;800') },
      { id: 'poppins', name: 'Poppins', note: '동글동글', family: "'Poppins'", url: gf('Poppins:wght@400;600;700') },
      { id: 'playfair', name: 'Playfair Display', note: '우아한 · 세리프', family: "'Playfair Display'", url: gf('Playfair+Display:wght@400;700') },
      { id: 'lora', name: 'Lora', note: '단정한 · 세리프', family: "'Lora'", url: gf('Lora:wght@400;700') }
    ]
  };
  const FALLBACK = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', system-ui, sans-serif";

  // 색 묶음 (한 번에 고르기)
  const PRESETS = [
    { id: 'hometeo', name: '홈터', bg: '#ffffff', text: '', point: '#F2B33D', dark: '#2B2A28' },
    { id: 'navy', name: '차분한 남색', bg: '#ffffff', text: '', point: '#3B6FD8', dark: '#2F4A7A' },
    { id: 'cafe', name: '따뜻한 갈색', bg: '#FFFCF6', text: '', point: '#D9822B', dark: '#6B4A35' },
    { id: 'forest', name: '숲 초록', bg: '#ffffff', text: '', point: '#F2B33D', dark: '#2E6B4F' },
    { id: 'rose', name: '부드러운 분홍', bg: '#FFF8F8', text: '', point: '#E06C8B', dark: '#7A3E4E' },
    { id: 'night', name: '어두운 밤', bg: '#1E1D1B', text: '', point: '#F2B33D', dark: '#000000' }
  ];
  const DEFAULT = () => ({ bg: '#ffffff', text: '', point: '#F2B33D', dark: '#2B2A28', font: { ko: 'pretendard', en: '' }, head: null });

  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  };
  // 그 바탕 위에서 잘 보이는 글자색: 흰 글자와 진한 글자 중 더 또렷한 쪽
  const inkOn = (hex) => (isHex(hex) && contrast(hex, '#ffffff') >= contrast(hex, '#2B2A28') ? '#ffffff' : '#2B2A28');
  const mix = (a, b, t) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
    return '#' + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, '0')).join('');
  };
  // 사용자가 올린 글꼴 (site.fonts). 한글 · 영문 어디에나 고를 수 있어요
  //   site.fonts = [{ id, name, asset, format, licensed }] → 글꼴 이름은 'ht-아이디'
  let CUSTOM = [];
  const customFamily = (id) => `'ht-${id}'`;
  function setCustom(list) {
    CUSTOM = (Array.isArray(list) ? list : []).map((f) => ({ id: f.id, name: f.name, note: '내 글꼴', family: customFamily(f.id), url: '', custom: true }));
  }
  const fontList = (kind) => (kind === 'en' ? [FONTS.en[0], ...CUSTOM, ...FONTS.en.slice(1)] : [...CUSTOM, ...FONTS[kind]]);
  const find = (kind, id) => (id ? FONTS[kind].find((f) => f.id === id) || CUSTOM.find((f) => f.id === id) : FONTS[kind].find((f) => f.id === id));
  // @font-face 글: urlOf(글꼴) = 그 파일 주소 (편집 화면은 data: 주소, 내려받기는 fonts/파일)
  const FORMAT = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
  function fontFaceCss(list, urlOf) {
    return (Array.isArray(list) ? list : []).map((f) => {
      const url = urlOf(f);
      return url ? `@font-face{font-family:${customFamily(f.id)};src:url("${url}") format("${FORMAT[f.format] || 'woff2'}");font-display:swap}` : '';
    }).filter(Boolean).join('\n');
  }

  // 글꼴 이름 줄: 영문 글꼴을 앞에, 한글 글꼴을 뒤에 두면 영문은 영문 글꼴로, 한글은 한글 글꼴로 보여요
  function stack(f) {
    const en = f && f.en && find('en', f.en);
    const ko = (f && find('ko', f.ko)) || FONTS.ko[0];
    return [en && en.family, ko.family, FALLBACK].filter(Boolean).join(', ');
  }
  function normalize(t) {
    const d = DEFAULT();
    const x = Object.assign(d, t || {});
    ['bg', 'point', 'dark'].forEach((k) => { if (!isHex(x[k])) x[k] = d[k]; });
    if (x.text && !isHex(x.text)) x.text = '';
    const nf = (f, dflt) => ({ ko: f && find('ko', f.ko) ? f.ko : dflt.ko, en: f && find('en', f.en) ? f.en : '' });
    x.font = nf(x.font, { ko: 'pretendard' });
    x.head = x.head ? nf(x.head, x.font) : null;
    return x;
  }
  // 페이지에 넣을 CSS 변수 (편집 화면 · 완성 홈페이지가 같이 써요)
  function vars(t) {
    const x = normalize(t);
    const text = x.text || inkOn(x.bg);
    const soft = mix(x.bg, x.point, lum(x.bg) < 100 ? 0.14 : 0.09);   // 연한 바탕 (사이드 칸 등)
    return [
      `--c-bg:${x.bg}`, `--c-text:${text}`, `--c-point:${x.point}`, `--c-point-ink:${inkOn(x.point)}`,
      `--c-dark:${x.dark}`, `--c-dark-ink:${inkOn(x.dark)}`, `--c-soft:${soft}`,
      `--font-body:${stack(x.font)}`, `--font-head:${stack(x.head || x.font)}`
    ].join(';');
  }
  // 불러와야 할 글꼴 파일 주소
  function fontUrls(t) {
    const x = normalize(t);
    const urls = [x.font, x.head].filter(Boolean).flatMap((f) => [find('ko', f.ko), f.en && find('en', f.en)]).filter(Boolean).map((f) => f.url);
    return [...new Set(urls)].filter(Boolean);
  }

  // =========================================================
  // 색 도구: 번호 바꾸기(HEX · RGB · CMYK · HSL), 글자 대비, 추천 색 묶음, 색 조합
  // =========================================================
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hexToRgb = (hex) => { const n = parseInt(String(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  // CMYK는 인쇄용이라 화면 색과 똑같지는 않아요 (가장 흔한 단순 계산)
  function rgbToCmyk(r, g, b) {
    const k = 1 - Math.max(r, g, b) / 255;
    if (k >= 1) return [0, 0, 0, 100];
    const f = (v) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100);
    return [f(r), f(g), f(b), Math.round(k * 100)];
  }
  const cmykToRgb = (c, m, y, k) => [c, m, y].map((v) => 255 * (1 - clamp(v, 0, 100) / 100) * (1 - clamp(k, 0, 100) / 100));
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l * 100];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s * 100, l * 100];
  }
  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }
  const hexToHsl = (hex) => rgbToHsl(...hexToRgb(hex));
  // 글자 대비 (WCAG): 4.5 이상이면 본문 글자가 잘 보여요
  function contrast(a, b) {
    const L = (hex) => hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const x = L(a), y = L(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  // 사이트 색에서 글자가 잘 안 보이는 곳
  function checkColors(t) {
    const x = normalize(t);
    const out = [];
    const text = x.text || inkOn(x.bg);
    const c1 = contrast(x.bg, text);
    if (c1 < 4.5) out.push({ level: c1 < 3 ? 'red' : 'yellow', key: 'text', text: `바탕색과 글자색이 비슷해서 글이 잘 안 보여요 (대비 ${c1.toFixed(1)} · 4.5 이상 추천)` });
    const c2 = contrast(x.point, inkOn(x.point));
    if (c2 < 3) out.push({ level: 'yellow', key: 'point', text: `포인트색 버튼 위 글자가 잘 안 보여요 (대비 ${c2.toFixed(1)})` });
    const c3 = contrast(x.dark, inkOn(x.dark));
    if (c3 < 4.5) out.push({ level: 'yellow', key: 'dark', text: `어두운 칸이 충분히 어둡지(밝지) 않아서 글이 흐려 보여요 (대비 ${c3.toFixed(1)})` });
    const c4 = contrast(x.bg, x.dark);
    if (c4 < 1.5) out.push({ level: 'yellow', key: 'dark', text: '바탕색과 어두운 칸이 거의 같아서 구역이 잘 안 나뉘어 보여요' });
    return out;
  }
  // 잘 보이게 밝기만 살짝 고쳐요 (색 느낌은 그대로)
  function shift(hex, ok, dir) {
    const [h, s, l] = hexToHsl(hex);
    for (let i = 1; i <= 50; i++) { const c = hsl(h, s, l + dir * i * 2); if (ok(c)) return c; }
    return dir > 0 ? '#FFFFFF' : '#000000';
  }
  function fixColors(t) {
    const x = JSON.parse(JSON.stringify(normalize(t)));
    if (x.text && contrast(x.bg, x.text) < 4.5) x.text = '';
    if (contrast(x.bg, inkOn(x.bg)) < 4.5) x.bg = shift(x.bg, (c) => contrast(c, inkOn(c)) >= 4.5, hexToHsl(x.bg)[2] > 50 ? 1 : -1);
    if (contrast(x.point, inkOn(x.point)) < 3) x.point = shift(x.point, (c) => contrast(c, inkOn(c)) >= 3, -1);
    if (contrast(x.dark, inkOn(x.dark)) < 4.5) x.dark = shift(x.dark, (c) => contrast(c, inkOn(c)) >= 4.5 && inkOn(c) === '#ffffff', -1);   // 어두운 칸은 더 어둡게
    if (contrast(x.bg, x.dark) < 1.5) x.dark = shift(x.dark, (c) => contrast(x.bg, c) >= 1.5 && contrast(c, inkOn(c)) >= 4.5, hexToHsl(x.bg)[2] > 50 ? -1 : 1);
    return x;
  }

  // 추천 색 묶음: 색 계열마다 4가지 (밝은 · 차분한 · 진한 · 어두운)
  //   RGB 기본색(빨강 · 초록 · 파랑) · CMYK 기본색(청록 · 자홍 · 노랑) · 그 밖의 색
  const FAMILIES = [
    { id: 'red', name: '빨강', group: 'rgb', h: 2, s: 1 },
    { id: 'green', name: '초록', group: 'rgb', h: 135, s: 0.8 },
    { id: 'blue', name: '파랑', group: 'rgb', h: 218, s: 1 },
    { id: 'cyan', name: '청록', group: 'cmyk', h: 186, s: 0.9 },
    { id: 'magenta', name: '자홍', group: 'cmyk', h: 318, s: 0.9 },
    { id: 'yellow', name: '노랑', group: 'cmyk', h: 46, s: 1 },
    { id: 'orange', name: '주황', group: 'etc', h: 24, s: 1 },
    { id: 'purple', name: '보라', group: 'etc', h: 268, s: 0.85 },
    { id: 'pink', name: '분홍', group: 'etc', h: 345, s: 0.8 },
    { id: 'brown', name: '갈색', group: 'etc', h: 26, s: 0.5 },
    { id: 'gray', name: '흑백', group: 'etc', h: 30, s: 0 }
  ];
  const GROUPS = [
    { id: 'rgb', name: '빛의 기본색 (RGB)', help: '화면에서 가장 선명한 색' },
    { id: 'cmyk', name: '인쇄 기본색 (CMYK)', help: '명함 · 전단지와 맞추기 좋은 색' },
    { id: 'etc', name: '그 밖의 색', help: '' }
  ];
  function familyPresets(id) {
    const f = FAMILIES.find((x) => x.id === id) || FAMILIES[0];
    const h = f.h, k = f.s;
    const gray = k === 0;
    const raw = [
      { id: 'light', name: '밝은', bg: hsl(h, 70 * k, 97), point: gray ? '#3A3A3A' : hsl(h, 80 * k, 50), dark: hsl(h, 40 * k, 22) },
      { id: 'calm', name: '차분한', bg: hsl(h, 12 * k, 99), point: gray ? '#6B6B6B' : hsl(h, 35 * k, 46), dark: hsl(h, 18 * k, 26) },
      { id: 'deep', name: '진한', bg: '#FFFFFF', point: gray ? '#111111' : hsl(h, 90 * k, 40), dark: hsl(h, 75 * k, 16) },
      { id: 'night', name: '어두운', bg: hsl(h, 14 * k, 11), point: gray ? '#E8E8E8' : hsl(h, 85 * k, 62), dark: hsl(h, 20 * k, 4) }
    ];
    return raw.map((r) => Object.assign(fixColors({ bg: r.bg, point: r.point, dark: r.dark, text: '' }), { id: `${f.id}-${r.id}`, name: `${f.name} · ${r.name}` }));
  }

  // 색 조합 (기준 색 하나로)
  const HARMONY = [
    { id: 'mono', name: '한 가지 색으로', orig: '단색', feel: '차분하고 깔끔해요', hues: [0, 0, 0] },
    { id: 'analog', name: '비슷한 색끼리', orig: '유사색', feel: '부드럽고 자연스러워요', hues: [0, -30, 30] },
    { id: 'comp', name: '반대 색으로 강조', orig: '보색', feel: '눈에 확 띄어요', hues: [0, 180, 180] },
    { id: 'split', name: '반대 색 양옆으로', orig: '분할 보색', feel: '띄지만 덜 강해요', hues: [0, 150, 210] },
    { id: 'triad', name: '세 가지 고르게', orig: '삼각 배색', feel: '밝고 활기차요', hues: [0, 120, 240] }
  ];
  // 조합의 색 3가지(기준 · 둘째 · 셋째)를 사이트 색으로: 포인트 = 기준, 어두운 칸 = 둘째를 진하게, 바탕 = 셋째를 아주 연하게
  //   mix = 0~1 (다시 섞기: 밝기 · 진하기를 조금씩 바꿔요),  lock = { bg, point, dark } 고정할 색
  function harmonyColors(base, kind) {
    const H = HARMONY.find((x) => x.id === kind) || HARMONY[0];
    const [h, s, l] = hexToHsl(base);
    return H.hues.map((d, i) => (i === 0 ? base.toUpperCase() : kind === 'mono' ? hsl(h, s, i === 1 ? Math.max(12, l - 35) : Math.min(94, l + 30)) : hsl(h + d, s, l)));
  }
  function harmonyTheme(base, kind, mix, lock) {
    const cols = harmonyColors(base, kind);
    const r = mix || 0;
    const [h2, s2] = hexToHsl(cols[1]);
    const [h3, s3] = hexToHsl(cols[2]);
    const t = {
      point: cols[0],
      dark: hsl(h2, Math.max(25, s2 * (0.55 + r * 0.3)), 14 + r * 10),
      bg: r > 0.75 ? '#FFFFFF' : hsl(h3, Math.min(60, s3 * (0.35 + r * 0.4)), 96 + r * 2.5),
      text: ''
    };
    if (lock) ['bg', 'point', 'dark'].forEach((k) => { if (lock[k]) t[k] = lock[k]; });
    return fixColors(t);
  }

  window.HometeoTheme = {
    FONTS, PRESETS, DEFAULT, normalize, vars, fontUrls, inkOn, stack, fontList, setCustom, fontFaceCss,
    hexToRgb, rgbToHex, rgbToCmyk, cmykToRgb, hexToHsl, hsl, contrast, checkColors, fixColors,
    FAMILIES, GROUPS, familyPresets, HARMONY, harmonyColors, harmonyTheme
  };
})();
