const pool = require('../db/pool');
const { CATALOGO, catalogoPublico } = require('../config/conquistas');

class Conquista {
    static catalogoPublico = catalogoPublico;

    static async stats(usuarioId) {
        const id = parseInt(usuarioId, 10);
        if (!id) {
            return {
                confirmado: false,
                pontos: 0,
                dinos: 0,
                edicoes: 0,
                topicos: 0,
                fotosDino: 0,
                fotoPerfil: false,
                descricaoPerfil: false,
                seguindo: 0
            };
        }

        const [usuario, dinos, edicoes, topicos, fotos, follows] = await Promise.all([
            pool.query(
                `SELECT confirmado, pontos, foto, descricao
                 FROM usuarios
                 WHERE id = $1`,
                [id]
            ),
            pool.query(
                'SELECT COUNT(*)::int AS total FROM dinossauros WHERE criado_por = $1',
                [id]
            ),
            pool.query(
                'SELECT COUNT(*)::int AS total FROM edicoes WHERE usuario_id = $1',
                [id]
            ),
            pool.query(
                'SELECT COUNT(*)::int AS total FROM topicos WHERE usuario_id = $1',
                [id]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS total FROM (
                    SELECT referencia
                    FROM pontos_eventos
                    WHERE usuario_id = $1 AND tipo = 'foto_dino'
                    UNION
                    SELECT e.dinossauro_id::text
                    FROM edicoes e
                    WHERE e.usuario_id = $1
                      AND e.campo = 'foto'
                      AND e.valor_novo IS NOT NULL
                 ) fotos`,
                [id]
            ),
            pool.query(
                'SELECT COUNT(*)::int AS total FROM seguidores WHERE seguidor_id = $1',
                [id]
            )
        ]);

        const row = usuario.rows[0] || {};
        return {
            confirmado: Boolean(row.confirmado),
            pontos: Number(row.pontos) || 0,
            dinos: dinos.rows[0].total,
            edicoes: edicoes.rows[0].total,
            topicos: topicos.rows[0].total,
            fotosDino: fotos.rows[0].total,
            fotoPerfil: Boolean(String(row.foto || '').trim()),
            descricaoPerfil: Boolean(String(row.descricao || '').trim()),
            seguindo: follows.rows[0].total
        };
    }

    static montar(stats) {
        const itens = CATALOGO.map((conquista) => {
            const bruto = Number(conquista.progresso(stats)) || 0;
            const atual = Math.max(0, Math.min(conquista.meta, bruto));
            return {
                id: conquista.id,
                nome: conquista.nome,
                descricao: conquista.descricao,
                simbolo: conquista.simbolo,
                meta: conquista.meta,
                atual,
                desbloqueada: bruto >= conquista.meta
            };
        });

        return {
            desbloqueadas: itens.filter((item) => item.desbloqueada).length,
            total: itens.length,
            itens
        };
    }

    static async paraUsuario(usuarioId) {
        const stats = await Conquista.stats(usuarioId);
        return Conquista.montar(stats);
    }
}

module.exports = Conquista;
