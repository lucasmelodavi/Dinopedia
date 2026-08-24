const User = require('../models/User');
const Follow = require('../models/Follow');
const Edicao = require('../models/Edicao');

async function montarPerfil(usuario, visitanteId, { comEmail = false } = {}) {
    const [edicoes, contagem, seguidores, seguindo] = await Promise.all([
        Edicao.listarPorUsuario(usuario.id),
        Follow.contar(usuario.id),
        Follow.listarSeguidores(usuario.id),
        Follow.listarSeguindo(usuario.id)
    ]);

    const visivel = comEmail ? User.publico(usuario) : User.visivel(usuario);
    const seguindoEste = visitanteId
        ? await Follow.estaSeguindo(visitanteId, usuario.id)
        : false;

    return {
        ...visivel,
        edicoes,
        seguidores,
        seguindo,
        estatisticas: {
            edicoes: edicoes.length,
            seguidores: contagem.seguidores,
            seguindo: contagem.seguindo
        },
        seguindoEste,
        eEu: Boolean(visitanteId && Number(visitanteId) === Number(usuario.id))
    };
}

const excluirUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const ator = await User.buscarPorId(req.usuarioId);

        if (!ator || !User.ehCriador(ator.email)) {
            return res.status(403).json({ erro: 'Só o criador pode excluir perfis.' });
        }

        await User.deletar(id);
        res.json({ mensagem: 'Perfil excluído.' });
    } catch (erro) {
        const status = erro.message === 'Usuário não encontrado' ? 404 : 400;
        res.status(status).json({ erro: erro.message });
    }
};

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await User.listarPublico({
            nome: req.query.nome,
            limit: req.query.limit
        });
        res.json({ data: usuarios });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
};

const buscarUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const usuario = await User.buscarPorId(id);

        if (!usuario || !usuario.confirmado) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        const perfil = await montarPerfil(usuario, req.usuarioId);
        res.json(perfil);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
};

const listarSeguidores = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const usuarios = await Follow.listarSeguidores(id);
        res.json({ data: usuarios });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar seguidores' });
    }
};

const listarSeguindo = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const usuarios = await Follow.listarSeguindo(id);
        res.json({ data: usuarios });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar quem a pessoa segue' });
    }
};

const seguir = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await Follow.seguir(req.usuarioId, id);
        const perfil = await montarPerfil(await User.buscarPorId(id), req.usuarioId);
        res.json({ mensagem: `Você passou a seguir ${perfil.nome}.`, ...perfil });
    } catch (erro) {
        const status = erro.message === 'Usuário não encontrado' ? 404 : 400;
        res.status(status).json({ erro: erro.message });
    }
};

const deixarDeSeguir = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await Follow.deixarDeSeguir(req.usuarioId, id);
        const usuario = await User.buscarPorId(id);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        const perfil = await montarPerfil(usuario, req.usuarioId);
        res.json({ mensagem: `Você deixou de seguir ${perfil.nome}.`, ...perfil });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

module.exports = {
    montarPerfil,
    listarUsuarios,
    buscarUsuario,
    listarSeguidores,
    listarSeguindo,
    seguir,
    deixarDeSeguir,
    excluirUsuario
};
