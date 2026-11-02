// Sets the colour theme before the first paint, so a saved dark choice never
// flashes light. The default is light. It is a separate file (not inline) so a
// strict Content-Security-Policy can allow it. Keep the storage key in step
// with src/app/theme.ts.
(function () {
  var theme = null;

  try {
    theme = window.localStorage.getItem('theme');
  } catch {
    // Storage can be blocked. Stay on the default.
  }

  document.documentElement.setAttribute(
    'data-theme',
    theme === 'dark' ? 'dark' : 'light',
  );
})();
