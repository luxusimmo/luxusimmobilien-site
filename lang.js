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

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });

  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('luxus_site_lang', lang);
  document.documentElement.lang = lang;
}

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
  
  // 1. CHARGEMENT DES LANGUES
  try {
    translations = await loadTranslations();
    const saved = localStorage.getItem('luxus_site_lang');
    const browserLang = (navigator.language || 'de').slice(0, 2);
    const initial = saved || (['de', 'it', 'fr', 'en'].includes(browserLang) ? browserLang : DEFAULT_LANG);
    
    if (translations) applyLanguage(initial);
  } catch (err) {
    console.error('Erreur traductions:', err);
  }

  // 2. GESTION DU MENU DES LANGUES
  const langBtn = document.getElementById('lang-btn');
  const langMenu = document.getElementById('lang-menu');
  
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.hidden = !langMenu.hidden;
    });

    // Sélection de la langue
    document.querySelectorAll('.lang-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        applyLanguage(e.target.dataset.lang);
        langMenu.hidden = true;
      });
    });

    // Fermer le menu si on clique ailleurs
    document.addEventListener('click', (e) => {
      if (!langMenu.hidden && !langMenu.contains(e.target) && e.target !== langBtn) {
        langMenu.hidden = true;
      }
    });
  }

  // 3. GESTION DU MENU HAMBURGER
  const menuBtn = document.getElementById('menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileNav.hidden = !mobileNav.hidden;
    });

    // Fermer au clic sur un lien
    document.querySelectorAll('.mobile-nav a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.hidden = true;
      });
    });
  }

  // 4. DIAPORAMA (SLIDER) DE L'EN-TÊTE
  const slides = document.querySelectorAll('.hero-slider .slide');
  if (slides.length > 1) {
    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 4000); // Change d'image toutes les 4 secondes
  }

});
