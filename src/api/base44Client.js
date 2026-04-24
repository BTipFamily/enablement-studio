const STORAGE_KEY = 'enablement_studio_projects';

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

const Project = {
  list(sortField = '-created_date', limit = 50) {
    let items = getAll();
    const desc = sortField.startsWith('-');
    const field = desc ? sortField.slice(1) : sortField;
    items.sort((a, b) => {
      const va = String(a[field] || '');
      const vb = String(b[field] || '');
      return desc ? vb.localeCompare(va) : va.localeCompare(vb);
    });
    return Promise.resolve(items.slice(0, limit));
  },

  filter(query) {
    const items = getAll();
    const result = items.filter(p =>
      Object.entries(query).every(([k, v]) => p[k] === v)
    );
    return Promise.resolve(result);
  },

  create(data) {
    const items = getAll();
    const project = {
      ...data,
      id: crypto.randomUUID(),
      created_date: new Date().toISOString(),
    };
    items.push(project);
    saveAll(items);
    return Promise.resolve(project);
  },

  update(id, data) {
    const items = getAll();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return Promise.reject(new Error(`Project ${id} not found`));
    items[idx] = { ...items[idx], ...data };
    saveAll(items);
    return Promise.resolve(items[idx]);
  },
};

export const base44 = {
  entities: { Project },
};
