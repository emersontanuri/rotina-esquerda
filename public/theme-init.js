(function () {
  var preference;
  try { preference = localStorage.getItem('rotina-de-base:theme'); } catch (_) {}
  if (preference !== 'light' && preference !== 'dark') {
    preference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = preference;
})();
