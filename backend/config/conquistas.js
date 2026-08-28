const CATALOGO = [
    {
        id: 'ovo_chocado',
        nome: 'Ovo chocado',
        descricao: 'Confirmou a conta na DinoPédia',
        simbolo: '🥚',
        meta: 1,
        progresso: (stats) => (stats.confirmado ? 1 : 0)
    },
    {
        id: 'primeira_pegada',
        nome: 'Primeira pegada',
        descricao: 'Cadastrou o primeiro dinossauro',
        simbolo: '🦕',
        meta: 1,
        progresso: (stats) => stats.dinos
    },
    {
        id: 'ninho_cheio',
        nome: 'Ninho cheio',
        descricao: 'Cadastrou 3 dinossauros',
        simbolo: '🦴',
        meta: 3,
        progresso: (stats) => stats.dinos
    },
    {
        id: 'lapis_fossil',
        nome: 'Lápis de fóssil',
        descricao: 'Fez a primeira edição numa ficha',
        simbolo: '✏️',
        meta: 1,
        progresso: (stats) => stats.edicoes
    },
    {
        id: 'restaurador',
        nome: 'Restaurador',
        descricao: 'Editou fichas 5 vezes',
        simbolo: '🛠️',
        meta: 5,
        progresso: (stats) => stats.edicoes
    },
    {
        id: 'contador_historias',
        nome: 'Contador de histórias',
        descricao: 'Escreveu o primeiro tópico',
        simbolo: '📜',
        meta: 1,
        progresso: (stats) => stats.topicos
    },
    {
        id: 'camera_cretaceo',
        nome: 'Câmera do Cretáceo',
        descricao: 'Enviou foto numa ficha',
        simbolo: '📷',
        meta: 1,
        progresso: (stats) => stats.fotosDino
    },
    {
        id: 'placa_identidade',
        nome: 'Placa de identidade',
        descricao: 'Colocou foto e descrição no perfil',
        simbolo: '🪪',
        meta: 2,
        progresso: (stats) => (stats.fotoPerfil ? 1 : 0) + (stats.descricaoPerfil ? 1 : 0)
    },
    {
        id: 'explorador_vale',
        nome: 'Explorador do vale',
        descricao: 'Chegou a 50 pontos',
        simbolo: '🧭',
        meta: 50,
        progresso: (stats) => stats.pontos
    },
    {
        id: 'curador_museu',
        nome: 'Curador do museu',
        descricao: 'Chegou a 400 pontos',
        simbolo: '🏅',
        meta: 400,
        progresso: (stats) => stats.pontos
    },
    {
        id: 'primeira_amizade',
        nome: 'Primeira amizade',
        descricao: 'Seguiu outra pessoa',
        simbolo: '🤝',
        meta: 1,
        progresso: (stats) => stats.seguindo
    },
    {
        id: 'dinossauro_favorito',
        nome: 'Dinossauro favorito',
        descricao: 'Escolheu um dinossauro favorito',
        simbolo: '❤️',
        meta: 1,
        progresso: (stats) => (stats.favorito ? 1 : 0)
    }
];

function catalogoPublico() {
    return CATALOGO.map(({ id, nome, descricao, simbolo, meta }) => ({
        id,
        nome,
        descricao,
        simbolo,
        meta
    }));
}

module.exports = { CATALOGO, catalogoPublico };
