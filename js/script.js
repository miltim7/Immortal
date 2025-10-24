// js\script.js

document.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > 10) {
        header.classList.add('header--blur');
    } else {
        header.classList.remove('header--blur');
    }
});

class SystemSlider {
  constructor() {
    this.slider = document.querySelector('.system__slider');
    this.track = document.querySelector('.system__track');
    this.slides = Array.from(document.querySelectorAll('.system__item'));
    this.dotsContainer = document.querySelector('.system__dots');

    this.currentSlide = 1;
    this.DESIRED_GAP = 24;
    this.INACTIVE_SCALE = 0.75;
    this.threshold = 50;
    this.TAP_SLOP = 8;

    this.startX = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.tapStartIndex = null;

    this.resizeObserver = null;

    this.init();
  }

  clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  getGap() {
    const s = getComputedStyle(this.track);
    return parseFloat(s.columnGap || s.gap) || 0;
  }

  getSlideStep() {
    if (this.slides.length > 1) {
      return this.slides[1].offsetLeft - this.slides[0].offsetLeft;
    }
    return this.slides[0].offsetWidth + this.getGap();
  }

  getCurrentTranslateX() {
    const t = getComputedStyle(this.track).transform;
    if (!t || t === 'none') return 0;
    try {
      const m = new DOMMatrixReadOnly(t);
      return m.m41 || 0;
    } catch {
      return 0;
    }
  }

  recalcLayout() {
    if (!this.slides.length) return;
    const slideW = this.slides[0].offsetWidth;
    this.slider.style.maxWidth = (slideW * 3 + this.DESIRED_GAP * 2) + 'px';

    const sliderW = this.slider.offsetWidth;
    const sidePad = Math.max(0, (sliderW - slideW) / 2);
    this.track.style.paddingInline = sidePad + 'px';
  }

  init() {
    if (!this.slider || !this.track || !this.slides.length) return;

    this.slider.style.userSelect = 'none';
    this.slider.style.touchAction = 'pan-y';
    this.track.style.gap = this.DESIRED_GAP + 'px';
    
    this.track.style.transition = 'none';

    this.slides.forEach((slide) => {
      slide.style.transition = 'none';
      slide.style.willChange = 'transform, margin';
      slide.style.transformOrigin = 'center';
      slide.style.cursor = 'pointer';
    });

    this.recalcLayout();
    this.applyScaleCompensation();
    this.createDots();

    const imgPromises = Array.from(this.slider.querySelectorAll('img')).map(img =>
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve())
    );
    const fontPromise = (document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve());

    Promise.all([fontPromise, ...imgPromises]).finally(() => {
      this.recalcLayout();
      this.applyScaleCompensation();
      
      void this.track.offsetHeight;
      
      this.setActiveSlideInstant(this.currentSlide);
      
      // Включаем плавные transitions с улучшенным easing
      setTimeout(() => {
        this.track.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.slides.forEach((slide) => {
          slide.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), margin 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
      }, 100);
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.recalcLayout();
      this.applyScaleCompensation();
      this.setActiveSlideInstant(this.currentSlide);
    });
    this.resizeObserver.observe(this.track);

    window.addEventListener('resize', () => {
      this.recalcLayout();
      this.applyScaleCompensation();
      this.setActiveSlideInstant(this.currentSlide);
    });

    this.addSwipeEvents();
  }

  applyScaleCompensation() {
    const baseW = this.slides[0].offsetWidth;
    const comp = ((1 - this.INACTIVE_SCALE) * baseW) / 2;

    this.slides.forEach((slide, i) => {
      if (i === this.currentSlide) {
        slide.style.transform = 'scale(1)';
        slide.style.marginInline = '0px';
        slide.style.opacity = '1';
        slide.classList.add('active');
      } else {
        slide.style.transform = 'scale(' + this.INACTIVE_SCALE + ')';
        slide.style.marginInline = (-comp) + 'px';
        slide.style.opacity = '0.6';
        slide.classList.remove('active');
      }
    });
}

  createDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';

    this.slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.classList.add('system__dot');
      if (i === this.currentSlide) dot.classList.add('active');
      dot.addEventListener('click', () => {
        this.setActiveSlide(i);
      });
      this.dotsContainer.appendChild(dot);
    });
  }
  
  setActiveSlideInstant(index) {
    this.currentSlide = this.clamp(index, 0, this.slides.length - 1);
    this.applyScaleCompensation();

    if (this.dotsContainer) {
      const dots = this.dotsContainer.querySelectorAll('.system__dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === this.currentSlide);
      });
    }
    
    void this.track.offsetHeight;
    void this.slides[this.currentSlide].offsetLeft;
    
    const sliderWidth = this.slider.offsetWidth;
    const active = this.slides[this.currentSlide];
    const slideLeft = active.offsetLeft;
    const slideWidth = active.offsetWidth;
    const centerOffset = (sliderWidth - slideWidth) / 2;
    const translateX = -slideLeft + centerOffset;
    
    this.track.style.transform = 'translateX(' + translateX + 'px)';
  }

  setActiveSlide(index) {
    this.currentSlide = this.clamp(index, 0, this.slides.length - 1);
    
    // Временно отключаем transition только для margin
    this.slides.forEach(slide => {
      const currentTransition = slide.style.transition;
      slide.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });
    
    this.applyScaleCompensation();

    if (this.dotsContainer) {
      const dots = this.dotsContainer.querySelectorAll('.system__dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === this.currentSlide);
      });
    }
    
    // Принудительный reflow
    void this.track.offsetHeight;
    void this.slides[this.currentSlide].offsetLeft;
    
    // Возвращаем полный transition
    this.slides.forEach(slide => {
      slide.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), margin 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });
    
    this.track.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    requestAnimationFrame(() => {
      const sliderWidth = this.slider.offsetWidth;
      const active = this.slides[this.currentSlide];
      const slideLeft = active.offsetLeft;
      const slideWidth = active.offsetWidth;
      const centerOffset = (sliderWidth - slideWidth) / 2;
      const translateX = -slideLeft + centerOffset;

      this.track.style.transform = 'translateX(' + translateX + 'px)';
    });
  }

  addSwipeEvents() {
    const getSlideIndexFromEl = (el) => {
      if (!el || !el.closest) return null;
      const item = el.closest('.system__item');
      if (!item) return null;
      const idx = this.slides.indexOf(item);
      return idx >= 0 ? idx : null;
    };

    const start = (x, startEvent) => {
      this.isDragging = true;
      this.startX = x;
      this.currentX = x;
      this.track.style.transition = 'none';
      this.tapStartIndex = getSlideIndexFromEl(startEvent.target);
    };

    const move = (x) => {
      if (!this.isDragging) return;
      this.currentX = x;
      const diff = this.currentX - this.startX;

      const sliderWidth = this.slider.offsetWidth;
      const active = this.slides[this.currentSlide];
      const slideLeft = active.offsetLeft;
      const slideWidth = active.offsetWidth;
      const centerOffset = (sliderWidth - slideWidth) / 2;
      const baseTranslate = -slideLeft + centerOffset;

      this.track.style.transform = 'translateX(' + (baseTranslate + diff) + 'px)';
    };

    const end = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      const diff = this.currentX - this.startX;

      if (Math.abs(diff) <= this.TAP_SLOP && this.tapStartIndex !== null) {
        this.setActiveSlide(this.tapStartIndex);
        this.tapStartIndex = null;
        return;
      }

      if (Math.abs(diff) <= this.TAP_SLOP) {
        let clientX = this.startX + diff;
        if (e && e.changedTouches && e.changedTouches[0]) {
          clientX = e.changedTouches[0].clientX;
        } else if (e && 'clientX' in e) {
          clientX = e.clientX;
        }

        const sliderLeft = this.slider.getBoundingClientRect().left;
        const localX = clientX - sliderLeft;

        const currentTX = this.getCurrentTranslateX();
        const xInTrackSpace = localX - currentTX;

        let nearest = this.currentSlide;
        let minDist = Infinity;
        this.slides.forEach((el, i) => {
          const center = el.offsetLeft + el.offsetWidth / 2;
          const dist = Math.abs(center - xInTrackSpace);
          if (dist < minDist) {
            minDist = dist;
            nearest = i;
          }
        });

        this.setActiveSlide(nearest);
        this.tapStartIndex = null;
        return;
      }

      const step = this.getSlideStep();
      let deltaSlides = Math.round((diff / step) * -1);
      if (Math.abs(diff) > this.threshold && deltaSlides === 0) {
        deltaSlides = diff < 0 ? 1 : -1;
      }

      const target = this.clamp(this.currentSlide + deltaSlides, 0, this.slides.length - 1);
      this.setActiveSlide(target);
      this.tapStartIndex = null;
    };

    this.slider.addEventListener('mousedown', (e) => {
      e.preventDefault();
      start(e.clientX, e);
    });
    this.slider.addEventListener('mousemove', (e) => move(e.clientX));
    this.slider.addEventListener('mouseup', end);
    this.slider.addEventListener('mouseleave', end);

    this.slider.addEventListener('touchstart', (e) => {
      start(e.touches[0].clientX, e);
    }, { passive: true });

    this.slider.addEventListener('touchmove', (e) => {
      move(e.touches[0].clientX);
    }, { passive: true });

    this.slider.addEventListener('touchend', end, { passive: true });
    this.slider.addEventListener('touchcancel', end, { passive: true });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SystemSlider();
});
  



// Выбираем все элементы, которые нужно анимировать
const animItems = document.querySelectorAll('.animate');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('active');

            const textElements = el.querySelectorAll('.animate-text');
            textElements.forEach(textEl => {
                if (!textEl.dataset.split) {
                    const text = textEl.textContent;
                    textEl.textContent = '';

                    text.split('').forEach((char, i) => {
                        const span = document.createElement('span');
                        span.textContent = char;
                        span.style.color = 'rgba(63, 63, 63, 1)';
                        span.style.transition = 'color 0.3s ease';
                        span.style.transitionDelay = `${i * 0.05}s`;
                        textEl.appendChild(span);
                    });

                    textEl.dataset.split = true;

                    setTimeout(() => {
                        const spans = textEl.querySelectorAll('span');
                        spans.forEach(span => span.style.color = 'rgba(255, 255, 255, 1)');
                    }, 50);
                }
            });

            observer.unobserve(el);
        }
    });
}, {
    threshold: 0.3
});

animItems.forEach(el => observer.observe(el));
// Находим все ссылки с якорями
const anchorLinks = document.querySelectorAll('a[href^="#"]');

anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // отключаем стандартный переход

        const targetId = link.getAttribute('href').substring(1); // убираем #
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
            // Плавный скролл к элементу
            targetEl.scrollIntoView({
                behavior: 'smooth', // плавно
                block: 'start'      // прижимает к верху окна
            });
        }
    });
});

(function () {
    const container = document.querySelector('.tech__container');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.tech__item'));
    if (!items.length) return;

    function px(val) {
        return Number.parseFloat(val || '0') || 0;
    }

    function applyEqualWidths() {
        // mobile: не фиксируем ширины
        const isMobile = matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            items.forEach(it => {
                it.style.flexBasis = '';
                it.style.minWidth = '';
                it.style.maxWidth = '';
            });
            return;
        }

        const cs = getComputedStyle(container);
        // в flex контейнере используем column-gap (или fallback на gap)
        const colGap = px(cs.columnGap || cs.gap || '20px');
        const n = items.length;
        const totalGaps = colGap * (n - 1);

        // ширина, доступная под колонки
        const inner = container.clientWidth - totalGaps;
        const column = Math.floor(inner / n);

        items.forEach(it => {
            it.style.flexBasis = column + 'px';
            it.style.minWidth = column + 'px';
            it.style.maxWidth = column + 'px';
        });
    }

    // высоты карточек (из прошлой задачи) — чтобы всё было ровно и по высоте
    function syncHeights() {
        const cards = container.querySelectorAll('.tech__card');
        if (!cards.length) return;
        // на мобилке — естественная высота
        const isMobile = matchMedia('(max-width: 1024px)').matches;
        let max = 0;
        cards.forEach(c => { c.style.height = 'auto'; });
        if (isMobile) return;
        cards.forEach(c => { max = Math.max(max, c.offsetHeight); });
        cards.forEach(c => { c.style.height = max + 'px'; });
    }

    const rerun = () => { applyEqualWidths(); syncHeights(); };

    // реагируем на ресайз и загрузку
    window.addEventListener('resize', rerun, { passive: true });
    window.addEventListener('load', rerun);

    // если контент/шрифты поменяются — пересчитать
    const ro = new ResizeObserver(rerun);
    ro.observe(container);

    // на случай динамического изменения текста внутри карточек
    const mo = new MutationObserver(rerun);
    mo.observe(container, { subtree: true, childList: true, characterData: true });
})();


const form = document.getElementById('contactForm');
const btn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1️⃣ loading state
    btn.classList.add('loading');
    btn.textContent = 'Отправка...';
    btn.disabled = true;

    // имитация запроса
    await new Promise(res => setTimeout(res, 2500));

    // 2️⃣ success state
    btn.classList.remove('loading');
    btn.classList.add('success');
    btn.textContent = 'Отправлено';

    // (опционально) разблокировать и вернуть обратно через несколько секунд
    setTimeout(() => {
        btn.classList.remove('success');
        btn.textContent = 'Отправить';
        btn.disabled = false;
    }, 2000);
});
