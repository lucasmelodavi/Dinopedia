const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const config = require('./config/index');
const routes = require('./routes');
const { initDb } = require('./db/init');

app.use(cors(config.cors));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', routes);

app.use((erro, req, res, next) => {
    if (res.headersSent) {
        return next(erro);
    }

    res.status(400).json({ erro: erro.message || 'Erro interno' });
});

const PORT = config.port;

initDb()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(config.publicUrl || `http://localhost:${PORT}`);
        });
    })
    .catch((erro) => {
        console.error(erro.message);
        process.exit(1);
    });
