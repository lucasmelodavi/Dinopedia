const pool = require('../db/pool');
const { CATEGORIAS_TOPICO, normalizarCategoria } = require('../config/constants');

const TEXTO_MINIMO = 20;

class Topico {
    static mapear(row) {
        if (!row) return null;

        return {
            id: row.id,
            dinossauroId: row.dinossauro_id,
            categoria: row.categoria,
            texto: row.texto,
            usuarioId: row.usuario_id,
            criadoEm: row.created_at,
            atualizadoEm: row.updated_at
        };
    }

    static validar({ categoria, texto }) {
        const categoriaNormalizada = normalizarCategoria(categoria);

        if (!CATEGORIAS_TOPICO.includes(categoriaNormalizada)) {
            throw new Error(`Categoria inválida. Opções: ${CATEGORIAS_TOPICO.join(', ')}`);
        }

        if (!texto || String(texto).trim().length < TEXTO_MINIMO) {
            throw new Error(`O texto do tópico precisa ter no mínimo ${TEXTO_MINIMO} caracteres`);
        }

        return {
            categoria: categoriaNormalizada,
            texto: String(texto).trim()
        };
    }

    static async criar({ dinossauroId, categoria, texto, usuarioId }) {
        const dados = Topico.validar({ categoria, texto });

        const resultado = await pool.query(
            `INSERT INTO topicos (dinossauro_id, categoria, texto, usuario_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [dinossauroId, dados.categoria, dados.texto, usuarioId]
        );

        return Topico.mapear(resultado.rows[0]);
    }

    static async listarPorDinossauro(dinossauroId) {
        const resultado = await pool.query(
            `SELECT * FROM topicos
             WHERE dinossauro_id = $1
             ORDER BY created_at ASC`,
            [dinossauroId]
        );

        return resultado.rows.map(Topico.mapear);
    }

    static async buscarPorId(id) {
        const resultado = await pool.query(
            'SELECT * FROM topicos WHERE id = $1',
            [id]
        );
        return Topico.mapear(resultado.rows[0]);
    }

    static async atualizar(id, { categoria, texto }) {
        const atual = await Topico.buscarPorId(id);
        if (!atual) {
            throw new Error('Tópico não encontrado');
        }

        const dados = Topico.validar({
            categoria: categoria !== undefined ? categoria : atual.categoria,
            texto: texto !== undefined ? texto : atual.texto
        });

        const resultado = await pool.query(
            `UPDATE topicos
             SET categoria = $1, texto = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [dados.categoria, dados.texto, id]
        );

        return {
            anterior: atual,
            atualizado: Topico.mapear(resultado.rows[0])
        };
    }

    static async deletar(id) {
        const atual = await Topico.buscarPorId(id);
        if (!atual) {
            throw new Error('Tópico não encontrado');
        }

        await pool.query('DELETE FROM topicos WHERE id = $1', [id]);
        return atual;
    }
}

module.exports = Topico;
