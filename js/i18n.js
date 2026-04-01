/* ========================================
   Happy Booth — Studio
   Internationalization (i18n)
   ======================================== */

(function () {
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'hb-lang';
  const cache = {};
  let currentLang = DEFAULT_LANG;

  function init() {
    currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    setupToggleListeners();
    updateToggleUI();

    if (currentLang !== DEFAULT_LANG) {
      loadTranslations(currentLang).then(() => {
        applyTranslations();
      });
    }
  }

  async function loadTranslations(lang) {
    if (cache[lang]) return;
    try {
      const basePath = document.querySelector('script[src*="i18n.js"]').src;
      const langPath = basePath.replace('js/i18n.js', 'lang/' + lang + '.json');
      const resp = await fetch(langPath);
      cache[lang] = await resp.json();
    } catch (e) {
      console.warn('i18n: Could not load translations for', lang);
      cache[lang] = {};
    }
  }

  function applyTranslations() {
    const strings = cache[currentLang];
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

    if (lang === DEFAULT_LANG) {
      // Reload to restore original English HTML
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

  // Expose for contact form alert
  window.i18n = {
    t: function (key) {
      var strings = cache[currentLang];
      if (strings && strings[key] !== undefined) return strings[key];
      return null;
    },
    currentLang: function () {
      return currentLang;
    }
  };

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
