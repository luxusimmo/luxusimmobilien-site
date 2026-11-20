import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const productsList = document.getElementById('products-list');
const form = document.getElementById('add-product-form');
const statusMsg = document.getElementById('status-msg');

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
  statusMsg.textContent = "Envoi de la photo et des données...";
  statusMsg.style.color = "#aaa";

  try {
    const file = document.getElementById('p-image').files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `produits/${fileName}`;

    // 1. Upload de l'image dans le bucket product-images
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Récupérer l'URL publique de l'image
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);

    // 3. Insérer dans la base de données
    const { error: dbError } = await supabase.from('products').insert([{
      category: document.getElementById('p-category').value,
      title: document.getElementById('p-title').value,
      description: document.getElementById('p-description').value,
      price: parseFloat(document.getElementById('p-price').value),
      surface: document.getElementById('p-surface').value,
      condition: document.getElementById('p-condition').value,
      year: parseInt(document.getElementById('p-year').value),
      length: document.getElementById('p-length').value,
      width: document.getElementById('p-width').value,
      image_url: urlData.publicUrl
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
      <img src="${p.image_url}" alt="${p.title}">
      <div class="product-info">
        <h4>${p.title}</h4>
        <p>${p.price} € · ${p.category} · ${p.condition}</p>
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
