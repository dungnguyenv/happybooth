/* ========================================
   Happy Booth — Photobooth Event
   Main JavaScript
   ======================================== */

var _scrollObserver = null;
var _carouselInterval = null;

document.addEventListener('DOMContentLoaded', function () {
  // One-time inits (header/nav — permanent DOM)
  initMobileNav();
  initHeaderScroll();
  initAuthNav();

  // Per-page inits (content-specific)
  reinitPage();
});

/* ----------------------------------------
   Exposed API for SPA Router
   ---------------------------------------- */
window.HB = {
  reinitPage: reinitPage,
  cleanup: cleanup
};

function reinitPage() {
  initScrollAnimations();
  initLightbox();
  initFAQ();
  initCarousel();
  initLoginForm();
  initRegisterForm();
  initAdminPage();
  initUserDashboard();
  initFrameEditor();
  initFrameCatalog();
}

function cleanup() {
  // Clean up carousel interval
  if (_carouselInterval) {
    clearInterval(_carouselInterval);
    _carouselInterval = null;
  }
  // Clean up scroll observer
  if (_scrollObserver) {
    _scrollObserver.disconnect();
    _scrollObserver = null;
  }
  // Clean up frame editor
  if (window.HB_FrameEditor && window.HB_FrameEditor.cleanup) {
    window.HB_FrameEditor.cleanup();
  }
  // Clean up frame catalog
  if (window.HB_FrameCatalog && window.HB_FrameCatalog.cleanup) {
    window.HB_FrameCatalog.cleanup();
  }
}

/* ----------------------------------------
   Mobile Navigation
   ---------------------------------------- */
function initMobileNav() {
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.mobile-nav');

  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('active');
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ----------------------------------------
   Header Scroll Effect
   ---------------------------------------- */
function initHeaderScroll() {
  var header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', function () {
    if (window.pageYOffset > 100) {
      header.style.boxShadow = '0 1px 0 rgba(0,0,0,0.05)';
    } else {
      header.style.boxShadow = 'none';
    }
  }, { passive: true });
}

/* ----------------------------------------
   Auth Nav (toggle Sign In/Up vs My Account)
   ---------------------------------------- */
function initAuthNav() {
  if (!window.auth) return;
  window.auth.whenReady().then(function () {
    updateAuthNav();
  });
}

function updateAuthNav() {
  var isLoggedIn = window.auth && window.auth.isLoggedIn();
  var isAdmin = window.auth && window.auth.isAdmin();

  document.querySelectorAll('[data-auth-show]').forEach(function (el) {
    var show = el.getAttribute('data-auth-show');
    if (show === 'guest') {
      el.style.display = isLoggedIn ? 'none' : '';
    } else if (show === 'user') {
      el.style.display = isLoggedIn ? '' : 'none';
      // Admin links to admin.html, user links to user-dashboard.html
      if (isLoggedIn && el.getAttribute('href')) {
        el.setAttribute('href', isAdmin ? 'admin.html' : 'user-dashboard.html');
      }
    }
  });
}

/* ----------------------------------------
   Scroll Animations (Fade In)
   ---------------------------------------- */
function initScrollAnimations() {
  var elements = document.querySelectorAll('.fade-in:not(.visible)');
  if (!elements.length) return;

  if (_scrollObserver) {
    _scrollObserver.disconnect();
  }

  _scrollObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        _scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(function (el) { _scrollObserver.observe(el); });
}

/* ----------------------------------------
   Lightbox
   ---------------------------------------- */
function initLightbox() {
  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  var lightboxImg = lightbox.querySelector('.lightbox__image');
  var lightboxClose = lightbox.querySelector('.lightbox__close');
  var lightboxPrev = lightbox.querySelector('.lightbox__prev');
  var lightboxNext = lightbox.querySelector('.lightbox__next');
  var lightboxCounter = lightbox.querySelector('.lightbox__counter');

  var galleryItems = document.querySelectorAll('.gallery__item');
  if (!galleryItems.length) return;

  var currentIndex = 0;
  var images = [];

  galleryItems.forEach(function (item, index) {
    var img = item.querySelector('img');
    if (img) {
      images.push(img.src);
      item.addEventListener('click', function () { openLightbox(index); });
    }
  });

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    lightboxImg.src = images[currentIndex];
    lightboxCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightbox();
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateLightbox();
  }

  // Remove old listeners by cloning
  var newClose = lightboxClose.cloneNode(true);
  lightboxClose.parentNode.replaceChild(newClose, lightboxClose);
  newClose.addEventListener('click', closeLightbox);

  var newPrev = lightboxPrev.cloneNode(true);
  lightboxPrev.parentNode.replaceChild(newPrev, lightboxPrev);
  newPrev.addEventListener('click', prevImage);

  var newNext = lightboxNext.cloneNode(true);
  lightboxNext.parentNode.replaceChild(newNext, lightboxNext);
  newNext.addEventListener('click', nextImage);

  lightbox.onclick = function (e) {
    if (e.target === lightbox) closeLightbox();
  };

  // Keyboard — use a named handler to avoid duplicates
  if (!lightbox._keyHandler) {
    lightbox._keyHandler = function (e) {
      if (!lightbox.classList.contains('active')) return;
      switch (e.key) {
        case 'Escape': closeLightbox(); break;
        case 'ArrowLeft': prevImage(); break;
        case 'ArrowRight': nextImage(); break;
      }
    };
    document.addEventListener('keydown', lightbox._keyHandler);
  }

  // Touch swipe
  var touchStartX = 0;
  lightbox.ontouchstart = function (e) {
    touchStartX = e.changedTouches[0].screenX;
  };
  lightbox.ontouchend = function (e) {
    var diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextImage() : prevImage();
    }
  };
}

/* ----------------------------------------
   FAQ Accordion
   ---------------------------------------- */
function initFAQ() {
  var faqItems = document.querySelectorAll('.faq__item');
  if (!faqItems.length) return;

  faqItems.forEach(function (item) {
    var question = item.querySelector('.faq__question');
    if (!question) return;

    question.addEventListener('click', function () {
      var isActive = item.classList.contains('active');
      faqItems.forEach(function (other) { other.classList.remove('active'); });
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ----------------------------------------
   Contact Page Carousel
   ---------------------------------------- */
function initCarousel() {
  var carousel = document.getElementById('contactCarousel');
  if (!carousel) return;

  var images = carousel.querySelectorAll('img');
  if (images.length <= 1) return;

  var currentSlide = 0;

  if (_carouselInterval) clearInterval(_carouselInterval);

  _carouselInterval = setInterval(function () {
    images[currentSlide].classList.remove('carousel-active');
    currentSlide = (currentSlide + 1) % images.length;
    images[currentSlide].classList.add('carousel-active');
  }, 4000);
}

/* ----------------------------------------
   Contact Form Submit (moved from inline)
   ---------------------------------------- */
function handleSubmit(e) {
  e.preventDefault();
  var msg = (window.i18n && window.i18n.t('contact.form.successAlert'))
    || 'Thank you for your inquiry! We will get back to you soon.';
  alert(msg);
  e.target.reset();
  return false;
}

/* ----------------------------------------
   Login Form
   ---------------------------------------- */
function initLoginForm() {
  var form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errorEl = document.getElementById('loginError');

    errorEl.style.display = 'none';
    errorEl.textContent = '';

    if (!email || !password) {
      showLoginError(errorEl, 'auth.error.emptyFields', 'Please enter email and password.');
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '...';

    window.auth.login(email, password).then(function () {
      return window.auth.fetchRole();
    }).then(function (role) {
      if (role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'user-dashboard.html';
      }
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = (window.i18n && window.i18n.t('auth.login.submit')) || 'Sign In';

      var msgKey = 'auth.error.generic';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' ||
          err.code === 'auth/invalid-credential') {
        msgKey = 'auth.error.invalidCredentials';
      } else if (err.code === 'auth/too-many-requests') {
        msgKey = 'auth.error.tooManyRequests';
      } else if (err.code === 'auth/invalid-email') {
        msgKey = 'auth.error.invalidEmail';
      }
      showLoginError(errorEl, msgKey, getDefaultErrorMessage(err.code));
    });
  });
}

function showLoginError(el, i18nKey, fallback) {
  var msg = (window.i18n && window.i18n.t(i18nKey)) || fallback;
  el.textContent = msg;
  el.style.display = 'block';
}

function getDefaultErrorMessage(code) {
  var map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-not-found': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-email': 'Please enter a valid email address.'
  };
  return map[code] || 'An error occurred. Please try again.';
}

/* ----------------------------------------
   Register Form
   ---------------------------------------- */
function initRegisterForm() {
  var form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var displayName = document.getElementById('registerName').value.trim();
    var phone = document.getElementById('registerPhone').value.trim();
    var email = document.getElementById('registerEmail').value.trim();
    var password = document.getElementById('registerPassword').value;
    var errorEl = document.getElementById('registerError');

    errorEl.style.display = 'none';
    errorEl.textContent = '';

    if (!displayName || !email || !password) {
      showRegisterError(errorEl, 'auth.error.emptyFields', 'Please fill in all required fields.');
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '...';

    window.auth.register(email, password, displayName, phone).then(function () {
      window.location.href = 'user-dashboard.html';
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = (window.i18n && window.i18n.t('auth.register.submit')) || 'Register';

      var msgKey = 'auth.error.generic';
      if (err.code === 'auth/email-already-in-use') {
        msgKey = 'auth.error.emailInUse';
      } else if (err.code === 'auth/weak-password') {
        msgKey = 'auth.error.weakPassword';
      } else if (err.code === 'auth/invalid-email') {
        msgKey = 'auth.error.invalidEmail';
      }
      showRegisterError(errorEl, msgKey, getDefaultRegisterError(err.code));
    });
  });
}

function showRegisterError(el, i18nKey, fallback) {
  var msg = (window.i18n && window.i18n.t(i18nKey)) || fallback;
  el.textContent = msg;
  el.style.display = 'block';
}

function getDefaultRegisterError(code) {
  var map = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.'
  };
  return map[code] || 'An error occurred. Please try again.';
}

/* ----------------------------------------
   User Dashboard
   ---------------------------------------- */
function initUserDashboard() {
  var dashboardContent = document.querySelector('.user-dashboard__content');
  if (!dashboardContent) return;

  function fillUserInfo() {
    var doc = window.auth.getUserDoc();
    if (!doc) return;
    var nameEl = document.getElementById('userDisplayName');
    var emailEl = document.getElementById('userEmail');
    var phoneEl = document.getElementById('userPhone');
    if (nameEl) nameEl.textContent = doc.displayName || '';
    if (emailEl) emailEl.textContent = doc.email || '';
    if (phoneEl) phoneEl.textContent = doc.phone || '';
  }

  // Wait for auth + role to be ready before filling
  if (window.auth) {
    window.auth.whenReady().then(fillUserInfo);
  }

  // Logout button
  var logoutBtn = document.getElementById('userLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      window.auth.logout().then(function () {
        window.location.href = 'login.html';
      });
    });
  }
}

/* ----------------------------------------
   Frame Editor
   ---------------------------------------- */
function initFrameEditor() {
  if (!document.getElementById('editorCanvas')) return;
  if (window.HB_FrameEditor) {
    window.HB_FrameEditor.init();
    return;
  }
  // Dynamically load editor script (for SPA navigation from other pages)
  var s = document.createElement('script');
  s.src = 'js/frame-editor.js';
  s.onload = function () {
    if (window.HB_FrameEditor) window.HB_FrameEditor.init();
  };
  document.head.appendChild(s);
}

/* ----------------------------------------
   Frame Catalog
   ---------------------------------------- */
function initFrameCatalog() {
  if (!document.getElementById('frameCatalog')) return;
  if (window.HB_FrameCatalog) {
    window.HB_FrameCatalog.init();
    return;
  }
  var s = document.createElement('script');
  s.src = 'js/frame-catalog.js';
  s.onload = function () {
    if (window.HB_FrameCatalog) window.HB_FrameCatalog.init();
  };
  document.head.appendChild(s);
}

/* ----------------------------------------
   Admin Page
   ---------------------------------------- */
function initAdminPage() {
  var logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', function () {
    window.auth.logout().then(function () {
      window.location.href = 'login.html';
    });
  });
}
