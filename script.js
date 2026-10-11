/* ==========================================================================
   The Holistic Himalayas — scroll film
   GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.13, vanilla JS.
   Order: helpers → global chrome → preloader → chapters 1–9 → boot
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasLibs = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animated = hasLibs && !reduceMotion;
  const FINAL_SCALE = 1.15; // pouch scale at the end of Chapter 6

  try { history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }

  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  const dotLinks = $$('.dots a');
  const progressBar = $('#progress');

  let lenis = null;
  let menuOpen = false;
  let introDone = !animated; // nav stays hidden until the hero has played

  /* ---------- small helpers ---------- */
  const debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  // Split an element's text into words (keeps inline children such as <em>).
  // Each word becomes <span.w><span.wi>word</span></span>; returns the inner spans.
  function splitWords(el) {
    const words = [];
    const walk = (src, dest) => {
      Array.from(src.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { dest.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            const i = document.createElement('span');
            w.className = 'w';
            i.className = 'wi';
            i.textContent = part;
            w.appendChild(i);
            dest.appendChild(w);
            words.push(i);
          });
        } else if (n.nodeType === 1) {
          const clone = n.cloneNode(false);
          dest.appendChild(clone);
          walk(n, clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(el, frag);
    el.textContent = '';
    el.appendChild(frag);
    return words;
  }

  function splitLetters(el) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    return Array.from(text).map((ch) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
      return s;
    });
  }

  const imgReady = (img) => new Promise((res) => {
    if (img.complete) { res(); return; }
    img.addEventListener('load', res, { once: true });
    img.addEventListener('error', res, { once: true });
  });

  /* ---------- nav state (theme, solid, hide-on-scroll) ---------- */
  let baseTheme = 'dark';
  let night = false;       // Chapter 5 night scene forces dark chrome
  let solid = false;

  function applyNav() {
    const theme = night ? 'dark' : baseTheme;
    nav.classList.toggle('is-solid', solid);
    nav.classList.toggle('on-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme === 'light');
  }

  function setActiveDot(n) {
    dotLinks.forEach((a) => a.classList.toggle('is-active', Number(a.dataset.dot) === n));
  }

  let lastY = 0;
  window.addEventListener('scroll', () => {
    if (!introDone || menuOpen) return;
    const y = window.scrollY;
    if (y > 140 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 140) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- mobile menu ---------- */
  function openMenu() {
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.add('menu-open');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('menu-open');
    if (lenis) lenis.start(); else document.body.style.overflow = '';
  }
  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- anchors (Lenis scrollTo when available) ---------- */
  function goTo(el) {
    if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const h = a.getAttribute('href');
      if (h === '#') { e.preventDefault(); return; }
      const target = $(h);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      goTo(target);
    });
  });

  /* ==========================================================================
     CHAPTER 6 helper — callout lines are laid out in pixels from the real DOM
     ========================================================================== */
  function layoutCraft() {
    const stage = $('#craftStage');
    const frame = $('.pouch-frame');
    const svg = $('#craftLines');
    if (!stage || !frame || !svg) return;
    const paths = $$('path', svg);
    const dots = $$('circle', svg);
    const callouts = $$('.callout', stage);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const fw = frame.offsetWidth * FINAL_SCALE;
    const fh = frame.offsetHeight * FINAL_SCALE;
    const cx = frame.offsetLeft + frame.offsetWidth / 2;
    const cy = frame.offsetTop + frame.offsetHeight / 2;
    const targets = [[-0.2, -0.22], [0.2, -0.02], [-0.14, 0.28]];

    callouts.forEach((c, i) => {
      const right = c.classList.contains('right');
      const sx = right ? c.offsetLeft - 10 : c.offsetLeft + c.offsetWidth + 10;
      const sy = c.offsetTop + c.offsetHeight / 2;
      const ex = cx + targets[i][0] * fw;
      const ey = cy + targets[i][1] * fh;
      const stub = right ? sx - 26 : sx + 26;
      paths[i].setAttribute('d', `M${sx} ${sy} L${stub} ${sy} L${ex} ${ey}`);
      dots[i].setAttribute('cx', ex);
      dots[i].setAttribute('cy', ey);
    });
  }

  // Library progress UI shared by the swipe carousel and the pinned track
  function setLibProgress(p) {
    const bar = $('#libBar');
    const cur = $('#libCur');
    if (bar) bar.style.transform = `scaleX(${0.2 + 0.8 * p})`;
    if (cur) cur.textContent = String(Math.round(p * 4) + 1).padStart(2, '0');
  }

  // Swipe carousel. With fx on (animated phones) the card nearest the centre
  // stays full size while its neighbours shrink and fade, and photos slide inside their frames.
  function bindCarousel(fx) {
    const track = $('#libTrack');
    if (!track) return () => {};
    const panels = $$('.panel', track);
    const hint = $('.swipe-hint');
    let ticking = false;

    const update = () => {
      ticking = false;
      const max = track.scrollWidth - track.clientWidth;
      setLibProgress(max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0);
      if (hint && track.scrollLeft > 8) hint.classList.add('is-gone');
      if (!fx) return;
      const mid = track.scrollLeft + track.clientWidth / 2;
      panels.forEach((p) => {
        const off = p.offsetLeft + p.offsetWidth / 2 - mid;
        const d = Math.min(1, Math.abs(off) / (track.clientWidth * 0.75));
        p.style.transform = `scale(${1 - 0.07 * d})`;
        p.style.opacity = String(1 - 0.5 * d);
        const img = p.querySelector('.panel-img img');
        if (img) img.style.transform = `translateX(${(-off * 0.07).toFixed(1)}px)`;
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      panels.forEach((p) => {
        p.style.transform = ''; p.style.opacity = '';
        const img = p.querySelector('.panel-img img');
        if (img) img.style.transform = '';
      });
    };
  }

  /* ==========================================================================
     STATIC MODE — reduced motion, or the CDN libraries failed to load
     No Lenis, no pinning, no parallax, no preloader: just 0.4s fades.
     ========================================================================== */
  function initStatic() {
    root.classList.add('rm');
    root.classList.remove('anim', 'is-loading');
    const pre = $('#preloader');
    if (pre) pre.remove();

    const fades = $$('[data-reveal],[data-split],[data-fade],.card');
    fades.forEach((el) => el.classList.add('rm-fade'));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      fades.forEach((el) => io.observe(el));
    } else {
      fades.forEach((el) => el.classList.add('in'));
    }

    const secs = $$('main > section[data-chapter]');
    const update = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      solid = y > vh - 90;
      let cur = secs[0];
      let active = 1;
      secs.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= 70) cur = s;
        if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) active = Number(s.dataset.chapter);
      });
      baseTheme = cur.dataset.theme;
      applyNav();
      setActiveDot(active);
      const max = document.documentElement.scrollHeight - vh;
      progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', debounce(() => { layoutCraft(); update(); }, 200));
    window.addEventListener('load', () => { layoutCraft(); update(); });
    layoutCraft();
    update();
    bindCarousel();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutCraft);
  }

  if (!animated) {
    initStatic();
    return;
  }

  /* ==========================================================================
     ANIMATED MODE
     ========================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
  root.classList.add('anim', 'is-loading');
  nav.classList.add('is-hidden');
  window.scrollTo(0, 0);

  // Lenis smooth scroll, driven by the GSAP ticker
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.08 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- split headlines once (matchMedia re-runs must not re-split) ---------- */
  const heroWords = splitWords($('[data-hero]'));
  $$('[data-split]').forEach((el) => splitWords(el));
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set('.hero-fade', { opacity: 0, y: 24 });

  /* ---------- custom cursor (desktop, fine pointer only) ---------- */
  function initCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    root.classList.add('has-cursor');
    const dot = $('.cur-dot');
    const ring = $('.cur-ring');
    gsap.set([dot, ring], { x: -100, y: -100 });
    gsap.set(ring, { scale: 0.3, opacity: 0 });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });
    window.addEventListener('mousemove', (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });

    let mode = '';
    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      if (!t.closest) return;
      let next = '';
      if (t.closest('.map-wrap')) next = 'hidden';
      else if (t.closest('[data-cursor="view"]')) next = 'view';
      else if (t.closest('a, button')) next = 'link';
      if (next === mode) return;
      mode = next;
      gsap.to(dot, {
        scale: next === 'view' ? 0 : next === 'link' ? 2.2 : 1,
        opacity: next === 'hidden' ? 0 : 1,
        duration: 0.35, ease: 'power3.out', overwrite: 'auto'
      });
      gsap.to(ring, {
        scale: next === 'view' ? 1 : 0.3,
        opacity: next === 'view' ? 1 : 0,
        duration: 0.45, ease: 'power3.out', overwrite: 'auto'
      });
    });
    document.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.2, overwrite: 'auto' }));
    document.addEventListener('mouseenter', () => gsap.to(dot, { opacity: 1, duration: 0.2, overwrite: 'auto' }));
  }

  /* ==========================================================================
     CHAPTER 0 — PRELOADER
     ========================================================================== */
  function runPreloader() {
    const pre = $('#preloader');
    const letters = splitLetters($('.pre-title'));
    const bar = $('.pre-line span');
    const imgs = $$('img[data-preload]');
    imgs.forEach((i) => { i.loading = 'eager'; });

    const jobs = [
      (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve(),
      ...imgs.map(imgReady)
    ];
    let done = 0;
    const tick = () => {
      done += 1;
      gsap.to(bar, { scaleX: done / jobs.length, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    };
    const loaded = Promise.all(jobs.map((p) => p.then(tick, tick)));
    const maxWait = new Promise((r) => setTimeout(r, 2500));

    const lettersIn = new Promise((resolve) => {
      gsap.from(letters, {
        opacity: 0, y: 14, duration: 0.9, ease: 'power3.out', stagger: 0.045, onComplete: resolve
      });
    });

    Promise.all([Promise.race([loaded, maxWait]), lettersIn]).then(() => {
      gsap.to(bar, { scaleX: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      ScrollTrigger.refresh();
      gsap.to(pre, {
        yPercent: -140, duration: 1.2, ease: 'power3.inOut', delay: 0.4, // -140 carries the mist trail off-screen too
        onComplete: () => { pre.remove(); heroIntro(); }
      });
    });

    // Safety net: never trap the visitor behind the preloader
    setTimeout(() => {
      if (document.body.contains(pre) && !root.classList.contains('intro-started')) {
        gsap.killTweensOf(pre);
        pre.remove();
        heroIntro();
      }
    }, 7000);
  }

  function heroIntro() {
    if (root.classList.contains('intro-started')) return;
    root.classList.add('intro-started');
    root.classList.remove('is-loading');
    window.scrollTo(0, 0);
    if (lenis) { lenis.scrollTo(0, { immediate: true }); lenis.start(); }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(heroWords, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 0)
      .to('.hero-fade', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.45)
      .add(() => { introDone = true; nav.classList.remove('is-hidden'); }, 0.6);
  }

  /* ==========================================================================
     CHAPTERS — built inside gsap.matchMedia (desktop / mobile)
     Pinned chapters are created in page order so pin-spacing stays correct.
     ========================================================================== */

  // Text blocks and headlines: the reveal pattern used everywhere
  function reveals() {
    $$('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        opacity: 0, y: 32, filter: 'blur(6px)', duration: 1, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true }
      });
    });
    $$('[data-split]').forEach((el) => {
      const words = $$('.wi', el);
      gsap.from(words, {
        yPercent: 110, duration: 1.1, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* Chapter 1 — camera flies into the valley */
  function heroScroll(k) {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '#chapter-1', start: 'top top', end: 'bottom top', scrub: 1 }
    });
    tl.to('.hero-scene', { scale: 1.15, duration: 1 }, 0)
      .to('.layer.far',   { yPercent: 10 * k, duration: 1 }, 0)
      .to('.layer.mid',   { yPercent: 25 * k, duration: 1 }, 0)
      .to('.layer.near',  { yPercent: 45 * k, duration: 1 }, 0)
      .to('.layer.front', { yPercent: 70 * k, duration: 1 }, 0)
      .to('.hero-content', { opacity: 0, y: -110 * k, duration: 0.55 }, 0);
  }

  /* Chapter 2 — three lines, pinned for 150% */
  function source(isDesktop) {
    const stage = $('.source-stage');
    const lines = $$('.s-line', stage);
    const photos = $$('.s-photo', stage);
    const sub = $('.s-sub', stage);
    const bg = $('.source-bg', stage);
    const blur = isDesktop ? 14 : 6; // lighter blur keeps phones at 60fps
    const hidden = { opacity: 0, filter: `blur(${blur}px)`, y: 30 };

    gsap.set(lines.slice(1), hidden);
    gsap.set(photos, { opacity: 0, scale: 0.9 });
    gsap.set(sub, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      // shorter pin on phones so a thumb-flick never feels stuck
      scrollTrigger: { trigger: stage, start: 'top top', end: isDesktop ? '+=150%' : '+=115%', pin: true, scrub: 1, anticipatePin: 1 }
    });
    tl.to(bg, { opacity: 1, duration: 3 }, 0)
      .to(photos[0], { opacity: 0.6, scale: 1, duration: 0.5 }, 0);
    for (let i = 0; i < 2; i += 1) {
      tl.to(lines[i], { opacity: 0, filter: `blur(${blur}px)`, y: -30, duration: 0.4 }, i + 0.7)
        .to(photos[i], { opacity: 0, scale: 1.08, duration: 0.4 }, i + 0.7)
        .to(lines[i + 1], { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.45 }, i + 0.9)
        .to(photos[i + 1], { opacity: 0.6, scale: 1, duration: 0.5 }, i + 0.9);
    }
    tl.to(sub, { opacity: 1, y: 0, duration: 0.4 }, 2.3)
      .to({}, { duration: 0.3 }, 2.7);
  }

  /* Chapter 3 — framed photos at different parallax speeds + Ken Burns */
  function river(k) {
    const speeds = [-7, -16, -26];
    $$('.river .frame').forEach((frame, i) => {
      gsap.to(frame, {
        yPercent: speeds[i] * k, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
      gsap.fromTo($('img', frame), { scale: 1.15 }, {
        scale: 1, duration: 2.4, ease: 'power3.out',
        scrollTrigger: { trigger: frame, start: 'top 88%', once: true }
      });
    });
    gsap.to('.big-num', {
      yPercent: -18 * k, ease: 'none',
      scrollTrigger: { trigger: '.river', start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  }

  /* Chapter 4 — pinned horizontal track (desktop) / swipe carousel (mobile) */
  function library(isDesktop) {
    const track = $('#libTrack');
    const stage = $('.lib-stage');
    if (!isDesktop) return bindCarousel(true);

    root.classList.add('anim-h');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: stage, start: 'top top',
        // one viewport-width of track per scroll pixel, capped so the pin never exceeds 2.5 screens
        end: () => '+=' + Math.min(track.scrollWidth, window.innerHeight * 2.5),
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => setLibProgress(self.progress)
      }
    });
    setLibProgress(0);

    // inner image parallax: each photo drifts opposite to the track
    $$('.panel', track).forEach((panel) => {
      gsap.fromTo($('img', panel), { xPercent: -4 }, {
        xPercent: 4, ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
    });
    return () => root.classList.remove('anim-h');
  }

  /* Chapter 5 — three scenes, colour shifts, sun travels the arc and becomes a moon */
  function rituals(isDesktop) {
    const sec = $('#chapter-5');
    const stage = $('.rit-stage', sec);
    const scenes = $$('.scene', stage);
    const circs = $$('.circ', stage);
    const bg2 = $('.rit-bg-2', stage);
    const bg3 = $('.rit-bg-3', stage);
    const path = $('.arc-path', stage);
    const orb = $('.orb', stage);
    const sun = $('.orb-sun', stage);
    const moon = $('.orb-moon', stage);
    const total = path.getTotalLength();
    const place = (p) => {
      const pt = path.getPointAtLength(total * p);
      orb.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    };

    place(0);
    gsap.set(scenes.slice(1), { autoAlpha: 0, y: 24 });
    gsap.set(moon, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage, start: 'top top', end: isDesktop ? '+=200%' : '+=160%', pin: true, scrub: 1, anticipatePin: 1,
        onUpdate: (self) => {
          place(self.progress);
          const isNight = self.progress > 0.66;
          if (isNight !== night) {
            night = isNight;
            sec.classList.toggle('is-night', isNight);
            applyNav();
          }
        },
        onLeaveBack: () => { night = false; sec.classList.remove('is-night'); applyNav(); }
      }
    });
    tl.to(bg2, { opacity: 1, duration: 0.4 }, 0.8)
      .to(bg3, { opacity: 1, duration: 0.4 }, 1.8)
      .to(scenes[0], { autoAlpha: 0, y: -24, duration: 0.3 }, 0.85)
      .to(scenes[1], { autoAlpha: 1, y: 0, duration: 0.3 }, 1.0)
      .to(scenes[1], { autoAlpha: 0, y: -24, duration: 0.3 }, 1.85)
      .to(scenes[2], { autoAlpha: 1, y: 0, duration: 0.3 }, 2.0)
      .to(sun, { opacity: 0, duration: 0.3 }, 1.8)
      .to(moon, { opacity: 1, duration: 0.3 }, 1.9);
    circs.forEach((c, i) => {
      tl.fromTo(c, { rotation: -8 }, { rotation: 8, duration: 1.1 }, Math.max(0, i - 0.05));
    });
    tl.to({}, { duration: 0.2 }, 2.8);

    // once the section is scrolled past, the navbar follows the next chapter's theme again
    ScrollTrigger.create({
      trigger: sec, start: 'bottom 70px', end: 'max',
      onEnter: () => { night = false; applyNav(); },
      onLeaveBack: () => { night = sec.classList.contains('is-night'); applyNav(); }
    });
  }

  /* Chapter 6 — pouch grows, callouts draw themselves */
  function craft(isDesktop) {
    const stage = $('#craftStage');
    const frame = $('.pouch-frame', stage);
    const svg = $('#craftLines');
    const paths = $$('path', svg);
    const dots = $$('circle', svg);
    const callouts = $$('.callout', stage);
    const foot = $('.craft-foot', stage);

    layoutCraft();
    ScrollTrigger.addEventListener('refreshInit', layoutCraft);

    gsap.set(frame, { scale: 0.5 });
    gsap.set(callouts, { opacity: 0, y: 16 });
    gsap.set(paths, { strokeDashoffset: 1 });
    gsap.set(dots, { opacity: 0 });
    gsap.set(foot, { opacity: 0, y: 16 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: stage, start: 'top top', end: isDesktop ? '+=180%' : '+=140%', pin: true, scrub: 1, anticipatePin: 1 }
    });
    tl.to(frame, { scale: FINAL_SCALE, duration: 2 }, 0);
    callouts.forEach((c, i) => {
      const t = 1.5 + i * 0.55;
      tl.to(c, { opacity: 1, y: 0, duration: 0.35 }, t)
        .to(paths[i], { strokeDashoffset: 0, duration: 0.5 }, t + 0.1)
        .to(dots[i], { opacity: 1, duration: 0.1 }, t + 0.55);
    });
    tl.to(foot, { opacity: 1, y: 0, duration: 0.4 }, 3.3)
      .to({}, { duration: 0.3 }, 3.7);

    return () => ScrollTrigger.removeEventListener('refreshInit', layoutCraft);
  }

  /* Chapter 7 — cards rise in, row by row */
  function best() {
    const cards = $$('.best .card');
    gsap.set(cards, { opacity: 0, y: 60 });
    ScrollTrigger.batch(cards, {
      start: 'top 88%', once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, clearProps: 'all' })
    });
  }

  /* Chapter 8 — calm: fade only */
  function visit() {
    gsap.from('.visit [data-fade]', {
      opacity: 0, duration: 1.4, ease: 'power2.out', stagger: 0.15, clearProps: 'opacity',
      scrollTrigger: { trigger: '.visit-inner', start: 'top 75%', once: true }
    });
  }

  /* Phone-only motion. Hover and cursor effects don't exist on touch, and big
     parallax distances feel wrong on a small screen, so phones get their own
     set: ambient float, directional mask reveals, swipe-driven cards, in-card
     photo drift and scroll-triggered underlines. */
  function mobileMotion() {
    // hero: layers float gently on their own, so the scene is alive before the first scroll
    gsap.to(['.layer.far', '.layer.mid', '.layer.near'], {
      y: (i) => -(5 + i * 4), duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.7
    });

    // chapter 3: photos unmask from alternating sides
    $$('.river .frame').forEach((f, i) => {
      gsap.fromTo(f,
        { clipPath: `inset(${i % 2 ? '0% 0% 0% 100%' : '0% 100% 0% 0%'} round 4px)` },
        {
          clipPath: 'inset(0% 0% 0% 0% round 4px)', duration: 1.3, ease: 'power3.out', clearProps: 'clipPath',
          scrollTrigger: { trigger: f, start: 'top 90%', once: true }
        });
    });

    // chapter 4: the swipe cards unveil, staggered, as the carousel scrolls into view
    gsap.from('.panel-img', {
      clipPath: 'inset(0% 100% 0% 0% round 4px)', duration: 1.1, ease: 'power3.out', stagger: 0.12, clearProps: 'clipPath',
      scrollTrigger: { trigger: '#libTrack', start: 'top 88%', once: true }
    });
    gsap.from('.panel-body', {
      opacity: 0, y: 28, duration: 0.9, ease: 'power3.out', stagger: 0.12, clearProps: 'all',
      scrollTrigger: { trigger: '#libTrack', start: 'top 80%', once: true }
    });

    // chapter 7: photo drifts inside its frame while scrolling; underline draws when the card is reached
    $$('.best .card').forEach((card) => {
      gsap.fromTo($('.card-img img', card), { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
      });
      ScrollTrigger.create({ trigger: card, start: 'top 65%', once: true, onEnter: () => card.classList.add('seen') });
    });
  }

  /* Global chrome driven by scroll (created last so pin spacing already exists) */
  function chromeTriggers() {
    $$('main > section[data-chapter]').forEach((sec) => {
      const n = Number(sec.dataset.chapter);
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (s) => { if (s.isActive) setActiveDot(n); }
      });
      ScrollTrigger.create({
        trigger: sec, start: 'top 70px', end: 'bottom 70px',
        onToggle: (s) => {
          if (!s.isActive) return;
          baseTheme = sec.dataset.theme;
          applyNav();
        }
      });
    });
    ScrollTrigger.create({
      trigger: '#chapter-1', start: 'bottom 90px', end: 'max',
      onEnter: () => { solid = true; applyNav(); },
      onLeaveBack: () => { solid = false; applyNav(); }
    });
    const setP = gsap.quickSetter(progressBar, 'scaleX');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => setP(s.progress) });
  }

  function buildChapters() {
    const mm = gsap.matchMedia();
    mm.add({ isDesktop: '(min-width: 768px)', isMobile: '(max-width: 767.98px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      const k = isDesktop ? 1 : 0.5; // mobile: parallax distances halved
      const cleanups = [];

      reveals();
      heroScroll(k);
      source(isDesktop);
      river(k);
      const lib = library(isDesktop);
      if (lib) cleanups.push(lib);
      rituals(isDesktop);
      const cr = craft(isDesktop);
      if (cr) cleanups.push(cr);
      best();
      visit();
      if (!isDesktop) mobileMotion();
      chromeTriggers();

      return () => cleanups.forEach((fn) => fn());
    });
  }

  /* ==========================================================================
     BOOT
     ========================================================================== */
  initCursor();
  buildChapters();
  runPreloader();

  const refresh = debounce(() => ScrollTrigger.refresh(), 200);
  window.addEventListener('resize', refresh);
  window.addEventListener('load', () => { ScrollTrigger.refresh(); });
  $$('img').forEach((img) => { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
})();
