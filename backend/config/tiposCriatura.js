const { FAMILIAS, DIETAS } = require('./constants');

const TIPOS_IDS = ['dinossauro', 'pterossauro', 'reptil_marinho', 'mamifero', 'outro'];

const PERIODOS_MESOZOICO = ['Triássico', 'Jurássico', 'Cretáceo'];
const PERIODOS_CENOZOICO = ['Paleógeno', 'Neógeno', 'Pleistoceno', 'Holoceno'];

const GRUPOS_PTEROSSAURO = [
    'Pterodactiloide',
    'Azhdarchidae',
    'Tapejaridae',
    'Anurognathidae',
    'Dimorphodontidae',
    'Outro',
];

const GRUPOS_REPTIL_MARINHO = [
    'Plesiossauro',
    'Ictiossauro',
    'Mosassauro',
    'Placodonte',
    'Nothossauro',
    'Outro',
];

const ORDENS_MAMIFERO = [
    'Proboscidea',
    'Felidae',
    'Perissodactyla',
    'Artiodactyla',
    'Primates',
    'Carnivora',
    'Outro',
];

const CATEGORIAS_OUTRO = ['Anfíbio', 'Peixe', 'Artrópode', 'Ave primitiva', 'Outro'];

const MODOS_VOO = ['Planador', 'Voo ativo', 'Ambos', 'Desconhecido'];
const HABITATS_MARINHO = ['Mar aberto', 'Costeiro', 'Estuário', 'Desconhecido'];
const PELAGEM = ['Sim', 'Não', 'Desconhecido'];

const CONFIG = {
    dinossauro: {
        id: 'dinossauro',
        nome: 'Dinossauro',
        periodos: PERIODOS_MESOZOICO,
        grupos: FAMILIAS,
        campoGrupo: 'familia',
        dietaObrigatoria: true,
    },
    pterossauro: {
        id: 'pterossauro',
        nome: 'Pterossauro',
        periodos: PERIODOS_MESOZOICO,
        grupos: GRUPOS_PTEROSSAURO,
        campoGrupo: 'grupo',
        dietaObrigatoria: true,
        atributos: ['envergura', 'modoVoo'],
    },
    reptil_marinho: {
        id: 'reptil_marinho',
        nome: 'Réptil marinho',
        periodos: PERIODOS_MESOZOICO,
        grupos: GRUPOS_REPTIL_MARINHO,
        campoGrupo: 'grupo',
        dietaObrigatoria: true,
        atributos: ['habitat'],
    },
    mamifero: {
        id: 'mamifero',
        nome: 'Mamífero',
        periodos: PERIODOS_CENOZOICO,
        grupos: ORDENS_MAMIFERO,
        campoGrupo: 'ordem',
        dietaObrigatoria: true,
        atributos: ['peso', 'pelagem'],
    },
    outro: {
        id: 'outro',
        nome: 'Outro animal',
        periodos: [...PERIODOS_MESOZOICO, ...PERIODOS_CENOZOICO, 'Outro'],
        grupos: CATEGORIAS_OUTRO,
        campoGrupo: 'categoria',
        dietaObrigatoria: false,
        atributos: ['tamanho'],
    },
};

function normalizarTipo(valor) {
    const chave = String(valor || 'dinossauro').trim().toLowerCase();
    if (TIPOS_IDS.includes(chave)) return chave;
    throw new Error(`Tipo inválido. Opções: ${TIPOS_IDS.join(', ')}`);
}

function configTipo(tipo) {
    return CONFIG[normalizarTipo(tipo)];
}

function validarGrupo(tipo, valor) {
    if (!valor) return null;
    const cfg = configTipo(tipo);
    if (!cfg.grupos.includes(valor)) {
        throw new Error(`Classificação inválida para ${cfg.nome}.`);
    }
    return valor;
}

function validarAtributos(tipo, atributos = {}) {
    const cfg = configTipo(tipo);
    const saida = {};
    if (!cfg.atributos) return saida;

    if (cfg.atributos.includes('envergura') && atributos.envergura != null && atributos.envergura !== '') {
        saida.envergura = Number(atributos.envergura);
    }
    if (cfg.atributos.includes('modoVoo') && atributos.modoVoo) {
        if (!MODOS_VOO.includes(atributos.modoVoo)) throw new Error('Modo de voo inválido.');
        saida.modoVoo = atributos.modoVoo;
    }
    if (cfg.atributos.includes('habitat') && atributos.habitat) {
        if (!HABITATS_MARINHO.includes(atributos.habitat)) throw new Error('Habitat inválido.');
        saida.habitat = atributos.habitat;
    }
    if (cfg.atributos.includes('peso') && atributos.peso != null && atributos.peso !== '') {
        saida.peso = Number(atributos.peso);
    }
    if (cfg.atributos.includes('pelagem') && atributos.pelagem) {
        if (!PELAGEM.includes(atributos.pelagem)) throw new Error('Pelagem inválida.');
        saida.pelagem = atributos.pelagem;
    }
    if (cfg.atributos.includes('tamanho') && atributos.tamanho) {
        saida.tamanho = String(atributos.tamanho).trim();
    }

    return saida;
}

function catalogoPublico() {
    return TIPOS_IDS.map((id) => ({
        id,
        nome: CONFIG[id].nome,
        periodos: CONFIG[id].periodos,
        grupos: CONFIG[id].grupos,
    }));
}

module.exports = {
    TIPOS_IDS,
    PERIODOS_CENOZOICO,
    MODOS_VOO,
    HABITATS_MARINHO,
    PELAGEM,
    CONFIG,
    normalizarTipo,
    configTipo,
    validarGrupo,
    validarAtributos,
    catalogoPublico,
};
