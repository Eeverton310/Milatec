export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function matchesSearch(values, searchTerm) {
  const normalizedSearch = normalizeText(searchTerm).trim();

  if (!normalizedSearch) return true;

  return values.some((value) => normalizeText(value).includes(normalizedSearch));
}

export function uniqueTextOptions(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}
