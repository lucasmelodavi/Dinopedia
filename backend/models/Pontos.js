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

    static temFoto(foto) {
        return Boolean(String(foto || '').trim());
    }

    static temDescricao(texto) {
        return Boolean(String(texto || '').trim());
    }

    static async completarPerfil(usuario) {
        if (!usuario || !usuario.id) return;

        try {
            if (Pontos.temFoto(usuario.foto)) {
                await Pontos.ganhar(usuario.id, 'foto_perfil', 'perfil');
            }
            if (Pontos.temDescricao(usuario.descricao)) {
                await Pontos.ganhar(usuario.id, 'descricao_perfil', 'perfil');
            }
        } catch (erro) {
            console.error('Falha ao pontuar perfil completo', usuario.id, erro.message);
        }
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

    static async garantirEstrutura() {
        await pool.query(
            'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pontos INTEGER NOT NULL DEFAULT 0'
        );
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pontos_eventos (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                tipo VARCHAR(40) NOT NULL,
                pontos INTEGER NOT NULL,
                referencia VARCHAR(120) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_pontos_eventos_unico
            ON pontos_eventos (usuario_id, tipo, referencia)
        `);
    }

    static async tentar(sql, valores = []) {
        try {
            await pool.query(sql, valores);
        } catch (erro) {
            console.error('Sincronização de pontos:', erro.message);
        }
    }

    static async recalcularTodos() {
        await pool.query(`
            UPDATE usuarios
            SET pontos = COALESCE((
                SELECT SUM(pontos_eventos.pontos)::int
                FROM pontos_eventos
                WHERE pontos_eventos.usuario_id = usuarios.id
            ), 0)
        `);
    }

    static async sincronizar() {
        try {
            await Pontos.garantirEstrutura();
            await Pontos.aplicarSincronizacaoGeral();
            await Pontos.recalcularTodos();
        } catch (erro) {
            console.error('Falha ao sincronizar pontos:', erro.message);
        }
    }

    static async aplicarSincronizacaoGeral() {
        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT u.id, 'confirmar', $1, 'conta'
             FROM usuarios u
             WHERE u.confirmado = TRUE
               AND NOT EXISTS (
                   SELECT 1 FROM pontos_eventos p
                   WHERE p.usuario_id = u.id AND p.tipo = 'confirmar' AND p.referencia = 'conta'
               )`,
            [REGRAS.confirmar.pontos]
        );

        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT d.criado_por, 'cadastro_dino', $1, d.id::text
             FROM dinossauros d
             WHERE d.criado_por IS NOT NULL
               AND NOT EXISTS (
                   SELECT 1 FROM pontos_eventos p
                   WHERE p.usuario_id = d.criado_por
                     AND p.tipo = 'cadastro_dino'
                     AND p.referencia = d.id::text
               )`,
            [REGRAS.cadastro_dino.pontos]
        );

        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT e.usuario_id, 'cadastro_dino', $1, d.id::text
             FROM dinossauros d
             JOIN LATERAL (
                 SELECT usuario_id
                 FROM edicoes
                 WHERE dinossauro_id = d.id
                 ORDER BY created_at ASC
                 LIMIT 1
             ) e ON TRUE
             WHERE d.criado_por IS NULL
               AND NOT EXISTS (
                   SELECT 1 FROM pontos_eventos p
                   WHERE p.tipo = 'cadastro_dino' AND p.referencia = d.id::text
               )`,
            [REGRAS.cadastro_dino.pontos]
        );

        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT t.usuario_id, 'topico', $1, t.id::text
             FROM topicos t
             WHERE t.usuario_id IS NOT NULL
               AND NOT EXISTS (
                   SELECT 1 FROM pontos_eventos p
                   WHERE p.usuario_id = t.usuario_id
                     AND p.tipo = 'topico'
                     AND p.referencia = t.id::text
               )`,
            [REGRAS.topico.pontos]
        );

        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT DISTINCT e.usuario_id, 'foto_dino', $1, e.dinossauro_id::text
             FROM edicoes e
             WHERE e.campo = 'foto' AND e.valor_novo IS NOT NULL
               AND NOT EXISTS (
                   SELECT 1 FROM pontos_eventos p
                   WHERE p.usuario_id = e.usuario_id
                     AND p.tipo = 'foto_dino'
                     AND p.referencia = e.dinossauro_id::text
               )`,
            [REGRAS.foto_dino.pontos]
        );

        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT u.id, 'foto_perfil', $1, 'perfil'
             FROM usuarios u
             WHERE u.foto IS NOT NULL AND TRIM(u.foto) <> ''
               AND NOT EXISTS (
                   SELECT 1 FROM pontos_eventos p
                   WHERE p.usuario_id = u.id AND p.tipo = 'foto_perfil' AND p.referencia = 'perfil'
               )`,
            [REGRAS.foto_perfil.pontos]
        );

        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT u.id, 'descricao_perfil', $1, 'perfil'
             FROM usuarios u
             WHERE u.descricao IS NOT NULL AND TRIM(u.descricao) <> ''
               AND NOT EXISTS (
                   SELECT 1 FROM pontos_eventos p
                   WHERE p.usuario_id = u.id AND p.tipo = 'descricao_perfil' AND p.referencia = 'perfil'
               )`,
            [REGRAS.descricao_perfil.pontos]
        );

        await Pontos.tentar(
            `INSERT INTO pontos_eventos (usuario_id, tipo, pontos, referencia)
             SELECT x.usuario_id, 'edicao_ficha', $1, x.referencia
             FROM (
                 SELECT e.usuario_id,
                        e.dinossauro_id::text || ':' || to_char((e.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS referencia
                 FROM edicoes e
                 WHERE e.campo NOT IN ('foto', 'topico')
                 GROUP BY e.usuario_id, e.dinossauro_id, to_char((e.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD')
             ) x
             WHERE NOT EXISTS (
                 SELECT 1 FROM pontos_eventos p
                 WHERE p.usuario_id = x.usuario_id
                   AND p.tipo = 'edicao_ficha'
                   AND p.referencia = x.referencia
             )`,
            [REGRAS.edicao_ficha.pontos]
        );
    }

    static async sincronizarUsuario(usuarioId) {
        await Pontos.sincronizar();

        const id = parseInt(usuarioId, 10);
        if (!id) return;

        try {
            const User = require('./User');
            const usuario = await User.buscarPorId(id);
            await Pontos.completarPerfil(usuario);
            await Pontos.recalcularTodos();
        } catch (erro) {
            console.error('Falha ao sincronizar pontos do usuário', id, erro.message);
        }
    }
}

module.exports = Pontos;
