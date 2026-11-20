import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const productsList = document.getElementById('products-list');
const form = document.getElementById('add-product-form');
const statusMsg = document.getElementById('status-msg');
const formTitle = document.getElementById('form-title');
const btnSubmitForm = document.getElementById('btn-submit-form');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

let editingProductId = null; // Stocke l'ID si on est en mode édition
let currentEditingGallery = []; // Stocke les photos existantes

// --- GESTION DES ONGLETS ---
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
  if (error) alert("Erreur de connexion: " + error.message);
  else checkSession();
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

// --- AJOUTER OU MODIFIER UN PRODUIT ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = btnSubmitForm;
  btn.disabled = true;
  statusMsg.textContent = "Traitement en cours... (patientez)";
  statusMsg.style.color = "#aaa";

  try {
    const files = document.getElementById('p-images').files;
    let uploadedUrls = [];

    // Si on ajoute un nouveau produit, les photos sont obligatoires
    if (!editingProductId && files.length === 0) {
      throw new Error("Veuillez sélectionner au moins une photo pour un nouveau produit.");
    }

    // 1. Upload des nouvelles images (si sélectionnées)
    if (files.length > 0) {
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
    }

    const priceValue = document.getElementById('p-price').value;
    const yearValue = document.getElementById('p-year').value;

    // Préparation des données communes
    const productData = {
      category: document.getElementById('p-category').value,
      price: priceValue ? parseFloat(priceValue) : null,
      surface: document.getElementById('p-surface').value,
      condition: document.getElementById('p-condition').value,
      year: yearValue ? parseInt(yearValue) : null,
      length: document.getElementById('p-length').value,
      width: document.getElementById('p-width').value,
      
      title: document.getElementById('p-title-de').value,
      title_de: document.getElementById('p-title-de').value,
      title_fr: document.getElementById('p-title-fr').value,
      title_it: document.getElementById('p-title-it').value,
      title_en: document.getElementById('p-title-en').value,
      
      description: document.getElementById('p-desc-de').value,
      description_de: document.getElementById('p-desc-de').value,
      description_fr: document.getElementById('p-desc-fr').value,
      description_it: document.getElementById('p-desc-it').value,
      description_en: document.getElementById('p-desc-en').value
    };

    // Si on a uploadé de nouvelles photos, on met à jour la galerie
    if (uploadedUrls.length > 0) {
      productData.image_url = uploadedUrls[0];
      productData.gallery_urls = uploadedUrls;
    }

    if (editingProductId) {
      // MODE MODIFICATION
      const { error: dbError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProductId);
      
      if (dbError) throw dbError;
      statusMsg.textContent = "Produit mis à jour avec succès !";
    } else {
      // MODE AJOUT
      const { error: dbError } = await supabase
        .from('products')
        .insert([productData]);
      
      if (dbError) throw dbError;
      statusMsg.textContent = "Produit ajouté avec succès !";
    }

    statusMsg.style.color = "#4ade80";
    resetForm();
    loadProducts();

  } catch (error) {
    console.error(error);
    statusMsg.textContent = "Erreur: " + error.message;
    statusMsg.style.color = "#ff4444";
  } finally {
    btn.disabled = false;
  }
});

// --- CHARGER LA LISTE DES PRODUITS ---
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) { productsList.innerHTML = "Erreur de chargement."; return; }

  if (data.length === 0) {
    productsList.innerHTML = "<p style='color:#888'>Aucun produit pour le moment.</p>";
    return;
  }

  productsList.innerHTML = data.map(p => `
    <div class="product-list-item">
      <img src="${p.image_url}" alt="photo">
      <div class="product-info">
        <h4>${p.title_de || p.title}</h4>
        <p>${p.price ? p.price + ' €' : 'Prix non défini'} · ${p.category} · ${p.condition}</p>
      </div>
      <div class="product-actions">
        <button class="btn-edit" onclick="editProduct('${p.id}')">Modifier</button>
        <button class="btn-delete" onclick="deleteProduct('${p.id}')">Supprimer</button>
      </div>
    </div>
  `).join('');
}

// --- MODIFIER UN PRODUIT ---
window.editProduct = async function(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return alert("Erreur lors du chargement du produit.");

  const p = data;
  editingProductId = p.id;
  currentEditingGallery = p.gallery_urls || [p.image_url];

  // Remplir le formulaire
  document.getElementById('p-title-de').value = p.title_de || p.title || '';
  document.getElementById('p-title-fr').value = p.title_fr || '';
  document.getElementById('p-title-it').value = p.title_it || '';
  document.getElementById('p-title-en').value = p.title_en || '';

  document.getElementById('p-desc-de').value = p.description_de || p.description || '';
  document.getElementById('p-desc-fr').value = p.description_fr || '';
  document.getElementById('p-desc-it').value = p.description_it || '';
  document.getElementById('p-desc-en').value = p.description_en || '';

  document.getElementById('p-category').value = p.category || 'mobile_home';
  document.getElementById('p-price').value = p.price || '';
  document.getElementById('p-surface').value = p.surface || '';
  document.getElementById('p-condition').value = p.condition || 'Neuf';
  document.getElementById('p-year').value = p.year || '';
  document.getElementById('p-length').value = p.length || '';
  document.getElementById('p-width').value = p.width || '';

  // Changer l'interface du formulaire
  formTitle.textContent = "Modifier le produit";
  btnSubmitForm.textContent = "Mettre à jour le produit";
  btnCancelEdit.style.display = 'block';
  
  // Remonter au formulaire en douceur
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- RÉINITIALISER LE FORMULAIRE ---
window.resetForm = function() {
  editingProductId = null;
  form.reset();
  formTitle.textContent = "Ajouter un nouveau produit";
  btnSubmitForm.textContent = "Ajouter le produit";
  btnCancelEdit.style.display = 'none';
  statusMsg.textContent = "";
}

// --- SUPPRIMER UN PRODUIT ---
window.deleteProduct = async function(id) {
  if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) alert("Erreur de suppression");
  else loadProducts();
}
