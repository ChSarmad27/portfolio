/* ==========================================================================
   Muhammad Sarmad Qadir — Portfolio interactions
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(pointer: fine)').matches;

  /* ── PRELOADER ────────────────────────────────────────────────────────── */
  (function preloader() {
    var el = $('#preloader'), fill = $('#preloaderFill'), pct = $('#preloaderPct');
    if (!el) return;

    var p = 0, done = false;

    function paint(v) {
      if (fill) fill.style.transform = 'scaleX(' + (v / 100) + ')';
      if (pct) pct.textContent = Math.round(v) + '%';
    }

    var tick = setInterval(function () {
      p = Math.min(p + Math.random() * 16, 92);
      paint(p);
    }, 130);

    function finish() {
      if (done) return;
      done = true;
      clearInterval(tick);
      paint(100);
      setTimeout(function () {
        el.classList.add('done');
        document.body.style.overflow = '';
        startHero();
      }, 350);
    }

    document.body.style.overflow = 'hidden';
    if (document.readyState === 'complete') setTimeout(finish, 500);
    else window.addEventListener('load', function () { setTimeout(finish, 400); });
    // Hard safety net — never trap the page behind the loader.
    setTimeout(finish, 4000);
  })();

  /* ── HERO TITLE: split into animated characters ───────────────────────── */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    document.body.classList.add('loaded');   // releases the paused title animation
    typewriter();
  }

  var splitLines = $$('[data-split]');

  splitLines.forEach(function (line, li) {
    var text = line.textContent;
    line.textContent = '';
    var base = li * 260;
    text.split('').forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'char' + (ch === ' ' ? ' space' : '');
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.setProperty('--cd', (base + i * 38) + 'ms');
      line.appendChild(span);
    });
  });

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

  paintGradient();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintGradient);

  var gradTimer;
  window.addEventListener('resize', function () {
    clearTimeout(gradTimer);
    gradTimer = setTimeout(paintGradient, 140);
  });

  /* ── TYPEWRITER ───────────────────────────────────────────────────────── */
  function typewriter() {
    var out = $('#typed');
    if (!out) return;

    var words = [
      'responsive front-ends.',
      'PHP & SQL back-ends.',
      'clean, fast interfaces.',
      'data-driven systems.',
      'things that just work.'
    ];

    if (reduceMotion) { out.textContent = words[0]; return; }

    var w = 0, c = 0, deleting = false;

    (function loop() {
      var word = words[w];
      c += deleting ? -1 : 1;
      out.textContent = word.slice(0, c);

      var delay = deleting ? 40 : 75;
      if (!deleting && c === word.length) { delay = 1900; deleting = true; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 320; }

      setTimeout(loop, delay);
    })();
  }

  /* ── REVEAL ON SCROLL ─────────────────────────────────────────────────── */
  (function reveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('in'); });
      runBars();
      runCounters();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;

        // Stagger siblings that share a parent, capped so nothing lags.
        var siblings = el.parentElement ? $$('[data-reveal]', el.parentElement) : [];
        var idx = siblings.indexOf(el);
        el.style.setProperty('--d', Math.min(idx * 70, 420) + 'ms');

        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ── SKILL BARS ───────────────────────────────────────────────────────── */
  function runBars() {
    $$('[data-bar]').forEach(function (bar) {
      bar.style.transform = 'scaleX(' + (parseInt(bar.dataset.bar, 10) / 100) + ')';
    });
  }

  (function barsObserver() {
    var section = $('#skills');
    if (!section || !('IntersectionObserver' in window)) { runBars(); return; }

    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { runBars(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(section);
  })();

  /* ── COUNTERS ─────────────────────────────────────────────────────────── */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';

    if (reduceMotion) { el.textContent = target + suffix; return; }

    var dur = 1600, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);            // easeOutCubic
      el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function runCounters() { $$('[data-count]').forEach(animateCount); }

  (function countersObserver() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    if (!('IntersectionObserver' in window)) { runCounters(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animateCount(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ── NAV ──────────────────────────────────────────────────────────────── */
  (function nav() {
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

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;

        if (nav) nav.classList.toggle('stuck', y > 40);
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
        if (toTop) toTop.classList.toggle('show', y > 600);

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
      document.body.style.overflow = '';
    }

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  })();

  /* ── THEME ────────────────────────────────────────────────────────────── */
  (function theme() {
    var btn = $('#themeToggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('sq-theme', next); } catch (e) {}

      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#080b12' : '#f6f8fc');
    });
  })();

  /* ── CUSTOM CURSOR ────────────────────────────────────────────────────── */
  if (finePointer && !reduceMotion) {
    (function cursor() {
      var ring = $('#cursor'), dot = $('#cursorDot');
      if (!ring || !dot) return;

      var rx = 0, ry = 0, mx = 0, my = 0, shown = false;

      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        if (!shown) {
          shown = true;
          ring.classList.add('on');
          dot.classList.add('on');
        }
      }, { passive: true });

      (function follow() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
        requestAnimationFrame(follow);
      })();

      document.addEventListener('mouseover', function (e) {
        var t = e.target.closest('a, button, input, textarea, [data-tilt], .chip');
        ring.classList.toggle('is-hover', !!t);
      });

      document.addEventListener('mouseleave', function () {
        ring.classList.remove('on');
        dot.classList.remove('on');
        shown = false;
      });
    })();
  }

  /* ── MAGNETIC BUTTONS ─────────────────────────────────────────────────── */
  if (finePointer && !reduceMotion) {
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
  }

  /* ── 3D TILT + GLARE ──────────────────────────────────────────────────── */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(function (el) {
      var MAX = 9;
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

      el.addEventListener('mouseenter', function () { el.style.transition = 'none'; });

      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform 400ms cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
      });
    });
  }

  /* ── NEURAL NETWORK CANVAS ────────────────────────────────────────────── */
  if (!reduceMotion) {
    (function neural() {
      var canvas = $('#neuralCanvas');
      if (!canvas || !canvas.getContext) return;

      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var nodes = [];
      var w = 0, h = 0;
      var mouse = { x: -9999, y: -9999 };
      var LINK_DIST = 130;

      function palette() {
        var s = getComputedStyle(document.documentElement);
        return {
          node: s.getPropertyValue('--brand').trim() || '#22d3ee',
          link: s.getPropertyValue('--brand-2').trim() || '#7c5cff'
        };
      }
      var colors = palette();

      function resize() {
        w = canvas.clientWidth = window.innerWidth;
        h = canvas.clientHeight = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var count = Math.min(Math.round((w * h) / 22000), 70);
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

      function hexToRgb(hex) {
        var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [34, 211, 238];
      }

      var nodeRGB = hexToRgb(colors.node);
      var linkRGB = hexToRgb(colors.link);

      function frame() {
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
        requestAnimationFrame(frame);
      }

      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX; mouse.y = e.clientY;
      }, { passive: true });

      var toggle = $('#themeToggle');
      if (toggle) {
        toggle.addEventListener('click', function () {
          setTimeout(function () {
            colors = palette();
            nodeRGB = hexToRgb(colors.node);
            linkRGB = hexToRgb(colors.link);
          }, 60);
        });
      }

      resize();
      frame();
    })();
  }

  /* ── CONTACT FORM ─────────────────────────────────────────────────────── */
  (function form() {
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
  })();

  /* ── MISC ─────────────────────────────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
