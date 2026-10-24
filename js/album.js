/* ========================================
   Happy Booth — Album page (happybooth.vn/<code>)
   404.html sends short links here as /album?c=<code>; this page restores the
   short URL, reads the album from the API and polls while photos upload.
   ======================================== */

(function () {
  var core = window.HBAlbumCore;
  var HOTLINE = '<a href="tel:+84971842329">0971 842 329</a>';

  var main = document.getElementById('album');
  var els = {
    title: document.querySelector('[data-album-title]'),
    photo: document.querySelector('[data-album-photo]'),
    image: document.querySelector('[data-album-image]'),
    counter: document.querySelector('[data-album-counter]'),
    message: document.querySelector('[data-album-message]'),
    thumbs: document.querySelector('[data-album-thumbs]'),
    progress: document.querySelector('[data-album-progress]'),
    notice: document.querySelector('[data-album-notice]'),
    event: document.querySelector('[data-album-event]'),
    banner: document.querySelector('[data-album-banner]'),
    eventName: document.querySelector('[data-album-event-name]'),
    eventDesc: document.querySelector('[data-album-event-desc]'),
    expiry: document.querySelector('[data-album-expiry]'),
    download: document.querySelector('[data-album-download]')
  };

  var code = null;
  var api = null;
  var view = null;          // the current HBAlbumCore state
  var index = 0;            // the photo on stage
  var userPicked = false;   // once the guest chooses a photo, polling never moves them
  var lastUploaded = -1;
  var lastProgressAt = Date.now();
  var timer = null;
  var thumbsKey = '';

  function init() {
    code = core.readCode(window.location.search);
    if (!code) {
      apply({ kind: 'not_found', album: null, stale: false, offline: false });
      return;
    }
    // Show the short link, not /album?c=..., so what guests copy is what was printed.
    history.replaceState(null, '', '/' + code);
    api = core.apiBase(window.location.hostname);
    els.thumbs.addEventListener('click', onThumbClick);
    document.addEventListener('visibilitychange', onVisibility);
    refresh();
  }

  /* ---------- Data ---------- */

  function fetchAlbum() {
    return fetch(api + '/public/albums/' + code, { cache: 'no-store' })
      .then(function (res) {
        return res.json()
          .catch(function () { return null; })
          .then(function (body) { return { status: res.status, body: body }; });
      })
      .catch(function () { return { status: 0, body: null }; });
  }

  function refresh() {
    clearTimeout(timer);
    fetchAlbum().then(function (result) {
      apply(core.deriveState(result, view, Date.now()));
      schedule();
    });
  }

  function schedule() {
    clearTimeout(timer);
    if (document.hidden) return;
    var delay = core.nextPollDelay(view, lastProgressAt, Date.now());
    if (delay !== null) timer = setTimeout(refresh, delay);
  }

  function onVisibility() {
    if (document.hidden) clearTimeout(timer);
    else if (code && core.nextPollDelay(view, lastProgressAt, Date.now()) !== null) refresh();
  }

  function apply(next) {
    var prevFiles = view && view.album && view.album.files;
    var album = next.album;
    if (album && album.files) {
      if (album.uploaded !== lastUploaded) {
        if (lastUploaded >= 0 && album.uploaded > lastUploaded) lastProgressAt = Date.now();
        lastUploaded = album.uploaded;
      }
      index = core.chooseIndex(prevFiles, index, album.files, userPicked);
    }
    view = next;
    render();
  }

  /* ---------- Rendering ---------- */

  function render() {
    var kind = view.kind;
    var album = view.album;
    main.setAttribute('data-state', kind);
    var event = album && album.event;
    var eventName = event && event.name;
    els.title.textContent = eventName || 'Ảnh của bạn';
    document.title = (eventName ? eventName + ' — ' : '') + 'Ảnh của bạn — Happy Booth';

    renderMessage(kind, album);
    renderThumbs(album, kind);
    renderStage();
    renderProgress(album, kind);
    renderNotice();
    renderEvent(album, kind);
  }

  function renderMessage(kind, album) {
    var event = album && album.event;
    var art = event && event.banner_url
      ? '<img class="album-message__art" src="' + attr(event.banner_url) + '" alt="">'
      : '<img class="album-message__art album-message__art--logo" src="/assets/SVG/Logo_web.svg" alt="">';
    var html = '';
    if (kind === 'not_found') {
      html = artLogo() +
        '<p class="album-message__title">Không tìm thấy ảnh</p>' +
        '<p class="album-message__text">Link này không đúng hoặc không tồn tại. Hãy kiểm tra lại mã trên ảnh in của bạn.</p>' +
        '<a href="/" class="btn">Về trang chủ</a>';
    } else if (kind === 'expired') {
      html = art +
        '<p class="album-message__title">Link đã hết hạn</p>' +
        '<p class="album-message__text">' + (event && event.name ? esc(event.name) + ': ' : '') +
        'link xem ảnh chỉ có hiệu lực trong 15 ngày. Cần lấy lại ảnh? Gọi hotline ' + HOTLINE + '.</p>';
    } else if (kind === 'error') {
      html = '<div class="album-spinner" aria-hidden="true"></div>' +
        '<p class="album-message__title">Đang kết nối…</p>' +
        '<p class="album-message__text">Chưa tải được album. Trang sẽ tự thử lại.</p>';
    } else if (kind === 'empty') {
      html = art +
        '<p class="album-message__title">Ảnh đang được tải lên</p>' +
        '<p class="album-message__text">Ảnh của bạn đang được tải lên, trang sẽ tự cập nhật. Bạn có thể giữ trang này mở.</p>' +
        '<div class="album-spinner" aria-hidden="true"></div>';
    } else if (kind === 'loading') {
      html = '<div class="album-skeleton" aria-hidden="true"></div>';
    }
    els.message.innerHTML = html;
    els.message.hidden = html === '';
  }

  function artLogo() {
    return '<img class="album-message__art album-message__art--logo" src="/assets/SVG/Logo_web.svg" alt="">';
  }

  function renderStage() {
    var album = view.album;
    var files = album && album.files;
    var showing = (view.kind === 'partial' || view.kind === 'complete') && files && files.length;
    els.download.disabled = true;
    if (!showing) return;
    var file = files[index];
    var pending = els.photo.querySelector('.album-pending');
    els.counter.textContent = (index + 1) + '/' + files.length;
    if (file.status === 'uploaded') {
      if (pending) pending.remove();
      els.image.hidden = false;
      if (els.image.getAttribute('src') !== file.preview_url) {
        els.image.src = file.preview_url;
      }
      els.image.alt = (album.event.name || 'Album') + ' – ảnh ' + (index + 1);
      els.download.disabled = false;
    } else {
      els.image.hidden = true;
      els.image.removeAttribute('src');
      if (!pending) {
        pending = document.createElement('div');
        pending.className = 'album-pending';
        pending.innerHTML = '<div class="album-spinner" aria-hidden="true"></div>' +
          '<span>Ảnh này đang được tải lên…</span>';
        els.photo.insertBefore(pending, els.counter);
      }
    }
  }

  function renderThumbs(album, kind) {
    var files = album && album.files;
    if (!files || kind === 'expired' || kind === 'not_found') {
      els.thumbs.innerHTML = '';
      thumbsKey = '';
      return;
    }
    var key = files.map(function (f) { return f.name + ':' + (f.preview_url || f.status); }).join('|');
    if (key !== thumbsKey) {
      var scroll = els.thumbs.scrollLeft;
      els.thumbs.innerHTML = files.map(function (f, i) {
        var label = 'Ảnh ' + (i + 1) + (f.status === 'uploaded' ? '' : ' (đang tải lên)');
        var inner = f.status === 'uploaded'
          ? '<img src="' + attr(f.preview_url) + '" alt="" loading="lazy" decoding="async">'
          : '<span>Đang tải</span>';
        return '<li><button type="button" class="album-thumb' + (f.status === 'uploaded' ? '' : ' album-thumb--pending') +
          '" data-index="' + i + '" aria-label="' + label + '">' + inner + '</button></li>';
      }).join('');
      els.thumbs.scrollLeft = scroll;
      thumbsKey = key;
    }
    var buttons = els.thumbs.querySelectorAll('.album-thumb');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-current', i === index ? 'true' : 'false');
    }
  }

  function renderProgress(album, kind) {
    if (!album || !album.files || kind === 'expired') {
      els.progress.textContent = '';
      return;
    }
    if (album.uploaded < album.total) {
      els.progress.innerHTML = '<span class="album-progress__dot" aria-hidden="true"></span>' +
        album.uploaded + '/' + album.total + ' ảnh đã sẵn sàng · trang tự cập nhật';
    } else {
      els.progress.textContent = album.total + ' ảnh · chạm vào ảnh nhỏ để xem';
    }
  }

  function renderNotice() {
    var text = '';
    if (view.offline && view.kind !== 'error') {
      text = 'Mất kết nối mạng, đang thử lại…';
    } else if (view.stale) {
      text = 'Một số ảnh chưa được tải lên. Vui lòng liên hệ hotline ' + HOTLINE + ' để được hỗ trợ.';
    }
    els.notice.innerHTML = text;
    els.notice.hidden = text === '';
  }

  function renderEvent(album, kind) {
    var event = album && album.event;
    if (!event || kind === 'not_found') return;
    els.eventName.textContent = event.name || '';
    els.eventDesc.textContent = event.description || '';
    els.eventDesc.hidden = !event.description;
    if (event.banner_url) {
      els.banner.src = event.banner_url;
      els.banner.hidden = false;
    } else {
      els.banner.hidden = true;
    }
    els.event.classList.toggle('album-event--no-banner', !event.banner_url);
    els.expiry.textContent = kind === 'expired'
      ? 'Link xem ảnh đã hết hạn.'
      : album.expires_at ? 'Ảnh được lưu để xem đến ' + core.formatDate(album.expires_at) + '.' : '';
  }

  function onThumbClick(e) {
    var button = e.target.closest('.album-thumb');
    if (!button) return;
    index = Number(button.getAttribute('data-index'));
    userPicked = true;
    render();
  }

  /* ---------- Helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function attr(s) {
    return esc(s);
  }

  init();
})();
