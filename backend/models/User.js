const pool = require('../db/pool');
const config = require('../config');
const { resumir } = require('../config/pontos');

const AVATARES_VALIDOS = [
    'trex-oculos',
    'triceratops-oculos'
];

class User {
    static AVATARES_VALIDOS = AVATARES_VALIDOS;
    static DESCRICAO_MAX = 400;

    static ehCriador(email) {
        return String(email || '').trim().toLowerCase() === config.emailCriador;
    }

    static mapear(row) {
        if (!row) return null;

        return {
            id: row.id,
            nome: row.nome,
            email: row.email,
            senha: row.senha,
            confirmado: row.confirmado,
            codigoConfirmacao: row.codigo_confirmacao,
            codigoExpira: row.codigo_expira,
            foto: row.foto || null,
            descricao: row.descricao || '',
            pontos: Number(row.pontos) || 0
        };
    }

    static publico(usuario) {
        if (!usuario) return null;

        const foto = usuario.foto || null;
        const fotoUrl = foto && foto.startsWith('/uploads/')
            ? `${config.publicUrl}${foto}`
            : null;

        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            foto,
            fotoUrl,
            descricao: usuario.descricao || '',
            criador: User.ehCriador(usuario.email),
            pontos: Number(usuario.pontos) || 0,
            nivel: resumir(usuario.pontos)
        };
    }

    static visivel(usuario) {
        if (!usuario) return null;
        const publico = User.publico(usuario);
        return {
            id: publico.id,
            nome: publico.nome,
            foto: publico.foto,
            fotoUrl: publico.fotoUrl,
            descricao: publico.descricao,
            criador: publico.criador,
            pontos: publico.pontos,
            nivel: publico.nivel
        };
    }

    static async listarPublico({ nome = '', limit = 30 } = {}) {
        const valores = [];
        const condicoes = ['confirmado = TRUE'];

        if (nome) {
            valores.push(`%${nome}%`);
            condicoes.push(`nome ILIKE $${valores.length}`);
        }

        const teto = Math.min(parseInt(limit, 10) || 30, 50);
        valores.push(teto);

        const resultado = await pool.query(
            `SELECT id, nome, foto, email, pontos
             FROM usuarios
             WHERE ${condicoes.join(' AND ')}
             ORDER BY nome ASC
             LIMIT $${valores.length}`,
            valores
        );

        return resultado.rows.map((row) => User.visivel(User.mapear(row)));
    }

    static async criar({
        nome,
        email,
        senha,
        confirmado = false,
        codigoConfirmacao = null,
        codigoExpira = null
    }) {
        if (!nome || !email || !senha) {
            throw new Error('Nome, email e senha são obrigatórios');
        }

        try {
            const resultado = await pool.query(
                `INSERT INTO usuarios (nome, email, senha, confirmado, codigo_confirmacao, codigo_expira)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [nome, email, senha, confirmado, codigoConfirmacao, codigoExpira]
            );

            return User.mapear(resultado.rows[0]);
        } catch (erro) {
            if (erro.code === '23505') {
                throw new Error('Email já cadastrado');
            }
            throw erro;
        }
    }

    static async buscarPorEmail(email) {
        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        return User.mapear(resultado.rows[0]);
    }

    static async buscarPorId(id) {
        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1',
            [id]
        );
        return User.mapear(resultado.rows[0]);
    }

    static async confirmarEmail(email) {
        const resultado = await pool.query(
            `UPDATE usuarios
             SET confirmado = TRUE, codigo_confirmacao = NULL, codigo_expira = NULL
             WHERE email = $1
             RETURNING *`,
            [email]
        );

        if (!resultado.rows[0]) {
            throw new Error('Usuário não encontrado');
        }

        return User.mapear(resultado.rows[0]);
    }

    static async atualizarCodigo(email, codigo, codigoExpira) {
        const resultado = await pool.query(
            `UPDATE usuarios
             SET codigo_confirmacao = $1, codigo_expira = $2
             WHERE email = $3
             RETURNING *`,
            [codigo, codigoExpira, email]
        );

        if (!resultado.rows[0]) {
            throw new Error('Usuário não encontrado');
        }

        return User.mapear(resultado.rows[0]);
    }

    static async atualizarFoto(id, foto) {
        return User.atualizar(id, { foto });
    }

    static async atualizar(id, { foto, descricao } = {}) {
        const atual = await User.buscarPorId(id);
        if (!atual) {
            throw new Error('Usuário não encontrado');
        }

        let proximaDescricao = atual.descricao || '';
        if (descricao !== undefined) {
            proximaDescricao = String(descricao).trim();
            if (proximaDescricao.length > User.DESCRICAO_MAX) {
                throw new Error(`A descrição pode ter no máximo ${User.DESCRICAO_MAX} caracteres`);
            }
        }

        const proximaFoto = foto !== undefined ? foto : atual.foto;

        const resultado = await pool.query(
            `UPDATE usuarios
             SET foto = $1, descricao = $2
             WHERE id = $3
             RETURNING *`,
            [proximaFoto, proximaDescricao, id]
        );

        return User.mapear(resultado.rows[0]);
    }

    static async deletar(id) {
        const usuario = await User.buscarPorId(id);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        if (User.ehCriador(usuario.email)) {
            throw new Error('O perfil do criador não pode ser excluído');
        }

        await pool.query('DELETE FROM edicoes WHERE usuario_id = $1', [id]);
        await pool.query('UPDATE topicos SET usuario_id = NULL WHERE usuario_id = $1', [id]);
        await pool.query('UPDATE dinossauros SET criado_por = NULL WHERE criado_por = $1', [id]);
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        return true;
    }
}

module.exports = User;
