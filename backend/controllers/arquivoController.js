const fs = require('fs');
const path = require('path');
const Imagem = require('../models/Imagem');

const pastaUploads = path.join(__dirname, '..', 'uploads');

function nomeSeguro(arquivo) {
    const nome = path.basename(String(arquivo || ''));
    if (!/^[A-Za-z0-9._-]+$/.test(nome)) {
        return null;
    }
    return nome;
}

const servir = async (req, res) => {
    const nome = nomeSeguro(req.params.arquivo);
    if (!nome) {
        return res.status(400).json({ erro: 'Arquivo inválido' });
    }

    const noDisco = path.join(pastaUploads, nome);
    if (fs.existsSync(noDisco)) {
        return res.sendFile(noDisco);
    }

    try {
        const imagem = await Imagem.buscarPorCaminho(`/uploads/${nome}`);
        if (!imagem) {
            return res.status(404).json({ erro: 'Imagem não encontrada' });
        }

        res.set('Content-Type', imagem.mime || 'application/octet-stream');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.end(Buffer.from(imagem.dados));
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao abrir a imagem' });
    }
};

module.exports = { servir };
