/* ==========================================================================
   Muhammad Sarmad Qadir — Portfolio interactions
   Vanilla JS, plus GSAP + ScrollTrigger (vendored in assets/vendor/gsap/) for
   the scroll-linked motion. Every module runs in isolation, so one failure
   never blocks the rest, and the page is complete without JavaScript,
   without GSAP, and with reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(pointer: fine)').matches;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  var useGsap = !!(gsap && ScrollTrigger) && !reduceMotion;

  if (useGsap) {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('gsap');
  }

  function run(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.error('[portfolio] ' + name + ' failed:', err); }
  }

  /* ── HERO START ───────────────────────────────────────────────────────── */
  // Hero entrance, reveals and the typewriter wait for the preloader to lift.
  var heroStarted = false, heroHooks = [];
  function onHeroStart(fn) { if (heroStarted) run('hero hook', fn); else heroHooks.push(fn); }
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    document.body.classList.add('loaded');   // releases the paused title + code animations
    heroHooks.forEach(function (fn) { run('hero hook', fn); });
    if (useGsap) ScrollTrigger.refresh();
  }
  // Hard safety net — never trap the page behind a stalled loader.
  setTimeout(startHero, 3500);

  /* ── PRELOADER ────────────────────────────────────────────────────────── */
  run('preloader', function () {
    var el = $('#preloader'), fill = $('#preloaderFill'), pct = $('#preloaderPct');
    if (!el) { setTimeout(startHero, 0); return; }

    var p = 0, done = false, t0 = Date.now();

    function paint(v) {
      if (fill) fill.style.transform = 'scaleX(' + (v / 100) + ')';
      if (pct) pct.textContent = Math.round(v) + '%';
    }

    var tick = setInterval(function () {
      p = Math.min(p + Math.random() * 18, 92);
      paint(p);
    }, 110);

    function finish() {
      if (done) return;
      done = true;
      clearInterval(tick);
      paint(100);
      setTimeout(function () {
        el.classList.add('done');
        document.body.style.overflow = '';
        startHero();
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
      }, 260);
    }

    function whenReady() { setTimeout(finish, Math.max(0, 650 - (Date.now() - t0))); }

    document.body.style.overflow = 'hidden';
    if (document.readyState === 'complete') whenReady();
    else window.addEventListener('load', whenReady);
    setTimeout(finish, 3000);
  });

  /* ── TEXT SPLITTING ───────────────────────────────────────────────────── */
  var splitLines = [];

  /* Each char clips its own slice of one continuous gradient across the line.
     offsetLeft/offsetWidth are layout-based, so the in-flight entrance
     transforms on .char don't skew the measurement. */
  function paintGradient() {
    splitLines.forEach(function (line) {
      if (!line.classList.contains('grad')) return;
      var w = line.offsetWidth;
      if (!w) return;
      $$('.char', line).forEach(function (ch) {
        ch.style.backgroundSize = w + 'px 100%';
        ch.style.backgroundPosition = -(ch.offsetLeft - line.offsetLeft) + 'px 0';
      });
    });
  }

  // Wraps every word of an element in <span class="w"><span class="w__in">…</span></span>.
  // Nested inline elements are walked into, except gradient spans, which stay whole
  // (wrapping their words would break background-clip: text).
  function splitWords(el) {
    var count = 0;
    function wrap(node) {
      var outer = document.createElement('span'), inner = document.createElement('span');
      outer.className = 'w';
      inner.className = 'w__in';
      inner.style.setProperty('--i', count++);
      inner.appendChild(node);
      outer.appendChild(inner);
      return outer;
    }
    (function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
          });
          parent.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.classList.contains('grad')) {
          var holder = document.createComment('');
          parent.replaceChild(holder, child);
          parent.replaceChild(wrap(child), holder);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
  }

  run('split', function () {
    splitLines = $$('[data-split]');
    var order = 0;

    splitLines.forEach(function (line, li) {
      var words = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      words.forEach(function (word, wi) {
        if (wi) line.appendChild(document.createTextNode(' '));
        var w = document.createElement('span');
        w.className = 'word';
        word.split('').forEach(function (ch) {
          var c = document.createElement('span');
          c.className = 'char';
          c.textContent = ch;
          c.style.setProperty('--cd', (180 + li * 140 + order++ * 32) + 'ms');
          w.appendChild(c);
        });
        line.appendChild(w);
      });
    });

    paintGradient();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintGradient);

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(paintGradient, 140);
    });

    $$('[data-split-words]').forEach(splitWords);
    // The scroll-scrubbed statement only needs its words split when GSAP will animate them.
    if (useGsap) $$('[data-scrub-words]').forEach(splitWords);
  });

  /* ── REVEAL ON SCROLL ─────────────────────────────────────────────────── */
  var revealReady = false;

  run('reveal', function () {
    var items = $$('[data-reveal]');
    if (!items.length) { revealReady = true; return; }

    function showAll() { items.forEach(function (el) { el.classList.add('in', 'revealed'); }); }

    if (!('IntersectionObserver' in window) || reduceMotion) {
      showAll();
      revealReady = true;
      return;
    }

    function show(el, delay) {
      el.style.setProperty('--d', delay + 'ms');
      el.classList.add('in');
      // Drop the reveal transition once it has played, so hover transitions are snappy again.
      setTimeout(function () { el.classList.add('revealed'); }, delay + 1150);
    }

    var io = new IntersectionObserver(function (entries) {
      // Elements that enter together are staggered in DOM order, capped so nothing lags.
      entries.filter(function (e) { return e.isIntersecting; }).forEach(function (entry, i) {
        var el = entry.target;
        var delay = el.hasAttribute('data-delay') ? parseInt(el.getAttribute('data-delay'), 10) : Math.min(i * 80, 480);
        show(el, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    onHeroStart(function () {
      items.forEach(function (el) { io.observe(el); });
      revealReady = true;
    });
  });

  // If anything above failed, show everything rather than leave content hidden.
  setTimeout(function () {
    if (!revealReady) $$('[data-reveal]').forEach(function (el) { el.classList.add('in', 'revealed'); });
  }, 6000);

  /* ── PAUSE OFF-SCREEN DECOR ───────────────────────────────────────────── */
  // Blocks out of view get .is-idle, which pauses their CSS loops (see style.css).
  // Decorative pieces inside the long projects section are watched on their own:
  // Chrome keeps running off-screen loops on the main thread, with a layout each frame.
  if (!reduceMotion && 'IntersectionObserver' in window) run('idle', function () {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-idle', !e.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    $$('.hero, .marquee, .section, .footer, .section__head, .project__visual, .mock').forEach(function (el) { io.observe(el); });
  });

  /* ── TYPEWRITER ───────────────────────────────────────────────────────── */
  onHeroStart(function typewriter() {
    var out = $('#typed');
    if (!out) return;

    var words = [
      'responsive front-ends.',
      'PHP & SQL back-ends.',
      'storefronts that move.',
      'data-driven systems.',
      'things that just work.'
    ];

    if (reduceMotion) { out.textContent = words[0]; return; }

    var w = 0, c = 0, deleting = false;
    var hero = $('.hero');

    (function loop() {
      // Nobody is watching while the hero is off screen: check back later instead of typing.
      if (hero && hero.classList.contains('is-idle')) { setTimeout(loop, 600); return; }
      var word = words[w];
      c += deleting ? -1 : 1;
      out.textContent = word.slice(0, c);

      var delay = deleting ? 40 : 75;
      if (!deleting && c === word.length) { delay = 1900; deleting = true; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 320; }

      setTimeout(loop, delay);
    })();
  });

  /* ── SKILL BARS ───────────────────────────────────────────────────────── */
  run('bars', function () {
    var bars = $$('[data-bar]');
    function fill() {
      bars.forEach(function (bar) {
        bar.style.transform = 'scaleX(' + (parseInt(bar.getAttribute('data-bar'), 10) / 100) + ')';
      });
    }

    var section = $('#skills');
    if (!section || !('IntersectionObserver' in window) || reduceMotion) { fill(); return; }

    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fill(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(section);
  });

  /* ── COUNTERS ─────────────────────────────────────────────────────────── */
  run('counters', function () {
    var nums = $$('[data-count]');
    // The HTML holds the final figures, so the page reads correctly without JS.
    if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;

    function fmt(n, plain) { return plain ? String(n) : n.toLocaleString('en-GB'); }

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var plain = el.hasAttribute('data-plain');
      var dur = 1700, start = null;

      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 4);            // easeOutQuart
        el.textContent = fmt(Math.round(target * eased), plain) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    nums.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animate(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  });

  /* ── NAV ──────────────────────────────────────────────────────────────── */
  run('nav', function () {
    var nav = $('#nav');
    var links = $$('.nav__link');
    var burger = $('#burger');
    var menu = $('#navLinks');
    var indicator = $('#navIndicator');
    var progress = $('#scrollProgress');
    var toTop = $('#toTop');

    var sections = links
      .map(function (l) { return $(l.getAttribute('href')); })
      .filter(Boolean);

    function moveIndicator(link) {
      if (!indicator || !link || window.innerWidth <= 860) return;
      indicator.style.width = link.offsetWidth + 'px';
      indicator.style.transform = 'translate(' + link.offsetLeft + 'px, -50%)';
      indicator.style.opacity = '1';
    }

    function menuOpen() { return !!(menu && menu.classList.contains('open')); }

    var ticking = false, lastY = window.scrollY;
    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? y / max : 0;

        if (nav) {
          nav.classList.toggle('stuck', y > 40);
          // Hide while reading down, return on any scroll up; never while the menu or a nav link is in use.
          if (Math.abs(y - lastY) > 6) {
            var hide = y > lastY && y > 420 && !menuOpen() && !nav.contains(document.activeElement);
            nav.classList.toggle('nav--hidden', hide);
            lastY = y;
          }
        }
        if (progress) progress.style.transform = 'scaleX(' + ratio + ')';
        if (toTop) {
          toTop.classList.toggle('show', y > 600);
          toTop.style.setProperty('--p', ratio.toFixed(4));
        }

        // active section
        var current = null;
        sections.forEach(function (s) {
          if (s.offsetTop - 140 <= y) current = s.id;
        });

        links.forEach(function (l) {
          var on = l.getAttribute('href') === '#' + current;
          l.classList.toggle('active', on);
          if (on) moveIndicator(l);
        });

        if (!current && indicator) indicator.style.opacity = '0';
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    if (nav) nav.addEventListener('focusin', function () { nav.classList.remove('nav--hidden'); });

    links.forEach(function (l) {
      l.addEventListener('mouseenter', function () { moveIndicator(l); });
      l.addEventListener('click', closeMenu);
    });

    if (menu) {
      menu.addEventListener('mouseleave', function () {
        var active = $('.nav__link.active');
        if (active) moveIndicator(active);
      });
    }

    function closeMenu() {
      if (!menu || !burger) return;
      menu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    }

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
        if (open && nav) nav.classList.remove('nav--hidden');
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen()) { closeMenu(); if (burger) burger.focus(); }
    });

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  });

  /* ── THEME ────────────────────────────────────────────────────────────── */
  run('theme', function () {
    var btn = $('#themeToggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sq-theme', next); } catch (e) {}

      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#070911' : '#f5f6fb');
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  });

  /* ── CUSTOM CURSOR ────────────────────────────────────────────────────── */
  if (finePointer && !reduceMotion) run('cursor', function () {
    var ring = $('#cursor'), dot = $('#cursorDot'), label = $('#cursorLabel');
    if (!ring || !dot) return;

    var rx = 0, ry = 0, mx = 0, my = 0, shown = false;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (!shown) {
        shown = true;
        rx = mx; ry = my;
        ring.classList.add('on');
        dot.classList.add('on');
      }
    }, { passive: true });

    (function follow() {
      requestAnimationFrame(follow);
      if (Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1) return;   // settled: no style write
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
    })();

    document.addEventListener('mouseover', function (e) {
      var labelled = e.target.closest('[data-cursor]');
      var hot = e.target.closest('a, button, input, textarea, [data-tilt], .chip');
      ring.classList.toggle('has-label', !!labelled);
      ring.classList.toggle('is-hover', !!hot && !labelled);
      if (label) label.textContent = labelled ? labelled.getAttribute('data-cursor') : '';
    });

    document.addEventListener('mouseleave', function () {
      ring.classList.remove('on');
      dot.classList.remove('on');
      shown = false;
    });
  });

  /* ── MAGNETIC BUTTONS ─────────────────────────────────────────────────── */
  if (finePointer && !reduceMotion) run('magnetic', function () {
    $$('[data-magnetic]').forEach(function (el) {
      var raf = null;

      el.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          var cap = function (v) { return Math.max(-12, Math.min(12, v)); };
          var x = cap((e.clientX - r.left - r.width / 2) * 0.28);
          var y = cap((e.clientY - r.top - r.height / 2) * 0.28);
          el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
          raf = null;
        });
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  });

  /* ── 3D TILT + GLARE ──────────────────────────────────────────────────── */
  if (finePointer && !reduceMotion) run('tilt', function () {
    $$('[data-tilt]').forEach(function (el) {
      var MAX = 8;
      var raf = null;

      el.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;

          el.style.transform =
            'perspective(1000px) rotateY(' + ((px - 0.5) * MAX * 2) + 'deg) ' +
            'rotateX(' + (-(py - 0.5) * MAX * 2) + 'deg)';

          el.style.setProperty('--gx', (px * 100) + '%');
          el.style.setProperty('--gy', (py * 100) + '%');
          raf = null;
        });
      });

      // While tilting, transform follows the pointer directly; on leave it eases back (see CSS).
      el.addEventListener('mouseenter', function () { el.classList.add('is-tilting'); });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('is-tilting');
        el.style.transform = '';
      });
    });
  });

  /* ── SPOTLIGHT BORDERS ────────────────────────────────────────────────── */
  if (finePointer) run('spotlight', function () {
    var raf = null, last = null;

    document.addEventListener('pointermove', function (e) {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var card = last.target && last.target.closest ? last.target.closest('.spot') : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (last.clientX - r.left) + 'px');
        card.style.setProperty('--my', (last.clientY - r.top) + 'px');
      });
    }, { passive: true });
  });

  /* ── NEURAL NETWORK CANVAS ────────────────────────────────────────────── */
  if (!reduceMotion) run('neural', function () {
    var canvas = $('#neuralCanvas');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var w = 0, h = 0;
    var mouse = { x: -9999, y: -9999 };
    var LINK_DIST = 130;

    function hexToRgb(hex) {
      var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [34, 211, 238];
    }

    var nodeRGB, linkRGB;
    function palette() {
      var s = getComputedStyle(root);
      nodeRGB = hexToRgb(s.getPropertyValue('--brand').trim() || '#22d3ee');
      linkRGB = hexToRgb(s.getPropertyValue('--brand-2').trim() || '#8b5cf6');
    }
    palette();

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.min(Math.round((w * h) / 24000), 64);
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.6 + 0.7
        });
      }
    }

    function frame() {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;

        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // gentle attraction toward the cursor
        var dxm = mouse.x - n.x, dym = mouse.y - n.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 160 && dm > 0) {
          n.x += (dxm / dm) * 0.45;
          n.y += (dym / dm) * 0.45;
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + nodeRGB.join(',') + ',0.55)';
        ctx.fill();

        for (var j = i + 1; j < nodes.length; j++) {
          var m2 = nodes[j];
          var dx = n.x - m2.x, dy = n.y - m2.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d > LINK_DIST) continue;

          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m2.x, m2.y);
          ctx.strokeStyle = 'rgba(' + linkRGB.join(',') + ',' + (0.22 * (1 - d / LINK_DIST)) + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
    }, { passive: true });
    document.addEventListener('themechange', palette);

    resize();
    frame();
  });

  /* ── MARQUEE (GSAP) — speeds up and leans with scroll velocity ────────── */
  run('marquee', function () {
    var wrap = $('.marquee');
    if (!wrap || !useGsap) return;   // without GSAP the CSS animation runs instead

    var rows = $$('.marquee__row', wrap);
    var tweens = $$('.marquee__track', wrap).map(function (track) {
      var right = track.getAttribute('data-dir') === 'right';
      return gsap.fromTo(track,
        { xPercent: right ? -50 : 0 },
        { xPercent: right ? 0 : -50, duration: parseFloat(track.getAttribute('data-duration')) || 44, ease: 'none', repeat: -1 });
    });
    var skews = rows.map(function (row) { return gsap.quickSetter(row, 'skewX', 'deg'); });

    var vel = 0, base = 1, speed = 1, leaning = false, active = false;

    // Off screen, the tweens are paused and the ticker below does nothing.
    tweens.forEach(function (t) { t.pause(); });
    ScrollTrigger.create({
      trigger: wrap, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) { vel = self.getVelocity(); },
      onToggle: function (self) {
        active = self.isActive;
        tweens.forEach(function (t) { if (active) t.resume(); else t.pause(); });
      }
    });

    gsap.ticker.add(function () {
      if (!active) return;
      vel *= 0.9;
      speed += (base + Math.min(Math.abs(vel) / 300, 6) - speed) * 0.12;
      tweens.forEach(function (t) { t.timeScale(speed); });

      var lean = gsap.utils.clamp(-6, 6, vel / -320);
      if (Math.abs(lean) > 0.02 || leaning) {
        skews.forEach(function (set) { set(lean); });
        leaning = Math.abs(lean) > 0.02;
      }
    });

    wrap.addEventListener('mouseenter', function () { base = 0.2; });
    wrap.addEventListener('mouseleave', function () { base = 1; });
  });

  /* ── SCROLL-LINKED MOTION (GSAP + ScrollTrigger) ──────────────────────── */
  run('scroll-fx', function () {
    if (!useGsap) return;

    // Hero: content drifts up and fades, the visual and background move at their own pace.
    var hero = $('.hero');
    if (hero) {
      var heroScrub = function () { return { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }; };
      gsap.to('[data-hero-content]', { y: -70, opacity: 0.2, ease: 'none', scrollTrigger: heroScrub() });
      gsap.to('[data-hero-visual]', { y: -130, ease: 'none', scrollTrigger: heroScrub() });
      gsap.to('.hero__bg', { y: 110, ease: 'none', scrollTrigger: heroScrub() });
    }

    // About statement: words light up as it scrolls through the viewport.
    $$('[data-scrub-words]').forEach(function (el) {
      var words = $$('.w', el);
      if (!words.length) return;
      gsap.fromTo(words, { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 50%', scrub: 0.5 }
      });
    });

    // Timeline: the line draws with the scroll and each role's node lights as it is reached.
    var tw = $('[data-timeline]');
    if (tw) {
      gsap.fromTo($('.timeline__progress', tw), { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: tw, start: 'top 72%', end: 'bottom 72%', scrub: 0.4 }
      });
      $$('.tl', tw).forEach(function (item) {
        ScrollTrigger.create({
          trigger: item, start: 'top+=40 72%',
          onEnter: function () { item.classList.add('lit'); },
          onLeaveBack: function () { item.classList.remove('lit'); }
        });
      });
    }

    // Screenshot frames tip up into place; the phone rides at its own speed.
    $$('.gallery').forEach(function (g) {
      var desk = $('.device--desktop', g);
      if (desk) {
        gsap.fromTo(desk, { rotateX: 14, scale: 0.92, y: 30 }, {
          rotateX: 0, scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: g, start: 'top 95%', end: 'top 45%', scrub: 0.6 }
        });
      }
      var phone = $('.device--phone', g);
      if (phone) {
        gsap.fromTo(phone, { y: 110 }, {
          y: -50, ease: 'none',
          scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
        });
      }
    });

    // Generic parallax: data-speed="0.4" moves up to 0.4 × 60px either side of rest.
    $$('[data-speed]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-speed')) || 0;
      gsap.fromTo(el, { y: s * 60 }, {
        y: s * -60, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  });

  /* ── SCREENSHOT GALLERIES ─────────────────────────────────────────────── */
  run('galleries', function () {
    $$('[data-gallery]').forEach(function (box) {
      var slides = $$('.device__slide', box);
      var caps = $$('.gallery__cap', box);
      var tabs = $$('.gallery__tab', box);
      var play = $('.gallery__play', box);
      var screen = $('.device__screen', box);
      if (slides.length < 2) return;

      var DUR = 6000, idx = 0, timer = null;
      var inView = false, hover = false, focus = false, paused = reduceMotion;
      box.style.setProperty('--dur', DUR + 'ms');

      function render() {
        slides.forEach(function (s, k) {
          var on = k === idx;
          s.classList.toggle('is-active', on);
          s.setAttribute('aria-hidden', String(!on));
        });
        caps.forEach(function (c, k) {
          var on = k === idx;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-hidden', String(!on));
        });
        tabs.forEach(function (t, k) {
          var on = k === idx;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
        });
      }

      // Autoplay only while the gallery is on screen and nobody is pointing at or focused in it.
      function schedule() {
        clearTimeout(timer);
        box.classList.remove('is-playing');
        if (paused || hover || focus || !inView) return;
        void box.offsetWidth;   // restart the active tab's progress bar
        box.classList.add('is-playing');
        timer = setTimeout(function () { go(idx + 1); }, DUR);
      }

      function go(i) {
        idx = (i + slides.length) % slides.length;
        render();
        schedule();
      }

      tabs.forEach(function (tab, k) {
        tab.addEventListener('click', function () { go(k); });
        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = k + 1;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = k - 1;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = tabs.length - 1;
          if (next === null) return;
          e.preventDefault();
          go(next);
          tabs[idx].focus();
        });
      });

      if (screen) screen.addEventListener('click', function () { go(idx + 1); });

      if (play) {
        if (reduceMotion) play.hidden = true;   // nothing auto-advances, so nothing to pause
        play.addEventListener('click', function () {
          paused = !paused;
          play.setAttribute('aria-pressed', String(paused));
          schedule();
        });
      }

      box.addEventListener('mouseenter', function () { hover = true; schedule(); });
      box.addEventListener('mouseleave', function () { hover = false; schedule(); });
      box.addEventListener('focusin', function () { focus = true; schedule(); });
      box.addEventListener('focusout', function (e) {
        if (box.contains(e.relatedTarget)) return;
        focus = false;
        schedule();
      });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          inView = entries[0].isIntersecting;
          schedule();
        }, { threshold: 0.35 }).observe(box);
      } else {
        inView = true;
      }

      render();
      schedule();
    });
  });

  /* ── CONTACT FORM ─────────────────────────────────────────────────────── */
  run('form', function () {
    var form = $('#contactForm');
    if (!form) return;

    var status = $('#formStatus');
    var btn = $('#submitBtn');

    function say(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status ' + (kind || '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      say('');

      var ok = true;
      $$('.field', form).forEach(function (field) {
        var input = $('input, textarea', field);
        if (!input || !input.required) return;
        var valid = input.value.trim() !== '' && (input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
        field.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });

      if (!ok) { say('Please fill in your name, a valid email, and a message.', 'err'); return; }

      if (btn) btn.classList.add('loading');

      fetch(form.action, { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (data) {
          if (data && data.ok) {
            say(data.message || 'Thanks — your message is on its way.', 'ok');
            form.reset();
          } else {
            fallback(data && data.message);
          }
        })
        .catch(function () { fallback(); })
        .then(function () { if (btn) btn.classList.remove('loading'); });
    });

    // No PHP/mail available? Hand off to the user's mail client instead of failing.
    function fallback(msg) {
      var name = $('#name').value, email = $('#email').value;
      var subject = $('#subject').value || 'Portfolio enquiry';
      var body = $('#message').value + '\n\n— ' + name + ' (' + email + ')';

      say(msg || 'Opening your email app so the message still reaches me…', 'ok');
      window.location.href = 'mailto:chsarmad888@gmail.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    // clear the invalid flag as soon as the user starts fixing it
    $$('input, textarea', form).forEach(function (input) {
      input.addEventListener('input', function () {
        if (input.parentElement) input.parentElement.classList.remove('invalid');
      });
    });
  });

  /* ── MISC ─────────────────────────────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
