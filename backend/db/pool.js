const { Pool } = require('pg');
const config = require('../config');

function precisaSsl(url) {
    const valor = String(url || '');
    if (!valor || /localhost|127\.0\.0\.1/i.test(valor)) {
        return false;
    }
    if (/sslmode=disable/i.test(valor)) {
        return false;
    }
    if (/sslmode=require/i.test(valor) || /neon\.tech/i.test(valor)) {
        return true;
    }

    try {
        const host = new URL(valor.replace(/^postgres(ql)?:/i, 'http:')).hostname;
        if (host.includes('render.com')) {
            return true;
        }
        if (!host.includes('.')) {
            return false;
        }
    } catch {
        return false;
    }

    return true;
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
