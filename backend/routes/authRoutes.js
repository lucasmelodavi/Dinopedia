const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/confirmar', authController.confirmarEmail);
router.post('/reenviar-codigo', authController.reenviarCodigo);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, authController.atualizarPerfil);
router.post('/perfil/foto', verificarToken, (req, res, next) => {
    upload.single('foto')(req, res, (erro) => {
        if (erro) {
            return res.status(400).json({ erro: erro.message });
        }
        next();
    });
}, authController.uploadFotoPerfil);

module.exports = router;
