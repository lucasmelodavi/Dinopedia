const pool = require('../db/pool');
const { REGRAS, resumir } = require('../config/pontos');

class Pontos {
    static resumir = resumir;

    static mapear(row) {
        if (!row) return null;
        const regra = REGRAS[row.tipo] || { label: row.tipo, pontos: row.pontos };

        return {
            id: row.id,
            tipo: row.tipo,
            pontos: row.pontos,
            referencia: row.referencia,
            descricao: regra.label,
            data: row.created_at
        };
    }

    static async ganhar(usuarioId, tipo, referencia) {
        const regra = REGRAS[tipo];
        if (!regra || !usuarioId || referencia === undefined || referencia === null) {
            return null;
        }

        try {
            await pool.query(
                `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
                 VALUES ($1, $2, $3, $4)`,
                [usuarioId, tipo, regra.pontos, String(referencia)]
            );
        } catch (erro) {
            if (erro.code === '23505') {
                return null;
            }
            throw erro;
        }

        await pool.query(
            'UPDATE usuarios SET pontos = pontos + $1 WHERE id = $2',
            [regra.pontos, usuarioId]
        );

        return regra.pontos;
    }

    static async listarPorUsuario(usuarioId, limit = 12) {
        const teto = Math.min(parseInt(limit, 10) || 12, 40);
        const resultado = await pool.query(
            `SELECT id, tipo, pontos, referencia, created_at
             FROM pontos_eventos
             WHERE usuario_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [usuarioId, teto]
        );

        return resultado.rows.map(Pontos.mapear);
    }

    static async ranking(limit = 20) {
        const teto = Math.min(parseInt(limit, 10) || 20, 50);
        const resultado = await pool.query(
            `SELECT id, nome, foto, email, pontos
             FROM usuarios
             WHERE confirmado = TRUE
             ORDER BY pontos DESC, nome ASC
             LIMIT $1`,
            [teto]
        );

        return resultado.rows.map((row, indice) => {
            const User = require('./User');
            return {
                posicao: indice + 1,
                ...User.visivel(User.mapear(row))
            };
        });
    }

    static async sincronizar() {
        try {
            await Pontos.aplicarSincronizacaoGeral();
        } catch (erro) {
            console.error('Falha ao sincronizar pontos:', erro.message);
        }
    }

    static async aplicarSincronizacaoGeral() {
        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT id, 'confirmar', $1, 'conta'
             FROM usuarios
             WHERE confirmado = TRUE
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.confirmar.pontos]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT criado_por, 'cadastro_dino', $1, id::text
             FROM dinossauros
             WHERE criado_por IS NOT NULL
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.cadastro_dino.pontos]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT usuario_id, 'topico', $1, id::text
             FROM topicos
             WHERE usuario_id IS NOT NULL
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.topico.pontos]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT DISTINCT e.usuario_id, 'foto_dino', $1, e.dinossauro_id::text
             FROM edicoes e
             WHERE e.campo = 'foto' AND e.valor_novo IS NOT NULL
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.foto_dino.pontos]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT id, 'foto_perfil', $1, 'perfil'
             FROM usuarios
             WHERE foto LIKE '/uploads/%'
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.foto_perfil.pontos]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT e.usuario_id,
                    'edicao_ficha',
                    $1,
                    e.dinossauro_id::text || ':' || to_char((e.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')
             FROM edicoes e
             WHERE e.campo NOT IN ('foto', 'topico')
             GROUP BY e.usuario_id, e.dinossauro_id, to_char((e.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.edicao_ficha.pontos]
        );

        await pool.query(
            `UPDATE usuarios
             SET pontos = COALESCE((
                 SELECT SUM(pontos_eventos.pontos)::int
                 FROM pontos_eventos
                 WHERE pontos_eventos.usuario_id = usuarios.id
             ), 0)`
        );
    }

    static async sincronizarUsuario(usuarioId) {
        const id = parseInt(usuarioId, 10);
        if (!id) return;

        try {
            await Pontos.aplicarSincronizacaoUsuario(id);
        } catch (erro) {
            console.error('Falha ao sincronizar pontos do usuário', id, erro.message);
        }
    }

    static async aplicarSincronizacaoUsuario(id) {

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT id, 'confirmar', $1, 'conta'
             FROM usuarios
             WHERE confirmado = TRUE AND id = $2
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.confirmar.pontos, id]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT criado_por, 'cadastro_dino', $1, dinossauros.id::text
             FROM dinossauros
             WHERE criado_por = $2
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.cadastro_dino.pontos, id]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT usuario_id, 'topico', $1, topicos.id::text
             FROM topicos
             WHERE usuario_id = $2
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.topico.pontos, id]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT DISTINCT e.usuario_id, 'foto_dino', $1, e.dinossauro_id::text
             FROM edicoes e
             WHERE e.usuario_id = $2 AND e.campo = 'foto' AND e.valor_novo IS NOT NULL
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.foto_dino.pontos, id]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT id, 'foto_perfil', $1, 'perfil'
             FROM usuarios
             WHERE id = $2 AND foto LIKE '/uploads/%'
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.foto_perfil.pontos, id]
        );

        await pool.query(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT e.usuario_id,
                    'edicao_ficha',
                    $1,
                    e.dinossauro_id::text || ':' || to_char((e.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')
             FROM edicoes e
             WHERE e.usuario_id = $2 AND e.campo NOT IN ('foto', 'topico')
             GROUP BY e.usuario_id, e.dinossauro_id, to_char((e.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')
             ON CONFLICT (usuario_id, tipo, referencia) DO NOTHING`,
            [REGRAS.edicao_ficha.pontos, id]
        );

        await pool.query(
            `UPDATE usuarios
             SET pontos = COALESCE((
                 SELECT SUM(pontos_eventos.pontos)::int
                 FROM pontos_eventos
                 WHERE pontos_eventos.usuario_id = $1
             ), 0)
             WHERE id = $1`,
            [id]
        );
    }
}

module.exports = Pontos;
