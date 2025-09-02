// Multi-tag selection (chips) for filter and add-recipe
// - Selected tag turns into a chip with a hover X to remove
// - Selected tag is removed from the available datalist
// - Removing a chip returns the tag to the datalist (if it was originally there)

// Expose modal helpers early so inline onclick works reliably
window.openAddReceitaModal = function () {
  const addModal = qs('#modal-add-receita');
  if (addModal) {
    addModal.setAttribute('aria-hidden', 'false');
    addModal.classList.add('active');
    document.body.classList.add('modal-open');
  }
};
window.closeAddReceitaModal = function () {
  const addModal = qs('#modal-add-receita');
  if (addModal) {
    addModal.classList.remove('active');
    addModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
};
window.closeViewReceitaModal = function () {
  const viewModal = qs('#modal-view-receita');
  if (viewModal) {
    viewModal.classList.remove('active');
    viewModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = qs('#search-receita');
  const sortSelect = qs('#filter-sort');

  const filterChips = initChips({
    inputSelector: '#filter-tag-input',
    chipsSelector: '#filter-tags-chips',
    datalistSelector: '#filter-tags-datalist',
    onChange: () => updateFilter()
  });

  const formChips = initChips({
    inputSelector: '#tag-input',
    chipsSelector: '#tags-chips',
    datalistSelector: '#form-tags-datalist',
    hiddenSelector: '#receita-tags'
  });

  if (searchInput) searchInput.addEventListener('input', updateFilter);
  if (sortSelect) sortSelect.addEventListener('change', updateFilter);

  function updateFilter() {
    const text = searchInput ? searchInput.value.trim() : '';
    const tags = filterChips.getSelected();
    const sort = sortSelect ? sortSelect.value : 'newest';
    const listEl = qs('#receitas-list');
    if (listEl) {
      listEl.dataset.search = text;
      listEl.dataset.tags = JSON.stringify(tags);
      listEl.dataset.sort = sort;
    }
    document.dispatchEvent(new CustomEvent('receitas:filter', { detail: { text, tags, sort } }));
  }

  // Also wire the add button in case inline handler is removed
  const addBtn = qs('#add-receita-btn');
  if (addBtn) addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.openAddReceitaModal();
  });

  // Close on backdrop click and ESC
  const addModal = qs('#modal-add-receita');
  const viewModal = qs('#modal-view-receita');
  [addModal, viewModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
      }
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [qs('#modal-add-receita'), qs('#modal-view-receita')].forEach(m => {
        if (m && m.classList.contains('active')) {
          m.classList.remove('active');
          m.setAttribute('aria-hidden', 'true');
        }
      });
      document.body.classList.remove('modal-open');
    }
  });
});

function initChips({ inputSelector, chipsSelector, datalistSelector, hiddenSelector, onChange }) {
  const input = qs(inputSelector);
  const chipsContainer = qs(chipsSelector);
  const datalist = qs(datalistSelector);
  const hidden = hiddenSelector ? qs(hiddenSelector) : null;
  const selected = [];

  const initialSet = new Set();
  if (datalist) {
    Array.from(datalist.options).forEach(opt => {
      if (opt && typeof opt.value === 'string') initialSet.add(opt.value.toLowerCase());
    });
  }

  function normalize(val) { return (val || '').trim(); }
  function containsCaseInsensitive(arr, value) {
    const v = value.toLowerCase();
    return arr.some(x => x.toLowerCase() === v);
  }

  function syncHidden() {
    if (hidden) hidden.value = selected.join(',');
  }

  function removeOptionFromDatalist(value) {
    if (!datalist) return;
    const vLower = value.toLowerCase();
    const opt = Array.from(datalist.options).find(o => (o.value || '').toLowerCase() === vLower);
    if (opt) datalist.removeChild(opt);
  }

  function addOptionBackToDatalist(value) {
    if (!datalist) return;
    const vLower = value.toLowerCase();
    if (!initialSet.has(vLower)) return; // only restore if it was originally available
    const exists = Array.from(datalist.options).some(o => (o.value || '').toLowerCase() === vLower);
    if (exists) return;
    const opt = document.createElement('option');
    opt.value = value;
    datalist.appendChild(opt);
  }

  function renderChip(value) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.setAttribute('data-value', value);
    chip.title = value;

    const text = document.createElement('span');
    text.textContent = value;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove';
    btn.setAttribute('aria-label', `Remover tag ${value}`);
    btn.textContent = 'x';

    btn.addEventListener('click', () => {
      const idx = selected.findIndex(x => x.toLowerCase() === value.toLowerCase());
      if (idx >= 0) selected.splice(idx, 1);
      addOptionBackToDatalist(value);
      chip.remove();
      syncHidden();
      if (typeof onChange === 'function') onChange(selected.slice());
    });

    chip.appendChild(text);
    chip.appendChild(btn);
    if (chipsContainer) chipsContainer.appendChild(chip);
  }

  function addTag(value) {
    const val = normalize(value);
    if (!val) return;
    if (containsCaseInsensitive(selected, val)) {
      if (input) input.value = '';
      return;
    }
    selected.push(val);
    removeOptionFromDatalist(val);
    renderChip(val);
    syncHidden();
    if (input) input.value = '';
    if (typeof onChange === 'function') onChange(selected.slice());
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag(input.value);
      } else if (e.key === ',' || e.key === ';') {
        e.preventDefault();
        const parts = input.value.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        if (parts.length) parts.forEach(p => addTag(p));
      }
    });
    input.addEventListener('change', () => {
      if (input.value) addTag(input.value);
    });
    input.addEventListener('blur', () => {
      if (input.value) addTag(input.value);
    });
    input.setAttribute('autocomplete', 'off');
  }

  return {
    getSelected: () => selected.slice(),
    addTag
  };
}

function qs(sel, root) {
  return (root || document).querySelector(sel);
}

