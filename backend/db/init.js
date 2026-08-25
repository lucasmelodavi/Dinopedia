const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const { PERIODOS } = require('../config/constants');
const { seed } = require('./seed');

function splitStatements(sql) {
    return sql
        .split(';')
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);
}

async function waitForDb() {
    let ultimoErro;

    for (let tentativa = 1; tentativa <= 40; tentativa++) {
        try {
            await pool.query('SELECT 1');
            return;
        } catch (erro) {
            ultimoErro = erro;
            console.log(`Aguardando PostgreSQL (${tentativa}/40): ${erro.message}`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }

    throw new Error(
        `PostgreSQL indisponível. ${ultimoErro && ultimoErro.message}`
    );
}

async function initDb() {
    await waitForDb();

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const statements = splitStatements(sql);

    for (const statement of statements) {
        await pool.query(statement);
    }

    for (const nome of PERIODOS) {
        await pool.query(
            'INSERT INTO periodos (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING',
            [nome]
        );
    }

    console.log('Banco pronto (periodos, dinossauros, topicos, usuarios, edicoes, imagens, pontos)');
    await seed();
    const Pontos = require('../models/Pontos');
    await Pontos.sincronizar();
    console.log('Pontos sincronizados');
}

module.exports = { initDb };
