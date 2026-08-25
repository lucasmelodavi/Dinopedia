const fs = require('fs');
const pool = require('../db/pool');

class Imagem {
    static async salvar({ caminho, mime, dados }) {
        await pool.query(
            `INSERT INTO imagens (caminho, mime, dados)
             VALUES ($1, $2, $3)
             ON CONFLICT (caminho) DO UPDATE SET
                mime = EXCLUDED.mime,
                dados = EXCLUDED.dados`,
            [caminho, mime, dados]
        );
    }

    static async buscarPorCaminho(caminho) {
        const resultado = await pool.query(
            'SELECT caminho, mime, dados FROM imagens WHERE caminho = $1',
            [caminho]
        );

        return resultado.rows[0] || null;
    }

    static async persistirMulter(file) {
        if (!file || !file.filename) {
            throw new Error('Nenhum arquivo enviado');
        }

        const caminho = `/uploads/${file.filename}`;
        const dados = file.buffer || fs.readFileSync(file.path);

        await Imagem.salvar({
            caminho,
            mime: file.mimetype || 'application/octet-stream',
            dados
        });

        return caminho;
    }
}

module.exports = Imagem;
