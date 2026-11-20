import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const productGrid = document.getElementById('product-grid');
const dynamicTitle = document.getElementById('dynamic-title');
const btnShowAll = document.getElementById('btn-show-all');

let allProducts = [];
window.productGalleries = {}; // Stocke les galeries pour la modale

// 1. Récupérer les produits depuis Supabase
async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erreur chargement produits:", error);
    productGrid.innerHTML = '<p style="color: #ff5c5c; text-align: center; width: 100%;">Erreur de chargement des produits.</p>';
    return;
  }

  allProducts = data || [];
  renderProducts('all');
}

// 2. Afficher les produits (avec filtre)
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

  if (filtered.length === 0) {
    productGrid.innerHTML = '<p style="color: #888; text-align: center; width: 100%;">Aucun produit disponible dans cette catégorie.</p>';
    return;
  }

  productGrid.innerHTML = filtered.map(p => {
    // Gestion de la galerie (fallback si une seule image)
    const gallery = p.gallery_urls && p.gallery_urls.length > 0 ? p.gallery_urls : [p.image_url];
    window.productGalleries[p.id] = gallery;

    return `
    <div class="product-item">
      <div class="product-image-wrapper" onclick="openGallery('${p.id}')">
        <img src="${p.image_url}" alt="${p.title}">
        ${gallery.length > 1 ? `<div class="gallery-badge">📷 ${gallery.length} photos</div>` : ''}
      </div>
      <div class="product-info">
        <h4>${p.title}</h4>
        <div class="product-price">${p.price ? p.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : 'Preis auf Anfrage'}</div>
        <div class="product-specs">
          <span><strong>Fläche:</strong> ${p.surface || '-'}</span>
          <span><strong>Zustand:</strong> ${p.condition || '-'}</span>
          <span><strong>Baujahr:</strong> ${p.year || '-'}</span>
          ${p.length ? `<span><strong>L:</strong> ${p.length}</span>` : ''}
          ${p.width ? `<span><strong>B:</strong> ${p.width}</span>` : ''}
        </div>
      </div>
    </div>
  `}).join('');
}

// 3. Fonction globale pour le filtre des catégories
window.filterCategory = function(category) {
  renderProducts(category);
  const showcaseSection = document.getElementById('showcase');
  if (showcaseSection) showcaseSection.scrollIntoView({ behavior: 'smooth' });
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) mobileNav.hidden = true;
}

// 4. Fonction pour ouvrir la galerie photo
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

// Lancement
fetchProducts();
