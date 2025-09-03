// recipes.js
// Carrega receitas do Firestore (recipes) com fallback para data/sample-recipes.json
// Também implementa sugestão de cardápio por objetivo simples

import { db, fs } from './firebase.js';

// Fallback embutido para garantir catálogo mesmo sem servidor
const SAMPLE_RECIPES = [
  { id: 'r1', name: 'Salada de Grão-de-bico', tags: ['vegetariano','rápido','barato'], time: 15, portion: 2, kcal: 480,
    ingredients: [
      { name: 'grão-de-bico cozido', qty: 300, unit: 'g' },
      { name: 'tomate', qty: 2, unit: 'un' },
      { name: 'cebola', qty: 0.5, unit: 'un' },
      { name: 'azeite', qty: 2, unit: 'tbsp' },
      { name: 'sal', qty: 1, unit: 'tsp' }
    ], steps: ['Picar legumes','Misturar com grão-de-bico','Temperar'] },
  { id: 'r2', name: 'Frango grelhado com arroz', tags: ['rápido','proteica'], time: 25, portion: 2, kcal: 700,
    ingredients: [
      { name: 'peito de frango', qty: 400, unit: 'g' },
      { name: 'arroz', qty: 1, unit: 'cup' },
      { name: 'azeite', qty: 1, unit: 'tbsp' },
      { name: 'sal', qty: 1, unit: 'tsp' }
    ], steps: ['Grelhar frango','Cozinhar arroz','Servir'] },
  { id: 'r3', name: 'Panqueca de Aveia', tags: ['barato','rápido','sem lactose'], time: 20, portion: 2, kcal: 520,
    ingredients: [
      { name: 'aveia', qty: 1, unit: 'cup' },
      { name: 'leite', qty: 1, unit: 'cup' },
      { name: 'ovo', qty: 2, unit: 'un' },
      { name: 'açúcar', qty: 1, unit: 'tbsp' },
      { name: 'sal', qty: 0.25, unit: 'tsp' }
    ], steps: ['Bater tudo','Dourar em frigideira'] },
  { id: 'r4', name: 'Bowl Low Carb', tags: ['low carb','rápido'], time: 15, portion: 1, kcal: 430,
    ingredients: [
      { name: 'alface', qty: 100, unit: 'g' },
      { name: 'tomate', qty: 1, unit: 'un' },
      { name: 'ovo', qty: 2, unit: 'un' },
      { name: 'azeite', qty: 1, unit: 'tbsp' }
    ], steps: ['Montar bowl','Temperar'] },
  { id: 'r5', name: 'Risoto simples', tags: ['barato'], time: 40, portion: 3, kcal: 900,
    ingredients: [
      { name: 'arroz', qty: 2, unit: 'cup' },
      { name: 'cebola', qty: 1, unit: 'un' },
      { name: 'manteiga', qty: 1, unit: 'tbsp' },
      { name: 'sal', qty: 1, unit: 'tsp' }
    ], steps: ['Refogar','Cozinhar','Finalizar'] },
  { id: 'r6', name: 'Iogurte com Granola', tags: ['rápido','barato'], time: 5, portion: 1, kcal: 280,
    ingredients: [
      { name: 'iogurte', qty: 170, unit: 'g' },
      { name: 'granola', qty: 0.5, unit: 'cup' },
      { name: 'açúcar', qty: 1, unit: 'tsp' }
    ], steps: ['Montar e servir'] },
  { id: 'r7', name: 'Sopa de Legumes', tags: ['vegetariano','sem lactose'], time: 35, portion: 4, kcal: 650,
    ingredients: [
      { name: 'batata', qty: 2, unit: 'un' },
      { name: 'cenoura', qty: 2, unit: 'un' },
      { name: 'cebola', qty: 1, unit: 'un' },
      { name: 'azeite', qty: 1, unit: 'tbsp' },
      { name: 'sal', qty: 1, unit: 'tsp' }
    ], steps: ['Cozinhar legumes','Temperar'] },
  { id: 'r8', name: 'Arroz integral com legumes', tags: ['vegetariano','barato'], time: 35, portion: 3, kcal: 780,
    ingredients: [
      { name: 'arroz integral', qty: 1.5, unit: 'cup' },
      { name: 'tomate', qty: 1, unit: 'un' },
      { name: 'cebola', qty: 1, unit: 'un' },
      { name: 'azeite', qty: 1, unit: 'tbsp' }
    ], steps: ['Refogar','Cozinhar','Servir'] },
];

export async function fetchRecipes() {
  try {
    const q = fs.query(fs.collection(db, 'recipes'), fs.orderBy('createdAt', 'desc'), fs.limit(100));
    const snap = await fs.getDocs(q);
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (arr.length) return arr;
  } catch (e) {
    console.info('[recipes] Falha ao ler Firestore, usando sample.', e?.message || e);
  }
  // Fallback para JSON local
  try {
    const res = await fetch('data/sample-recipes.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) return data;
    }
  } catch (e) {
    console.info('[recipes] Falha ao carregar JSON local, usando embutido.', e?.message || e);
  }
  // Último fallback: embutido
  return SAMPLE_RECIPES;
}

// Cache leve em sessionStorage
export async function getRecipesCached() {
  const key = 'nl_recipes_cache_v1';
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {}
  const data = await fetchRecipes();
  try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
  return data;
}

export function filterRecipes(list, { search = '', filters = {} } = {}) {
  const s = (search || '').toLowerCase().trim();
  const keys = Object.entries(filters).filter(([,v]) => !!v).map(([k]) => k);
  return list.filter(r => {
    const bySearch = !s || r.name.toLowerCase().includes(s) || (r.ingredients || []).some(i => String(i.name).toLowerCase().includes(s));
    const byFilters = !keys.length || keys.every(k => (r.tags || []).map(x => x.toLowerCase()).includes(k));
    return bySearch && byFilters;
  });
}

// Sugestão simples por objetivo
export function suggestByGoal(all, goal = 'manter', count = 10) {
  const pool = [...all];
  // Heurísticas
  let tagged = [];
  if (goal === 'emagrecer') tagged = pool.filter(r => (r.tags || []).includes('low carb'));
  else if (goal === 'ganho') tagged = pool.filter(r => (r.tags || []).includes('proteica'));
  else tagged = pool.filter(r => (r.tags || []).includes('rápido'));
  if (tagged.length < count) tagged = pool; // fallback
  // embaralha leve
  tagged.sort(() => Math.random() - 0.5);
  return tagged.slice(0, count);
}

