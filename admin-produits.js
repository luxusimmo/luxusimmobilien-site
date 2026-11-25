import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');

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
    loadTestimonials();
  } else {
    loginView.style.display = 'block';
    adminView.style.display = 'none';
  }
}
checkSession();

// --- GESTION DES ONGLETS ---
window.switchAdminTab = function(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#admin-view > div[id^="tab-"]').forEach(c => c.style.display = 'none');
  
  event.target.classList.add('active');
  document.getElementById(`tab-${tab}`).style.display = 'block';
}

window.switchLangTab = function(lang) {
  document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.lang-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(`lang-${lang}`).classList.add('active');
}

// ==========================================
// GESTION DES PRODUITS
// ==========================================
let editingProductId = null;
let productImages = [];
const previewContainer = document.getElementById('image-preview-container');

document.getElementById('p-images').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => productImages.push({ file: file, url: URL.createObjectURL(file) }));
  renderImagePreviews();
  e.target.value = '';
});

function renderImagePreviews() {
  if (productImages.length === 0) { previewContainer.innerHTML = ''; return; }
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
  if (direction === -1 && index > 0) [productImages[index - 1], productImages[index]] = [productImages[index], productImages[index - 1]];
  else if (direction === 1 && index < productImages.length - 1) [productImages[index + 1], productImages[index]] = [productImages[index], productImages[index + 1]];
  renderImagePreviews();
}
window.removeImage = function(index) { productImages.splice(index, 1); renderImagePreviews(); }

document.getElementById('add-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-product');
  const status = document.getElementById('status-product');
  btn.disabled = true;
  status.textContent = "Traitement en cours...";
  status.style.color = "#aaa";

  try {
    if (productImages.length === 0) throw new Error("Veuillez ajouter au moins une photo.");
    const finalUrls = [];

    for (let i = 0; i < productImages.length; i++) {
      const img = productImages[i];
      if (!img.file) { finalUrls.push(img.url); continue; }
      const fileExt = img.file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(`produits/${fileName}`, img.file);
      if (uploadError) throw uploadError;
      const { data: urlData } = await supabase.storage.from('product-images').getPublicUrl(`produits/${fileName}`);
      finalUrls.push(urlData.publicUrl);
    }

    const productData = {
      category: document.getElementById('p-category').value,
      price: document.getElementById('p-price').value ? parseFloat(document.getElementById('p-price').value) : null,
      surface: document.getElementById('p-surface').value,
      condition: document.getElementById('p-condition').value,
      availability: document.getElementById('p-availability').value,
      year: document.getElementById('p-year').value ? parseInt(document.getElementById('p-year').value) : null,
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
      image_url: finalUrls[0],
      gallery_urls: finalUrls
    };

    if (editingProductId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProductId);
      if (error) throw error;
      status.textContent = "Produit mis à jour !";
    } else {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) throw error;
      status.textContent = "Produit ajouté !";
    }
    status.style.color = "#4ade80";
    resetProductForm();
    loadProducts();

  } catch (error) { status.textContent = "Erreur: " + error.message; status.style.color = "#ff4444"; } 
  finally { btn.disabled = false; }
});

async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  const list = document.getElementById('products-list');
  if (error) { list.innerHTML = "Erreur."; return; }
  if (data.length === 0) { list.innerHTML = "<p style='color:#888'>Aucun produit.</p>"; return; }
  list.innerHTML = data.map(p => `
    <div class="list-item">
      <img src="${p.image_url}" alt="photo">
      <div class="item-info">
        <h4>${p.title_de || p.title}</h4>
        <p>${p.price ? p.price + ' €' : 'Prix non défini'} · ${p.category} · ${p.availability || 'Disponible'}</p>
      </div>
      <div>
        <button class="btn-delete" style="border-color:#fff; color:#fff;" onclick="editProduct('${p.id}')">Modifier</button>
        <button class="btn-delete" onclick="deleteProduct('${p.id}')">Supprimer</button>
      </div>
    </div>
  `).join('');
}

window.editProduct = async function(id) {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  if (!data) return;
  editingProductId = data.id;
  document.getElementById('p-title-de').value = data.title_de || data.title || '';
  document.getElementById('p-title-fr').value = data.title_fr || '';
  document.getElementById('p-title-it').value = data.title_it || '';
  document.getElementById('p-title-en').value = data.title_en || '';
  document.getElementById('p-desc-de').value = data.description_de || data.description || '';
  document.getElementById('p-desc-fr').value = data.description_fr || '';
  document.getElementById('p-desc-it').value = data.description_it || '';
  document.getElementById('p-desc-en').value = data.description_en || '';
  document.getElementById('p-category').value = data.category || 'mobile_home';
  document.getElementById('p-price').value = data.price || '';
  document.getElementById('p-surface').value = data.surface || '';
  document.getElementById('p-condition').value = data.condition || 'Neuf';
  document.getElementById('p-availability').value = data.availability || 'Disponible';
  document.getElementById('p-year').value = data.year || '';
  document.getElementById('p-length').value = data.length || '';
  document.getElementById('p-width').value = data.width || '';
  
  const existingImages = data.gallery_urls && data.gallery_urls.length > 0 ? data.gallery_urls : [data.image_url];
  productImages = existingImages.map(url => ({ file: null, url: url }));
  renderImagePreviews();
  
  document.getElementById('form-title').textContent = "Modifier le produit";
  document.getElementById('btn-submit-product').textContent = "Mettre à jour";
  document.getElementById('btn-cancel-edit').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.resetProductForm = function() {
  editingProductId = null;
  document.getElementById('add-product-form').reset();
  productImages = [];
  renderImagePreviews();
  document.getElementById('form-title').textContent = "Ajouter un produit";
  document.getElementById('btn-submit-product').textContent = "Ajouter le produit";
  document.getElementById('btn-cancel-edit').style.display = 'none';
  document.getElementById('status-product').textContent = "";
}

window.deleteProduct = async function(id) {
  if (!confirm("Supprimer ce produit ?")) return;
  await supabase.from('products').delete().eq('id', id);
  loadProducts();
}

// ==========================================
// GESTION DES TÉMOIGNAGES
// ==========================================
document.getElementById('add-testimonial-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-testimonial');
  const status = document.getElementById('status-testimonial');
  btn.disabled = true;
  status.textContent = "Traitement en cours...";
  status.style.color = "#aaa";

  try {
    const file = document.getElementById('t-image').files[0];
    if (!file) throw new Error("Veuillez ajouter une photo.");

    const fileExt = file.name.split('.').pop();
    const fileName = `testi_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(`temoignages/${fileName}`, file);
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(`temoignages/${fileName}`);

    const { error: dbError } = await supabase.from('testimonials').insert([{
      name: document.getElementById('t-name').value,
      quote: document.getElementById('t-quote').value,
      image_url: urlData.publicUrl
    }]);

    if (dbError) throw dbError;

    status.textContent = "Témoignage ajouté !";
    status.style.color = "#4ade80";
    document.getElementById('add-testimonial-form').reset();
    loadTestimonials();

  } catch (error) {
    status.textContent = "Erreur: " + error.message;
    status.style.color = "#ff4444";
  } finally {
    btn.disabled = false;
  }
});

async function loadTestimonials() {
  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  const list = document.getElementById('testimonials-list');
  if (error) { list.innerHTML = "Erreur."; return; }
  if (data.length === 0) { list.innerHTML = "<p style='color:#888'>Aucun témoignage.</p>"; return; }
  
  list.innerHTML = data.map(t => `
    <div class="list-item">
      <img src="${t.image_url}" alt="photo" style="border-radius: 50%;">
      <div class="item-info">
        <h4>${t.name}</h4>
        <p style="font-style:italic;">"${t.quote.substring(0, 50)}..."</p>
      </div>
      <button class="btn-delete" onclick="deleteTestimonial('${t.id}')">Supprimer</button>
    </div>
  `).join('');
}

window.deleteTestimonial = async function(id) {
  if (!confirm("Supprimer ce témoignage ?")) return;
  await supabase.from('testimonials').delete().eq('id', id);
  loadTestimonials();
}
