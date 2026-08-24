const PERIODOS = ['Triássico', 'Jurássico', 'Cretáceo'];

const DIETAS = ['Carnívoro', 'Herbívoro', 'Onívoro'];

const CATEGORIAS_TOPICO = [
    'Alimentação',
    'Fósseis',
    'Comportamento',
    'Curiosidade',
    'Aparência física'
];

const FAMILIAS = [
    'Theropoda',
    'Spinosauridae',
    'Sauropoda',
    'Titanosauria',
    'Ceratopsia',
    'Ankylosauria',
    'Stegosauria',
    'Hadrosauridae',
    'Ornithischia'
];

const DIETA_ALIASES = {
    carnivoro: 'Carnívoro',
    herbivoro: 'Herbívoro',
    omnivoro: 'Onívoro',
    carnívoro: 'Carnívoro',
    herbívoro: 'Herbívoro',
    onívoro: 'Onívoro'
};

function semAcento(valor) {
    return String(valor)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

function encontrarLista(lista, valor) {
    if (!valor) return valor;
    if (lista.includes(valor)) return valor;
    return lista.find((item) => semAcento(item) === semAcento(valor)) || valor;
}

function normalizarDieta(valor) {
    if (!valor) return valor;
    if (DIETAS.includes(valor)) return valor;
    const chave = semAcento(valor);
    return DIETA_ALIASES[chave] || encontrarLista(DIETAS, valor);
}

function normalizarPeriodo(valor) {
    return encontrarLista(PERIODOS, valor);
}

function normalizarCategoria(valor) {
    return encontrarLista(CATEGORIAS_TOPICO, valor);
}

module.exports = {
    PERIODOS,
    DIETAS,
    CATEGORIAS_TOPICO,
    FAMILIAS,
    normalizarDieta,
    normalizarPeriodo,
    normalizarCategoria,
    semAcento
};
