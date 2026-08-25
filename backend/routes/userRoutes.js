const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', userController.listarUsuarios);
router.get('/ranking', userController.ranking);
router.get('/:id/seguidores', userController.listarSeguidores);
router.get('/:id/seguindo', userController.listarSeguindo);
router.get('/:id', verificarToken.opcional, userController.buscarUsuario);
router.post('/:id/seguir', verificarToken, userController.seguir);
router.delete('/:id/seguir', verificarToken, userController.deixarDeSeguir);
router.delete('/:id', verificarToken, userController.excluirUsuario);

module.exports = router;
