// Dapur Kilat — ingredients, their prep step, and the dish menu.
// A dish is a set of prepared ingredients; the plate must hold exactly
// those to match an order. Prices grow with the number of steps.

export const INGREDIENTS = {
  nasi: { name: 'Nasi', prep: 'ready', color: '#fff6e0', dark: '#d9c48f', price: 10 },
  mie: { name: 'Mie', prep: 'cook', color: '#f2c14e', dark: '#b98a1e', price: 14 },
  ayam: { name: 'Ayam', prep: 'cook', color: '#c98a4b', dark: '#8a5a24', price: 18 },
  telur: { name: 'Telur', prep: 'cook', color: '#ffe9a8', dark: '#d9a441', price: 12 },
  sayur: { name: 'Sayur', prep: 'chop', color: '#58b368', dark: '#2f7d3c', price: 10 },
  cabai: { name: 'Cabai', prep: 'chop', color: '#e2483a', dark: '#93241c', price: 10 },
};

export const PREP_LABEL = {
  ready: 'siap',
  chop: 'potong',
  cook: 'masak',
};

export function prepOf(id) { return INGREDIENTS[id].prep; }

// A prepared item is { id, state } where state is 'raw' | 'done'.
// 'ready' ingredients are done the moment they are picked up.
export function freshItem(id) {
  return { id, state: INGREDIENTS[id].prep === 'ready' ? 'done' : 'raw' };
}

export function itemLabel(item) {
  const base = INGREDIENTS[item.id].name;
  if (item.state === 'done') return base;
  return `${base} (${PREP_LABEL[INGREDIENTS[item.id].prep]})`;
}

export const DISHES = [
  { name: 'Nasi Goreng', needs: ['nasi', 'telur', 'cabai'], price: 60 },
  { name: 'Mie Goreng', needs: ['mie', 'telur', 'sayur'], price: 65 },
  { name: 'Ayam Geprek', needs: ['ayam', 'cabai'], price: 55 },
  { name: 'Soto Ayam', needs: ['ayam', 'sayur', 'nasi'], price: 70 },
  { name: 'Telur Dadar', needs: ['telur', 'sayur'], price: 45 },
  { name: 'Nasi Ayam', needs: ['nasi', 'ayam'], price: 50 },
];

export function dishByName(name) {
  return DISHES.find((d) => d.name === name);
}

// Does the plate's done-items exactly match the dish (order-insensitive)?
export function plateMatchesDish(plateIds, dish) {
  if (plateIds.length !== dish.needs.length) return false;
  const have = plateIds.slice().sort().join(',');
  const want = dish.needs.slice().sort().join(',');
  return have === want;
}

// How many of the dish's needs the plate already covers (for the HUD hint).
export function plateProgress(plateIds, dish) {
  const remaining = dish.needs.slice();
  let done = 0;
  for (const id of plateIds) {
    const i = remaining.indexOf(id);
    if (i !== -1) { remaining.splice(i, 1); done += 1; }
  }
  return { done, total: dish.needs.length, missing: remaining };
}
