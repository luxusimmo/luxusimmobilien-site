import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allProducts = [];
let currentCategory = '';

// Traductions pour les fiches produits
const translations = {
  de: { surface: 'Fläche', condition: 'Zustand', year: 'Baujahr', length: 'Länge', width: 'Breite', priceOnReq: 'Preis auf Anfrage', whatsapp: 'Auf WhatsApp anfragen', backHome: 'Zurück zur Startseite', backList: 'Zurück zur Liste', desc: 'Beschreibung', cat_mobile_home: 'Mobile Homes', cat_maritime: 'Maritime', cat_office: 'Office' },
  it: { surface: 'Superficie', condition: 'Stato', year: 'Anno', length: 'Lunghezza', width: 'Larghezza', priceOnReq: 'Prezzo su richiesta', whatsapp: 'Richiedi su WhatsApp', backHome: 'Torna alla home', backList: 'Torna alla lista', desc: 'Descrizione', cat_mobile_home: 'Case Mobili', cat_maritime: 'Marittimi', cat_office: 'Ufficio' },
  fr: { surface: 'Surface', condition: 'État', year: 'Année', length: 'Longueur', width: 'Largeur', priceOnReq: 'Prix sur demande', whatsapp: 'Demander sur WhatsApp', backHome: "Retour à l'accueil", backList: 'Retour à la liste', desc: 'Description', cat_mobile_home: 'Maisons Mobiles', cat_maritime: 'Maritime', cat_office: 'Bureau' },
  en: { surface: 'Surface', condition: 'Condition', year: 'Year', length: 'Length', width: 'Width', priceOnReq: 'Price on request', whatsapp: 'Inquire on WhatsApp', backHome: 'Back to home', backList: 'Back to list', desc: 'Description', cat_mobile_home: 'Mobile Homes', cat_maritime: 'Maritime', cat_office: 'Office' }
};

function getLang() { return localStorage.getItem('luxus_site_lang') || 'de'; }

// --- NAVIGATION ENTRE LES VUES ---
window.showView = function(viewName) {
  document.getElementById('view-home').hidden = true;
  document.getElementById('view-category').hidden = true;
  document.getElementById('view-product').hidden = true;
  
  document.getElementById(`view-${viewName}`).hidden = false;
  window.scrollTo(0, 0);
}

window.showCategory = function(category) {
  currentCategory = category;
  const lang = getLang();
  const t = translations[lang];
  
  // Mettre à jour le titre de la page
  document.getElementById('category-title').textContent = t[`cat_${category}`];
  
  // Filtrer les produits
  const filtered = allProducts.filter(p => p.category === category);
  const grid = document.getElementById('category-grid');
  
  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">Keine Produkte in dieser Kategorie.</p>`;
  } else {
    grid.innerHTML = filtered.map(p => {
      const title = p[`title_${lang}`] || p.title_de || p.title;
      const price = p.price ? p.price.toLocaleString(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : t.priceOnReq;
      const img = p.gallery_urls && p.gallery_urls.length > 0 ? p.gallery_urls[0] : p.image_url;
      
      return `
        <div class="product-card" onclick="showProductDetail('${p.id}')">
          <div class="card-image">
            <img src="${img}" alt="${title}">
          </div>
          <div class="card-info">
            <h3>${title}</h3>
            <p class="card-price">${price}</p>
            <p class="card-specs">${p.surface} · ${p.year} · ${p.condition}</p>
            <span class="btn-detail">Détails →</span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Fermer le menu mobile si ouvert
  document.getElementById('mobile-nav').hidden = true;
  showView('category');
}

window.showProductDetail = function(id) {
  const p = allProducts.find(prod => prod.id === id);
  if (!p) return;
  
  const lang = getLang();
  const t = translations[lang];
  
  // Remplissage des données
  document.getElementById('detail-category').textContent = t[`cat_${p.category}`];
  document.getElementById('detail-title').textContent = p[`title_${lang}`] || p.title_de || p.title;
  document.getElementById('detail-year').textContent = `${t.year}: ${p.year} · ${p.condition}`;
  document.getElementById('detail-price').textContent = p.price ? p.price.toLocaleString(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : t.priceOnReq;
  
  // Description
  document.getElementById('detail-desc').textContent = p[`description_${lang}`] || p.description_de || p.description || '';

  // Grille des caractéristiques
  document.getElementById('detail-specs').innerHTML = `
    <div class="spec-item"><span class="spec-icon">📐</span> <div><strong>${t.surface}</strong><br>${p.surface || '-'}</div></div>
    <div class="spec-item"><span class="spec-icon">📏</span> <div><strong>${t.length}</strong><br>${p.length || '-'}</div></div>
    <div class="spec-item"><span class="spec-icon">↔️</span> <div><strong>${t.width}</strong><br>${p.width || '-'}</div></div>
    <div class="spec-item"><span class="spec-icon">🏷️</span> <div><strong>${t.condition}</strong><br>${p.condition || '-'}</div></div>
  `;

  // Bouton WhatsApp
  const waMsg = encodeURIComponent(`Hallo, ich interessiere mich für das Produkt: ${p[`title_${lang}`] || p.title_de}`);
  document.getElementById('detail-whatsapp').href = `https://wa.me/491784065141?text=${waMsg}`;
  document.getElementById('detail-whatsapp').innerHTML += `<span>${t.whatsapp}</span>`;

  // Galerie d'images
  const gallery = p.gallery_urls && p.gallery_urls.length > 0 ? p.gallery_urls : [p.image_url];
  document.getElementById('detail-main-img').src = gallery[0];
  document.getElementById('detail-thumbnails').innerHTML = gallery.map((img, i) => `
    <img src="${img}" onclick="document.getElementById('detail-main-img').src='${img}'" class="${i === 0 ? 'active' : ''}">
  `).join('');

  showView('product');
}

// --- CHARGEMENT DES DONNÉES ---
async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Erreur chargement produits:", error);
    return;
  }
  allProducts = data || [];
}

// Initialisation
fetchProducts();
