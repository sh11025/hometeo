/*
 * 관리자 번들 템플릿 생성기 (HometeoAdminTemplate)
 * ------------------------------------------------------------
 * 관리자 화면 파일(admin/ 폴더)과 홈터 코어 모듈(js/ 폴더)을 fetch로 읽어와
 * 관리자 번들 압축파일을 조립합니다.
 */
(function () {
  'use strict';

  // 관리자 화면 전용 파일 (admin/ 폴더에서 실시간 fetch)
  const ADMIN_FILES = [
    'index.html',
    'admin.css',
    'admin.js'
  ];

  // 홈터 코어 스크립트 파일 (js/ 폴더에서 실시간 fetch)
  const CORE_FILES = [
    'theme.js',
    'blocks.js',
    'block-styles.js',
    'page-export.js',
    'site-build.js',
    'history.js',
    'zip.js',
    'admin-ui.js',
    'qrcode.js'
  ];

  // 쉬운 말로 쓴 안내.txt (홈터 관리자 설정의 따라 하기 안내 5단계와 동일한 순서)
  function adminGuide(cfg) {
    const c = cfg || {};
    const adminRepoName = c.repo ? (c.repo.endsWith('-admin') ? c.repo : c.repo + '-admin') : 'my-site-admin';
    return [
      '================================================================',
      ' 홈터(Hometeo) · 관리자 화면 올리기 따라 하기 안내',
      '================================================================',
      '',
      '이 압축파일은 사장님이 웹 브라우저에서 직접 글과 사진을 고쳐 사이트에 올릴 수 있는',
      '\'관리자 화면\' 묶음이에요. 아래 5단계를 순서대로 따라 해 보세요.',
      '',
      '■ ① GitHub에 보관함 2개 만들기',
      '  1) GitHub(https://github.com)에 로그인합니다.',
      '  2) 홈페이지 보관함: New [새 보관함] → Public [누구나 볼 수 있게] 으로 만들고,',
      '     홈터에서 내려받은 홈페이지 압축파일을 푼 파일들과 project.hometeo를 올립니다.',
      '  3) 관리자 보관함: New [새 보관함] → Private [나만 볼 수 있게] 으로 만듭니다.',
      '     (보관함 이름 예: ' + adminRepoName + ')',
      '     이 압축파일을 풀어서 나온 관리자 화면 파일들을 그 보관함에 그대로 올립니다.',
      '     (index.html 파일이 보관함 맨 위에 있어야 해요)',
      '',
      '■ ② Render에 각각 올리기',
      '  1) Render(https://render.com)에 로그인합니다.',
      '  2) New → Static Site [새로 만들기 → 그냥 파일만 올리는 사이트]를 누르고,',
      '     방금 만든 두 보관함을 각각 올려 인터넷 주소를 만듭니다.',
      '  3) 칸 채우기:',
      '     - Build Command: (비워 두세요)',
      '     - Publish Directory: ./ (그대로 두세요)',
      '  4) 안내: 관리자 보관함은 나만 볼 수 있는 비공개(Private) 보관함이라서',
      '     GitHub Pages에는 올릴 수 없고, Render로 올려야 안전하게 작동해요.',
      '',
      '■ ③ 열쇠 만들기',
      '  1) 사장님이 글과 사진을 고쳐 사이트에 올릴 수 있도록 GitHub에서 안전한 열쇠를 만듭니다.',
      '  2) GitHub 오른쪽 위 프로필 → Settings [설정] → 왼쪽 맨 아래 Developer settings [개발자 설정]',
      '     → Personal access tokens [개인 접속 열쇠] → Fine-grained tokens [보관함 하나만 여는 열쇠] 순으로 들어갑니다.',
      '  3) Only select repositories 에서 방금 만든 \'홈페이지 보관함 하나만\' 고릅니다.',
      '     (관리자 보관함은 고르지 마세요)',
      '  4) Repository permissions 에서 Contents 를 찾아 Access: Read and write [내용 읽고 고치기 허락] 로 바꿉니다.',
      '     (나머지 권한은 전혀 손대지 마세요)',
      '  5) Expiration [열쇠 쓸 수 있는 기간]을 정합니다. 기간이 끝나기 전에 새 열쇠를 만들어 드려야 해요.',
      '  6) 맨 아래 Generate token [열쇠 만들기]을 누르고 나온 영문·숫자 열쇠를 복사합니다.',
      '',
      '■ ④ 사장님께 전하기',
      '  1) 사장님께 알려드릴 것: 관리자 화면 인터넷 주소 + 3단계에서 만든 열쇠',
      '  2) 보안 권장: 열쇠는 메신저 대화방에 오래 남기지 마시고, 사장님이 관리자 화면에',
      '     등록하신 뒤 대화방에서 지우기를 권해드려요.',
      '',
      '■ ⑤ 사장님이 관리자 화면을 쓰는 방법 (도움말 요약)',
      '  1) 처음 열쇠 넣기: 받은 열쇠와 이 기기에서 쓸 비밀번호(4자 이상)를 넣으면 안전하게 잠가 보관해요.',
      '     다음부터는 비밀번호만 넣으면 편하게 열려요.',
      '  2) 글·사진 고치기: 메뉴에서 페이지를 고르면 고칠 수 있는 칸이 차례대로 나와요.',
      '     칸에 적고 다른 곳을 누르면 저장돼요. 첫 화면의 \'자주 고치는 곳\'에서 바로 고칠 수도 있어요.',
      '     관리자 화면의 모양(배치 · 메뉴 · 첫 화면 카드)은 만든 사람이 홈터의 \'관리자 화면 꾸미기\'에서 정해요.',
      '  3) 사이트에 반영하기: 맨 아래 오른쪽 \'사이트에 반영하기\'를 누르면 1~2분 뒤 실제 사이트에 나타나요.',
      '  4) 지난 모습: 언제든 \'지난 모습\' 버튼으로 예전 저장 기록(최대 30개)으로 되돌릴 수 있어요.',
      '  5) 비밀번호를 잊었을 때: 맨 위 \'도움말\' 창 안의 \'이 기기의 열쇠 지우고 다시 넣기\'를 누르면 돼요.',
      ''
    ].join('\r\n');
  }

  /**
   * 관리자 화면 파일(admin/)과 홈터 코어 파일(js/)을 fetch로 읽어옵니다.
   */
  async function fetchFile(path) {
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
      throw new Error('FILE_PROTOCOL_NOT_SUPPORTED');
    }
    const res = await fetch(path);
    if (!res.ok) throw new Error('FETCH_FAILED:' + path);
    return await res.text();
  }

  /**
   * 관리자 압축파일에 들어갈 파일 목록을 생성합니다.
   * @param {Object} config - { owner, repo, branch, siteUrl, siteName }
   * @returns {Promise<Array<{ name: string, data: Uint8Array }>>}
   */
  // 앱 아이콘 그림: 사이트 이름 첫 글자 + 자물쇠 표시
  function iconPng(name, color, size) {
    return new Promise((resolve) => {
      try {
        const cv = document.createElement('canvas');
        cv.width = cv.height = size;
        const c = cv.getContext('2d');
        c.fillStyle = color; c.fillRect(0, 0, size, size);
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `bold ${Math.round(size * 0.46)}px sans-serif`;
        c.fillText(String(name || '홈').trim().charAt(0) || '홈', size / 2, size * 0.47);
        c.font = `${Math.round(size * 0.11)}px sans-serif`;
        c.fillText('관리자', size / 2, size * 0.8);
        cv.toBlob((b) => { if (!b) return resolve(null); b.arrayBuffer().then((ab) => resolve(new Uint8Array(ab))); }, 'image/png');
      } catch (e) { resolve(null); }
    });
  }

  async function makeAdminFiles(config) {
    const enc = new TextEncoder();
    const files = [];

    // 배포용 설정 정제 (testMode, dev 등 시험용 속성 배제)
    const raw = config || {};
    const deployConfig = {
      owner: raw.owner || '',
      repo: raw.repo || '',
      branch: raw.branch || 'main',
      siteUrl: raw.siteUrl || '',
      siteName: raw.siteName || '내 홈페이지'
    };

    // 1. 관리자 전용 파일 읽기 (admin/)
    for (const name of ADMIN_FILES) {
      const content = await fetchFile('admin/' + name);
      files.push({ name, data: enc.encode(content) });
    }

    // 2. 홈터 코어 파일 읽기 (js/)
    for (const name of CORE_FILES) {
      const content = await fetchFile('js/' + name);
      files.push({ name, data: enc.encode(content) });
    }

    // 3. 설정 파일 (GitHub 보관함 정보 반영, 시험 모드 없음)
    files.push({ name: 'admin-config.json', data: enc.encode(JSON.stringify(deployConfig, null, 2)) });
    files.push({ name: 'admin-config.js', data: enc.encode('window.ADMIN_CONFIG = ' + JSON.stringify(deployConfig, null, 2) + ';') });

    // 4. Render 정적 사이트 블루프린트 설정 (render.yaml)
    const adminServiceName = deployConfig.repo ? (deployConfig.repo.endsWith('-admin') ? deployConfig.repo : deployConfig.repo + '-admin') : 'hometeo-admin';
    const renderYaml = [
      '# 홈터 관리자 화면을 Render 정적 사이트(Static Site)로 올리는 설정',
      'services:',
      '  - type: web',
      '    name: ' + adminServiceName,
      '    runtime: static',
      '    buildCommand: ""',
      '    staticPublishPath: ./',
      '    headers:',
      '      - path: /*',
      '        name: X-Content-Type-Options',
      '        value: nosniff',
      ''
    ].join('\n');
    files.push({ name: 'render.yaml', data: enc.encode(renderYaml) });

    // 5. 휴대폰 홈 화면에 앱처럼 (아이콘 · 이름)
    const color = /^#[0-9a-f]{6}$/i.test(raw.iconColor || '') ? raw.iconColor : '#3A3631';
    for (const size of [192, 512]) {
      const png = await iconPng(deployConfig.siteName, color, size);
      if (png) files.push({ name: `icon-${size}.png`, data: png });
    }
    const manifest = {
      name: deployConfig.siteName + ' 관리자',
      short_name: (deployConfig.siteName + ' 관리').slice(0, 12),
      start_url: './',
      scope: './',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: color,
      icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
    };
    files.push({ name: 'manifest.webmanifest', data: enc.encode(JSON.stringify(manifest, null, 2)) });

    // 6. 안내 문서
    files.push({ name: '안내.txt', data: enc.encode('\uFEFF' + adminGuide(deployConfig)) });

    return files;
  }

  window.HometeoAdminTemplate = {
    ADMIN_FILES,
    CORE_FILES,
    makeAdminFiles
  };
})();
