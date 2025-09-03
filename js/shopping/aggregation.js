// aggregation.js
// Funções puras para normalizar unidades, padronizar nomes e agregar itens.
// Observação: conversões de xícara/colheres são aproximações culinárias.

import { standardizeName, categorize } from './ingredients.js';

// Conversões base
const UNIT_BASE = {
  g: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  l: { base: 'ml', factor: 1000 },
  un: { base: 'un', factor: 1 },
  unidade: { base: 'un', factor: 1 },
  und: { base: 'un', factor: 1 },
  u: { base: 'un', factor: 1 },
  cup: { base: 'g', factor: 0, special: 'cup' },
  xicara: { base: 'g', factor: 0, special: 'cup' },
  tbsp: { base: 'g', factor: 0, special: 'tbsp' }, // 1 colher sopa
  tsp: { base: 'g', factor: 0, special: 'tsp' }, // 1 colher chá
};

// Densidades / equivalências aproximadas por ingrediente comum
// cup: farinha 120g; arroz 185g; leite 240ml; açúcar 200g
// tbsp: líquidos 15ml; açúcar ~12.5g; sal ~18g
const CUP_MAP_G = new Map([
  ['farinha', 120],
  ['arroz', 185],
  ['açúcar', 200],
  ['acucar', 200],
  ['azeite', 240], // em ml, tratamos abaixo
  ['leite', 240],  // em ml, tratamos abaixo
]);

const TBSP_LIQ_ML = 15;
const TSP_LIQ_ML = 5;
const TBSP_SOLID_G = new Map([
  ['açúcar', 12.5],
  ['acucar', 12.5],
  ['sal', 18],
]);

function isLiquidName(name) {
  const n = (name || '').toLowerCase();
  return /leite|agua|óleo|oleo|vinagre/.test(n);
}

// Normaliza unidade para base g, ml e un. Aceita name opcional p/ melhor conversão
export function normalizeUnit({ qty = 0, unit = 'un', name = '' }) {
  if (!unit) return { qty: Number(qty) || 0, unit: 'un' };
  const u = String(unit).toLowerCase().trim();
  const def = UNIT_BASE[u] || UNIT_BASE['un'];

  // especiais (cup/tbsp/tsp)
  if (def.special === 'cup') {
    const n = String(name || '').toLowerCase();
    // líquidos em cup -> ml, sólidos -> g
    if (isLiquidName(n) || CUP_MAP_G.get(n) === 240) {
      return { qty: (Number(qty) || 0) * 240, unit: 'ml' };
    }
    const g = CUP_MAP_G.get(n) || 200; // fallback 200g p/ cup
    return { qty: (Number(qty) || 0) * g, unit: 'g' };
  }
  if (def.special === 'tbsp') {
    const n = String(name || '').toLowerCase();
    if (isLiquidName(n)) return { qty: (Number(qty) || 0) * TBSP_LIQ_ML, unit: 'ml' };
    const g = TBSP_SOLID_G.get(n) || 10; // fallback 10g
    return { qty: (Number(qty) || 0) * g, unit: 'g' };
  }
  if (def.special === 'tsp') {
    const n = String(name || '').toLowerCase();
    if (isLiquidName(n)) return { qty: (Number(qty) || 0) * TSP_LIQ_ML, unit: 'ml' };
    const g = TBSP_SOLID_G.get(n) ? TBSP_SOLID_G.get(n) / 3 : 4; // aproximado
    return { qty: (Number(qty) || 0) * g, unit: 'g' };
  }

  return { qty: (Number(qty) || 0) * def.factor, unit: def.base };
}

export function recompact({ qty, unit }) {
  // Recompacta para kg/l se > 1000
  if (unit === 'g' && qty >= 1000) return { qty: +(qty / 1000).toFixed(2), unit: 'kg' };
  if (unit === 'ml' && qty >= 1000) return { qty: +(qty / 1000).toFixed(2), unit: 'l' };
  return { qty: +(+qty).toFixed(2), unit };
}

export function aggregate(ingredients = []) {
  // ingredients: [{ name, qty, unit }]
  const acc = new Map(); // key: name|baseUnit

  for (const item of ingredients) {
    const stdName = standardizeName(item.name);
    const { qty, unit } = normalizeUnit({ qty: item.qty, unit: item.unit, name: stdName });
    const key = `${stdName}|${unit}`;
    const current = acc.get(key) || { name: stdName, qty: 0, unit, _catHint: null };
    current.qty += Number(qty) || 0;
    if (!current._catHint && item.category) current._catHint = item.category;
    acc.set(key, current);
  }

  // Recompacta
  const out = [...acc.values()].map((x) => ({ name: x.name, ...recompact({ qty: x.qty, unit: x.unit }), category: x._catHint || categorize(x.name) }));

  // Ordena por categoria e depois nome
  const order = ['hortifruti', 'laticinios', 'carnes', 'graos', 'mercearia', 'higiene', 'outros'];
  out.sort((a, b) => {
    const ca = order.indexOf(a.category); const cb = order.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
  });
  return out;
}

/*
// Testes rápidos (cole no console do navegador):
import { aggregate, normalizeUnit, standardizeName } from './aggregation.js';

console.log('normalize kg->g', normalizeUnit({ qty: 1.2, unit: 'kg' })); // {qty:1200, unit:'g'}
console.log('normalize cup farinha', normalizeUnit({ qty: 1, unit: 'cup', name: 'farinha' })); // ~120g
console.log('normalize cup leite', normalizeUnit({ qty: 1, unit: 'cup', name: 'leite' })); // 240ml

const list = [
  { name: 'Tomate', qty: 2, unit: 'un' },
  { name: 'tomates', qty: 1, unit: 'un' },
  { name: 'Arroz', qty: 0.5, unit: 'kg' },
  { name: 'arroz', qty: 300, unit: 'g' },
  { name: 'Leite', qty: 2, unit: 'cup' }
];
console.log('aggregate', aggregate(list));
*/
