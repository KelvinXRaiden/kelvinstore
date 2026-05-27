/* ═══════════════════════════════════════════════
   KELVIN STORE — animation.js
   Scroll reveal via IntersectionObserver
═══════════════════════════════════════════════ */

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
}

// Hero auto-slider
function initHeroSlider(banners) {
  const slider   = document.getElementById('hero-slider');
  const dotsWrap = document.getElementById('hero-dots');
  if (!slider || !banners || banners.length === 0) return;

  const activeBanners = banners.filter(b => b.active !== false);
  if (activeBanners.length === 0) return;

  let current = 0;
  let interval;

  function buildSlides() {
    slider.innerHTML = '';
    dotsWrap && (dotsWrap.innerHTML = '');

    activeBanners.forEach((banner, i) => {
      // Slide
      const slide = document.createElement('div');
      slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
      slide.style.background = banner.bgColor || '#FAFAFA';

      const textColor = banner.textColor || '#0A0A0A';
      const accentBg  = banner.accentColor || '#FFE500';

      slide.innerHTML = `
        <div class="hero-content" style="width:100%">
          <div class="hero-text">
            <span class="hero-subtitle" style="background:${accentBg};color:${textColor};border-color:${textColor}">${banner.subtitle || ''}</span>
            <h1 class="hero-title" style="color:${textColor}">${banner.title || ''}</h1>
            <p class="hero-desc" style="color:${textColor};opacity:0.75">${banner.description || ''}</p>
            <a href="${banner.link || 'products.html'}" class="btn-primary" style="background:${accentBg};color:${textColor};border-color:${textColor}">${banner.cta || 'SHOP NOW'}</a>
          </div>
          <div class="hero-shape">
            <div class="hero-shape-inner" style="background:${accentBg};color:${textColor};border-color:${textColor}">
              <span>${banner.title || 'KELVIN'}</span>
            </div>
          </div>
        </div>`;
      slider.appendChild(slide);

      // Dot
      if (dotsWrap) {
        const dot = document.createElement('button');
        dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i+1));
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      }
    });
  }

  function goTo(idx) {
    const slides = slider.querySelectorAll('.hero-slide');
    const dots   = dotsWrap ? dotsWrap.querySelectorAll('.hero-dot') : [];

    slides[current] && slides[current].classList.remove('active');
    dots[current]   && dots[current].classList.remove('active');

    current = (idx + activeBanners.length) % activeBanners.length;

    slides[current] && slides[current].classList.add('active');
    dots[current]   && dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startInterval() {
    clearInterval(interval);
    interval = setInterval(next, 4000);
  }

  buildSlides();
  startInterval();

  const btnNext = document.getElementById('hero-next');
  const btnPrev = document.getElementById('hero-prev');
  if (btnNext) btnNext.addEventListener('click', () => { next(); startInterval(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { prev(); startInterval(); });

  // Pause on hover
  slider.addEventListener('mouseenter', () => clearInterval(interval));
  slider.addEventListener('mouseleave', startInterval);
}

// Page transition
function initPageTransition() {
  document.body.classList.add('page-enter');
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initPageTransition();
});
