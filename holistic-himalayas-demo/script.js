/* The Holistic Himalayas — cinematic story landing page
   GSAP + ScrollTrigger drive the story; Lenis adds smooth scrolling.
   If GSAP is missing or the visitor prefers reduced motion, the page falls back to a static layout. */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- helpers that work in every mode ---------- */
  function setupMenu(scrollTo) {
    const burger = document.getElementById('burger');
    const menu = document.getElementById('menu');
    if (!burger || !menu) return;
    const close = () => { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); };
    burger.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open && hasGSAP && !reduceMotion) {
        gsap.fromTo(menu.querySelectorAll('nav a'), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out' });
      }
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) close(); });
  }

  function setupAnchors(scrollTo) {
    document.querySelectorAll('a[data-scroll]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id && id.startsWith('#') ? document.querySelector(id) : null;
        if (!target) return;
        e.preventDefault();
        scrollTo(target);
      });
    });
  }

  function setupCopy() {
    const btn = document.getElementById('copyAddr');
    const addr = document.getElementById('addr');
    if (!btn || !addr) return;
    const text = 'The Holistic Himalayas, near Laxman Jhula, Tapovan, Rishikesh, Uttarakhand 249192';
    btn.addEventListener('click', () => {
      const done = () => { btn.textContent = 'Address copied'; setTimeout(() => (btn.textContent = 'Copy address'), 2200); };
      const fallback = () => {
        const range = document.createRange();
        range.selectNodeContents(addr);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        btn.textContent = 'Selected — press copy';
        setTimeout(() => (btn.textContent = 'Copy address'), 2600);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
        else fallback();
      } catch (err) { fallback(); }
    });
  }

  function nativeScrollTo(el) { el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }

  /* ---------- static fallback ---------- */
  if (!hasGSAP || reduceMotion) {
    root.classList.remove('js');
    root.classList.add('static');
    setupMenu(nativeScrollTo);
    setupAnchors(nativeScrollTo);
    setupCopy();
    drawTrees();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (el) => {
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    else nativeScrollTo(el);
  };

  setupMenu(scrollTo);
  setupAnchors(scrollTo);
  setupCopy();
  drawTrees();

  /* ---------- split text into words ---------- */
  function split(el) {
    if (el.dataset.splitDone) return el.querySelectorAll('.wi');
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><span class="wi">${w}</span></span>`).join(' ');
    el.dataset.splitDone = '1';
    return el.querySelectorAll('.wi');
  }
  document.querySelectorAll('[data-split]').forEach(split);

  /* ---------- preloader + hero intro ---------- */
  const preloader = document.getElementById('preloader');
  const fill = document.getElementById('preloaderFill');
  const heroWords = document.querySelectorAll('#heroTitle .wi');
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set(['.hero__eyebrow', '.hero__sub', '.hero__actions', '.scroll-cue'], { opacity: 0, y: 20 });

  const imgs = Array.from(document.images).slice(0, 6);
  let loaded = 0;
  const bump = () => { loaded++; gsap.to(fill, { scaleX: loaded / imgs.length, duration: 0.4, ease: 'power2.out' }); };
  const waitImages = Promise.all(imgs.map((img) => img.complete ? (bump(), Promise.resolve()) : new Promise((r) => { img.addEventListener('load', () => { bump(); r(); }, { once: true }); img.addEventListener('error', () => { bump(); r(); }, { once: true }); })));
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const minTime = new Promise((r) => setTimeout(r, 900));
  const maxTime = new Promise((r) => setTimeout(r, 2200));

  Promise.race([Promise.all([waitImages, fonts, minTime]), maxTime]).then(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(fill, { scaleX: 1, duration: 0.3 })
      .to('.preloader__inner', { opacity: 0, y: -20, duration: 0.5 })
      .to(preloader, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, '-=0.1')
      .set(preloader, { display: 'none' })
      .from('.layer', { y: 140, opacity: 0, duration: 2, stagger: 0.12, ease: 'power3.out' }, '-=1.0')
      .from('.hero__sun', { opacity: 0, scale: 0.6, duration: 2.2, ease: 'power2.out' }, '<')
      .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.8 }, '-=1.6')
      .to(heroWords, { yPercent: 0, duration: 1.1, stagger: 0.07 }, '-=1.45')
      .to('.hero__sub', { opacity: 1, y: 0, duration: 0.9 }, '-=0.7')
      .to('.hero__actions', { opacity: 1, y: 0, duration: 0.9 }, '-=0.7')
      .to('.scroll-cue', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5');
    ScrollTrigger.refresh();
  });

  /* ---------- global: progress, nav, dots, cursor ---------- */
  const progress = document.getElementById('progressBar');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => gsap.set(progress, { scaleX: s.progress }) });

  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > 80);
      if (y < 200) nav.classList.remove('is-hidden');
      else nav.classList.toggle('is-hidden', self.direction === 1);
    }
  });

  const dots = document.getElementById('dots');
  const alt = document.getElementById('alt');
  document.querySelectorAll('section[data-theme]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 40px', end: 'bottom 40px',
      onToggle: (s) => { if (s.isActive) nav.classList.toggle('on-light', sec.dataset.theme === 'light'); }
    });
    ScrollTrigger.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onToggle: (s) => {
        if (!s.isActive) return;
        const light = sec.dataset.theme === 'light';
        dots.classList.toggle('on-light', light);
        alt.classList.toggle('on-light', light);
      }
    });
  });
  const dotLinks = dots.querySelectorAll('a');
  dotLinks.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onToggle: (s) => { if (s.isActive) { dotLinks.forEach((d) => d.classList.remove('is-active')); a.classList.add('is-active'); } }
    });
  });

  // custom cursor (desktop only)
  const cursor = document.getElementById('cursor');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && cursor) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    document.querySelectorAll('[data-card], .frame, .shelf__img, .scene__img').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-view'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-view'));
    });
    document.querySelectorAll('a:not([data-card]), button').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-link'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-link'));
    });
    // magnetic buttons
    document.querySelectorAll('.magnetic').forEach((btn) => {
      const bx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
      const by = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        bx((e.clientX - r.left - r.width / 2) * 0.25);
        by((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { bx(0); by(0); });
    });
  }

  /* ---------- generic reveals ---------- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 36, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.utils.toArray('[data-split]').forEach((el) => {
    if (el.id === 'heroTitle') return;
    gsap.from(el.querySelectorAll('.wi'), {
      yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  /* ---------- altitude meter: descend from the peaks to Rishikesh ---------- */
  const altValue = document.getElementById('altValue');
  const altFill = document.getElementById('altFill');
  const altPlace = document.getElementById('altPlace');
  const altState = { v: 4200 };
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');
  const altTl = gsap.timeline({
    scrollTrigger: { trigger: '#top', start: 'top top', endTrigger: '#rishikesh', end: 'top 30%', scrub: 1 },
    onUpdate: () => { altValue.textContent = fmt(altState.v); }
  });
  altTl.to(altState, { v: 2400, ease: 'none', duration: 1 })
       .to(altFill, { scaleY: 0.5, ease: 'none', duration: 1 }, 0)
       .to(altState, { v: 372, ease: 'none', duration: 1 })
       .to(altFill, { scaleY: 1, ease: 'none', duration: 1 }, 1);
  ScrollTrigger.create({ trigger: '#source', start: 'top center', onEnter: () => (altPlace.textContent = 'Valleys & meadows'), onLeaveBack: () => (altPlace.textContent = 'High Himalaya') });
  ScrollTrigger.create({ trigger: '#rishikesh', start: 'top 40%', onEnter: () => (altPlace.textContent = 'Rishikesh, on the Ganga'), onLeaveBack: () => (altPlace.textContent = 'Valleys & meadows') });
  gsap.to(alt, { opacity: 0, scrollTrigger: { trigger: '#library', start: 'top 70%', end: 'top 30%', scrub: true } });

  /* ---------- responsive scenes ---------- */
  const mm = gsap.matchMedia();

  mm.add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    const k = desktop ? 1 : 0.5; // parallax strength

    /* 01 hero: layers move at different speeds, camera pushes into the valley */
    const heroTl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    gsap.utils.toArray('.layer').forEach((layer) => {
      heroTl.to(layer, { yPercent: parseFloat(layer.dataset.speed) * k, ease: 'none' }, 0);
    });
    heroTl.to('.hero__sun', { yPercent: 40 * k, scale: 0.85, ease: 'none' }, 0)
          .to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none' }, 0)
          .to('.hero__scene', { scale: 1.12, ease: 'none' }, 0)
          .to('.scroll-cue', { opacity: 0, ease: 'none', duration: 0.2 }, 0);

    /* 02 source: pinned, three lines in sequence */
    const lines = gsap.utils.toArray('.source__line');
    const pics = gsap.utils.toArray('.source__img');
    gsap.set(lines, { opacity: 0, y: 60, filter: 'blur(10px)' });
    gsap.set(pics, { opacity: 0, scale: 0.8, y: 40 });
    gsap.set('.source__note', { opacity: 0, y: 20 });
    const srcTl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger: '.source__pin', start: 'top top', end: desktop ? '+=220%' : '+=170%', pin: true, scrub: 1, refreshPriority: 4 }
    });
    lines.forEach((line, i) => {
      srcTl.to(line, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 })
           .to(pics[i], { opacity: 1, scale: 1, y: 0, duration: 1 }, '<');
      if (i < lines.length - 1) {
        srcTl.to(line, { opacity: 0, y: -50, filter: 'blur(10px)', duration: 0.8 }, '+=0.6');
      }
    });
    srcTl.to('.source__note', { opacity: 1, y: 0, duration: 0.8 }, '+=0.1')
         .to(pics, { y: (i) => (i % 2 ? -30 : 30), duration: 1, ease: 'none' }, '<')
         .to({}, { duration: 0.6 });

    /* 03 river: frames drift at different depths, images settle from a slow zoom */
    gsap.utils.toArray('.frame').forEach((frame) => {
      gsap.fromTo(frame, { y: parseFloat(frame.dataset.depth) * -k }, {
        y: parseFloat(frame.dataset.depth) * k, ease: 'none',
        scrollTrigger: { trigger: '.river', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.fromTo(frame.querySelector('img'), { scale: 1.3 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'center center', scrub: true }
      });
      gsap.from(frame, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: frame, start: 'top 85%', once: true } });
    });
    gsap.fromTo('.river__pin', { xPercent: -10 }, { xPercent: 10, ease: 'none', scrollTrigger: { trigger: '.river', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* 04 library: pinned horizontal walk along the shelves (desktop); swipe carousel on mobile */
    const track = document.getElementById('libTrack');
    const libBar = document.getElementById('libBar');
    const libCount = document.getElementById('libCount');
    const shelves = gsap.utils.toArray('.shelf');
    const setCount = (p) => {
      const idx = Math.min(shelves.length, Math.max(1, Math.round(p * (shelves.length - 1)) + 1));
      libCount.textContent = String(idx).padStart(2, '0') + ' / ' + String(shelves.length).padStart(2, '0');
      gsap.set(libBar, { scaleX: Math.max(0.2, p) });
    };
    if (desktop) {
      const distance = () => track.scrollWidth - window.innerWidth;
      const libTween = gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: '.library', start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, refreshPriority: 3,
          invalidateOnRefresh: true, onUpdate: (s) => setCount(s.progress)
        }
      });
      shelves.forEach((shelf) => {
        gsap.fromTo(shelf.querySelector('.shelf__img img'), { xPercent: -8 }, {
          xPercent: 8, ease: 'none',
          scrollTrigger: { trigger: shelf, containerAnimation: libTween, start: 'left right', end: 'right left', scrub: true }
        });
        gsap.from(shelf.querySelectorAll('.shelf__text > *'), {
          opacity: 0, y: 30, stagger: 0.06, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: shelf, containerAnimation: libTween, start: 'left 75%', once: true }
        });
      });
    } else {
      const vp = document.querySelector('.library__viewport');
      const onSwipe = () => setCount(vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth));
      vp.addEventListener('scroll', onSwipe, { passive: true });
      return () => vp.removeEventListener('scroll', onSwipe);
    }
  });

  /* 05 rituals: pinned, the day passes — background, text colour, sun → moon */
  (function rituals() {
    const section = document.querySelector('.ritual');
    const scenes = gsap.utils.toArray('.scene');
    const orb = document.getElementById('ritualOrb');
    const arc = document.getElementById('sunArc');
    const arcSvg = document.querySelector('.ritual__arc');
    const arcLen = arc.getTotalLength();
    const placeOrb = (p) => {
      const pt = arc.getPointAtLength(arcLen * Math.min(1, Math.max(0, p)));
      const box = arcSvg.getBoundingClientRect();
      const pinBox = arcSvg.parentElement.getBoundingClientRect();
      const x = box.left - pinBox.left + (pt.x / 1000) * box.width;
      const y = box.top - pinBox.top + (pt.y / 220) * box.height;
      gsap.set(orb, { x, y });
      orb.classList.toggle('is-moon', p > 0.78);
    };
    gsap.set(scenes, { opacity: 0, y: 40 });
    gsap.set(scenes[0], { opacity: 1, y: 0 });
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '.ritual__pin', start: 'top top', end: '+=260%', pin: true, scrub: 1, refreshPriority: 2,
        onUpdate: (s) => placeOrb(s.progress), onRefresh: (s) => placeOrb(s.progress)
      }
    });
    tl.to(scenes[0].querySelector('.scene__img'), { rotate: 12, duration: 1 })
      .to(scenes[0], { opacity: 0, y: -40, duration: 0.6 })
      .to(section, { '--r-bg': scenes[1].dataset.bg, '--r-fg': scenes[1].dataset.fg, duration: 0.8 }, '<')
      .to(scenes[1], { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to(scenes[1].querySelector('.scene__img'), { rotate: 12, duration: 1 })
      .to(scenes[1], { opacity: 0, y: -40, duration: 0.6 })
      .to(section, { '--r-bg': scenes[2].dataset.bg, '--r-fg': scenes[2].dataset.fg, duration: 0.8 }, '<')
      .to(scenes[2], { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to(scenes[2].querySelector('.scene__img'), { rotate: 12, duration: 1 })
      .to({}, { duration: 0.4 });
    ScrollTrigger.create({
      trigger: '.ritual', start: 'top 40px', end: 'bottom 40px',
      onUpdate: (s) => {
        const light = s.progress < 0.62;
        nav.classList.toggle('on-light', light);
        dots.classList.toggle('on-light', light);
      }
    });
  })();

  /* 06 craft: the pouch rises to the camera, callout lines draw themselves */
  (function craft() {
    const paths = gsap.utils.toArray('.craft__lines path');
    paths.forEach((p) => { const l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); });
    gsap.set('.callout', { opacity: 0, y: 14 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.craft__pin', start: 'top top', end: '+=170%', pin: true, scrub: 1, refreshPriority: 1 }
    });
    tl.fromTo('#pouch', { scale: 0.55, rotate: -8, y: 60 }, { scale: 1.12, rotate: 0, y: 0, ease: 'power2.out', duration: 1.4 })
      .to(paths, { strokeDashoffset: 0, stagger: 0.25, duration: 0.6, ease: 'none' }, '-=0.4')
      .to('.callout', { opacity: 1, y: 0, stagger: 0.25, duration: 0.5 }, '<0.3')
      .to({}, { duration: 0.5 });
  })();

  /* 07 bestsellers: cards rise in a stagger */
  gsap.set('.card', { opacity: 0, y: 60 });
  ScrollTrigger.batch('.card', {
    start: 'top 92%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' })
  });

  /* 08 visit: the river on the sketch map draws in */
  (function map() {
    const river = document.getElementById('mapRiver');
    if (!river) return;
    const l = river.getTotalLength();
    gsap.fromTo(river, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: '.visit__map', start: 'top 80%', once: true } });
  })();

  /* 09 final: mountains rise, title words lift */
  gsap.from('.final__mountains', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'top top', scrub: true } });

  /* ---------- hero canvas: stars and drifting pollen ---------- */
  (function heroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, running = true, raf = 0;
    const stars = [], motes = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars.length = 0; motes.length = 0;
      const sc = Math.round((w * h) / 9000);
      for (let i = 0; i < sc; i++) stars.push({ x: Math.random() * w, y: Math.random() * h * 0.5, r: Math.random() * 1.1 + 0.2, t: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2 });
      const mc = w < 700 ? 22 : 46;
      for (let i = 0; i < mc; i++) motes.push(newMote(true));
    }
    function newMote(anywhere) {
      return { x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, r: Math.random() * 2 + 0.6, vy: 0.15 + Math.random() * 0.45, vx: (Math.random() - 0.5) * 0.25, a: 0.25 + Math.random() * 0.5, ph: Math.random() * 6 };
    }
    function frame(time) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const t = time / 1000;
      for (const s of stars) {
        const a = 0.35 + 0.45 * Math.sin(t * s.s + s.t);
        ctx.globalAlpha = Math.max(0, a) * (1 - s.y / (h * 0.55));
        ctx.fillStyle = '#f4f1e6';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const m of motes) {
        m.y -= m.vy; m.x += m.vx + Math.sin(t + m.ph) * 0.2;
        if (m.y < -10) Object.assign(m, newMote(false));
        ctx.globalAlpha = m.a * Math.min(1, m.y / (h * 0.4));
        ctx.fillStyle = '#eab067';
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', debounce(resize, 200));
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);
  })();

  /* ---------- refresh after images load / resize ---------- */
  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('resize', debounce(() => ScrollTrigger.refresh(), 250));

  function debounce(fn, ms) { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; }

  /* ---------- deodar trees along the front ridge (used in all modes) ---------- */
  function drawTrees() {
    const ridge = document.getElementById('frontRidge');
    const g = document.getElementById('trees');
    if (!ridge || !g || g.childElementCount) return;
    // sample the ridge's top edge: x → y
    const len = ridge.getTotalLength();
    const top = new Map();
    for (let d = 0; d < len; d += 4) {
      const p = ridge.getPointAtLength(d);
      if (p.y < 590) { const x = Math.round(p.x / 8) * 8; if (!top.has(x) || top.get(x) > p.y) top.set(x, p.y); }
    }
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    let out = '';
    for (let x = 0; x <= 1440; x += 8) {
      if (rnd() > 0.42 || !top.has(x)) continue;
      const base = top.get(x) + 4;
      const hgt = 18 + rnd() * 42;
      const wid = hgt * (0.32 + rnd() * 0.12);
      // layered deodar: three stacked triangles
      out += `<path d="M${x} ${base - hgt} L${x + wid / 2} ${base - hgt * 0.45} L${x + wid * 0.32} ${base - hgt * 0.45} L${x + wid * 0.62} ${base} L${x - wid * 0.62} ${base} L${x - wid * 0.32} ${base - hgt * 0.45} L${x - wid / 2} ${base - hgt * 0.45}Z"/>`;
    }
    g.innerHTML = out;
  }
})();
