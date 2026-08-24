const pool = require('../db/pool');
const User = require('./User');

class Follow {
    static mapearPessoa(row) {
        return User.visivel({
            id: row.id,
            nome: row.nome,
            foto: row.foto || null
        });
    }

    static async seguir(seguidorId, seguidoId) {
        if (!seguidorId || !seguidoId) {
            throw new Error('Usuário inválido');
        }

        if (Number(seguidorId) === Number(seguidoId)) {
            throw new Error('Você não pode seguir a si mesmo');
        }

        const destino = await User.buscarPorId(seguidoId);
        if (!destino || !destino.confirmado) {
            throw new Error('Usuário não encontrado');
        }

        await pool.query(
            `INSERT INTO seguidores (seguidor_id, seguido_id)
             VALUES ($1, $2)
             ON CONFLICT (seguidor_id, seguido_id) DO NOTHING`,
            [seguidorId, seguidoId]
        );

        return true;
    }

    static async deixarDeSeguir(seguidorId, seguidoId) {
        await pool.query(
            `DELETE FROM seguidores
             WHERE seguidor_id = $1 AND seguido_id = $2`,
            [seguidorId, seguidoId]
        );

        return true;
    }

    static async estaSeguindo(seguidorId, seguidoId) {
        if (!seguidorId || !seguidoId) return false;

        const resultado = await pool.query(
            `SELECT 1 FROM seguidores
             WHERE seguidor_id = $1 AND seguido_id = $2`,
            [seguidorId, seguidoId]
        );

        return Boolean(resultado.rows[0]);
    }

    static async contar(usuarioId) {
        const [seguidores, seguindo] = await Promise.all([
            pool.query(
                'SELECT COUNT(*)::int AS total FROM seguidores WHERE seguido_id = $1',
                [usuarioId]
            ),
            pool.query(
                'SELECT COUNT(*)::int AS total FROM seguidores WHERE seguidor_id = $1',
                [usuarioId]
            )
        ]);

        return {
            seguidores: seguidores.rows[0].total,
            seguindo: seguindo.rows[0].total
        };
    }

    static async listarSeguidores(usuarioId) {
        const resultado = await pool.query(
            `SELECT u.id, u.nome, u.foto
             FROM seguidores s
             JOIN usuarios u ON u.id = s.seguidor_id
             WHERE s.seguido_id = $1 AND u.confirmado = TRUE
             ORDER BY s.created_at DESC`,
            [usuarioId]
        );

        return resultado.rows.map(Follow.mapearPessoa);
    }

    static async listarSeguindo(usuarioId) {
        const resultado = await pool.query(
            `SELECT u.id, u.nome, u.foto
             FROM seguidores s
             JOIN usuarios u ON u.id = s.seguido_id
             WHERE s.seguidor_id = $1 AND u.confirmado = TRUE
             ORDER BY s.created_at DESC`,
            [usuarioId]
        );

        return resultado.rows.map(Follow.mapearPessoa);
    }
}

module.exports = Follow;
