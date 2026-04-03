/* ========================================
   Happy Booth — Photobooth Event
   Internationalization (i18n)
   ======================================== */

// Note: FOUC prevention (i18n-loading class) is handled by inline <script> in <head>

(function () {
  const DEFAULT_LANG = 'vi';
  const HTML_LANG = 'en'; // language hardcoded in HTML
  const STORAGE_KEY = 'hb-lang';
  const cache = {};
  let currentLang = DEFAULT_LANG;

  function init() {
    currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    setupToggleListeners();
    updateToggleUI();

    if (currentLang !== HTML_LANG) {
      loadTranslations(currentLang).then(function () {
        applyTranslations();
        reveal();
      });
    } else {
      reveal();
    }
  }

  function reveal() {
    document.documentElement.classList.remove('i18n-loading');
    document.documentElement.classList.add('i18n-ready');
  }

  async function loadTranslations(lang) {
    if (cache[lang]) return;
    try {
      var basePath = document.querySelector('script[src*="i18n.js"]').src;
      var langPath = basePath.replace('js/i18n.js', 'lang/' + lang + '.json');
      var resp = await fetch(langPath);
      cache[lang] = await resp.json();
    } catch (e) {
      console.warn('i18n: Could not load translations for', lang);
      cache[lang] = {};
    }
  }

  function applyTranslations() {
    var strings = cache[currentLang];
    if (!strings) return;

    // textContent replacements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (strings[key] !== undefined) {
        el.textContent = strings[key];
      }
    });

    // innerHTML replacements (for strings containing <em>, <br>, <a>)
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (strings[key] !== undefined) {
        el.innerHTML = strings[key];
      }
    });

    // placeholder replacements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (strings[key] !== undefined) {
        el.setAttribute('placeholder', strings[key]);
      }
    });

    // Update html lang attribute
    document.documentElement.lang = currentLang;

    // Update page title
    if (strings['meta.title']) {
      document.title = strings['meta.title'];
    }
  }

  async function setLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    if (lang === HTML_LANG) {
      // Switching to HTML's native language — reload to restore original text
      location.reload();
      return;
    }

    await loadTranslations(lang);
    applyTranslations();
    updateToggleUI();
  }

  function updateToggleUI() {
    document.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
      if (btn.getAttribute('data-lang') === currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function setupToggleListeners() {
    document.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = this.getAttribute('data-lang');
        setLanguage(lang);
      });
    });
  }

  // Expose API for router and contact form
  window.i18n = {
    t: function (key) {
      var strings = cache[currentLang];
      if (strings && strings[key] !== undefined) return strings[key];
      return null;
    },
    currentLang: function () {
      return currentLang;
    },
    apply: function (root) {
      if (currentLang === HTML_LANG) return;
      var strings = cache[currentLang];
      if (!strings) return;
      root.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (strings[key] !== undefined) el.textContent = strings[key];
      });
      root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-html');
        if (strings[key] !== undefined) el.innerHTML = strings[key];
      });
      root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (strings[key] !== undefined) el.setAttribute('placeholder', strings[key]);
      });
    }
  };

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
