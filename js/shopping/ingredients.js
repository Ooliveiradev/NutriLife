// ingredients.js
// - Normalização de nomes (acentos/sinônimos)
// - Categorização por regex

export function stripAccents(s = '') {
  return (s || '').normalize('NFD').replace(/\p{Diacritic}+/gu, '');
}

// Mapa simples de sinônimos (lowercase, sem acento)
const SYNONYMS = new Map([
  ['tomate italiano', 'tomate'],
  ['tomates', 'tomate'],
  ['cebola roxa', 'cebola'],
  ['pimentao vermelho', 'pimentao'],
  ['pimentao verde', 'pimentao'],
  ['acucar', 'açucar'], // preserva grafia original sem acento na chave
  ['leite integral', 'leite'],
  ['arroz branco', 'arroz'],
  ['arroz integral', 'arroz integral'],
  ['azeite de oliva', 'azeite'],
  ['azeite', 'azeite'],
  ['sal marinho', 'sal'],
]);

export function standardizeName(name = '') {
  const raw = stripAccents(String(name).toLowerCase().trim());
  if (!raw) return '';
  const mapped = SYNONYMS.get(raw) || raw;
  // volta com acento padrão quando fizer sentido (ex.: açúcar)
  if (mapped === 'acucar') return 'açúcar';
  return mapped;
}

// Categorias de mercado
const CATEGORY_PATTERNS = [
  ['hortifruti', [/tomate/, /cebola/, /alface/, /banana/, /maca/, /manga/, /pimentao/, /batata/, /cenoura/, /alho/]],
  ['laticinios', [/leite/, /queijo/, /manteiga/, /iogurte/, /requeijao/, /creme de leite/]],
  ['carnes', [/frango/, /carne/, /bovino/, /suino/, /peito de frango/, /ovo/, /ovos/]],
  ['graos', [/arroz/, /feijao/, /aveia/, /farinha/, /granola/, /quinoa/]],
  ['mercearia', [/azeite/, /oleo/, /sal/, /a[cç]ucar/, /massa/, /macarrao/, /molho/, /tempero/, /fermento/, /pao/, /p[áa]prica/]],
  ['higiene', [/detergente/, /sabao/, /papel[, ]?toalha/, /papel[, ]?higienico/]],
  ['outros', [/./]],
];

export function categorize(name = '') {
  const n = stripAccents(String(name).toLowerCase());
  for (const [cat, pats] of CATEGORY_PATTERNS) {
    if (pats.some((re) => re.test(n))) return cat;
  }
  return 'outros';
}

