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
const previewContainer = document.getElementById('image-preview-container');

let editingProductId = null;
let productImages = []; // Tableau qui stocke { file: File|null, url: string }

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
  if (error) alert("Erreur: " + error.message);
  else checkSession();
}
window.logout = async function() { await supabase.auth.signOut(); checkSession(); }

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

// --- GESTION DES IMAGES ET DE L'ORDRE ---
document.getElementById('p-images').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    productImages.push({ file: file, url: URL.createObjectURL(file) });
  });
  renderImagePreviews();
  e.target.value = ''; // Reset input
});

function renderImagePreviews() {
  if (productImages.length === 0) {
    previewContainer.innerHTML = '';
    return;
  }

  previewContainer.innerHTML = productImages.map((img, index) => `
    <div class="preview-item">
      ${index === 0 ? '<span class="cover-badge">Couverture</span>' : ''}
      <img src="${img.url}" alt="preview">
      <div class="preview-actions">
        <button type="button" onclick="moveImage(${index}, -1)" ${index === 0 ? 'disabled' : ''}>⬆️</button>
        <button type="button" onclick="moveImage(${index}, 1)" ${index === productImages.length - 1 ? 'disabled' : ''}>⬇️</button>
        <button type="button" class="btn-del-img" onclick="removeImage(${index})">❌</button>
      </div>
    </div>
  `).join('');
}

window.moveImage = function(index, direction) {
  if (direction === -1 && index > 0) {
    [productImages[index - 1], productImages[index]] = [productImages[index], productImages[index - 1]];
  } else if (direction === 1 && index < productImages.length - 1) {
    [productImages[index + 1], productImages[index]] = [productImages[index], productImages[index + 1]];
  }
  renderImagePreviews();
}

window.removeImage = function(index) {
  productImages.splice(index, 1);
  renderImagePreviews();
}

// --- AJOUTER / MODIFIER ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = btnSubmitForm;
  btn.disabled = true;
  statusMsg.textContent = "Traitement en cours...";
  statusMsg.style.color = "#aaa";

  try {
    if (productImages.length === 0) {
      throw new Error("Veuillez ajouter au moins une photo.");
    }

    const finalUrls = [];

    // Upload séquentiel dans l'ordre défini
    for (let i = 0; i < productImages.length; i++) {
      const img = productImages[i];
      
      // Si l'image a déjà été uploadée (mode édition), on garde son URL
      if (!img.file) {
        finalUrls.push(img.url);
        continue;
      }

      // Sinon on l'upload
      const fileExt = img.file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}.${fileExt}`;
      const filePath = `produits/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, img.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      finalUrls.push(urlData.publicUrl);
    }

    const priceValue = document.getElementById('p-price').value;
    const yearValue = document.getElementById('p-year').value;

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
      description_en: document.getElementById('p-desc-en').value,
      image_url: finalUrls[0], // La 1ère du tableau
      gallery_urls: finalUrls  // Tout le tableau
    };

    if (editingProductId) {
      const { error: dbError } = await supabase.from('products').update(productData).eq('id', editingProductId);
      if (dbError) throw dbError;
      statusMsg.textContent = "Produit mis à jour !";
    } else {
      const { error: dbError } = await supabase.from('products').insert([productData]);
      if (dbError) throw dbError;
      statusMsg.textContent = "Produit ajouté !";
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

// --- CHARGER LA LISTE ---
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) { productsList.innerHTML = "Erreur."; return; }

  if (data.length === 0) {
    productsList.innerHTML = "<p style='color:#888'>Aucun produit.</p>";
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
  if (error) return alert("Erreur de chargement.");

  const p = data;
  editingProductId = p.id;

  // Remplir les champs textes
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

  // Charger les images existantes
  const existingImages = p.gallery_urls && p.gallery_urls.length > 0 ? p.gallery_urls : [p.image_url];
  productImages = existingImages.map(url => ({ file: null, url: url }));
  renderImagePreviews();

  // Changer l'UI
  formTitle.textContent = "Modifier le produit";
  btnSubmitForm.textContent = "Mettre à jour le produit";
  btnCancelEdit.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- RÉINITIALISER ---
window.resetForm = function() {
  editingProductId = null;
  form.reset();
  productImages = [];
  renderImagePreviews();
  formTitle.textContent = "Ajouter un nouveau produit";
  btnSubmitForm.textContent = "Ajouter le produit";
  btnCancelEdit.style.display = 'none';
  statusMsg.textContent = "";
}

// --- SUPPRIMER ---
window.deleteProduct = async function(id) {
  if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) alert("Erreur.");
  else loadProducts();
}
