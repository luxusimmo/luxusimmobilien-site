import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const productsList = document.getElementById('products-list');
const form = document.getElementById('add-product-form');
const statusMsg = document.getElementById('status-msg');

// --- GESTION DES ONGLETS DE LANGUE ---
window.switchTab = function(lang) {
  document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.lang-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.lang-tab[onclick="switchTab('${lang}')"]`).classList.add('active');
  document.getElementById(`tab-${lang}`).classList.add('active');
}

// --- AUTHENTIFICATION ---
window.login = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Erreur de connexion: " + error.message);
  } else {
    checkSession();
  }
}

window.logout = async function() {
  await supabase.auth.signOut();
  checkSession();
}

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    loginView.style.display = 'none';
    adminView.style.display = 'block';
    loadProducts();
  } else {
    loginView.style.display = 'block';
    adminView.style.display = 'none';
  }
}
checkSession();

// --- AJOUTER UN PRODUIT ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  statusMsg.textContent = "Envoi des photos et des données... (patientez)";
  statusMsg.style.color = "#aaa";

  try {
    const files = document.getElementById('p-images').files;
    if (files.length === 0) throw new Error("Veuillez sélectionner au moins une photo.");
    
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}.${fileExt}`;
      const filePath = `produits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      uploadedUrls.push(urlData.publicUrl);
    }

    const priceValue = document.getElementById('p-price').value;
    const yearValue = document.getElementById('p-year').value;

    const { error: dbError } = await supabase.from('products').insert([{
      category: document.getElementById('p-category').value,
      price: priceValue ? parseFloat(priceValue) : null,
      surface: document.getElementById('p-surface').value,
      condition: document.getElementById('p-condition').value,
      year: yearValue ? parseInt(yearValue) : null,
      length: document.getElementById('p-length').value,
      width: document.getElementById('p-width').value,
      image_url: uploadedUrls[0],
      gallery_urls: uploadedUrls,
      
      // Nouvelles colonnes multilingues
      title: document.getElementById('p-title-de').value, // Fallback
      title_de: document.getElementById('p-title-de').value,
      title_fr: document.getElementById('p-title-fr').value,
      title_it: document.getElementById('p-title-it').value,
      title_en: document.getElementById('p-title-en').value,
      
      description: document.getElementById('p-desc-de').value, // Fallback
      description_de: document.getElementById('p-desc-de').value,
      description_fr: document.getElementById('p-desc-fr').value,
      description_it: document.getElementById('p-desc-it').value,
      description_en: document.getElementById('p-desc-en').value
    }]);

    if (dbError) throw dbError;

    statusMsg.textContent = "Produit ajouté avec succès !";
    statusMsg.style.color = "#4ade80";
    form.reset();
    loadProducts();

  } catch (error) {
    console.error(error);
    statusMsg.textContent = "Erreur: " + error.message;
    statusMsg.style.color = "#ff4444";
  } finally {
    btn.disabled = false;
  }
});

// --- AFFICHER LES PRODUITS ---
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) { productsList.innerHTML = "Erreur de chargement."; return; }

  if (data.length === 0) {
    productsList.innerHTML = "<p style='color:#888'>Aucun produit pour le moment.</p>";
    return;
  }

  productsList.innerHTML = data.map(p => `
    <div class="product-list-item">
      <img src="${p.image_url}" alt="${p.title_de}">
      <div class="product-info">
        <h4>${p.title_de || p.title}</h4>
        <p>${p.price ? p.price + ' €' : 'Prix non défini'} · ${p.category} · ${p.condition}</p>
      </div>
      <button class="btn-delete" onclick="deleteProduct('${p.id}')">Supprimer</button>
    </div>
  `).join('');
}

// --- SUPPRIMER UN PRODUIT ---
window.deleteProduct = async function(id) {
  if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) alert("Erreur de suppression");
  else loadProducts();
}
