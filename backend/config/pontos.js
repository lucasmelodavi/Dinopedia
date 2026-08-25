const REGRAS = {
    confirmar: { pontos: 10, label: 'Confirmou a conta' },
    cadastro_dino: { pontos: 50, label: 'Cadastrou um dinossauro' },
    edicao_ficha: { pontos: 10, label: 'Editou uma ficha' },
    topico: { pontos: 20, label: 'Adicionou um tópico' },
    foto_dino: { pontos: 15, label: 'Enviou foto da ficha' },
    foto_perfil: { pontos: 10, label: 'Colocou foto ou avatar no perfil' },
    descricao_perfil: { pontos: 10, label: 'Escreveu a descrição do perfil' }
};

const NIVEIS = [
    { nome: 'Recruta', min: 0 },
    { nome: 'Explorador', min: 50 },
    { nome: 'Paleontólogo', min: 150 },
    { nome: 'Curador', min: 400 },
    { nome: 'Lenda do Mesozoico', min: 800 }
];

function resumir(total) {
    const pontos = Math.max(0, parseInt(total, 10) || 0);
    let atual = NIVEIS[0];

    NIVEIS.forEach((nivel) => {
        if (pontos >= nivel.min) {
            atual = nivel;
        }
    });

    const indice = NIVEIS.findIndex((nivel) => nivel.nome === atual.nome);
    const proximo = NIVEIS[indice + 1] || null;

    return {
        nome: atual.nome,
        min: atual.min,
        pontos,
        proximo: proximo ? { nome: proximo.nome, min: proximo.min } : null,
        faltam: proximo ? Math.max(0, proximo.min - pontos) : 0
    };
}

module.exports = { REGRAS, NIVEIS, resumir };
