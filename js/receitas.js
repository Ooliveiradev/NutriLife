// Banco de Receitas - NutriLife
// Funcionalidade completa, UX moderna, visual alinhado ao site

const LS_KEY = 'nutrilife_receitas';

function getReceitas() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}
function saveReceitas(receitas) {
  localStorage.setItem(LS_KEY, JSON.stringify(receitas));
}

function renderReceitas(filtro = '') {
  const receitas = getReceitas();
  const grid = document.getElementById('receitas-list');
  grid.innerHTML = '';
  let filtradas = receitas;
  if (filtro) {
    const f = filtro.toLowerCase();
    filtradas = receitas.filter(r =>
      r.titulo.toLowerCase().includes(f) ||
      r.tags.some(tag => tag.toLowerCase().includes(f)) ||
      r.ingredientes.some(i => i.toLowerCase().includes(f))
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
    r.tags.forEach(tag => {
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
    ing.textContent = r.ingredientes.slice(0,3).join(', ') + (r.ingredientes.length > 3 ? '...' : '');
    card.appendChild(ing);
    const verMais = document.createElement('span');
    verMais.className = 'ver-mais';
    verMais.textContent = 'Ver detalhes';
    card.appendChild(verMais);
    grid.appendChild(card);
  });
}

// Modal de Nova Receita
function openAddReceitaModal() {
  document.getElementById('modal-add-receita').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeAddReceitaModal() {
  document.getElementById('modal-add-receita').setAttribute('aria-hidden', 'true');
  document.getElementById('form-add-receita').reset();
  document.body.style.overflow = '';
}

document.getElementById('add-receita-btn').onclick = openAddReceitaModal;
document.getElementById('modal-add-receita').onclick = function(e) {
  if (e.target === this) closeAddReceitaModal();
};
document.getElementById('form-add-receita').onsubmit = function(e) {
  e.preventDefault();
  const titulo = document.getElementById('receita-titulo').value.trim();
  const tags = document.getElementById('receita-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const ingredientes = document.getElementById('receita-ingredientes').value.split('\n').map(i => i.trim()).filter(Boolean);
  const modo = document.getElementById('receita-modo').value.trim();
  const fileInput = document.getElementById('receita-imagem');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      salvarReceita({ titulo, tags, ingredientes, modo, imagem: ev.target.result });
    };
    reader.readAsDataURL(file);
  } else {
    salvarReceita({ titulo, tags, ingredientes, modo, imagem: null });
  }
  return false;
};
function salvarReceita(receita) {
  const receitas = getReceitas();
  receitas.unshift(receita);
  saveReceitas(receitas);
  closeAddReceitaModal();
  renderReceitas(document.getElementById('search-receita').value);
}

document.getElementById('search-receita').oninput = function() {
  renderReceitas(this.value);
};

// Modal de Visualização
function openViewReceitaModal(idx, lista) {
  const receitas = lista || getReceitas();
  const r = receitas[idx];
  document.getElementById('view-receita-titulo').textContent = r.titulo;
  const img = document.getElementById('view-receita-imagem');
  if (r.imagem) {
    img.src = r.imagem;
    img.style.display = '';
  } else {
    img.style.display = 'none';
  }
  const tagsDiv = document.getElementById('view-receita-tags');
  tagsDiv.innerHTML = '';
  r.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tag;
    tagsDiv.appendChild(span);
  });
  const ul = document.getElementById('view-receita-ingredientes');
  ul.innerHTML = '';
  r.ingredientes.forEach(i => {
    const li = document.createElement('li');
    li.textContent = i;
    ul.appendChild(li);
  });
  document.getElementById('view-receita-modo').textContent = r.modo;
  document.getElementById('modal-view-receita').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeViewReceitaModal() {
  document.getElementById('modal-view-receita').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
document.getElementById('modal-view-receita').onclick = function(e) {
  if (e.target === this) closeViewReceitaModal();
};

// Fechar modal com ESC
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeAddReceitaModal();
    closeViewReceitaModal();
  }
});

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
  renderReceitas();
});
