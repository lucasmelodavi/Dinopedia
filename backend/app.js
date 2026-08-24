const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const config = require('./config/index');
const routes = require('./routes');
const { initDb } = require('./db/init');

const pastaSite = path.join(__dirname, '..', 'dist');
const sitePronto = fs.existsSync(path.join(pastaSite, 'index.html'));

function ehRotaDaApi(caminho) {
    return (
        caminho === '/health' ||
        caminho === '/opcoes' ||
        caminho === '/linha-do-tempo' ||
        caminho.startsWith('/auth') ||
        caminho.startsWith('/dinossauros') ||
        caminho.startsWith('/usuarios') ||
        caminho.startsWith('/uploads')
    );
}

app.use(cors(config.cors));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', routes);

if (sitePronto) {
    app.use(express.static(pastaSite));
    app.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }
        if (ehRotaDaApi(req.path)) {
            return next();
        }
        res.sendFile(path.join(pastaSite, 'index.html'));
    });
}

app.use((erro, req, res, next) => {
    if (res.headersSent) {
        return next(erro);
    }

    res.status(400).json({ erro: erro.message || 'Erro interno' });
});

const PORT = config.port;

console.log('Iniciando DinoPédia na porta', PORT);
console.log('Banco:', process.env.DATABASE_URL ? 'configurado' : 'usando local');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(config.publicUrl || `http://localhost:${PORT}`);
    if (sitePronto) {
        console.log('Site da DinoPédia sendo servido pela API');
    }

    initDb()
        .then(() => {
            console.log('Banco pronto');
        })
        .catch((erro) => {
            console.error('Falha ao iniciar o banco:', erro);
        });
});
