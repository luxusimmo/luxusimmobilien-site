import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allProducts = [];
let currentCategory = '';

const translations = {
  de: { surface: 'Fläche', condition: 'Zustand', year: 'Baujahr', length: 'Länge', width: 'Breite', priceOnReq: 'Preis auf Anfrage', whatsapp: 'Auf WhatsApp anfragen', backHome: 'Zurück zur Startseite', backList: 'Zurück zur Liste', desc: 'Beschreibung', cat_mobile_home: 'Mobile Homes', cat_maritime: 'Maritime', cat_office: 'Office', client_verified: 'Verifizierter Kunde' },
  it: { surface: 'Superficie', condition: 'Stato', year: 'Anno', length: 'Lunghezza', width: 'Larghezza', priceOnReq: 'Prezzo su richiesta', whatsapp: 'Richiedi su WhatsApp', backHome: 'Torna alla home', backList: 'Torna alla lista', desc: 'Descrizione', cat_mobile_home: 'Case Mobili', cat_maritime: 'Marittimi', cat_office: 'Ufficio', client_verified: 'Cliente Verificato' },
  fr: { surface: 'Surface', condition: 'État', year: 'Année', length: 'Longueur', width: 'Largeur', priceOnReq: 'Prix sur demande', whatsapp: 'Demander sur WhatsApp', backHome: "Retour à l'accueil", backList: 'Retour à la liste', desc: 'Description', cat_mobile_home: 'Maisons Mobiles', cat_maritime: 'Maritime', cat_office: 'Bureau', client_verified: 'Client Vérifié' },
  en: { surface: 'Surface', condition: 'Condition', year: 'Year', length: 'Length', width: 'Width', priceOnReq: 'Price on request', whatsapp: 'Inquire on WhatsApp', backHome: 'Back to home', backList: 'Back to list', desc: 'Description', cat_mobile_home: 'Mobile Homes', cat_maritime: 'Maritime', cat_office: 'Office', client_verified: 'Verified Client' }
};

function getLang() { return localStorage.getItem('luxus_site_lang') || 'de'; }

// --- NAVIGATION ---
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
  
  document.getElementById('category-title').textContent = t[`cat_${category}`];
  
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
          <div class="card-image"><img src="${img}" alt="${title}"></div>
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
  document.getElementById('mobile-nav').hidden = true;
  showView('category');
}

window.showProductDetail = function(id) {
  const p = allProducts.find(prod => prod.id === id);
  if (!p) return;
  const lang = getLang();
  const t = translations[lang];
  
  document.getElementById('detail-category').textContent = t[`cat_${p.category}`];
  document.getElementById('detail-title').textContent = p[`title_${lang}`] || p.title_de || p.title;
  document.getElementById('detail-year').textContent = `${t.year}: ${p.year} · ${p.condition}`;
  document.getElementById('detail-price').textContent = p.price ? p.price.toLocaleString(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : t.priceOnReq;
  document.getElementById('detail-desc').textContent = p[`description_${lang}`] || p.description_de || p.description || '';

  document.getElementById('detail-specs').innerHTML = `
    <div class="spec-item"><span class="spec-icon">📐</span> <div><strong>${t.surface}</strong><br>${p.surface || '-'}</div></div>
    <div class="spec-item"><span class="spec-icon">📏</span> <div><strong>${t.length}</strong><br>${p.length || '-'}</div></div>
    <div class="spec-item"><span class="spec-icon">↔️</span> <div><strong>${t.width}</strong><br>${p.width || '-'}</div></div>
    <div class="spec-item"><span class="spec-icon">🏷️</span> <div><strong>${t.condition}</strong><br>${p.condition || '-'}</div></div>
  `;

  const waMsg = encodeURIComponent(`Hallo, ich interessiere mich für das Produkt: ${p[`title_${lang}`] || p.title_de}`);
  const waBtn = document.getElementById('detail-whatsapp');
  waBtn.href = `https://wa.me/491784065141?text=${waMsg}`;
  waBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg><span>${t.whatsapp}</span>`;

  const gallery = p.gallery_urls && p.gallery_urls.length > 0 ? p.gallery_urls : [p.image_url];
  document.getElementById('detail-main-img').src = gallery[0];
  document.getElementById('detail-thumbnails').innerHTML = gallery.map((img, i) => `
    <img src="${img}" onclick="document.getElementById('detail-main-img').src='${img}'; document.querySelectorAll('.thumbnails img').forEach(el=>el.classList.remove('active')); this.classList.add('active')" class="${i === 0 ? 'active' : ''}">
  `).join('');

  showView('product');
}

// --- CHARGEMENT DES PRODUITS ---
async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!error) allProducts = data || [];
}

// --- CHARGEMENT DES TÉMOIGNAGES ---
async function fetchTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;

  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false }).limit(6);

  if (error || !data || data.length === 0) {
    document.getElementById('testimonials').style.display = 'none'; 
    return;
  }

  const lang = getLang();
  // On récupère la traduction de "Client Vérifié"
  const translatedVerified = translations[lang].client_verified;

  grid.innerHTML = data.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-quote">"</div>
      <p class="testimonial-text">${t.quote}</p>
      <div class="testimonial-author">
        <img src="${t.image_url}" alt="${t.name}">
        <div>
          <h4>${t.name}</h4>
          <span>${translatedVerified}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Initialisation
fetchProducts();
fetchTestimonials();

// ⚠️ LA CORRECTION EST ICI : On écoute si la langue a changé pour actualiser les témoignages
window.addEventListener('langChanged', () => {
  fetchTestimonials();
});
