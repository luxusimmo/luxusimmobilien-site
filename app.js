import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const productGrid = document.getElementById('product-grid');
const dynamicTitle = document.getElementById('dynamic-title');
const btnShowAll = document.getElementById('btn-show-all');

let allProducts = []; // On stocke tous les produits ici

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
  renderProducts('all'); // Au chargement, on affiche tout
}

// 2. Afficher les produits (avec filtre)
function renderProducts(category) {
  let filtered = allProducts;
  
  // Mise à jour du titre et du bouton
  if (category === 'all') {
    dynamicTitle.setAttribute('data-i18n', 'showcase_title');
    btnShowAll.style.display = 'none';
  } else {
    btnShowAll.style.display = 'inline-block';
    if (category === 'mobile_home') dynamicTitle.setAttribute('data-i18n', 'cat_1_title');
    if (category === 'maritime') dynamicTitle.setAttribute('data-i18n', 'cat_2_title');
    if (category === 'office') dynamicTitle.setAttribute('data-i18n', 'cat_3_title');
    
    // Filtrer les produits
    filtered = allProducts.filter(p => p.category === category);
  }

  // On force la mise à jour de la traduction du titre
  const lang = localStorage.getItem('luxus_site_lang') || 'de';
  if (window.applyLanguage) window.applyLanguage(lang);

  // Affichage
  if (filtered.length === 0) {
    productGrid.innerHTML = '<p style="color: #888; text-align: center; width: 100%;">Aucun produit disponible dans cette catégorie.</p>';
    return;
  }

  productGrid.innerHTML = filtered.map(p => `
    <div class="product-item">
      <img src="${p.image_url}" alt="${p.title}">
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
  `).join('');
}

// 3. Fonction globale appelée par les cartes HTML
window.filterCategory = function(category) {
  renderProducts(category);
  
  // Défilement fluide vers la section catalogue
  const showcaseSection = document.getElementById('showcase');
  if (showcaseSection) {
    showcaseSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Fermer le menu mobile si ouvert
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) mobileNav.hidden = true;
}

// Initialisation
fetchProducts();
