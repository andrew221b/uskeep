// Resolve the saved theme before CSS paints, including direct legal-page visits.
(() => {
  let theme;
  try { theme = localStorage.getItem('uskeep-site-theme'); } catch { /* private browsing */ }
  document.documentElement.dataset.theme = theme === 'light' || theme === 'dark'
    ? theme : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
})();
