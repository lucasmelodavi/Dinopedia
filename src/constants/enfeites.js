export const ENFEITES = [
  { id: 'pegadas', tipo: 'moldura', nome: 'Anel de pegadas', descricao: 'Moldura com pegadas em volta da foto', min: 50, simbolo: '🐾' },
  { id: 'fossil', tipo: 'moldura', nome: 'Moldura de fóssil', descricao: 'Anel de osso ao redor da foto', min: 150, simbolo: '🦴' },
  { id: 'ambar', tipo: 'moldura', nome: 'Halo de âmbar', descricao: 'Brilho dourado de curador', min: 400, simbolo: '✨' },
  { id: 'meteoro', tipo: 'moldura', nome: 'Chama do meteoro', descricao: 'Aura de Lenda do Mesozoico', min: 1000, simbolo: '☄️' },
  { id: 'lendario', tipo: 'moldura', nome: 'Aura lendária', descricao: 'Enfeite do nível máximo', min: 5000, simbolo: '🌟' },
  { id: 'ovo', tipo: 'broche', nome: 'Ovo', descricao: 'Broche de quem já confirmou a conta', min: 10, simbolo: '🥚' },
  { id: 'folha', tipo: 'broche', nome: 'Folha', descricao: 'Broche de explorador', min: 50, simbolo: '🌿' },
  { id: 'osso', tipo: 'broche', nome: 'Osso', descricao: 'Broche de paleontólogo', min: 150, simbolo: '🦴' },
  { id: 'medalha', tipo: 'broche', nome: 'Medalha', descricao: 'Broche de curador', min: 400, simbolo: '🏅' },
  { id: 'coroa', tipo: 'broche', nome: 'Coroa', descricao: 'Broche de lenda', min: 1000, simbolo: '👑' },
]

export function enfeitePorId(id) {
  return ENFEITES.find((item) => item.id === id) || null
}

export function molduraDe(enfeites = []) {
  return (enfeites || []).map(enfeitePorId).find((item) => item?.tipo === 'moldura') || null
}

export function brocheDe(enfeites = []) {
  return (enfeites || []).map(enfeitePorId).find((item) => item?.tipo === 'broche') || null
}
