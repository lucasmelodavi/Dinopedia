const Dinosaur = require('../models/Dinosaur');
const Topico = require('../models/Topico');
const Edicao = require('../models/Edicao');
const Imagem = require('../models/Imagem');

const CAMPOS_EDICAO = [
    'nome',
    'nomeCientifico',
    'periodo',
    'dieta',
    'familia',
    'descricao',
    'comprimento',
    'regiao',
    'foto',
    'anoDescoberta',
    'destaque'
];

function dadosDaFicha(body) {
    return {
        nome: body.nome,
        nomeCientifico: body.nomeCientifico,
        periodo: body.periodo,
        dieta: body.dieta,
        familia: body.familia,
        descricao: body.descricao,
        comprimento: body.comprimento,
        regiao: body.regiao,
        anoDescoberta: body.anoDescoberta,
        destaque: body.destaque
    };
}

async function fichaCompleta(id) {
    const dinossauro = await Dinosaur.buscarPorId(id);
    if (!dinossauro) return null;

    const [topicos, ultimaEdicao] = await Promise.all([
        Topico.listarPorDinossauro(id),
        Edicao.ultimaDoDinossauro(id)
    ]);

    return {
        ...dinossauro,
        topicos,
        ultimaEdicao
    };
}

const criarDinossauro = async (req, res) => {
    try {
        const novoDinossauro = await Dinosaur.criar({
            ...dadosDaFicha(req.body),
            usuarioId: req.usuarioId
        });

        res.status(201).json({
            mensagem: 'Dinossauro criado com sucesso!',
            dinossauro: novoDinossauro
        });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

const listarDinossauros = async (req, res) => {
    try {
        const dinossauros = await Dinosaur.buscarComFiltros(req.query);
        res.json(dinossauros);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar dinossauros' });
    }
};

const listarDestaques = async (req, res) => {
    try {
        const dinossauros = await Dinosaur.buscarComFiltros({
            ...req.query,
            destaque: 'true'
        });
        res.json(dinossauros);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar destaques' });
    }
};

const linhaDoTempo = async (req, res) => {
    try {
        const { PERIODOS } = require('../config/constants');
        const lista = await Dinosaur.buscarComFiltros({ limit: 1000, sort: 'nome' });

        res.json({
            periodos: PERIODOS.map((nome) => ({
                nome,
                dinossauros: lista.data.filter((dino) => dino.periodo === nome)
            }))
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao montar a linha do tempo' });
    }
};

const buscarDinossauro = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const dinossauro = await fichaCompleta(id);

        if (!dinossauro) {
            return res.status(404).json({ erro: 'Dinossauro não encontrado' });
        }

        res.json(dinossauro);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar dinossauro' });
    }
};

const atualizarDinossauro = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { anterior, atualizado } = await Dinosaur.atualizar(id, dadosDaFicha(req.body));

        await Edicao.registrarVarios(id, req.usuarioId, anterior, atualizado, CAMPOS_EDICAO);

        const dinossauro = await fichaCompleta(id);

        res.json({ mensagem: 'Dinossauro atualizado!', dinossauro });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

const deletarDinossauro = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await Dinosaur.deletar(id);
        res.json({ mensagem: 'Dinossauro extinto do DinoPédia!' });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

const uploadFoto = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
        }

        const caminhoFoto = await Imagem.persistirMulter(req.file);
        const { anterior, atualizado } = await Dinosaur.atualizar(id, { foto: caminhoFoto });

        await Edicao.registrar({
            dinossauroId: id,
            usuarioId: req.usuarioId,
            campo: 'foto',
            valorAntigo: anterior.foto,
            valorNovo: atualizado.foto
        });

        const dinossauro = await fichaCompleta(id);
        res.json({ mensagem: 'DinoFoto enviada!', dinossauro });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

const listarTopicos = async (req, res) => {
    try {
        const dinossauroId = parseInt(req.params.id, 10);
        const dinossauro = await Dinosaur.buscarPorId(dinossauroId);

        if (!dinossauro) {
            return res.status(404).json({ erro: 'Dinossauro não encontrado' });
        }

        const topicos = await Topico.listarPorDinossauro(dinossauroId);
        res.json(topicos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar tópicos' });
    }
};

const criarTopico = async (req, res) => {
    try {
        const dinossauroId = parseInt(req.params.id, 10);
        const dinossauro = await Dinosaur.buscarPorId(dinossauroId);

        if (!dinossauro) {
            return res.status(404).json({ erro: 'Dinossauro não encontrado' });
        }

        const topico = await Topico.criar({
            dinossauroId,
            categoria: req.body.categoria,
            texto: req.body.texto,
            usuarioId: req.usuarioId
        });

        await Edicao.registrar({
            dinossauroId,
            usuarioId: req.usuarioId,
            campo: 'topico',
            valorAntigo: null,
            valorNovo: `[${topico.categoria}] ${topico.texto}`
        });

        res.status(201).json({
            mensagem: 'Tópico adicionado!',
            topico
        });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

const atualizarTopico = async (req, res) => {
    try {
        const dinossauroId = parseInt(req.params.id, 10);
        const topicoId = parseInt(req.params.topicoId, 10);
        const atual = await Topico.buscarPorId(topicoId);

        if (!atual || atual.dinossauroId !== dinossauroId) {
            return res.status(404).json({ erro: 'Tópico não encontrado' });
        }

        const { anterior, atualizado } = await Topico.atualizar(topicoId, {
            categoria: req.body.categoria,
            texto: req.body.texto
        });

        await Edicao.registrar({
            dinossauroId,
            usuarioId: req.usuarioId,
            campo: 'topico',
            valorAntigo: `[${anterior.categoria}] ${anterior.texto}`,
            valorNovo: `[${atualizado.categoria}] ${atualizado.texto}`
        });

        res.json({ mensagem: 'Tópico atualizado!', topico: atualizado });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

const deletarTopico = async (req, res) => {
    try {
        const dinossauroId = parseInt(req.params.id, 10);
        const topicoId = parseInt(req.params.topicoId, 10);
        const atual = await Topico.buscarPorId(topicoId);

        if (!atual || atual.dinossauroId !== dinossauroId) {
            return res.status(404).json({ erro: 'Tópico não encontrado' });
        }

        const removido = await Topico.deletar(topicoId);

        await Edicao.registrar({
            dinossauroId,
            usuarioId: req.usuarioId,
            campo: 'topico',
            valorAntigo: `[${removido.categoria}] ${removido.texto}`,
            valorNovo: null
        });

        res.json({ mensagem: 'Tópico removido!' });
    } catch (erro) {
        res.status(400).json({ erro: erro.message });
    }
};

module.exports = {
    criarDinossauro,
    listarDinossauros,
    listarDestaques,
    linhaDoTempo,
    buscarDinossauro,
    atualizarDinossauro,
    deletarDinossauro,
    uploadFoto,
    listarTopicos,
    criarTopico,
    atualizarTopico,
    deletarTopico
};
