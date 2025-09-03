// app.js - Lista de Compras (NutriLife)
// Autenticação, catálogo, seleção de receitas, agregação, extras, histórico, exportar/compartilhar, dark mode

import { auth, db, fs, authOnChange, authWithGoogle, authWithEmail, authSignup, logout } from './firebase.js';
import { getRecipesCached, filterRecipes, suggestByGoal } from './recipes.js';
import { aggregate } from './aggregation.js';
import { toCSV, printView, toShareText } from './exporters.js';
import { el, accordion, toast } from './ui.js';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const state = {
  user: null,
  recipesAll: [],
  recipesFilt: [],
  selected: [], // {id,name,portions,kcal,ingredients[]}
  extras: [], // {id,name,qty,unit,category}
  plan: { days: 7, people: 2, goal: 'manter' },
  listId: null,
  listName: 'Minha Lista',
  items: [], // agregados
  orderMode: 'default',
};

// ======= Persistência local =======
const DRAFT_KEY = 'nl_shopping_draft_v1';
function saveDraft() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, user: null })); } catch {} }
function loadDraft() { try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY)||'null'); if (d) Object.assign(state, d); } catch {} }

// ======= Header/Auth =======
function renderHeaderUser() {
  const who = $('#whoami'); const btnLogin = $('#open-login'); const btnLogout = $('#logout-btn');
  if (state.user) {
    btnLogin?.classList.add('hidden'); btnLogout?.classList.remove('hidden');
    if (who) who.innerHTML = `<span class="badge-green">${state.user.displayName || 'Logado'}</span>`;
  } else {
    btnLogin?.classList.remove('hidden'); btnLogout?.classList.add('hidden');
    if (who) who.innerHTML = `<span class="badge-green">Visitante</span>`;
  }
}

function wireAuthModal() {
  const modal = $('#auth-modal');
  $$('[data-close-modal]').forEach(b => b.addEventListener('click', () => modal?.setAttribute('aria-hidden','true')));
  $('#open-login')?.addEventListener('click', () => modal?.setAttribute('aria-hidden','false'));
  $('#logout-btn')?.addEventListener('click', async () => { await logout(); toast('Sessão encerrada'); });

  $('#auth-google')?.addEventListener('click', async () => {
    try { await authWithGoogle(); modal?.setAttribute('aria-hidden','true'); } catch (e) { alert('Falha no Google: ' + (e?.message || e)); }
  });
  $('#auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#auth-email')?.value?.trim();
    const pass = $('#auth-pass')?.value?.trim();
    try { await authWithEmail(email, pass); modal?.setAttribute('aria-hidden','true'); } catch (e) { alert('Falha no login: ' + (e?.message || e)); }
  });
  $('#auth-signup')?.addEventListener('click', async () => {
    const email = $('#auth-email')?.value?.trim();
    const pass = $('#auth-pass')?.value?.trim();
    try { await authSignup(email, pass); modal?.setAttribute('aria-hidden','true'); toast('Conta criada!'); } catch (e) { alert('Falha ao criar: ' + (e?.message || e)); }
  });
}

// ======= Catálogo =======
function renderCatalog() {
  const grid = $('#recipe-grid'); if (!grid) return; grid.innerHTML='';
  state.recipesFilt.forEach(r => {
    const card = el('div', { class: 'card' },
      el('div', { class: 'thumb' }, 'Imagem'),
      el('div', { class: 'title' }, r.name),
      el('div', { class: 'meta' }, `${r.time || 20} min · ${r.portion || 2} porções · ${Math.round(r.kcal || 450)} kcal`),
      el('div', { class: 'tags' }, ...(r.tags||[]).map(t => el('span', { class: 'tag' }, t))),
      el('div', { class: 'actions' },
        el('button', { class: 'btn btn-primary', onClick: () => openAddRecipeModal(r) },
          el('svg', { class: 'i' }, el('use', { href: '#ico-plus' })), ' Adicionar')
      )
    );
    grid.appendChild(card);
  });
}

function applyRecipeFilters() {
  const search = $('#search-recipe')?.value || '';
  const filters = {
    'vegetariano': !!$('#f-veg') && $('#f-veg').checked,
    'low carb': !!$('#f-lowcarb') && $('#f-lowcarb').checked,
    'rápido': !!$('#f-quick') && $('#f-quick').checked,
    'barato': !!$('#f-cheap') && $('#f-cheap').checked,
    'sem lactose': !!$('#f-nolactose') && $('#f-nolactose').checked,
  };
  state.recipesFilt = filterRecipes(state.recipesAll, { search, filters });
  renderCatalog();
}

function openAddRecipeModal(recipe) {
  const modal = $('#modal-add-recipe'); const root = $('#modal-add-content');
  if (!modal || !root) return;
  root.innerHTML = '';
  const ctrl = el('div', { class: 'row' },
    el('div', {}, el('strong', {}, recipe.name)),
    el('div', {}, 'Porções: ', el('input', { id: 'add-portion', type: 'number', min: '1', step: '1', value: String(recipe.portion || 2), style: 'width:90px' }))
  );
  const btns = el('div', { class: 'row', style: 'margin-top:10px; display:flex; gap:8px; justify-content:flex-end;' },
    el('button', { class: 'btn btn-secondary', onClick: () => modal.setAttribute('aria-hidden','true') }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', onClick: () => {
      const pors = parseInt($('#add-portion')?.value || '1', 10);
      addSelectedRecipe(recipe, pors);
      modal.setAttribute('aria-hidden','true');
    } }, 'Adicionar')
  );
  root.append(ctrl, btns);
  modal.setAttribute('aria-hidden','false');
}

function addSelectedRecipe(recipe, portionsWanted) {
  const exist = state.selected.find(x => x.id === recipe.id);
  if (exist) exist.portions = portionsWanted; else state.selected.push({ id: recipe.id, name: recipe.name, portions: portionsWanted, kcal: recipe.kcal || 0, ingredients: recipe.ingredients || [] });
  compute(); renderCart();
}

function removeSelectedRecipe(id) { state.selected = state.selected.filter(x => x.id !== id); compute(); renderCart(); }

function renderCart() {
  const list = $('#cart-list'); if (!list) return; list.innerHTML='';
  state.selected.forEach(r => {
    const item = el('div', { class: 'cart-item' },
      el('div', { class: 'title' }, r.name),
      el('div', { class: 'q' },
        el('button', { class: 'btn', onClick: () => { r.portions = Math.max(1, r.portions - 1); compute(); renderCart(); } }, el('svg', { class: 'i' }, el('use', { href: '#ico-minus' }))),
        el('span', {}, String(r.portions)),
        el('button', { class: 'btn', onClick: () => { r.portions += 1; compute(); renderCart(); } }, el('svg', { class: 'i' }, el('use', { href: '#ico-plus' }))),
        el('button', { class: 'btn btn-danger', onClick: () => removeSelectedRecipe(r.id) }, 'Remover')
      )
    );
    list.appendChild(item);
  });
  const kcal = Math.round((state.selected.reduce((a, b) => a + (b.kcal || 0) * b.portions, 0) / Math.max(1, state.plan.days) / Math.max(1, state.plan.people)) || 0);
  $('#kcal-day').textContent = String(kcal);
}

// ======= Extras =======
function wireExtras() {
  $('#extra-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#extra-name')?.value?.trim();
    const qty = parseFloat($('#extra-qty')?.value || '1');
    const unit = $('#extra-unit')?.value;
    const category = $('#extra-cat')?.value || 'outros';
    if (!name) return;
    state.extras.push({ id: crypto.randomUUID(), name, qty: isNaN(qty) ? 1 : qty, unit, category });
    $('#extra-name').value=''; $('#extra-qty').value='';
    compute(); renderExtras();
  });
}

function renderExtras() {
  const root = $('#extra-list'); if (!root) return; root.innerHTML = '';
  state.extras.forEach(it => {
    const row = el('div', { class: 'cart-item' },
      el('div', {}, `${it.name} — ${it.qty} ${it.unit}`),
      el('div', { class: 'q' }, el('button', { class: 'btn btn-danger', onClick: () => { state.extras = state.extras.filter(x => x.id !== it.id); compute(); renderExtras(); } }, 'Excluir'))
    );
    root.appendChild(row);
  });
}

// ======= Agregação =======
function compute() {
  const mult = Math.max(1, state.plan.people) * Math.max(1, state.plan.days);
  const ingredients = [];
  state.selected.forEach(r => {
    const factor = (r.portions || 1) * mult;
    (r.ingredients || []).forEach(i => ingredients.push({ name: i.name, qty: (Number(i.qty)||0) * factor, unit: i.unit }));
  });
  state.extras.forEach(e => ingredients.push({ name: e.name, qty: e.qty, unit: e.unit, category: e.category }));
  const prevMap = new Map(state.items.map(x => [x.name + '|' + x.unit, x]));
  const aggregated = aggregate(ingredients).map(x => {
    const old = prevMap.get(x.name + '|' + x.unit);
    return { ...x, checked: old?.checked || false, note: old?.note || '', pantry: old?.pantry || false };
  });
  state.items = aggregated;
  renderShopping(); saveDraft();
}

function renderShopping() {
  const acc = $('#shopping-accordion'); if (!acc) return;
  const groups = new Map();
  state.items.forEach(i => { const arr = groups.get(i.category) || []; arr.push(i); groups.set(i.category, arr); });
  let entries = [...groups.entries()];
  if (state.orderMode === 'alpha') entries.sort((a,b)=> a[0].localeCompare(b[0]));
  const items = entries.map(([cat, arr]) => ({ id: 'cat-'+cat, title: cat.toUpperCase(), body: el('div', {}, ...arr.map(it => renderItemRow(it))) }));
  accordion(acc, items);
  const total = state.items.length; const done = state.items.filter(i => i.checked).length; const pct = total ? Math.round(done*100/total) : 0;
  $('#shopping-resume').textContent = `${done}/${total} itens · ${pct}% concluído`;
}

function renderItemRow(it) {
  const row = el('div', { class: 'item-row' });
  const ck = el('input', { type: 'checkbox' }); ck.checked = !!it.checked; ck.addEventListener('change', () => { it.checked = ck.checked; saveDraft(); });
  const nm = el('div', { class: 'item-name' }, it.name, ' ', it.pantry ? el('span', { class: 'badge-pantry' }, 'dispensa') : '');
  const qt = el('div', { class: 'item-qty' }, `${it.qty} ${it.unit}`);
  const noteBtn = el('button', { class: 'note-btn' }, el('svg', { class: 'i' }, el('use', { href: '#ico-note' })), ' nota');
  const pantryBtn = el('button', { class: 'note-btn' }, it.pantry ? 'dispensa ✓' : 'dispensa');
  const delBtn = el('button', { class: 'btn btn-danger' }, 'Excluir');
  noteBtn.addEventListener('click', () => {
    const exist = row.nextElementSibling; if (exist && exist.classList.contains('note-row')) { exist.remove(); return; }
    const noteRow = el('div', { class: 'note-row' }, el('input', { class: 'note-input', value: it.note || '', placeholder: 'Observações...' }));
    noteRow.firstChild.addEventListener('input', () => { it.note = noteRow.firstChild.value; saveDraft(); });
    row.after(noteRow);
  });
  pantryBtn.addEventListener('click', () => { it.pantry = !it.pantry; renderShopping(); saveDraft(); });
  delBtn.addEventListener('click', () => { state.items = state.items.filter(x => !(x.name === it.name && x.unit === it.unit)); renderShopping(); saveDraft(); });
  row.append(ck, nm, qt, noteBtn, pantryBtn, delBtn);
  return row;
}

// ======= Firestore: salvar/histórico =======
async function ensureUserProfile(u) { if (!u) return; const ref = fs.doc(db, 'users', u.uid); const snap = await fs.getDoc(ref); if (!snap.exists()) await fs.setDoc(ref, { displayName: u.displayName || '', email: u.email || '', createdAt: fs.serverTimestamp() }); }

async function saveList(overrides = {}) {
  if (!state.user) { $('#auth-modal')?.setAttribute('aria-hidden','false'); return; }
  const uid = state.user.uid; const listsCol = fs.collection(db, 'users', uid, 'lists'); const now = fs.serverTimestamp();
  const payload = { name: overrides.name || state.listName, owner: uid, plan: state.plan, selected: state.selected, extras: state.extras, items: state.items, updatedAt: now };
  if (state.listId && !overrides.forceNew) { await fs.setDoc(fs.doc(listsCol, state.listId), payload, { merge: true }); toast('Lista atualizada'); }
  else { const docRef = await fs.addDoc(listsCol, { ...payload, createdAt: now }); state.listId = docRef.id; state.listName = payload.name; toast('Lista salva'); }
  renderHistory();
}

async function loadList(id) { if (!state.user) return; const ref = fs.doc(db, 'users', state.user.uid, 'lists', id); const snap = await fs.getDoc(ref); if (!snap.exists()) return; const d = snap.data(); state.listId = id; state.listName = d.name || 'Minha Lista'; state.plan = d.plan || state.plan; state.selected = d.selected || []; state.extras = d.extras || []; state.items = d.items || []; renderCart(); renderExtras(); renderShopping(); saveDraft(); }

async function renderHistory() {
  const root = $('#history-list'); if (!root) return; root.innerHTML = '';
  if (!state.user) { root.textContent = 'Faça login para salvar e ver seu histórico.'; return; }
  const q = fs.query(fs.collection(db, 'users', state.user.uid, 'lists'), fs.orderBy('updatedAt', 'desc'), fs.limit(10));
  const snap = await fs.getDocs(q);
  snap.forEach(doc => {
    const d = doc.data();
    const card = el('div', { class: 'card' },
      el('div', { class: 'title' }, d.name || '(sem nome)'),
      el('div', { class: 'meta' }, `${(d.items||[]).length} itens`),
      el('div', { class: 'actions' },
        el('button', { class: 'btn', onClick: () => loadList(doc.id) }, 'Abrir'),
        el('button', { class: 'btn', onClick: async () => { await saveList({ name: (d.name || 'Minha Lista') + ' (cópia)', forceNew: true }); } }, 'Duplicar'),
        el('button', { class: 'btn btn-danger', onClick: async () => { await fs.deleteDoc(fs.doc(db, 'users', state.user.uid, 'lists', doc.id)); renderHistory(); } }, 'Excluir')
      )
    );
    root.appendChild(card);
  });
}

// ======= Ações =======
function wireActions() {
  $('#act-save')?.addEventListener('click', () => saveList());
  $('#act-save-as')?.addEventListener('click', async () => { const name = prompt('Nome da nova lista:', state.listName + ' (cópia)'); if (!name) return; await saveList({ name, forceNew: true }); });
  $('#act-duplicate')?.addEventListener('click', async () => saveList({ name: state.listName + ' (cópia)', forceNew: true }));
  $('#act-rename')?.addEventListener('click', async () => { const name = prompt('Novo nome:', state.listName); if (!name) return; state.listName = name; await saveList({}); });
  $('#act-delete')?.addEventListener('click', async () => { if (!state.user || !state.listId) return; if (!confirm('Excluir esta lista?')) return; await fs.deleteDoc(fs.doc(db, 'users', state.user.uid, 'lists', state.listId)); state.listId = null; toast('Excluída'); renderHistory(); });
  $('#act-export-csv')?.addEventListener('click', () => toCSV(state.items));
  $('#act-print')?.addEventListener('click', () => printView());
  $('#act-share')?.addEventListener('click', () => openShareModal());
  $('#act-clear-checks')?.addEventListener('click', () => { state.items.forEach(i => i.checked = false); renderShopping(); saveDraft(); });
}

// ======= Modais variados =======
function openRecipeEditor() {
  const modal = document.querySelector('#modal-recipe-editor');
  if (!modal) return;
  const form = document.querySelector('#recipe-editor-form');
  document.querySelector('#modal-recipe-editor-title').textContent = 'Nova Receita';
  (document.querySelector('#nr-name')||{}).value = '';
  (document.querySelector('#nr-time')||{}).value = '20';
  (document.querySelector('#nr-portion')||{}).value = '2';
  (document.querySelector('#nr-kcal')||{}).value = '500';
  (document.querySelector('#nr-tags')||{}).value = '';
  (document.querySelector('#nr-ingredients')||{}).value = '';
  modal.setAttribute('aria-hidden','false');
  const onSubmit = async (e) => {
    e.preventDefault();
    const name = (document.querySelector('#nr-name')||{}).value?.trim(); if (!name) return alert('Informe o nome');
    const time = parseInt((document.querySelector('#nr-time')||{}).value || '20', 10) || 20;
    const portion = parseInt((document.querySelector('#nr-portion')||{}).value || '2', 10) || 2;
    const kcal = parseInt((document.querySelector('#nr-kcal')||{}).value || '0', 10) || 0;
    const tags = ((document.querySelector('#nr-tags')||{}).value || '').split(',').map(s=>s.trim()).filter(Boolean);
    const ingredients = parseIngredients((document.querySelector('#nr-ingredients')||{}).value || '');
    const recipe = { id: 'loc-' + Date.now(), name, time, portion, kcal, tags, ingredients };
    try { const ref = fs.collection(db, 'recipes'); await fs.addDoc(ref, { ...recipe, id: undefined, createdAt: fs.serverTimestamp() }); toast('Receita salva'); } catch {}
    state.recipesAll.unshift(recipe); applyRecipeFilters(); modal.setAttribute('aria-hidden','true'); form?.removeEventListener('submit', onSubmit);
  };
  form?.addEventListener('submit', onSubmit);
  modal.querySelectorAll('[data-close-modal]')?.forEach(btn => btn.addEventListener('click', () => { modal.setAttribute('aria-hidden','true'); form?.removeEventListener('submit', onSubmit); }, { once: true }));
}

function parseIngredients(text) { const lines = String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean); const out=[]; for (const ln of lines){ const m=ln.match(/^([\d,.]+)\s*(\w+)\s+(.+)$/); if(m){ let qty=parseFloat(m[1].replace(',', '.')); const unit=m[2].toLowerCase(); const name=m[3].trim(); if(!isFinite(qty)) qty=1; out.push({ name, qty, unit }); } else { out.push({ name: ln, qty: 1, unit: 'un' }); } } return out; }

function openSuggestModal() {
  const modal = document.querySelector('#modal-suggest');
  const list = document.querySelector('#suggest-list');
  if (!modal || !list) return;
  list.innerHTML = '';
  suggestByGoal(state.recipesAll, state.plan.goal, 8).forEach(r => {
    const card = el('div', { class: 'card' },
      el('div', { class: 'thumb' }, 'Imagem'),
      el('div', { class: 'title' }, r.name),
      el('div', { class: 'meta' }, `${r.time || 20} min · ${Math.round(r.kcal || 450)} kcal`),
      el('div', { class: 'actions' }, el('button', { class: 'btn btn-primary', onClick: () => { addSelectedRecipe(r, r.portion || 2); modal.setAttribute('aria-hidden','true'); } }, 'Adicionar'))
    );
    list.appendChild(card);
  });
  modal.setAttribute('aria-hidden','false');
  modal.querySelectorAll('[data-close-modal]')?.forEach(b => b.addEventListener('click', () => modal.setAttribute('aria-hidden','true'), { once: true }));
}

function openShareModal() {
  const modal = document.querySelector('#modal-share'); if (!modal) return;
  const text = toShareText(state.items);
  const ta = document.querySelector('#share-text'); if (ta) { ta.value = text; ta.select(); }
  document.querySelector('#share-copy')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(text); toast('Copiado!'); } catch {} }, { once: true });
  document.querySelector('#share-wa')?.addEventListener('click', () => { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank'); }, { once: true });
  document.querySelector('#share-email')?.addEventListener('click', () => { window.location.href = `mailto:?subject=${encodeURIComponent('Lista de Compras - NutriLife')}&body=${encodeURIComponent(text)}`; }, { once: true });
  modal.setAttribute('aria-hidden','false');
  modal.querySelectorAll('[data-close-modal]')?.forEach(b => b.addEventListener('click', () => modal.setAttribute('aria-hidden','true'), { once: true }));
}

// ======= Init =======
async function init() {
  loadDraft(); wireAuthModal(); wireExtras(); wireActions();
  // filtros
  $('#search-recipe')?.addEventListener('input', applyRecipeFilters);
  $$('.catalog .filters input[type="checkbox"]').forEach(c => c.addEventListener('change', applyRecipeFilters));
  $('#btn-suggest')?.addEventListener('click', () => openSuggestModal());
  $('#btn-add-recipe')?.addEventListener('click', () => openRecipeEditor());
  $('#order-select')?.addEventListener('change', (e) => { state.orderMode = e.target.value; renderShopping(); });
  // dark mode
  const themeBtn = $('#theme-toggle'); const savedTheme = localStorage.getItem('nl_theme') || 'light'; document.body.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
  themeBtn?.addEventListener('click', () => { const cur = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.body.setAttribute('data-theme', cur); localStorage.setItem('nl_theme', cur); });

  // auth
  authOnChange(async (u) => { state.user = u; renderHeaderUser(); await ensureUserProfile(u); renderHistory(); });
  // receitas
  state.recipesAll = await getRecipesCached(); state.recipesFilt = state.recipesAll.slice(); renderCatalog(); renderCart(); renderExtras(); compute();
  setInterval(saveDraft, 2000);
  const d = new Date(); const elDate = document.getElementById('print-date'); if (elDate) elDate.textContent = d.toLocaleString();
}

init();

