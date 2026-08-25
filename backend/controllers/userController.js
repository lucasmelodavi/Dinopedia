const User = require('../models/User');
const Follow = require('../models/Follow');
const Edicao = require('../models/Edicao');
const Pontos = require('../models/Pontos');

async function montarPerfil(usuario, visitanteId, { comEmail = false } = {}) {
    await Pontos.sincronizar();
    await Pontos.sincronizarUsuario(usuario.id);
    let atual = (await User.buscarPorId(usuario.id)) || usuario;
    await Pontos.completarPerfil(atual);
    atual = (await User.buscarPorId(usuario.id)) || atual;
    const [edicoes, contagem, seguidores, seguindo, historicoPontos] = await Promise.all([
        Edicao.listarPorUsuario(atual.id),
        Follow.contar(atual.id),
        Follow.listarSeguidores(atual.id),
        Follow.listarSeguindo(atual.id),
        Pontos.listarPorUsuario(atual.id)
    ]);

    const visivel = comEmail ? User.publico(atual) : User.visivel(atual);
    const seguindoEste = visitanteId
        ? await Follow.estaSeguindo(visitanteId, atual.id)
        : false;

    return {
        ...visivel,
        edicoes,
        seguidores,
        seguindo,
        historicoPontos,
        estatisticas: {
            edicoes: edicoes.length,
            seguidores: contagem.seguidores,
            seguindo: contagem.seguindo,
            pontos: visivel.pontos
        },
        seguindoEste,
        eEu: Boolean(visitanteId && Number(visitanteId) === Number(atual.id))
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

const ranking = async (req, res) => {
    try {
        const { REGRAS, NIVEIS } = require('../config/pontos');
        await Pontos.sincronizar();
        const data = await Pontos.ranking(req.query.limit);
        res.json({
            data,
            regras: Object.entries(REGRAS).map(([tipo, regra]) => ({
                tipo,
                pontos: regra.pontos,
                label: regra.label
            })),
            niveis: NIVEIS
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao montar o ranking' });
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
    ranking,
    buscarUsuario,
    listarSeguidores,
    listarSeguindo,
    seguir,
    deixarDeSeguir,
    excluirUsuario
};
