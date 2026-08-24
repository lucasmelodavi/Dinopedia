const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const {
    PERIODOS,
    DIETAS,
    CATEGORIAS_TOPICO,
    FAMILIAS
} = require('../config/constants');

const authRoutes = require('./authRoutes');
const dinoRoutes = require('./dinoRoutes');
const userRoutes = require('./userRoutes');
const dinoController = require('../controllers/dinoController');
const config = require('../config');

router.get('/', (req, res) => {
    res.json({
        message: 'Backend do DinoPédia',
        baseUrl: config.publicUrl,
        telas: {
            inicio: 'GET /linha-do-tempo e GET /dinossauros/destaques',
            detalhe: 'GET /dinossauros/:id',
            cadastroDino: 'POST /dinossauros (Bearer)',
            login: 'POST /auth/register, /auth/confirmar, /auth/login',
            perfil: 'GET /auth/perfil (Bearer)',
            amigos: 'GET /usuarios e POST /usuarios/:id/seguir'
        },
        rotas: {
            health: 'GET /health',
            opcoes: 'GET /opcoes',
            linhaDoTempo: 'GET /linha-do-tempo',
            auth: [
                'POST /auth/register',
                'POST /auth/login',
                'POST /auth/confirmar',
                'POST /auth/reenviar-codigo',
                'GET /auth/perfil',
                'PUT /auth/perfil',
                'POST /auth/perfil/foto'
            ],
            usuarios: [
                'GET /usuarios',
                'GET /usuarios/:id',
                'GET /usuarios/:id/seguidores',
                'GET /usuarios/:id/seguindo',
                'POST /usuarios/:id/seguir',
                'DELETE /usuarios/:id/seguir'
            ],
            dinossauros: [
                'GET /dinossauros',
                'GET /dinossauros/destaques',
                'GET /dinossauros/:id',
                'POST /dinossauros',
                'PUT /dinossauros/:id',
                'DELETE /dinossauros/:id',
                'POST /dinossauros/:id/foto',
                'GET /dinossauros/:id/topicos',
                'POST /dinossauros/:id/topicos',
                'PUT /dinossauros/:id/topicos/:topicoId',
                'DELETE /dinossauros/:id/topicos/:topicoId'
            ]
        }
    });
});

router.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, banco: 'conectado' });
    } catch (erro) {
        res.status(503).json({ ok: false, banco: 'indisponivel' });
    }
});

router.get('/opcoes', (req, res) => {
    res.json({
        periodos: PERIODOS,
        dietas: DIETAS,
        categoriasTopico: CATEGORIAS_TOPICO,
        familias: FAMILIAS
    });
});

router.get('/linha-do-tempo', dinoController.linhaDoTempo);

router.use('/dinossauros', dinoRoutes);
router.use('/usuarios', userRoutes);
router.use('/auth', authRoutes);

module.exports = router;
