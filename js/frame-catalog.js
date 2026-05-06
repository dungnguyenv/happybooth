/* ========================================
   Happy Booth — Frame Catalog
   Local images + Firestore metadata
   + Admin CRUD (create, edit, hard-delete)
   ======================================== */
(function () {
  'use strict';

  var MANIFEST_URL = 'assets/images/frames/manifest.json';
  var FRAMES_BASE = 'assets/images/frames/';

  var frameSets = [];
  var manifest = null;
  var keyHandler = null;
  var isAdmin = false;

  // Admin state
  var editingSetId = null;
  var selectedThumb = null; // path of selected thumbnail

  window.HB_FrameCatalog = { init: init, cleanup: cleanup };

  /* ============================================================
     Init / Cleanup
     ============================================================ */
  function init() {
    if (!document.getElementById('frameCatalog')) return;
    fetchFrameSets();
    bindModalEvents();
    bindFrameStripButtons();
    checkAdmin();
  }

  function cleanup() {
    closeModal();
    closeAdminModal();
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    frameSets = [];
    isAdmin = false;
  }

  /* ============================================================
     Admin Detection
     ============================================================ */
  function checkAdmin() {
    if (!window.auth) return;
    window.auth.whenReady().then(function () {
      isAdmin = window.auth.isAdmin();
      if (isAdmin) {
        showAdminButton();
        bindAdminModalEvents();
        if (frameSets.length > 0) renderCatalog(frameSets);
      }
    });
  }

  function showAdminButton() {
    var catalog = document.getElementById('frameCatalog');
    if (!catalog || document.getElementById('adminAddSetBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'adminAddSetBtn';
    btn.className = 'fe-btn fe-btn--primary fc-admin-add-btn fade-in visible';
    btn.textContent = t('admin.frame.addTitle', '+ Add Frame Set');
    btn.addEventListener('click', function () { openAdminModal(null); });

    var desc = catalog.querySelector('.frame-catalog__desc');
    if (desc) desc.parentNode.insertBefore(btn, desc.nextSibling);
  }

  /* ============================================================
     View Modal Events
     ============================================================ */
  function bindModalEvents() {
    var modal = document.getElementById('frameSetModal');
    if (!modal) return;

    var closeBtn = modal.querySelector('.fc-modal__close');
    var backdrop = modal.querySelector('.fc-modal__backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    if (!keyHandler) {
      keyHandler = function (e) {
        if (e.key === 'Escape') { closeModal(); closeAdminModal(); }
      };
      document.addEventListener('keydown', keyHandler);
    }
  }

  /* ============================================================
     Data Fetching
     ============================================================ */
  function fetchFrameSets() {
    var loadingEl = document.getElementById('catalogLoading');
    var errorEl = document.getElementById('catalogError');
    var gridEl = document.getElementById('catalogGrid');

    if (!window.fireDb) {
      showError(loadingEl, errorEl);
      return;
    }

    window.fireDb.collection('frameSets')
      .where('active', '==', true)
      .orderBy('order')
      .get()
      .then(function (snapshot) {
        frameSets = [];
        snapshot.forEach(function (doc) {
          var data = doc.data();
          data.id = doc.id;
          frameSets.push(data);
        });

        if (loadingEl) loadingEl.style.display = 'none';

        if (frameSets.length === 0) {
          if (loadingEl) {
            loadingEl.style.display = '';
            loadingEl.innerHTML = '<p>' + t('catalog.empty', 'No frame templates available yet.') + '</p>';
          }
          if (gridEl) gridEl.style.display = 'none';
          return;
        }

        if (gridEl) gridEl.style.display = '';
        renderCatalog(frameSets);
      })
      .catch(function (err) {
        console.warn('Frame catalog fetch error:', err);
        showError(loadingEl, errorEl);
      });
  }

  function showError(loadingEl, errorEl) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = '';
  }

  function fetchManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetch(MANIFEST_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) { manifest = data; return data; });
  }

  /* ============================================================
     Catalog Rendering
     ============================================================ */
  function renderCatalog(sets) {
    var grid = document.getElementById('catalogGrid');
    if (!grid) return;
    grid.innerHTML = '';
    sets.forEach(function (set) { grid.appendChild(createSetCard(set)); });
  }

  function createSetCard(set) {
    var card = document.createElement('div');
    card.className = 'fc-set-card';
    var frameCount = (set.frames && set.frames.length) || 0;

    card.innerHTML =
      '<div class="fc-set-card__img-wrap">' +
        (set.thumbnail
          ? '<img src="' + escapeAttr(set.thumbnail) + '" alt="' + escapeAttr(localizedName(set)) + '" loading="lazy">'
          : '<div class="fc-set-card__placeholder"></div>') +
      '</div>' +
      '<div class="fc-set-card__info">' +
        '<h3 class="fc-set-card__name">' + escapeHtml(localizedName(set)) + '</h3>' +
        '<p class="fc-set-card__count">' + frameCount + ' ' + t('catalog.framesLabel', 'frames') + '</p>' +
      '</div>';

    // Admin controls
    if (isAdmin) {
      var adminOverlay = document.createElement('div');
      adminOverlay.className = 'fc-set-card__admin';
      adminOverlay.innerHTML =
        '<button class="fc-set-card__admin-btn fc-set-card__admin-btn--edit" title="Edit">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
        '<button class="fc-set-card__admin-btn fc-set-card__admin-btn--delete" title="Delete">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>';

      adminOverlay.querySelector('.fc-set-card__admin-btn--edit').addEventListener('click', function (e) {
        e.stopPropagation();
        openAdminModal(set);
      });
      adminOverlay.querySelector('.fc-set-card__admin-btn--delete').addEventListener('click', function (e) {
        e.stopPropagation();
        handleDelete(set);
      });
      card.appendChild(adminOverlay);
    }

    card.addEventListener('click', function () { openModal(set); });
    return card;
  }

  /* ============================================================
     View Modal (browse frames in a set)
     ============================================================ */
  function openModal(set) {
    var modal = document.getElementById('frameSetModal');
    var titleEl = document.getElementById('modalTitle');
    var descEl = document.getElementById('modalDesc');
    var gridEl = document.getElementById('modalGrid');
    if (!modal || !gridEl) return;

    titleEl.textContent = localizedName(set);
    descEl.textContent = localizedDesc(set);
    gridEl.innerHTML = '';

    var sortedFrames = (set.frames || []).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });

    sortedFrames.forEach(function (frame) {
      var item = document.createElement('div');
      item.className = 'fc-modal__item';
      item.innerHTML =
        '<div class="fc-modal__item-img-wrap">' +
          '<img src="' + escapeAttr(frame.path) + '" alt="' + escapeAttr(localizedName(frame)) + '" loading="lazy">' +
          '<button class="fc-modal__edit-btn">' +
            t('catalog.editBtn', 'Edit This Frame') +
          '</button>' +
        '</div>';

      item.querySelector('.fc-modal__edit-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        loadFrameIntoEditor(frame.path, sortedFrames);
      });
      gridEl.appendChild(item);
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = document.getElementById('frameSetModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ============================================================
     Editor Integration
     ============================================================ */
  function loadFrameIntoEditor(imagePath, siblingFrames) {
    if (!imagePath) return;

    function doLoad() {
      window.HB_FrameEditor.loadFromUrl(imagePath);
      showFrameStrip(imagePath, siblingFrames || []);
    }

    if (!window.HB_FrameEditor) {
      var s = document.createElement('script');
      s.src = 'js/frame-editor.js';
      s.onload = function () {
        if (window.HB_FrameEditor) {
          window.HB_FrameEditor.init();
          doLoad();
        }
      };
      document.head.appendChild(s);
    } else {
      doLoad();
    }

    closeModal();
    var editorSection = document.querySelector('.frame-editor');
    if (editorSection) {
      setTimeout(function () {
        editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  var currentStripFrames = [];
  var currentStripIndex = 0;

  function bindFrameStripButtons() {
    var prevBtn = document.getElementById('editorFramePrev');
    var nextBtn = document.getElementById('editorFrameNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { switchFrame(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { switchFrame(1); });
  }

  function showFrameStrip(activePath, frames) {
    var strip = document.getElementById('editorFrameStrip');
    var list = document.getElementById('editorFrameStripList');
    if (!strip || !list) return;

    if (!frames || frames.length <= 1) {
      strip.style.display = 'none';
      currentStripFrames = [];
      var pb = document.getElementById('editorFramePrev');
      var nb = document.getElementById('editorFrameNext');
      if (pb) pb.style.display = 'none';
      if (nb) nb.style.display = 'none';
      return;
    }

    currentStripFrames = frames;
    currentStripIndex = 0;
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].path === activePath) { currentStripIndex = i; break; }
    }

    list.innerHTML = '';
    frames.forEach(function (frame, idx) {
      var item = document.createElement('div');
      item.className = 'fe-frame-strip__item' + (frame.path === activePath ? ' fe-frame-strip__item--active' : '');
      item.innerHTML = '<img src="' + escapeAttr(frame.path) + '" alt="' + escapeAttr(frame.name || '') + '">';
      item.addEventListener('click', function () {
        if (frame.path !== activePath) {
          loadFrameIntoEditor(frame.path, frames);
        }
      });
      list.appendChild(item);
    });

    // Update prev/next arrow buttons on canvas
    var prevBtn = document.getElementById('editorFramePrev');
    var nextBtn = document.getElementById('editorFrameNext');
    if (prevBtn) {
      prevBtn.style.display = '';
      prevBtn.disabled = currentStripIndex <= 0;
    }
    if (nextBtn) {
      nextBtn.style.display = '';
      nextBtn.disabled = currentStripIndex >= frames.length - 1;
    }

    strip.style.display = '';
  }

  function switchFrame(delta) {
    if (!currentStripFrames.length) return;
    var newIdx = currentStripIndex + delta;
    if (newIdx < 0 || newIdx >= currentStripFrames.length) return;
    loadFrameIntoEditor(currentStripFrames[newIdx].path, currentStripFrames);
  }

  /* ============================================================
     Admin CRUD Modal
     ============================================================ */
  function bindAdminModalEvents() {
    var modal = document.getElementById('adminFrameModal');
    if (!modal) return;

    var closeBtn = modal.querySelector('.fc-admin-close');
    var backdrop = modal.querySelector('.fc-modal__backdrop');
    var cancelBtn = document.getElementById('adminCancelBtn');
    var form = document.getElementById('adminFrameForm');
    var folderSelect = document.getElementById('adminFolder');

    if (closeBtn) closeBtn.addEventListener('click', closeAdminModal);
    if (backdrop) backdrop.addEventListener('click', closeAdminModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeAdminModal);

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleAdminSave();
      });
    }

    if (folderSelect) {
      folderSelect.addEventListener('change', function () {
        renderImageGrid(folderSelect.value, []);
      });
    }
  }

  function openAdminModal(set) {
    var modal = document.getElementById('adminFrameModal');
    if (!modal) return;

    var titleEl = document.getElementById('adminModalTitle');
    var errorEl = document.getElementById('adminFormError');
    var progressEl = document.getElementById('adminFormProgress');
    var folderSelect = document.getElementById('adminFolder');

    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
    if (progressEl) progressEl.style.display = 'none';
    selectedThumb = null;

    // Fetch manifest and populate folder dropdown
    fetchManifest().then(function (data) {
      // Populate dropdown
      folderSelect.innerHTML = '<option value="">' + t('admin.frame.selectFolderPlaceholder', '-- Choose a folder --') + '</option>';
      Object.keys(data).sort().forEach(function (folder) {
        var opt = document.createElement('option');
        opt.value = folder;
        opt.textContent = folder;
        folderSelect.appendChild(opt);
      });

      if (set) {
        // Edit mode
        editingSetId = set.id;
        if (titleEl) titleEl.textContent = t('admin.frame.editTitle', 'Edit Frame Set');
        document.getElementById('adminName').value = set.name || '';
        document.getElementById('adminDesc').value = set.description || '';
        document.getElementById('adminOrder').value = set.order || 1;
        selectedThumb = set.thumbnail || null;

        // Select the folder
        if (set.folder) {
          folderSelect.value = set.folder;
          var selectedPaths = (set.frames || []).map(function (f) { return f.path; });
          renderImageGrid(set.folder, selectedPaths);
        }
      } else {
        // Create mode
        editingSetId = null;
        if (titleEl) titleEl.textContent = t('admin.frame.addTitle', '+ Add Frame Set');
        document.getElementById('adminName').value = '';
        document.getElementById('adminDesc').value = '';
        document.getElementById('adminOrder').value = frameSets.length + 1;
        document.getElementById('adminImageGrid').innerHTML = '<p class="fc-admin-frames__empty">' + t('admin.frame.selectFolderFirst', 'Select a folder to see available frames.') + '</p>';
      }

      if (window.i18n && window.i18n.apply) window.i18n.apply(modal);
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }).catch(function (err) {
      console.warn('Failed to load manifest:', err);
      alert(t('admin.frame.errorManifest', 'Failed to load frame folders.'));
    });
  }

  function closeAdminModal() {
    var modal = document.getElementById('adminFrameModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    editingSetId = null;
    selectedThumb = null;
  }

  /* ---- Image Grid with Checkboxes ---- */
  function renderImageGrid(folder, selectedPaths) {
    var grid = document.getElementById('adminImageGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!folder || !manifest || !manifest[folder]) {
      grid.innerHTML = '<p class="fc-admin-frames__empty">' + t('admin.frame.selectFolderFirst', 'Select a folder to see available frames.') + '</p>';
      return;
    }

    var files = manifest[folder];
    files.forEach(function (file) {
      var path = FRAMES_BASE + folder + '/' + file;
      var isChecked = selectedPaths.indexOf(path) !== -1;
      var isThumb = selectedThumb === path;

      var item = document.createElement('label');
      item.className = 'fc-admin-img-item' + (isThumb ? ' fc-admin-img-item--thumb' : '');

      item.innerHTML =
        '<div class="fc-admin-img-item__preview">' +
          '<img src="' + escapeAttr(path) + '" alt="' + escapeAttr(file) + '">' +
          (isThumb ? '<span class="fc-admin-img-item__badge">Thumbnail</span>' : '') +
        '</div>' +
        '<div class="fc-admin-img-item__controls">' +
          '<input type="checkbox" class="fc-admin-img-item__check" value="' + escapeAttr(path) + '"' + (isChecked ? ' checked' : '') + '>' +
          '<span class="fc-admin-img-item__name">' + escapeHtml(file) + '</span>' +
        '</div>';

      // Click image to set as thumbnail
      var img = item.querySelector('img');
      img.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectedThumb = path;
        // Also check this image
        item.querySelector('.fc-admin-img-item__check').checked = true;
        // Re-render to update badge
        renderImageGrid(folder, getCheckedPaths());
      });

      grid.appendChild(item);
    });
  }

  function getCheckedPaths() {
    var checks = document.querySelectorAll('.fc-admin-img-item__check:checked');
    var paths = [];
    checks.forEach(function (cb) { paths.push(cb.value); });
    return paths;
  }

  /* ============================================================
     Admin Save (Create / Update)
     ============================================================ */
  function handleAdminSave() {
    var name = document.getElementById('adminName').value.trim();
    var folder = document.getElementById('adminFolder').value;
    var errorEl = document.getElementById('adminFormError');
    var progressEl = document.getElementById('adminFormProgress');
    var saveBtn = document.getElementById('adminSaveBtn');

    if (!name) {
      showAdminError(errorEl, t('admin.frame.errorName', 'Please enter a name.'));
      return;
    }
    if (!folder) {
      showAdminError(errorEl, t('admin.frame.errorFolder', 'Please select a folder.'));
      return;
    }

    var checkedPaths = getCheckedPaths();
    if (checkedPaths.length === 0) {
      showAdminError(errorEl, t('admin.frame.errorNoFrames', 'Please select at least one frame.'));
      return;
    }

    // Auto-set thumbnail to first checked if not set
    if (!selectedThumb || checkedPaths.indexOf(selectedThumb) === -1) {
      selectedThumb = checkedPaths[0];
    }

    if (errorEl) errorEl.style.display = 'none';
    if (progressEl) progressEl.style.display = '';
    if (saveBtn) saveBtn.disabled = true;

    // Build frames array
    var framesData = checkedPaths.map(function (path, idx) {
      var fileName = path.split('/').pop().replace(/\.[^.]+$/, '');
      return {
        name: fileName,
        order: idx + 1,
        path: path
      };
    });

    var docData = {
      name: name,
      description: document.getElementById('adminDesc').value.trim(),
      order: parseInt(document.getElementById('adminOrder').value, 10) || 1,
      active: true,
      folder: folder,
      thumbnail: selectedThumb,
      frames: framesData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!editingSetId) {
      docData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    var docRef = editingSetId
      ? window.fireDb.collection('frameSets').doc(editingSetId)
      : window.fireDb.collection('frameSets').doc();

    docRef.set(docData, { merge: true })
      .then(function () {
        closeAdminModal();
        fetchFrameSets();
      })
      .catch(function (err) {
        console.error('Admin save error:', err);
        showAdminError(errorEl, t('admin.frame.errorSave', 'Failed to save. Please try again.'));
      })
      .then(function () {
        if (progressEl) progressEl.style.display = 'none';
        if (saveBtn) saveBtn.disabled = false;
      });
  }

  /* ============================================================
     Admin Delete (Hard Delete — Firestore doc only)
     ============================================================ */
  function handleDelete(set) {
    var msg = t('admin.frame.confirmDelete', 'Are you sure you want to permanently delete this frame set? This cannot be undone.');
    if (!confirm(msg)) return;

    window.fireDb.collection('frameSets').doc(set.id).delete()
      .then(function () {
        fetchFrameSets();
      })
      .catch(function (err) {
        console.error('Delete error:', err);
        alert(t('admin.frame.errorDelete', 'Failed to delete. Please try again.'));
      });
  }

  /* ============================================================
     Helpers
     ============================================================ */
  function showAdminError(el, msg) {
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function localizedName(item) {
    return item.name || '';
  }

  function localizedDesc(item) {
    return item.description || '';
  }

  function t(key, fallback) {
    return (window.i18n && window.i18n.t(key)) || fallback;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

})();
