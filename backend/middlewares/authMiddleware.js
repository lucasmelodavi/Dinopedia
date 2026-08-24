const jwt = require('jsonwebtoken');
const config = require('../config');

function verificarToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const tokenLimpo = token.replace(/^Bearer\s+/i, '');

    jwt.verify(tokenLimpo, config.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ erro: 'Token invalido' });
        }

        req.usuarioId = decoded.id;
        next();
    });
}

function verificarTokenOpcional(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return next();
    }

    const tokenLimpo = token.replace(/^Bearer\s+/i, '');

    jwt.verify(tokenLimpo, config.jwtSecret, (err, decoded) => {
        if (!err && decoded?.id) {
            req.usuarioId = decoded.id;
        }
        next();
    });
}

module.exports = verificarToken;
module.exports.opcional = verificarTokenOpcional;
