/* ========================================
   Happy Booth — Album page
   Pure logic (no DOM): tested with `node --test tests/`
   ======================================== */

(function (root, factory) {
  var core = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = core;
  } else {
    root.HBAlbumCore = core;
  }
})(this, function () {
  // Same alphabet as the API: no 0, o, 1, l, i (codes are read off prints).
  var CODE_RE = /^[2-9a-hjkmnp-z]{8}$/;
  // 404.html repeats this pattern inline; keep the two in step.
  var SHORT_PATH_RE = /^\/[2-9a-hjkmnp-z]{8}$/;
  var STALE_AFTER_MS = 2 * 60 * 60 * 1000;
  var FAST_POLL_MS = 5000;
  var SLOW_POLL_MS = 30000;
  var SLOW_AFTER_MS = 10 * 60 * 1000;
  var DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  function readCode(search) {
    var raw = new URLSearchParams(search || '').get('c');
    var code = (raw || '').trim().toLowerCase();
    return CODE_RE.test(code) ? code : null;
  }

  function apiBase(hostname) {
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8010';
    }
    return 'https://api.happybooth.vn';
  }

  function isStale(album, now) {
    if (!album || album.uploaded >= album.total) return false;
    return now - Date.parse(album.created_at) > STALE_AFTER_MS;
  }

  function state(kind, album, now) {
    return { kind: kind, album: album, stale: isStale(album, now), offline: false };
  }

  // result: { status, body } from one fetch; status 0 = network failure.
  function deriveState(result, prev, now) {
    var status = result && result.status;
    var body = result && result.body;
    if (status === 404) return state('not_found', null, now);
    if (status === 410) return state('expired', body || {}, now);
    if (status === 200 && body) {
      if (body.uploaded === 0) return state('empty', body, now);
      if (body.uploaded < body.total) return state('partial', body, now);
      return state('complete', body, now);
    }
    // Anything else (offline, 5xx, 429): keep showing what we had.
    if (prev && prev.album && prev.kind !== 'error') {
      return {
        kind: prev.kind,
        album: prev.album,
        stale: isStale(prev.album, now),
        offline: true
      };
    }
    return { kind: 'error', album: null, stale: false, offline: true };
  }

  function nextPollDelay(current, lastProgressAt, now) {
    var kind = current && current.kind;
    if (kind === 'complete' || kind === 'expired' || kind === 'not_found') return null;
    return now - lastProgressAt < SLOW_AFTER_MS ? FAST_POLL_MS : SLOW_POLL_MS;
  }

  // After a refresh, stay on the photo the guest was looking at.
  function indexAfterUpdate(prevFiles, currentIndex, nextFiles) {
    var current = prevFiles && prevFiles[currentIndex];
    if (current) {
      for (var i = 0; i < nextFiles.length; i++) {
        if (nextFiles[i].name === current.name) return i;
      }
    }
    return Math.max(0, Math.min(currentIndex, nextFiles.length - 1));
  }

  function wrapIndex(i, n) {
    return ((i % n) + n) % n;
  }

  function formatDate(iso) {
    return DATE_FORMAT.format(new Date(iso));
  }

  return {
    SHORT_PATH_RE: SHORT_PATH_RE,
    readCode: readCode,
    apiBase: apiBase,
    deriveState: deriveState,
    isStale: isStale,
    nextPollDelay: nextPollDelay,
    indexAfterUpdate: indexAfterUpdate,
    wrapIndex: wrapIndex,
    formatDate: formatDate
  };
});
