// Banco de Receitas - Firebase Firestore
// Requer: firebase-app, firebase-firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = window.FIREBASE_CONFIG;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const receitasRef = collection(db, "receitas");

async function salvarReceitaFirebase(receita) {
  await addDoc(receitasRef, receita);
}

async function buscarReceitasFirebase() {
  const q = query(receitasRef, orderBy("titulo"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

// Integração com a UI existente
window.renderReceitas = async function(filtro = '') {
  const receitas = await buscarReceitasFirebase();
  const grid = document.getElementById('receitas-list');
  grid.innerHTML = '';
  let filtradas = receitas;
  if (filtro) {
    const f = filtro.toLowerCase();
    filtradas = receitas.filter(r =>
      r.titulo.toLowerCase().includes(f) ||
      (r.tags || []).some(tag => tag.toLowerCase().includes(f)) ||
      (r.ingredientes || []).some(i => i.toLowerCase().includes(f))
    );
  }
  if (filtradas.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#64748b;">Nenhuma receita encontrada.</p>';
    return;
  }
  filtradas.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'receita-card';
    card.onclick = () => openViewReceitaModal(idx, filtradas);
    if (r.imagem) {
      const img = document.createElement('img');
      img.src = r.imagem;
      img.alt = 'Imagem da receita';
      card.appendChild(img);
    }
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'tags';
    (r.tags || []).forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tagsDiv.appendChild(span);
    });
    card.appendChild(tagsDiv);
    const h3 = document.createElement('h3');
    h3.textContent = r.titulo;
    card.appendChild(h3);
    const ing = document.createElement('div');
    ing.className = 'ingredientes';
    ing.textContent = (r.ingredientes || []).slice(0,3).join(', ') + ((r.ingredientes || []).length > 3 ? '...' : '');
    card.appendChild(ing);
    const verMais = document.createElement('span');
    verMais.className = 'ver-mais';
    verMais.textContent = 'Ver detalhes';
    card.appendChild(verMais);
    grid.appendChild(card);
  });
}

window.salvarReceita = async function(receita) {
  await salvarReceitaFirebase(receita);
  await window.renderReceitas(document.getElementById('search-receita').value);
}

// Substitui o evento de submit do form
window.addEventListener('DOMContentLoaded', () => {
  window.renderReceitas();
  document.getElementById('form-add-receita').onsubmit = async function(e) {
    e.preventDefault();
    const titulo = document.getElementById('receita-titulo').value.trim();
    const tags = document.getElementById('receita-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const ingredientes = document.getElementById('receita-ingredientes').value.split('\n').map(i => i.trim()).filter(Boolean);
    const modo = document.getElementById('receita-modo').value.trim();
    const fileInput = document.getElementById('receita-imagem');
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function(ev) {
        await window.salvarReceita({ titulo, tags, ingredientes, modo, imagem: ev.target.result });
        closeAddReceitaModal();
      };
      reader.readAsDataURL(file);
    } else {
      await window.salvarReceita({ titulo, tags, ingredientes, modo, imagem: null });
      closeAddReceitaModal();
    }
    return false;
  };
  document.getElementById('search-receita').oninput = function() {
    window.renderReceitas(this.value);
  };
});
