const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Imagem = require('../models/Imagem');
const Pontos = require('../models/Pontos');
const { montarPerfil } = require('./userController');
const config = require('../config');
const { sendConfirmationEmail } = require('../config/email');

function gerarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function emitirSessao(usuario) {
    const token = jwt.sign({ id: usuario.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });

    return {
        token,
        usuario: User.publico(usuario)
    };
}

async function enviarCodigo(email, codigo, nome) {
    try {
        await sendConfirmationEmail(email, codigo, nome);
        return { enviado: true, erro: null };
    } catch (emailError) {
        console.log('='.repeat(50));
        console.log(`CÓDIGO DE CONFIRMAÇÃO PARA ${nome || email}: ${codigo}`);
        console.log('Erro Gmail:', emailError.message);
        console.log('='.repeat(50));
        return { enviado: false, erro: emailError.message };
    }
}

const register = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const { nome, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);
        const codigo = gerarCodigo();
        const codigoExpira = Date.now() + 600000;

        try {
            await User.criar({
                nome,
                email,
                senha: senhaCriptografada,
                confirmado: false,
                codigoConfirmacao: codigo,
                codigoExpira
            });
        } catch (erro) {
            if (erro.message !== 'Email já cadastrado') {
                throw erro;
            }

            const existente = await User.buscarPorEmail(email);
            if (!existente || existente.confirmado) {
                return res.status(400).json({ erro: 'Email já cadastrado. Entre com sua senha.' });
            }

            await User.atualizarCodigo(email, codigo, codigoExpira);
            enviarCodigo(email, codigo, existente.nome);
            return res.status(200).json({
                mensagem: `Olá, ${existente.nome}. Use o código na tela. Se o Gmail chegar, use o do e-mail.`,
                email,
                nome: existente.nome,
                emailEnviado: false,
                codigo
            });
        }

        enviarCodigo(email, codigo, nome);

        res.status(201).json({
            mensagem: `Olá, ${nome}. Use o código na tela. Se o Gmail chegar, use o do e-mail.`,
            email,
            nome,
            emailEnviado: false,
            codigo
        });
    } catch (erro) {
        const status = erro.message === 'Email já cadastrado' ? 400 : 500;
        res.status(status).json({ erro: erro.message || 'Erro ao criar DinoUsuário' });
    }
};

const login = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const { senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        const usuario = await User.buscarPorEmail(email);

        if (!usuario) {
            return res.status(404).json({ erro: 'DinoUsuário não encontrado' });
        }

        if (!usuario.confirmado) {
            return res.status(403).json({
                erro: 'Email não confirmado. Use o código enviado para confirmar.',
                email
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Senha incorreta' });
        }

        await Pontos.sincronizarUsuario(usuario.id);
        const atualizado = (await User.buscarPorId(usuario.id)) || usuario;

        res.json(emitirSessao(atualizado));
    } catch (erro) {
        console.error('Erro ao fazer login:', erro.message);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};

const confirmarEmail = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const { codigo } = req.body;

        const usuario = await User.buscarPorEmail(email);

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        if (usuario.confirmado) {
            return res.status(400).json({ erro: 'Email já confirmado' });
        }

        if (usuario.codigoConfirmacao !== codigo) {
            return res.status(400).json({ erro: 'Código incorreto' });
        }

        if (Date.now() > usuario.codigoExpira) {
            return res.status(400).json({ erro: 'Código expirado. Solicite novo código.' });
        }

        const confirmado = await User.confirmarEmail(email);
        await Pontos.ganhar(confirmado.id, 'confirmar', 'conta');
        const atualizado = await User.buscarPorId(confirmado.id);

        res.json({
            mensagem: 'Email confirmado com sucesso!',
            ...emitirSessao(atualizado)
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao confirmar email' });
    }
};

const reenviarCodigo = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ erro: 'Email é obrigatório' });
        }

        const usuario = await User.buscarPorEmail(email);

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        if (usuario.confirmado) {
            return res.status(400).json({ erro: 'Email já confirmado' });
        }

        const codigo = gerarCodigo();
        const codigoExpira = Date.now() + 600000;
        await User.atualizarCodigo(email, codigo, codigoExpira);
        enviarCodigo(email, codigo, usuario.nome);

        res.json({
            mensagem: `Use o código na tela. Se o Gmail chegar, use o do e-mail.`,
            email,
            nome: usuario.nome,
            emailEnviado: false,
            codigo
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao reenviar código' });
    }
};

const perfil = async (req, res) => {
    try {
        const usuario = await User.buscarPorId(req.usuarioId);

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        const dados = await montarPerfil(usuario, req.usuarioId, { comEmail: true });
        res.json(dados);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar perfil' });
    }
};

async function responderPerfil(res, usuario, mensagem) {
    const dados = await montarPerfil(usuario, usuario.id, { comEmail: true });
    res.json({
        mensagem,
        ...dados
    });
}

const atualizarPerfil = async (req, res) => {
    try {
        const temAvatar = Boolean(String(req.body.avatar || '').trim());
        const temDescricao = Object.prototype.hasOwnProperty.call(req.body, 'descricao');

        if (!temAvatar && !temDescricao) {
            return res.status(400).json({ erro: 'Envie um avatar ou uma descrição.' });
        }

        const dados = {};

        if (temAvatar) {
            const avatar = String(req.body.avatar).trim();
            if (!User.AVATARES_VALIDOS.includes(avatar)) {
                return res.status(400).json({ erro: 'Escolha um dos avatares de dinossauro.' });
            }
            dados.foto = `avatar:${avatar}`;
        }

        if (temDescricao) {
            dados.descricao = req.body.descricao;
        }

        const usuario = await User.atualizar(req.usuarioId, dados);
        await Pontos.completarPerfil(usuario);
        const mensagem = temDescricao && !temAvatar
            ? 'Descrição atualizada!'
            : 'Perfil atualizado!';
        await responderPerfil(res, usuario, mensagem);
    } catch (erro) {
        res.status(400).json({ erro: erro.message || 'Erro ao atualizar o perfil' });
    }
};

const uploadFotoPerfil = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
        }

        const caminhoFoto = await Imagem.persistirMulter(req.file);
        const atualizado = await User.atualizarFoto(req.usuarioId, caminhoFoto);
        await Pontos.completarPerfil(atualizado);
        const usuario = await User.buscarPorId(req.usuarioId);
        await responderPerfil(res, usuario, 'Foto de perfil enviada!');
    } catch (erro) {
        res.status(400).json({ erro: erro.message || 'Erro ao enviar a foto' });
    }
};

module.exports = {
    register,
    login,
    confirmarEmail,
    reenviarCodigo,
    perfil,
    atualizarPerfil,
    uploadFotoPerfil
};
