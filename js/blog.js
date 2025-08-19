
/*
  NutriLife - Blog localStorage
  Features:
  - CRUD de postagens
  - Categorias (pré-definidas + custom)
  - Busca, filtro por categoria e ordenação
  - Fixar post (pinned)
  - Persiste em localStorage (chave: nutrilife_posts)
*/

const STORAGE_KEY = 'nutrilife_posts';

// util
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

function uid() {
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function seedIfEmpty() {
  const posts = loadPosts();
  if (posts.length) return;
  const demo = [
    {
      id: uid(),
      title: "Começando no low carb sem paranoia",
      content: "Foque em comida de verdade: vegetais, carnes magras, ovos, azeite. Evite ultraprocessados. Teste por 14 dias e ajuste.",
      category: "Dieta Low Carb",
      createdAt: Date.now() - 1000*60*60*24*6,
      updatedAt: null,
      pinned: true
    },
    {
      id: uid(),
      title: "3 proteínas vegetais para turbinar seu prato",
      content: "Lentilha, grão-de-bico e tofu: baratas, versáteis e completas quando combinadas com cereais.",
      category: "Vegetariana",
      createdAt: Date.now() - 1000*60*60*24*3,
      updatedAt: null,
      pinned: false
    },
    {
      id: uid(),
      title: "Pré-treino simples para corrida",
      content: "Banana + aveia 40–60 min antes e água. Pós: iogurte com fruta ou sanduíche de frango.",
      category: "Esportiva",
      createdAt: Date.now() - 1000*60*60*24*1,
      updatedAt: null,
      pinned: false
    }
  ];
  savePosts(demo);
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function getFormData() {
  return {
    id: $('#post-id').value || null,
    title: $('#post-title').value.trim(),
    content: $('#post-content').value.trim(),
    category: $('#post-category').value.trim() || 'Sem categoria',
    pinned: $('#post-pinned').checked
  };
}

function resetForm() {
  $('#post-id').value = '';
  $('#post-title').value = '';
  $('#post-content').value = '';
  $('#post-category').value = '';
  $('#post-pinned').checked = false;
  $('#submit-btn').textContent = 'Publicar';
  $('#cancel-edit').classList.add('hidden');
}

function handleSubmit(e) {
  e.preventDefault();
  const data = getFormData();
  if (!data.title || !data.content) {
    alert('Título e conteúdo são obrigatórios.');
    return;
  }
  const posts = loadPosts();
  if (data.id) {
    // update
    const i = posts.findIndex(p => p.id === data.id);
    if (i !== -1) {
      posts[i] = {
        ...posts[i],
        title: data.title,
        content: data.content,
        category: data.category,
        pinned: data.pinned,
        updatedAt: Date.now()
      };
    }
  } else {
    posts.push({
      id: uid(),
      title: data.title,
      content: data.content,
      category: data.category,
      createdAt: Date.now(),
      updatedAt: null,
      pinned: data.pinned
    });
  }
  savePosts(posts);
  resetForm();
  render();
  window.scrollTo({ top: $('#blog').offsetTop - 20, behavior: 'smooth' });
}

function handleEdit(id) {
  const posts = loadPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return;
  $('#post-id').value = p.id;
  $('#post-title').value = p.title;
  $('#post-content').value = p.content;
  $('#post-category').value = p.category;
  $('#post-pinned').checked = !!p.pinned;
  $('#submit-btn').textContent = 'Salvar edição';
  $('#cancel-edit').classList.remove('hidden');
  $('#post-title').focus();
  window.scrollTo({ top: $('#blog-form').offsetTop - 12, behavior: 'smooth' });
}

function handleDelete(id) {
  if (!confirm('Excluir esta postagem?')) return;
  const posts = loadPosts().filter(p => p.id !== id);
  savePosts(posts);
  render();
}

function handlePin(id) {
  const posts = loadPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return;
  p.pinned = !p.pinned;
  p.updatedAt = Date.now();
  savePosts(posts);
  render();
}

function renderCategoriesIntoSelect() {
  const posts = loadPosts();
  const set = new Set(['Dieta Low Carb','Vegetariana','Vegana','Esportiva','Sem categoria']);
  posts.forEach(p => set.add(p.category));
  const sel = $('#filter-category');
  sel.innerHTML = '<option value="">Todas as categorias</option>' +
    Array.from(set).map(c => `<option value="${c}">${c}</option>`).join('');
}

function render() {
  renderCategoriesIntoSelect();
  const list = $('#post-list');
  const posts = loadPosts();

  const q = $('#filter-search').value.trim().toLowerCase();
  const cat = $('#filter-category').value;
  const sort = $('#filter-sort').value; // newest, oldest, title

  let filtered = posts.filter(p => {
    const matchQ = !q || (p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
    const matchCat = !cat || p.category === cat;
    return matchQ && matchCat;
  });

  filtered.sort((a,b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; // pinned first
    if (sort === 'oldest') return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    if (sort === 'title') return a.title.localeCompare(b.title);
    return (b.createdAt ?? 0) - (a.createdAt ?? 0); // newest
  });

  if (!filtered.length) {
    list.innerHTML = `<p class="empty">Nenhuma postagem encontrada.</p>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <article class="card" data-id="${p.id}">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">
        <span class="badge">${escapeHtml(p.category || 'Sem categoria')}</span>
        <span>Publicado: ${fmtDate(p.createdAt)}</span>
        ${p.updatedAt ? `<span>Atualizado: ${fmtDate(p.updatedAt)}</span>` : ''}
        ${p.pinned ? `<span>📌 Fixado</span>` : ''}
      </div>
      <div class="content">${escapeHtml(p.content)}</div>
      <div class="card-actions">
        <button class="btn btn-secondary" data-action="edit">Editar</button>
        <button class="btn btn-danger" data-action="delete">Excluir</button>
        <button class="btn btn-primary" data-action="pin">${p.pinned ? 'Desafixar' : 'Fixar'}</button>
      </div>
    </article>
  `).join('');

  // delegate actions
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.closest('.card')?.dataset.id;
    if (!id) return;
    if (action === 'edit') handleEdit(id);
    if (action === 'delete') handleDelete(id);
    if (action === 'pin') handlePin(id);
  }, { once: true });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function wireUp() {
  seedIfEmpty();
  $('#blog-form').addEventListener('submit', handleSubmit);
  $('#cancel-edit').addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });
  // filtros
  $$('#filter-category, #filter-sort, #filter-search').forEach(el => {
    el.addEventListener('input', render);
  });
  render();
}

// bootstrap
document.addEventListener('DOMContentLoaded', wireUp);
