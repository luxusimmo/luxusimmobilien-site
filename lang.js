const DEFAULT_LANG = 'de'; // Allemand par défaut
let translations = {};

async function loadTranslations() {
  const res = await fetch('./translations.json');
  return res.json();
}

function applyLanguage(lang) {
  const dict = translations[lang] || translations[DEFAULT_LANG];
  if (!dict) return;

  // Utilisation de innerHTML pour supporter les balises <br>
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });

  // Mise à jour de l'état actif dans le menu déroulant
  document.querySelectorAll('.lang-opt').forEach(btn => {
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

  // Écouteurs sur les boutons de langue
  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.dataset.lang);
      document.getElementById('lang-menu').hidden = true; // Ferme le menu après sélection
    });
  });

  // Gestion de l'ouverture/fermeture du menu déroulant de langue
  const langBtn = document.getElementById('lang-btn');
  const langMenu = document.getElementById('lang-menu');
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu.hidden = !langMenu.hidden;
  });

  // Fermer le menu si on clique ailleurs
  document.addEventListener('click', (e) => {
    if (!langMenu.hidden && !langMenu.contains(e.target) && e.target !== langBtn) {
      langMenu.hidden = true;
    }
  });

  // Gestion du menu Hamburger (Mobile)
  const menuBtn = document.getElementById('menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  menuBtn.addEventListener('click', () => {
    mobileNav.hidden = !mobileNav.hidden;
  });

  // Fermer le menu mobile au clic sur un lien
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.hidden = true;
    });
  });
})();
