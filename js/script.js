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

        this.startX = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.threshold = 50; // минимальное смещение для листания

        this.init();
    }

    init() {
        this.createDots();
        this.setActiveSlide(this.currentSlide);
        this.addSwipeEvents();
    }

    createDots() {
        this.dotsContainer.innerHTML = '';
        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('system__dot');
            if (index === this.currentSlide) dot.classList.add('active');
            dot.addEventListener('click', () => this.setActiveSlide(index));
            this.dotsContainer.appendChild(dot);
        });
    }

    setActiveSlide(index) {
        this.slides.forEach((slide, i) =>
            slide.classList.toggle('active', i === index)
        );
        const dots = this.dotsContainer.querySelectorAll('.system__dot');
        dots.forEach((dot, i) =>
            dot.classList.toggle('active', i === index)
        );

        const slideWidth = this.slides[0].offsetWidth + 24;
        const sliderWidth = this.slider.offsetWidth;
        const target = index * slideWidth;
        const centerOffset = (sliderWidth - slideWidth) / 2;
        const translateX = -target + centerOffset;

        this.track.style.transition = 'transform 0.5s ease';
        this.track.style.transform = `translateX(${translateX}px)`;

        this.currentSlide = index;
    }

    addSwipeEvents() {
        const start = (x) => {
            this.isDragging = true;
            this.startX = x;
            this.track.style.transition = 'none';
        };

        const move = (x) => {
            if (!this.isDragging) return;
            this.currentX = x;
            const diff = this.currentX - this.startX;
            const slideWidth = this.slides[0].offsetWidth + 0;
            const sliderWidth = this.slider.offsetWidth;
            const target = this.currentSlide * slideWidth;
            const centerOffset = (sliderWidth - slideWidth) / 2;
            const translateX = -target + centerOffset + diff;
            this.track.style.transform = `translateX(${translateX}px)`;
        };

        const end = () => {
            if (!this.isDragging) return;
            this.isDragging = false;

            const diff = this.currentX - this.startX;
            if (Math.abs(diff) > this.threshold) {
                if (diff < 0 && this.currentSlide < this.slides.length - 1) {
                    this.currentSlide++;
                } else if (diff > 0 && this.currentSlide > 0) {
                    this.currentSlide--;
                }
            }
            this.setActiveSlide(this.currentSlide);
        };

        // Мышь
        this.slider.addEventListener('mousedown', (e) => start(e.clientX));
        this.slider.addEventListener('mousemove', (e) => move(e.clientX));
        this.slider.addEventListener('mouseup', end);
        this.slider.addEventListener('mouseleave', end);

        // Тач
        this.slider.addEventListener('touchstart', (e) => start(e.touches[0].clientX));
        this.slider.addEventListener('touchmove', (e) => move(e.touches[0].clientX));
        this.slider.addEventListener('touchend', end);
    }
}

// Инициализация слайдера когда DOM загружен
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
