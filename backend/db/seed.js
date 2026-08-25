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

async function ligarGmailNaContaDenisselo() {
    const emailNovo = User.normalizarEmail('dm2538513@gmail.com');
    const senhaHash = await bcrypt.hash('Am0ng_us', 10);

    const alvo = await pool.query(
        `SELECT id, nome, email
         FROM usuarios
         WHERE id = 7
            OR LOWER(REPLACE(TRIM(nome), ' ', '')) LIKE '%denisselo%'
         ORDER BY CASE WHEN id = 7 THEN 0 ELSE 1 END,
                  pontos DESC NULLS LAST,
                  id ASC
         LIMIT 1`
    );

    const denisselo = alvo.rows[0];
    if (!denisselo) {
        console.log('Conta Denisselo não encontrada para ligar o Gmail');
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `UPDATE usuarios
             SET email = 'liberado-' || id || '@dinopedia.invalid'
             WHERE LOWER(TRIM(email)) = $1
               AND id <> $2`,
            [emailNovo, denisselo.id]
        );
        const resultado = await client.query(
            `UPDATE usuarios
             SET email = $1,
                 senha = $2,
                 confirmado = TRUE,
                 codigo_confirmacao = NULL,
                 codigo_expira = NULL
             WHERE id = $3
             RETURNING id, nome, email`,
            [emailNovo, senhaHash, denisselo.id]
        );
        await client.query('COMMIT');
        const row = resultado.rows[0];
        console.log(`Gmail e senha ligados à conta ${row.nome} (id ${row.id})`);
    } catch (erro) {
        await client.query('ROLLBACK');
        console.error('Falha ao ligar Gmail no Denisselo:', erro.message);
        throw erro;
    } finally {
        client.release();
    }
}

async function seed() {
    try {
        await ligarGmailNaContaDenisselo();
    } catch (erro) {
        console.error('Não liguei o Gmail no Denisselo:', erro.message);
    }

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
