# Portfolio — Muhammad Sarmad Qadir

Single-page animated portfolio. Plain HTML, CSS and JavaScript with one PHP
endpoint for the contact form. No framework, no build step, no dependencies.

**Local URL:** http://localhost/porfolio/

```
index.html            The whole page
contact.php           Contact form endpoint (JSON in, JSON out)
assets/css/style.css  Design tokens, layout, all motion
assets/js/main.js     Interactions — no libraries
assets/Muhammad-Sarmad-Qadir-CV.pdf   Served by the "Download CV" button
messages.log          Created on first contact submission (see below)
```

## Editing your details

Everything is content in `index.html` — no templating to learn.

| What | Where |
|---|---|
| Name, tagline, bio | `.hero` section |
| Rotating "I build …" phrases | `words` array in `main.js` (`typewriter()`) |
| Skill percentages | `data-bar="85"` on each `.bar i` |
| Stat counters | `data-count` / `data-suffix` on `.stat__num` |
| Jobs | `.timeline` — newest first |
| Projects | `.works` (Agrovise, Lahore Home Food) then `.project` (final-year) |
| Email / phone / LinkedIn | Search for `chsarmad888` and `linkedin.com` — each appears in the hero, the contact cards, and `contact.php` |

## Colours

All colour lives in CSS custom properties at the top of `style.css`. Change the
two brand values and the whole page follows — buttons, gradients, glows, the
canvas particles and the charts all read from them.

```css
:root      { --brand: #22d3ee; --brand-2: #7c5cff; }  /* dark theme */
[data-theme="light"] { --brand: #0891b2; --brand-2: #6d28d9; }
```

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

Animation is CSS-driven wherever possible; JavaScript only adds classes or
sets custom properties. Only `transform` and `opacity` are animated, so nothing
triggers layout.

- Scroll reveals use `IntersectionObserver` and unobserve after firing.
- Cursor follower, magnetic buttons and 3D card tilt are gated to
  `(pointer: fine)` — they never load on touch devices.
- Everything respects `prefers-reduced-motion: reduce`: the canvas, grain,
  cursor and all transitions switch off and content renders in its final state.
- The page is fully readable with JavaScript disabled — reveal elements are
  only hidden once `main.js` confirms it is running.


