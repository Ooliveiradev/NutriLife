
// Blog NutriLife - Firestore (leitura privada)
// Modais: login, post (criar/editar), visualizar
// Recursos extra: resumo com "Ler mais", permalink com slug (?p=slug), deep-link e botão de copiar link
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ---- CONFIG ----
const firebaseConfig = window.FIREBASE_CONFIG;
const ADMIN_UIDS = window.NUTRILIFE_ADMIN_UIDS || [];
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---- DOM utils ----
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const fmt = (ts) => ts?.toDate ? ts.toDate().toLocaleString() : "-";

// ---- Elements ----
const listEl = $('#post-list');
const searchEl = $('#filter-search');
const catFilterEl = $('#filter-category');
const sortEl = $('#filter-sort');

// header login button
const openLoginBtn = $('#open-login');
const logoutBtn = $('#logout-btn');
const whoami = $('#whoami');

// login modal
const loginOverlay = $('#login-overlay');
const loginModal = $('#login-modal');
const loginForm = $('#login-form');
const loginClose = $('#login-close');

// post modal
const postOverlay = $('#post-overlay');
const postModal = $('#post-modal');
const postOpenBtn = $('#open-post-modal');
const postCloseBtn = $('#post-close');
const submitBtn = $('#submit-btn');
const cancelEditBtn = $('#cancel-edit');

// post form fields
const idEl = $('#post-id');
const titleEl = $('#post-title');
const contentEl = $('#post-content');
const categoryEl = $('#post-category');
const pinnedEl = $('#post-pinned');

// view modal (Ler mais)
const viewOverlay = $('#view-overlay');
const viewModal = $('#view-modal');
const viewCloseBtn = $('#view-close');
const viewTitle = $('#view-title');
const viewMeta = $('#view-meta');
const viewContent = $('#view-content');

// ---- State ----
let currentUser = null;
let isAdmin = false;
let postsCache = [];
let openedSlug = null; // controle de deep-link atual

// ---- Helpers ----
function toggle(el, state) {
  if (!el) return;
  el.classList[state ? 'add' : 'remove']('active');
}

function openModal(overlay, modal) {
  toggle(overlay, true);
  toggle(modal, true);
}

function closeModal(overlay, modal) {
  toggle(modal, false);
  setTimeout(() => toggle(overlay, false), 50);
}

function resetForm() {
  idEl.value = '';
  titleEl.value = '';
  contentEl.value = '';
  categoryEl.value = '';
  pinnedEl.checked = false;
  submitBtn.textContent = 'Publicar';
  cancelEditBtn.classList.add('hidden');
}

function updateHeaderState() {
  if (currentUser) {
    whoami.innerHTML = `<span class="badge-green">Logado</span>`;
    openLoginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    postOpenBtn?.classList.remove('hidden');
  } else {
    whoami.innerHTML = `<span class="badge-green">Visitante</span>`;
    openLoginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    postOpenBtn?.classList.add('hidden');
  }
}

// ---- Auth ----
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAdmin = !!(user && ADMIN_UIDS.includes(user.uid));
  updateHeaderState();
});

// ---- Event Listeners ----
openLoginBtn?.addEventListener('click', () => openModal(loginOverlay, loginModal));
logoutBtn?.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
});

loginClose?.addEventListener('click', () => closeModal(loginOverlay, loginModal));
loginOverlay?.addEventListener('click', (e) => {
  if (e.target === loginOverlay) closeModal(loginOverlay, loginModal);
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#login-email').value.trim();
  const pass = $('#login-pass').value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal(loginOverlay, loginModal);
    $('#login-email').value = '';
    $('#login-pass').value = '';
  } catch (error) {
    alert('Falha no login: ' + error.message);
  }
});

// Post modal
postOpenBtn?.addEventListener('click', () => {
  resetForm();
  openModal(postOverlay, postModal);
});

postCloseBtn?.addEventListener('click', () => closeModal(postOverlay, postModal));
postOverlay?.addEventListener('click', (e) => {
  if (e.target === postOverlay) closeModal(postOverlay, postModal);
});

cancelEditBtn?.addEventListener('click', () => {
  resetForm();
  closeModal(postOverlay, postModal);
});

const postForm = $('#post-form'); // Assuming post-form is the form element
postForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return alert('Faça login.');
  if (!isAdmin) return alert('Sem permissão.');

  const data = {
    title: titleEl.value.trim(),
    content: contentEl.value.trim(),
    category: categoryEl.value.trim() || 'Sem categoria',
    pinned: pinnedEl.checked,
    updatedAt: serverTimestamp()
  };

  if (!data.title || !data.content) return alert('Preencha título e conteúdo.');

  try {
    if (idEl.value) {
      // Editar
      await updateDoc(doc(db, 'posts', idEl.value), data);
    } else {
      // Criar
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'posts'), data);
    }
    closeModal(postOverlay, postModal);
    resetForm();
  } catch (error) {
    alert('Erro: ' + error.message);
  }
});

// ---- CRUD ----
function handleEdit(id) {
  if (!currentUser) return alert('Faça login.');
  if (!isAdmin) return alert('Sem permissão.');

  const post = postsCache.find(p => p.id === id);
  if (!post) return;

  idEl.value = post.id;
  titleEl.value = post.title;
  contentEl.value = post.content;
  categoryEl.value = post.category;
  pinnedEl.checked = !!post.pinned;
  submitBtn.textContent = 'Salvar edição';
  cancelEditBtn.classList.remove('hidden');
  openModal(postOverlay, postModal);
}

async function handleDelete(id) {
  if (!currentUser) return alert('Faça login.');
  if (!isAdmin) return alert('Sem permissão.');
  if (!confirm('Excluir esta postagem?')) return;

  try {
    await deleteDoc(doc(db, 'posts', id));
  } catch (error) {
    alert('Erro ao excluir: ' + error.message);
  }
}

async function handlePin(id) {
  if (!currentUser) return alert('Faça login.');
  if (!isAdmin) return alert('Sem permissão.');

  const post = postsCache.find(p => p.id === id);
  if (!post) return;

  try {
    await updateDoc(doc(db, 'posts', id), {
      pinned: !post.pinned,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    alert('Erro ao fixar/desafixar: ' + error.message);
  }
}

// ---- Excerpt / Ler mais ----
function makeExcerpt(text, limit = 320) {
  if (!text) return '';
  if (text.includes('<!--more-->')) return text.split('<!--more-->')[0].trim();
  if (text.includes('\n---\n')) return text.split('\n---\n')[0].trim();

  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= limit) return clean;

  let cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 150) cut = cut.slice(0, lastSpace);
  return cut + '…';
}

function ensureShareUI() {
  // cria área de ações (copiar link / abrir) dentro do modal de leitura, se não existir
  let box = $('#view-share');
  if (box) return box;

  box = document.createElement('div');
  box.className = 'actions';
  box.id = 'view-share';
  box.innerHTML = `
    <button class="btn btn-secondary" id="copy-link">Copiar link</button>
    <a class="btn btn-primary" id="open-link" href="#" target="_blank" rel="noopener">Abrir link</a>
  `;
  viewModal?.querySelector('.body')?.appendChild(box);
  return box;
}

function openView(post, push = true) {
  if (!post) return;

  ensureShareUI();
  viewTitle.textContent = post.title;
  viewMeta.innerHTML = `
    <span class="badge">${esc(post.category || 'Sem categoria')}</span>
    <span>Publicado: ${fmt(post.createdAt)}</span>
    ${post.updatedAt ? `<span>Atualizado: ${fmt(post.updatedAt)}</span>` : ''}
    ${post.pinned ? `<span>📌 Fixado</span>` : ''}
  `;
  viewContent.textContent = post.content || '';

  // permalink
  const url = postURL(post);
  const openA = $('#open-link');
  if (openA) openA.href = url;

  const copyBtn = $('#copy-link');
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => copyBtn.textContent = 'Copiar link', 1200);
      } catch {
        alert('Não foi possível copiar.');
      }
    };
  }

  openedSlug = post.slug || slugify(post.title);
  if (push) {
    history.pushState({ view: 'post', slug: openedSlug }, '', url);
  }
  openModal(viewOverlay, viewModal);
}

function closeView(push = true) {
  closeModal(viewOverlay, viewModal);
  if (push) {
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    url.searchParams.delete('id');
    history.replaceState({}, '', url);
    openedSlug = null;
  }
}

viewCloseBtn?.addEventListener('click', () => closeView());
viewOverlay?.addEventListener('click', (e) => {
  if (e.target === viewOverlay) closeView();
});

// deep-link via back/forward
window.addEventListener('popstate', (e) => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('p');
  const id = params.get('id');

  if (!slug && !id) {
    // fechar se estava aberto
    if (openedSlug) closeView(false);
    return;
  }

  // abrir o post correspondente
  const post = slug ? postsCache.find(x => (x.slug || slugify(x.title)) === slug)
    : postsCache.find(x => x.id === id);
  if (post) openView(post, false);
});

// ---- List ----
function renderCats() {
  if (!catFilterEl) return;

  // Categorias padrão
  const defaultCategories = [
    'Dieta Low Carb',
    'Vegetariana',
    'Vegana',
    'Esportiva',
    'Hábitos Saudáveis',
    'Receitas',
    'Dicas de Nutrição'
  ];

  // Criar Set para categorias únicas
  const categorySet = new Set(defaultCategories);

  // Adicionar categorias dos posts existentes
  postsCache.forEach(post => {
    if (post.category && post.category.trim()) {
      categorySet.add(post.category.trim());
    }
  });

  // Converter para array e ordenar
  const categories = Array.from(categorySet).sort();

  // Renderizar opções
  const options = ['<option value="">Todas as categorias</option>'];
  categories.forEach(category => {
    options.push(`<option value="${esc(category)}">${esc(category)}</option>`);
  });

  catFilterEl.innerHTML = options.join('');
}

function render() {
  if (!listEl) return;

  // Renderizar categorias sempre que renderizar a lista
  renderCats();

  const searchQuery = (searchEl?.value || '').toLowerCase().trim();
  const selectedCategory = (catFilterEl?.value || '').trim();
  const sortOrder = (sortEl?.value || 'newest');

  // Filtrar posts
  let filteredPosts = postsCache.filter(post => {
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery) ||
      post.content.toLowerCase().includes(searchQuery);

    const matchesCategory = !selectedCategory || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Ordenar posts
  filteredPosts.sort((a, b) => {
    // Posts fixados sempre no topo
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    // Aplicar ordenação selecionada
    switch (sortOrder) {
      case 'oldest':
        return a.createdAtMs - b.createdAtMs;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'newest':
      default:
        return b.createdAtMs - a.createdAtMs;
    }
  });

  // Renderizar lista
  if (!filteredPosts.length) {
    listEl.innerHTML = '<p class="empty">Nenhuma postagem encontrada.</p>';
    return;
  }

  listEl.innerHTML = filteredPosts.map(post => {
    const excerpt = makeExcerpt(post.content || '');
    const slug = post.slug || slugify(post.title);
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('p', slug);

    return `
    <article class="card" data-id="${post.id}">
      <h3>${esc(post.title)}</h3>
      <div class="meta">
        <span class="badge">${esc(post.category || 'Sem categoria')}</span>
        <span>Publicado: ${fmt(post.createdAt)}</span>
        ${post.updatedAt ? `<span>Atualizado: ${fmt(post.updatedAt)}</span>` : ''}
        ${post.pinned ? '<span>📌 Fixado</span>' : ''}
        <img src='../images/index/icone-de-compartilhamento.png' href="${shareUrl.toString()}" class="btn btn-secondary" style="padding:4px 8px; font-size:.85rem; height: 10px;" data-action="share" data-slug="${slug}"> </img>
      </div>
      <div class="content excerpt">${esc(excerpt)}</div>
      <div class="card-actions">
        <button class="btn btn-secondary" data-action="view">Ler mais</button>
        ${isAdmin ? `
          <button class="btn btn-secondary" data-action="edit">Editar</button>
          <button class="btn btn-danger" data-action="delete">Excluir</button>
          <button class="btn btn-primary" data-action="pin">${post.pinned ? 'Desafixar' : 'Fixar'}</button>
        ` : ''}
      </div>
    </article>`;
  }).join('');

  // Adicionar event listeners
  attachCardEventListeners();
}

// Função separada para event listeners dos cards
function attachCardEventListeners() {
  listEl.addEventListener('click', (e) => {
    const shareLink = e.target.closest('a[data-action="share"]');
    if (shareLink) {
      e.preventDefault();
      const slug = shareLink.dataset.slug;
      const post = postsCache.find(x => (x.slug || slugify(x.title)) === slug);
      if (post) openView(post);
      return;
    }

    const actionButton = e.target.closest('button[data-action]');
    if (!actionButton) return;

    const card = actionButton.closest('.card');
    const postId = card?.dataset.id;
    const action = actionButton.dataset.action;
    const post = postsCache.find(x => x.id === postId);

    if (!post) return;

    switch (action) {
      case 'view':
        openView(post);
        break;
      case 'edit':
        handleEdit(postId);
        break;
      case 'delete':
        handleDelete(postId);
        break;
      case 'pin':
        handlePin(postId);
        break;
    }
  });
}

// ---- Utils ----
function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function postURL(post) {
  const url = new URL(window.location.href);
  url.searchParams.set('p', post.slug || slugify(post.title));
  return url.toString();
}

// ---- realtime + deep-link on load ----
function initBlog() {
  const qRef = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  onSnapshot(qRef, (snap) => {
    postsCache = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0
      };
    });

    render();

    // Deep-link: se tiver ?p=slug ou ?id=...
    const params = new URLSearchParams(location.search);
    const slug = params.get('p');
    const id = params.get('id');

    if (slug) {
      const post = postsCache.find(x => (x.slug || slugify(x.title)) === slug);
      if (post) openView(post, false);
    } else if (id) {
      const post = postsCache.find(x => x.id === id);
      if (post) openView(post, false);
    }
  }, (error) => {
    console.error('Erro ao carregar posts:', error);
  });
}

// ---- filters ----
function initFilters() {
  [searchEl, catFilterEl, sortEl].forEach(el => {
    if (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    }
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  initBlog();
  initFilters();
});

// ==== Fechar modais com ESC ====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.querySelector('#view-modal.active')) closeView();
    if (document.querySelector('#post-modal.active')) closeModal(postOverlay, postModal);
    if (document.querySelector('#login-modal.active')) closeModal(loginOverlay, loginModal);
  }
});
