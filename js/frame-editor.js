/* ========================================
   Happy Booth — Frame Editor
   Canvas-based frame text overlay editor
   ======================================== */
(function () {
  'use strict';

  var canvas, ctx;
  var frameImg = null;
  var imgW = 0, imgH = 0;
  var scale = 1;
  var texts = [];
  var activeId = null;
  var nextId = 1;
  var dragging = false;
  var dragSX, dragSY, dragTX, dragTY;
  var currentUrl = null;
  var textCache = {};  // url → { texts, nextId }

  window.HB_FrameEditor = { init: init, cleanup: cleanup, loadFromUrl: loadFromUrl };

  /* ---- Init / Cleanup ---- */
  function init() {
    canvas = document.getElementById('editorCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    loadFonts();
    bindUI();
    canvas.width = 500;
    canvas.height = 700;
    render();
  }

  function cleanup() {
    texts = [];
    activeId = null;
    frameImg = null;
    nextId = 1;
    currentUrl = null;
    textCache = {};
  }

  /* ---- Fonts ---- */
  function loadFonts() {
    if (document.getElementById('hb-editor-fonts')) return;
    var link = document.createElement('link');
    link.id = 'hb-editor-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Sacramento&family=Playfair+Display:wght@400;700&display=swap';
    document.head.appendChild(link);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { render(); });
    }
  }

  /* ---- UI Binding ---- */
  function bindUI() {
    var uploadZone = document.getElementById('editorUploadZone');
    var fileInput = document.getElementById('editorFileInput');

    if (uploadZone && fileInput) {
      uploadZone.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        if (fileInput.files[0]) loadFile(fileInput.files[0]);
      });
      uploadZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadZone.classList.add('active');
      });
      uploadZone.addEventListener('dragleave', function () {
        uploadZone.classList.remove('active');
      });
      uploadZone.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadZone.classList.remove('active');
        if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
      });
    }

    bind('editorChangeImage', 'click', function () {
      if (fileInput) fileInput.click();
    });
    bind('editorAddText', 'click', addText);
    bind('editorRemoveText', 'click', removeActive);
    bind('editorDownload', 'click', download);

    bind('editorTextInput', 'input', syncToActive);
    bind('editorFontFamily', 'change', function () {
      var sel = document.getElementById('editorFontFamily');
      if (sel) sel.style.fontFamily = sel.value + ', sans-serif';
      syncToActive();
    });
    bind('editorFontSize', 'input', function () {
      var r = document.getElementById('editorFontSize');
      var v = document.getElementById('editorSizeVal');
      if (r && v) v.textContent = r.value;
      syncToActive();
    });
    bind('editorTextColor', 'input', syncToActive);

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onUp);

    window.addEventListener('resize', function () {
      if (frameImg) { fitCanvas(); render(); }
    });
  }

  function bind(id, evt, fn) {
    var e = document.getElementById(id);
    if (e) e.addEventListener(evt, fn);
  }

  /* ---- Image Loading ---- */
  function loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        frameImg = img;
        imgW = img.naturalWidth;
        imgH = img.naturalHeight;
        texts = [];
        activeId = null;
        nextId = 1;
        toggleView(true);   // show workspace FIRST so wrap has width
        fitCanvas();
        render();
        refreshTextList();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadFromUrl(url) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      // Save current frame's texts before switching
      if (currentUrl) {
        textCache[currentUrl] = { texts: JSON.parse(JSON.stringify(texts)), nextId: nextId };
      }

      frameImg = img;
      imgW = img.naturalWidth;
      imgH = img.naturalHeight;
      currentUrl = url;

      // Restore texts if this frame was edited before, otherwise reset
      if (textCache[url]) {
        texts = textCache[url].texts;
        nextId = textCache[url].nextId;
        activeId = null;
      } else {
        texts = [];
        activeId = null;
        nextId = 1;
      }

      toggleView(true);
      fitCanvas();
      render();
      refreshTextList();
    };
    img.onerror = function () {
      alert((window.i18n && window.i18n.t('editor.loadUrlError')) || 'Failed to load the frame image.');
    };
    img.src = url;
  }

  function fitCanvas() {
    var wrap = document.getElementById('editorCanvasWrap');
    if (!wrap) return;
    // Reset canvas so it doesn't inflate the wrap measurement
    canvas.width = 0;
    canvas.height = 0;
    var arrowSpace = 100; // space for prev/next buttons + gaps
    var maxW = Math.max(wrap.clientWidth - arrowSpace, 300);
    var maxH = Math.min(window.innerHeight * 0.8, 900);
    scale = Math.min(maxW / imgW, maxH / imgH);
    canvas.width = Math.round(imgW * scale);
    canvas.height = Math.round(imgH * scale);
  }

  function toggleView(hasImage) {
    var uz = document.getElementById('editorUploadZone');
    var ws = document.getElementById('editorWorkspace');
    if (uz) uz.style.display = hasImage ? 'none' : '';
    if (ws) ws.style.display = hasImage ? '' : 'none';
  }

  /* ---- Text Management ---- */
  function addText() {
    if (!frameImg) return;
    var t = {
      id: nextId++,
      text: 'Tên Cô Dâu & Chú Rể',
      x: 0.5,
      y: Math.min(0.85 + texts.length * 0.06, 0.95),
      fontFamily: 'Dancing Script',
      fontSize: Math.round(imgH * 0.035),
      color: '#8B0000'
    };
    texts.push(t);
    selectText(t.id);
    refreshTextList();
  }

  function removeActive() {
    if (activeId === null) return;
    texts = texts.filter(function (t) { return t.id !== activeId; });
    activeId = null;
    syncControls();
    refreshTextList();
    render();
  }

  function selectText(id) {
    activeId = id;
    syncControls();
    refreshTextList();
    render();
  }

  function getActive() {
    for (var i = 0; i < texts.length; i++) {
      if (texts[i].id === activeId) return texts[i];
    }
    return null;
  }

  /* ---- Controls Sync ---- */
  function syncControls() {
    var t = getActive();
    var panel = document.getElementById('editorTextControls');
    var ti = document.getElementById('editorTextInput');
    var ff = document.getElementById('editorFontFamily');
    var fs = document.getElementById('editorFontSize');
    var sv = document.getElementById('editorSizeVal');
    var tc = document.getElementById('editorTextColor');
    var rb = document.getElementById('editorRemoveText');

    if (!t) {
      if (panel) panel.classList.add('disabled');
      if (ti) ti.value = '';
      if (rb) rb.disabled = true;
      return;
    }

    if (panel) panel.classList.remove('disabled');
    if (ti) ti.value = t.text;
    if (ff) { ff.value = t.fontFamily; ff.style.fontFamily = t.fontFamily + ', sans-serif'; }
    if (fs) {
      fs.min = Math.round(imgH * 0.008);
      fs.max = Math.round(imgH * 0.1);
      fs.value = t.fontSize;
    }
    if (sv) sv.textContent = t.fontSize;
    if (tc) tc.value = t.color;
    if (rb) rb.disabled = false;
  }

  function syncToActive() {
    var t = getActive();
    if (!t) return;
    var ti = document.getElementById('editorTextInput');
    var ff = document.getElementById('editorFontFamily');
    var fs = document.getElementById('editorFontSize');
    var tc = document.getElementById('editorTextColor');
    if (ti) t.text = ti.value;
    if (ff) t.fontFamily = ff.value;
    if (fs) t.fontSize = parseInt(fs.value, 10);
    if (tc) t.color = tc.value;
    refreshTextList();
    render();
  }

  function refreshTextList() {
    var list = document.getElementById('editorTextList');
    if (!list) return;
    list.innerHTML = '';

    if (texts.length === 0) {
      var p = document.createElement('p');
      p.className = 'fe-text-list__empty';
      p.textContent = (window.i18n && window.i18n.t('editor.noTexts')) || "Click '+ Add Text' to begin";
      list.appendChild(p);
      return;
    }

    texts.forEach(function (t) {
      var div = document.createElement('div');
      div.className = 'fe-text-item' + (t.id === activeId ? ' active' : '');
      div.textContent = t.text || '(empty)';
      div.style.fontFamily = t.fontFamily + ', sans-serif';
      div.addEventListener('click', function () { selectText(t.id); });
      list.appendChild(div);
    });
  }

  /* ---- Canvas Rendering ---- */
  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!frameImg) {
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      var px = t.x * canvas.width;
      var py = t.y * canvas.height;
      var fs = Math.round(t.fontSize * scale);

      ctx.font = fs + 'px "' + t.fontFamily + '"';
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, px, py);

      if (t.id === activeId) {
        var m = ctx.measureText(t.text);
        ctx.save();
        ctx.strokeStyle = 'rgba(59,130,246,0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(px - m.width / 2 - 8, py - fs * 0.65 - 4, m.width + 16, fs * 1.3 + 8);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }

  /* ---- Pointer / Touch Events ---- */
  function coords(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function hitTest(p) {
    for (var i = texts.length - 1; i >= 0; i--) {
      var t = texts[i];
      var fs = t.fontSize * scale;
      ctx.font = Math.round(fs) + 'px "' + t.fontFamily + '"';
      var m = ctx.measureText(t.text);
      var hw = (m.width / canvas.width) / 2 + 0.015;
      var hh = (fs * 1.3 / canvas.height) / 2 + 0.015;
      if (p.x >= t.x - hw && p.x <= t.x + hw &&
          p.y >= t.y - hh && p.y <= t.y + hh) return t;
    }
    return null;
  }

  function onDown(e) {
    var p = coords(e);
    var hit = hitTest(p);
    if (hit) {
      selectText(hit.id);
      dragging = true;
      dragSX = p.x; dragSY = p.y;
      dragTX = hit.x; dragTY = hit.y;
      canvas.style.cursor = 'grabbing';
    } else {
      activeId = null;
      syncControls();
      refreshTextList();
      render();
    }
  }

  function onMove(e) {
    if (!dragging) {
      canvas.style.cursor = hitTest(coords(e)) ? 'grab' : 'default';
      return;
    }
    var p = coords(e);
    var t = getActive();
    if (!t) return;
    t.x = clamp(dragTX + (p.x - dragSX), 0.02, 0.98);
    t.y = clamp(dragTY + (p.y - dragSY), 0.02, 0.98);
    render();
  }

  function onUp() {
    dragging = false;
    canvas.style.cursor = 'default';
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    var t = e.touches[0];
    onDown({ clientX: t.clientX, clientY: t.clientY });
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    var t = e.touches[0];
    onMove({ clientX: t.clientX, clientY: t.clientY });
  }

  /* ---- Download ---- */
  function download() {
    if (!frameImg) return;

    var c = document.createElement('canvas');
    c.width = imgW;
    c.height = imgH;
    var oc = c.getContext('2d');

    oc.drawImage(frameImg, 0, 0, imgW, imgH);

    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      oc.font = t.fontSize + 'px "' + t.fontFamily + '"';
      oc.fillStyle = t.color;
      oc.textAlign = 'center';
      oc.textBaseline = 'middle';
      oc.fillText(t.text, t.x * imgW, t.y * imgH);
    }

    c.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'happy-booth-frame.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 100);
    }, 'image/png');
  }

  /* ---- Helpers ---- */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

})();
