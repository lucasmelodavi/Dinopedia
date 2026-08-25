const CATALOGO = [
    { id: 'pegadas', tipo: 'moldura', nome: 'Anel de pegadas', descricao: 'Moldura com pegadas em volta da foto', min: 50, simbolo: '🐾' },
    { id: 'fossil', tipo: 'moldura', nome: 'Moldura de fóssil', descricao: 'Anel de osso ao redor da foto', min: 150, simbolo: '🦴' },
    { id: 'ambar', tipo: 'moldura', nome: 'Halo de âmbar', descricao: 'Brilho dourado de curador', min: 400, simbolo: '✨' },
    { id: 'meteoro', tipo: 'moldura', nome: 'Chama do meteoro', descricao: 'Aura de Lenda do Mesozoico', min: 1000, simbolo: '☄️' },
    { id: 'lendario', tipo: 'moldura', nome: 'Aura lendária', descricao: 'Enfeite do nível máximo', min: 5000, simbolo: '🌟' },
    { id: 'ovo', tipo: 'broche', nome: 'Ovo', descricao: 'Broche de quem já confirmou a conta', min: 10, simbolo: '🥚' },
    { id: 'folha', tipo: 'broche', nome: 'Folha', descricao: 'Broche de explorador', min: 50, simbolo: '🌿' },
    { id: 'osso', tipo: 'broche', nome: 'Osso', descricao: 'Broche de paleontólogo', min: 150, simbolo: '🦴' },
    { id: 'medalha', tipo: 'broche', nome: 'Medalha', descricao: 'Broche de curador', min: 400, simbolo: '🏅' },
    { id: 'coroa', tipo: 'broche', nome: 'Coroa', descricao: 'Broche de lenda', min: 1000, simbolo: '👑' }
];

function porId(id) {
    return CATALOGO.find((item) => item.id === id) || null;
}

function lerLista(valor) {
    if (!valor) return [];
    if (Array.isArray(valor)) return valor.map(String);
    try {
        const parsed = JSON.parse(valor);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return String(valor)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
}

function validarEscolha(ids, pontos) {
    const lista = Array.isArray(ids) ? ids : lerLista(ids);
    const usados = new Set();
    const escolhidos = [];

    lista.forEach((id) => {
        const item = porId(id);
        if (!item) {
            throw new Error('Esse enfeite não existe.');
        }
        if (pontos < item.min) {
            throw new Error(`Faltam pontos para usar ${item.nome}. Desbloqueia com ${item.min} pontos.`);
        }
        if (usados.has(item.tipo)) {
            return;
        }
        usados.add(item.tipo);
        escolhidos.push(item.id);
    });

    return escolhidos;
}

function listar(pontos, equipados) {
    const ativos = new Set(lerLista(equipados));
    return CATALOGO.map((item) => ({
        ...item,
        desbloqueado: pontos >= item.min,
        equipado: ativos.has(item.id),
        faltam: Math.max(0, item.min - pontos)
    }));
}

function filtrarEquipados(ids, pontos) {
    return lerLista(ids).filter((id) => {
        const item = porId(id);
        return item && pontos >= item.min;
    });
}

module.exports = {
    CATALOGO,
    porId,
    lerLista,
    validarEscolha,
    listar,
    filtrarEquipados
};
