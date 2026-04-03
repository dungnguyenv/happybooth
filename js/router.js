/* ========================================
   Happy Booth — Photobooth Event
   SPA Router (Fetch-and-Swap)
   ======================================== */

(function () {
  var TRANSITION_MS = 400;
  var pageCache = {};
  var currentPage = null;

  function init() {
    var main = document.getElementById('page-content');
    if (main) {
      currentPage = main.getAttribute('data-page');
      // Cache before animations add .visible classes
      var href = pageToHref(currentPage);
      if (href) {
        pageCache[href] = main.outerHTML;
      }

      // Content starts hidden (class="page-enter" in HTML).
      // Remove class after short delay to trigger slide-up fade-in.
      setTimeout(function () {
        main.classList.remove('page-enter');
      }, 80);
    }

    interceptLinks();
    window.addEventListener('popstate', onPopState);
    preloadPages();
  }

  function pageToHref(page) {
    var map = {
      home: 'index.html', about: 'about.html', portfolio: 'portfolio.html',
      frame: 'frame.html', tips: 'tips.html', contact: 'contact.html'
    };
    return map[page] || null;
  }

  function hrefToPage(href) {
    var clean = href.split('/').pop().split('?')[0].split('#')[0];
    if (!clean || clean === '' || clean === 'index.html') return 'home';
    return clean.replace('.html', '');
  }

  function interceptLinks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href) return;

      // Skip: external, anchors, mailto, tel, javascript, target=_blank
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (link.target === '_blank') return;

      // Only handle .html links or relative paths
      if (!href.endsWith('.html') && href !== '/' && href !== '') return;

      var targetPage = hrefToPage(href);
      if (targetPage === currentPage) {
        e.preventDefault();
        window.scrollTo(0, 0);
        return;
      }

      e.preventDefault();
      navigateTo(href, true);
    });
  }

  async function navigateTo(href, pushState) {
    var clean = href.split('/').pop() || 'index.html';
    var targetPage = hrefToPage(clean);

    // Close mobile nav if open
    var hamburger = document.querySelector('.hamburger');
    var mobileNav = document.querySelector('.mobile-nav');
    if (hamburger && hamburger.classList.contains('active')) {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    }

    var main = document.getElementById('page-content');
    if (!main) {
      // Fallback: normal navigation
      window.location.href = clean;
      return;
    }

    // Cleanup before swap
    if (window.HB && window.HB.cleanup) {
      window.HB.cleanup();
    }

    // Slide-fade out
    main.classList.add('page-enter');

    // Wait for transition
    await sleep(TRANSITION_MS);

    // Fetch or use cache
    var html = pageCache[clean];
    if (!html) {
      try {
        var resp = await fetch(clean);
        if (!resp.ok) {
          window.location.href = clean;
          return;
        }
        html = await resp.text();
        // Extract <main> from full HTML
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMain = doc.getElementById('page-content');
        if (!newMain) {
          window.location.href = clean;
          return;
        }
        html = newMain.outerHTML;
        pageCache[clean] = html;
      } catch (err) {
        window.location.href = clean;
        return;
      }
    }

    // Swap content
    main.outerHTML = html;

    // Re-query the new main element
    var newMainEl = document.getElementById('page-content');
    currentPage = targetPage;

    // Update page title
    var title = newMainEl.getAttribute('data-title');
    if (title) document.title = title;

    // Apply i18n translations instantly (already cached in memory)
    if (window.i18n && window.i18n.apply) {
      window.i18n.apply(newMainEl);
    }

    // Update meta title for i18n
    if (window.i18n && window.i18n.currentLang() !== 'en') {
      var titleKey = 'meta.title.' + targetPage;
      var translatedTitle = window.i18n.t(titleKey);
      if (translatedTitle) document.title = translatedTitle;
    }

    // Reinit page-specific JS
    if (window.HB && window.HB.reinitPage) {
      window.HB.reinitPage();
    }

    // Update active nav class
    updateActiveNav(clean);

    // Push to history
    if (pushState) {
      history.pushState({ page: targetPage, href: clean }, '', clean);
    }

    // Slide-fade in
    newMainEl.classList.add('page-enter');
    // Force reflow so browser registers the starting state
    newMainEl.offsetHeight;
    newMainEl.classList.remove('page-enter');

    // Scroll to top
    window.scrollTo(0, 0);
  }

  function onPopState(e) {
    if (e.state && e.state.href) {
      navigateTo(e.state.href, false);
    } else {
      // Initial page or unknown state — use current URL
      var href = window.location.pathname.split('/').pop() || 'index.html';
      navigateTo(href, false);
    }
  }

  function updateActiveNav(href) {
    var clean = href.split('/').pop() || 'index.html';
    // Update desktop nav
    document.querySelectorAll('.header__nav a[href]').forEach(function (a) {
      var linkHref = a.getAttribute('href');
      if (linkHref === clean || (clean === 'index.html' && linkHref === 'index.html')) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
    // Update mobile nav
    document.querySelectorAll('.mobile-nav a[href]').forEach(function (a) {
      var linkHref = a.getAttribute('href');
      if (linkHref === clean) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  function preloadPages() {
    var pages = ['index.html', 'about.html', 'portfolio.html', 'frame.html', 'tips.html', 'contact.html'];
    var idleCallback = window.requestIdleCallback || function (cb) { setTimeout(cb, 200); };

    idleCallback(function () {
      pages.forEach(function (page) {
        if (pageCache[page]) return;
        fetch(page).then(function (resp) {
          return resp.text();
        }).then(function (html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var main = doc.getElementById('page-content');
          if (main) {
            pageCache[page] = main.outerHTML;
          }
        }).catch(function () {
          // Silently fail — will fallback to normal navigation
        });
      });
    });
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
