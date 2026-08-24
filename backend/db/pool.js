const { Pool } = require('pg');
const config = require('../config');

function precisaSsl(url) {
    const valor = String(url || '');
    return !/localhost|127\.0\.0\.1/i.test(valor);
}

const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: precisaSsl(config.databaseUrl)
        ? { rejectUnauthorized: false }
        : false
});

pool.on('error', (erro) => {
    console.error('Erro inesperado no PostgreSQL:', erro.message);
});

module.exports = pool;
