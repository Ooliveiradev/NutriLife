// Banco de Receitas - NutriLife (refatorado + recursos)
(() => {
  const LS_KEY = 'nutrilife_receitas';
  const $ = (s, el=document) => el.querySelector(s);
  const grid = $('#receitas-list');
  const searchEl = $('#search-receita');
  const tagFilterEl = $('#filter-tag');
  const sortEl = $('#filter-sort');
  const addBtn = $('#add-receita-btn');
  // Modal elements for new UI
  const chipsBox = document.getElementById('tags-chips');
  const tagInput = document.getElementById('tag-input');
  const hiddenTags = document.getElementById('receita-tags');
  const drop = document.getElementById('image-drop');
  const imgInput = document.getElementById('receita-imagem');
  const preview = document.getElementById('image-preview');

  let cache = [];
  const DEFAULT_TAGS = ['fit','vegano','vegetariano','low carb','doce','salgado','sem glúten','sem lactose','proteica','rápida'];
  let currentTags = [];
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const now = () => new Date().toISOString();
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(cache));
  const load = () => { try { cache = JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch { cache=[]; } let ch=false; cache.forEach(r=>{ if(!r.id){ r.id=uid(); ch=true; } if(!r.createdAt){ r.createdAt=now(); ch=true; }}); if(ch) save(); };

  function renderFilters(){
    if(!tagFilterEl) return;
    const prev = tagFilterEl.value;
    const set = new Set(DEFAULT_TAGS);
    cache.forEach(r => (r.tags||[]).forEach(t=>set.add(t)));
    const tags = Array.from(set).sort((a,b)=>a.localeCompare(b));
    tagFilterEl.innerHTML = ['<option value="">Todas as tags</option>'].concat(tags.map(t=>`<option value="${t}">${t}</option>`)).join('');
    if(tags.includes(prev)) tagFilterEl.value = prev;
  }

  // Tags (chips)
  function syncHiddenTags(){ hiddenTags && (hiddenTags.value = currentTags.join(', ')); }
  function renderChips(){
    if(!chipsBox) return;
    chipsBox.innerHTML = currentTags.map(t=>`<span class="chip" data-tag="${t}">${t}<button type="button" aria-label="Remover ${t}">×</button></span>`).join('');
  }
  function addTag(tag){
    tag = (tag||'').trim();
    if(!tag) return;
    if(!currentTags.includes(tag)) currentTags.push(tag);
    renderChips(); syncHiddenTags();
  }
  function removeTag(tag){
    currentTags = currentTags.filter(t=>t!==tag);
    renderChips(); syncHiddenTags();
  }
  tagInput?.addEventListener('keydown', (e)=>{
    if(e.key==='Enter' || e.key===',' ){ e.preventDefault(); addTag(tagInput.value); tagInput.value=''; }
  });
  tagInput?.addEventListener('blur', ()=>{ if(tagInput.value.trim()) { addTag(tagInput.value); tagInput.value=''; } });
  chipsBox?.addEventListener('click', (e)=>{ const chip=e.target.closest('.chip'); if(chip && e.target.tagName==='BUTTON'){ removeTag(chip.dataset.tag); }});

  // Dropzone (imagem)
  function setPreview(src){ if(preview){ if(src){ preview.src=src; preview.style.display='block'; } else { preview.removeAttribute('src'); preview.style.display='none'; } } }
  function readFile(file){ if(!file) return; const reader=new FileReader(); reader.onload=ev=> setPreview(ev.target.result); reader.readAsDataURL(file); }
  drop?.addEventListener('click', ()=> imgInput?.click());
  drop?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); imgInput?.click(); }});
  drop?.addEventListener('dragover', (e)=>{ e.preventDefault(); drop.classList.add('dragover'); });
  drop?.addEventListener('dragleave', ()=> drop.classList.remove('dragover'));
  drop?.addEventListener('drop', (e)=>{ e.preventDefault(); drop.classList.remove('dragover'); const file=e.dataTransfer.files?.[0]; if(file) { imgInput.files = e.dataTransfer.files; readFile(file); } });
  imgInput?.addEventListener('change', ()=>{ const file = imgInput.files?.[0]; readFile(file); });

  function cardHTML(r){
    return `
    <article class="receita-card" data-id="${r.id}">
      ${r.imagem?`<img src="${r.imagem}" alt="Imagem da receita">`:''}
      <div class="tags">${(r.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <h3>${r.titulo}</h3>
      <div class="ingredientes">${(r.ingredientes||[]).slice(0,3).join(', ')}${(r.ingredientes||[]).length>3?'...':''}</div>
      <div class="card-actions">
        <button class="btn btn-secondary" data-action="view">Ver</button>
        <button class="btn btn-secondary" data-action="edit">Editar</button>
        <button class="btn btn-danger" data-action="delete">Excluir</button>
        <button class="btn btn-secondary" data-action="share">Compartilhar</button>
      </div>
    </article>`;
  }

  function render(){
    if(!grid) return; renderFilters();
    const q = (searchEl?.value||'').toLowerCase();
    const tag = tagFilterEl?.value || '';
    const sort = sortEl?.value || 'newest';
    let list = cache.filter(r=>{
      const inQ = !q || (r.titulo||'').toLowerCase().includes(q) || (r.modo||'').toLowerCase().includes(q) || (r.tags||[]).some(t=>t.toLowerCase().includes(q)) || (r.ingredientes||[]).some(i=>i.toLowerCase().includes(q));
      const inTag = !tag || (r.tags||[]).includes(tag);
      return inQ && inTag;
    });
    list.sort((a,b)=>{ if(sort==='title') return (a.titulo||'').localeCompare(b.titulo||''); if(sort==='oldest') return (a.createdAt||'').localeCompare(b.createdAt||''); return (b.createdAt||'').localeCompare(a.createdAt||''); });
    if(!list.length){ grid.innerHTML='<p style="grid-column:1/-1;text-align:center;color:#64748b;">Nenhuma receita encontrada.</p>'; return; }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  // Modais
  const addModal = document.getElementById('modal-add-receita');
  const addForm = document.getElementById('form-add-receita');
  const viewModal = document.getElementById('modal-view-receita');
  function openAddModal(r=null){
    addModal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    addForm.dataset.editing = r?.id || '';
    document.getElementById('receita-titulo').value = r?.titulo || '';
    currentTags = (r?.tags||[]).slice(); renderChips(); syncHiddenTags(); tagInput && (tagInput.value='');
    document.getElementById('receita-ingredientes').value = (r?.ingredientes||[]).join('\n');
    document.getElementById('receita-modo').value = r?.modo || '';
    if (imgInput) imgInput.value='';
    setPreview(r?.imagem || '');
  }
  function closeAddModal(){ addModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; addForm.reset(); addForm.dataset.editing=''; }
  function openViewModal(r){ document.getElementById('view-receita-titulo').textContent=r.titulo; const img=document.getElementById('view-receita-imagem'); if(r.imagem){ img.src=r.imagem; img.style.display=''; } else { img.style.display='none'; } const tagsDiv=document.getElementById('view-receita-tags'); tagsDiv.innerHTML=''; (r.tags||[]).forEach(t=>{ const s=document.createElement('span'); s.className='tag'; s.textContent=t; tagsDiv.appendChild(s); }); const ul=document.getElementById('view-receita-ingredientes'); ul.innerHTML=''; (r.ingredientes||[]).forEach(i=>{ const li=document.createElement('li'); li.textContent=i; ul.appendChild(li); }); document.getElementById('view-receita-modo').textContent=r.modo||''; viewModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; const url=new URL(location.href); url.searchParams.set('r', r.id); history.replaceState({},'',url); }
  function closeViewModal(){ viewModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; const url=new URL(location.href); url.searchParams.delete('r'); history.replaceState({},'',url); }

  // CRUD helpers
  function upsert(rec){ const idx=cache.findIndex(x=>x.id===rec.id); if(idx>=0){ rec.updatedAt=now(); cache[idx]=rec; } else { rec.id=rec.id||uid(); rec.createdAt=now(); cache.unshift(rec); } save(); render(); }
  function remove(id){ cache=cache.filter(r=>r.id!==id); save(); render(); }
  function byId(id){ return cache.find(r=>r.id===id); }

  // Events
  addBtn?.addEventListener('click', ()=>openAddModal());
  addModal?.addEventListener('click', (e)=>{ if(e.target===addModal) closeAddModal(); });
  viewModal?.addEventListener('click', (e)=>{ if(e.target===viewModal) closeViewModal(); });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ closeAddModal(); closeViewModal(); }});

  addForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const titulo = document.getElementById('receita-titulo').value.trim();
    const tags = currentTags.slice();
    const ingredientes = document.getElementById('receita-ingredientes').value.split('\n').map(i=>i.trim()).filter(Boolean);
    const modo = document.getElementById('receita-modo').value.trim();
    const file = imgInput?.files?.[0];
    if(!titulo || !ingredientes.length || !modo){ alert('Preencha título, ingredientes e modo.'); return; }
    const commit = (img)=>{ const id=addForm.dataset.editing||null; const prev=id?byId(id):{}; upsert({ id, titulo, tags, ingredientes, modo, imagem: (img!==undefined? img : prev.imagem) }); closeAddModal(); };
    if(file){ const reader=new FileReader(); reader.onload=ev=>commit(ev.target.result); reader.readAsDataURL(file); }
    else commit(undefined);
  });

  grid?.addEventListener('click', async (e)=>{ const card=e.target.closest('.receita-card'); if(!card) return; const id=card.dataset.id; const r=byId(id); if(!r) return; const act=e.target.closest('[data-action]')?.dataset.action||'view'; if(act==='view') openViewModal(r); else if(act==='edit') openAddModal(r); else if(act==='delete'){ if(confirm('Excluir esta receita?')) remove(id); } else if(act==='share'){ const url=new URL(location.href); url.searchParams.set('r', id); try{ if(navigator.share) await navigator.share({ title:r.titulo, url:url.toString()}); else { await navigator.clipboard.writeText(url.toString()); e.target.textContent='Copiado!'; setTimeout(()=>e.target.textContent='Compartilhar',1200); } } catch{} }});

  searchEl?.addEventListener('input', (()=>{ let t; return ()=>{ clearTimeout(t); t=setTimeout(render,150); }; })());
  tagFilterEl?.addEventListener('change', render);
  sortEl?.addEventListener('change', render);

  

  function openFromURL(){ const id=(new URL(location.href)).searchParams.get('r'); if(id){ const r=byId(id); if(r) openViewModal(r); } }

  window.addEventListener('DOMContentLoaded', ()=>{ load(); render(); openFromURL(); });

  // Suporte a botões inline do HTML
  window.closeAddReceitaModal = () => closeAddModal();
  window.closeViewReceitaModal = () => closeViewModal();
  window.openAddReceitaModal = () => openAddModal();
})();
