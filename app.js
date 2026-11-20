import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const productGrid = document.getElementById('product-grid');
const dynamicTitle = document.getElementById('dynamic-title');
const btnShowAll = document.getElementById('btn-show-all');

let allProducts = [];
window.productGalleries = {}; 

// Dictionnaire pour traduire les étiquettes des caractéristiques
const specsLabels = {
  de: { surface: 'Fläche', condition: 'Zustand', year: 'Baujahr', length: 'L', width: 'B' },
  it: { surface: 'Superficie', condition: 'Stato', year: 'Anno', length: 'Lun', width: 'Lar' },
  fr: { surface: 'Surface', condition: 'État', year: 'Année', length: 'L', width: 'l' },
  en: { surface: 'Surface', condition: 'Condition', year: 'Year', length: 'L', width: 'W' }
};

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erreur chargement produits:", error);
    productGrid.innerHTML = '<p style="color: #ff5c5c; text-align: center; width: 100%;">Erreur de chargement.</p>';
    return;
  }

  allProducts = data || [];
  renderProducts('all');
}

function renderProducts(category) {
  let filtered = allProducts;
  
  if (category === 'all') {
    dynamicTitle.setAttribute('data-i18n', 'showcase_title');
    btnShowAll.style.display = 'none';
  } else {
    btnShowAll.style.display = 'inline-block';
    if (category === 'mobile_home') dynamicTitle.setAttribute('data-i18n', 'cat_1_title');
    if (category === 'maritime') dynamicTitle.setAttribute('data-i18n', 'cat_2_title');
    if (category === 'office') dynamicTitle.setAttribute('data-i18n', 'cat_3_title');
    filtered = allProducts.filter(p => p.category === category);
  }

  const lang = localStorage.getItem('luxus_site_lang') || 'de';
  if (window.applyLanguage) window.applyLanguage(lang);

  // Récupération des étiquettes traduites
  const labels = specsLabels[lang] || specsLabels.de;

  if (filtered.length === 0) {
    productGrid.innerHTML = '<p style="color: #888; text-align: center; width: 100%;">Aucun produit disponible dans cette catégorie.</p>';
    return;
  }

  productGrid.innerHTML = filtered.map(p => {
    const gallery = p.gallery_urls && p.gallery_urls.length > 0 ? p.gallery_urls : [p.image_url];
    window.productGalleries[p.id] = gallery;

    // Sélection de la bonne langue
    const displayTitle = p[`title_${lang}`] || p.title_de || p.title || 'Sans titre';
    const displayDesc = p[`description_${lang}`] || p.description_de || p.description || '';

    return `
    <div class="product-item">
      <div class="product-image-wrapper" onclick="openGallery('${p.id}')">
        <img src="${p.image_url}" alt="${displayTitle}">
        ${gallery.length > 1 ? `<div class="gallery-badge">📷 ${gallery.length} photos</div>` : ''}
      </div>
      <div class="product-info">
        <h4>${displayTitle}</h4>
        <div class="product-price">${p.price ? p.price.toLocaleString(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : 'Preis auf Anfrage'}</div>
        
        <!-- Affichage de la description ici -->
        <div class="product-description">${displayDesc}</div>
        
        <div class="product-specs">
          <span><strong>${labels.surface}:</strong> ${p.surface || '-'}</span>
          <span><strong>${labels.condition}:</strong> ${p.condition || '-'}</span>
          <span><strong>${labels.year}:</strong> ${p.year || '-'}</span>
          ${p.length ? `<span><strong>${labels.length}:</strong> ${p.length}</span>` : ''}
          ${p.width ? `<span><strong>${labels.width}:</strong> ${p.width}</span>` : ''}
        </div>
      </div>
    </div>
  `}).join('');
}

window.filterCategory = function(category) {
  renderProducts(category);
  const showcaseSection = document.getElementById('showcase');
  if (showcaseSection) showcaseSection.scrollIntoView({ behavior: 'smooth' });
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) mobileNav.hidden = true;
}

window.openGallery = function(productId) {
  const images = window.productGalleries[productId];
  if (!images || images.length === 0) return;

  const modal = document.createElement('div');
  modal.className = 'gallery-modal';
  modal.innerHTML = `
    <div class="gallery-content">
      <button class="gallery-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <div class="gallery-main">
        <img src="${images[0]}" id="main-gallery-img">
      </div>
      <div class="gallery-thumbnails">
        ${images.map((img, i) => `<img src="${img}" onclick="document.getElementById('main-gallery-img').src='${img}'; document.querySelectorAll('.gallery-thumbnails img').forEach(el=>el.classList.remove('active')); this.classList.add('active')" class="${i===0?'active':''}">`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

fetchProducts();
