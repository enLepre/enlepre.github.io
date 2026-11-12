function initializeMenu() {
  const menu = document.querySelector('.menu');
  const toggle = menu?.querySelector('.menu-toggle');
  const nav = menu?.querySelector('nav');
  if (!menu || !toggle || !nav || menu.dataset.ready) return;
  menu.dataset.ready = 'true';
  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.inert = !open;
  };
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.addEventListener('focusout', (event) => {
    if (!menu.contains(event.relatedTarget)) setOpen(false);
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggle.focus();
      setOpen(false);
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!menu.contains(event.target)) setOpen(false);
  }, { signal: controller.signal });
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (!event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      const destination = new URL(link.href);
      const current = window.location;
      const pagePath = (url) => url.pathname.replace(/\/index\.html$/, '/');
      if (destination.origin === current.origin && pagePath(destination) === pagePath(current)) {
        event.preventDefault();
        toggle.focus();
      }
    }
    setOpen(false);
  });
}
let controller = new AbortController();
document.addEventListener('astro:before-swap', () => {
  controller.abort();
  controller = new AbortController();
});
document.addEventListener('astro:page-load', () => {
  initializeMenu();
  initializeScrollControls();
});
initializeMenu();
initializeScrollControls();

// Read the destination's rendered Markdown level after its document is loaded.
document.addEventListener('astro:before-preparation', (event) => {
  const load = event.loader;
  event.loader = async () => {
    await load();
    const current = Number(document.body.dataset.pageLevel);
    const next = Number(event.newDocument?.body.dataset.pageLevel);
    if (!Number.isFinite(current) || !Number.isFinite(next)) return;
    if (next < current) event.direction = 'back';
    else if (next > current) event.direction = 'forward';
  };
});

function initializeScrollControls() {
  const body = document.body;
  if (!body || body.dataset.scrollControlsReady) return;
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  if (!header || !footer) return;
  body.dataset.scrollControlsReady = 'true';
  let lastHidden;
  const update = () => {
    if (document.body !== body) return;
    const hidden = window.scrollY > 48;
    if (hidden === lastHidden) return;
    lastHidden = hidden;
    body.classList.toggle('is-page-scrolled', hidden);
    header.inert = hidden;
    footer.inert = hidden;
    if (hidden) {
      const menu = header.querySelector('.menu');
      menu?.classList.remove('is-open');
      const toggle = header.querySelector('.menu-toggle');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.setAttribute('aria-label', 'Open navigation');
      const nav = header.querySelector('nav');
      if (nav) nav.inert = true;
    }
  };
  window.addEventListener('scroll', update, { passive: true, signal: controller.signal });
  // Also handles restored scroll positions after browser Back/Forward.
  update();
}
