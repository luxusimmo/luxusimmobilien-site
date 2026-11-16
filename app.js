import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const productGrid = document.getElementById('product-grid');

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

  if (!data || data.length === 0) {
    productGrid.innerHTML = '<p style="color: #888; text-align: center; width: 100%;">Aucun produit disponible pour le moment.</p>';
    return;
  }

  productGrid.innerHTML = data.map(p => `
    <div class="product-item">
      <img src="${p.image_url}" alt="${p.title}">
      <div class="product-info">
        <h4>${p.title}</h4>
        <div class="product-price">${p.price ? p.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : 'Prix sur demande'}</div>
        <div class="product-specs">
          <span>Fläche: ${p.surface || '-'}</span>
          <span>Zustand: ${p.condition || '-'}</span>
          <span>Baujahr: ${p.year || '-'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

fetchProducts();
