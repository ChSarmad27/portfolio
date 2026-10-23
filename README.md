# Portfolio — Muhammad Sarmad Qadir

Single-page animated portfolio. Plain HTML, CSS and JavaScript with one PHP
endpoint for the contact form. No framework and no build step. The only
library is GSAP (with ScrollTrigger) for the scroll-linked motion, and it is
vendored, so the site needs no CDN.

**Local URL:** <http://localhost/porfolio/>

```text
index.html              The whole page
contact.php             Contact form endpoint (JSON in, JSON out)
assets/css/style.css    Design tokens, layout, all CSS motion
assets/js/main.js       Interactions: vanilla JS, plus GSAP for scroll-linked effects
assets/vendor/gsap/     GSAP 3.13.0 core + ScrollTrigger (standard no-charge licence)
assets/img/turbo/       Turbo 2.0 screenshots (WebP)
assets/img/agrovise/    Agrovise screenshots (WebP)
assets/Muhammad-Sarmad-Qadir-CV.pdf   Served by the "Download CV" button
messages.log            Created on first contact submission (see below)
```

## Editing your details

Everything is content in `index.html` — no templating to learn.

| What | Where |
|---|---|
| Name, tagline, bio | `.hero` section |
| Rotating "I build …" phrases | `words` array in `main.js` (`typewriter`) |
| Skill percentages | `data-bar="85"` **and** `style="--w:.85"` on each `.bar i` (the style is the no-JS width) |
| Stat counters | `data-count` / `data-suffix` on `.stat__num` and `.case__metrics b`; keep the final figure as the element's text too |
| Jobs | `.timeline` — newest first |
| Projects | `#turbo` (featured case study), then `.works` (Agrovise, Lahore Home Food), then `.project` (final-year) |
| Email / phone / LinkedIn | Search for `chsarmad888` and `linkedin.com` — each appears in the hero, the contact cards, and `contact.php` |

### Screenshot galleries

Each `[data-gallery]` block holds three parallel lists that must stay in step:
`figure.device__slide` (the screenshots), `p.gallery__cap` (one caption per
screenshot) and `button.gallery__tab`. The ids tie them together
(`turboSlide1` ↔ `turboCap1` ↔ `turboTab1`). To add a screen, add one of each.
Only the first slide's image should load eagerly; give the rest
`loading="lazy"`.

The screenshots are 1440 × 900 (16:10) with an 800 px copy for `srcset`.
They were captured from the real sites in headless Chrome:

- **Turbo 2.0** — taken from the Turbo 2.0 project's own browser test run.
- **Agrovise** — taken from its static GitHub Pages build (`agrovise/docs/`),
  which records no visitor analytics. The custom cursor was hidden for the
  capture, and the home shot was taken at 1440 × 1040 and cropped to 900 px so
  the counter strip stays out of frame.

PNG → WebP conversion uses PHP's GD (`imagewebp`, quality 80), which WAMP's PHP
already has.

## Colours

All colour lives in CSS custom properties at the top of `style.css`. Change the
three brand values and the whole page follows: buttons, gradients, glows, the
canvas particles and the charts all read from them.

```css
:root                { --brand: #22d3ee; --brand-2: #8b5cf6; --brand-3: #f472b6; }  /* dark theme */
[data-theme="light"] { --brand: #0e7490; --brand-2: #7c3aed; --brand-3: #db2777; }
```

Each project card also carries its own accent pair (`--p1`, `--p2`) and a
readable text shade (`--p-text`), defined per theme just below the tokens:
yellow/blue for Turbo 2.0, green/gold for Agrovise, orange/rose for Lahore
Home Food.

The theme toggle stores the choice in `localStorage` under `sq-theme`.

## Contact form

`contact.php` validates input, rejects header injection, and has a honeypot
field for bots. It always appends the message to `messages.log` **first**,
then tries `mail()`.

On WAMP, `mail()` normally fails because there is no SMTP server configured —
that is expected. When it fails, the page falls back to opening the visitor's
own email client with the message pre-filled, so nothing is lost either way.
The message is in `messages.log` regardless.

To send real email, either configure SMTP in `php.ini`, or replace the `mail()`
call with PHPMailer pointed at an SMTP account.

> `messages.log` sits in the web root. Before putting this on a public host,
> move it outside the document root or block it — the included pattern in
> Agrovise's `.htaccess` is a good reference.

## Motion

CSS does the entrances and loops; GSAP + ScrollTrigger handles everything tied
to scroll position:

- hero content, visual and background drift apart as you scroll away;
- the About statement lights up word by word;
- the experience timeline draws itself and lights each role as it is reached;
- screenshot frames tip up into place, and the Turbo phone rides at its own speed;
- the skills marquee speeds up and leans with scroll velocity.

Native scrolling is never hijacked (no smooth-scroll library).

Rules that keep it smooth:

- Only `transform` and `opacity` are animated. Reveals use the individual
  `translate` / `scale` properties, so they never fight the `transform` that
  hover, tilt, magnetic and GSAP effects set.
- Scroll reveals use `IntersectionObserver` and unobserve after firing.
- Blocks that scroll out of view get `.is-idle`, which pauses their CSS loops;
  the marquee's GSAP ticker sleeps off screen, and the typewriter waits.
- Nothing inside an SVG is animated. In Chrome, animating an SVG, its children
  or a box that scales one forces a layout every frame. The EEG visual's motion
  lives on its HTML rings instead.
- Cursor follower, magnetic buttons, tilt and spotlight borders are gated to
  `(pointer: fine)` — they never load on touch devices.
- Galleries auto-advance every 6 s only while on screen, pause on hover or
  focus, and have a pause button. Arrow keys move between tabs.
- `prefers-reduced-motion: reduce` switches GSAP off entirely, along with the
  canvas, grain, cursor, autoplay and every transition. Content renders in its
  final state.
- The page is fully readable with JavaScript disabled — reveal elements are
  only hidden once `main.js` confirms it is running, and counters hold their
  final figures in the HTML.
