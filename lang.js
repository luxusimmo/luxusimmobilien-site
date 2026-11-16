const DEFAULT_LANG = 'de'; // Allemand par défaut
let translations = {};

async function loadTranslations() {
  const res = await fetch('./translations.json');
  return res.json();
}

function applyLanguage(lang) {
  const dict = translations[lang] || translations[DEFAULT_LANG];
  if (!dict) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('luxus_site_lang', lang);
  document.documentElement.lang = lang;
}

(async function initLang() {
  try {
    translations = await loadTranslations();
  } catch (err) {
    console.error('Erreur chargement traductions :', err);
    return;
  }

  const saved = localStorage.getItem('luxus_site_lang');
  const browserLang = (navigator.language || 'de').slice(0, 2);
  const initial = saved || (['de', 'it', 'fr', 'en'].includes(browserLang) ? browserLang : DEFAULT_LANG);

  applyLanguage(initial);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });
})();
