const pool = require('../db/pool');

class Edicao {
    static mapear(row) {
        if (!row) return null;

        return {
            id: row.id,
            dinossauroId: row.dinossauro_id,
            dinossauroNome: row.dinossauro_nome,
            usuarioId: row.usuario_id,
            usuarioNome: row.usuario_nome,
            campo: row.campo,
            valorAntigo: row.valor_antigo,
            valorNovo: row.valor_novo,
            data: row.created_at
        };
    }

    static async registrar({ dinossauroId, usuarioId, campo, valorAntigo, valorNovo }) {
        const antigo = valorAntigo === undefined || valorAntigo === null ? null : String(valorAntigo);
        const novo = valorNovo === undefined || valorNovo === null ? null : String(valorNovo);

        if (antigo === novo) {
            return null;
        }

        const resultado = await pool.query(
            `INSERT INTO edicoes (dinossauro_id, usuario_id, campo, valor_antigo, valor_novo)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [dinossauroId, usuarioId, campo, antigo, novo]
        );

        return Edicao.mapear(resultado.rows[0]);
    }

    static async registrarVarios(dinossauroId, usuarioId, anterior, atualizado, campos) {
        for (const campo of campos) {
            await Edicao.registrar({
                dinossauroId,
                usuarioId,
                campo,
                valorAntigo: anterior[campo],
                valorNovo: atualizado[campo]
            });
        }
    }

    static async ultimaDoDinossauro(dinossauroId) {
        const resultado = await pool.query(
            `SELECT e.*, u.nome AS usuario_nome
             FROM edicoes e
             JOIN usuarios u ON u.id = e.usuario_id
             WHERE e.dinossauro_id = $1
             ORDER BY e.created_at DESC
             LIMIT 1`,
            [dinossauroId]
        );

        const row = resultado.rows[0];
        if (!row) return null;

        return {
            usuario: row.usuario_nome,
            campo: row.campo,
            data: row.created_at
        };
    }

    static async listarPorUsuario(usuarioId) {
        const resultado = await pool.query(
            `SELECT e.*, d.nome AS dinossauro_nome, u.nome AS usuario_nome
             FROM edicoes e
             JOIN dinossauros d ON d.id = e.dinossauro_id
             JOIN usuarios u ON u.id = e.usuario_id
             WHERE e.usuario_id = $1
             ORDER BY e.created_at DESC`,
            [usuarioId]
        );

        return resultado.rows.map(Edicao.mapear);
    }
}

module.exports = Edicao;
