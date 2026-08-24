const bcrypt = require('bcryptjs');
const pool = require('./pool');
const User = require('../models/User');
const Dinosaur = require('../models/Dinosaur');
const Topico = require('../models/Topico');

const EXEMPLOS = [
    {
        nome: 'Eoraptor',
        nomeCientifico: 'Eoraptor lunensis',
        periodo: 'Triássico',
        dieta: 'Onívoro',
        descricao: 'Um dos dinossauros mais antigos conhecidos, do tamanho de um cão.',
        comprimento: 1,
        regiao: 'Argentina',
        anoDescoberta: 1991,
        familia: 'Theropoda',
        destaque: true,
        topico: {
            categoria: 'Fósseis',
            texto: 'Os fósseis do Eoraptor foram encontrados no Vale da Lua, na Argentina, em rochas do Triássico Superior.'
        }
    },
    {
        nome: 'Estegossauro',
        nomeCientifico: 'Stegosaurus stenops',
        periodo: 'Jurássico',
        dieta: 'Herbívoro',
        descricao: 'Herbívoro com placas ósseas no dorso e espinhos na cauda.',
        comprimento: 9,
        regiao: 'América do Norte',
        anoDescoberta: 1877,
        familia: 'Stegosauria',
        destaque: true,
        topico: {
            categoria: 'Aparência física',
            texto: 'As placas do dorso provavelmente serviam para regulação de temperatura ou para display, não só para defesa.'
        }
    },
    {
        nome: 'Tiranossauro rex',
        nomeCientifico: 'Tyrannosaurus rex',
        periodo: 'Cretáceo',
        dieta: 'Carnívoro',
        descricao: 'Terópode carnívoro do final do Cretáceo, um dos maiores predadores terrestres.',
        comprimento: 12.3,
        regiao: 'América do Norte',
        anoDescoberta: 1905,
        familia: 'Theropoda',
        destaque: true,
        topico: {
            categoria: 'Alimentação',
            texto: 'Dentes em forma de banana e mordida extremamente forte indicam que caçava e também aproveitava carcaças.'
        }
    }
];

async function seed() {
    let demo = await User.buscarPorEmail('demo@dinopedia.local');

    if (!demo) {
        const senha = await bcrypt.hash('demo123', 10);
        demo = await User.criar({
            nome: 'Demo',
            email: 'demo@dinopedia.local',
            senha,
            confirmado: true
        });
        console.log('Usuário demo criado: demo@dinopedia.local / demo123');
    }

    for (const exemplo of EXEMPLOS) {
        const existe = await pool.query(
            'SELECT id FROM dinossauros WHERE nome = $1',
            [exemplo.nome]
        );

        if (existe.rows[0]) {
            continue;
        }

        const { topico, ...ficha } = exemplo;
        const dino = await Dinosaur.criar({
            ...ficha,
            usuarioId: demo.id
        });

        await Topico.criar({
            dinossauroId: dino.id,
            categoria: topico.categoria,
            texto: topico.texto,
            usuarioId: demo.id
        });
    }

    await pool.query(
        `UPDATE dinossauros SET destaque = TRUE WHERE nome = ANY($1::text[])`,
        [EXEMPLOS.map((exemplo) => exemplo.nome)]
    );
}

module.exports = { seed };
