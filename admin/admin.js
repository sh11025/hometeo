/*
 * 홈터 · 관리자 화면 동작 (admin.js)
 * ------------------------------------------------------------
 * 열쇠(Web Crypto 암호화) · 반영하기(Atomic Git Data API) · 지난 모습(미리보기 & 되돌리기)
 * 목록형 화면: 홈터에서 고른 배치도(site.admin.ui)대로 메뉴 · 첫 화면 카드 · 페이지별 고칠 칸을 그려요
 */
(function () {
  'use strict';

  const BLOCKS = window.HOMETEO_BLOCKS || {};
  const BUILD = window.HometeoBuild || {};
  const THEME = window.HometeoTheme || {};
  const EXPORT = window.HometeoExport || {};
  const FOLLOW_NAME = window.HOMETEO_FOLLOW_NAME || null;
  const history = window.HometeoHistory ? window.HometeoHistory(50) : null;

  // =========================================================
  // 1. IndexedDB 스토리지 (대용량 사진 및 드래프트, 볼트 보관)
  // =========================================================
  const AdminStorage = (function () {
    const DB_NAME = 'hometeo_admin_db';
    const DB_VER = 1;
    let dbPromise = null;

    function open() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('no-indexeddb')); return; }
        const req = indexedDB.open(DB_NAME, DB_VER);
        req.onupgradeneeded = (e) => {
          const db = req.result;
          if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts');
          if (!db.objectStoreNames.contains('vault')) db.createObjectStore('vault');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return dbPromise;
    }

    async function run(storeName, mode, fn) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const req = fn(tx.objectStore(storeName));
        tx.oncomplete = () => resolve(req && req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    }

    return {
      saveDraft: (key, data) => run('drafts', 'readwrite', (s) => s.put(data, key)),
      loadDraft: (key) => run('drafts', 'readonly', (s) => s.get(key)),
      clearDraft: (key) => run('drafts', 'readwrite', (s) => s.delete(key)),
      saveVault: (data) => run('vault', 'readwrite', (s) => s.put(data, 'main_key')),
      loadVault: () => run('vault', 'readonly', (s) => s.get('main_key')),
      clearVault: () => run('vault', 'readwrite', (s) => s.delete('main_key'))
    };
  })();

  // =========================================================
  // 2. Web Crypto 암호화 보관소 (열쇠는 비밀번호로만 풀림)
  // =========================================================
  const AdminVault = (function () {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    function bufToHex(buf) {
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    function hexToBuf(hex) {
      const arr = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) arr[i / 2] = parseInt(hex.substr(i, 2), 16);
      return arr.buffer;
    }

    async function deriveKey(pin, saltBytes) {
      const baseKey = await crypto.subtle.importKey(
        'raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']
      );
      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 100000,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    async function encryptToken(token, pin) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(pin, salt);
      const cipher = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, enc.encode(token)
      );
      return {
        salt: bufToHex(salt),
        iv: bufToHex(iv),
        cipher: bufToHex(cipher)
      };
    }

    async function decryptToken(vaultData, pin) {
      const salt = hexToBuf(vaultData.salt);
      const iv = hexToBuf(vaultData.iv);
      const cipher = hexToBuf(vaultData.cipher);
      const key = await deriveKey(pin, new Uint8Array(salt));
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) }, key, cipher
      );
      return dec.decode(plain);
    }

    return { encryptToken, decryptToken };
  })();

  // =========================================================
  // 3. GitHub API 서비스 (원자적 커밋 발행 및 대용량 불러오기)
  // =========================================================
  let GitHubService = (function () {
    async function request(path, opts = {}) {
      const token = state.sessionToken;
      const headers = Object.assign({
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, opts.headers || {});
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`https://api.github.com${path}`, Object.assign({}, opts, { headers }));
      if (!res.ok) {
        const err = new Error(`HTTP_${res.status}`);
        err.status = res.status;
        try { err.body = await res.json(); } catch (e) {}
        throw err;
      }
      return await res.json();
    }

    return {
      request,
      // 1. 열쇠 유효성 및 푸시 권한 검사 (보관함에 기록을 남기지 않고 권한 메타데이터만 조회)
      verifyToken: async (owner, repo) => {
        try {
          const data = await request(`/repos/${owner}/${repo}`);
          if (!data) return { ok: false, push: false };
          const canPush = Boolean(data.permissions && data.permissions.push === true);
          return { ok: true, push: canPush };
        } catch (e) {
          // 인터넷 끊김 등 응답 상태 번호(e.status)가 없는 오류는 다시 던져 네트워크 오류로 처리
          if (!e || typeof e.status !== 'number') {
            throw e;
          }
          return { ok: false, push: false, status: e.status };
        }
      },
      // 2. 가지의 최신 커밋 번호 및 트리 번호 조회
      getLatestCommit: async (owner, repo, branch) => {
        const data = await request(`/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`);
        return {
          sha: data.sha,
          treeSha: data.commit.tree.sha,
          message: data.commit.message,
          date: data.commit.author ? data.commit.author.date : '',
          author: data.commit.author ? data.commit.author.name : ''
        };
      },
      // 3. 특정 커밋 시점의 project.hometeo 내용 읽기 (Contents API -> 대용량 Git Blob API fallback)
      fetchProjectFile: async (owner, repo, commitSha) => {
        const token = state.sessionToken;
        const rawHeaders = { 'Accept': 'application/vnd.github.raw' };
        if (token) rawHeaders['Authorization'] = `Bearer ${token}`;

        // 1차 시도: Contents API raw (1MB 이하 파일)
        try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/project.hometeo?ref=${encodeURIComponent(commitSha)}`, {
            headers: rawHeaders
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {}

        // 2차 시도: Commit Tree -> Git Blob API (1MB 초과 대용량 파일도 100MB까지 안전하게 읽기)
        try {
          const commitData = await request(`/repos/${owner}/${repo}/commits/${encodeURIComponent(commitSha)}`);
          const treeSha = commitData.commit.tree.sha;
          const treeData = await request(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(treeSha)}`);
          const fileEntry = (treeData.tree || []).find((t) => t.path === 'project.hometeo');
          if (fileEntry && fileEntry.sha) {
            const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${fileEntry.sha}`, {
              headers: rawHeaders
            });
            if (blobRes.ok) {
              return await blobRes.json();
            }
          }
        } catch (e) {}

        // 3차 시도: 공개 보관함 raw fallback
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/project.hometeo`;
        const resFallback = await fetch(rawUrl);
        if (resFallback.ok) {
          return await resFallback.json();
        }

        const err = new Error('PROJECT_FILE_NOT_FOUND');
        err.status = 404;
        throw err;
      },
      // 4. 최근 30개 커밋 목록 조회
      getCommitHistory: async (owner, repo, branch) => {
        const list = await request(`/repos/${owner}/${repo}/commits?path=project.hometeo&sha=${encodeURIComponent(branch)}&per_page=30`);
        return (list || []).map((item) => ({
          sha: item.sha,
          date: item.commit.author ? item.commit.author.date : '',
          author: item.commit.author ? item.commit.author.name : '알 수 없음',
          message: item.commit.message || ''
        }));
      },
      // 5. 사이트에 원자적(Atomic) 반영하기
      publish: async ({ owner, repo, branch, expectedParentSha, commitMessage, filesToCreate, filesToDelete }) => {
        // (1) 동시 수정 체크: 최신 커밋 sha 재확인
        const curHead = await GitHubService.getLatestCommit(owner, repo, branch);
        if (curHead.sha !== expectedParentSha) {
          throw new Error('CONFLICT_DETECTED');
        }

        // (2) 파일마다 Blob 생성
        const treeItems = [];
        for (const f of filesToCreate) {
          let contentBase64;
          if (typeof f.data === 'string') {
            contentBase64 = btoa(unescape(encodeURIComponent(f.data)));
          } else {
            let binary = '';
            const bytes = f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data);
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            contentBase64 = btoa(binary);
          }

          const blob = await request(`/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            body: JSON.stringify({ content: contentBase64, encoding: 'base64' })
          });
          treeItems.push({
            path: f.name,
            mode: '100644',
            type: 'blob',
            sha: blob.sha
          });
        }

        // (3) 삭제할 파일 트리 항목 추가 (sha: null)
        for (const delPath of filesToDelete) {
          treeItems.push({
            path: delPath,
            mode: '100644',
            type: 'blob',
            sha: null
          });
        }

        // (4) 새 Git Tree 생성
        const tree = await request(`/repos/${owner}/${repo}/git/trees`, {
          method: 'POST',
          body: JSON.stringify({ base_tree: curHead.treeSha, tree: treeItems })
        });

        // (5) 새 Commit 생성
        const newCommit = await request(`/repos/${owner}/${repo}/git/commits`, {
          method: 'POST',
          body: JSON.stringify({
            message: commitMessage,
            parents: [curHead.sha],
            tree: tree.sha
          })
        });

        // (6) 가지 참조(Ref) 업데이트
        await request(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
          method: 'PATCH',
          body: JSON.stringify({ sha: newCommit.sha, force: false })
        });

        return newCommit.sha;
      }
    };
  })();


  // =========================================================
  // 4. 상태 관리
  // =========================================================
  const UI = window.HometeoAdminUI;
  const IS_PREVIEW = /[?&]preview(=|&|$)/.test(location.search);

  const state = {
    config: null,
    project: null,
    originalProject: null,  // 직전 불러온 원본 (변경 요약용)
    lastCommitSha: null,    // 불러온 시점의 커밋 sha (동시 수정 감지용)
    lastCommit: null,       // { date, author, message } 마지막 반영 정보
    recentCommits: null,    // 최근 기록 (첫 화면 카드)
    sessionToken: null,     // 메모리에만 임시 보관되는 열쇠 (절대 파일/로그에 쓰지 않음)
    hasVault: false,        // 이 기기에 잠가 둔 열쇠가 있는지
    authorName: localStorage.getItem('hometeo_author_name') || '',
    view: 'home',           // home · page · info
    pageId: null,
    ui: null,               // 관리자 화면 배치도 (site.admin.ui 정리본)
    dirty: false,
    historyPreviewMode: false,
    previewMode: IS_PREVIEW // 홈터의 '관리자 화면 미리보기'로 연 화면
  };

  // ---------- 화면 요소 ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    app: $('admin-app'),
    appName: $('site-name'),
    tabs: $('adm-tabs'),
    nav: $('adm-nav'),
    navScrim: $('nav-scrim'),
    btnNavOpen: $('btn-nav-open'),
    main: $('adm-main'),
    view: $('adm-view'),
    btnAuth: $('btn-auth'),
    btnHelp: $('btn-help'),
    btnVisit: $('btn-visit'),
    previewBanner: $('preview-mode-banner'),
    testBanner: $('test-mode-banner'),
    btnReopenTest: $('btn-reopen-test'),
    historyBanner: $('history-preview-banner'),
    historyBannerText: $('history-banner-text'),
    btnRollbackApply: $('btn-rollback-apply'),
    btnRollbackCancel: $('btn-rollback-cancel'),
    btnUndo: $('btn-undo'),
    btnRedo: $('btn-redo'),
    btnPublish: $('btn-publish'),
    saveStatus: $('save-status'),
    whereModal: $('where-modal'),
    whereTitle: $('where-title'),
    whereHelp: $('where-help'),
    whereFrame: $('where-frame'),
    authModal: $('auth-modal'),
    authSetupView: $('auth-setup-view'),
    authUnlockView: $('auth-unlock-view'),
    authTokenInput: $('auth-token-input'),
    authPinInput: $('auth-pin-input'),
    authPinConfirm: $('auth-pin-confirm'),
    authSetupError: $('auth-setup-error'),
    btnAuthSkip: $('btn-auth-skip'),
    btnAuthSave: $('btn-auth-save'),
    authUnlockInput: $('auth-unlock-input'),
    authUnlockError: $('auth-unlock-error'),
    btnAuthReset: $('btn-auth-reset'),
    btnAuthUnlock: $('btn-auth-unlock'),
    publishModal: $('publish-modal'),
    publishDiffList: $('publish-diff-list'),
    publishAuthorInput: $('publish-author-input'),
    publishErrorMsg: $('publish-error-msg'),
    publishChecks: $('publish-checks'),
    publishChecksBox: $('publish-checks-box'),
    publishNameInput: $('publish-name-input'),
    btnPublishConfirm: $('btn-publish-confirm'),
    publishSuccessModal: $('publish-success-modal'),
    btnSuccessVisit: $('btn-success-visit'),
    btnSuccessClose: $('btn-success-close'),
    historyModal: $('history-modal'),
    historyLoading: $('history-loading'),
    historyItems: $('history-items'),
    helpModal: $('help-modal'),
    btnHelpResetAuth: $('btn-help-reset-auth'),
    loadingOverlay: $('loading-overlay'),
    errorOverlay: $('error-overlay'),
    errorTitle: $('error-title'),
    errorDesc: $('error-desc'),
    btnRetry: $('btn-retry'),
    btnOpenFileTest: $('btn-open-file-test'),
    toast: $('admin-toast'),
    fileInputHometeo: $('file-input-hometeo'),
    fileInputImage: $('file-input-image'),
    fileInputVideo: $('file-input-video')
  };

  let imagePickerCallback = null;
  let videoPickerCallback = null;
  let toastTimer = null;

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('is-show'), 2800);
  }

  function getDraftKey() {
    const cfg = state.config || {};
    return `${cfg.owner || 'local'}_${cfg.repo || 'site'}`;
  }

  async function saveDraft() {
    if (!state.project || state.historyPreviewMode) return;
    state.dirty = true;
    if (state.previewMode) {   // 미리보기에서는 저장하지 않아요
      if (els.saveStatus) els.saveStatus.textContent = '미리보기 · 저장 안 됨';
      return;
    }
    try {
      await AdminStorage.saveDraft(getDraftKey(), state.project);
      if (els.saveStatus) els.saveStatus.textContent = '이 기기에 임시 저장됨';
    } catch (e) {
      showToast('임시 저장 용량이 부족하여 브라우저에 저장하지 못했어요.');
    }
  }

  async function clearDraft() {
    try { await AdminStorage.clearDraft(getDraftKey()); } catch (e) {}
    state.dirty = false;
  }

  // 처음 할 일 진행 상황 (이 기기에만)
  const progressKey = () => 'hometeo_admin_progress_' + getDraftKey();
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(progressKey()) || '{}') || {}; } catch (e) { return {}; }
  }
  function setProgress(fn) {
    if (state.previewMode) return;
    const p = getProgress();
    fn(p);
    try { localStorage.setItem(progressKey(), JSON.stringify(p)); } catch (e) {}
  }

  const newId = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const site = () => (state.project && state.project.site) || null;
  const blockName = (type) => UI.blockName(type);
  const pageName = (pid) => {
    if (pid === 'shared') return '모든 페이지';
    const pg = site() && site().pages.find((p) => p.id === pid);
    return pg ? pg.name : '';
  };
  const ICON = {
    up: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 14 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 10 6 6 6-6"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    page: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    history: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>'
  };

  // =========================================================
  // 5. 불러오기 (최신 커밋 sha 기반 로드 & 인증 연동)
  // =========================================================
  async function loadProjectWithAuth() {
    const cfg = state.config || {};
    els.loadingOverlay.hidden = false;
    els.errorOverlay.hidden = true;

    // 1. 열쇠 볼트 확인
    const vault = await AdminStorage.loadVault().catch(() => null);
    state.hasVault = !!vault;
    if (vault && !state.sessionToken) {
      els.loadingOverlay.hidden = true;
      openAuthUnlockModal();
      return;
    }

    if (!vault && !state.sessionToken && cfg.owner && cfg.repo && !cfg.testMode) {
      els.loadingOverlay.hidden = true;
      openAuthSetupModal();
      return;
    }

    // 2. 보관함 정보가 없거나 시험 모드인 경우
    if (!cfg.owner || !cfg.repo) {
      // 홈터 폴더 안에서 연 관리자 화면이면, 홈터에서 지금 만들고 있는 내용으로 보여줘요
      const live = await readHometeoSave();
      if (live) { startLiveMode(live); return; }
      els.loadingOverlay.hidden = true;
      if (cfg.testMode) {
        els.errorDesc.textContent = '설정된 GitHub 보관함 정보가 없어요. 시험 모드로 작업 파일(.hometeo)을 직접 열어보세요.';
      } else {
        els.errorDesc.textContent = '관리자 화면 설정이 아직 끝나지 않았어요. 만든 사람에게 보관함 이름을 확인해 달라고 해 주세요.';
      }
      els.errorOverlay.hidden = false;
      return;
    }

    // 3. GitHub에서 브랜치의 최신 커밋 sha 가져오기
    const branch = cfg.branch || 'main';
    try {
      const latest = await GitHubService.getLatestCommit(cfg.owner, cfg.repo, branch);
      state.lastCommitSha = latest.sha;
      state.lastCommit = { date: latest.date || '', author: latest.author || '', message: latest.message || '' };

      // 4. 해당 sha 시점의 project.hometeo 내용 가져오기
      const data = await GitHubService.fetchProjectFile(cfg.owner, cfg.repo, latest.sha);
      await initProjectData(data);
    } catch (err) {
      els.loadingOverlay.hidden = true;
      let msg = '보관함에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.';
      if (err.status === 401 || err.status === 403) {
        msg = '열쇠가 맞지 않거나 사용 기간이 끝났어요. 만든 사람에게 새 열쇠를 받아 주세요.';
      } else if (err.status === 404) {
        msg = `‘${cfg.owner}/${cfg.repo}’ 보관함을 찾을 수 없거나 project.hometeo 파일이 없어요.`;
      }
      els.errorDesc.textContent = msg;
      els.errorOverlay.hidden = false;
    }
  }

  async function initProjectData(data, opts) {
    const o = opts || {};
    if (!data || !data.site || !Array.isArray(data.site.pages) || !data.site.pages.length) {
      showToast('올바른 홈터 작업 파일이 아니에요.');
      return;
    }
    if (!data.assets || typeof data.assets !== 'object') data.assets = {};

    state.originalProject = JSON.parse(JSON.stringify(data));

    // 이전에 고치던 임시 저장본(IndexedDB) 복원 확인 (미리보기에서는 안 해요)
    if (!state.previewMode) {
      const draft = await AdminStorage.loadDraft(getDraftKey()).catch(() => null);
      if (draft && draft.site && draft.savedAt && draft.savedAt > (data.savedAt || '')) {
        if (confirm('이전에 고치다가 아직 사이트에 반영하지 않은 내용이 있어요. 이어서 고칠까요?')) {
          data = draft;
          state.dirty = true;
        } else {
          await clearDraft();
        }
      }
    }

    state.project = data;
    state.ui = UI.normUI(data.site.admin && data.site.admin.ui);
    const pages = data.site.pages;
    if (!o.keepView || !pages.some((p) => p.id === state.pageId)) {
      state.pageId = (data.site.home && pages.find((p) => p.id === data.site.home)) ? data.site.home : pages[0].id;
    }
    if (!o.keepView) state.view = 'home';
    if (state.view === 'info' && !menuOn('info')) state.view = 'home';

    if (history) {
      history.clear && history.clear();
      history.record(state.project, '초기 상태');
    }

    els.loadingOverlay.hidden = true;
    els.errorOverlay.hidden = true;

    applyTheme();
    updateHeaderInfo();
    renderShell();
    renderView();
    loadRecentCommits();

    if (els.saveStatus) {
      els.saveStatus.textContent = state.previewMode ? '미리보기' : (state.dirty ? '이 기기에 임시 저장됨' : '불러오기 완료');
    }
  }

  function updateHeaderInfo() {
    const s = site();
    const name = s ? BUILD.siteName(s) : (state.config && state.config.siteName) || '내 홈페이지';
    if (els.appName) els.appName.textContent = name;
    document.title = name + ' · 관리자 화면';

    const url = (state.config && state.config.siteUrl) || '';
    if (els.btnVisit) {
      els.btnVisit.hidden = !url;
      if (url) els.btnVisit.href = url;
    }
  }

  // =========================================================
  // 6. 홈페이지 테마 따라가기 (색 · 글꼴)
  // =========================================================
  const FALLBACK = { nav: '#2B2A28', navInk: '#FFFFFF', accent: '#E8833A', accentInk: '#2B2A28', soft: '#F6F3EE' };
  function applyTheme() {
    const s = site();
    if (!s || !THEME.normalize) return;
    if (THEME.setCustom) THEME.setCustom(s.fonts || []);
    const x = THEME.normalize(s.theme);
    const vars = {};
    String(THEME.vars(s.theme)).split(';').forEach((kv) => { const i = kv.indexOf(':'); if (i > 0) vars[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); });
    const navInk = THEME.inkOn(x.dark);
    const accentInk = THEME.inkOn(x.point);
    // 글자가 잘 안 보이는 조합이면 관리자 화면만 기본 색으로
    const navOk = THEME.contrast(x.dark, navInk) >= 4.5;
    const accentOk = THEME.contrast(x.point, accentInk) >= 3 && THEME.contrast(x.point, '#FFFFFF') >= 1.6;
    const softOk = vars['--c-soft'] && THEME.contrast(vars['--c-soft'], '#2B2A28') >= 7;
    const root = document.documentElement.style;
    root.setProperty('--a-nav', navOk ? x.dark : FALLBACK.nav);
    root.setProperty('--a-nav-ink', navOk ? navInk : FALLBACK.navInk);
    root.setProperty('--a-accent', accentOk ? x.point : FALLBACK.accent);
    root.setProperty('--a-accent-ink', accentOk ? accentInk : FALLBACK.accentInk);
    root.setProperty('--a-soft', softOk ? vars['--c-soft'] : FALLBACK.soft);
    root.setProperty('--a-font', vars['--font-body'] || "'Pretendard', sans-serif");
    root.setProperty('--a-font-head', vars['--font-head'] || vars['--font-body'] || "'Pretendard', sans-serif");
    els.app.classList.toggle('theme-fallback', !navOk || !accentOk);

    // 글꼴 파일 불러오기 (목록 글꼴 · 내 글꼴)
    const urls = THEME.fontUrls ? THEME.fontUrls(s.theme) : [];
    document.querySelectorAll('link[data-ht-font]').forEach((l) => { if (!urls.includes(l.href)) l.remove(); });
    urls.forEach((u) => {
      if ([...document.querySelectorAll('link[data-ht-font]')].some((l) => l.href === u)) return;
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = u; l.setAttribute('data-ht-font', '1');
      document.head.appendChild(l);
    });
    let st = $('ht-admin-fonts');
    if (!st) { st = document.createElement('style'); st.id = 'ht-admin-fonts'; document.head.appendChild(st); }
    st.textContent = THEME.fontFaceCss ? THEME.fontFaceCss(s.fonts || [], (f) => (state.project.assets || {})[f.asset] || '') : '';
  }

  // =========================================================
  // 7. 틀: 배치 · 메뉴
  // =========================================================
  const menuOn = (id) => {
    const m = state.ui && state.ui.menu.find((k) => k.id === id);
    return !!m && !m.hidden;
  };
  function isActive(go) {
    if (go === 'home') return state.view === 'home';
    if (go === 'info') return state.view === 'info';
    if (go.startsWith('page:')) return state.view === 'page' && state.pageId === go.slice(5);
    return false;
  }
  const NAV_ICON = { home: ICON.home, info: ICON.info, history: ICON.history };
  // flat: 페이지를 묶음 이름 없이 나란히 (위쪽 탭 · 한 줄형)
  function navHtml(flat) {
    const s = site();
    if (!s || !state.ui) return '';
    return state.ui.menu.filter((m) => !m.hidden).map((m) => {
      const name = escapeHtml(UI.menuLabel(m));
      if (m.id === 'pages') {
        const items = s.pages.map((pg) => {
          const go = 'page:' + pg.id;
          return `<button class="nav-item nav-sub${isActive(go) ? ' is-on' : ''}" type="button" data-go="${go}">${flat ? '' : ICON.page}<span>${escapeHtml(pg.name)}</span></button>`;
        }).join('');
        return flat ? items : `<div class="nav-group"><div class="nav-group-label">${name}</div>${items}</div>`;
      }
      const go = m.id;
      return `<button class="nav-item${isActive(go) ? ' is-on' : ''}" type="button" data-go="${go}">${flat ? '' : (NAV_ICON[m.id] || '')}<span>${name}</span></button>`;
    }).join('');
  }
  function renderShell() {
    const layout = (state.ui && state.ui.layout) || 'side';
    els.app.classList.remove('layout-side', 'layout-top', 'layout-simple');
    els.app.classList.add('layout-' + layout);
    // 서랍(휴대폰)과 왼쪽 메뉴는 묶음 모양, 위쪽 탭 · 한 줄형은 나란히
    els.nav.innerHTML = `<div class="nav-inner">${navHtml(false)}</div>`;
    els.tabs.innerHTML = layout === 'top' ? navHtml(true) : '';
    if (layout === 'simple') els.nav.setAttribute('data-flat', '1'); else els.nav.removeAttribute('data-flat');
    if (layout === 'simple') els.nav.innerHTML = `<div class="nav-inner">${navHtml(true)}</div>`;
  }
  function openNav(on) {
    els.app.classList.toggle('nav-open', on);
    els.navScrim.hidden = !on;
    if (els.btnNavOpen) els.btnNavOpen.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on && els.app.classList.contains('layout-simple')) els.nav.innerHTML = `<div class="nav-inner">${navHtml(false)}</div>`;
    if (!on && els.app.classList.contains('layout-simple')) els.nav.innerHTML = `<div class="nav-inner">${navHtml(true)}</div>`;
  }
  function go(target) {
    openNav(false);
    if (target === 'history') { openHistoryModal(); return; }
    if (target === 'home') state.view = 'home';
    else if (target === 'info') state.view = 'info';
    else if (target.startsWith('page:')) { state.view = 'page'; state.pageId = target.slice(5); }
    renderShell();
    renderView();
    if (els.main) els.main.scrollTop = 0;
  }

  // =========================================================
  // 8. 내용 화면
  // =========================================================
  function renderView(keepScroll) {
    if (!state.project) return;
    const top = els.main ? els.main.scrollTop : 0;
    let html = '';
    if (state.view === 'page') html = pageViewHtml(state.pageId);
    else if (state.view === 'info') html = infoViewHtml();
    else html = dashboardHtml();
    els.view.innerHTML = html;
    els.view.classList.toggle('is-locked', state.historyPreviewMode);
    if (state.historyPreviewMode) els.view.querySelectorAll('input, textarea, select, button[data-act]:not([data-act="where"]):not([data-act="preview"])').forEach((x) => { x.disabled = true; });
    if (keepScroll && els.main) els.main.scrollTop = top;
    fitPreviewCards();
    updateUndoRedoButtons();
  }

  // ---------- 칸 그리기 ----------
  //   bid: 블록 번호, path: props 안의 경로 ('title', 'items.2.q', 'biz.phone')
  function fieldHtml(type, bid, path, f, value) {
    const id = 'f-' + bid + '-' + path.replace(/[^\w-]/g, '_');
    const lab = `<label class="fld-label" for="${id}">${escapeHtml(f.label)}</label>`;
    const data = `data-bid="${escapeHtml(bid)}" data-path="${escapeHtml(path)}"`;
    if (f.kind === 'image') {
      const src = (value && state.project.assets[value]) || '';
      return `<div class="fld fld-photo">${lab.replace('<label', '<span').replace('</label>', '</span>').replace(/ for="[^"]*"/, '')}
        <div class="photo-edit-row">
          <div class="photo-thumb">${src ? `<img src="${src}" alt="">` : '<span>사진 없음</span>'}</div>
          <div class="photo-btns">
            <button class="btn btn-sm" type="button" data-act="pick-image" ${data}>사진 바꾸기</button>
            ${value ? `<button class="btn btn-sm btn-ghost" type="button" data-act="clear" ${data}>빼기</button>` : ''}
          </div>
        </div></div>`;
    }
    if (f.kind === 'video') {
      return `<div class="fld"><span class="fld-label">${escapeHtml(f.label)}</span>
        <div class="photo-edit-row">
          <span class="fld-note">${value ? '영상 파일이 들어 있어요' : '영상 파일 없음'}</span>
          <button class="btn btn-sm" type="button" data-act="pick-video" ${data}>영상 바꾸기</button>
          ${value ? `<button class="btn btn-sm btn-ghost" type="button" data-act="clear" ${data}>빼기</button>` : ''}
        </div></div>`;
    }
    if (f.kind === 'file') {
      const fname = UI.getPath((blockById(bid) || {}).props || {}, path.replace(/file$/, 'fname'));
      return `<div class="fld"><span class="fld-label">${escapeHtml(f.label)}</span>
        <div class="photo-edit-row">
          <span class="fld-note">${value ? '📎 ' + escapeHtml(fname || '파일') : '파일 없음'}</span>
          <button class="btn btn-sm" type="button" data-act="pick-file" ${data}>${value ? '파일 바꾸기' : '파일 넣기'}</button>
          ${value ? `<button class="btn btn-sm btn-ghost" type="button" data-act="clear-file" ${data}>빼기</button>` : ''}
        </div><p class="fld-note">PDF · 한글 · 워드 · 엑셀 파일 (10MB까지)</p></div>`;
    }
    if (f.kind === 'stars') {
      const n = Math.max(0, Math.min(5, Number(value) || 0));
      return `<div class="fld">${lab}<select id="${id}" class="input" ${data} data-num="1">${[5, 4, 3, 2, 1, 0].map((v) => `<option value="${v}"${v === n ? ' selected' : ''}>${v ? '★'.repeat(v) + ' (' + v + ')' : '안 보이기'}</option>`).join('')}</select></div>`;
    }
    if (f.kind === 'link') {
      return `<div class="fld">${lab}${linkInputHtml(id, bid, path, value)}</div>`;
    }
    if (f.kind === 'date') {
      const note = /posted$/.test(path) ? '며칠 안 된 글엔 N 표시가 저절로 붙어요.' : (type === 'jobs' ? '이 날이 지나면 저절로 ‘마감’으로 바뀌어요.' : '비워 두면 늘 보여요. 마지막 날이 지나면 저절로 사라져요.');
      return `<div class="fld">${lab}<input id="${id}" class="input" type="date" ${data} value="${escapeHtml(value || '')}"><p class="fld-note">${note}</p></div>`;
    }
    if (f.kind === 'long') {
      return `<div class="fld">${lab}<textarea id="${id}" class="textarea" rows="3" ${data}>${escapeHtml(value || '')}</textarea></div>`;
    }
    return `<div class="fld">${lab}<input id="${id}" class="input" type="text" ${data} value="${escapeHtml(value == null ? '' : value)}"></div>`;
  }

  function linkInputHtml(id, bid, path, val) {
    const s = String(val || '').trim();
    const pages = site().pages || [];
    const pm = /^page:([^#]*)/.exec(s);
    const isPage = !!pm;
    const data = `data-bid="${escapeHtml(bid)}" data-path="${escapeHtml(path)}"`;
    return `<div class="link-edit-row">
        <select class="input" data-link-mode="1" ${data} aria-label="어디로 갈지">
          <option value="page"${isPage ? ' selected' : ''}>이 홈페이지의 페이지</option>
          <option value="direct"${!isPage ? ' selected' : ''}>직접 적기 (주소·전화)</option>
        </select>
        ${isPage
          ? `<select id="${id}" class="input" ${data}>${pages.map((p) => `<option value="page:${p.id}"${p.id === pm[1] ? ' selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}</select>`
          : `<input id="${id}" type="text" class="input" ${data} value="${escapeHtml(val || '')}" placeholder="예: https://… 또는 010-0000-0000">`}
      </div>`;
  }

  // 목록 (항목마다 접고 펴기 · 더하기 · 빼기 · 순서)
  function itemSummary(item, list) {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return '';
    const f = list.fields.find((x) => (x.kind === 'text' || x.kind === 'long') && item[x.key]);
    return f ? String(item[f.key]) : '';
  }
  function listHtml(type, bid, basePath, list, arr, depth) {
    const items = Array.isArray(arr) ? arr : [];
    const path = basePath + list.key;                 // 'columns.0.links'
    const data = `data-bid="${escapeHtml(bid)}" data-path="${escapeHtml(path)}" data-pattern="${escapeHtml(list.pattern)}"`;
    const rows = items.map((item, i) => {
      const ip = path + '.' + i;
      const isObj = item && typeof item === 'object' && !Array.isArray(item) && !depth && ['main', 'banner'].includes((BLOCKS[type] || {}).zone);
      const canSold = isObj && (BLOCKS[type] || {}).zone === 'main' && ('title' in item || 'name' in item) && !['board', 'files', 'steps', 'timeline', 'hours', 'faq', 'stats'].includes(type);
      const flags = isObj ? `<span class="li-flags">
          ${canSold ? `<button class="li-flag${item._sold ? ' is-on sold' : ''}" type="button" data-act="item-flag" ${data} data-i="${i}" data-flag="_sold" title="품절 표시">품절</button>` : ''}
          <button class="li-flag${item._hide ? ' is-on' : ''}" type="button" data-act="item-flag" ${data} data-i="${i}" data-flag="_hide" title="지우지 않고 손님 화면에서만 잠시 감춰요">${item._hide ? '숨김' : '보임'}</button>
        </span>` : '';
      const tools = list.canEdit ? `<span class="li-tools">
          <button class="icon-btn sm" type="button" data-act="list-move" ${data} data-i="${i}" data-dir="-1" title="위로" aria-label="위로"${i === 0 ? ' disabled' : ''}>${ICON.up}</button>
          <button class="icon-btn sm" type="button" data-act="list-move" ${data} data-i="${i}" data-dir="1" title="아래로" aria-label="아래로"${i === items.length - 1 ? ' disabled' : ''}>${ICON.down}</button>
          <button class="icon-btn sm danger" type="button" data-act="list-del" ${data} data-i="${i}" title="빼기" aria-label="빼기">${ICON.trash}</button>
        </span>` : '';
      if (list.strings) {
        const f = { kind: list.kind === 'long' ? 'long' : 'text', label: `${list.word} ${i + 1}` };
        return `<div class="li li-str">${fieldHtml(type, bid, ip, f, item)}${tools}</div>`;
      }
      const sum = itemSummary(item, list);
      const inner = list.fields.map((f) => fieldHtml(type, bid, ip + '.' + f.key, f, item ? UI.getPath(item, f.key) : '')).join('')
        + list.lists.map((sub) => listHtml(type, bid, ip + '.', sub, item ? item[sub.key] : [], depth + 1)).join('');
      return `<details class="li"${items.length <= 2 ? ' open' : ''}>
          <summary${isObj && item._hide ? ' class="is-hidden"' : ''}><span class="li-num">${i + 1}</span><span class="li-sum">${escapeHtml(sum || list.word + ' ' + (i + 1))}</span>${flags}${tools}</summary>
          <div class="li-body">${inner}</div>
        </details>`;
    }).join('');
    return `<div class="lst${depth ? ' is-sub' : ''}">
        <div class="lst-head"><span>${escapeHtml(list.label)} <small>${items.length}개</small></span>
          ${list.canEdit ? `<button class="btn btn-sm" type="button" data-act="list-add" ${data}>${ICON.plus}${escapeHtml(list.word)} 더하기</button>` : ''}
        </div>
        ${rows || '<p class="fld-note">아직 없어요.</p>'}
      </div>`;
  }

  // 블록 하나의 고칠 칸 전부
  function blockFieldsHtml(b) {
    const t = UI.fieldsOf(b.type, BLOCKS);
    const p = b.props || {};
    return t.fields.map((f) => fieldHtml(b.type, b.id, f.key, f, UI.getPath(p, f.key))).join('')
      + t.lists.map((l) => listHtml(b.type, b.id, '', l, p[l.key], 0)).join('');
  }

  // 잠시 숨기기는 본문 · 메인 배너 · 공지 띠 블록만 (메뉴 · 맨 아래는 늘 있어야 해요)
  function canOff(b) { const z = (BLOCKS[b.type] || {}).zone; return z === 'main' || z === 'banner' || b.type === 'notice'; }

  // ---------- 페이지 화면 ----------
  function pageBlocks(pid) {
    const s = site();
    const pg = s.pages.find((p) => p.id === pid) || s.pages[0];
    return BUILD.tidy([...(s.shared || []), ...(pg.blocks || [])]);
  }
  function pageViewHtml(pid) {
    const s = site();
    const pg = s.pages.find((p) => p.id === pid) || s.pages[0];
    const shared = new Set((s.shared || []).map((b) => b.id));
    const cards = pageBlocks(pg.id).filter((b) => UI.hasFields(b.type, BLOCKS)).map((b) => `
      <section class="blk-card${b.props._off ? ' is-off' : ''}" id="card-${escapeHtml(b.id)}">
        <div class="blk-head">
          <div><h3>${escapeHtml(blockName(b.type))}</h3>${shared.has(b.id) ? '<small class="blk-shared">모든 페이지에 함께 보여요</small>' : ''}</div>
          <span class="blk-head-btns">
            ${canOff(b) ? `<button class="btn btn-sm${b.props._off ? ' is-on' : ''}" type="button" data-act="block-off" data-bid="${escapeHtml(b.id)}" title="지우지 않고 손님 화면에서만 잠시 감춰요">${b.props._off ? '다시 보이기' : '잠시 숨기기'}</button>` : ''}
            <button class="btn btn-sm btn-ghost" type="button" data-act="where" data-bid="${escapeHtml(b.id)}" data-page="${escapeHtml(pg.id)}">${ICON.eye}어디에 보이나요?</button>
          </span>
        </div>
        ${b.props._off ? '<p class="blk-off-note">지금 손님 화면에서 감춰 둔 블록이에요.</p>' : ''}
        <div class="blk-body">${blockFieldsHtml(b)}</div>
      </section>`).join('');
    return `
      <div class="view-head">
        <div><h2>${escapeHtml(pg.name)}</h2><p>고칠 수 있는 칸만 차례대로 보여요. 칸에 적고 다른 곳을 누르면 저장돼요.</p></div>
        <button class="btn" type="button" data-act="preview" data-page="${escapeHtml(pg.id)}">${ICON.eye}홈페이지 미리보기</button>
      </div>
      ${cards ? `<div class="blk-cards">${cards}</div>` : '<div class="empty-card">이 페이지에는 고칠 수 있는 칸이 없어요. 모양과 배치는 만든 사람에게 부탁해 주세요.</div>'}`;
  }

  // ---------- 사이트 정보 화면 ----------
  function infoViewHtml() {
    const s = site();
    const inf = s.info || {};
    const photo = (key, title, help) => {
      const src = (inf[key] && state.project.assets[inf[key]]) || '';
      return `<div class="fld fld-photo"><span class="fld-label">${title} <small>${help}</small></span>
        <div class="photo-edit-row">
          <div class="photo-thumb${key === 'icon' ? ' is-round' : ''}">${src ? `<img src="${src}" alt="">` : '<span>없음</span>'}</div>
          <div class="photo-btns">
            <button class="btn btn-sm" type="button" data-act="pick-info" data-key="${key}">바꾸기</button>
            ${inf[key] ? `<button class="btn btn-sm btn-ghost" type="button" data-act="clear-info" data-key="${key}">빼기</button>` : ''}
          </div>
        </div></div>`;
    };
    return `
      <div class="view-head"><div><h2>${escapeHtml(UI.menuLabel(state.ui.menu.find((m) => m.id === 'info')))}</h2><p>검색 결과 · 카톡 공유 · 브라우저 탭에 보이는 정보예요.</p></div></div>
      <div class="blk-cards">
      <section class="blk-card"><div class="blk-body">
        <div class="fld"><label class="fld-label" for="info-name">사이트 이름 <small>(브라우저 탭 · 검색 결과 맨 위)</small></label>
          <input id="info-name" class="input" type="text" data-info="name" value="${escapeHtml(UI.currentName(s) || inf.name || '')}" placeholder="${escapeHtml(BUILD.siteName(s))}"></div>
        <div class="fld"><label class="fld-label" for="info-desc">한 줄 소개 <small>(검색 결과 · 카톡 공유에 보이는 글)</small></label>
          <textarea id="info-desc" class="textarea" rows="2" data-info="desc">${escapeHtml(inf.desc || '')}</textarea></div>
        ${photo('shareImage', '카톡 공유 사진', '(링크를 보낼 때 나오는 대표 사진)')}
        ${photo('icon', '작은 아이콘', '(브라우저 탭에 작게 보여요)')}
      </div></section>
      <section class="blk-card"><div class="blk-head"><div><h3>카톡으로 보내면 이렇게 보여요</h3></div></div>
        <div class="blk-body">
          <div class="share-card">
            ${inf.shareImage && state.project.assets[inf.shareImage] ? `<img src="${state.project.assets[inf.shareImage]}" alt="">` : '<div class="share-noimg">공유 사진 없음</div>'}
            <div class="share-body"><b>${escapeHtml(inf.name || BUILD.siteName(s))}</b><small>${escapeHtml(inf.desc || '한 줄 소개가 비어 있어요')}</small><i>${escapeHtml(String(state.config.siteUrl || inf.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '홈페이지 주소')}</i></div>
          </div>
          ${(() => { const w = UI.shareChecks(s, { siteUrl: state.config.siteUrl }); return w.length ? `<ul class="share-warn">${w.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : '<p class="fld-note">카톡 · 문자로 보내도 잘 보여요.</p>'; })()}
        </div></section>
      <section class="blk-card"><div class="blk-head"><div><h3>QR 코드</h3><small class="blk-shared">테이블 · 전단지 · 명함에 붙여요</small></div></div>
        <div class="blk-body">${(() => {
          const url = String(state.config.siteUrl || inf.url || '').trim();
          const src = url ? UI.qrImage(url, inf.name || BUILD.siteName(s)) : '';
          return src ? `<img class="qr-preview" src="${src}" alt="홈페이지 QR 코드"><div class="fld"><button class="btn" type="button" data-act="qr-save">QR 그림 내려받기</button></div><p class="fld-note">휴대폰 카메라로 비추면 홈페이지가 열려요. 인쇄 전에 꼭 한 번 찍어 보세요.</p>`
            : '<p class="fld-note">홈페이지 주소가 정해지면 여기서 QR 코드를 만들 수 있어요. 만든 사람에게 주소를 넣어 달라고 부탁해 주세요.</p>';
        })()}</div></section>
      <section class="blk-card"><div class="blk-head"><div><h3>글자 한 번에 바꾸기</h3><small class="blk-shared">고칠 수 있는 칸에서만 찾아 바꿔요</small></div></div>
        <div class="blk-body">
          <div class="fld"><label class="fld-label" for="rep-find">찾을 글</label><input id="rep-find" class="input" type="text" placeholder="예: 아메리카노"></div>
          <div class="fld"><label class="fld-label" for="rep-to">바꿀 글</label><input id="rep-to" class="input" type="text" placeholder="예: 오늘의 커피"></div>
          <div class="fld"><button class="btn btn-primary" type="button" data-act="replace-all">모든 페이지에서 바꾸기</button></div>
        </div></section>
      <section class="blk-card"><div class="blk-head"><div><h3>페이지마다 설명</h3><small class="blk-shared">비워 두면 한 줄 소개를 써요</small></div></div>
        <div class="blk-body">${s.pages.map((pg) => `<div class="fld"><label class="fld-label" for="pd-${escapeHtml(pg.id)}">${escapeHtml(pg.name)}</label>
          <input id="pd-${escapeHtml(pg.id)}" class="input" type="text" data-page-desc="${escapeHtml(pg.id)}" value="${escapeHtml(pg.desc || '')}"></div>`).join('')}</div>
      </section></div>`;
  }

  // ---------- 첫 화면 ----------
  function dashboardHtml() {
    const s = site();
    const cards = state.ui.cards.filter((c) => c.on).map((c) => {
      const fn = CARD_HTML[c.type];
      const body = fn ? fn() : '';
      if (body == null) return '';
      const def = UI.CARDS.find((k) => k.type === c.type) || {};
      return `<section class="dash-card card-${c.type}${def.wide ? ' is-wide' : ''}">${body}</section>`;
    }).join('');
    return `
      <div class="view-head"><div><h2>${escapeHtml(BUILD.siteName(s))}</h2><p>안녕하세요! 오늘 고칠 곳을 골라 보세요.</p></div></div>
      ${appTipHtml()}
      <div class="dash-grid">${cards || '<div class="empty-card">보여줄 카드가 없어요.</div>'}</div>`;
  }
  // 휴대폰 홈 화면에 추가하기 안내 (휴대폰에서 · 아직 앱처럼 열지 않았을 때만 · 닫으면 다시 안 보여요)
  let installEvent = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; if (state.view === 'home') renderView(true); });
  function appTipHtml() {
    let closed = false;
    try { closed = localStorage.getItem('hometeo-admin-apptip') === '1'; } catch (e) { /* 괜찮아요 */ }
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
    const phone = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (closed || standalone || !phone || state.previewMode) return '';
    const ios = /iPhone|iPad/i.test(navigator.userAgent);
    return `<div class="app-tip"><b>📱 휴대폰 홈 화면에 놓아 두세요</b><br>
      ${installEvent ? '<button class="btn btn-sm btn-primary" type="button" data-act="app-install">홈 화면에 추가</button>'
        : ios ? '사파리 아래쪽 <b>공유 버튼(□↑)</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 바로 열려요.' : '크롬 오른쪽 위 <b>⋮</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 바로 열려요.'}
      <button class="btn btn-sm btn-ghost" type="button" data-act="app-tip-close">닫기</button></div>`;
  }

  function todoItems() {
    const pr = getProgress();
    const base = UI.TODO_BASE.map((t) => ({
      id: t.id, label: t.label, custom: false,
      done: t.id === 'key' ? (state.hasVault || !!state.sessionToken) : !!pr[t.id]
    }));
    const custom = (state.ui.todo || []).map((t, i) => ({ id: 'c' + i, label: t.label, custom: true, done: !!(pr.custom && pr.custom[i]) }));
    return base.concat(custom);
  }
  const CARD_HTML = {
    biz() {
      const v = UI.bizValues(site());
      return `<div class="card-head"><h3>가게 기본 정보</h3><span class="card-meta">한 번 고치면 전체가 바뀌어요</span></div>
        <div class="biz-grid">${UI.BIZ_FIELDS.map((f) => {
          const sync = f.key === 'company' && UI.companySynced(site(), BUILD.siteName(site()));
          return `<div class="fld"><label class="fld-label" for="biz-${f.key}">${escapeHtml(f.label)}</label>
          <input id="biz-${f.key}" class="input" type="text" data-biz="${f.key}" value="${escapeHtml(sync ? BUILD.siteName(site()) : v[f.key])}" placeholder="${escapeHtml(f.ph)}"${sync ? ' disabled' : ''}>
          ${f.key === 'company' ? `<label class="fld-check"><input type="checkbox" data-biz-sync ${sync ? 'checked' : ''}> 사이트 이름과 같이 쓰기</label>` : ''}</div>`;
        }).join('')}</div>
        <p class="card-note">예: 전화번호를 바꾸면 버튼 · 맨 아래 정보 · 지도 · 퀵메뉴의 예전 번호가 모두 새 번호로 바뀌어요.</p>`;
    },
    todo() {
      if (getProgress().todoHidden && !state.previewMode) return null;
      const items = todoItems();
      const n = items.filter((x) => x.done).length;
      const pct = Math.round((n / items.length) * 100);
      return `<div class="card-head"><h3>처음 할 일</h3><span class="card-meta">${n}/${items.length} 완료</span></div>
        <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
        <ul class="todo-list">${items.map((x) => `<li><button class="todo-item${x.done ? ' is-done' : ''}" type="button" data-act="todo" data-todo="${x.id}">
          <span class="todo-check">${x.done ? ICON.check : ''}</span><span>${escapeHtml(x.label)}</span></button></li>`).join('')}</ul>
        ${n === items.length ? '<p class="card-note">다 했어요! 이제 편하게 고치고 반영하면 돼요. 🎉</p>' : ''}
        <button class="link-btn" type="button" data-act="todo-hide">이 카드 숨기기</button>`;
    },
    quick() {
      const s = site();
      const rows = (state.ui.quick || []).map((q) => {
        const r = UI.resolveQuick(s, q, BLOCKS);
        if (!r) return '';
        const where = `${escapeHtml(pageName(r.pageId))} · ${escapeHtml(blockName(r.block.type))}`;
        const inner = r.field
          ? fieldHtml(r.block.type, r.block.id, r.field.key, r.field, UI.getPath(r.block.props || {}, r.field.key))
          : listHtml(r.block.type, r.block.id, '', r.list, (r.block.props || {})[r.list.key], 0);
        return `<div class="quick-row"><div class="quick-where">${where}
          <button class="link-btn" type="button" data-act="where" data-bid="${escapeHtml(r.block.id)}" data-page="${escapeHtml(r.pageId === 'shared' ? s.home : r.pageId)}">어디에 보이나요?</button></div>${inner}</div>`;
      }).filter(Boolean).join('');
      return `<div class="card-head"><h3>자주 고치는 곳</h3></div>
        ${rows || `<p class="card-note">${state.previewMode ? '홈터의 ‘관리자 화면 꾸미기’에서 자주 고치는 칸을 골라 담으면 여기 보여요.' : '아직 골라 둔 칸이 없어요. 메뉴에서 페이지를 골라 고쳐 주세요.'}</p>`}`;
    },
    status() {
      let last = '';
      if (state.previewMode) last = '<p class="card-note">미리보기라서 반영 기록은 보이지 않아요.</p>';
      else {
        const lc = state.lastCommit;
        const c = (lc && lc.date) ? lc : ((state.recentCommits && state.recentCommits[0]) || lc || null);
        const date = c && c.date ? new Date(c.date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
        const who = c && (c.author || (/^홈페이지 수정 · ([^·]+) ·/.exec(c.message || '') || [])[1] || '');
        last = c ? `<div class="stat-row"><span>마지막 반영</span><b>${escapeHtml(date || '기록 있음')}${who ? ' · ' + escapeHtml(String(who).trim()) : ''}</b></div>` : '<div class="stat-row"><span>마지막 반영</span><b>아직 없어요</b></div>';
      }
      const diffs = state.dirty ? computeDiffSummary(state.originalProject, state.project) : [];
      return `<div class="card-head"><h3>지금 상태</h3></div>${last}
        <div class="stat-row"><span>반영 안 한 고친 곳</span><b class="${state.dirty ? 'is-warn' : ''}">${state.dirty ? diffs.length + '가지' : '없어요'}</b></div>
        ${state.dirty ? `<ul class="mini-list">${diffs.slice(0, 3).map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
          <button class="btn btn-primary btn-sm" type="button" data-act="publish">지금 반영하기</button>` : '<p class="card-note">고친 내용이 모두 홈페이지에 반영돼 있어요.</p>'}`;
    },
    pages() {
      const s = site();
      return `<div class="card-head"><h3>페이지 바로가기</h3></div>
        <div class="page-links">${s.pages.map((pg) => {
          const n = pageBlocks(pg.id).filter((b) => UI.hasFields(b.type, BLOCKS)).length;
          return `<button class="page-link" type="button" data-go="page:${escapeHtml(pg.id)}">${ICON.page}<span>${escapeHtml(pg.name)}</span><small>고칠 곳 ${n}</small></button>`;
        }).join('')}</div>`;
    },
    history() {
      if (!menuOn('history') && !state.previewMode) {
        // 메뉴에서 숨겨도 카드는 보여요
      }
      let body;
      if (state.previewMode) body = '<p class="card-note">미리보기라서 기록이 없어요. 실제 관리자 화면에서는 최근 반영 5개가 보여요.</p>';
      else if (!state.recentCommits) body = '<p class="card-note">기록을 불러오는 중…</p>';
      else if (!state.recentCommits.length) body = '<p class="card-note">아직 기록이 없어요.</p>';
      else body = `<ul class="hist-list">${state.recentCommits.slice(0, 5).map((c) => {
        const d = c.date ? new Date(c.date).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
        return `<li><button type="button" data-act="hist" data-sha="${escapeHtml(c.sha)}" data-date="${escapeHtml(d)}"><b>${escapeHtml(c.author)}</b><span>${escapeHtml(d)}</span><small>${escapeHtml(c.message)}</small></button></li>`;
      }).join('')}</ul>`;
      return `<div class="card-head"><h3>최근 기록</h3>${state.previewMode ? '' : '<button class="link-btn" type="button" data-go="history">모두 보기</button>'}</div>${body}`;
    },
    memo() {
      const m = (state.ui.memo || '').trim();
      if (!m && !state.previewMode) return null;
      return `<div class="card-head"><h3>만든 사람 메모</h3></div>
        <div class="memo-text">${m ? escapeHtml(m).replace(/\n/g, '<br>') : '<span class="card-note">홈터의 ‘관리자 화면 꾸미기’에서 메모를 적으면 여기 보여요.</span>'}</div>`;
    },
    preview() {
      const s = site();
      return `<div class="card-head"><h3>홈페이지 미리보기</h3><button class="link-btn" type="button" data-act="preview" data-page="${escapeHtml(s.home)}">크게 보기</button></div>
        <button class="mini-frame" type="button" data-act="preview" data-page="${escapeHtml(s.home)}" aria-label="홈페이지 크게 보기"><iframe tabindex="-1" title="홈페이지 작게 보기" data-mini-preview="1"></iframe></button>`;
    }
  };

  // 최근 기록 (첫 화면 카드)
  async function loadRecentCommits() {
    if (state.previewMode) return;
    const cfg = state.config || {};
    if (!cfg.owner || !cfg.repo) { state.recentCommits = []; return; }
    try {
      state.recentCommits = await GitHubService.getCommitHistory(cfg.owner, cfg.repo, cfg.branch || 'main');
    } catch (e) {
      state.recentCommits = [];
    }
    if (state.view === 'home') renderView(true);
  }

  // =========================================================
  // 9. 홈페이지 미리보기 (어디에 보이나요?)
  // =========================================================
  function builtPages(highlightId, pageId) {
    const s = site();
    if (THEME.setCustom) THEME.setCustom(s.fonts || []);
    const pages = BUILD.buildSitePages({ site: s, assets: state.project.assets });
    // 미리보기 안에서는 양식 보내기를 막아요
    const guard = '<script>document.addEventListener("submit",function(e){e.preventDefault()},true);</' + 'script>';
    return pages.map((p) => {
      let html = p.html.replace('</body>', guard + '</body>');
      if (highlightId && p.id === pageId) {
        const sel = '#b-' + String(highlightId).replace(/[^\w-]/g, '');
        html = html.replace('</head>', '<style>' + sel + '{outline:4px solid #E8833A;outline-offset:-4px}</style></head>')
          .replace('</body>', '<script>window.addEventListener("load",function(){var t=document.querySelector(' + JSON.stringify(sel) + ');if(t)t.scrollIntoView({block:"center"})});</' + 'script></body>');
      }
      return { id: p.id, file: p.file, name: p.name, html };
    });
  }
  function openWhere(pageId, blockId) {
    const s = site();
    const pid = s.pages.some((p) => p.id === pageId) ? pageId : s.home;
    const pages = builtPages(blockId, pid);
    const cur = pages.find((p) => p.id === pid) || pages[0];
    els.whereTitle.textContent = blockId ? `어디에 보이나요? · ${pageName(pid)}` : '홈페이지 미리보기';
    els.whereHelp.hidden = !blockId;
    els.whereFrame.srcdoc = EXPORT.buildPreviewHtml({ pages, current: cur.file, title: BUILD.siteName(s), device: window.innerWidth < 760 ? 'phone' : 'pc' });
    els.whereModal.hidden = false;
  }
  function closeWhere() {
    els.whereModal.hidden = true;
    els.whereFrame.srcdoc = '';
  }
  // 첫 화면의 작은 미리보기
  function fitPreviewCards() {
    const frames = els.view.querySelectorAll('iframe[data-mini-preview]');
    if (!frames.length) return;
    const s = site();
    const home = builtPages(null).find((p) => p.id === s.home);
    frames.forEach((f) => {
      f.srcdoc = home ? home.html : '';
      const box = f.parentElement;
      const scale = Math.max(0.15, (box.clientWidth || 600) / 1280);
      f.style.transform = `scale(${scale})`;
      box.style.height = Math.round(820 * scale) + 'px';
    });
  }

  // =========================================================
  // 10. 고치기
  // =========================================================
  function blockById(bid) {
    const hit = UI.findBlock(site(), bid);
    return hit ? hit.block : null;
  }

  function change(desc, mutateFn) {
    if (history) history.record(state.project, desc);
    mutateFn();
    if (state.project && state.project.site) UI.ensureCompany(state.project.site, BLOCKS);
    saveDraft();
    setProgress((p) => { p.edit = true; });
    updateUndoRedoButtons();
  }

  // 칸 하나 바꾸기 (rerender: 사진 · 목록처럼 화면이 바뀌어야 할 때만 다시 그려요)
  function mutateField(bid, path, value, rerender) {
    const b = blockById(bid);
    if (!b) return;
    const oldLogo = (b.type === 'header' && path === 'logo') ? b.props.logo : null;
    change('내용 고치기', () => {
      UI.setPath(b.props, path, value);
      if (b.type === 'header' && path === 'logo' && typeof FOLLOW_NAME === 'function' && oldLogo != null) {
        FOLLOW_NAME(state.project.site, oldLogo, value);
      }
    });
    if (b.type === 'header' && path === 'logo') updateHeaderInfo();
    if (rerender) renderView(true);
    else refreshSideCards();
  }

  // 첫 화면의 '지금 상태' 같은 카드만 새로
  function refreshSideCards() {
    if (state.view !== 'home') return;
    const st = els.view.querySelector('.card-status');
    if (st) st.innerHTML = CARD_HTML.status();
    const td = els.view.querySelector('.card-todo');
    if (td) { const h = CARD_HTML.todo(); if (h != null) td.innerHTML = h; }
  }

  function newListItem(b, pattern, arr) {
    const def = BLOCKS[b.type] || {};
    const make = def.newItem && def.newItem[pattern];
    if (make) return make();
    const sample = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : '';
    if (typeof sample === 'string' || sample == null) return '';
    // 같은 모양으로 비운 새 항목
    const blank = (v) => (typeof v === 'string' ? '' : Array.isArray(v) ? [] : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) : (typeof v === 'boolean' ? v : null));
    return blank(JSON.parse(JSON.stringify(sample)));
  }
  function listAction(act, d) {
    const b = blockById(d.bid);
    if (!b) return;
    const def = BLOCKS[b.type] || {};
    const path = d.path;
    let arr = UI.getPath(b.props, path);
    if (!Array.isArray(arr)) { if (act !== 'list-add') return; UI.setPath(b.props, path, []); arr = UI.getPath(b.props, path); }
    const after = (op) => { if (def.afterList) def.afterList(b.props, path, op); };
    if (act === 'list-add') {
      const item = newListItem(b, d.pattern, arr);
      change('목록에 하나 더하기', () => { const l = UI.getPath(b.props, path); if (def.addAt === 'top' && !path.includes('.')) l.unshift(item); else l.push(item); after({ action: 'add' }); });
    } else if (act === 'list-del') {
      const i = Number(d.i);
      if (!confirm('이 항목을 뺄까요? (되돌리기로 다시 살릴 수 있어요)')) return;
      change('목록에서 빼기', () => { UI.getPath(b.props, path).splice(i, 1); after({ action: 'remove', i }); });
    } else if (act === 'item-flag') {
      const it = arr[Number(d.i)];
      if (!it || typeof it !== 'object') return;
      const on = !it[d.flag];
      change(d.flag === '_sold' ? (on ? '품절 표시' : '품절 표시 빼기') : (on ? '잠시 숨기기' : '다시 보이기'), () => { if (on) it[d.flag] = true; else delete it[d.flag]; });
      showToast(d.flag === '_sold' ? (on ? '품절로 표시했어요.' : '품절 표시를 뺐어요.') : (on ? '손님 화면에서 감췄어요. 지운 건 아니에요.' : '다시 보이게 했어요.'));
    } else if (act === 'list-move') {
      const i = Number(d.i), j = i + Number(d.dir);
      if (j < 0 || j >= arr.length) return;
      change('목록 순서 바꾸기', () => { const l = UI.getPath(b.props, path); const [it] = l.splice(i, 1); l.splice(j, 0, it); after({ action: 'move', i, j }); });
    }
    renderView(true);
  }

  function undo() {
    if (!history || !history.canUndo()) return;
    const step = history.undo(state.project);
    if (step && step.state) {
      state.project = step.state;
      saveDraft();
      updateHeaderInfo();
      renderView(true);
    }
  }

  function redo() {
    if (!history || !history.canRedo()) return;
    const step = history.redo(state.project);
    if (step && step.state) {
      state.project = step.state;
      saveDraft();
      updateHeaderInfo();
      renderView(true);
    }
  }

  function updateUndoRedoButtons() {
    if (els.btnUndo) els.btnUndo.disabled = !(history && history.canUndo());
    if (els.btnRedo) els.btnRedo.disabled = !(history && history.canRedo());
  }

  // =========================================================
  // 8. 바뀐 것 요약 계산 (Diff Summary)
  // =========================================================
  function computeDiffSummary(orig, cur) {
    if (!orig || !cur) return ['새로운 홈페이지 내용'];
    const diffs = [];
    const oSite = orig.site || {}, cSite = cur.site || {};
    const oInfo = oSite.info || {}, cInfo = cSite.info || {};

    // 1. 사이트 기본 정보
    if (oInfo.name !== cInfo.name && cInfo.name) diffs.push(`사이트 이름 변경 ('${cInfo.name}')`);
    if (oInfo.desc !== cInfo.desc && cInfo.desc) diffs.push('사이트 소개 글 수정');
    if (oInfo.shareImage !== cInfo.shareImage) diffs.push('카톡 공유 사진 변경');
    if (oInfo.icon !== cInfo.icon) diffs.push('파비콘 아이콘 변경');

    // 2. 페이지별 비교
    const oPages = oSite.pages || [], cPages = cSite.pages || [];
    if (oPages.length !== cPages.length) {
      diffs.push(`페이지 수 변경 (${oPages.length}개 → ${cPages.length}개)`);
    }

    // 3. 블록별 내용 비교
    let photoChanges = 0, textChanges = 0, listChanges = 0;
    const allOBlocks = [...(oSite.shared || []), ...oPages.flatMap((p) => p.blocks || [])];
    const allCBlocks = [...(cSite.shared || []), ...cPages.flatMap((p) => p.blocks || [])];

    allCBlocks.forEach((cb) => {
      const ob = allOBlocks.find((x) => x.id === cb.id);
      if (!ob) {
        diffs.push(`새 블록 추가 (${(BLOCKS[cb.type] && BLOCKS[cb.type].name) || cb.type})`);
        return;
      }
      const op = ob.props || {}, cp = cb.props || {};

      // 고칠 수 있는 칸 검사 (biz.phone 처럼 안쪽 칸도)
      const t = UI.fieldsOf(cb.type, BLOCKS);
      t.fields.forEach((f) => {
        if (UI.getPath(op, f.key) !== UI.getPath(cp, f.key)) {
          if (f.kind === 'image' || f.kind === 'video') photoChanges++;
          else textChanges++;
        }
      });
      t.lists.forEach((l) => {
        const ol = Array.isArray(op[l.key]) ? op[l.key] : [], cl = Array.isArray(cp[l.key]) ? cp[l.key] : [];
        if (ol.length !== cl.length) listChanges += Math.abs(cl.length - ol.length);
        else if (JSON.stringify(ol) !== JSON.stringify(cl)) textChanges++;
      });
    });

    if (photoChanges > 0) diffs.push(`사진 ${photoChanges}장 변경`);
    if (listChanges > 0) diffs.push(`목록 항목 ${listChanges}개 추가/삭제`);
    if (textChanges > 0) diffs.push(`글 내용 ${textChanges}곳 수정`);

    return diffs.length ? diffs : ['세부 내용 수정'];
  }

  // =========================================================
  // 9. 사이트에 반영하기 실행
  // =========================================================
  async function openPublishModal() {
    if (!state.project) return;
    if (blockedInPreview('사이트에 반영할')) return;
    if (state.historyPreviewMode) { showToast('지난 모습을 보는 중이에요. ‘이 모습으로 되돌리기’를 누르거나 미리보기를 닫아 주세요.'); return; }

    // 실제 모드에서는 열쇠 없이 반영 불가 (가짜 반영 차단)
    const isTestMode = Boolean(state.config && state.config.testMode === true);
    if (!state.sessionToken && !isTestMode) {
      const vault = await AdminStorage.loadVault();
      if (vault) {
        openAuthUnlockModal();
      } else {
        openAuthSetupModal();
      }
      showToast('사이트에 반영하려면 먼저 관리자 열쇠를 넣어 주세요.');
      return;
    }

    const cut = (t) => { t = String(t || ''); return t.length > 40 ? t.slice(0, 40) + '…' : t; };
    const detail = state.originalProject ? UI.diffSites(state.originalProject.site, state.project.site, BLOCKS) : [];
    if (detail.length) {
      els.publishDiffList.innerHTML = detail.slice(0, 14).map((d) => `<li class="diff-row"><small>${escapeHtml(d.where)} · ${escapeHtml(d.label)}</small>
        ${d.media ? '<span>사진 · 파일이 바뀌었어요</span>' : `<span>${d.before ? `<s>${escapeHtml(cut(d.before))}</s> → ` : ''}<b>${d.after ? escapeHtml(cut(d.after)) : '(지움)'}</b></span>`}</li>`).join('')
        + (detail.length > 14 ? `<li class="diff-more">그 밖에 ${detail.length - 14}곳</li>` : '');
    } else {
      els.publishDiffList.innerHTML = computeDiffSummary(state.originalProject, state.project).map((d) => `<li>${escapeHtml(d)}</li>`).join('');
    }
    // 반영 전 점검: 견본 글 · 빈 전화번호 (그 칸으로 바로 가서 고쳐요)
    const checks = [];
    const bz = UI.bizValues(site());
    if (!bz.phone) checks.push(`<li><span>가게 전화번호가 비어 있어요</span><button class="btn btn-sm" type="button" data-act="go-biz">고치러 가기</button></li>`);
    UI.findSamples(site(), BLOCKS, true).slice(0, 6).forEach((x) => {
      checks.push(`<li><span>견본 글 같아요: “${escapeHtml(x.text)}” <small>(${escapeHtml(pageName(x.pageId))} · ${escapeHtml(blockName(x.type))})</small></span><button class="btn btn-sm" type="button" data-act="go-field" data-page="${escapeHtml(x.pageId)}" data-bid="${escapeHtml(x.blockId)}" data-path="${escapeHtml(x.path)}">고치러 가기</button></li>`);
    });
    els.publishChecks.innerHTML = checks.join('');
    els.publishChecksBox.hidden = !checks.length;
    els.publishNameInput.value = '';
    els.publishAuthorInput.value = state.authorName || '';
    els.publishErrorMsg.hidden = true;
    els.publishModal.hidden = false;
  }

  async function executePublish() {
    const author = els.publishAuthorInput.value.trim() || '관리자';
    state.authorName = author;
    localStorage.setItem('hometeo_author_name', author);

    const diffs = computeDiffSummary(state.originalProject, state.project);
    const summaryText = diffs.slice(0, 3).join(', ');
    const label = (els.publishNameInput.value || '').trim().slice(0, 40);
    const commitMessage = `${label ? '[' + label + '] ' : ''}홈페이지 수정 · ${author} · ${summaryText}`;

    els.btnPublishConfirm.disabled = true;
    els.btnPublishConfirm.textContent = '반영 중…';
    els.publishErrorMsg.hidden = true;

    try {
      const cfg = state.config || {};
      const owner = cfg.owner || 'local-owner';
      const repo = cfg.repo || 'local-repo';
      const branch = cfg.branch || 'main';

      // 1. 빌드 준비 및 내 글꼴 활성화
      if (window.HometeoTheme && window.HometeoTheme.setCustom) {
        window.HometeoTheme.setCustom(state.project.site.fonts || []);
      }

      const enc = new TextEncoder();
      const filesToCreate = [];

      // 공통 모듈로 에셋(사진·영상·내 글꼴) 파일 및 경로 생성 (홈터 내려받기와 100% 동일)
      const currentAssetResult = BUILD.buildSiteAssetFiles(state.project.site, state.project.assets);
      currentAssetResult.files.forEach((f) => {
        filesToCreate.push({ name: f.name, data: f.data });
      });
      const paths = currentAssetResult.paths;

      // 2. HTML 페이지 빌드 (HometeoBuild 공통 모듈)
      const pages = BUILD.buildSitePages({
        site: state.project.site,
        assets: state.project.assets,
        assetFn: (id) => (id && paths[id]) || null
      });

      pages.forEach((pg) => {
        filesToCreate.push({ name: pg.file, data: pg.html });
      });

      // 3. CSS, JS 공통 스크립트
      if (EXPORT.siteCss) filesToCreate.push({ name: 'css/hometeo.css', data: EXPORT.siteCss() });
      if (EXPORT.siteScript) filesToCreate.push({ name: 'js/hometeo.js', data: EXPORT.siteScript() });

      // 4. project.hometeo 원본 JSON
      state.project.savedAt = new Date().toISOString();
      filesToCreate.push({
        name: 'project.hometeo',
        data: JSON.stringify(state.project, null, 2)
      });

      // 5. 삭제할 이전 파일 식별 (이전 반영 시 생성했던 실제 파일 중 이번에 안 쓰는 것만)
      const filesToDelete = [];
      if (state.originalProject && state.originalProject.site && state.originalProject.assets) {
        const origAssetResult = BUILD.buildSiteAssetFiles(state.originalProject.site, state.originalProject.assets);
        const currentCreatedNames = new Set(filesToCreate.map((f) => f.name));
        origAssetResult.files.forEach((oldF) => {
          if (!currentCreatedNames.has(oldF.name)) {
            filesToDelete.push(oldF.name);
          }
        });
      }

      // 6. GitHub 원자적 커밋 발행 실행
      const newSha = await GitHubService.publish({
        owner,
        repo,
        branch,
        expectedParentSha: state.lastCommitSha,
        commitMessage,
        filesToCreate,
        filesToDelete
      });

      // 7. 성공 처리
      state.lastCommitSha = newSha;
      state.lastCommit = { date: new Date().toISOString(), author, message: commitMessage };
      state.originalProject = JSON.parse(JSON.stringify(state.project));
      await clearDraft();
      setProgress((p) => { p.publish = true; });
      state.recentCommits = null;
      renderView(true);
      loadRecentCommits();

      els.publishModal.hidden = true;
      if (cfg.siteUrl && els.btnSuccessVisit) {
        els.btnSuccessVisit.href = cfg.siteUrl;
        els.btnSuccessVisit.hidden = false;
      }
      els.publishSuccessModal.hidden = false;
      if (els.saveStatus) els.saveStatus.textContent = '반영 완료';
    } catch (err) {
      if (err.message === 'CONFLICT_DETECTED') {
        els.publishErrorMsg.textContent = '그사이 다른 수정이 있어요. 지금 고친 내용은 이 기기에 남겨 둘게요. 새로 불러온 뒤 다시 고쳐 주세요.';
      } else if (err.status === 401 || err.status === 403) {
        els.publishErrorMsg.textContent = '열쇠 기간이 끝났거나 권한이 없어요. 만든 사람에게 새 열쇠를 받아 주세요.';
      } else {
        els.publishErrorMsg.textContent = '반영하는 도중 문제가 생겼어요. 인터넷 연결을 확인해 주세요.';
      }
      els.publishErrorMsg.hidden = false;
    } finally {
      els.btnPublishConfirm.disabled = false;
      els.btnPublishConfirm.textContent = '확인하고 지금 반영하기';
    }
  }

  // =========================================================
  // 10. 지난 모습 (히스토리 미리보기 및 되돌리기)
  // =========================================================
  async function openHistoryModal() {
    if (blockedInPreview('지난 모습을 볼')) return;
    els.historyLoading.hidden = false;
    els.historyItems.hidden = true;
    els.historyModal.hidden = false;

    const cfg = state.config || {};
    try {
      const commits = await GitHubService.getCommitHistory(cfg.owner, cfg.repo, cfg.branch || 'main');
      els.historyLoading.hidden = true;
      if (!commits.length) {
        els.historyItems.innerHTML = '<li style="padding:20px;text-align:center;color:#888">지난 기록이 없어요.</li>';
      } else {
        els.historyItems.innerHTML = commits.map((c) => {
          const dateStr = c.date ? new Date(c.date).toLocaleString('ko-KR') : '';
          return `
            <li>
              <button class="history-item-btn" type="button" data-sha="${c.sha}" data-date="${dateStr}" data-msg="${escapeHtml(c.message)}">
                <div class="history-meta">
                  <b>${escapeHtml(c.author)}</b>
                  <span>${dateStr}</span>
                </div>
                <div class="history-msg">${escapeHtml(c.message)}</div>
              </button>
            </li>
          `;
        }).join('');
      }
      els.historyItems.hidden = false;
    } catch (err) {
      els.historyLoading.textContent = '기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
  }

  async function previewHistoryCommit(sha, dateStr) {
    els.historyModal.hidden = true;
    showToast('지난 모습을 불러오는 중…');
    const cfg = state.config || {};

    try {
      const historicalData = await GitHubService.fetchProjectFile(cfg.owner, cfg.repo, sha);
      state.historyPreviewMode = true;
      state.previewBackupProject = JSON.parse(JSON.stringify(state.project));
      state.previewTargetData = historicalData;

      state.project = historicalData;
      if (!historicalData.site.pages.some((p) => p.id === state.pageId)) state.pageId = historicalData.site.home || historicalData.site.pages[0].id;

      els.historyBannerText.innerHTML = `📅 <b>지난 모습 미리보기:</b> ${dateStr} 기록을 둘러보는 중이에요.`;
      els.historyBanner.hidden = false;

      updateHeaderInfo();
      applyTheme();
      renderShell();
      renderView();
    } catch (err) {
      showToast('해당 시점의 기록을 열지 못했어요.');
    }
  }

  function exitHistoryPreview() {
    if (!state.historyPreviewMode) return;
    state.project = state.previewBackupProject;
    state.previewBackupProject = null;
    state.previewTargetData = null;
    state.historyPreviewMode = false;
    els.historyBanner.hidden = true;

    updateHeaderInfo();
    applyTheme();
    renderShell();
    renderView();
    showToast('원래 고치던 화면으로 돌아왔어요.');
  }

  async function applyHistoryRollback() {
    const isTestMode = Boolean(state.config && state.config.testMode === true);
    if (!state.sessionToken && !isTestMode) {
      const vault = await AdminStorage.loadVault();
      if (vault) openAuthUnlockModal(); else openAuthSetupModal();
      showToast('지난 모습으로 되돌리려면 먼저 관리자 열쇠를 넣어 주세요.');
      return;
    }

    if (!confirm('정말 이 지난 모습으로 사이트를 되돌릴까요?\n이전의 모든 페이지 내용으로 다시 만들어 반영돼요.')) return;
    const targetData = state.previewTargetData;
    state.historyPreviewMode = false;
    els.historyBanner.hidden = true;

    state.project = targetData;
    state.dirty = true;
    await saveDraft();
    applyTheme();
    renderShell();
    renderView();

    openPublishModal();
  }

  // =========================================================
  // 11. 인증 모달 (새 열쇠 등록 & 잠금 해제)
  // =========================================================
  function openAuthSetupModal() {
    els.authSetupView.hidden = false;
    els.authUnlockView.hidden = true;
    els.authTokenInput.value = '';
    els.authPinInput.value = '';
    els.authPinConfirm.value = '';
    els.authSetupError.hidden = true;
    els.authModal.hidden = false;
  }

  function openAuthUnlockModal() {
    els.authSetupView.hidden = true;
    els.authUnlockView.hidden = false;
    els.authUnlockInput.value = '';
    els.authUnlockError.hidden = true;
    els.authModal.hidden = false;
  }

  async function handleAuthSave() {
    const token = els.authTokenInput.value.trim();
    const pin = els.authPinInput.value.trim();
    const confirmPin = els.authPinConfirm.value.trim();

    if (!token) {
      els.authSetupError.textContent = '열쇠(토큰)를 입력해 주세요.';
      els.authSetupError.hidden = false;
      return;
    }
    if (pin.length < 4) {
      els.authSetupError.textContent = '비밀번호는 4자 이상이어야 해요.';
      els.authSetupError.hidden = false;
      return;
    }
    if (pin !== confirmPin) {
      els.authSetupError.textContent = '비밀번호 확인이 서로 일치하지 않아요.';
      els.authSetupError.hidden = false;
      return;
    }

    els.btnAuthSave.disabled = true;
    els.btnAuthSave.textContent = '열쇠 확인 중…';
    els.authSetupError.hidden = true;

    try {
      state.sessionToken = token;
      const cfg = state.config || {};

      // 열쇠 유효성 검사 (보관함에 시험 기록을 남기지 않고 권한 값만 확인)
      let check;
      try {
        check = await GitHubService.verifyToken(cfg.owner, cfg.repo);
      } catch (netErr) {
        state.sessionToken = null;
        els.authSetupError.textContent = '열쇠를 확인하지 못했어요. 인터넷 연결을 보고 다시 해 주세요.';
        els.authSetupError.hidden = false;
        return;
      }

      if (!check || !check.ok) {
        state.sessionToken = null;
        if (check && check.status === 401) {
          els.authSetupError.textContent = '열쇠가 맞지 않거나 기간이 끝났어요. 만든 사람에게 새 열쇠를 받아 주세요.';
        } else if (check && (check.status === 403 || check.status === 404)) {
          els.authSetupError.textContent = '이 열쇠로는 홈페이지 보관함을 열 수 없어요. 만든 사람에게 열쇠 권한과 보관함 이름을 확인해 달라고 해 주세요.';
        } else {
          els.authSetupError.textContent = '열쇠를 확인하지 못했어요. 다시 시도해 주세요.';
        }
        els.authSetupError.hidden = false;
        return;
      }

      if (check.ok && !check.push) {
        showToast('읽기는 확인됐어요. 쓰기는 처음 반영할 때 확인돼요.');
      }

      // Web Crypto로 암호화 후 볼트에 보관
      const vaultData = await AdminVault.encryptToken(token, pin);
      await AdminStorage.saveVault(vaultData);
      state.hasVault = true;

      els.authModal.hidden = true;
      showToast('관리자 열쇠를 안전하게 잠가 보관했어요.');

      try {
        await loadProjectWithAuth();
      } catch (loadErr) {
        showToast('내용을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.');
      }
    } catch (err) {
      state.sessionToken = null;
      els.authSetupError.textContent = '열쇠를 확인하지 못했어요. 인터넷 연결을 보고 다시 해 주세요.';
      els.authSetupError.hidden = false;
    } finally {
      els.btnAuthSave.disabled = false;
      els.btnAuthSave.textContent = '열쇠 확인 및 잠금';
    }
  }

  async function handleAuthUnlock() {
    const pin = els.authUnlockInput.value.trim();
    if (!pin) return;
    els.btnAuthUnlock.disabled = true;

    try {
      const vaultData = await AdminStorage.loadVault();
      if (!vaultData) throw new Error('NO_VAULT');
      const token = await AdminVault.decryptToken(vaultData, pin);
      state.sessionToken = token;

      els.authModal.hidden = true;
      showToast('관리자 화면이 열렸어요.');
      await loadProjectWithAuth();
    } catch (err) {
      els.authUnlockError.textContent = '비밀번호가 올바르지 않아요.';
      els.authUnlockError.hidden = false;
    } finally {
      els.btnAuthUnlock.disabled = false;
    }
  }

  async function handleAuthReset() {
    if (!confirm('이 기기에 저장된 열쇠를 지울까요?\n지운 뒤에는 만든 사람에게 받은 열쇠를 다시 넣어야 해요.')) return;
    await AdminStorage.clearVault();
    state.sessionToken = null;
    state.hasVault = false;
    openAuthSetupModal();
    showToast('이 기기에서 열쇠를 지웠어요.');
  }

  // =========================================================
  // 12. 사이트 정보
  // =========================================================
  function setInfo(label, fn) {
    change(label, () => {
      const s = site();
      if (!s.info) s.info = {};
      fn(s.info, s);
    });
    updateHeaderInfo();
  }

  function openImagePicker(cb) {
    imagePickerCallback = cb;
    if (els.fileInputImage) els.fileInputImage.click();
  }
  function openVideoPicker(cb) {
    videoPickerCallback = cb;
    if (els.fileInputVideo) els.fileInputVideo.click();
  }

  // 자료 파일 고르기 (PDF · 한글 · 워드 · 엑셀 …) — 줄이지 않고 그대로 담아요
  let docInput = null;
  function openDocPicker(cb) {
    if (!docInput) {
      docInput = document.createElement('input');
      docInput.type = 'file'; docInput.hidden = true;
      docInput.accept = '.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.png';
      document.body.appendChild(docInput);
    }
    docInput.onchange = () => {
      const file = docInput.files[0];
      docInput.value = '';
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { showToast('10MB보다 큰 파일은 넣을 수 없어요.'); return; }
      const r = new FileReader();
      r.onload = () => cb(r.result, file);
      r.readAsDataURL(file);
    };
    docInput.click();
  }

  function closePublish() { els.publishModal.hidden = true; }
  // 미리보기에서 막는 일
  function blockedInPreview(what) {
    if (!state.previewMode) return false;
    showToast(`미리보기에서는 ${what} 수 없어요. 실제 관리자 화면에서 할 수 있어요.`);
    return true;
  }

  // =========================================================
  // 13. 이벤트 연결
  // =========================================================
  function setupEvents() {
    // 메뉴 (왼쪽 · 위쪽 탭 · 서랍 · 카드 안 버튼)
    document.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go]');
      if (g && !g.disabled) {
        if (g.dataset.go === 'history' && blockedInPreview('지난 모습을 볼')) return;
        go(g.dataset.go);
      }
    });
    if (els.btnNavOpen) els.btnNavOpen.addEventListener('click', () => openNav(!els.app.classList.contains('nav-open')));
    if (els.navScrim) els.navScrim.addEventListener('click', () => openNav(false));

    // 지난 모습 목록
    if (els.historyModal) {
      els.historyModal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-history]') || e.target === els.historyModal) {
          els.historyModal.hidden = true;
        }
        const itemBtn = e.target.closest('[data-sha]');
        if (itemBtn) previewHistoryCommit(itemBtn.dataset.sha, itemBtn.dataset.date);
      });
    }
    if (els.btnRollbackApply) els.btnRollbackApply.addEventListener('click', applyHistoryRollback);
    if (els.btnRollbackCancel) els.btnRollbackCancel.addEventListener('click', exitHistoryPreview);

    // 도움말
    if (els.btnHelp) {
      els.btnHelp.addEventListener('click', () => {
        if (els.helpModal) els.helpModal.hidden = false;
        setProgress((p) => { p.help = true; });
        refreshSideCards();
      });
    }
    if (els.helpModal) {
      els.helpModal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-help]') || e.target === els.helpModal) els.helpModal.hidden = true;
      });
    }
    if (els.btnHelpResetAuth) {
      els.btnHelpResetAuth.addEventListener('click', async () => {
        if (blockedInPreview('열쇠를 지울')) return;
        if (els.helpModal) els.helpModal.hidden = true;
        await handleAuthReset();
      });
    }

    // 미리보기 창
    if (els.whereModal) {
      els.whereModal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-where]') || e.target === els.whereModal) closeWhere();
      });
    }

    // 되돌리기 / 다시하기
    if (els.btnUndo) els.btnUndo.addEventListener('click', undo);
    if (els.btnRedo) els.btnRedo.addEventListener('click', redo);
    window.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (e.key === 'Escape') {
        if (!els.whereModal.hidden) closeWhere();
        else if (els.app.classList.contains('nav-open')) openNav(false);
        return;
      }
      if (typing) return;   // 칸에 쓰는 중에는 브라우저 기본 되돌리기
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo(); else undo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
        e.preventDefault();
      }
    });

    // 사이트에 반영하기
    if (els.btnPublish) els.btnPublish.addEventListener('click', openPublishModal);
    if (els.publishModal) {
      els.publishModal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-publish]') || e.target === els.publishModal) { els.publishModal.hidden = true; return; }
        const a = e.target.closest('[data-act="go-field"], [data-act="go-biz"]');
        if (a) els.view.dispatchEvent(new CustomEvent('hometeo-act', { detail: a.dataset }));
      });
    }
    els.view.addEventListener('hometeo-act', (e) => {
      const fake = document.createElement('button');
      Object.assign(fake.dataset, e.detail);
      fake.hidden = true; els.view.appendChild(fake); fake.click(); fake.remove();
    });
    if (els.btnPublishConfirm) els.btnPublishConfirm.addEventListener('click', executePublish);
    if (els.btnSuccessClose) els.btnSuccessClose.addEventListener('click', () => { els.publishSuccessModal.hidden = true; });

    // 열쇠
    if (els.btnAuth) {
      els.btnAuth.addEventListener('click', async () => {
        if (blockedInPreview('열쇠를 넣을')) return;
        const vault = await AdminStorage.loadVault().catch(() => null);
        if (vault) openAuthUnlockModal(); else openAuthSetupModal();
      });
    }
    if (els.btnAuthSave) els.btnAuthSave.addEventListener('click', handleAuthSave);
    if (els.btnAuthUnlock) els.btnAuthUnlock.addEventListener('click', handleAuthUnlock);
    if (els.btnAuthReset) els.btnAuthReset.addEventListener('click', handleAuthReset);
    if (els.authUnlockInput) els.authUnlockInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuthUnlock(); });
    if (els.btnAuthSkip) els.btnAuthSkip.addEventListener('click', () => {
      els.authModal.hidden = true;
      state.config.testMode = true;
      loadProjectWithAuth();
    });

    // 내용 화면: 버튼
    els.view.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a || a.disabled) return;
      const d = a.dataset;
      switch (d.act) {
        case 'pick-image':
          openImagePicker((dataUrl) => {
            const id = newId('img');
            state.project.assets[id] = dataUrl;
            mutateField(d.bid, d.path, id, true);
          });
          break;
        case 'pick-video':
          openVideoPicker((dataUrl) => {
            const id = newId('video');
            state.project.assets[id] = dataUrl;
            mutateField(d.bid, d.path, id, true);
          });
          break;
        case 'clear': mutateField(d.bid, d.path, null, true); break;
        case 'pick-file': openDocPicker((dataUrl, file) => {
          const ext = (/\.([a-z0-9]{1,5})$/i.exec(file.name) || [, 'bin'])[1].toLowerCase();
          const id = newId('doc') + '.' + ext;
          state.project.assets[id] = dataUrl;
          const b = blockById(d.bid);
          if (!b) return;
          change('파일 넣기', () => { UI.setPath(b.props, d.path, id); UI.setPath(b.props, d.path.replace(/file$/, 'fname'), file.name); });
          renderView(true);
          showToast(`‘${file.name}’을 넣었어요.`);
        }); break;
        case 'clear-file': { const b = blockById(d.bid); if (b) { change('파일 빼기', () => { UI.setPath(b.props, d.path, null); UI.setPath(b.props, d.path.replace(/file$/, 'fname'), ''); }); renderView(true); } break; }
        case 'block-off': {
          const b = blockById(d.bid);
          if (!b) break;
          const on = !b.props._off;
          change(on ? '블록 잠시 숨기기' : '블록 다시 보이기', () => { if (on) b.props._off = true; else delete b.props._off; });
          renderView(true);
          showToast(on ? '손님 화면에서 감췄어요. 반영해야 홈페이지에 적용돼요.' : '다시 보이게 했어요. 반영해야 홈페이지에 적용돼요.');
          break;
        }
        case 'app-install': if (installEvent) { installEvent.prompt(); installEvent = null; } break;
        case 'app-tip-close': try { localStorage.setItem('hometeo-admin-apptip', '1'); } catch (err) { /* 괜찮아요 */ } renderView(true); break;
        case 'qr-save': {
          const img = els.view.querySelector('.qr-preview');
          if (img) { const a = document.createElement('a'); a.href = img.src; a.download = 'QR코드.png'; a.click(); showToast('QR 그림을 내려받았어요.'); }
          break;
        }
        case 'pick-info':
          openImagePicker((dataUrl) => {
            const id = newId(d.key === 'icon' ? 'icon-img' : 'share-img');
            state.project.assets[id] = dataUrl;
            setInfo(d.key === 'icon' ? '아이콘 바꾸기' : '공유 사진 바꾸기', (inf) => { inf[d.key] = id; });
            renderView(true);
          });
          break;
        case 'clear-info':
          setInfo('사진 빼기', (inf) => { inf[d.key] = null; });
          renderView(true);
          break;
        case 'list-add': case 'list-del': case 'list-move': case 'item-flag':
          e.preventDefault();   // 접힌 항목 제목 줄 안의 버튼이라 접힘이 바뀌지 않게
          listAction(d.act, d);
          break;
        case 'replace-all': {
          const find = (els.view.querySelector('#rep-find') || {}).value || '', to = (els.view.querySelector('#rep-to') || {}).value || '';
          if (find.trim().length < 2) { showToast('찾을 글을 두 글자 이상 적어 주세요.'); break; }
          let n = 0;
          change(`글자 바꾸기 · ${find} → ${to}`, () => { n = UI.replaceAll(site(), find, to, { BLOCKS, onlyEditable: true }); });
          showToast(n ? `${n}곳을 바꿨어요. 되돌리기로 돌아갈 수 있어요.` : '찾는 글이 없어요.');
          break;
        }
        case 'go-field': {
          closePublish();
          go('page:' + (d.page === 'shared' ? site().home : d.page));
          setTimeout(() => { const f = els.view.querySelector(`[data-bid="${CSS.escape(d.bid)}"][data-path="${CSS.escape(d.path)}"]`); if (f) { const li = f.closest('details'); if (li) li.open = true; f.scrollIntoView({ block: 'center' }); f.focus(); } }, 60);
          break;
        }
        case 'go-biz': closePublish(); go('home'); setTimeout(() => { const f = els.view.querySelector('[data-biz]'); if (f) { f.scrollIntoView({ block: 'center' }); f.focus(); } }, 60); break;
        case 'where': openWhere(d.page, d.bid); break;
        case 'preview': openWhere(d.page, null); break;
        case 'publish': openPublishModal(); break;
        case 'hist': previewHistoryCommit(d.sha, d.date); break;
        case 'todo': {
          const id = d.todo;
          if (id === 'key') { if (!blockedInPreview('열쇠를 넣을')) els.btnAuth.click(); }
          else if (id === 'help') els.btnHelp.click();
          else if (id === 'edit') {
            const q = (state.ui.quick || [])[0];
            if (q && els.view.querySelector('.card-quick input, .card-quick textarea')) els.view.querySelector('.card-quick input, .card-quick textarea').focus();
            else go('page:' + site().home);
          } else if (id === 'publish') openPublishModal();
          else if (/^c\d+$/.test(id)) {
            const i = Number(id.slice(1));
            setProgress((p) => { p.custom = p.custom || {}; p.custom[i] = !p.custom[i]; });
            if (state.previewMode) showToast('미리보기에서는 체크가 저장되지 않아요.');
            refreshSideCards();
          }
          break;
        }
        case 'todo-hide':
          if (blockedInPreview('카드를 숨길')) return;
          setProgress((p) => { p.todoHidden = true; });
          renderView(true);
          showToast('처음 할 일 카드를 숨겼어요.');
          break;
      }
    });

    // 내용 화면: 칸에 다 쓰고 나면(칸을 벗어나거나 Enter) 반영
    els.view.addEventListener('change', (e) => {
      const t = e.target;
      if (state.historyPreviewMode) return;
      if (t.matches('[data-link-mode]')) {
        const isPage = t.value === 'page';
        const pages = site().pages;
        mutateField(t.dataset.bid, t.dataset.path, isPage ? (pages.length ? 'page:' + pages[0].id : '#') : '', true);
        return;
      }
      if (t.matches('[data-bid][data-path]')) {
        const v = t.dataset.num ? Number(t.value) : t.value;
        mutateField(t.dataset.bid, t.dataset.path, v, false);
        return;
      }
      if (t.matches('[data-biz]')) {
        const key = t.dataset.biz, v = t.value.trim();
        let n = 0;
        change('가게 기본 정보 고치기', () => { n = UI.setBiz(site(), key, v, { BLOCKS, onlyEditable: true }); });
        if (n > 1) showToast(`홈페이지 ${n}곳을 함께 바꿨어요.`);
        refreshSideCards();
        return;
      }
      if (t.matches('[data-biz-sync]')) {
        const on = t.checked, nm = BUILD.siteName(site());
        change(on ? '상호를 사이트 이름과 같이 쓰기' : '상호 따로 쓰기', () => {
          const s = site(); s.info = s.info || {}; s.info.syncCompany = on;
          if (on && nm) UI.setBiz(s, 'company', nm, { BLOCKS, onlyEditable: true });
        });
        renderView(true);
        return;
      }
      if (t.matches('[data-info]')) {
        const k = t.dataset.info, v = t.value.trim();
        const s0 = site();
        const coSync = k === 'name' && v && UI.companySynced(s0, UI.currentName(s0));
        const oldName = UI.currentName(s0);
        setInfo('사이트 정보 고치기', (inf, s) => {
          inf[k] = v;
          // 맨 위 메뉴 제목과 같이 쓰는 사이트면 메뉴 제목 · 맨 아래 이름도 같이 바꿔요
          if (k === 'name' && inf.syncName !== false) {
            const hd = UI.siteBlocks(s).map((x) => x.block).find((b) => b.type === 'header');
            if (hd && v) { hd.props.logo = v; if (typeof FOLLOW_NAME === 'function') FOLLOW_NAME(s, oldName, v); }
          }
          if (coSync) { inf.syncCompany = true; UI.setBiz(s, 'company', v, { BLOCKS, onlyEditable: true }); }
        });
        updateHeaderInfo();
        refreshSideCards();
        return;
      }
      if (t.matches('[data-page-desc]')) {
        const pg = site().pages.find((p) => p.id === t.dataset.pageDesc);
        if (pg) change('페이지 설명 고치기', () => { pg.desc = t.value.trim(); });
        refreshSideCards();
      }
    });
    // 한 줄 칸은 Enter로 바로 반영
    els.view.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('input.input')) e.target.blur();
    });

    // 사진 · 영상 파일
    if (els.fileInputImage) {
      els.fileInputImage.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file || !imagePickerCallback) return;
        try {
          const res = await BUILD.shrinkImage(file, /png|svg|webp/i.test(file.type));
          imagePickerCallback(res.dataUrl);
        } catch (err) {
          showToast('사진을 열 수 없어요. JPG나 PNG 사진으로 넣어 주세요.');
        } finally {
          els.fileInputImage.value = '';
          imagePickerCallback = null;
        }
      });
    }
    if (els.fileInputVideo) {
      els.fileInputVideo.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file || !videoPickerCallback) return;
        const cb = videoPickerCallback;
        videoPickerCallback = null;
        els.fileInputVideo.value = '';
        if (file.size > 30 * 1024 * 1024) { showToast('영상이 너무 커요(30MB까지). 유튜브에 올리고 주소를 적는 걸 추천해요.'); return; }
        const r = new FileReader();
        r.onload = () => cb(r.result);
        r.onerror = () => showToast('영상을 열 수 없어요.');
        r.readAsDataURL(file);
      });
    }

    // 시험 모드
    const openHometeoFile = () => { if (els.fileInputHometeo) els.fileInputHometeo.click(); };
    if (els.btnOpenFileTest) els.btnOpenFileTest.addEventListener('click', openHometeoFile);
    if (els.btnReopenTest) els.btnReopenTest.addEventListener('click', openHometeoFile);
    if (els.btnRetry) els.btnRetry.addEventListener('click', () => (state.previewMode ? location.reload() : loadProjectWithAuth()));

    if (els.fileInputHometeo) {
      els.fileInputHometeo.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            const data = JSON.parse(r.result);
            initProjectData(data);
            if (els.testBanner) els.testBanner.hidden = false;
            showToast(`작업 파일(‘${file.name}’)을 시험 모드로 열었어요.`);
          } catch (err) {
            showToast('작업 파일을 읽지 못했어요.');
          }
        };
        r.readAsText(file);
        els.fileInputHometeo.value = '';
      });
    }

    // 첫 화면 작은 미리보기 크기 맞추기
    let rz = null;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (state.view === 'home') renderView(true); }, 200); });

    // 창 닫기 보호
    window.addEventListener('beforeunload', (e) => {
      if (state.dirty && !state.previewMode) {
        e.preventDefault();
        e.returnValue = '반영하지 않은 수정 내용이 있어요. 정말 나갈까요?';
      }
    });
  }

  // =========================================================
  // 14. 홈터의 '관리자 화면 미리보기'로 열었을 때
  //     홈터 창이 지금 작업 내용을 보내줘요 (열쇠 · 보관함 없이 보기만)
  // =========================================================
  // 홈터 자동 저장 읽기 (같은 주소에서 연 홈터가 이 브라우저에 남긴 것)
  function readHometeoSave() {
    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) { resolve(null); return; }
        const req = indexedDB.open('hometeo');
        req.onupgradeneeded = () => { try { req.transaction.abort(); } catch (e) {} resolve(null); };
        req.onerror = () => resolve(null);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('projects')) { db.close(); resolve(null); return; }
          const g = db.transaction('projects', 'readonly').objectStore('projects').get('current');
          g.onsuccess = () => { db.close(); const d = g.result; resolve(d && d.site && Array.isArray(d.site.pages) && d.site.pages.length ? d : null); };
          g.onerror = () => { db.close(); resolve(null); };
        };
      } catch (e) { resolve(null); }
    });
  }

  // 홈터와 이어진 미리보기: 홈터에서 고치면(자동 저장될 때마다) 따라 바뀌어요
  let liveHooked = false;
  let lastLiveAt = '';
  function applyLive(project) {
    if (!project) return;
    const at = project.savedAt || '';
    if (state.project && at && lastLiveAt && at <= lastLiveAt) return;   // 같거나 더 오래된 내용은 건너뛰어요
    lastLiveAt = at;
    const keep = !!state.project;
    initProjectData(project, { keepView: keep });
  }
  function startLiveMode(project) {
    state.previewMode = true;
    if (els.previewBanner) els.previewBanner.hidden = false;
    if (els.testBanner) els.testBanner.hidden = true;
    applyLive(project);
    if (liveHooked) return;
    liveHooked = true;
    const refresh = async () => { const d = await readHometeoSave(); if (d) applyLive(d); };
    try {
      const bc = new BroadcastChannel('hometeo-live');
      bc.onmessage = (e) => { if (e.data && e.data.type === 'hometeo-saved') refresh(); };
    } catch (e) { /* 이 브라우저는 알림 통로가 없어요 → 창으로 돌아올 때 새로 */ }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.addEventListener('focus', refresh);
  }

  function startPreviewMode() {
    if (els.previewBanner) els.previewBanner.hidden = false;
    const h2 = els.loadingOverlay.querySelector('h2');
    const p = els.loadingOverlay.querySelector('p');
    if (h2) h2.textContent = '홈터에서 내용을 받는 중…';
    if (p) p.textContent = '홈터에서 꾸민 관리자 화면을 미리 보여드릴게요.';

    let got = false;
    window.addEventListener('message', (e) => {
      if (!window.opener || e.source !== window.opener) return;   // 이 창을 연 홈터 창에서 온 것만
      const m = e.data || {};
      if (m.type !== 'hometeo-admin-preview' || !m.project) return;
      got = true;
      if (m.siteUrl) state.config.siteUrl = m.siteUrl;
      lastLiveAt = m.project.savedAt || lastLiveAt;
      const keep = !!state.project;
      initProjectData(m.project, { keepView: keep });
    });
    if (window.opener) {
      try { window.opener.postMessage({ type: 'hometeo-admin-preview-ready' }, '*'); } catch (err) {}
    }
    // 홈터 창이 없거나(직접 열기 · 새로고침) 답이 늦으면 홈터 자동 저장에서 읽어요
    readHometeoSave().then((d) => {
      if (d && !got) { got = true; startLiveMode(d); }
      else if (d) startLiveMode(d);
    });
    setTimeout(() => {
      if (got) return;
      els.loadingOverlay.hidden = true;
      if (els.errorTitle) els.errorTitle.textContent = '미리볼 내용이 없어요';
      els.errorDesc.textContent = '홈터에서 페이지를 만든 다음, ‘관리자 화면 꾸미기’의 ‘관리자 화면 미리보기’ 버튼으로 열어 주세요.';
      if (els.btnOpenFileTest) els.btnOpenFileTest.hidden = true;
      els.errorOverlay.hidden = false;
    }, 4000);
  }

  // =========================================================
  // 15. 시작
  // =========================================================
  async function init() {
    state.config = Object.assign({ owner: '', repo: '', branch: 'main', siteUrl: '', siteName: '내 홈페이지' }, window.ADMIN_CONFIG || {});
    const isTestMode = Boolean(state.config.testMode === true);

    // 시험 모드일 때만 건너뛰기 버튼 및 시험용 파일 열기 버튼 노출
    if (els.btnAuthSkip) els.btnAuthSkip.hidden = !isTestMode;
    if (els.btnOpenFileTest) els.btnOpenFileTest.hidden = !isTestMode;

    setupEvents();
    if (state.previewMode) { startPreviewMode(); return; }
    await loadProjectWithAuth();
  }

  // 외부 시험용 노출 (테스트 스크립트 등에서 모크 제어 가능)
  window.HometeoAdmin = {
    state,
    AdminStorage,
    AdminVault,
    get GitHubService() { return GitHubService; },
    set GitHubService(svc) { GitHubService = svc; },
    computeDiffSummary,
    executePublish,
    loadProjectWithAuth,
    initProjectData,
    go,
    renderView
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
