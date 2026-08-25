const CATALOGO = [
    { id: 'pegadas', tipo: 'moldura', nome: 'Anel de pegadas', descricao: 'Moldura com pegadas em volta da foto', min: 50, simbolo: '🐾' },
    { id: 'fossil', tipo: 'moldura', nome: 'Moldura de fóssil', descricao: 'Anel de osso ao redor da foto', min: 150, simbolo: '🦴' },
    { id: 'ambar', tipo: 'moldura', nome: 'Halo de âmbar', descricao: 'Brilho dourado de curador', min: 400, simbolo: '✨' },
    { id: 'meteoro', tipo: 'moldura', nome: 'Chama do meteoro', descricao: 'Aura de Lenda do Mesozoico', min: 1000, simbolo: '☄️' },
    { id: 'lendario', tipo: 'moldura', nome: 'Aura lendária', descricao: 'Enfeite do nível máximo', min: 5000, simbolo: '🌟' },
    {
        id: 'fundador',
        tipo: 'broche',
        nome: 'Selo do criador',
        descricao: 'Marca exclusiva de quem fundou a DinoPédia',
        min: 0,
        soCriador: true,
        simbolo: '🦖'
    },
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

function podeUsar(item, pontos, criador) {
    if (!item) return false;
    if (item.soCriador) return Boolean(criador);
    return Number(pontos) >= Number(item.min || 0);
}

function validarEscolha(ids, pontos, criador = false) {
    const lista = Array.isArray(ids) ? ids : lerLista(ids);
    const usados = new Set();
    const escolhidos = [];

    lista.forEach((id) => {
        const item = porId(id);
        if (!item) {
            throw new Error('Esse enfeite não existe.');
        }
        if (item.soCriador && !criador) {
            throw new Error('Esse broche é exclusivo do criador da DinoPédia.');
        }
        if (!podeUsar(item, pontos, criador)) {
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

function listar(pontos, equipados, criador = false) {
    const ativos = new Set(lerLista(equipados));
    return CATALOGO
        .filter((item) => !item.soCriador || criador)
        .map((item) => ({
            ...item,
            desbloqueado: podeUsar(item, pontos, criador),
            equipado: ativos.has(item.id),
            faltam: item.soCriador ? 0 : Math.max(0, item.min - pontos)
        }));
}

function filtrarEquipados(ids, pontos, criador = false) {
    return lerLista(ids).filter((id) => podeUsar(porId(id), pontos, criador));
}

module.exports = {
    CATALOGO,
    porId,
    lerLista,
    validarEscolha,
    listar,
    filtrarEquipados
};
