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
