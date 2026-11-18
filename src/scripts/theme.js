// Runs in the head before paint, then keeps Astro's client navigation in sync.
(() => {
  if (window.__blogTheme) {
    window.__blogTheme();
    return;
  }
  const key = 'personal-blog-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'light' || value === 'dark';
  let preference;
  try { preference = localStorage.getItem(key); } catch { /* Storage can be unavailable. */ }
  if (!valid(preference)) preference = 'system';

  function apply(target = document) {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    target.documentElement.dataset.theme = theme;
    target.documentElement.style.colorScheme = theme;
    const button = target.querySelector('#theme-toggle');
    if (button) button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
  window.__blogTheme = apply;
  apply();
  let themeTransition;
  document.addEventListener('click', event => {
    if (!event.target.closest('#theme-toggle')) return;
    if (themeTransition) return;
    preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(key, preference);
    } catch { /* Keep the selection for this visit even without storage. */ }
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply();
      return;
    }
    // Capture the whole page together, without Astro's directional page movement.
    document.documentElement.dataset.themeTransition = '';
    themeTransition = document.startViewTransition(() => apply());
    const finish = () => {
      delete document.documentElement.dataset.themeTransition;
      themeTransition = undefined;
    };
    themeTransition.finished.then(finish, finish);
  });
  document.addEventListener('astro:before-preparation', () => themeTransition?.skipTransition());
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    apply();
  });
  document.addEventListener('astro:before-swap', event => apply(event.newDocument));
  document.addEventListener('astro:page-load', () => apply());
})();
