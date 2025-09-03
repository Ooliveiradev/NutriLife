// exporters.js
// CSV, Compartilhar e Print

export function toCSV(items = []) {
  const header = 'categoria;item;quantidade;unidade;observacao\n';
  const lines = items.map(i => [i.category, i.name, i.qty, i.unit, i.note || ''].map(val => String(val ?? '').replace(/;/g, ',')).join(';'));
  const csv = header + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lista-compras.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function toShareText(items = []) {
  const byCat = new Map();
  for (const it of items) {
    const arr = byCat.get(it.category) || []; arr.push(it); byCat.set(it.category, arr);
  }
  let out = 'Lista de Compras - NutriLife\n\n';
  for (const [cat, arr] of byCat) {
    out += `# ${cat.toUpperCase()}\n`;
    arr.forEach(i => { out += `- [ ] ${i.name} — ${i.qty} ${i.unit}${i.note ? ` (${i.note})` : ''}\n`; });
    out += '\n';
  }
  return out.trim();
}

export async function shareList(items = []) {
  const text = toShareText(items);
  if (navigator.share) {
    try { await navigator.share({ text, title: 'Lista de Compras - NutriLife' }); return; } catch {}
  }
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function printView() {
  window.print();
}

