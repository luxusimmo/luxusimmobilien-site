const DEFAULT_LANG = 'de';
let translations = {};

async function loadTranslations() {
  try {
    const res = await fetch('./translations.json');
    if (!res.ok) throw new Error("Fichier translations.json introuvable");
    return await res.json();
  } catch (error) {
    console.error("Erreur de chargement JSON:", error);
    return null;
  }
}

function applyLanguage(lang) {
  if (!translations) return;
  
  const dict = translations[lang] || translations[DEFAULT_LANG];
  if (!dict) return;

  // Traduction des textes simples
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  // Traduction des textes avec du HTML (ex: <br>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });

  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('luxus_site_lang', lang);
  document.documentElement.lang = lang;

  // ⚠️ LA CORRECTION EST ICI : On envoie un signal pour dire que la langue a changé
  window.dispatchEvent(new Event('langChanged'));
}

document.addEventListener('DOMContentLoaded', async () => {
  
  translations = await loadTranslations();
  
  if (translations) {
    const saved = localStorage.getItem('luxus_site_lang');
    const browserLang = (navigator.language || 'de').slice(0, 2);
    const initial = saved || (['de', 'it', 'fr', 'en'].includes(browserLang) ? browserLang : DEFAULT_LANG);
    applyLanguage(initial);
  }

  // Gestion du menu des langues
  const langBtn = document.getElementById('lang-btn');
  const langMenu = document.getElementById('lang-menu');
  
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      langMenu.hidden = !langMenu.hidden;
    });

    document.querySelectorAll('.lang-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        applyLanguage(e.target.dataset.lang);
        langMenu.hidden = true;
      });
    });

    document.addEventListener('click', (e) => {
      if (!langMenu.hidden && !langMenu.contains(e.target) && e.target !== langBtn) {
        langMenu.hidden = true;
      }
    });
  }

  // Gestion du menu Hamburger
  const menuBtn = document.getElementById('menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      mobileNav.hidden = !mobileNav.hidden;
    });

    document.querySelectorAll('.mobile-nav a').forEach(link => {
      link.addEventListener('click', () => { mobileNav.hidden = true; });
    });
  }

  // Diaporama (Slider)
  const slides = document.querySelectorAll('.hero-slider .slide');
  if (slides.length > 1) {
    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 4000);
  }
});
