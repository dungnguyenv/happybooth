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
  initFloatingContact();

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
  initHomeGallery();
  initLightbox();
  initFAQ();
  initCarousel();
  initLoginForm();
  initAdminPage();
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
   Floating Contact Widget (Phone / Zalo / Facebook)
   ---------------------------------------- */
function initFloatingContact() {
  if (document.querySelector('.floating-contact')) return;

  var phoneIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.23 15.26l-2.54-.29a1.99 1.99 0 0 0-1.65.57l-1.84 1.84a15.04 15.04 0 0 1-6.59-6.59l1.85-1.85c.43-.43.64-1.03.57-1.65L8.74 4.77A2 2 0 0 0 6.75 3H5.03c-1.13 0-2.07.94-2 2.07.53 8.54 7.36 15.36 15.89 15.89a1.99 1.99 0 0 0 2.07-2v-1.72c.01-1.02-.76-1.88-1.76-1.98z"/></svg>';
  var zaloIcon = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.27 3 2 8.27 2 14.78c0 3.66 1.86 6.92 4.78 9.07-.18 1.14-.86 3-2.21 4.69-.21.27-.06.66.27.71.31.05.65.06.99.04 2.93-.16 5.03-1.42 6.16-2.27 1.27.31 2.62.49 4.01.49C23.73 27.5 30 22.24 30 15.78 30 8.27 23.73 3 16 3z"/><text x="16" y="19" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="11" fill="#0068ff">Zalo</text></svg>';
  var fbIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>';

  var wrap = document.createElement('div');
  wrap.className = 'floating-contact';
  wrap.innerHTML =
    '<a href="tel:0971842329" class="floating-contact__btn floating-contact__btn--phone" aria-label="Phone 0971842329">' + phoneIcon + '</a>' +
    '<a href="https://zalo.me/971842329" target="_blank" rel="noopener" class="floating-contact__btn floating-contact__btn--zalo" aria-label="Zalo">' + zaloIcon + '</a>' +
    '<a href="https://www.facebook.com/happyboothvn" target="_blank" rel="noopener" class="floating-contact__btn floating-contact__btn--facebook" aria-label="Facebook">' + fbIcon + '</a>';

  document.body.appendChild(wrap);
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
   Home Gallery — auto-populated horizontal carousel
   (e.g. assets/images/home/1.jpg, 2.jpg, ... — adds new files automatically)
   ---------------------------------------- */
function initHomeGallery() {
  var track = document.getElementById('homeGallery');
  if (!track) return;

  // Already populated (e.g. restored from SPA cache). Just rebind nav.
  if (track.querySelector('.home-carousel__slide')) {
    initHomeCarouselNav(track);
    return;
  }
  // Population already in flight on this track instance.
  if (track.dataset.populating === '1') return;
  track.dataset.populating = '1';

  var basePath = track.dataset.imageBase || 'assets/images/home/';
  var ext = track.dataset.imageExt || 'jpg';
  var maxProbe = parseInt(track.dataset.imageMax, 10) || 100;

  var results = new Array(maxProbe + 1);
  var pending = maxProbe;

  function done() {
    for (var i = 1; i <= maxProbe; i++) {
      if (!results[i]) break;
      var slide = document.createElement('div');
      slide.className = 'home-carousel__slide';
      var img = document.createElement('img');
      img.src = results[i];
      img.alt = 'Happy Booth photobooth ' + i;
      img.loading = 'lazy';
      slide.appendChild(img);
      track.appendChild(slide);
    }
    delete track.dataset.populating;
    initScrollAnimations();
    initLightbox();
    initHomeCarouselNav(track);
  }

  for (var i = 1; i <= maxProbe; i++) {
    (function (idx) {
      var url = basePath + idx + '.' + ext;
      fetch(url, { method: 'HEAD' }).then(function (res) {
        if (res.ok) results[idx] = url;
      }).catch(function () {}).then(function () {
        if (--pending === 0) done();
      });
    })(i);
  }
}

function initHomeCarouselNav(track) {
  var container = track.closest('.home-carousel__container');
  if (!container) return;
  var prevBtn = container.querySelector('.home-carousel__prev');
  var nextBtn = container.querySelector('.home-carousel__next');
  if (!prevBtn || !nextBtn) return;

  function step() {
    var firstSlide = track.querySelector('.home-carousel__slide');
    if (!firstSlide) return track.clientWidth * 0.5;
    return firstSlide.getBoundingClientRect().width + 12;
  }

  function updateButtons() {
    var atStart = track.scrollLeft <= 2;
    var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;
  }

  prevBtn.onclick = function () {
    track.scrollBy({ left: -step(), behavior: 'smooth' });
  };
  nextBtn.onclick = function () {
    track.scrollBy({ left: step(), behavior: 'smooth' });
  };
  track.addEventListener('scroll', updateButtons, { passive: true });

  track.querySelectorAll('img').forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) return;
    img.addEventListener('load', updateButtons);
    img.addEventListener('error', updateButtons);
  });

  window.addEventListener('resize', updateButtons);

  initHomeCarouselDrag(track);

  updateButtons();
}

function initHomeCarouselDrag(track) {
  var isDown = false;
  var startX = 0;
  var startScroll = 0;
  var dragged = false;
  var pendingScroll = null;
  var rafId = 0;
  var DRAG_THRESHOLD = 5;

  function flushScroll() {
    rafId = 0;
    if (pendingScroll !== null) {
      track.scrollLeft = pendingScroll;
      pendingScroll = null;
    }
  }

  track.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    isDown = true;
    dragged = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add('home-carousel__track--dragging');
    track.style.scrollSnapType = 'none';
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    var delta = e.clientX - startX;
    if (!dragged && Math.abs(delta) > DRAG_THRESHOLD) dragged = true;
    if (!dragged) return;
    e.preventDefault();
    pendingScroll = startScroll - delta;
    if (!rafId) rafId = requestAnimationFrame(flushScroll);
  });

  function endDrag() {
    if (!isDown) return;
    isDown = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      flushScroll();
    }
    track.classList.remove('home-carousel__track--dragging');
    track.style.scrollSnapType = '';
  }

  document.addEventListener('mouseup', endDrag);
  document.addEventListener('mouseleave', endDrag);

  track.addEventListener('click', function (e) {
    if (dragged) {
      e.stopPropagation();
      e.preventDefault();
      dragged = false;
    }
  }, true);

  track.addEventListener('dragstart', function (e) {
    e.preventDefault();
  });
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

  var galleryItems = document.querySelectorAll('.gallery__item, .home-carousel__slide');
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
      window.location.href = 'admin.html';
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
