const express = require('express');
const router = express.Router();
const dinoController = require('../controllers/dinoController');
const verificarToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', dinoController.listarDinossauros);
router.get('/destaques', dinoController.listarDestaques);
router.get('/mapa', dinoController.listarMapa);
router.get('/:id/topicos', dinoController.listarTopicos);
router.get('/:id', dinoController.buscarDinossauro);

router.post('/', verificarToken, dinoController.criarDinossauro);
router.post('/:id/foto', verificarToken, (req, res, next) => {
    upload.single('foto')(req, res, (erro) => {
        if (erro) {
            return res.status(400).json({ erro: erro.message });
        }
        next();
    });
}, dinoController.uploadFoto);
router.post('/:id/topicos', verificarToken, dinoController.criarTopico);

router.put('/:id/topicos/:topicoId', verificarToken, dinoController.atualizarTopico);
router.put('/:id', verificarToken, dinoController.atualizarDinossauro);

router.delete('/:id/topicos/:topicoId', verificarToken, dinoController.deletarTopico);
router.delete('/:id', verificarToken, dinoController.deletarDinossauro);

module.exports = router;
