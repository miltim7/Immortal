// js\hover.js

(() => {
    const CONFIG = {
        selector: 'a, button',
        duration: 220,
        easing: 'ease',
    };

    const STYLE_ID = 'js-slide-hover-style';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const css = `
    .js-slide-link { 
      display:inline-block;
      overflow:hidden;  /* обрезаем дублирующийся текст */
    }
    .js-slide-wrap  {
      display:inline-block;
      position:relative;
      overflow:hidden;
      vertical-align:middle;
    }
    .js-slide-inner {
      display:flex;
      flex-direction:column;
      gap:0;
      transform:translateY(0);
      transition:transform var(--slide-dur, ${CONFIG.duration}ms) var(--slide-ease, ${CONFIG.easing});
      will-change: transform;
    }
    .js-slide-layer {
      display:flex;
      align-items:center;
      line-height:inherit;
      margin:0;
    }
    .js-slide-link:hover .js-slide-inner,
    .js-slide-link:focus-visible .js-slide-inner {
      transform:translateY(-50%);
    }
    
    /* Inactive состояние для карточек */
    .system__item:not(.active) .js-slide-link {
      opacity: 0.6;
    }
    .system__item:not(.active) .js-slide-link * {
      border: none !important;
      animation: none !important;
    }
    `;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    function alreadyProcessed(el) {
        return el.classList.contains('js-slide-link') || el.dataset.slideInit === '1';
    }

    function measureAndLockHeight(wrap, firstLayer) {
        wrap.style.height = 'auto';
        const h = firstLayer.getBoundingClientRect().height;
        wrap.style.height = h + 'px';
        return h;
    }

    function buildSlide(el) {
        if (alreadyProcessed(el) || el.hasAttribute('data-noslide')) return;

        el.classList.add('js-slide-link');
        el.style.setProperty('--slide-dur', CONFIG.duration + 'ms');
        el.style.setProperty('--slide-ease', CONFIG.easing);

        // переносим весь текущий контент в слой
        const top = document.createElement('span');
        top.className = 'js-slide-layer';
        while (el.firstChild) top.appendChild(el.firstChild);

        const bottom = top.cloneNode(true);
        bottom.setAttribute('aria-hidden', 'true');

        const inner = document.createElement('span');
        inner.className = 'js-slide-inner';
        inner.appendChild(top);
        inner.appendChild(bottom);

        const wrap = document.createElement('span');
        wrap.className = 'js-slide-wrap';
        wrap.appendChild(inner);

        el.appendChild(wrap);

        // фиксируем точную высоту первой «строки»
        measureAndLockHeight(wrap, top);

        // ресайз/смена шрифта
        const ro = new ResizeObserver(() => measureAndLockHeight(wrap, top));
        ro.observe(top);
        el._slideRO = ro;

        el.dataset.slideInit = '1';
    }

    function initAll(root = document) {
        injectStyles();
        root.querySelectorAll(CONFIG.selector).forEach(buildSlide);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll, { once: true });
    } else {
        initAll();
    }

    // динамически добавленные элементы
    const mo = new MutationObserver((list) => {
        for (const m of list) {
            if (m.type === 'childList') {
                m.addedNodes.forEach(node => {
                    if (!(node instanceof Element)) return;
                    if (node.matches?.(CONFIG.selector)) buildSlide(node);
                    node.querySelectorAll?.(CONFIG.selector).forEach(buildSlide);
                });
            }
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    window.SlideHover = {
        refresh: () => initAll(),
        exclude: (el) => el.setAttribute('data-noslide', ''),
        config: (opts) => Object.assign(CONFIG, opts),
    };
})();